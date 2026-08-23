export interface DocumentItem {
  id: string; name: string; mimeType: string; sizeBytes: number; status: 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED'; processingError: string | null; chunkCount: number; documentVersion: number; createdAt: string; updatedAt: string;
}
export interface KnowledgeBase { id: string; name: string; description: string | null; _count?: { documents: number }; }
const API_URL = import.meta.env.PROD ? '' : import.meta.env.VITE_API_URL;

async function parse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    throw new Error(body?.error?.message || 'Request failed.');
  }
  return response.status === 204 ? (undefined as T) : response.json() as Promise<T>;
}

export async function listDocuments() { return parse<{ documents: DocumentItem[] }>(await fetch(`${API_URL}/api/documents`, { credentials: 'include' })); }
export async function listKnowledgeBases() { return parse<{ knowledgeBases: KnowledgeBase[] }>(await fetch(`${API_URL}/api/documents/knowledge-bases`, { credentials: 'include' })); }
export async function createKnowledgeBase(name: string) { return parse<{ knowledgeBase: KnowledgeBase }>(await fetch(`${API_URL}/api/documents/knowledge-bases`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })); }
export async function deleteDocument(id: string) { return parse<void>(await fetch(`${API_URL}/api/documents/${id}`, { method: 'DELETE', credentials: 'include' })); }
export async function uploadDocument(file: File, knowledgeBaseId?: string) {
  const query = knowledgeBaseId ? `?knowledgeBaseId=${encodeURIComponent(knowledgeBaseId)}` : '';
  return parse<{ duplicate: boolean; document: DocumentItem }>(await fetch(`${API_URL}/api/documents${query}`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-Filename': encodeURIComponent(file.name) }, body: file }));
}
