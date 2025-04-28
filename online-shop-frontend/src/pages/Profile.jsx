import React from "react";
import { useAuth } from "../contexts/AuthContext";

export default function Profile() {
  const { userEmail } = useAuth();
  return (
    <div className="container mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">Profil Saya</h2>
      <div className="bg-white rounded shadow p-4">
        <div className="mb-2">
          <span className="font-semibold">Email:</span> {userEmail}
        </div>
        {/* Tambahkan info user lain di sini */}
      </div>
    </div>
  );
}
