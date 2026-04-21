import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useCurrency } from './CurrencyContext.jsx';
import { FaPaperPlane, FaTimes } from 'react-icons/fa';
import config from '../config.js';

const socket = io(config.API_URL);

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const { dark, t } = useCurrency();

  useEffect(() => {
    if (!open) return;
    socket.on('chat_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    socket.emit('join', t('chat.guestName'));
    return () => {
      socket.off('chat_message');
    };
  }, [open, t]);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim() !== '') {
      socket.emit('chat_message', { message: input, role: 'user', user: t('chat.guestName') });
      setInput('');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[100] flex flex-col items-end">
      {/* Dynamic Chat Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-black dark:bg-white shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95"
          aria-label={t('chat.ariaOpen')}
        >
           {/* Pulsing Aura */}
          <span className="absolute inset-0 rounded-full bg-black dark:bg-white animate-ping opacity-20 group-hover:opacity-40"></span>
          
          <img
            src={dark ? "/uploads/logo-hitam.png" : "/uploads/logo-putih.png"}
            alt="DM"
            className="h-8 w-8 object-contain transition-transform duration-500 group-hover:rotate-12"
          />
        </button>
      )}

      {/* Premium Chat Box */}
      {open && (
        <div
          className={`w-80 md:w-96 max-w-[95vw] shadow-2xl rounded-[2rem] border overflow-hidden flex flex-col animate-slideUp backdrop-blur-xl ${dark ? 'border-gray-800 bg-gray-900/95' : 'border-gray-100 bg-white/95'}`}
          style={{ minHeight: 450, maxHeight: 600 }}
        >
          {/* Header */}
          <div className="bg-black dark:bg-white text-white dark:text-black py-5 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border border-white/20 dark:border-black/10 flex items-center justify-center p-1 bg-white/10 dark:bg-black/5">
                <img src={dark ? "/uploads/logo-hitam.png" : "/uploads/logo-putih.png"} alt="Logo" className="object-contain" />
              </div>
              <div>
                <h3 className="font-black uppercase tracking-tighter text-sm leading-none">{t('chat.title')}</h3>
                <span className="text-[9px] uppercase tracking-widest opacity-60 font-bold flex items-center gap-1">
                   <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online
                </span>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="opacity-60 hover:opacity-100 transition-opacity p-2">
              <FaTimes size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 scrollbar-hide">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-30 select-none">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-current flex items-center justify-center">
                   <FaPaperPlane size={24} />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest">{t('chat.empty')}</p>
              </div>
            )}
            {messages.map((msg, i) => {
              const isAdmin = msg.role === 'admin';
              return (
                <div key={i} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                  <div className={`p-4 rounded-2xl max-w-[85%] shadow-sm ${
                    isAdmin 
                      ? 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white rounded-tl-none' 
                      : 'bg-black dark:bg-white text-white dark:text-black rounded-tr-none'
                  }`}>
                    <span className="block text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">
                      {isAdmin ? t('chat.adminName') : (msg.user || t('chat.guestName'))}
                    </span>
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                    <span className="block text-[8px] font-bold opacity-30 mt-2 text-right">
                       {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={sendMessage}
            className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20"
          >
            <div className="relative flex items-center">
              <input
                className="w-full pl-4 pr-12 py-3 text-sm bg-white dark:bg-gray-800 border-none outline-none dark:text-white rounded-2xl shadow-inner-sm focus:ring-2 ring-black/5 dark:ring-white/5"
                placeholder={t('chat.placeholder')}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-2 p-2 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:scale-110 active:scale-95 transition-all shadow-lg"
              >
                <FaPaperPlane size={14} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
