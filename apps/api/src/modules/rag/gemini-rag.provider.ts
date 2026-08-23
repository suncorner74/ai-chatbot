import { env } from '../../config/env';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
async function geminiRequest(model: string, body: unknown): Promise<any> { if (!env.geminiApiKey) throw new Error('GEMINI_API_KEY_NOT_CONFIGURED'); const response = await fetch(`${API_BASE}/${model}:generateContent?key=${encodeURIComponent(env.geminiApiKey)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); if (!response.ok) throw new Error(`GEMINI_RAG_REQUEST_FAILED_${response.status}`); return response.json(); }
export class GeminiRagProvider {
  async extractDocument(buffer: Buffer, mimeType: string, fileName: string): Promise<string> {
    const base64 = buffer.toString('base64');
    const prompt = ['Extract the document faithfully for enterprise RAG ingestion.', 'Preserve headings, paragraphs, numbered/bulleted lists, tables with row/column relationships, captions, page boundaries when visible, and meaningful diagram/chart descriptions.', 'Do not summarize. Do not invent missing information.', `Filename: ${fileName}`, 'Return structured text with headings and tables represented losslessly enough for retrieval.'].join('\n');
    const result = await geminiRequest(env.geminiModel, { contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType, data: base64 } }] }], generationConfig: { temperature: 0 } });
    const text = result?.candidates?.[0]?.content?.parts?.map((part: any) => part.text || '').join('')?.trim(); if (!text) throw new Error('DOCUMENT_EXTRACTION_EMPTY'); return text;
  }
  async embed(text: string, taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY' = 'RETRIEVAL_DOCUMENT', title?: string): Promise<number[]> {
    if (!env.geminiApiKey) throw new Error('GEMINI_API_KEY_NOT_CONFIGURED');
    const model = env.ragEmbeddingModel;
    const body: Record<string, unknown> = {
      model: `models/${model}`,
      content: { parts: [{ text }] },
      taskType,
      ...(title ? { title } : {}),
    };
    if (env.ragEmbeddingDimensions && env.ragEmbeddingDimensions > 0) {
      body.outputDimensionality = env.ragEmbeddingDimensions;
    }
    const response = await fetch(`${API_BASE}/${model}:embedContent?key=${encodeURIComponent(env.geminiApiKey)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`GEMINI_EMBEDDING_FAILED_${response.status}`);
    const result: any = await response.json();
    const values = result?.embedding?.values;
    if (!Array.isArray(values)) throw new Error('GEMINI_EMBEDDING_EMPTY');
    return values;
  }
  async rewriteQuery(question: string, history: Array<{ role: string; content: string }>): Promise<string> { if (!history.length) return question; const recent = history.slice(-8).map((message) => `${message.role}: ${message.content}`).join('\n'); const result = await geminiRequest(env.geminiModel, { contents: [{ parts: [{ text: `Rewrite the user's latest question into one self-contained enterprise-document search query. Use conversation context only to resolve ambiguity. Return only the rewritten query.\nConversation:\n${recent}\nLatest question: ${question}` }] }], generationConfig: { temperature: 0 } }); return result?.candidates?.[0]?.content?.parts?.map((part: any) => part.text || '').join('').trim() || question; }
  async decomposeQuery(question: string): Promise<string[]> { const result = await geminiRequest(env.geminiModel, { contents: [{ parts: [{ text: `Decide whether this question requires multiple independent evidence searches. If yes, return one concise sub-question per line. If no, return the original question only. No numbering.\nQuestion: ${question}` }] }], generationConfig: { temperature: 0 } }); const text = result?.candidates?.[0]?.content?.parts?.map((part: any) => part.text || '').join('').trim() || question; return text.split('\n').map((line: string) => line.replace(/^[-*\d.)]+\s*/, '').trim()).filter(Boolean).slice(0, 6); }
}
