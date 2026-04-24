import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { FaPaperPlane, FaUserCircle } from 'react-icons/fa';
import config from '../config.js';
import { useCurrency } from '../components/CurrencyContext.jsx';

const socket = io(config.API_URL);

const AdminChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const { t } = useCurrency();

  useEffect(() => {
    fetch(`${config.API_URL}/chats`, {
      headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => setMessages(data));
      
    socket.on('chat_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    
    socket.emit('join', t('chat.adminName'));
    return () => {
      socket.off('chat_message');
    };
  }, [t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim() !== '') {
      socket.emit('admin_message', { message: input });
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Header Info */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-[900] uppercase tracking-tighter text-gray-900 dark:text-white">{t('admin.chat') || 'Live Chat'}</h2>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Customer Support Interface</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-100 dark:border-green-800">
           <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
           <span className="text-[10px] font-black uppercase tracking-widest text-green-700 dark:text-green-400">System Live</span>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden">
        
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scrollbar-hide">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-20 select-none">
              <FaPaperPlane size={48} className="mb-4" />
              <p className="text-sm font-black uppercase tracking-widest">{t('chat.empty')}</p>
            </div>
          )}
          {messages.map((msg, i) => {
            const isAdmin = msg.role === 'admin';
            return (
              <div key={i} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} items-end gap-3`}>
                {!isAdmin && <FaUserCircle size={28} className="text-gray-300 mb-1" />}
                <div className={`p-4 rounded-2xl max-w-[70%] shadow-sm ${
                  isAdmin 
                    ? 'bg-black dark:bg-white text-white dark:text-black rounded-br-none shadow-black/10' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none'
                }`}>
                  <span className={`block text-[8px] font-black uppercase tracking-[0.15em] mb-1 opacity-50 ${isAdmin ? 'text-right' : ''}`}>
                    {isAdmin ? t('chat.adminName') : (msg.user || t('chat.guestName'))}
                  </span>
                  <p className="text-sm leading-relaxed font-medium">{msg.message}</p>
                  <span className={`block text-[7px] font-bold opacity-30 mt-2 ${isAdmin ? 'text-left' : 'text-right'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-6 bg-gray-50/50 dark:bg-gray-900/20 border-t border-gray-50 dark:border-gray-700">
          <form onSubmit={sendMessage} className="relative group">
            <input
              className="w-full pl-6 pr-16 py-4 bg-white dark:bg-gray-700 text-sm border-none rounded-2xl shadow-sm outline-none focus:ring-2 ring-blue-500/20 transition-all dark:text-white"
              placeholder={t('chat.placeholder')}
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <button 
              type="submit" 
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-black dark:bg-white text-white dark:text-black rounded-xl shadow-lg transition-all hover:scale-110 active:scale-95"
            >
              <FaPaperPlane size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminChat;
