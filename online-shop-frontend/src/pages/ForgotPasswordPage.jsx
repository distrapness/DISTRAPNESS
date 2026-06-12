import React, { useState } from "react";
import axios from "axios";
import config from "../config.js";
import { useNavigate } from "react-router-dom";
import { useCurrency } from "../components/CurrencyContext.jsx";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: identity, 2: otp, 3: reset
  const [identity, setIdentity] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [resetToken, setResetToken] = useState("");
  
  // Simulation states
  const [method, setMethod] = useState("");
  const [simulatedOtp, setSimulatedOtp] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const { t } = useCurrency();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await axios.post(`${config.API_URL}/api/forgot-password`, { identity });
      setOtpToken(res.data.token);
      setMethod(res.data.method);
      if (res.data.otp_simulated) {
        setSimulatedOtp(res.data.otp_simulated);
      } else {
        setSimulatedOtp("");
      }
      setSuccess(res.data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await axios.post(`${config.API_URL}/api/verify-otp`, { 
        token: otpToken, 
        code: otpCode 
      });
      setResetToken(res.data.resetToken);
      setSuccess(res.data.message);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "Kode verifikasi salah atau kedaluwarsa.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError(t('register.errorMatch') || "Password tidak cocok");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await axios.post(`${config.API_URL}/api/reset-password`, {
        resetToken,
        newPassword
      });
      setSuccess(t('forgotPassword.success') || "Password berhasil diubah!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Gagal mengubah password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-500 py-12">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 dark:border-gray-700">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
            {t('forgotPassword.title') || "Lupa Kata Sandi"}
          </h2>
        </div>

        {step === 1 && (
          <form onSubmit={handleRequestOtp}>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              {t('forgotPassword.identity') || "Masukkan Email atau Nomor Telepon yang terdaftar untuk mengirim kode verifikasi."}
            </p>

            <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
              {t('forgotPassword.identity') || "Email atau Nomor Telepon"}
            </label>
            <input
              type="text"
              value={identity}
              onChange={e => setIdentity(e.target.value)}
              className="w-full mb-6 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-none rounded-xl focus:ring-2 focus:ring-black outline-none dark:text-white transition-all font-bold"
              placeholder={t('forgotPassword.identityPlaceholder') || "email@anda.com / 08xxxxxxxxxx"}
              required
            />

            {error && <div className="mb-4 text-red-500 text-center font-bold text-xs">{error}</div>}
            {success && <div className="mb-4 text-green-500 text-center font-bold text-xs">{success}</div>}

            <button
              type="submit"
              className="w-full py-4 px-6 bg-black dark:bg-white text-white dark:text-black font-black rounded-xl uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
              disabled={loading}
            >
              {loading ? t('login.loading') || "Memproses..." : t('forgotPassword.sendOtp') || "Kirim Kode Verifikasi"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              {t('forgotPassword.otpLabel') || "Masukkan 6-Digit Kode Verifikasi"}
            </p>

            <input
              type="text"
              maxLength="6"
              value={otpCode}
              onChange={e => setOtpCode(e.target.value)}
              className="w-full mb-6 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-none rounded-xl focus:ring-2 focus:ring-black outline-none dark:text-white text-center text-xl font-mono tracking-widest font-bold"
              placeholder={t('forgotPassword.otpPlaceholder') || "6-digit OTP"}
              required
            />

            {error && <div className="mb-4 text-red-500 text-center font-bold text-xs">{error}</div>}
            {success && <div className="mb-4 text-green-500 text-center font-bold text-xs">{success}</div>}

            <button
              type="submit"
              className="w-full py-4 px-6 bg-black dark:bg-white text-white dark:text-black font-black rounded-xl uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
              disabled={loading}
            >
              {loading ? t('login.loading') || "Memproses..." : t('forgotPassword.verify') || "Verifikasi Kode"}
            </button>

            {method === 'phone' && simulatedOtp && (
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/30 rounded-xl text-center">
                <span className="block text-[10px] font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-widest mb-1">
                  [Simulasi OTP SMS Lokal]
                </span>
                <span className="block font-mono text-2xl font-bold text-yellow-700 dark:text-yellow-300 tracking-wider">
                  {simulatedOtp}
                </span>
                <span className="block text-[9px] text-yellow-500 mt-1">
                  {t('forgotPassword.info') || "Gunakan kode simulasi di atas untuk pengetesan lokal."}
                </span>
              </div>
            )}
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
              {t('forgotPassword.newPassword') || "Password Baru"}
            </label>
            <div className="relative mb-6">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-none rounded-xl focus:ring-2 focus:ring-black outline-none dark:text-white pr-12 transition-all font-bold"
                placeholder={t('forgotPassword.passwordPlaceholder') || "••••••••"}
                required
                minLength="6"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(v => !v)}
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

            <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
              {t('forgotPassword.confirmNewPassword') || "Konfirmasi Password Baru"}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full mb-6 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-none rounded-xl focus:ring-2 focus:ring-black outline-none dark:text-white transition-all font-bold"
              placeholder={t('forgotPassword.confirmPasswordPlaceholder') || "••••••••"}
              required
            />

            {error && <div className="mb-4 text-red-500 text-center font-bold text-xs">{error}</div>}
            {success && <div className="mb-4 text-green-500 text-center font-bold text-xs">{success}</div>}

            <button
              type="submit"
              className="w-full py-4 px-6 bg-black dark:bg-white text-white dark:text-black font-black rounded-xl uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
              disabled={loading}
            >
              {loading ? t('login.loading') || "Memproses..." : t('forgotPassword.submit') || "Simpan Password Baru"}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <a href="/login" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
            {t('forgotPassword.backToLogin') || "← Kembali ke Login"}
          </a>
        </div>
      </div>
    </div>
  );
}
