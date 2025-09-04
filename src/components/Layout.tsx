'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Users, LogOut, User, MessageCircle, Globe } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import Avatar from '@/components/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface LayoutProps {
  title: string;
  children: React.ReactNode;
  user: any;
  onLogout: () => void;
}

interface ChatMessage {
  _id: string;
  senderId: {
    _id: string;
    name: string;
    role: string;
  } | string;
  senderRole: string;
  senderName: string;
  message: string;
  timestamp: string;
}

const Layout: React.FC<LayoutProps> = ({ title, children, user, onLogout }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { token } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef<number>(0);

  const startPolling = () => {
    if (pollIntervalRef.current) return;
    pollIntervalRef.current = setInterval(fetchMessages, 3000);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const fetchMessages = async () => {
    if (!token || !user) return;
    
    setError(null);
    const wasLoading = isLoading;
    if (!wasLoading) setIsLoading(true);
    
    try {
      const res = await fetch('/api/chat/messages', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        cache: 'no-store'
      });
      
      if (res.status === 401) {
        setError('Session expired. Please login again.');
        return;
      }
      
      if (!res.ok) {
        throw new Error(`Failed to fetch messages: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.messages) {
        // Check if there are new messages
        if (data.messages.length > lastMessageCountRef.current && lastMessageCountRef.current > 0 && !isChatOpen) {
          setUnreadCount(prev => prev + (data.messages.length - lastMessageCountRef.current));
        }
        lastMessageCountRef.current = data.messages.length;
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Fetch messages failed', err);
      setError('Failed to load messages. Please try again.');
    } finally {
      if (!wasLoading) setIsLoading(false);
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || isSending || !token || !user) return;

    setIsSending(true);
    setError(null);
    
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: newMessage }),
      });

      if (res.status === 401) {
        setError('Session expired. Please login again.');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
        // Force immediate fetch to get any other new messages
        fetchMessages();
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Send message error', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    setUnreadCount(0); // reset notifications when opened
  };

  useEffect(() => {
    if (!token || !user) return;
    if (isChatOpen) {
      fetchMessages();
      startPolling();
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [token, user, isChatOpen]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else if (isChatOpen) {
        startPolling();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isChatOpen]);

  useEffect(() => {
    if (isChatOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'text-red-600 font-bold';
      case 'admin': return 'text-blue-600 font-semibold';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      {/* Header */}
      <header className="bg-white dark:bg-gray-950 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-indigo-600" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <div className="flex items-center text-gray-700 dark:text-gray-200">
                <Avatar src={user.avatarUrl} updatedAt={user.avatarUpdatedAt} name={user.name} size={28} className="mr-2" />
                <span>{user.name}</span>
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 capitalize">({user.role})</span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center text-gray-700 dark:text-gray-200 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-gray-900 dark:text-gray-100">
        {children}
      </main>

      {/* Floating Chat Button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-all"
      >
        <Globe className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isChatOpen && (
        <div className="fixed bottom-20 right-6 w-96 h-[500px] bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl shadow-lg flex flex-col">
          <div className="bg-indigo-600 text-white p-3 flex justify-between items-center rounded-t-xl">
            <span className="font-bold">Global Chat</span>
            <button onClick={toggleChat} className="hover:bg-indigo-700 rounded-full h-6 w-6 flex items-center justify-center">✖</button>
          </div>
          
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50 dark:bg-gray-950"
          >
            {isLoading && messages.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <p className="text-red-500 mb-2">{error}</p>
                <button 
                  onClick={fetchMessages}
                  className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                >
                  Try again
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                <p className="text-4xl mb-2">😊</p>
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <>
                {messages.map((msg, index) => {
                  const isCurrentUser = typeof msg.senderId === 'object' 
                    ? msg.senderId?._id === user._id 
                    : msg.senderId === user._id;
                  
                  const prevMsg = index > 0 ? messages[index - 1] : null;
                  const prevSenderId = prevMsg ? (typeof prevMsg.senderId === 'object' ? prevMsg.senderId?._id : prevMsg.senderId) : null;
                  const currentSenderId = typeof msg.senderId === 'object' ? msg.senderId?._id : msg.senderId;
                  const showSenderName = prevSenderId !== currentSenderId;
                  
                  return (
                    <div 
                      key={msg._id} 
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] ${isCurrentUser ? 'bg-indigo-100' : 'bg-white dark:bg-gray-800'} p-3 rounded-lg shadow-sm
                        ${isCurrentUser ? 'rounded-tr-none' : 'rounded-tl-none'}`}
                      >
                        {!isCurrentUser && showSenderName && (
                          <div className="flex items-center mb-1">
                            <Avatar 
                              src={(msg as any).senderId?.avatarUrl}
                              updatedAt={(msg as any).senderId?.avatarUpdatedAt}
                              name={msg.senderName}
                              size={18}
                              className="mr-2"
                            />
                            <div className={`text-xs ${getRoleColor(msg.senderRole).replace('font-bold','font-semibold')}`}>
                              {msg.senderName}
                            </div>
                          </div>
                        )}
                        <div className="whitespace-pre-wrap break-words text-sm">
                          {msg.message}
                        </div>
                        <div className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${isCurrentUser ? 'text-right' : ''}`}>
                          {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          
          <form onSubmit={sendMessage} className="p-3 border-t dark:border-gray-800 flex">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border dark:border-gray-700 dark:bg-gray-900 rounded-l-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              disabled={isSending}
            />
            <button 
              type="button"
              onClick={sendMessage}
              disabled={isSending || !newMessage.trim()}
              className={`${
                isSending ? 'bg-indigo-400' : newMessage.trim() ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-300'
              } text-white px-4 rounded-r-lg transition-colors`}
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Layout;
