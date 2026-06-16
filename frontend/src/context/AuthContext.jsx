import { createContext, useContext, useState, useEffect } from "react";
import { api, setAccessToken, getAccessToken } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchUser() {
    try {
      const data = await api("/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
      setAccessToken(null);
    }
  }

  useEffect(() => {
    async function init() {
      // 1. If we don't have a token, try to refresh
      if (!getAccessToken()) {
        try {
          const data = await api("/auth/refresh", { method: "POST" });
          if (data?.accessToken) {
            setAccessToken(data.accessToken);
          }
        } catch {
          // No active session — stop here, don't call /auth/me
          console.log("No active session found.");
          setLoading(false);
          return;
        }
      }

      // 2. Only runs if we have a valid token
      await fetchUser();
      setLoading(false);
    }
    init();
  }, []);

  async function login(email, password) {
    const data = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }

  async function register(email, password) {
    const data = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }

  async function logout() {
    await api("/auth/logout", { method: "POST" });
    setAccessToken(null);
    setUser(null);
  }

  async function setTokenFromOAuth(token) {
    setAccessToken(token);
    await fetchUser();
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, setTokenFromOAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}