import { Toaster as SonnerToaster } from 'sonner';

// Single global toaster mounted at the app root (App.jsx); styled with the app tokens.
function Toaster(props) {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-accent)',
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
