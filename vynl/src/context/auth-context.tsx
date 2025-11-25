import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { supabase } from "@/src/utils/supabase";

type AuthContextType = {
  authToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  authToken: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const saveRefreshToken = async (token: string) => {
    await SecureStore.setItemAsync("refresh_token", token);
  };

  const loadRefreshToken = async () => {
    return await SecureStore.getItemAsync("refresh_token");
  };

  const clearRefreshToken = async () => {
    await SecureStore.deleteItemAsync("refresh_token");
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log("Login error:", error.message);
      throw error;
    }

    // save refresh token securely
    const refreshToken = data.session?.refresh_token;
    if (refreshToken) await saveRefreshToken(refreshToken);

    // keep access token in memory only
    setAuthToken(data.session?.access_token ?? null);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    await clearRefreshToken();
    setAuthToken(null);
  };

  const restoreSession = async () => {
    const refreshToken = await loadRefreshToken();

    if (!refreshToken) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      console.log("Refresh error:", error.message);
      await clearRefreshToken();
      setLoading(false);
      return;
    }

    // save new refresh token
    if (data.session?.refresh_token) {
      await saveRefreshToken(data.session.refresh_token);
    }

    setAuthToken(data.session?.access_token ?? null);
    setLoading(false);
  };

  // run once at startup
  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <AuthContext.Provider value={{ authToken, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
