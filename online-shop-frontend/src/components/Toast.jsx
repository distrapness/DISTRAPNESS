import React from "react";

const Toast = ({ message, show }) => {
  return (
    <div
      className={`fixed top-12 left-1/2 -translate-x-1/2 md:left-auto md:right-12 md:-translate-x-0 z-[200] transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) ${show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8 pointer-events-none"}`}
    >
      <div className="bg-black/90 dark:bg-white/90 backdrop-blur-xl text-white dark:text-black px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10 dark:border-black/10 min-w-[300px]">
        <div className="w-8 h-8 rounded-full bg-white/10 dark:bg-black/10 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
        <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-0.5">Success Notification</span>
            <span className="text-[12px] font-bold uppercase tracking-tight italic">{message}</span>
        </div>
      </div>
    </div>
  );
};

export default Toast;
