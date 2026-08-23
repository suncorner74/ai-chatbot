import { DocumentService } from './document.service';

describe('DocumentService validation', () => {
  const service = new DocumentService();
  it('accepts supported document types', () => {
    expect(() => service.validate('policy.pdf', 'application/pdf', 100)).not.toThrow();
    expect(() => service.validate('notes.md', 'text/markdown', 100)).not.toThrow();
    expect(() => service.validate('table.csv', 'text/csv', 100)).not.toThrow();
    expect(() => service.validate('deck.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 100)).not.toThrow();
  });
  it('rejects unsupported types and oversized files', () => {
    expect(() => service.validate('script.exe', 'application/octet-stream', 100)).toThrow('UNSUPPORTED_DOCUMENT_TYPE');
    expect(() => service.validate('huge.pdf', 'application/pdf', 50 * 1024 * 1024)).toThrow('DOCUMENT_TOO_LARGE');
    expect(() => service.validate('', 'application/pdf', 100)).toThrow('INVALID_DOCUMENT_NAME');
  });
});
