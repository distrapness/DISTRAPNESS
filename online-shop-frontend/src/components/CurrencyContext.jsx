import React, { createContext, useContext, useState } from "react";

const CurrencyContext = createContext();

export const CURRENCY_OPTIONS = [
  { label: "IDR", code: "IDR", symbol: "Rp", rate: 1, locale: "id-ID" },
  { label: "USD", code: "USD", symbol: "$", rate: 0.000065, locale: "en-US" } // Update rate sesuai kurs
];

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(CURRENCY_OPTIONS[0]);
  const [dark, setDark] = useState(false);
  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, dark, setDark }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
