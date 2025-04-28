import React, { useEffect } from "react";

const Modal = ({ open, onClose, children }) => {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70 transition-colors duration-500" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full p-6 relative animate-fadeIn">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-black dark:hover:text-gray-300 text-2xl font-bold focus:outline-none"
          onClick={onClose}
          aria-label="Tutup"
          tabIndex={0}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
