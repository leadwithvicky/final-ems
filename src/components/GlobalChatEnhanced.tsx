'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessage {
  _id: string;
  senderId: {
    _id: string;
    name: string;
    role: string;
  };
  senderRole: string;
  senderName: string;
  message: string;
  timestamp: string;
  editedAt?: string;
}

export default function GlobalChatEnhanced() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      // Poll for new messages every 3 seconds when chat is open
      pollIntervalRef.current = setInterval(fetchMessages, 3000);
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isOpen]);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/chat/messages', {
        headers: getAuthHeaders()
      });

      if (response.status === 401) {
        setError('Authentication required. Please login again.');
        return;
      }

      const data = await response.json();
      
      if (response.ok) {
        setMessages(data.messages || []);
      } else {
        setError(data.error || 'Failed to fetch messages');
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    setError(null);
    
    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message: newMessage })
      });

      if (response.status === 401) {
        setError('Authentication required. Please login again.');
        return;
      }

      const data = await response.json();
      
      if (response.ok) {
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setIsSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'text-red-600 font-bold';
      case 'admin': return 'text-blue-600 font-semibold';
      default: return 'text-gray-600';
    }
  };

  const getMessageBgColor = (senderId: string) => {
    return senderId === user?.id ? 'bg-blue-500 text-white' : 'bg-gray-100';
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 flex items-center justify-center"
        title="Global Chat"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {messages.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {messages.length > 99 ? '99+' : messages.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-4 w-96 h-96 bg-white rounded-lg shadow-xl flex flex-col z-50 border">
          <div className="bg-blue-600 text-white p-3 rounded-t-lg flex justify-between items-center">
            <h3 className="font-semibold">Global Chat</h3>
            <button 
              onClick={() => setIsOpen(false)} 
              className="text-white hover:bg-blue-700 rounded-full w-6 h-6 flex items-center justify-center"
            >
              ×
            </button>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 text-sm">
              {error}
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {isLoading ? (
              <div className="text-center text-gray-500">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>No messages yet</p>
                <p className="text-sm text-gray-400">Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg._id} className={`flex ${msg.senderId._id === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-lg ${getMessageBgColor(msg.senderId._id)}`}>
                    <div className={`text-xs font-semibold ${getRoleColor(msg.senderRole)}`}>
                      {msg.senderName}
                    </div>
                    <div className="text-sm break-words">{msg.message}</div>
                    <div className="text-xs opacity-75">
                      {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={sendMessage} className="p-3 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                maxLength={1000}
                disabled={isSending}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                disabled={isSending || !newMessage.trim()}
              >
                {isSending ? '...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
