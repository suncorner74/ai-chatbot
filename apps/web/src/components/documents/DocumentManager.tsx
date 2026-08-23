import { useEffect, useRef, useState, DragEvent } from 'react';
import {
  createKnowledgeBase,
  deleteDocument,
  listDocuments,
  listKnowledgeBases,
  uploadDocument,
  DocumentItem,
  KnowledgeBase,
} from '../../services/documentService';
import './DocumentManager.css';

interface Props {
  onChatWithDocument?: (documentId: string) => void;
  onChatWithKnowledgeBase?: (knowledgeBaseId: string) => void;
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB limit

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileBadge(mimeType: string, filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf' || mimeType.includes('pdf')) return { label: 'PDF', color: '#ef4444', icon: '📄' };
  if (ext === 'docx' || ext === 'doc' || mimeType.includes('word')) return { label: 'DOCX', color: '#3b82f6', icon: '📝' };
  if (ext === 'csv' || mimeType.includes('csv')) return { label: 'CSV', color: '#10b981', icon: '📊' };
  if (ext === 'md' || ext === 'txt' || mimeType.includes('text') || mimeType.includes('markdown')) return { label: 'TXT', color: '#8b5cf6', icon: '📃' };
  if (ext === 'pptx' || mimeType.includes('presentation')) return { label: 'PPTX', color: '#f59e0b', icon: '📑' };
  if (mimeType.startsWith('image/')) return { label: 'IMG', color: '#ec4899', icon: '🖼️' };
  return { label: ext.toUpperCase() || 'FILE', color: '#6b7280', icon: '📁' };
}

export default function DocumentManager({ onChatWithDocument, onChatWithKnowledgeBase }: Props) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKb, setSelectedKb] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousStatusesRef = useRef<Map<string, string>>(new Map());

  const refresh = async () => {
    try {
      const [docs, kbs] = await Promise.all([listDocuments(), listKnowledgeBases()]);
      const prevMap = previousStatusesRef.current;

      // Detect status transitions
      docs.documents.forEach((doc) => {
        const prevStatus = prevMap.get(doc.id);
        if (prevStatus && prevStatus !== 'READY' && doc.status === 'READY') {
          setSuccessMessage(`🎉 "${doc.name}" is READY! Successfully indexed ${doc.chunkCount} chunks with Gemini embeddings.`);
        } else if (prevStatus && prevStatus !== 'FAILED' && doc.status === 'FAILED') {
          setError(`❌ Processing failed for "${doc.name}": ${doc.processingError || 'Failed to extract content'}`);
        }
        prevMap.set(doc.id, doc.status);
      });

      setDocuments(docs.documents);
      setKnowledgeBases(kbs.knowledgeBases);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load documents.');
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  // Poll every 1.5s whenever any document is currently in PROCESSING or UPLOADING state
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === 'PROCESSING' || d.status === 'UPLOADING');
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      void refresh();
    }, 1500);

    return () => clearInterval(interval);
  }, [documents]);

  const upload = async (file: File) => {
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`"${file.name}" is too large. Maximum file size is 10 MB.`);
      return;
    }
    setBusy(true);
    setError('');
    setSuccessMessage('');
    try {
      const result = await uploadDocument(file, selectedKb || undefined);
      if (result.duplicate) {
        setSuccessMessage(`Document "${file.name}" already exists and is ready for chat.`);
      } else {
        setSuccessMessage(`"${file.name}" uploaded. Processing chunks and embeddings...`);
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      void upload(files[0]);
    }
  };

  const createKb = async () => {
    const name = window.prompt('Enter Knowledge Base name (e.g. HR Policies, Product Architecture):');
    if (!name?.trim()) return;
    try {
      const result = await createKnowledgeBase(name.trim());
      setKnowledgeBases((items) => [...items, result.knowledgeBase]);
      setSelectedKb(result.knowledgeBase.id);
      setSuccessMessage(`Knowledge Base "${result.knowledgeBase.name}" created.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create knowledge base.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This will remove all chunks and embeddings.`)) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteDocument(id);
      await refresh();
      setSuccessMessage(`Document "${name}" deleted.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setDeletingId(null);
    }
  };

  const totalChunks = documents.reduce((acc, doc) => acc + (doc.chunkCount || 0), 0);
  const readyDocs = documents.filter((d) => d.status === 'READY').length;

  return (
    <section className="doc-manager">
      <div className="doc-manager__container">
        {/* Top Header Card */}
        <header className="doc-manager__header">
          <div className="doc-manager__title-group">
            <div className="doc-manager__badge">Enterprise Knowledge Hub</div>
            <h2>Knowledge & Documents</h2>
            <p>Upload private documents for grounded, citation-backed Gemini answers.</p>
          </div>
          <div className="doc-manager__actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => void createKb()}
            >
              <span className="btn__icon">📁</span>
              + New Knowledge Base
            </button>
            <button
              type="button"
              className="btn btn--primary"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              <span className="btn__icon">{busy ? '⟳' : '⬆'}</span>
              {busy ? 'Processing...' : 'Upload Document'}
            </button>
          </div>
        </header>

        <input
          ref={inputRef}
          hidden
          type="file"
          accept=".pdf,.docx,.txt,.md,.csv,.pptx,.png,.jpg,.jpeg,.webp"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void upload(file);
          }}
        />

        {/* Status / Alert Banners */}
        {error && (
          <div className="doc-manager__alert doc-manager__alert--error">
            <span className="alert-icon">⚠️</span>
            <div className="alert-content">{error}</div>
            <button type="button" className="alert-close" onClick={() => setError('')}>✕</button>
          </div>
        )}

        {successMessage && (
          <div className="doc-manager__alert doc-manager__alert--success">
            <span className="alert-icon">✓</span>
            <div className="alert-content">{successMessage}</div>
            <button type="button" className="alert-close" onClick={() => setSuccessMessage('')}>✕</button>
          </div>
        )}

        {/* Stats & Filters Bar */}
        <div className="doc-manager__toolbar">
          <div className="doc-manager__filter">
            <label htmlFor="kb-select" className="filter-label">
              <span className="filter-icon">🗂️</span> Knowledge Base:
            </label>
            <select
              id="kb-select"
              className="doc-select"
              value={selectedKb}
              onChange={(event) => setSelectedKb(event.target.value)}
            >
              <option value="">All Documents ({documents.length})</option>
              {knowledgeBases.map((kb) => (
                <option key={kb.id} value={kb.id}>
                  {kb.name} {kb._count?.documents ? `(${kb._count.documents})` : ''}
                </option>
              ))}
            </select>
            {selectedKb && (
              <button
                type="button"
                className="btn btn--highlight btn--sm"
                onClick={() => onChatWithKnowledgeBase?.(selectedKb)}
              >
                💬 Chat with this KB
              </button>
            )}
          </div>

          <div className="doc-manager__stats">
            <span className="stat-pill"><strong>{readyDocs}</strong> Ready</span>
            <span className="stat-pill"><strong>{totalChunks}</strong> Total Chunks</span>
          </div>
        </div>

        {/* Drag & Drop Zone */}
        <div
          className={`doc-dropzone ${isDragging ? 'doc-dropzone--active' : ''} ${busy ? 'doc-dropzone--busy' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !busy && inputRef.current?.click()}
        >
          <div className="dropzone-icon">{busy ? '⟳' : '☁️'}</div>
          <div className="dropzone-text">
            <strong>{busy ? 'Parsing and embedding document...' : 'Click or drag & drop documents here'}</strong>
            <p>Supports PDF, DOCX, Markdown, Text, CSV, PPTX, and Images (Up to 10 MB)</p>
          </div>
          <div className="dropzone-formats">
            <span className="format-tag">PDF</span>
            <span className="format-tag">DOCX</span>
            <span className="format-tag">MD</span>
            <span className="format-tag">CSV</span>
            <span className="format-tag">PPTX</span>
          </div>
        </div>

        {/* Documents Grid / Empty State */}
        <div className="doc-section">
          <div className="doc-section__header">
            <h3>Indexed Documents</h3>
            <span className="doc-count">{documents.length} files</span>
          </div>

          {documents.length === 0 ? (
            <div className="doc-empty">
              <div className="doc-empty__icon">📚</div>
              <h4>No documents uploaded yet</h4>
              <p>Upload enterprise documentation, policies, or technical guides to ground Gemini with precise citations.</p>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => inputRef.current?.click()}
              >
                ⬆ Upload Your First Document
              </button>
            </div>
          ) : (
            <div className="doc-grid">
              {documents.map((doc) => {
                const badge = getFileBadge(doc.mimeType, doc.name);
                const isDeleting = deletingId === doc.id;
                return (
                  <article className={`doc-card doc-card--${doc.status.toLowerCase()}`} key={doc.id}>
                    <div className="doc-card__top">
                      <div className="doc-card__type-badge" style={{ backgroundColor: `${badge.color}22`, color: badge.color, borderColor: `${badge.color}44` }}>
                        <span className="type-icon">{badge.icon}</span>
                        <span>{badge.label}</span>
                      </div>
                      <div className={`doc-card__status doc-card__status--${doc.status.toLowerCase()}`}>
                        <span className="status-dot" />
                        <span>
                          {doc.status === 'READY'
                            ? 'Ready'
                            : doc.status === 'FAILED'
                            ? 'Failed'
                            : 'Processing...'}
                        </span>
                      </div>
                    </div>

                    <div className="doc-card__body">
                      <h4 className="doc-card__name" title={doc.name}>
                        {doc.name}
                      </h4>
                      <div className="doc-card__meta">
                        <span>{formatBytes(doc.sizeBytes)}</span>
                        <span className="meta-separator">•</span>
                        <span>{doc.chunkCount} chunks</span>
                        <span className="meta-separator">•</span>
                        <span>v{doc.documentVersion}</span>
                      </div>
                      {doc.status === 'FAILED' && doc.processingError && (
                        <div className="doc-card__error" title={doc.processingError}>
                          ✕ {doc.processingError}
                        </div>
                      )}
                    </div>

                    <div className="doc-card__footer">
                      {doc.status === 'READY' ? (
                        <button
                          type="button"
                          className="btn btn--chat btn--sm"
                          onClick={() => onChatWithDocument?.(doc.id)}
                        >
                          💬 Chat with Doc
                        </button>
                      ) : (
                        <div />
                      )}
                      <button
                        type="button"
                        className="btn btn--delete btn--sm"
                        disabled={isDeleting}
                        onClick={() => void handleDelete(doc.id, doc.name)}
                        title="Delete document and embeddings"
                      >
                        {isDeleting ? '...' : '🗑️'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
