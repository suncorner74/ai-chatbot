import { FormEvent, useState } from 'react';

interface Props {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string, name?: string) => Promise<void>;
}

export default function AuthScreen({ onLogin, onRegister }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [planetPosition, setPlanetPosition] = useState({ x: 78, y: 12 });

  function startDraggingPlanet(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function movePlanet(event: React.PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    setPlanetPosition({
      x: Math.min(92, Math.max(8, (event.clientX / window.innerWidth) * 100)),
      y: Math.min(78, Math.max(6, (event.clientY / window.innerHeight) * 100)),
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'login') await onLogin(email, password);
      else await onRegister(email, password, name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to authenticate.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-screen">
      <div className="auth-scene" aria-hidden="true">
        <div className="auth-scene-glow auth-scene-glow--one" />
        <div className="auth-scene-glow auth-scene-glow--two" />
        <div className="auth-scene-stars" />
        <div className="auth-scene-planet" style={{ left: `${planetPosition.x}%`, top: `${planetPosition.y}%` }} onPointerDown={startDraggingPlanet} onPointerMove={movePlanet} role="button" tabIndex={0} aria-label="Drag the planet" title="Drag planet">
          <span className="auth-planet-ring" />
        </div>
        <div className="auth-scene-moon" />
        <div className="auth-scene-horizon" />
        <span className="auth-scene-shooting-star auth-scene-shooting-star--one" />
        <span className="auth-scene-shooting-star auth-scene-shooting-star--two" />
        <div className="auth-scene-prism"><span className="auth-prism-face auth-prism-face--front" /><span className="auth-prism-face auth-prism-face--side" /><span className="auth-prism-face auth-prism-face--top" /></div>
        <div className="auth-scene-spotlight" />
        <div className="auth-scene-depth-lines" />
        <span className="auth-scene-shard auth-scene-shard--one" />
        <span className="auth-scene-shard auth-scene-shard--two" />
        <span className="auth-scene-shard auth-scene-shard--three" />
        <span className="auth-scene-star auth-scene-star--one" />
        <span className="auth-scene-star auth-scene-star--two" />
        <span className="auth-scene-star auth-scene-star--three" />
        <span className="auth-scene-dust auth-scene-dust--one" />
        <span className="auth-scene-dust auth-scene-dust--two" />
        <span className="auth-scene-dust auth-scene-dust--three" />
      </div>
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-brand"><img src="/sunvix-logo.svg" alt="" /><span>SUNVIX AI</span><i /></div>
        <h1>Welcome to Sunvix AI</h1>
        <p>{mode === 'login' ? 'Sign in to continue chatting.' : 'Create your account to get started.'}</p>
        {mode === 'register' && (
          <input aria-label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" maxLength={100} />
        )}
        <input aria-label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required autoComplete="email" />
        <input aria-label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (8+ characters)" minLength={8} maxLength={128} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
        {error && <p role="alert" className="auth-error">{error}</p>}
        <button type="submit" disabled={submitting}>{submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
        <button type="button" className="auth-switch" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}>
          {mode === 'login' ? 'Create an account' : 'Already have an account? Sign in'}
        </button>
      </form>
    </main>
  );
}
