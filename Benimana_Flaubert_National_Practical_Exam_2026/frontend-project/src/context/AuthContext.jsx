import { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "@/api/authAPI";

const AuthContext = createContext(null);

// Provides the current user + login/logout/register to the whole app.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, ask the server who we are (hydrates the session).
  useEffect(() => {
    authAPI
      .me()
      .then((res) => setUser(res.data.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(credentials) {
    const res = await authAPI.login(credentials);
    setUser(res.data.data.user);
    return res.data.data.user;
  }

  async function register(body) {
    // No session is started — the new account is 'pending' until an admin
    // approves it, so we do NOT set the user here.
    const res = await authAPI.register(body);
    return res.data.data; // { user, recoveryCode, pending, message }
  }

  async function logout() {
    await authAPI.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
