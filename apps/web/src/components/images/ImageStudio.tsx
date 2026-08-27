import { DragEvent, useEffect, useRef, useState } from 'react';
import './image-studio.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const MAX_BYTES = 10 * 1024 * 1024;
const COMPRESS_THRESHOLD = 6 * 1024 * 1024;

type Operation = 'generate' | 'edit' | 'enhance';

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read image.'));
    reader.readAsDataURL(file);
  });
}

async function prepareImage(file: File): Promise<{ mimeType: string; data: string }> {
  if (file.size <= COMPRESS_THRESHOLD) {
    const dataUrl = await readAsDataUrl(file);
    return { mimeType: file.type, data: dataUrl.split(',')[1] || '' };
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Unable to decode image.'));
    });

    const maxDimension = 2048;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    return { mimeType: 'image/jpeg', data: dataUrl.split(',')[1] || '' };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function ImageStudio() {
  const [operation, setOperation] = useState<Operation>('generate');
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
    abortRef.current?.abort();
  }, [preview]);

  const chooseFile = (selected?: File) => {
    if (!selected) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(selected.type)) {
      setError('Please select a PNG, JPG or WebP image.');
      return;
    }
    if (selected.size > MAX_BYTES) {
      setError('Image must be 10 MB or smaller.');
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null);
    setError(null);
  };

  const onDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  };

  const submit = async () => {
    if (operation !== 'generate' && !file) {
      setError('Upload an image first.');
      return;
    }
    if (!prompt.trim() && operation !== 'enhance') {
      setError('Describe what you want to create or change.');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const image = file ? await prepareImage(file) : undefined;
      const response = await fetch(`${API_URL}/api/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: controller.signal,
        body: JSON.stringify({ operation, prompt: prompt.trim(), image }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error?.message || data.error || 'Image generation failed.');
      if (!data.imageDataUrl) throw new Error('Image provider returned no image.');
      setResult(data.imageDataUrl);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Image generation failed.');
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setLoading(false);
    }
  };

  return (
    <section className="image-studio" aria-labelledby="image-studio-title">
      <header>
        <p className="eyebrow">SUNVIX AI</p>
        <h1 id="image-studio-title">Image Studio</h1>
        <p>Create, edit and enhance images with AI.</p>
      </header>
      <div className="image-tabs" role="tablist" aria-label="Image operation">
        {(['generate', 'edit', 'enhance'] as Operation[]).map((item) => (
          <button key={item} type="button" className={operation === item ? 'active' : ''} onClick={() => { setOperation(item); setError(null); }} role="tab" aria-selected={operation === item}>
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>
      <div className="image-studio-grid">
        <div className="image-panel">
          {operation !== 'generate' && (
            <button className={`image-dropzone${dragging ? ' dragging' : ''}`} type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
              <input ref={inputRef} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => chooseFile(event.target.files?.[0])} />
              {preview ? <img src={preview} alt="Selected source" /> : <><span className="image-drop-icon">＋</span><strong>Upload or drop an image</strong><small>PNG, JPG or WebP · up to 10 MB</small></>}
            </button>
          )}
          <label className="image-label" htmlFor="image-prompt">Prompt</label>
          <textarea id="image-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder={operation === 'enhance' ? 'Optional: describe the enhancement...' : 'Describe the image you want...'} rows={5} maxLength={2000} />
          <div className="image-actions">
            <button className="image-generate-button" type="button" disabled={loading} onClick={() => void submit()}>{loading ? 'Generating…' : operation === 'generate' ? 'Generate image' : operation === 'edit' ? 'Edit image' : 'Enhance image'}</button>
            {loading && <button className="image-cancel-button" type="button" onClick={() => abortRef.current?.abort()}>Cancel</button>}
          </div>
          {error && <p className="image-error" role="alert">{error}</p>}
        </div>
        <div className="image-result-panel" aria-live="polite">
          {result ? <img src={result} alt="AI generated result" /> : <div className="image-empty"><span>✦</span><p>{loading ? 'Creating your image…' : 'Your result will appear here'}</p><small>Optimized for fast AI image generation and editing</small></div>}
        </div>
      </div>
    </section>
  );
}
