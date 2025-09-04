'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '@/components/Avatar';

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
}

export default function GlobalChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, token } = useAuth();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef<number>(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [pendingNewCount, setPendingNewCount] = useState(0);
  const prevScrollTopRef = useRef<number>(0);

  // Polling removed – chat uses manual refresh and fetch on open

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
        const newCount = data.messages.length - lastMessageCountRef.current;
        if (newCount > 0 && lastMessageCountRef.current > 0) {
          if (!isOpen) {
            setUnreadCount(prev => prev + newCount);
          } else if (!isAtBottom) {
            setPendingNewCount(prev => prev + newCount);
          }
        }
        // Freeze scroll position before updating messages
        const el = chatContainerRef.current;
        if (el) {
          prevScrollTopRef.current = el.scrollTop;
        }
        lastMessageCountRef.current = data.messages.length;
        setMessages(data.messages);
        // Restore previous scrollTop after DOM updates
        requestAnimationFrame(() => {
          const container = chatContainerRef.current;
          if (container) {
            container.scrollTop = prevScrollTopRef.current;
          }
        });
      }
    } catch (err) {
      console.error('Fetch messages failed', err);
      setError('Failed to load messages. Please try again.');
    } finally {
      if (!wasLoading) setIsLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
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
        // Freeze scroll position before appending
        const el = chatContainerRef.current;
        if (el) {
          prevScrollTopRef.current = el.scrollTop;
        }
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
        // Restore previous scrollTop after DOM updates
        requestAnimationFrame(() => {
          const container = chatContainerRef.current;
          if (container) {
            container.scrollTop = prevScrollTopRef.current;
          }
        });
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

  const handleOpenChat = () => {
    setIsOpen(true);
    setUnreadCount(0);
    setPendingNewCount(0);
    // Removed setIsAtBottom(true);
    // One-time fetch when opening the chat
    fetchMessages();
  };

  // Removed polling and visibility-driven polling

  useEffect(() => {
    if (!isOpen) return;
    const el = chatContainerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const threshold = 4;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
      setIsAtBottom(atBottom);
      if (atBottom && pendingNewCount > 0) {
        setPendingNewCount(0);
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => el.removeEventListener('scroll', handleScroll);
  }, [isOpen, pendingNewCount]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'text-red-600 font-bold';
      case 'admin': return 'text-blue-600 font-semibold';
      default: return 'text-gray-600';
    }
  };

  return (
    <>
      <button
        onClick={handleOpenChat}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 z-50 flex items-center justify-center"
      >
        <img src="/globe.svg" alt="Chat" className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-4 w-96 h-[500px] bg-white rounded-lg shadow-xl flex flex-col z-50 border">
          <div className="bg-blue-600 text-white p-3 flex justify-between items-center rounded-t-lg">
            <div className="flex items-center">
              <img src="/globe.svg" alt="Global" className="w-5 h-5 mr-2" />
              <span className="font-medium">Organization Chat</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchMessages}
                className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                title="Refresh messages"
              >
                Refresh
              </button>
              <button onClick={() => setIsOpen(false)} className="text-xl font-bold hover:bg-blue-700 w-6 h-6 flex items-center justify-center rounded">×</button>
            </div>
          </div>
          
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50 relative">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                {error}
                <button 
                  onClick={fetchMessages} 
                  className="ml-2 text-xs underline text-red-700 hover:text-red-800"
                >
                  Try again
                </button>
              </div>
            )}
            
            {isLoading && messages.length === 0 && (
              <div className="flex justify-center py-4">
                <div className="animate-pulse text-gray-500 text-center text-sm">Loading messages...</div>
              </div>
            )}
            
            {!isLoading && messages.length === 0 && !error && (
              <div className="text-gray-500 text-center py-10">
                <div className="text-4xl mb-2">💬</div>
                <div>No messages yet</div>
                <div className="text-sm mt-1">Be the first to send a message!</div>
              </div>
            )}
            
            {messages.map((msg, index) => {
              const isCurrentUser = (typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId) === user?.id;
              const showSender = index === 0 || 
                (messages[index-1]?.senderId?._id !== msg.senderId?._id && 
                 messages[index-1]?.senderId !== msg.senderId);
              
              return (
                <div key={msg._id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-lg ${
                    isCurrentUser 
                      ? 'bg-blue-500 text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
                  }`}>
                    {!isCurrentUser && showSender && (
                      <div className="flex items-center mb-1">
                        <Avatar 
                          src={(msg as any).senderId?.avatarUrl}
                          updatedAt={(msg as any).senderId?.avatarUpdatedAt}
                          name={msg.senderName}
                          size={18}
                          className="mr-2"
                        />
                        <div className={`text-xs font-semibold ${getRoleColor(msg.senderRole)}`}>
                          {msg.senderName}
                        </div>
                      </div>
                    )}
                    <div className="text-sm whitespace-pre-wrap break-words">{msg.message}</div>
                    <div className={`text-xs ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'} text-right mt-1`}>
                      {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              );
            })}
            {/*
              Removed the jump-to-latest button here since it scrolls on click
              If you want to keep it but without scroll, uncomment and keep button without scroll logic
            */}
            {/* !isAtBottom && pendingNewCount > 0 && (
              <button
                type="button"
                onClick={() => { setPendingNewCount(0); }}
                className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-blue-600 text-white text-xs shadow hover:bg-blue-700"
              >
                {pendingNewCount} new message{pendingNewCount > 1 ? 's' : ''} • Jump to latest
              </button>
            ) */}
          </div>
          
          <form onSubmit={sendMessage} className="p-3 border-t flex space-x-2 bg-white">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={isSending || !newMessage.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center"
            >
              {isSending ? (
                <span className="inline-block animate-pulse">Sending...</span>
              ) : (
                <span>Send</span>
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
