import React from "react";

const Toast = ({ message, show }) => {
  return (
    <div
      className={`fixed top-6 right-6 z-[100] transition-all duration-300 ${show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"}`}
    >
      <div className="bg-green-500 text-white px-6 py-3 rounded shadow-lg font-semibold flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        {message}
      </div>
    </div>
  );
};

export default Toast;
