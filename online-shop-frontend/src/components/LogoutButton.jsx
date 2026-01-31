import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const LogoutButton = ({ className = "" }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <button
      className={`bg-red-600 hover:bg-red-700 text-white px-4 py-2 font-bold rounded shadow transition ${className}`}
      onClick={handleLogout}
    >
      Keluar
    </button>
  );
};

export default LogoutButton;
