import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../config.js";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const { t } = useCurrency();
  const { login } = useAuth();

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

      login(registerRes.data.token, registerRes.data.email, registerRes.data.role);
      setSuccess(t('register.success'));
      setTimeout(() => navigate("/"), 1500);
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
