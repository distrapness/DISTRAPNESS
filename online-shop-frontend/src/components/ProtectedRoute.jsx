import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { loading } = useAuth();

  // Prioritize localStorage for immediate authentication check on refresh
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  if (loading) {
    return null;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Use case-insensitive and trimmed comparison for roles to avoid subtle logout bugs
  const normalizedUserRole = userRole ? userRole.trim().toLowerCase() : "";
  const normalizedRequiredRole = role ? role.trim().toLowerCase() : "";

  if (role && normalizedUserRole !== normalizedRequiredRole) {
    if (normalizedUserRole === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}
