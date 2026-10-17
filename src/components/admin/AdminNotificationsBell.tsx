'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { API_BASE_URL } from '@/config/api';
import { io, Socket } from 'socket.io-client';
import { useModal } from '@/components/common/LuxuryModal';
import {
  Bell,
  Volume2,
  VolumeX,
  Smartphone,
  Check,
  CheckCheck,
  Trash2,
  ShoppingBag,
  Star,
  MessageSquare,
  ExternalLink,
  X,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'ORDER' | 'REVIEW' | 'BLOG_COMMENT' | string;
  title: string;
  message: string;
  link?: string | null;
  is_read: boolean;
  metadata?: any;
  created_at: string;
}

export default function AdminNotificationsBell() {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);
  const { showAlert } = useModal();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'ORDER' | 'REVIEW' | 'BLOG_COMMENT'>('ALL');
  const [loading, setLoading] = useState(false);

  // Sound & Push Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef<number>(0);
  const isInitialLoad = useRef<boolean>(true);

  // Initialize Sound & Push preferences from localStorage
  useEffect(() => {
    try {
      const storedSound = localStorage.getItem('admin_notif_sound');
      if (storedSound !== null) {
        setSoundEnabled(storedSound === 'true');
      }
      const storedPush = localStorage.getItem('admin_notif_push');
      if (storedPush !== null && typeof window !== 'undefined' && 'Notification' in window) {
        setPushEnabled(storedPush === 'true' && Notification.permission === 'granted');
      }
    } catch (_) {}
  }, []);

  // Web Audio API Synthesized Luxury Notification Chime
  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Note 1: High crisp ping (880Hz - A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      gain1.gain.setValueAtTime(0.18, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.45);

      // Note 2: Harmonic luxury bell (1320Hz - E6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.12);
      gain2.gain.setValueAtTime(0.22, ctx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.65);
    } catch (_) {}
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('admin_notif_sound', String(next));
    if (next) {
      playNotificationChime();
    }
  };

  const togglePush = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      if (typeof showAlert === 'function') {
        showAlert('Browser Push Notifications are not supported in this browser.', 'Browser Alert', 'warning');
      }
      return;
    }

    if (!pushEnabled) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPushEnabled(true);
        localStorage.setItem('admin_notif_push', 'true');
        new Notification('Notifications Enabled', {
          body: 'You will receive desktop alerts for new orders, reviews, and blog comments.',
          icon: '/favicon.ico',
        });
      } else {
        if (typeof showAlert === 'function') {
          showAlert('Permission for notifications was denied in browser settings.', 'Permission Required', 'error');
        }
      }
    } else {
      setPushEnabled(false);
      localStorage.setItem('admin_notif_push', 'false');
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/notifications?limit=60`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const items: NotificationItem[] = data.items || [];
        const unread: number = data.unread_count || 0;

        setNotifications(items);
        setUnreadCount(unread);

        // Check if there are newly arrived unread notifications
        if (!isInitialLoad.current && unread > prevUnreadRef.current) {
          if (soundEnabled) {
            playNotificationChime();
          }

          if (pushEnabled && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            const latest = items[0];
            if (latest) {
              new Notification(latest.title, {
                body: latest.message,
                icon: '/favicon.ico',
              });
            }
          }
        }

        prevUnreadRef.current = unread;
        isInitialLoad.current = false;
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, [token, soundEnabled, pushEnabled]);

  // Real-Time Socket.IO Notification Stream
  useEffect(() => {
    let socket: Socket | null = null;
    try {
      socket = io(API_BASE_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
      });

      socket.on('connect', () => {
        socket?.emit('join_admin');
      });

      socket.on('admin_notification', (newNotif: NotificationItem) => {
        if (!newNotif) return;
        setNotifications((prev) => {
          if (prev.some((n) => n.id === newNotif.id)) return prev;
          return [newNotif, ...prev];
        });
        setUnreadCount((c) => c + 1);

        if (soundEnabled) {
          playNotificationChime();
        }

        if (pushEnabled && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(newNotif.title, {
            body: newNotif.message,
            icon: '/favicon.ico',
          });
        }
      });

      socket.on('admin_unread_count', (data: { unread_count: number }) => {
        if (typeof data?.unread_count === 'number') {
          setUnreadCount(data.unread_count);
        }
      });
    } catch (_) {}

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [soundEnabled, pushEnabled]);

  // Click outside to close panel
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/admin/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (_) {}
  };

  const handleMarkAllAsRead = async () => {
    if (!token) return;
    setLoading(true);
    try {
      await fetch(`${API_BASE_URL}/admin/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (_) {}
    finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!token || !confirm('Are you sure you want to clear all notifications?')) return;
    setLoading(true);
    try {
      await fetch(`${API_BASE_URL}/admin/notifications/clear-all`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch (_) {}
    finally {
      setLoading(false);
    }
  };

  const handleDeleteOne = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/admin/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const target = notifications.find((n) => n.id === id);
      if (target && !target.is_read) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (_) {}
  };

  const handleItemClick = (item: NotificationItem) => {
    if (!item.is_read) {
      handleMarkAsRead(item.id);
    }
    setIsOpen(false);
    if (item.link) {
      router.push(item.link);
    }
  };

  const filteredItems = notifications.filter((item) => {
    if (filter === 'UNREAD') return !item.is_read;
    if (filter === 'ORDER') return item.type === 'ORDER';
    if (filter === 'REVIEW') return item.type === 'REVIEW';
    if (filter === 'BLOG_COMMENT') return item.type === 'BLOG_COMMENT';
    return true;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ORDER':
        return <ShoppingBag size={14} className="text-emerald-500" />;
      case 'REVIEW':
        return <Star size={14} className="text-amber-500 fill-amber-500/20" />;
      case 'BLOG_COMMENT':
        return <MessageSquare size={14} className="text-sky-500" />;
      default:
        return <Bell size={14} className="text-primary" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-AE', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Admin Notifications"
        className="relative inline-flex items-center justify-center w-8 h-8 rounded-full border border-border bg-background hover:bg-accent text-foreground transition shadow-xs cursor-pointer"
        aria-label="Open notifications"
      >
        <Bell size={15} className={`transition-transform ${unreadCount > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[10px] font-bold font-mono text-white bg-rose-600 rounded-full border border-background shadow-xs animate-in zoom-in-50">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Drawer / Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[340px] sm:w-[420px] max-w-[94vw] bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 text-xs flex flex-col">
          {/* Header */}
          <div className="p-3.5 border-b border-border bg-muted/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-sm text-foreground flex items-center gap-1.5">
                <Bell size={15} className="text-primary" /> Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
                  {unreadCount} new
                </span>
              )}
            </div>

            {/* Sound & Push Toggles */}
            <div className="flex items-center gap-1">
              {/* Sound Toggle */}
              <button
                type="button"
                onClick={toggleSound}
                className={`p-1.5 rounded-md border text-xs transition cursor-pointer flex items-center gap-1 ${
                  soundEnabled
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500 font-semibold'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
                title={soundEnabled ? 'Sound alerts ON (Click to mute)' : 'Sound alerts OFF (Click to unmute)'}
              >
                {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                <span className="text-[10px] hidden sm:inline">{soundEnabled ? 'Sound' : 'Mute'}</span>
              </button>

              {/* Push Toggle */}
              <button
                type="button"
                onClick={togglePush}
                className={`p-1.5 rounded-md border text-xs transition cursor-pointer flex items-center gap-1 ${
                  pushEnabled
                    ? 'border-primary/40 bg-primary/10 text-primary font-semibold'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
                title={pushEnabled ? 'Push notifications ON' : 'Push notifications OFF (Click to enable)'}
              >
                <Smartphone size={13} />
                <span className="text-[10px] hidden sm:inline">{pushEnabled ? 'Push' : 'Push'}</span>
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition cursor-pointer ml-1"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Filter Bar & Bulk Actions */}
          <div className="px-3 py-2 border-b border-border/60 bg-background/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
              {(['ALL', 'UNREAD', 'ORDER', 'REVIEW', 'BLOG_COMMENT'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer whitespace-nowrap ${
                    filter === tab
                      ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {tab === 'ALL'
                    ? 'All'
                    : tab === 'UNREAD'
                    ? `Unread (${unreadCount})`
                    : tab === 'ORDER'
                    ? 'Orders'
                    : tab === 'REVIEW'
                    ? 'Reviews'
                    : 'Comments'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                  className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer text-[10px]"
                  title="Mark all as read"
                >
                  <CheckCheck size={11} /> Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={loading}
                  className="text-rose-500 hover:underline font-semibold flex items-center gap-1 cursor-pointer text-[10px]"
                  title="Clear all notifications"
                >
                  <Trash2 size={11} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Notifications Scroll List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border/40 bg-card">
            {filteredItems.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground space-y-2">
                <Bell size={24} className="mx-auto text-muted-foreground/40" />
                <p className="font-medium text-foreground">No notifications</p>
                <p className="text-[11px]">New orders, reviews, and blog comments will appear here in real-time.</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-3 transition cursor-pointer flex items-start gap-3 relative group ${
                    item.is_read
                      ? 'hover:bg-muted/30 text-muted-foreground'
                      : 'bg-primary/5 hover:bg-primary/10 text-foreground'
                  }`}
                >
                  {/* Type Icon Badge */}
                  <div
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                      item.type === 'ORDER'
                        ? 'border-emerald-500/30 bg-emerald-500/10'
                        : item.type === 'REVIEW'
                        ? 'border-amber-500/30 bg-amber-500/10'
                        : item.type === 'BLOG_COMMENT'
                        ? 'border-sky-500/30 bg-sky-500/10'
                        : 'border-primary/30 bg-primary/10'
                    }`}
                  >
                    {getTypeIcon(item.type)}
                  </div>

                  {/* Body Content */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className={`text-xs truncate ${item.is_read ? 'font-medium text-foreground/85' : 'font-bold text-foreground'}`}>
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                        {formatTime(item.created_at)}
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed line-clamp-2 ${item.is_read ? 'text-muted-foreground' : 'text-foreground/90 font-normal'}`}>
                      {item.message}
                    </p>
                  </div>

                  {/* Quick Action Buttons on Hover */}
                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    {!item.is_read && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(item.id, e)}
                        className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer"
                        title="Mark as read"
                      >
                        <Check size={12} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteOne(item.id, e)}
                      className="p-1 rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                      title="Delete notification"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {/* Unread dot */}
                  {!item.is_read && (
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer status */}
          <div className="p-2 border-t border-border bg-muted/20 text-center text-[10px] text-muted-foreground flex items-center justify-between px-3">
            <span>Offline emails &amp; real-time alerts active</span>
            <button
              type="button"
              onClick={playNotificationChime}
              className="text-primary hover:underline font-semibold cursor-pointer"
            >
              Test Chime 🔔
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
