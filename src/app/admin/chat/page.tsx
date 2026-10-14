'use client';

import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '@/config/api';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
  MessageSquare,
  Send,
  Search,
  CheckCheck,
  Headset,
  User,
  Clock,
  Volume2,
  VolumeX,
  ChevronDown,
  Paperclip,
  FileText,
  ExternalLink,
  Loader2,
  X,
  Mail,
  Check,
} from 'lucide-react';

interface ChatSession {
  id: string;
  session_id: string;
  customer_name: string;
  customer_email?: string;
  ip_address?: string;
  status: string;
  unread_admin_count: number;
  is_customer_typing: boolean;
  last_message_at: string;
  is_online?: boolean;
  last_active_at?: string;
  messages?: ChatMessage[];
}

interface ChatMessage {
  id: string;
  session_id: string;
  sender_type: 'CUSTOMER' | 'ADMIN' | 'BOT';
  sender_name: string;
  message?: string;
  attachment_url?: string;
  attachment_type?: 'image' | 'file';
  attachment_name?: string;
  created_at: string;
}

function formatLastSeen(lastActive?: string, isOnline?: boolean): string {
  if (isOnline) {
    return 'Active now';
  }
  if (!lastActive) {
    return 'Offline';
  }
  const date = new Date(lastActive);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) {
    return 'Active a few seconds ago';
  }
  if (diffMin < 60) {
    return `Last seen ${diffMin}m ago`;
  }
  if (diffHours < 24) {
    return `Last seen ${diffHours}h ago`;
  }
  if (diffDays === 1) {
    return `Last seen yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  return `Last seen ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export default function AdminChatPage() {
  const token = useSelector((state: RootState) => state.auth.token);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  // Email dispatch option (default OFF as required)
  const [sendEmailCopy, setSendEmailCopy] = useState<boolean>(false);

  // Admin attachment state
  const [adminPendingFile, setAdminPendingFile] = useState<{
    file: File;
    previewUrl: string;
    isImage: boolean;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const prevUnreadTotalRef = useRef<number>(0);
  const activeSessionIdRef = useRef<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAtBottomRef = useRef<boolean>(true);
  const prevMessageCountRef = useRef<number>(0);
  const prevActiveSessionIdRef = useRef<string>('');

  // Keep activeSessionIdRef in sync with activeSessionId
  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  // Track scroll position
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 80;
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

  // Synthesize notification sound using Web Audio API
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Luxury two-tone chime (A5 880Hz -> E6 1318Hz)
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  // Fetch all sessions
  const fetchSessions = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/chat/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: ChatSession[] = await res.json();
        setSessions(data);

        // Calculate total unread
        const currentUnread = data.reduce((acc, s) => acc + (s.unread_admin_count || 0), 0);
        if (currentUnread > prevUnreadTotalRef.current && prevUnreadTotalRef.current !== 0) {
          playNotificationSound();
        }
        prevUnreadTotalRef.current = currentUnread;

        // CRITICAL FIX: Only set initial session if no session is currently selected
        // Using functional state updater ensures stale closures never overwrite the user's active session!
        setActiveSessionId((currentActive) => {
          if (!currentActive && data.length > 0) {
            activeSessionIdRef.current = data[0].session_id;
            return data[0].session_id;
          }
          return currentActive;
        });
      }
    } catch {
      // ignore
    }
  };

  // Fetch active conversation messages
  const fetchActiveMessages = async (sid: string, isInitialLoad = false) => {
    try {
      const res = await fetch(`${API_BASE_URL}/ecommerce/chat/messages/${sid}`);
      if (res.ok) {
        // Discard responses if the user switched to another session in the meantime
        if (activeSessionIdRef.current && activeSessionIdRef.current !== sid) {
          return;
        }
        const data = await res.json();
        setActiveSession(data);
        const incoming = data.messages || [];
        setMessages(incoming);

        if (isInitialLoad) {
          prevMessageCountRef.current = incoming.length;
          setTimeout(() => scrollToBottom('auto'), 60);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleSelectSession = (sid: string) => {
    if (sid === activeSessionIdRef.current) return;
    activeSessionIdRef.current = sid;
    setActiveSessionId(sid);
    setMessages([]);
    fetchActiveMessages(sid, true);
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 3000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (!activeSessionId) return;
    fetchActiveMessages(activeSessionId, true);

    // Mark as read in admin
    if (token) {
      fetch(`${API_BASE_URL}/admin/chat/mark-read/${activeSessionId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }

    const interval = setInterval(() => {
      fetchActiveMessages(activeSessionId, false);
    }, 2500);
    return () => clearInterval(interval);
  }, [activeSessionId, token]);

  // Smart auto-scroll: ONLY when switching session or when new messages arrive while at bottom
  useEffect(() => {
    if (!activeSessionId) return;

    const isDifferentSession = prevActiveSessionIdRef.current !== activeSessionId;
    if (isDifferentSession) {
      prevActiveSessionIdRef.current = activeSessionId;
      prevMessageCountRef.current = messages.length;
      setTimeout(() => scrollToBottom('auto'), 60);
      return;
    }

    const hasNewMessages = messages.length > prevMessageCountRef.current;
    if (hasNewMessages) {
      if (isAtBottomRef.current) {
        scrollToBottom('smooth');
      } else {
        setShowScrollBottomBtn(true);
      }
      prevMessageCountRef.current = messages.length;
    }
  }, [messages, activeSessionId]);

  // Admin typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReplyText(e.target.value);
    if (!activeSessionId || !token) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    } else {
      fetch(`${API_BASE_URL}/admin/chat/typing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ session_id: activeSessionId, is_typing: true }),
      }).catch(() => {});
    }

    typingTimeoutRef.current = setTimeout(() => {
      fetch(`${API_BASE_URL}/admin/chat/typing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ session_id: activeSessionId, is_typing: false }),
      }).catch(() => {});
      typingTimeoutRef.current = null;
    }, 1500);
  };

  // Admin select file
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const previewUrl = isImage ? URL.createObjectURL(file) : '';
    setAdminPendingFile({ file, previewUrl, isImage });
    e.target.value = '';
  };

  const handleRemovePendingFile = () => {
    if (adminPendingFile?.previewUrl) {
      URL.revokeObjectURL(adminPendingFile.previewUrl);
    }
    setAdminPendingFile(null);
  };

  // Admin send reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = replyText.trim();
    if ((!text && !adminPendingFile) || !activeSessionId || !token || sending) return;

    setSending(true);
    try {
      let attachmentUrl = '';
      let attachmentType: 'image' | 'file' = 'file';
      let attachmentName = '';

      if (adminPendingFile) {
        const formData = new FormData();
        formData.append('file', adminPendingFile.file);

        const uploadRes = await fetch(`${API_BASE_URL}/ecommerce/chat/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) throw new Error('Failed to upload file');
        const uploadData = await uploadRes.json();
        attachmentUrl = uploadData.attachment_url;
        attachmentType = uploadData.attachment_type;
        attachmentName = uploadData.attachment_name;
      }

      const res = await fetch(`${API_BASE_URL}/admin/chat/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: activeSessionId,
          message: text,
          attachment_url: attachmentUrl || undefined,
          attachment_type: attachmentType || undefined,
          attachment_name: attachmentName || undefined,
          send_email: sendEmailCopy,
        }),
      });

      if (res.ok) {
        setReplyText('');
        handleRemovePendingFile();
        setTimeout(() => scrollToBottom('smooth'), 50);
        fetchActiveMessages(activeSessionId);
      }
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.customer_name?.toLowerCase().includes(q) ||
      s.customer_email?.toLowerCase().includes(q) ||
      s.session_id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col bg-card text-foreground rounded-xl border border-border overflow-hidden shadow-sm">
      {/* Top Banner */}
      <div className="px-6 py-4 bg-card border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg border border-primary/20">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-foreground">
              Live Concierge & Customer Support
            </h1>
            <p className="text-xs text-muted-foreground">
              Real-time customer inquiries, automated bot responses, and session management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
              soundEnabled
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-muted border-border text-muted-foreground'
            }`}
            title={soundEnabled ? 'Sound alerts enabled' : 'Sound alerts muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
            <span>{soundEnabled ? 'Sound On' : 'Muted'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Sessions List */}
        <div className="w-80 md:w-96 border-r border-border bg-muted/20 flex flex-col">
          {/* Search bar */}
          <div className="p-3 border-b border-border bg-card">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Session Cards */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {filteredSessions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs">
                No active chat conversations found
              </div>
            ) : (
              filteredSessions.map((s) => {
                const isSelected = s.session_id === activeSessionId;
                const unread = s.unread_admin_count || 0;

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSession(s.session_id)}
                    className={`w-full text-left p-3.5 transition flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-primary/10 border-l-4 border-primary'
                        : 'hover:bg-muted/60'
                    }`}
                  >
                    <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-muted border border-border text-primary shrink-0">
                      <User className="w-5 h-5" />
                      {/* Customer Online indicator dot */}
                      {s.is_online ? (
                        <span
                          className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-card rounded-full shadow-sm"
                          title="Customer is Online"
                        />
                      ) : (
                        <span
                          className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-muted-foreground/60 border-2 border-card rounded-full"
                          title={`Offline - ${formatLastSeen(s.last_active_at, false)}`}
                        />
                      )}
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground ring-2 ring-card animate-pulse">
                          {unread}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {s.customer_name || 'Guest Visitor'}
                          </span>
                          {s.is_online && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded-full shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Online
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" />
                          {new Date(s.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {s.customer_email && (
                        <p className="text-xs text-muted-foreground truncate">{s.customer_email}</p>
                      )}

                      <div className="flex items-center justify-between gap-1 text-xs text-muted-foreground mt-1">
                        <p className="truncate text-muted-foreground flex-1">
                          {s.messages && s.messages.length > 0
                            ? s.messages[0].message
                            : 'Chat initiated'}
                        </p>
                        <span className={`text-xs shrink-0 font-medium ${s.is_online ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                          {formatLastSeen(s.last_active_at, s.is_online)}
                        </span>
                      </div>

                      {s.is_customer_typing && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium italic mt-0.5">
                          Typing...
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Conversation Details */}
        {activeSessionId ? (
          <div className="flex-1 flex flex-col bg-background relative">
            {/* Header */}
            <div className="px-6 py-3.5 bg-card border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <span>{activeSession?.customer_name || 'Guest Customer'}</span>
                  {activeSession?.customer_email && (
                    <span className="text-xs text-muted-foreground font-normal">
                      ({activeSession.customer_email})
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span>Session: <code className="text-foreground bg-muted px-1 py-0.5 rounded font-mono">{activeSessionId}</code></span>
                  {activeSession?.ip_address && (
                    <span>IP: {activeSession.ip_address}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Real-time Customer Online / Last Seen Badge */}
                {activeSession?.is_online ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span>Online • Active now</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                    <span>{formatLastSeen(activeSession?.last_active_at, false)}</span>
                  </div>
                )}

                <span className="px-2 py-0.5 bg-muted border border-border text-foreground text-xs rounded-full font-medium">
                  {activeSession?.status || 'ACTIVE'}
                </span>
              </div>
            </div>

            {/* Messages Thread with scroll listener */}
            <div
              ref={chatContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-6 space-y-4 relative bg-background/50"
            >
              {messages.map((m) => {
                const isCustomer = m.sender_type === 'CUSTOMER';
                const isBot = m.sender_type === 'BOT';

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-xs text-muted-foreground">
                      {isBot ? (
                        <>
                          <Headset className="w-3 h-3 text-primary" />
                          <span className="text-primary font-medium">Auto-Assistant Support</span>
                        </>
                      ) : isCustomer ? (
                        <span className="text-muted-foreground font-medium">{m.sender_name} (Customer)</span>
                      ) : (
                        <span className="text-primary font-medium">{m.sender_name} (Admin Reply)</span>
                      )}
                      <span>•</span>
                      <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-sm leading-relaxed space-y-2 ${
                        isCustomer
                          ? 'bg-muted border border-border text-foreground rounded-bl-none'
                          : isBot
                          ? 'bg-primary/10 border border-primary/20 text-foreground rounded-tl-none'
                          : 'bg-primary text-primary-foreground rounded-br-none'
                      }`}
                    >
                      {/* Attachment rendering */}
                      {m.attachment_url && (
                        <div className="overflow-hidden rounded-xl">
                          {m.attachment_type === 'image' ? (
                            <a
                              href={m.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block relative group cursor-pointer"
                              title="Click to view image"
                            >
                              <img
                                src={m.attachment_url}
                                alt={m.attachment_name || 'Attachment'}
                                className="max-h-60 max-w-full rounded-xl object-cover border border-border group-hover:opacity-95 transition"
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
                              className="flex items-center gap-2.5 p-2 bg-muted/80 hover:bg-muted border border-border rounded-xl transition text-inherit cursor-pointer"
                            >
                              <div className="p-1.5 bg-background rounded-lg border border-border">
                                <FileText size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">
                                  {m.attachment_name || 'Attached File'}
                                </p>
                                <span className="text-xs opacity-75">Click to view/download</span>
                              </div>
                            </a>
                          )}
                        </div>
                      )}

                      {m.message && <p>{m.message}</p>}
                    </div>
                  </div>
                );
              })}

              {activeSession?.is_customer_typing && (
                <div className="flex items-center gap-2 text-xs text-primary italic">
                  <span className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                  </span>
                  <span>Customer is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Floating Scroll to Bottom button when scrolled up */}
            {showScrollBottomBtn && (
              <div className="absolute bottom-20 right-8 z-20">
                <button
                  type="button"
                  onClick={() => scrollToBottom('smooth')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-card border border-primary/40 text-foreground hover:bg-muted text-xs font-semibold shadow-xl transition cursor-pointer backdrop-blur-md animate-in fade-in slide-in-from-bottom-2"
                >
                  <ChevronDown size={14} className="animate-bounce" />
                  <span>Scroll to latest</span>
                </button>
              </div>
            )}

            {/* Pending Attachment Preview */}
            {adminPendingFile && (
              <div className="px-4 py-2 bg-card border-t border-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 max-w-[85%]">
                  {adminPendingFile.isImage ? (
                    <img
                      src={adminPendingFile.previewUrl}
                      alt="Preview"
                      className="w-10 h-10 object-cover rounded-lg border border-primary/40"
                    />
                  ) : (
                    <div className="p-2 bg-muted border border-border rounded-lg text-primary">
                      <FileText size={16} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {adminPendingFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(adminPendingFile.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePendingFile}
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                  title="Remove attachment"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Send Email Copy Option (Default OFF) */}
            <div className="px-4 py-2 bg-muted/30 border-t border-border flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground">
                <input
                  type="checkbox"
                  checked={sendEmailCopy}
                  onChange={(e) => setSendEmailCopy(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-border accent-primary cursor-pointer"
                />
                <span className="flex items-center gap-1.5 font-medium">
                  <Mail size={13} className={sendEmailCopy ? 'text-primary' : 'text-muted-foreground'} />
                  <span>Send email copy to customer</span>
                </span>
                {activeSession?.customer_email ? (
                  <span className="text-[11px] text-primary/80 font-mono">
                    ({activeSession.customer_email})
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground/60 italic">
                    (No email on file)
                  </span>
                )}
              </label>
              {sendEmailCopy && activeSession?.customer_email && (
                <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                  <Check size={12} /> Email copy will be sent
                </span>
              )}
            </div>

            {/* Admin Input Bar */}
            <form
              onSubmit={handleSendReply}
              className="p-3 bg-card border-t border-border flex items-center gap-2.5"
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
                disabled={sending}
                className="p-2.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-xl transition cursor-pointer disabled:opacity-40"
                title="Attach photo or file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                type="text"
                placeholder="Type your official response or attach file..."
                value={replyText}
                onChange={handleInputChange}
                className="flex-1 bg-background border border-border text-foreground text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                disabled={sending || (!replyText.trim() && !adminPendingFile)}
                className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-xl transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Send Reply</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-foreground">Select a Conversation</p>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              Select an active customer chat from the left panel to review message history and reply.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
