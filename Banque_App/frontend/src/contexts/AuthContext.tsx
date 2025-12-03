import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from "axios";

// ===== Types =====

interface Client {
  id_client: number;
  id_user: number;
  first_name: string;
  last_name: string;
  address?: string;
  date_of_birth?: string;
  created_at?: string;
}

interface User {
  id_user: number;
  email: string;
  role: 'client' | 'support' | 'admin';
  phone_number?: string;
  created_at?: string;
  last_login?: string;
  client?: Client;
}

interface AuthContextType {
  user: User | null;
  needsOTP: boolean;
  isAuthenticated: boolean;
  token: string | null;
  setUser: (user: User | null) => void;
  setNeedsOTP: (needs: boolean) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  checkSession: () => Promise<void>;
}

// ===== Contexte =====

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ===== Provider =====

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

  const [user, setUser] = useState<User | null>(null);
  const [needsOTP, setNeedsOTP] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load initial token
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));

  // --- 🔥 Intercepteur : rafraîchit automatiquement le token ---
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => {
        const newToken = response.headers["x-refresh-token"];
        if (newToken) {
          localStorage.setItem("token", newToken);
          setToken(newToken);
        }
        return response;
      },
      (error) => Promise.reject(error)
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  // ===== Vérifier session =====
  const checkSession = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/check-session", {
        credentials: "include"
      });

      const data = await response.json();

      if (data.authenticated && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        setNeedsOTP(false);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de la session:", error);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // ===== Déconnexion =====
  const logout = async () => {
    try {
      await fetch("http://localhost:5000/api/logout", {
        method: "POST",
        credentials: "include"
      });
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setNeedsOTP(false);
      localStorage.removeItem("token");
      setToken(null);
    }
  };

  // Vérifier la session au chargement
  useEffect(() => {
    checkSession();
  }, []);

  // Mise à jour auth
  useEffect(() => {
    setIsAuthenticated(!!user && !needsOTP);
  }, [user, needsOTP]);

  // ===== 🔥 Auto Logout après 10 minutes d’inactivité =====
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;


    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        logout(); // Déconnecte automatiquement
      }, 1 * 60 * 1000); // 10 minutes
    };

    // Activité utilisateur qui reset le timer
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("click", resetTimer);
    window.addEventListener("scroll", resetTimer);

    resetTimer(); // Lancer le timer au début

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("click", resetTimer);
      window.removeEventListener("scroll", resetTimer);
    };
  }, [logout]);

  // ===== Valeur du contexte =====
  const value: AuthContextType = {
    user,
    needsOTP,
    isAuthenticated,
    token,
    setUser,
    setNeedsOTP,
    setToken,
    logout,
    checkSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ===== Hook =====

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  return context;
};
