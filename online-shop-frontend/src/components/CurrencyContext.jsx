import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, getTranslation } from "../utils/translations";
import config from "../config.js";

const CurrencyContext = createContext();

export const CURRENCY_OPTIONS = [
  { label: "IDR", code: "IDR", symbol: "Rp", rate: 1, locale: "id-ID" },
  { label: "USD", code: "USD", symbol: "$", rate: 0.000065, locale: "en-US" } // Update rate sesuai kurs
];

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(CURRENCY_OPTIONS[0]);
  const [dark, setDark] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || "EN"); // EN or ID
  const [brand, setBrand] = useState({ brandName: "DISTRAPNESS", logo: "/uploads/logo-hitam.png", logoWhite: "/uploads/logo-putih.png", phone: "6285888159265" });

  useEffect(() => {
    fetch(`${config.API_URL}/api/brand`)
      .then((res) => {
        if (!res.ok) throw new Error("API Error");
        return res.json();
      })
      .then(data => {
        setBrand({
          ...data,
          brandName: data.brandName || "DISTRAPNESS",
          logo: data.logo || "/uploads/logo-hitam.png",
          logoWhite: data.logoWhite || "/uploads/logo-putih.png",
          phone: data.phone || "6285888159265"
        });
      })
      .catch((err) => {
        console.error("Fetch brand failed:", err);
      });
  }, []);

  // Save language preference to localStorage
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Helper translation function
  const t = (path) => getTranslation(language, path);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, dark, setDark, language, setLanguage, t, brand }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
