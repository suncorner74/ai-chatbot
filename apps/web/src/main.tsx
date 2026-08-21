import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * main.tsx — the entry point for the React application.
 *
 * WHAT HAPPENS HERE:
 * 1. We find the <div id="root"> in index.html
 * 2. We create a React root inside it
 * 3. We render our App component into that root
 *
 * From this point, React controls everything inside #root.
 *
 * ABOUT StrictMode:
 * In development, StrictMode intentionally renders components TWICE
 * to help detect side effects that run when they shouldn't.
 * If your useEffect runs twice, this is why — and it's a feature.
 * StrictMode has no effect in production builds.
 */
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'Could not find #root element. Check that index.html has <div id="root">.'
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
