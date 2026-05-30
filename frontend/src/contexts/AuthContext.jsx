import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { extractApiError } from "../lib/http";

const TOKEN_STORAGE_KEY = "blog-platform-token";
const USER_STORAGE_KEY = "blog-platform-user";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || "");
  const [user, setUser] = useState(() => readStoredUser());
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const handleExpiry = () => {
      logout();
      window.location.assign("/login");
    };

    window.addEventListener("auth:expired", handleExpiry);
    return () => window.removeEventListener("auth:expired", handleExpiry);
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user]);

  async function login(credentials) {
    setAuthLoading(true);
    try {
      const data = await api.login(credentials);
      const nextUser = {
        username: credentials.username,
        isAdmin: Boolean(data.isAdmin ?? data.admin)
      };
      setToken(data.token);
      setUser(nextUser);
      return nextUser;
    } catch (error) {
      throw new Error(extractApiError(error, "Login failed."));
    } finally {
      setAuthLoading(false);
    }
  }

  async function register(payload) {
    setAuthLoading(true);
    try {
      return await api.register(payload);
    } catch (error) {
      throw new Error(extractApiError(error, "Registration failed."));
    } finally {
      setAuthLoading(false);
    }
  }

  async function refreshUser() {
    if (!token) return null;

    setAuthLoading(true);
    try {
      const data = await api.currentUser();
      const nextUser = {
        username: data.username,
        isAdmin: Boolean(data.isAdmin ?? data.admin)
      };
      setUser(nextUser);
      return nextUser;
    } catch (error) {
      throw new Error(extractApiError(error, "Failed to refresh user."));
    } finally {
      setAuthLoading(false);
    }
  }

  async function logoutEverywhere() {
    setAuthLoading(true);
    try {
      await api.logoutAll();
    } catch (error) {
      throw new Error(extractApiError(error, "Logout failed."));
    } finally {
      logout();
      setAuthLoading(false);
    }
  }

  function logout() {
    setToken("");
    setUser(null);
  }

  const value = useMemo(() => ({
    token,
    user,
    isAuthenticated: Boolean(token),
    isAdmin: Boolean(user?.isAdmin),
    authLoading,
    login,
    register,
    refreshUser,
    logout,
    logoutEverywhere
  }), [authLoading, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
