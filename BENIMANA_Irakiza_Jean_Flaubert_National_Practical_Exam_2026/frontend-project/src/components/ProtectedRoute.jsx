import { Navigate } from 'react-router-dom';
import { CircleNotch } from '@phosphor-icons/react';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/lib/constants';

// Reads auth state from context; redirects to /login when there is no user.
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <CircleNotch size={36} className="animate-spin text-[var(--color-accent)]" />
      </div>
    );
  }

  if (!user) return <Navigate to={ROUTES.login} replace />;
  return children;
}
