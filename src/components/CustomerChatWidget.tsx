'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { API_BASE_URL } from '@/config/api';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
  MessageSquare,
  X,
  Send,
  Headset,
  UserCheck,
  ShieldCheck,
  ChevronDown,
  Paperclip,
  FileText,
  Loader2,
  ExternalLink,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender_type: 'CUSTOMER' | 'ADMIN' | 'BOT';
  sender_name: string;
  message?: string;
  attachment_url?: string;
  attachment_type?: 'image' | 'file';
  attachment_name?: string;
  created_at: string;
}

export default function CustomerChatWidget() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rateLimitError, setRateLimitError] = useState('');
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  // Attachment state
  const [pendingFile, setPendingFile] = useState<{
    file: File;
    previewUrl: string;
    isImage: boolean;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = useSelector((state: RootState) => state.auth.user);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAtBottomRef = useRef<boolean>(true);
  const prevMessageCountRef = useRef<number>(0);
  const prevIsOpenRef = useRef<boolean>(false);

  // Initialize or load session from localStorage
  useEffect(() => {
    let currentSession = localStorage.getItem('saba_chat_session_id');
    if (!currentSession) {
      currentSession = 'sess_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
      localStorage.setItem('saba_chat_session_id', currentSession);
    }
    setSessionId(currentSession);
  }, []);

  // Listen for open-support-chat custom event to open chat with prefilled order details
  useEffect(() => {
    const handleOpenChat = (event: any) => {
      setIsOpen(true);
      if (event?.detail?.text) {
        setInputMessage(event.detail.text);
      }
    };

    window.addEventListener('open-support-chat', handleOpenChat);
    return () => {
      window.removeEventListener('open-support-chat', handleOpenChat);
    };
  }, []);

  // Track user scroll position
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 75;
    isAtBottomRef.current = isNearBottom;
    setShowScrollBottomBtn(!isNearBottom);
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior,
      });
    }
    isAtBottomRef.current = true;
    setShowScrollBottomBtn(false);
  };

  // Fetch session & message history
  const fetchMessages = async (sid: string) => {
    if (!sid) return;
    try {
      const res = await fetch(`${API_BASE_URL}/ecommerce/chat/messages/${sid}?role=customer`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setIsAdminTyping(Boolean(data.is_admin_typing));
        if (!isOpen && data.unread_customer_count > 0) {
          setUnreadCount(data.unread_customer_count);
        }
      } else if (res.status === 404) {
        await initSession(sid);
      }
    } catch {
      // ignore network errors
    }
  };

  const initSession = async (sid: string) => {
    try {
      const customerName = user ? `${user.first_name} ${user.last_name}` : undefined;
      const customerEmail = user ? user.email : undefined;
      const res = await fetch(`${API_BASE_URL}/ecommerce/chat/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sid,
          customer_name: customerName,
          customer_email: customerEmail,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {
      // ignore
    }
  };

  // Heartbeat to keep customer presence active
  useEffect(() => {
    if (!sessionId) return;
    const sendHeartbeat = () => {
      fetch(`${API_BASE_URL}/ecommerce/chat/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      }).catch(() => {});
    };

    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 20000);
    return () => clearInterval(heartbeatInterval);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    fetchMessages(sessionId);

    // Poll every 2.5 seconds
    const interval = setInterval(() => {
      fetchMessages(sessionId);
    }, 2500);

    return () => clearInterval(interval);
  }, [sessionId, isOpen]);

  // Smart auto-scroll: ONLY when new messages arrive and user was already at the bottom
  useEffect(() => {
    if (!isOpen) {
      prevIsOpenRef.current = false;
      return;
    }

    const wasJustOpened = !prevIsOpenRef.current && isOpen;
    prevIsOpenRef.current = true;

    // 1. First time opening the widget -> scroll to bottom
    if (wasJustOpened) {
      setTimeout(() => scrollToBottom('auto'), 50);
      prevMessageCountRef.current = messages.length;
      return;
    }

    // 2. Only if message count actually increased
    const hasNewMessages = messages.length > prevMessageCountRef.current;
    if (hasNewMessages) {
      if (isAtBottomRef.current) {
        scrollToBottom('smooth');
      } else {
        setShowScrollBottomBtn(true);
      }
      prevMessageCountRef.current = messages.length;
    }
  }, [messages, isOpen]);

  // Clear unread on open
  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && sessionId) {
      setUnreadCount(0);
      fetch(`${API_BASE_URL}/ecommerce/chat/mark-read/${sessionId}`, { method: 'POST' }).catch(() => {});
    }
  };

  // Customer typing notification
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    if (!sessionId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    } else {
      fetch(`${API_BASE_URL}/ecommerce/chat/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, is_typing: true }),
      }).catch(() => {});
    }

    typingTimeoutRef.current = setTimeout(() => {
      fetch(`${API_BASE_URL}/ecommerce/chat/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, is_typing: false }),
      }).catch(() => {});
      typingTimeoutRef.current = null;
    }, 1500);
  };

  // Select attachment file
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setRateLimitError('File size exceeds 10MB limit.');
      return;
    }
    const isImage = file.type.startsWith('image/');
    const previewUrl = isImage ? URL.createObjectURL(file) : '';
    setPendingFile({ file, previewUrl, isImage });
    e.target.value = '';
  };

  const handleRemovePendingFile = () => {
    if (pendingFile?.previewUrl) {
      URL.revokeObjectURL(pendingFile.previewUrl);
    }
    setPendingFile(null);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputMessage.trim();
    if ((!text && !pendingFile) || !sessionId || loading) return;

    setLoading(true);
    setRateLimitError('');

    try {
      let attachmentUrl = '';
      let attachmentType: 'image' | 'file' = 'file';
      let attachmentName = '';

      // 1. Upload pending attachment if exists
      if (pendingFile) {
        const formData = new FormData();
        formData.append('file', pendingFile.file);

        const uploadRes = await fetch(`${API_BASE_URL}/ecommerce/chat/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error('Failed to upload attachment. Please try again.');
        }

        const uploadData = await uploadRes.json();
        attachmentUrl = uploadData.attachment_url;
        attachmentType = uploadData.attachment_type;
        attachmentName = uploadData.attachment_name;
      }

      // 2. Send message with attachment data
      const customerName = user ? `${user.first_name} ${user.last_name}` : 'Guest Visitor';
      const res = await fetch(`${API_BASE_URL}/ecommerce/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: text,
          sender_name: customerName,
          attachment_url: attachmentUrl || undefined,
          attachment_type: attachmentType || undefined,
          attachment_name: attachmentName || undefined,
        }),
      });

      if (res.ok) {
        setInputMessage('');
        handleRemovePendingFile();
        setTimeout(() => scrollToBottom('smooth'), 50);
        fetchMessages(sessionId);
      } else if (res.status === 429) {
        setRateLimitError('Rate limit exceeded. Please wait a moment before sending more messages.');
      } else {
        const err = await res.json();
        setRateLimitError(err.message || 'Failed to send message.');
      }
    } catch (err: any) {
      setRateLimitError(err.message || 'Connection issue. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={handleToggle}
          className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-full shadow-2xl transition transform hover:scale-105 cursor-pointer border border-amber-400/30"
          aria-label="Open luxury live concierge chat"
        >
          <MessageSquare className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white shadow ring-2 ring-background animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Expanded Chat Box */}
      {isOpen && (
        <div className="flex flex-col w-[360px] sm:w-[400px] h-[540px] bg-stone-950 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/40 border-b border-stone-800 text-white">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <Headset className="w-4 h-4" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-stone-900" />
              </div>
              <div>
                <h3 className="text-xs font-serif font-bold tracking-wide text-amber-300">
                  Saba Al Wadi Concierge
                </h3>
                <p className="text-xs text-stone-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 inline" />
                  Luxury Stylist &amp; Customer Support
                </p>
              </div>
            </div>
            <button
              onClick={handleToggle}
              className="p-1 rounded-md text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container with scroll listener */}
          <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-stone-950/90 text-xs relative"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-stone-500 p-6 space-y-2">
                <Headset className="w-8 h-8 text-amber-500/50 animate-pulse" />
                <p className="text-xs text-stone-300 font-serif">Welcome to Saba Al Wadi</p>
                <p className="text-xs text-stone-500">
                  Our private client advisors are available to guide your bespoke abaya inquiries.
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const isCustomer = m.sender_type === 'CUSTOMER';
                const isBot = m.sender_type === 'BOT';

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-xs text-stone-500">
                      {isBot ? (
                        <>
                          <Headset className="w-3 h-3 text-amber-400" />
                          <span className="text-amber-400 font-medium">Customer Support</span>
                        </>
                      ) : isCustomer ? (
                        <span>You</span>
                      ) : (
                        <>
                          <UserCheck className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 font-medium">{m.sender_name}</span>
                        </>
                      )}
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm text-xs leading-relaxed space-y-2 ${
                        isCustomer
                          ? 'bg-amber-600 text-white rounded-br-none'
                          : isBot
                          ? 'bg-stone-900 border border-amber-900/40 text-stone-200 rounded-bl-none'
                          : 'bg-stone-800 border border-emerald-900/40 text-stone-100 rounded-bl-none'
                      }`}
                    >
                      {/* Attachment Rendering */}
                      {m.attachment_url && (
                        <div className="overflow-hidden rounded-xl">
                          {m.attachment_type === 'image' ? (
                            <a
                              href={m.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block relative group cursor-pointer"
                              title="Click to view full image"
                            >
                              <img
                                src={m.attachment_url}
                                alt={m.attachment_name || 'Attachment'}
                                className="max-h-52 max-w-full rounded-xl object-cover border border-white/10 group-hover:opacity-95 transition"
                              />
                              <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-white px-1.5 py-0.5 rounded text-xs opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                                <ExternalLink size={10} /> View
                              </span>
                            </a>
                          ) : (
                            <a
                              href={m.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={m.attachment_name || 'attachment'}
                              className="flex items-center gap-2.5 p-2 bg-black/30 hover:bg-black/50 border border-white/10 rounded-xl transition text-inherit cursor-pointer"
                            >
                              <div className="p-1.5 bg-white/10 rounded-lg">
                                <FileText size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">
                                  {m.attachment_name || 'Attached Document'}
                                </p>
                                <span className="text-xs opacity-75">Click to view/download</span>
                              </div>
                            </a>
                          )}
                        </div>
                      )}

                      {/* Text message content */}
                      {m.message && <p>{m.message}</p>}
                    </div>
                  </div>
                );
              })
            )}

            {/* Admin typing indicator */}
            {isAdminTyping && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 italic">
                <span className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
                </span>
                <span>Advisor is typing...</span>
              </div>
            )}

            {rateLimitError && (
              <div className="p-2 text-xs bg-red-950/80 border border-red-800 text-red-200 rounded-md text-center">
                {rateLimitError}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Floating Scroll to Bottom button when scrolled up */}
          {showScrollBottomBtn && (
            <div className="absolute bottom-16 right-4 z-20">
              <button
                type="button"
                onClick={() => scrollToBottom('smooth')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900/95 border border-amber-500/50 text-amber-300 hover:text-amber-200 text-xs font-semibold shadow-xl transition cursor-pointer backdrop-blur-md animate-in fade-in slide-in-from-bottom-2"
              >
                <ChevronDown size={14} className="animate-bounce" />
                <span>Latest messages</span>
              </button>
            </div>
          )}

          {/* Pending attachment preview */}
          {pendingFile && (
            <div className="px-3 pt-2 bg-stone-900/95 border-t border-stone-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 max-w-[85%]">
                {pendingFile.isImage ? (
                  <img
                    src={pendingFile.previewUrl}
                    alt="Preview"
                    className="w-10 h-10 object-cover rounded-lg border border-amber-500/40"
                  />
                ) : (
                  <div className="p-2 bg-stone-800 border border-stone-700 rounded-lg text-amber-400">
                    <FileText size={16} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-stone-200 truncate">
                    {pendingFile.file.name}
                  </p>
                  <p className="text-xs text-stone-500">
                    {(pendingFile.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemovePendingFile}
                className="p-1 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
                title="Remove attachment"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Input Footer */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-stone-900/90 border-t border-stone-800 flex items-center gap-2"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.txt"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="p-2.5 text-stone-400 hover:text-amber-400 hover:bg-stone-800/80 rounded-xl transition cursor-pointer disabled:opacity-40"
              title="Attach photo or document (max 10MB)"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              placeholder="Ask about size, delivery, or attach photo..."
              maxLength={400}
              className="flex-1 bg-stone-950 border border-stone-800 text-stone-100 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500/80 transition placeholder:text-stone-600"
            />
            <button
              type="submit"
              disabled={loading || (!inputMessage.trim() && !pendingFile)}
              className="p-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md flex items-center justify-center"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
