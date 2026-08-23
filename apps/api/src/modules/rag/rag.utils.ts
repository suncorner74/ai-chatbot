import crypto from 'node:crypto';

export function sha256(input: Buffer | string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || a.length !== b.length) return 0;
  let dot = 0;
  let aa = 0;
  let bb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    aa += a[i] * a[i];
    bb += b[i] * b[i];
  }
  if (!aa || !bb) return 0;
  return dot / (Math.sqrt(aa) * Math.sqrt(bb));
}

export function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^\p{L}\p{N}_-]+/gu, ' ').split(/\s+/).filter((token) => token.length > 1);
}

export function keywordScore(query: string, content: string): number {
  const queryTerms = new Set(tokenize(query));
  if (!queryTerms.size) return 0;
  const contentTerms = new Set(tokenize(content));
  let hits = 0;
  for (const term of queryTerms) if (contentTerms.has(term)) hits += 1;
  return hits / queryTerms.size;
}
