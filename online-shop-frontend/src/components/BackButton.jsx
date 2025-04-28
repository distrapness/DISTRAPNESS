import React from "react";
import { useNavigate } from "react-router-dom";

const BackButton = ({ to = -1 }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="inline-flex items-center justify-center w-10 h-10 bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-black transition z-30 sticky top-6 left-6"
      style={{ backdropFilter: 'blur(6px)' }}
      aria-label="Kembali"
      tabIndex={0}
    >
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-black dark:text-gray-200">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  );
};

export default BackButton;
