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
      <form className="auth-card" onSubmit={submit}>
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
