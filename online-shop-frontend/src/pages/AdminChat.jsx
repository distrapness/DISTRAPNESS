import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import BackButton from "../components/BackButton";
import config from '../config.js';

const socket = io(config.API_URL);

const AdminChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetch(`${config.API_URL}/chats`)
      .then(res => res.json())
      .then(data => setMessages(data));
    socket.on('chat_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    socket.emit('join', 'Admin');
    return () => {
      socket.off('chat_message');
    };
  }, []);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 md:pt-24 px-4 transition-colors duration-[900ms] ease-in-out flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between mb-6">
          <BackButton />
        </div>
        <h2 className="text-2xl font-bold mb-4 text-center text-green-700 dark:text-green-300">Live Chat Admin</h2>
        <div className="border rounded-lg p-4 mb-4 h-96 overflow-y-auto bg-white dark:bg-gray-800">
          {messages.length === 0 && (
            <div className="text-gray-400 text-sm text-center pt-12">Belum ada pesan.</div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`mb-2 flex ${msg.role === 'admin' ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-2xl px-4 py-2 max-w-[70%] shadow-sm ${msg.role === 'admin' ? 'bg-green-600 text-white' : 'bg-blue-100 text-gray-900 dark:bg-blue-900 dark:text-white'}`}>
                <span className="block text-xs font-bold mb-1">{msg.user}</span>
                {msg.message}
                <span className="block text-[10px] text-gray-300 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 outline-none rounded-full border"
            placeholder="Ketik balasan..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 font-bold rounded-full transition shadow">Kirim</button>
        </form>
      </div>
    </div>
  );
};

export default AdminChat;
