import { cosineSimilarity, keywordScore, sha256 } from './rag.utils';

describe('rag utils', () => {
  it('produces stable SHA-256 content hashes', () => {
    expect(sha256('hello')).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
    expect(sha256('hello')).toBe(sha256(Buffer.from('hello')));
  });
  it('calculates cosine similarity', () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
    expect(cosineSimilarity([1], [1, 0])).toBe(0);
  });
  it('scores exact keyword overlap', () => {
    expect(keywordScore('leave policy', 'The employee leave policy is 30 days')).toBe(1);
    expect(keywordScore('leave policy', 'Revenue and finance')).toBe(0);
  });
});
