import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useCurrency } from './CurrencyContext';

import config from '../config.js';

const socket = io(config.API_URL); // Ganti dengan port backend Anda jika berbeda

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // Ambil dark mode dari context
  const { dark } = useCurrency();

  useEffect(() => {
    if (!open) return;
    // Listen pesan dari server
    socket.on('chat_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    // Join sebagai guest
    socket.emit('join', 'Guest');
    return () => {
      socket.off('chat_message');
    };
  }, [open]);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim() !== '') {
      socket.emit('chat_message', { message: input, role: 'user' });
      setInput('');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {/* Chat Logo Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex flex-col items-center justify-center w-14 h-14 rounded-none shadow-none transition-colors duration-500 focus:outline-none bg-transparent"
        aria-label="Buka chat"
        style={{ boxShadow: 'none', background: 'transparent', transition: 'background 0.5s, color 0.5s, border 0.5s' }}
      >
        <img
          src={dark ? "/uploads/logo-putih.png" : "/uploads/logo-hitam.png"}
          alt="Logo Chat"
          className="h-9 w-9 object-contain p-0 m-0 transition-all duration-500"
          style={{ transition: 'filter 0.5s' }}
        />
        <span className="-mt-2 font-semibold text-xs text-gray-700 dark:text-gray-200 select-none transition-colors duration-500"
          style={{ transition: 'color 0.5s' }}>CS</span>
      </button>

      {/* Chat Box */}
      {open && (
        <div
          className={`w-80 max-w-[95vw] shadow-2xl rounded-2xl border flex flex-col overflow-hidden mt-3 animate-fadeIn ${dark ? 'border-gray-700' : 'border-gray-200'}`}
          style={{ minHeight: 380, maxHeight: 480, background: dark ? '#111827' : '#fff' }}
        >
          <div className="bg-blue-600 text-white py-2 px-4 font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <img src={dark ? "/uploads/logo-putih.png" : "/uploads/logo-hitam.png"} alt="Logo Chat" className="h-6 w-6 object-contain p-0 m-0" />
              Live Chat
            </span>
            <button onClick={() => setOpen(false)} className="ml-2 text-white hover:text-red-300 text-xl font-bold" aria-label="Tutup chat">×</button>
          </div>
          <div
            className="flex-1 overflow-y-auto px-4 py-3 space-y-2 scrollbar-thin scrollbar-thumb-blue-200 dark:scrollbar-thumb-blue-900 scrollbar-track-transparent"
            style={{ minHeight: 220, maxHeight: 300, background: dark ? '#1e293b' : '#fff' }}
          >
            {messages.length === 0 && (
              <div className="text-gray-400 text-sm text-center pt-12">Belum ada pesan. Mulai chat sekarang!</div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className="flex">
                <div className={`rounded-2xl px-4 py-2 mb-1 max-w-[80%] shadow-sm ${msg.role === 'admin' ? 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-white ml-auto' : dark ? 'bg-blue-900 text-gray-100' : 'bg-blue-100 text-gray-900'}`}>
                  <span className="block text-xs font-bold mb-1">{msg.user}</span>
                  {msg.message}
                  <span className="block text-[10px] text-gray-400 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form
            onSubmit={sendMessage}
            className="flex border-t p-2 gap-2"
            style={{ background: dark ? '#111827' : '#fff', borderColor: dark ? '#374151' : '#e5e7eb' }}
          >
            <input
              className="flex-1 px-3 py-2 text-sm bg-transparent outline-none dark:text-white rounded-full border"
              placeholder="Ketik pesan..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
              style={{ minWidth: 0, background: 'transparent', color: dark ? '#fff' : '#111' }}
            />
            <button
              type="submit"
              className="bg-black hover:bg-gray-800 text-white px-4 py-2 font-bold rounded-full transition shadow"
            >
              Kirim
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
