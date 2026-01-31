import React, { useState } from "react";
import axios from "axios";
import config from "../config";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${config.API_URL}/api/login`, { email, password });
      login(res.data.token, res.data.email); // update context & localStorage
      setSuccess("Login berhasil!");
      navigate("/"); // langsung redirect tanpa timeout
    } catch (err) {
      setError("Email atau password salah");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <form onSubmit={handleLogin} className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">Login Akun</h2>
        <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full mb-4 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-white"
          placeholder="you@email.com"
          required
        />
        <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Password</label>
        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-white pr-10"
            placeholder="••••••••"
            required
          />
          <button type="button" onClick={() => setShowPassword(v => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 focus:outline-none"
            tabIndex={-1}
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.218 1.125-4.575m1.75-2.425A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.403 3.218-1.125 4.575M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18M4.22 4.22A9.956 9.956 0 002 12c0 5.523 4.477 10 10 10 1.657 0 3.218-.403 4.575-1.125m2.425-1.75A9.956 9.956 0 0022 12c0-5.523-4.477-10-10-10-1.657 0-3.218.403-4.575 1.125M9.88 9.88A3 3 0 0115 12c0 1.657-1.343 3-3 3a3 3 0 01-3-3c0-1.657 1.343-3 3-3z" /></svg>
            )}
          </button>
        </div>
        {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
        {success && <div className="mb-4 text-green-600 text-sm">{success}</div>}
        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition"
          disabled={loading}
        >
          {loading ? "Memproses..." : "Login"}
        </button>
        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
          Belum punya akun? <a href="/register" className="text-blue-600 hover:underline">Daftar</a>
        </div>
      </form>
    </div>
  );
}
