import { Navigate } from "react-router-dom";
import { Spinner } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";

// Gate for protected pages: wait for hydration, then require a user.
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size={28} className="animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
