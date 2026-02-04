import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("token"));
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem("email") || "");
  const [userRole, setUserRole] = useState(() => localStorage.getItem("role") || null); // 'admin' | 'customer' | null
  const [loading, setLoading] = useState(false);

  // useEffect removed because state is initialized synchronously above

  const login = (token, email, role) => {
    localStorage.setItem("token", token);
    localStorage.setItem("email", email);
    localStorage.setItem("role", role);

    setIsLoggedIn(true);
    setUserEmail(email);
    setUserRole(role);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("role");

    setIsLoggedIn(false);
    setUserEmail("");
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, userEmail, userRole, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
