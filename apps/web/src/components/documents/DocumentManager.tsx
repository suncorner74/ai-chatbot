import { useEffect, useRef, useState } from 'react';
import { createKnowledgeBase, deleteDocument, listDocuments, listKnowledgeBases, uploadDocument, DocumentItem, KnowledgeBase } from '../../services/documentService';
import './DocumentManager.css';

interface Props { onChatWithDocument?: (documentId: string) => void; }

export default function DocumentManager({ onChatWithDocument }: Props) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKb, setSelectedKb] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    const [docs, kbs] = await Promise.all([listDocuments(), listKnowledgeBases()]);
    setDocuments(docs.documents); setKnowledgeBases(kbs.knowledgeBases);
  };
  useEffect(() => { void refresh().catch((err) => setError(err instanceof Error ? err.message : 'Unable to load documents.')); }, []);

  const upload = async (file: File) => {
    setBusy(true); setError('');
    try {
      const result = await uploadDocument(file, selectedKb || undefined);
      if (result.duplicate) setError('This document already exists.');
      await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Upload failed.'); }
    finally { setBusy(false); }
  };

  const createKb = async () => {
    const name = window.prompt('Knowledge base name');
    if (!name?.trim()) return;
    try { const result = await createKnowledgeBase(name.trim()); setKnowledgeBases((items) => [...items, result.knowledgeBase]); setSelectedKb(result.knowledgeBase.id); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to create knowledge base.'); }
  };

  return <section className="document-manager">
    <header className="document-manager__header"><div><h2>Knowledge & Documents</h2><p>Upload private documents for grounded Gemini answers.</p></div><div className="document-manager__actions"><button type="button" onClick={() => void createKb()}>+ Knowledge Base</button><button type="button" disabled={busy} onClick={() => inputRef.current?.click()}>+ Upload</button></div></header>
    <input ref={inputRef} hidden type="file" accept=".pdf,.docx,.txt,.md,.csv,.pptx,.png,.jpg,.jpeg,.webp" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void upload(file); }} />
    <label className="document-manager__select">Knowledge Base<select value={selectedKb} onChange={(event) => setSelectedKb(event.target.value)}><option value="">All Documents</option>{knowledgeBases.map((kb) => <option key={kb.id} value={kb.id}>{kb.name}</option>)}</select></label>
    {error && <div className="document-manager__error">{error}</div>}
    <div className="document-list">{documents.length === 0 ? <p className="document-empty">No documents yet.</p> : documents.map((doc) => <article className="document-card" key={doc.id}><div className="document-card__icon">📄</div><div className="document-card__main"><strong>{doc.name}</strong><span>{doc.mimeType.split('/').pop()?.toUpperCase()} · {(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB · {doc.chunkCount} chunks</span><small>{doc.status === 'READY' ? '✓ Ready' : doc.status === 'FAILED' ? `✕ ${doc.processingError || 'Processing failed'}` : `◌ ${doc.status.toLowerCase()}`}</small></div><div className="document-card__actions">{doc.status === 'READY' && <button type="button" onClick={() => onChatWithDocument?.(doc.id)}>Chat</button>}<button type="button" onClick={() => void deleteDocument(doc.id).then(refresh).catch((err) => setError(err instanceof Error ? err.message : 'Delete failed.'))}>Delete</button></div></article>)}</div>
  </section>;
}
