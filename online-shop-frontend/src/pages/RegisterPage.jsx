import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../config.js";
import { useNavigate, useLocation } from "react-router-dom";
import { useCurrency } from "../components/CurrencyContext.jsx";
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from "../contexts/AuthContext";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Verification States
  const [showOtpVerif, setShowOtpVerif] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [serverOtp, setServerOtp] = useState("");
  const [emailSent, setEmailSent] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const { t, brand } = useCurrency();
  const { login } = useAuth();

  useEffect(() => {
    if (location.state && location.state.showOtp && location.state.email) {
      setEmail(location.state.email);
      setShowOtpVerif(true);
    }
  }, [location]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setVerifyingOtp(true);
    try {
      const res = await axios.post(`${config.API_URL}/api/register/verify`, {
        email,
        otp
      });
      login(res.data.token, res.data.email, res.data.role);
      setSuccess("Verifikasi berhasil! Akun Anda aktif.");
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Verifikasi OTP gagal. Silakan periksa kembali kode Anda.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setError("");
    setSuccess("");
    setResendingOtp(true);
    try {
      const res = await axios.post(`${config.API_URL}/api/register/resend-otp`, { email });
      setSuccess(res.data.message || "Kode OTP baru berhasil dikirim.");
      if (res.data.otp) {
        setServerOtp(res.data.otp);
      }
      setEmailSent(res.data.emailSent !== false);
      setResendTimer(60);
    } catch (err) {
      setError(err.response?.data?.message || "Gagal mengirim ulang OTP.");
    } finally {
      setResendingOtp(false);
    }
  };

  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (showOtpVerif) {
      setResendTimer(60);
    }
  }, [showOtpVerif]);

  const renderRecaptcha = () => {
    if (window.grecaptcha && document.getElementById('recaptcha-container')) {
      document.getElementById('recaptcha-container').innerHTML = '';
      window.grecaptcha.render('recaptcha-container', {
        sitekey: '6LcmfhstAAAAANm9RQSAUhTkoaySSlY5MCDsThRT',
        callback: (token) => {
          setRecaptchaToken(token);
        },
        'expired-callback': () => {
          setRecaptchaToken('');
        }
      });
    }
  };

  useEffect(() => {
    const existingScript = document.getElementById('recaptcha-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
      script.id = 'recaptcha-script';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);

      window.onRecaptchaLoad = () => {
        renderRecaptcha();
      };
    } else {
      if (window.grecaptcha) {
        renderRecaptcha();
      } else {
        window.onRecaptchaLoad = () => {
          renderRecaptcha();
        };
      }
    }

    return () => {
      window.onRecaptchaLoad = null;
    };
  }, []);

  useEffect(() => {
    if (!showOtpVerif && window.grecaptcha) {
      const timer = setTimeout(() => {
        renderRecaptcha();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [showOtpVerif]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!birthDay || !birthMonth || !birthYear) {
      setError("Silakan lengkapi tanggal lahir Anda.");
      return;
    }

    if (password !== confirmPassword) {
      setError(t('register.errorMatch'));
      return;
    }

    const isLocal = window.location.hostname === 'localhost';
    if (!recaptchaToken && !isLocal) {
      setError("Silakan centang Captcha terlebih dahulu.");
      return;
    }

    if (!agreed) {
      setError("Silakan setujui Syarat & Ketentuan serta Kebijakan Privasi yang berlaku.");
      return;
    }

    setLoading(true);
    const birthDate = `${birthYear}-${birthMonth}-${birthDay}`;

    try {
      const registerRes = await axios.post(`${config.API_URL}/api/register`, { 
        email, 
        phone, 
        password, 
        fullName, 
        birthDate, 
        recaptchaToken: recaptchaToken || 'bypass_localhost'
      });

      if (registerRes.data.registered && !registerRes.data.verified) {
        setSuccess(registerRes.data.message || "Pendaftaran berhasil! Silakan masukkan kode OTP yang telah dikirim ke email Anda.");
        if (registerRes.data.otp) {
          setServerOtp(registerRes.data.otp);
        }
        setEmailSent(registerRes.data.emailSent !== false);
        setShowOtpVerif(true);
      } else {
        login(registerRes.data.token, registerRes.data.email, registerRes.data.role);
        setSuccess(t('register.success'));
        setTimeout(() => navigate("/"), 1500);
      }
    } catch (err) {
      if (window.grecaptcha) {
        window.grecaptcha.reset();
        setRecaptchaToken('');
      }
      setError(err.response?.data?.message || t('register.errorFailed'));
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
      setSuccess(t('register.success'));
      navigate("/");
    } catch (err) {
      setError("Google Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (showOtpVerif) {
    const adminPhone = brand?.phone ? brand.phone.replace(/[^0-9]/g, '') : "6285888159265";
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-500 py-12">
        <form onSubmit={handleVerifyOtp} className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-700">
          <h2 className="text-3xl font-[900] uppercase tracking-tighter mb-4 text-center text-gray-900 dark:text-white italic">
            {emailSent ? "Verifikasi Email" : "Verifikasi WhatsApp"}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-8 font-medium leading-relaxed">
            {emailSent ? (
              <>
                Masukkan 6-digit kode verifikasi yang telah dikirimkan ke email <span className="font-bold text-black dark:text-white">{email}</span>. Kode berlaku selama 5 menit.
              </>
            ) : (
              <>
                Email gagal dikirim. Masukkan 6-digit kode verifikasi yang telah dikirimkan ke WhatsApp <span className="font-bold text-black dark:text-white">{phone}</span>. Kode berlaku selama 5 menit.
              </>
            )}
          </p>

          {!emailSent && serverOtp && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/30 rounded-xl text-center">
              <span className="block text-[10px] font-black text-yellow-600 dark:text-yellow-400 uppercase tracking-widest mb-1">
                [WhatsApp OTP Verification]
              </span>
              <span className="block font-mono text-2xl font-bold text-yellow-700 dark:text-yellow-300 tracking-wider">
                {serverOtp}
              </span>
              <span className="block text-[9px] text-yellow-500 mt-1">
                Gunakan kode di atas atau klik tombol WhatsApp di bawah untuk konfirmasi ke Admin.
              </span>
            </div>
          )}

          <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Kode Verifikasi OTP</label>
          <input
            type="text"
            maxLength={6}
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} // Numeric only
            className="w-full mb-6 px-4 py-4 bg-gray-50 dark:bg-gray-700/50 border-none rounded-xl focus:ring-2 focus:ring-black outline-none dark:text-white transition-all text-center font-mono text-2xl font-black tracking-[0.4em]"
            placeholder="••••••"
            required
            autoFocus
          />

          {error && <div className="mb-4 text-red-500 text-center font-bold text-xs">{error}</div>}
          {success && <div className="mb-4 text-green-500 text-center font-bold text-xs">{success}</div>}

          <button
            type="submit"
            className="w-full py-4 px-6 bg-black dark:bg-white text-white dark:text-black font-black rounded-xl uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
            disabled={verifyingOtp}
          >
            {verifyingOtp ? "Memverifikasi..." : "Verifikasi OTP"}
          </button>

          <div className="mt-8 text-center text-xs font-bold uppercase tracking-widest text-gray-500">
            Tidak menerima kode?{" "}
            <button
              type="button"
              onClick={handleResendOtp}
              className="text-black dark:text-white underline disabled:opacity-50"
              disabled={resendingOtp || resendTimer > 0}
            >
              {resendingOtp ? "Mengirim..." : resendTimer > 0 ? `Kirim Ulang (${resendTimer}s)` : "Kirim Ulang"}
            </button>
          </div>
          
          <div className="mt-4 text-center text-xs font-bold uppercase tracking-widest">
            <button
              type="button"
              onClick={() => {
                setShowOtpVerif(false);
                setError("");
                setSuccess("");
              }}
              className="text-gray-400 hover:text-black dark:hover:text-white underline"
            >
              Kembali ke Pendaftaran
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-705 text-center">
            <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
              {!emailSent ? "⚠️ Email OTP gagal terkirim otomatis" : "Tidak menerima kode di email?"}
            </p>
            <a
              href={`https://wa.me/${adminPhone}?text=${encodeURIComponent(
                serverOtp 
                  ? `Halo Admin Distrapness, saya mendaftar akun baru dan ingin melakukan verifikasi. Berikut detail saya:\n\nEmail: ${email}\nNomor HP: ${phone}\nKode OTP: ${serverOtp}`
                  : `Halo Admin Distrapness, saya tidak menerima email verifikasi OTP. Mohon kirimkan kode verifikasi saya.\n\nEmail: ${email}\nNomor HP: ${phone}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition shadow-md hover:shadow-lg active:scale-95"
            >
              <img
                src="/assets/whatsapp.png"
                alt="WhatsApp"
                className="w-4 h-4 object-contain"
              />
              Kirim OTP via WhatsApp
            </a>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-500 py-12">
      <form onSubmit={handleRegister} className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-700">
        <h2 className="text-3xl font-[900] uppercase tracking-tighter mb-8 text-center text-gray-900 dark:text-white italic">
          {t('register.title')}
        </h2>
        
        <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('register.fullName')}</label>
        <input
          type="text"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          className="w-full mb-6 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-none rounded-xl focus:ring-2 focus:ring-black outline-none dark:text-white transition-all font-bold"
          placeholder="e.g. John Doe"
          required
        />

        <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('register.email')}</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full mb-6 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-none rounded-xl focus:ring-2 focus:ring-black outline-none dark:text-white transition-all font-bold"
          placeholder="your@email.com"
          required
        />

        <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('register.phone')}</label>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className="w-full mb-6 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-none rounded-xl focus:ring-2 focus:ring-black outline-none dark:text-white transition-all font-bold"
          placeholder="08xxxxxxxxxx"
          required
        />

        <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('register.birthday')}</label>
        <div className="grid grid-cols-3 gap-2 mb-6">
          <select
            value={birthDay}
            onChange={e => setBirthDay(e.target.value)}
            className="px-3 py-3 bg-gray-50 dark:bg-gray-700/50 border-none rounded-xl focus:ring-2 focus:ring-black outline-none dark:text-white transition-all font-bold"
            required
          >
            <option value="" disabled>{t('register.day')}</option>
            {Array.from({ length: 31 }, (_, i) => {
              const d = String(i + 1).padStart(2, '0');
              return <option key={d} value={d}>{d}</option>;
            })}
          </select>
          <select
            value={birthMonth}
            onChange={e => setBirthMonth(e.target.value)}
            className="px-3 py-3 bg-gray-50 dark:bg-gray-700/50 border-none rounded-xl focus:ring-2 focus:ring-black outline-none dark:text-white transition-all font-bold"
            required
          >
            <option value="" disabled>{t('register.month')}</option>
            {Array.from({ length: 12 }, (_, i) => {
              const m = String(i + 1).padStart(2, '0');
              return <option key={m} value={m}>{m}</option>;
            })}
          </select>
          <select
            value={birthYear}
            onChange={e => setBirthYear(e.target.value)}
            className="px-3 py-3 bg-gray-50 dark:bg-gray-700/50 border-none rounded-xl focus:ring-2 focus:ring-black outline-none dark:text-white transition-all font-bold"
            required
          >
            <option value="" disabled>{t('register.year')}</option>
            {Array.from({ length: 87 }, (_, i) => {
              const y = String(2026 - i);
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>
        </div>

        <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('register.password')}</label>
        <div className="relative mb-6">
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

        <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('register.confirmPassword')}</label>
        <div className="relative mb-6">
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-none rounded-xl focus:ring-2 focus:ring-black outline-none dark:text-white pr-12 transition-all font-bold"
            placeholder="••••••••"
            required
          />
          <button type="button" onClick={() => setShowConfirmPassword(v => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white focus:outline-none"
            tabIndex={-1}
          >
            {showConfirmPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
            )}
          </button>
        </div>

        <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('captcha.label')}</label>
        <div className="flex justify-center mb-8">
          <div id="recaptcha-container"></div>
        </div>

        <div className="flex items-start gap-3 mb-6">
          <input
            type="checkbox"
            id="agreeTerms"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-black focus:ring-black accent-black dark:accent-white cursor-pointer"
            required
          />
          <label htmlFor="agreeTerms" className="text-[11px] text-gray-500 dark:text-gray-400 font-bold leading-tight select-none cursor-pointer">
            Saya menyetujui <a href="/terms-conditions" target="_blank" rel="noreferrer" className="text-black dark:text-white underline">Syarat & Ketentuan</a> serta <a href="/privacy-policy" target="_blank" rel="noreferrer" className="text-black dark:text-white underline">Kebijakan Privasi</a> yang berlaku
          </label>
        </div>

        {error && <div className="mb-4 text-red-500 text-center font-bold text-xs">{error}</div>}
        {success && <div className="mb-4 text-green-500 text-center font-bold text-xs">{success}</div>}

        <button
          type="submit"
          className="w-full py-4 px-6 bg-black dark:bg-white text-white dark:text-black font-black rounded-xl uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
          disabled={loading}
        >
          {loading ? t('register.loading') : t('register.submit')}
        </button>

        <div className="mt-8 text-center text-xs font-bold uppercase tracking-widest text-gray-500">
          {t('register.hasAccount')} <a href="/login" className="text-black dark:text-white underline">{t('register.login')}</a>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700">
          <div className="flex justify-center flex-col items-center gap-6">
             <span className="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-black">Or Sign Up with</span>
            <GoogleLogin
               onSuccess={handleGoogleSuccess}
               onError={() => setError("Google Signup Failed")}
               theme="outline"
               shape="pill"
               width="320"
               logo_alignment="left"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
