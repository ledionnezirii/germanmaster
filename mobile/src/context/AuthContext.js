import { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { authService } from "../services/api";

const storage = {
  getItemAsync: (key) =>
    Platform.OS === "web"
      ? Promise.resolve(localStorage.getItem(key))
      : SecureStore.getItemAsync(key),
  setItemAsync: (key, value) =>
    Platform.OS === "web"
      ? (localStorage.setItem(key, value), Promise.resolve())
      : SecureStore.setItemAsync(key, value),
  deleteItemAsync: (key) =>
    Platform.OS === "web"
      ? (localStorage.removeItem(key), Promise.resolve())
      : SecureStore.deleteItemAsync(key),
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const [token, cached] = await Promise.all([
        storage.getItemAsync("authToken"),
        storage.getItemAsync("cachedUser"),
      ]);

      if (!token) {
        setLoading(false);
        return;
      }

      // Render immediately from cache — no spinner
      if (cached) {
        setUser(JSON.parse(cached));
        setLoading(false);
      }

      // Silently refresh from server in background
      const res = await authService.getMe();
      const fresh = res.data?.user || res.data;
      setUser(fresh);
      await storage.setItemAsync("cachedUser", JSON.stringify(fresh));

      if (!cached) setLoading(false);
    } catch {
      await storage.deleteItemAsync("authToken");
      await storage.deleteItemAsync("cachedUser");
      setUser(null);
      setLoading(false);
    }
  }

  async function login(credentials) {
    const res = await authService.login(credentials);
    const userData = res.data?.user || res.data;
    setUser(userData);
    await storage.setItemAsync("cachedUser", JSON.stringify(userData));
    return res;
  }

  async function register(data) {
    const res = await authService.register(data);
    return res;
  }

  async function googleLogin(accessToken) {
    const res = await authService.googleAuth(accessToken);
    const userData = res.data?.user || res.data;
    if (userData?.token) {
      await storage.setItemAsync("authToken", userData.token);
    }
    setUser(userData);
    await storage.setItemAsync("cachedUser", JSON.stringify(userData));
    return res;
  }

  async function logout() {
    await authService.logout();
    await storage.deleteItemAsync("cachedUser");
    setUser(null);
  }

  function refreshUser() {
    return loadUser();
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, googleLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
