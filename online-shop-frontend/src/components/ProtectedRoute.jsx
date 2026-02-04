import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { loading } = useAuth();
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  // SUPER DEBUG MODE: No auto-redirects allowed!

  if (loading) {
    return <div className="p-10 text-xl font-bold">State: Loading Auth...</div>;
  }

  if (!token) {
    // We do NOT redirect here to prove if this is the cause
    return (
      <div className="p-10 bg-red-100 text-red-700 border-4 border-red-500 min-h-screen">
        <h1 className="text-4xl font-bold mb-4">DEBUG MODE: SESSION INVALID</h1>
        <p className="text-xl mb-4">The system thinks you are NOT logged in.</p>
        <div className="bg-white p-4 rounded shadow mb-4">
          <p><strong>LocalStorage 'token':</strong> {JSON.stringify(token)}</p>
          <p><strong>LocalStorage 'role':</strong> {JSON.stringify(userRole)}</p>
          <p><strong>Required Role:</strong> {JSON.stringify(role)}</p>
        </div>
        <p>If you see this screen, it means 'localStorage' is empty or cannot be read.</p>
        <button onClick={() => window.location.href = '/login'} className="mt-4 bg-red-600 text-white px-6 py-2 rounded font-bold">
          Manual Go to Login
        </button>
      </div>
    );
  }

  if (role && userRole !== role) {
    // We do NOT redirect here either
    return (
      <div className="p-10 bg-orange-100 text-orange-700 border-4 border-orange-500 min-h-screen">
        <h1 className="text-4xl font-bold mb-4">DEBUG MODE: ROLE MISMATCH</h1>
        <p className="text-xl">Your role does not match the required role.</p>
        <div className="bg-white p-4 rounded shadow mt-4">
          <p><strong>Your Role:</strong> {userRole}</p>
          <p><strong>Required:</strong> {role}</p>
        </div>
      </div>
    );
  }

  // If we get here, everything is valid
  // But we wrap it in a border to confirm ProtectedRoute is rendering
  return (
    <div className="border-4 border-green-500 min-h-screen relative">
      <div className="absolute top-0 right-0 bg-green-500 text-white p-2 font-bold z-[9999]">
        Auth Valid: {userRole}
      </div>
      {children}
    </div>
  );
}
