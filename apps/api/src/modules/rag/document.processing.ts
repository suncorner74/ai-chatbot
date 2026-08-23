import { DocumentProcessor } from './document.processor';
export interface DocumentProcessingQueue { enqueue(documentId: string, buffer: Buffer): Promise<void>; }
export class InlineDocumentProcessingQueue implements DocumentProcessingQueue {
  constructor(private readonly processor = new DocumentProcessor()) {}
  async enqueue(documentId: string, buffer: Buffer): Promise<void> { void this.processor.process(documentId, buffer); }
}
