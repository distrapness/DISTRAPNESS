import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../config.js";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCurrency } from "../components/CurrencyContext.jsx";
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const { t } = useCurrency();

  // Force clear any stale session when opening login page
  useEffect(() => {
    logout();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const cleanEmail = email.trim().toLowerCase();
    try {
      const res = await axios.post(`${config.API_URL}/api/login`, { email: cleanEmail, password });
      login(res.data.token, res.data.email, res.data.role);
      setSuccess(t('login.success'));
      const roleStr = res.data.role ? res.data.role.toString().toLowerCase() : "";
      if (roleStr === 'admin') navigate("/admin");
      else navigate("/");
    } catch (err) {
      const backendMsg = err.response && err.response.data && err.response.data.message;
      const backendDetail = err.response && err.response.data && err.response.data.detail;
      setError(backendMsg ? `${backendMsg} ${backendDetail || ''}` : t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${config.API_URL}/api/google-login`, { token: credentialResponse.credential });
      login(res.data.token, res.data.email, res.data.role);
      setSuccess(t('login.success'));
      const roleStr = res.data.role ? res.data.role.toString().toLowerCase() : "";
      if (roleStr === 'admin') navigate("/admin");
      else navigate("/");
    } catch (err) {
      setError("Google Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-500">
      <form onSubmit={handleLogin} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 dark:border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-red-600 font-black text-2xl animate-pulse mb-4">DIAGNOSA MODE: AKTIF</h1>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
            {t('login.title')}
          </h2>
        </div>
        
        <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('login.email')}</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full mb-6 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-none rounded-xl focus:ring-2 focus:ring-black outline-none dark:text-white transition-all font-bold"
          placeholder="your@email.com"
          required
        />

        <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('login.password')}</label>
        <div className="relative mb-8">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-none rounded-xl focus:ring-2 focus:ring-black outline-none dark:text-white pr-12 transition-all font-bold"
            placeholder="••••••••"
            required
          />
          <button type="button" onClick={() => setShowPassword(v => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
            )}
          </button>
        </div>

        {error && <div className="mb-4 text-red-500 text-center font-bold text-xs">{error}</div>}
        {success && <div className="mb-4 text-green-500 text-center font-bold text-xs">{success}</div>}

        <button
          type="submit"
          className="w-full py-4 px-6 bg-black dark:bg-white text-white dark:text-black font-black rounded-xl uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
          disabled={loading}
        >
          {loading ? t('login.loading') : t('login.submit')}
        </button>

        <div className="mt-8 text-center text-xs font-bold uppercase tracking-widest text-gray-500">
          {t('login.noAccount')} <a href="/register" className="text-black dark:text-white underline">{t('login.register')}</a>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700">
          <div className="flex justify-center flex-col items-center gap-6">
             <span className="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-black">Or Sign In with</span>
            <GoogleLogin
               onSuccess={handleGoogleSuccess}
               onError={() => setError("Google Login Failed")}
               theme="outline"
               shape="pill"
               width="320"
               logo_alignment="left"
               auto_select={false}
               use_fedcm_for_prompt={false}
               context="signin"
            />
          </div>
        </div>

        <div className="mt-8 text-center">
          <a href="/" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
            {t('login.backHome')}
          </a>
        </div>
      </form>
    </div>
  );
}
