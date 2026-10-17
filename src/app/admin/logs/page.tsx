'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { API_BASE_URL } from '@/config/api';
import AdminPagination from '@/components/admin/AdminPagination';
import {
  Activity,
  Search,
  RefreshCw,
  Clock,
  Gauge,
  AlertTriangle,
  Flame,
  Code,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Filter,
  ArrowUpDown,
  Check,
  Copy,
  Eye,
  Server,
  Zap,
  Globe,
  SlidersHorizontal,
  RotateCcw,
  ShieldCheck,
  Database,
  Layers,
  User,
  Mail,
  CreditCard,
  Send,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface LogItem {
  id: string;
  level: string;
  method: string;
  route: string;
  status_code: number;
  duration_ms: number;
  ip: string | null;
  query: string | null;
  payload: string | null;
  user_agent: string | null;
  error_stack: string | null;
  created_at: string;
}

interface AuditLogItem {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_name?: string | null;
  action: string;
  entity: string | null;
  method: string;
  route: string;
  ip: string | null;
  status?: string | null;
  status_code: number;
  payload: string | null;
  details: string | null;
  created_at: string;
}

interface EmailLogItem {
  id: string;
  to: string;
  cc: string | null;
  bcc: string | null;
  subject: string;
  body_html: string;
  body_text: string | null;
  status: string; // 'SENT' | 'FAILED' | 'PENDING'
  error: string | null;
  attempts: number;
  last_attempt: string;
  created_at: string;
}

interface StripeLogItem {
  id: string;
  event_type: string;
  order_id: string | null;
  customer_id: string | null;
  status: string; // 'SUCCESS' | 'FAILED' | 'PENDING'
  amount: number | null;
  currency: string | null;
  error_code: string | null;
  error_message: string | null;
  request_data: string | null;
  response_data: string | null;
  created_at: string;
}

interface LogStats {
  totalRequests: number;
  avgDurationMs: number;
  maxDurationMs?: number;
  errorRate: number;
  mostExpensiveRoutes: {
    id: string;
    method: string;
    route: string;
    duration_ms: number;
    status_code: number;
    created_at: string;
  }[];
  statusBreakdown: {
    ok: number;
    redirect?: number;
    clientError: number;
    serverError: number;
  };
  methodBreakdown?: {
    GET: number;
    POST: number;
    PATCH: number;
    DELETE: number;
    OTHER: number;
  };
}

export default function AdminLogsPage() {
  const token = useSelector((state: RootState) => state.auth.token);

  const [logs, setLogs] = useState<LogItem[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('ALL');
  const [statusGroup, setStatusGroup] = useState('ALL');
  const [level, setLevel] = useState('ALL');
  const [sort, setSort] = useState('newest'); // 'newest' | 'oldest' | 'slowest' | 'fastest' | 'status_desc' | 'status_asc'
  const [minDuration, setMinDuration] = useState('');
  const [refreshInterval, setRefreshInterval] = useState<number>(0); // 0 = Off (default)

  // Inspector & Clear Modals
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // View Switcher (Traffic vs Audit Trail vs Email Dispatch vs Stripe API)
  const [activeTab, setActiveTab] = useState<'traffic' | 'audit' | 'emails' | 'stripe'>('traffic');

  // Enterprise Audit Trail State (POST, UPDATE, DELETE)
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditAction, setAuditAction] = useState('ALL');
  const [auditEntity, setAuditEntity] = useState('ALL');
  const [auditSearch, setAuditSearch] = useState('');
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogItem | null>(null);
  const [showClearAuditModal, setShowClearAuditModal] = useState(false);
  const [clearingAudit, setClearingAudit] = useState(false);

  // Email Logs State (Detailed To, CC, Subject, Body, Status & Retry)
  const [emailLogs, setEmailLogs] = useState<EmailLogItem[]>([]);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailPage, setEmailPage] = useState(1);
  const [emailTotalPages, setEmailTotalPages] = useState(1);
  const [emailTotal, setEmailTotal] = useState(0);
  const [emailStatus, setEmailStatus] = useState('ALL');
  const [emailSearch, setEmailSearch] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<EmailLogItem | null>(null);
  const [retryingEmailId, setRetryingEmailId] = useState<string | null>(null);
  const [showClearEmailModal, setShowClearEmailModal] = useState(false);
  const [clearingEmail, setClearingEmail] = useState(false);
  const [retryFeedback, setRetryFeedback] = useState<{ id: string; success: boolean; message: string } | null>(null);

  // Stripe Payment Logs State (API, Webhooks, Errors, Payloads)
  const [stripeLogs, setStripeLogs] = useState<StripeLogItem[]>([]);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripePage, setStripePage] = useState(1);
  const [stripeTotalPages, setStripeTotalPages] = useState(1);
  const [stripeTotal, setStripeTotal] = useState(0);
  const [stripeStatus, setStripeStatus] = useState('ALL');
  const [stripeEventType, setStripeEventType] = useState('ALL');
  const [stripeSearch, setStripeSearch] = useState('');
  const [selectedStripeLog, setSelectedStripeLog] = useState<StripeLogItem | null>(null);
  const [showClearStripeModal, setShowClearStripeModal] = useState(false);
  const [clearingStripe, setClearingStripe] = useState(false);

  const fetchAuditLogs = async () => {
    if (!token) return;
    setAuditLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(auditPage));
      params.set('limit', '25');
      if (auditAction !== 'ALL') params.set('action', auditAction);
      if (auditEntity !== 'ALL') params.set('entity', auditEntity);
      if (auditSearch.trim()) params.set('search', auditSearch.trim());

      const res = await fetch(`${API_BASE_URL}/admin/logs/audit?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.items || []);
        setAuditTotal(data.total || 0);
        setAuditTotalPages(data.totalPages || 1);
      }
    } catch (_) {
    } finally {
      setAuditLoading(false);
    }
  };

  const handleClearAuditLogs = async () => {
    if (!token) return;
    setClearingAudit(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/logs/audit`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAuditLogs([]);
        setAuditTotal(0);
        setAuditTotalPages(1);
        setShowClearAuditModal(false);
      }
    } catch (_) {
    } finally {
      setClearingAudit(false);
    }
  };

  const fetchEmailLogs = async () => {
    if (!token) return;
    setEmailLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(emailPage));
      params.set('limit', '25');
      if (emailStatus !== 'ALL') params.set('status', emailStatus);
      if (emailSearch.trim()) params.set('search', emailSearch.trim());

      const res = await fetch(`${API_BASE_URL}/admin/logs/emails?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEmailLogs(data.items || []);
        setEmailTotal(data.total || 0);
        setEmailTotalPages(data.totalPages || 1);
      }
    } catch (_) {
    } finally {
      setEmailLoading(false);
    }
  };

  const handleRetryEmail = async (id: string) => {
    if (!token) return;
    setRetryingEmailId(id);
    setRetryFeedback(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/logs/emails/${id}/retry`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRetryFeedback({
        id,
        success: res.ok && data.success,
        message: data.message || (res.ok ? 'Email re-dispatched successfully!' : 'Email retry failed'),
      });
      setTimeout(() => setRetryFeedback(null), 6000);
      fetchEmailLogs();
    } catch (err: any) {
      setRetryFeedback({ id, success: false, message: err.message || 'Network error on retry' });
      setTimeout(() => setRetryFeedback(null), 6000);
    } finally {
      setRetryingEmailId(null);
    }
  };

  const handleClearEmailLogs = async () => {
    if (!token) return;
    setClearingEmail(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/logs/emails`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setEmailLogs([]);
        setEmailTotal(0);
        setEmailTotalPages(1);
        setShowClearEmailModal(false);
      }
    } catch (_) {
    } finally {
      setClearingEmail(false);
    }
  };

  const fetchStripeLogs = async () => {
    if (!token) return;
    setStripeLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(stripePage));
      params.set('limit', '25');
      if (stripeStatus !== 'ALL') params.set('status', stripeStatus);
      if (stripeEventType !== 'ALL') params.set('event_type', stripeEventType);
      if (stripeSearch.trim()) params.set('search', stripeSearch.trim());

      const res = await fetch(`${API_BASE_URL}/admin/logs/stripe?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStripeLogs(data.items || []);
        setStripeTotal(data.total || 0);
        setStripeTotalPages(data.totalPages || 1);
      }
    } catch (_) {
    } finally {
      setStripeLoading(false);
    }
  };

  const handleClearStripeLogs = async () => {
    if (!token) return;
    setClearingStripe(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/logs/stripe`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setStripeLogs([]);
        setStripeTotal(0);
        setStripeTotalPages(1);
        setShowClearStripeModal(false);
      }
    } catch (_) {
    } finally {
      setClearingStripe(false);
    }
  };

  const fetchStats = async () => {
    if (!token) return;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${API_BASE_URL}/admin/logs/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        setStats(await res.json());
      }
    } catch {
      // Non-blocking warning only
    }
  };

  const fetchLogs = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '25');
      if (search.trim()) params.set('search', search.trim());
      if (method && method !== 'ALL') params.set('method', method);
      if (level && level !== 'ALL') params.set('level', level);
      if (statusGroup && statusGroup !== 'ALL') params.set('status_group', statusGroup);
      if (minDuration) params.set('min_duration', minDuration);
      if (sort) params.set('sort', sort);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${API_BASE_URL}/admin/logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        setLogs(data.items || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
        setFetchError(null);
      } else if (res.status === 401 || res.status === 403) {
        setFetchError('Admin authentication required to view logs.');
      } else {
        setFetchError(`Server returned status ${res.status}`);
      }
    } catch (err: any) {
      setFetchError(
        err?.name === 'AbortError'
          ? 'Log query timed out. Server may be busy.'
          : 'Unable to reach backend server on port 8080.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchLogs();
  }, [token, page, method, statusGroup, level, sort, minDuration]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchLogs();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Initial total counts for tabs
  useEffect(() => {
    if (token) {
      fetchAuditLogs();
      fetchEmailLogs();
      fetchStripeLogs();
    }
  }, [token]);

  // Audit Logs effects
  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab, auditPage, auditAction, auditEntity]);

  useEffect(() => {
    if (activeTab === 'audit') {
      const timer = setTimeout(() => {
        setAuditPage(1);
        fetchAuditLogs();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [auditSearch]);

  // Email Logs effects
  useEffect(() => {
    if (activeTab === 'emails') {
      fetchEmailLogs();
    }
  }, [activeTab, emailPage, emailStatus]);

  useEffect(() => {
    if (activeTab === 'emails') {
      const timer = setTimeout(() => {
        setEmailPage(1);
        fetchEmailLogs();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [emailSearch]);

  // Stripe Logs effects
  useEffect(() => {
    if (activeTab === 'stripe') {
      fetchStripeLogs();
    }
  }, [activeTab, stripePage, stripeStatus, stripeEventType]);

  useEffect(() => {
    if (activeTab === 'stripe') {
      const timer = setTimeout(() => {
        setStripePage(1);
        fetchStripeLogs();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [stripeSearch]);

  // Auto refresh interval (off by default, or 5s, 10s, 30s, 1m, 5m, 10m)
  useEffect(() => {
    if (refreshInterval <= 0 || !token) return;
    const interval = setInterval(() => {
      fetchLogs();
      fetchStats();
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, token, page, method, statusGroup, level, sort, minDuration]);

  const handleClearLogs = async () => {
    if (!token) return;
    setClearing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/logs`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setShowClearModal(false);
        setPage(1);
        fetchLogs();
        fetchStats();
      }
    } catch (err) {
      console.error('Error clearing logs:', err);
    } finally {
      setClearing(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const resetFilters = () => {
    setSearch('');
    setMethod('ALL');
    setStatusGroup('ALL');
    setLevel('ALL');
    setSort('newest');
    setMinDuration('');
    setPage(1);
  };

  const getMethodBadge = (m: string) => {
    switch (m) {
      case 'GET':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
      case 'POST':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'PATCH':
      case 'PUT':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
      case 'DELETE':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/30';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30';
    }
  };

  const getStatusBadge = (code: number) => {
    if (code >= 200 && code < 300) {
      return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
    }
    if (code >= 300 && code < 400) {
      return 'bg-sky-500/10 text-sky-500 border-sky-500/30';
    }
    if (code >= 400 && code < 500) {
      return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
    }
    return 'bg-rose-500/10 text-rose-500 border-rose-500/30';
  };

  const getDurationBadge = (ms: number) => {
    if (ms < 100) return 'text-emerald-500 font-medium';
    if (ms < 400) return 'text-amber-500 font-semibold';
    return 'text-rose-500 font-bold';
  };

  const formatPayload = (raw: string | null) => {
    if (!raw || raw === '{}' || raw === 'null') return null;
    try {
      const parsed = JSON.parse(raw);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return raw;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action?.toUpperCase()) {
      case 'CREATE':
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 font-bold';
      case 'UPDATE':
        return 'border-amber-500/30 bg-amber-500/10 text-amber-500 font-bold';
      case 'DELETE':
        return 'border-rose-500/30 bg-rose-500/10 text-rose-500 font-bold';
      default:
        return 'border-border bg-muted/40 text-muted-foreground font-semibold';
    }
  };

  const formatAuditDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      return `${day}-${month}-${year}, ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-foreground">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              {activeTab === 'traffic' ? (
                <Activity size={20} />
              ) : activeTab === 'audit' ? (
                <ShieldCheck size={20} />
              ) : activeTab === 'emails' ? (
                <Mail size={20} />
              ) : (
                <CreditCard size={20} />
              )}
            </div>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                {activeTab === 'traffic'
                  ? 'Request Logs & Traffic Monitor'
                  : activeTab === 'audit'
                  ? 'Enterprise Audit Trail Logs'
                  : activeTab === 'emails'
                  ? 'Email Dispatch & Retry Logs'
                  : 'Stripe API & Payment Event Logs'}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {activeTab === 'traffic'
                  ? 'Real-time HTTP traffic logging powered by Winston. Analyze latency bottlenecks and inspect request headers.'
                  : activeTab === 'audit'
                  ? 'Immutable security audit trail recording all POST, UPDATE (PATCH/PUT), and DELETE operations with full payloads.'
                  : activeTab === 'emails'
                  ? 'Detailed record of all system dispatched emails with recipient, CC, HTML body preview, error reason, and 1-click retry.'
                  : 'Complete history of all Stripe payment intents, direct card charges, webhooks, and gateway error payloads.'}
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {activeTab === 'traffic' ? (
            <>
              {/* Live Auto-Refresh Selector */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition shadow-xs ${
                  refreshInterval > 0
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground'
                }`}
                title="Auto-refresh interval"
              >
                <RefreshCw
                  size={13}
                  className={`shrink-0 ${refreshInterval > 0 ? 'animate-spin text-emerald-500' : 'text-muted-foreground'}`}
                />
                <span className="font-semibold text-xs whitespace-nowrap">Live:</span>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="bg-transparent font-medium cursor-pointer focus:outline-none text-xs pr-1 text-inherit"
                >
                  <option value={0} className="bg-card text-foreground">Off</option>
                  <option value={5000} className="bg-card text-foreground">5s</option>
                  <option value={10000} className="bg-card text-foreground">10s</option>
                  <option value={30000} className="bg-card text-foreground">30s</option>
                  <option value={60000} className="bg-card text-foreground">1 min</option>
                  <option value={300000} className="bg-card text-foreground">5 min</option>
                  <option value={600000} className="bg-card text-foreground">10 min</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  fetchLogs();
                  fetchStats();
                }}
                className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-accent text-foreground text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                title="Manual refresh"
              >
                <RotateCcw size={13} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => setShowClearModal(true)}
                className="px-3 py-2 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                title="Purge logs"
              >
                <Trash2 size={13} />
                <span>Clear Logs</span>
              </button>
            </>
          ) : activeTab === 'audit' ? (
            <>
              <button
                type="button"
                onClick={fetchAuditLogs}
                className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-accent text-foreground text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                title="Refresh audit logs"
              >
                <RotateCcw size={13} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => setShowClearAuditModal(true)}
                className="px-3 py-2 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                title="Purge audit records"
              >
                <Trash2 size={13} />
                <span>Clear Audit Logs</span>
              </button>
            </>
          ) : activeTab === 'emails' ? (
            <>
              <button
                type="button"
                onClick={fetchEmailLogs}
                className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-accent text-foreground text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                title="Refresh email logs"
              >
                <RotateCcw size={13} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => setShowClearEmailModal(true)}
                className="px-3 py-2 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                title="Clear all email records"
              >
                <Trash2 size={13} />
                <span>Clear Email Logs</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={fetchStripeLogs}
                className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-accent text-foreground text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                title="Refresh Stripe logs"
              >
                <RotateCcw size={13} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => setShowClearStripeModal(true)}
                className="px-3 py-2 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                title="Clear Stripe logs"
              >
                <Trash2 size={13} />
                <span>Clear Stripe Logs</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Top Level Tab Switcher: 4 Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('traffic')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'traffic'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-card hover:bg-accent text-muted-foreground hover:text-foreground border border-border'
          }`}
        >
          <Activity size={15} />
          <span>Request Logs &amp; Traffic</span>
          <span className={`px-2 py-0.5 text-[10px] rounded-full font-mono font-bold ${activeTab === 'traffic' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-card hover:bg-accent text-muted-foreground hover:text-foreground border border-border'
          }`}
        >
          <ShieldCheck size={15} />
          <span>Admin Audit Logs (POST, UPDATE, DELETE)</span>
          <span className={`px-2 py-0.5 text-[10px] rounded-full font-mono font-bold ${activeTab === 'audit' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {auditTotal}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('emails')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'emails'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-card hover:bg-accent text-muted-foreground hover:text-foreground border border-border'
          }`}
        >
          <Mail size={15} />
          <span>Email Dispatch Logs (with Retry)</span>
          <span className={`px-2 py-0.5 text-[10px] rounded-full font-mono font-bold ${activeTab === 'emails' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {emailTotal}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stripe')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'stripe'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-card hover:bg-accent text-muted-foreground hover:text-foreground border border-border'
          }`}
        >
          <CreditCard size={15} />
          <span>Stripe Payment Logs (API &amp; Errors)</span>
          <span className={`px-2 py-0.5 text-[10px] rounded-full font-mono font-bold ${activeTab === 'stripe' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {stripeTotal}
          </span>
        </button>
      </div>

      {/* Network Alert Banner */}
      {fetchError && (
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-foreground text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={16} className="text-amber-500 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setFetchError(null);
              fetchLogs();
              fetchStats();
            }}
            className="px-3 py-1 rounded bg-amber-500 text-zinc-950 font-semibold hover:bg-amber-400 transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Traffic Monitor View */}
      {activeTab === 'traffic' && (
        <div className="space-y-6">
          {/* Analytics KPI Dashboard Cards */}
          {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Logged Requests */}
          <div className="p-4 rounded-xl border border-border bg-card/80 backdrop-blur-sm shadow-xs space-y-1.5">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Total Requests</span>
              <Server size={15} className="text-primary" />
            </div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
              {stats.totalRequests.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              <span>30-Day active retention</span>
            </div>
          </div>

          {/* Card 2: Average Response Time */}
          <div className="p-4 rounded-xl border border-border bg-card/80 backdrop-blur-sm shadow-xs space-y-1.5">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Avg Latency</span>
              <Gauge size={15} className="text-amber-500" />
            </div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
              {stats.avgDurationMs} <span className="text-sm font-sans font-normal text-muted-foreground">ms</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Max: <strong className="text-foreground">{stats.maxDurationMs || 0} ms</strong>
            </div>
          </div>

          {/* Card 3: Error Rate */}
          <div className="p-4 rounded-xl border border-border bg-card/80 backdrop-blur-sm shadow-xs space-y-1.5">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Error Rate</span>
              <AlertTriangle size={15} className={stats.errorRate > 0 ? 'text-rose-500' : 'text-emerald-500'} />
            </div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
              {stats.errorRate}%
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.statusBreakdown.clientError + stats.statusBreakdown.serverError} failed requests (4xx/5xx)
            </div>
          </div>

          {/* Card 4: Top Slowest Route */}
          <div className="p-4 rounded-xl border border-border bg-card/80 backdrop-blur-sm shadow-xs space-y-1.5">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Slowest Route</span>
              <Flame size={15} className="text-rose-500" />
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-rose-500 truncate">
              {stats.mostExpensiveRoutes[0] ? `${stats.mostExpensiveRoutes[0].duration_ms} ms` : 'None'}
            </div>
            <div className="text-xs font-mono text-muted-foreground truncate" title={stats.mostExpensiveRoutes[0]?.route}>
              {stats.mostExpensiveRoutes[0]?.route || 'All endpoints healthy'}
            </div>
          </div>
        </div>
      )}

      {/* HTTP Status & Method Breakdown Strip */}
      {stats && (
        <div className="p-3 sm:p-4 rounded-xl border border-border bg-card/50 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <SlidersHorizontal size={14} className="text-primary" /> Traffic Distribution:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">2xx Success:</span>
              <strong className="text-foreground">{stats.statusBreakdown.ok}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">4xx Client Err:</span>
              <strong className="text-foreground">{stats.statusBreakdown.clientError}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span className="text-muted-foreground">5xx Server Err:</span>
              <strong className="text-foreground">{stats.statusBreakdown.serverError}</strong>
            </div>
          </div>

          {stats.methodBreakdown && (
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-mono font-bold text-xs">
                GET: {stats.methodBreakdown.GET}
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-mono font-bold text-xs">
                POST: {stats.methodBreakdown.POST}
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-mono font-bold text-xs">
                PATCH: {stats.methodBreakdown.PATCH}
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 font-mono font-bold text-xs">
                DEL: {stats.methodBreakdown.DELETE}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl border border-border bg-card/70 space-y-3 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search route, query, payload, client IP, stack trace..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-9 pr-8 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Method Filter */}
          <div className="md:col-span-2">
            <select
              value={method}
              onChange={(e) => {
                setMethod(e.target.value);
                setPage(1);
              }}
              className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-xs sm:text-sm font-medium text-foreground cursor-pointer"
            >
              <option value="ALL">All Methods</option>
              <option value="GET">GET Only</option>
              <option value="POST">POST Only</option>
              <option value="PATCH">PATCH Only</option>
              <option value="PUT">PUT Only</option>
              <option value="DELETE">DELETE Only</option>
            </select>
          </div>

          {/* Status Group Filter */}
          <div className="md:col-span-2">
            <select
              value={statusGroup}
              onChange={(e) => {
                setStatusGroup(e.target.value);
                setPage(1);
              }}
              className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-xs sm:text-sm font-medium text-foreground cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="2xx">2xx Success</option>
              <option value="3xx">3xx Redirect</option>
              <option value="4xx">4xx Client Errors</option>
              <option value="5xx">5xx Server Errors</option>
              <option value="errors">All Errors (4xx/5xx)</option>
            </select>
          </div>

          {/* Sort By Dropdown (User required: asc, desc, slowest, creation) */}
          <div className="md:col-span-3">
            <div className="flex items-center gap-1.5">
              <ArrowUpDown size={14} className="text-muted-foreground shrink-0" />
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-xs sm:text-sm font-semibold text-foreground cursor-pointer"
              >
                <option value="newest">Creation: Desc (Newest)</option>
                <option value="oldest">Creation: Asc (Oldest)</option>
                <option value="slowest">Response Time: Slowest First</option>
                <option value="fastest">Response Time: Fastest First</option>
                <option value="status_desc">Status Code: High to Low</option>
                <option value="status_asc">Status Code: Low to High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Filter Chips & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground font-medium">Quick Filters:</span>
            <button
              type="button"
              onClick={() => {
                setSort('slowest');
                setMinDuration('300');
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-md border text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                sort === 'slowest' && minDuration === '300'
                  ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                  : 'bg-background hover:bg-accent text-foreground border-border'
              }`}
            >
              <Flame size={12} />
              <span>Slowest &gt;300ms</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStatusGroup('errors');
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-md border text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                statusGroup === 'errors'
                  ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                  : 'bg-background hover:bg-accent text-foreground border-border'
              }`}
            >
              <AlertTriangle size={12} />
              <span>Errors Only</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSort(sort === 'oldest' ? 'newest' : 'oldest');
                setPage(1);
              }}
              className="px-2.5 py-1 rounded-md border bg-background hover:bg-accent text-foreground border-border text-xs font-semibold transition cursor-pointer flex items-center gap-1"
            >
              <Clock size={12} />
              <span>{sort === 'oldest' ? 'Oldest (Asc)' : 'Newest (Desc)'}</span>
            </button>
          </div>

          {(search || method !== 'ALL' || statusGroup !== 'ALL' || sort !== 'newest' || minDuration) && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={12} /> Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Request Logs Table */}
      <div className="border border-border rounded-xl overflow-hidden bg-card/80 backdrop-blur-sm shadow-sm">
        {loading && logs.length === 0 ? (
          <div className="p-14 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
            <RefreshCw size={20} className="animate-spin text-primary" />
            <span>Fetching system request logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-14 text-center space-y-2">
            <Activity className="mx-auto text-muted-foreground" size={28} />
            <p className="text-sm font-semibold text-foreground">No logs found matching your criteria</p>
            <p className="text-xs text-muted-foreground">Try clearing active filters or searching a different term.</p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-2 px-3 py-1.5 rounded-md border border-border bg-background hover:bg-accent text-xs font-semibold cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-background/90 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-4">Route &amp; Query</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Response Time</th>
                  <th className="py-3 px-3 hidden lg:table-cell">Client IP</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => {
                  const hasPayload = Boolean(log.payload && log.payload !== '{}' && log.payload !== 'null');
                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-accent/40 transition cursor-pointer group"
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-4 text-xs font-mono text-muted-foreground whitespace-nowrap">
                        <div className="font-semibold text-foreground">
                          {new Date(log.created_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true,
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </td>

                      {/* Method */}
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider border font-mono ${getMethodBadge(log.method)}`}>
                          {log.method}
                        </span>
                      </td>

                      {/* Route & Query */}
                      <td className="py-3 px-4 max-w-sm sm:max-w-md">
                        <div className="font-mono text-xs sm:text-sm font-semibold text-foreground truncate">
                          {log.route}
                        </div>
                        {log.query && (
                          <div className="font-mono text-xs text-muted-foreground truncate">
                            ?{log.query}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-1 rounded text-xs font-bold font-mono border ${getStatusBadge(log.status_code)}`}>
                          {log.status_code}
                        </span>
                      </td>

                      {/* Duration */}
                      <td className={`py-3 px-3 text-right font-mono text-xs sm:text-sm ${getDurationBadge(log.duration_ms)}`}>
                        {log.duration_ms} ms
                      </td>

                      {/* IP */}
                      <td className="py-3 px-3 text-xs font-mono text-muted-foreground hidden lg:table-cell truncate max-w-[130px]">
                        {log.ip || '127.0.0.1'}
                      </td>

                      {/* Single View Action */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-accent hover:text-primary text-foreground text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                          title="Open Full Request Inspector"
                        >
                          <Eye size={13} />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="border-t border-border px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground bg-background/50">
          <div>
            Showing <strong className="text-foreground">{logs.length}</strong> of <strong className="text-foreground">{total}</strong> total recorded requests • Page {page} of {totalPages}
          </div>
          <AdminPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>
      </div>
      )}

      {/* Enterprise Audit Trail View */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Audit Search and Filters Toolbar */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search audit trail by route, operator email, payload content, or details..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              {/* Action Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Action:</span>
                <select
                  value={auditAction}
                  onChange={(e) => {
                    setAuditAction(e.target.value);
                    setAuditPage(1);
                  }}
                  className="px-3 py-2 bg-background border border-border rounded-lg text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Actions</option>
                  <option value="CREATE">CREATE (POST)</option>
                  <option value="UPDATE">UPDATE (PUT/PATCH)</option>
                  <option value="DELETE">DELETE (DELETE)</option>
                </select>
              </div>

              {/* Entity Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Entity:</span>
                <select
                  value={auditEntity}
                  onChange={(e) => {
                    setAuditEntity(e.target.value);
                    setAuditPage(1);
                  }}
                  className="px-3 py-2 bg-background border border-border rounded-lg text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Entities</option>
                  <option value="PRODUCT">Products</option>
                  <option value="ORDER">Orders</option>
                  <option value="CATEGORY">Categories</option>
                  <option value="ATTRIBUTE">Attributes</option>
                  <option value="BANNER">Banners</option>
                  <option value="BLOG">Blogs &amp; Comments</option>
                  <option value="REVIEW">Reviews</option>
                  <option value="SETTINGS">Site Settings</option>
                  <option value="CUSTOMER">Customers</option>
                  <option value="OFFER">Offers</option>
                  <option value="INVENTORY">Inventory</option>
                  <option value="AUTH">Auth</option>
                </select>
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
            {auditLoading ? (
              <div className="p-14 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
                <RefreshCw size={20} className="animate-spin text-primary" />
                <span>Fetching data audit logs...</span>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="p-14 text-center space-y-2">
                <ShieldCheck className="mx-auto text-muted-foreground" size={32} />
                <p className="text-sm font-semibold text-foreground">No audit trail records found</p>
                <p className="text-xs text-muted-foreground">
                  Mutating operations (POST, UPDATE, DELETE) will automatically appear here with full payloads.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-background/90 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="py-3.5 px-4 w-12 text-muted-foreground font-mono">#</th>
                      <th className="py-3.5 px-4">User</th>
                      <th className="py-3.5 px-4">Action Details</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Date &amp; Time</th>
                      <th className="py-3.5 px-4 text-right">Payload</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {auditLogs.map((audit, idx) => {
                      const rowNum = (auditPage - 1) * 25 + idx + 1;
                      const adminName = audit.user_name || 'SABA AL WADI';
                      const initials = adminName
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase() || 'SW';

                      return (
                        <tr
                          key={audit.id}
                          onClick={() => setSelectedAuditLog(audit)}
                          className="hover:bg-accent/40 transition cursor-pointer group"
                        >
                          {/* Row Index */}
                          <td className="py-4 px-4 text-xs font-mono text-muted-foreground font-semibold">
                            {rowNum}
                          </td>

                          {/* User Logo & Name */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full border border-amber-500/40 bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold text-xs shrink-0 tracking-wider shadow-2xs">
                                {initials}
                              </div>
                              <span className="font-semibold text-foreground text-xs sm:text-sm tracking-wide">
                                {adminName}
                              </span>
                            </div>
                          </td>

                          {/* Human-Readable Action Details */}
                          <td className="py-4 px-4 max-w-md lg:max-w-xl">
                            <div className="text-xs sm:text-sm font-normal text-foreground leading-relaxed">
                              {audit.details || `${audit.action} on ${audit.route}`}
                            </div>
                            <div className="flex items-center gap-2 mt-1 font-mono text-[11px] text-muted-foreground">
                              <span className="uppercase font-semibold tracking-wider text-primary/80">
                                {audit.method}
                              </span>
                              <span>•</span>
                              <span className="truncate max-w-[280px]">{audit.route}</span>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              {audit.status || (audit.status_code < 400 ? 'Active' : 'Failed')}
                            </span>
                          </td>

                          {/* Formatted Date & Time */}
                          <td className="py-4 px-4 text-xs text-muted-foreground font-mono whitespace-nowrap">
                            {formatAuditDateTime(audit.created_at)}
                          </td>

                          {/* Payload Button */}
                          <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setSelectedAuditLog(audit)}
                              className="px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-accent hover:text-primary text-foreground text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                              title="Inspect full recorded payload"
                            >
                              <Eye size={13} />
                              <span>Payload</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Audit Pagination */}
            <div className="border-t border-border px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground bg-background/50">
              <div>
                Showing <strong className="text-foreground">{auditLogs.length}</strong> of{' '}
                <strong className="text-foreground">{auditTotal}</strong> total recorded operations • Page{' '}
                {auditPage} of {auditTotalPages}
              </div>
              <AdminPagination
                currentPage={auditPage}
                totalPages={auditTotalPages}
                onPageChange={setAuditPage}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: EMAIL DISPATCH LOGS WITH RETRY & HTML PREVIEW ─── */}
      {activeTab === 'emails' && (
        <div className="space-y-4">
          {/* Retry Feedback Toast */}
          {retryFeedback && (
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in duration-200 ${
                retryFeedback.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
              }`}
            >
              <div className="flex items-center gap-2">
                {retryFeedback.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{retryFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setRetryFeedback(null)}
                className="hover:opacity-75 transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Email Filters Bar */}
          <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  value={emailSearch}
                  onChange={(e) => setEmailSearch(e.target.value)}
                  placeholder="Search recipient email, subject, or error message..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-semibold">Status:</span>
                <select
                  value={emailStatus}
                  onChange={(e) => {
                    setEmailStatus(e.target.value);
                    setEmailPage(1);
                  }}
                  className="px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground cursor-pointer focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SENT">SENT (Delivered)</option>
                  <option value="FAILED">FAILED (Errors)</option>
                  <option value="PENDING">PENDING</option>
                </select>

                {(emailSearch || emailStatus !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmailSearch('');
                      setEmailStatus('ALL');
                      setEmailPage(1);
                    }}
                    className="px-2.5 py-2 text-xs rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Email Logs Table */}
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
            {emailLoading ? (
              <div className="p-12 text-center text-muted-foreground space-y-2">
                <RefreshCw className="animate-spin mx-auto text-primary" size={24} />
                <p className="text-xs">Loading email dispatch history...</p>
              </div>
            ) : emailLogs.length === 0 ? (
              <div className="p-14 text-center space-y-2">
                <Mail className="mx-auto text-muted-foreground" size={32} />
                <p className="text-sm font-semibold text-foreground">No email logs found</p>
                <p className="text-xs text-muted-foreground">
                  All automated emails (OTP, order confirmations, admin notifications, customer chat alerts) will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-background/90 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Recipient (To)</th>
                      <th className="py-3 px-4">Subject Line</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-center">Attempts</th>
                      <th className="py-3 px-4">Error / Reason</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {emailLogs.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedEmail(item)}
                        className="hover:bg-accent/40 transition cursor-pointer group"
                      >
                        {/* Timestamp */}
                        <td className="py-3 px-4 text-xs font-mono text-muted-foreground whitespace-nowrap">
                          <div className="font-semibold text-foreground">
                            {new Date(item.created_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: true,
                            })}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                        </td>

                        {/* Recipient */}
                        <td className="py-3 px-4 max-w-[200px]">
                          <div className="font-mono text-xs font-bold text-foreground truncate">
                            {item.to}
                          </div>
                          {item.cc && (
                            <div className="text-[11px] text-muted-foreground truncate font-mono">
                              CC: {item.cc}
                            </div>
                          )}
                        </td>

                        {/* Subject */}
                        <td className="py-3 px-4 max-w-xs sm:max-w-md">
                          <div className="font-medium text-foreground truncate">
                            {item.subject}
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold font-mono border inline-flex items-center gap-1 ${
                              item.status === 'SENT'
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                : item.status === 'FAILED'
                                ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                                : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                            }`}
                          >
                            {item.status === 'SENT' ? (
                              <CheckCircle2 size={12} />
                            ) : item.status === 'FAILED' ? (
                              <AlertCircle size={12} />
                            ) : (
                              <Clock size={12} />
                            )}
                            <span>{item.status}</span>
                          </span>
                        </td>

                        {/* Attempts */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-accent text-muted-foreground border border-border">
                            {item.attempts} {item.attempts === 1 ? 'try' : 'tries'}
                          </span>
                        </td>

                        {/* Error Reason */}
                        <td className="py-3 px-4 max-w-xs">
                          {item.error ? (
                            <div className="text-xs text-rose-500 font-mono truncate" title={item.error}>
                              {item.error}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">None (Delivered)</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {/* Retry Send Button */}
                            <button
                              type="button"
                              onClick={() => handleRetryEmail(item.id)}
                              disabled={retryingEmailId === item.id}
                              className="px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                              title="Re-send email via SMTP"
                            >
                              <RotateCcw
                                size={12}
                                className={retryingEmailId === item.id ? 'animate-spin' : ''}
                              />
                              <span>{retryingEmailId === item.id ? 'Sending...' : 'Retry'}</span>
                            </button>

                            {/* View / Inspect Email Button */}
                            <button
                              type="button"
                              onClick={() => setSelectedEmail(item)}
                              className="px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-accent hover:text-primary text-foreground text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                              title="Inspect email body & headers"
                            >
                              <Eye size={12} />
                              <span>View</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Email Pagination */}
            <div className="border-t border-border px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground bg-background/50">
              <div>
                Showing <strong className="text-foreground">{emailLogs.length}</strong> of{' '}
                <strong className="text-foreground">{emailTotal}</strong> total dispatched emails • Page{' '}
                {emailPage} of {emailTotalPages}
              </div>
              <AdminPagination
                currentPage={emailPage}
                totalPages={emailTotalPages}
                onPageChange={setEmailPage}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: STRIPE PAYMENT & API LOGS ─── */}
      {activeTab === 'stripe' && (
        <div className="space-y-4">
          {/* Stripe Filters Bar */}
          <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  value={stripeSearch}
                  onChange={(e) => setStripeSearch(e.target.value)}
                  placeholder="Search by order ID, event type, error code or message..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              {/* Status Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground font-semibold">Status:</span>
                <select
                  value={stripeStatus}
                  onChange={(e) => {
                    setStripeStatus(e.target.value);
                    setStripePage(1);
                  }}
                  className="px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground cursor-pointer focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SUCCESS">SUCCESS</option>
                  <option value="FAILED">FAILED</option>
                </select>

                <span className="text-xs text-muted-foreground font-semibold ml-1">Event:</span>
                <select
                  value={stripeEventType}
                  onChange={(e) => {
                    setStripeEventType(e.target.value);
                    setStripePage(1);
                  }}
                  className="px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground cursor-pointer focus:outline-none"
                >
                  <option value="ALL">All Event Types</option>
                  <option value="CREATE_PAYMENT_INTENT">CREATE_PAYMENT_INTENT</option>
                  <option value="CONFIRM_DIRECT_CARD">CONFIRM_DIRECT_CARD</option>
                  <option value="CONFIRM_PAYMENT_INTENT">CONFIRM_PAYMENT_INTENT</option>
                  <option value="WEBHOOK_PAYMENT_INTENT_SUCCEEDED">WEBHOOK: succeeded</option>
                  <option value="WEBHOOK_PAYMENT_INTENT_PAYMENT_FAILED">WEBHOOK: failed</option>
                  <option value="WEBHOOK_EVENT">WEBHOOK_EVENT</option>
                </select>

                {(stripeSearch || stripeStatus !== 'ALL' || stripeEventType !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setStripeSearch('');
                      setStripeStatus('ALL');
                      setStripeEventType('ALL');
                      setStripePage(1);
                    }}
                    className="px-2.5 py-2 text-xs rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stripe Logs Table */}
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
            {stripeLoading ? (
              <div className="p-12 text-center text-muted-foreground space-y-2">
                <RefreshCw className="animate-spin mx-auto text-primary" size={24} />
                <p className="text-xs">Loading Stripe API and payment records...</p>
              </div>
            ) : stripeLogs.length === 0 ? (
              <div className="p-14 text-center space-y-2">
                <CreditCard className="mx-auto text-muted-foreground" size={32} />
                <p className="text-sm font-semibold text-foreground">No Stripe logs found</p>
                <p className="text-xs text-muted-foreground">
                  Stripe PaymentIntents, direct credit card charges, webhook callbacks, and errors will automatically appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-background/90 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Event Type</th>
                      <th className="py-3 px-4">Order ID / #</th>
                      <th className="py-3 px-3 text-center">Amount</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4">Error Code / Details</th>
                      <th className="py-3 px-4 text-right">Payload</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stripeLogs.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedStripeLog(item)}
                        className="hover:bg-accent/40 transition cursor-pointer group"
                      >
                        {/* Timestamp */}
                        <td className="py-3 px-4 text-xs font-mono text-muted-foreground whitespace-nowrap">
                          <div className="font-semibold text-foreground">
                            {new Date(item.created_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: true,
                            })}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                        </td>

                        {/* Event Type */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded text-xs font-bold font-mono border bg-primary/10 text-primary border-primary/20">
                            {item.event_type}
                          </span>
                        </td>

                        {/* Order ID */}
                        <td className="py-3 px-4 font-mono text-xs text-foreground truncate max-w-[180px]">
                          {item.order_id ? (
                            <span className="font-semibold">{item.order_id}</span>
                          ) : (
                            <span className="text-muted-foreground italic">None</span>
                          )}
                        </td>

                        {/* Amount & Currency */}
                        <td className="py-3 px-3 text-center whitespace-nowrap font-mono text-xs font-bold text-foreground">
                          {item.amount !== null && item.amount !== undefined ? (
                            <span>
                              {item.currency || 'AED'} {Number(item.amount).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground font-normal">—</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold font-mono border inline-flex items-center gap-1 ${
                              item.status === 'SUCCESS'
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                            }`}
                          >
                            {item.status === 'SUCCESS' ? (
                              <CheckCircle2 size={12} />
                            ) : (
                              <AlertCircle size={12} />
                            )}
                            <span>{item.status}</span>
                          </span>
                        </td>

                        {/* Error Code & Message */}
                        <td className="py-3 px-4 max-w-xs">
                          {item.error_message || item.error_code ? (
                            <div className="text-xs text-rose-500 font-mono truncate" title={item.error_message || ''}>
                              <strong className="uppercase">{item.error_code || 'ERROR'}: </strong>
                              {item.error_message}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic font-sans">Payment / Call Verified</span>
                          )}
                        </td>

                        {/* Payload Button */}
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setSelectedStripeLog(item)}
                            className="px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-accent hover:text-primary text-foreground text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                            title="Inspect Stripe request and response"
                          >
                            <Eye size={12} />
                            <span>Payload</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Stripe Pagination */}
            <div className="border-t border-border px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground bg-background/50">
              <div>
                Showing <strong className="text-foreground">{stripeLogs.length}</strong> of{' '}
                <strong className="text-foreground">{stripeTotal}</strong> total recorded Stripe events • Page{' '}
                {stripePage} of {stripeTotalPages}
              </div>
              <AdminPagination
                currentPage={stripePage}
                totalPages={stripeTotalPages}
                onPageChange={setStripePage}
              />
            </div>
          </div>
        </div>
      )}

      {/* SINGLE VIEW MODAL (Inspect All Details) */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-foreground">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-5 sm:px-6 py-4 bg-background">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider border font-mono ${getMethodBadge(selectedLog.method)}`}>
                  {selectedLog.method}
                </span>
                <div>
                  <h3 className="font-mono text-sm sm:text-base font-bold text-foreground">
                    {selectedLog.route}
                  </h3>
                  <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2 mt-0.5">
                    <span className={`font-mono font-bold ${getStatusBadge(selectedLog.status_code)} px-1.5 py-0.2 rounded border`}>
                      HTTP {selectedLog.status_code}
                    </span>
                    <span>•</span>
                    <span>Latency: <strong className={getDurationBadge(selectedLog.duration_ms)}>{selectedLog.duration_ms} ms</strong></span>
                    <span>•</span>
                    <span>{new Date(selectedLog.created_at).toLocaleString('en-US', { hour12: true })}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition cursor-pointer"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs sm:text-sm font-mono bg-background/40">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                  <span className="text-xs font-semibold uppercase text-muted-foreground block">Client IP Address</span>
                  <p className="font-mono font-bold text-foreground text-sm">{selectedLog.ip || '127.0.0.1'}</p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                  <span className="text-xs font-semibold uppercase text-muted-foreground block">Log Level</span>
                  <p className="font-mono font-bold uppercase text-foreground text-sm">{selectedLog.level}</p>
                </div>
              </div>

              {/* User Agent */}
              <div className="font-sans">
                <span className="text-xs font-semibold uppercase text-muted-foreground block mb-1.5">
                  Client User-Agent
                </span>
                <div className="p-3 rounded-lg border border-border bg-card font-mono text-xs text-foreground break-all">
                  {selectedLog.user_agent || 'Not provided'}
                </div>
              </div>

              {/* Query Parameters */}
              <div className="font-sans">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold uppercase text-muted-foreground block">
                    URL Query Parameters
                  </span>
                  {selectedLog.query && (
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedLog.query || '', 'query')}
                      className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                    >
                      {copiedKey === 'query' ? <Check size={12} /> : <Copy size={12} />}
                      {copiedKey === 'query' ? 'Copied' : 'Copy Query'}
                    </button>
                  )}
                </div>
                <div className="p-3 rounded-lg border border-border bg-card font-mono text-xs text-foreground break-all">
                  {selectedLog.query ? `?${selectedLog.query}` : <span className="text-muted-foreground italic font-sans">No query string attached to this request</span>}
                </div>
              </div>

              {/* Request Payload / Body */}
              <div className="font-sans">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold uppercase text-muted-foreground block">
                    Sanitized Request Body (JSON)
                  </span>
                  {selectedLog.payload && (
                    <button
                      type="button"
                      onClick={() => handleCopy(formatPayload(selectedLog.payload) || '', 'payload')}
                      className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                    >
                      {copiedKey === 'payload' ? <Check size={12} /> : <Copy size={12} />}
                      {copiedKey === 'payload' ? 'Copied' : 'Copy JSON'}
                    </button>
                  )}
                </div>
                <div className="p-3.5 rounded-lg border border-border bg-card text-foreground overflow-x-auto">
                  {selectedLog.payload && selectedLog.payload !== '{}' && selectedLog.payload !== 'null' ? (
                    <pre className="text-xs text-emerald-500 whitespace-pre-wrap font-mono leading-relaxed">
                      {formatPayload(selectedLog.payload)}
                    </pre>
                  ) : (
                    <span className="text-muted-foreground italic font-sans text-xs">
                      No request payload body was submitted with this request.
                    </span>
                  )}
                </div>
              </div>

              {/* Error Stack Trace (if exists) */}
              {selectedLog.error_stack && (
                <div className="font-sans">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold uppercase text-rose-500 block flex items-center gap-1">
                      <AlertTriangle size={13} /> Error Stack Trace
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedLog.error_stack || '', 'stack')}
                      className="text-xs text-rose-500 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                    >
                      {copiedKey === 'stack' ? <Check size={12} /> : <Copy size={12} />}
                      {copiedKey === 'stack' ? 'Copied' : 'Copy Stack Trace'}
                    </button>
                  </div>
                  <pre className="p-3.5 rounded-lg border border-rose-500/30 bg-rose-950/20 text-rose-400 text-xs overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                    {selectedLog.error_stack}
                  </pre>
                </div>
              )}

              {/* Raw Winston Log Export */}
              <div className="font-sans pt-2 border-t border-border">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold uppercase text-muted-foreground block">
                    Raw Winston Log Format
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(JSON.stringify(selectedLog, null, 2), 'raw')}
                    className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    {copiedKey === 'raw' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedKey === 'raw' ? 'Copied' : 'Copy Raw Record'}
                  </button>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card font-mono text-xs text-muted-foreground overflow-x-auto">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(selectedLog, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border px-5 sm:px-6 py-3 bg-background flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-accent text-xs font-semibold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR LOGS CONFIRMATION MODAL */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 text-foreground">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-foreground">Purge System Request Logs</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to clear all request records from the database?
              Note: Winston rotating log files on the backend disk will continue to be safely retained for 30 days.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                disabled={clearing}
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-accent text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={clearing}
                onClick={handleClearLogs}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {clearing ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>{clearing ? 'Clearing...' : 'Confirm & Clear All Logs'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT LOG PAYLOAD INSPECTOR MODAL */}
      {selectedAuditLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-foreground">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-5 sm:px-6 py-4 bg-background">
              <div className="flex items-center gap-3">
                <span
                  className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider border font-mono ${getActionBadge(
                    selectedAuditLog.action,
                  )}`}
                >
                  {selectedAuditLog.action}
                </span>
                <div>
                  <h3 className="font-mono text-sm sm:text-base font-bold text-foreground">
                    {selectedAuditLog.route}
                  </h3>
                  <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2 mt-0.5">
                    <span
                      className={`font-mono font-bold ${getStatusBadge(
                        selectedAuditLog.status_code,
                      )} px-1.5 py-0.2 rounded border`}
                    >
                      HTTP {selectedAuditLog.status_code}
                    </span>
                    <span>•</span>
                    <span>
                      Method: <strong className="text-foreground">{selectedAuditLog.method}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(selectedAuditLog.created_at).toLocaleString('en-US', { hour12: true })}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAuditLog(null)}
                className="p-1.5 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition cursor-pointer"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs sm:text-sm font-mono bg-background/40">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans">
                <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                  <span className="text-xs font-semibold uppercase text-muted-foreground block">
                    Operator User
                  </span>
                  <p className="font-mono font-bold text-foreground text-xs truncate">
                    {selectedAuditLog.user_email || 'System / Client'}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                  <span className="text-xs font-semibold uppercase text-muted-foreground block">
                    Target Entity
                  </span>
                  <p className="font-mono font-bold uppercase text-primary text-xs">
                    {selectedAuditLog.entity || 'SYSTEM'}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                  <span className="text-xs font-semibold uppercase text-muted-foreground block">
                    Client IP Address
                  </span>
                  <p className="font-mono font-bold text-foreground text-xs">
                    {selectedAuditLog.ip || '127.0.0.1'}
                  </p>
                </div>
              </div>

              {/* Recorded Payload / Body */}
              <div className="font-sans">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold uppercase text-muted-foreground block">
                    Recorded Operation Payload (JSON)
                  </span>
                  {selectedAuditLog.payload && (
                    <button
                      type="button"
                      onClick={() => handleCopy(formatPayload(selectedAuditLog.payload) || '', 'audit_payload')}
                      className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                    >
                      {copiedKey === 'audit_payload' ? <Check size={12} /> : <Copy size={12} />}
                      {copiedKey === 'audit_payload' ? 'Copied' : 'Copy JSON Payload'}
                    </button>
                  )}
                </div>
                <div className="p-3.5 rounded-lg border border-border bg-card text-foreground overflow-x-auto">
                  {selectedAuditLog.payload &&
                  selectedAuditLog.payload !== '{}' &&
                  selectedAuditLog.payload !== 'null' ? (
                    <pre className="text-xs text-emerald-500 whitespace-pre-wrap font-mono leading-relaxed">
                      {formatPayload(selectedAuditLog.payload)}
                    </pre>
                  ) : (
                    <span className="text-muted-foreground italic font-sans text-xs">
                      No request payload body was attached with this mutation.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border px-6 py-3 bg-background flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedAuditLog(null)}
                className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent text-xs font-semibold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR AUDIT LOGS CONFIRMATION MODAL */}
      {showClearAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 text-foreground">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-foreground">Purge Audit Trail Records</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to permanently clear all recorded audit trail mutations from the database?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                disabled={clearingAudit}
                onClick={() => setShowClearAuditModal(false)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-accent text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={clearingAudit}
                onClick={handleClearAuditLogs}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {clearingAudit ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>{clearingAudit ? 'Purging...' : 'Confirm & Clear Audit Logs'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── EMAIL LOG INSPECTOR & HTML PREVIEW MODAL ─── */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-foreground">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-5 sm:px-6 py-4 bg-background">
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    selectedEmail.status === 'SENT'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-rose-500/10 text-rose-500'
                  }`}
                >
                  <Mail size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-foreground truncate">
                    {selectedEmail.subject}
                  </h3>
                  <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2 mt-0.5">
                    <span
                      className={`px-1.5 py-0.2 rounded font-mono font-bold text-xs border ${
                        selectedEmail.status === 'SENT'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                      }`}
                    >
                      {selectedEmail.status}
                    </span>
                    <span>•</span>
                    <span>To: <strong className="text-foreground">{selectedEmail.to}</strong></span>
                    {selectedEmail.cc && (
                      <>
                        <span>•</span>
                        <span>CC: <strong className="text-foreground">{selectedEmail.cc}</strong></span>
                      </>
                    )}
                    <span>•</span>
                    <span>{new Date(selectedEmail.created_at).toLocaleString('en-US', { hour12: true })}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEmail(null)}
                className="p-1.5 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition cursor-pointer shrink-0"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-background/40">
              {/* Meta Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                  <span className="font-semibold text-muted-foreground uppercase text-[10px] block">
                    Recipient (To)
                  </span>
                  <p className="font-mono font-bold text-foreground truncate">{selectedEmail.to}</p>
                </div>

                <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                  <span className="font-semibold text-muted-foreground uppercase text-[10px] block">
                    Carbon Copy (CC)
                  </span>
                  <p className="font-mono text-foreground truncate">{selectedEmail.cc || 'None'}</p>
                </div>

                <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                  <span className="font-semibold text-muted-foreground uppercase text-[10px] block">
                    Total Attempts
                  </span>
                  <p className="font-mono font-bold text-foreground">
                    {selectedEmail.attempts} {selectedEmail.attempts === 1 ? 'attempt' : 'attempts'}
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                  <span className="font-semibold text-muted-foreground uppercase text-[10px] block">
                    Last Dispatched
                  </span>
                  <p className="font-mono text-foreground truncate">
                    {selectedEmail.last_attempt
                      ? new Date(selectedEmail.last_attempt).toLocaleTimeString('en-US', { hour12: true })
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Error Callout (if failed) */}
              {selectedEmail.error && (
                <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 space-y-1 text-xs">
                  <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px]">
                    <AlertCircle size={15} />
                    <span>Dispatch Error Stack</span>
                  </div>
                  <pre className="font-mono whitespace-pre-wrap leading-relaxed text-rose-400">
                    {selectedEmail.error}
                  </pre>
                </div>
              )}

              {/* HTML Body Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>Rendered Email Body (Preview)</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedEmail.body_html, 'email_html')}
                    className="text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'email_html' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedKey === 'email_html' ? 'Copied' : 'Copy HTML'}</span>
                  </button>
                </div>
                <div className="rounded-xl border border-border overflow-hidden bg-white shadow-inner">
                  <iframe
                    title="Rendered Email HTML"
                    srcDoc={selectedEmail.body_html}
                    className="w-full h-96 border-none"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border px-5 sm:px-6 py-3 bg-background flex items-center justify-between">
              <div className="text-xs text-muted-foreground font-mono">
                Log ID: {selectedEmail.id}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedEmail(null)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-accent text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await handleRetryEmail(selectedEmail.id);
                  }}
                  disabled={retryingEmailId === selectedEmail.id}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:brightness-110 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <RotateCcw
                    size={13}
                    className={retryingEmailId === selectedEmail.id ? 'animate-spin' : ''}
                  />
                  <span>{retryingEmailId === selectedEmail.id ? 'Dispatching...' : 'Retry Dispatch Now'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── STRIPE EVENT PAYLOAD INSPECTOR MODAL ─── */}
      {selectedStripeLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-foreground">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-5 sm:px-6 py-4 bg-background">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    selectedStripeLog.status === 'SUCCESS'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-rose-500/10 text-rose-500'
                  }`}
                >
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 className="font-mono text-sm sm:text-base font-bold text-foreground">
                    {selectedStripeLog.event_type}
                  </h3>
                  <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2 mt-0.5">
                    <span
                      className={`px-1.5 py-0.2 rounded font-mono font-bold text-xs border ${
                        selectedStripeLog.status === 'SUCCESS'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                      }`}
                    >
                      {selectedStripeLog.status}
                    </span>
                    {selectedStripeLog.amount !== null && (
                      <>
                        <span>•</span>
                        <span>
                          Amount:{' '}
                          <strong className="text-foreground">
                            {selectedStripeLog.currency || 'AED'}{' '}
                            {Number(selectedStripeLog.amount).toFixed(2)}
                          </strong>
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span>
                      {new Date(selectedStripeLog.created_at).toLocaleString('en-US', { hour12: true })}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStripeLog(null)}
                className="p-1.5 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition cursor-pointer"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-background/40">
              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                  <span className="font-semibold text-muted-foreground uppercase text-[10px] block">
                    Order ID
                  </span>
                  <p className="font-mono font-bold text-foreground truncate">
                    {selectedStripeLog.order_id || 'N/A'}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                  <span className="font-semibold text-muted-foreground uppercase text-[10px] block">
                    Customer ID
                  </span>
                  <p className="font-mono text-foreground truncate">
                    {selectedStripeLog.customer_id || 'N/A'}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                  <span className="font-semibold text-muted-foreground uppercase text-[10px] block">
                    Gateway Status
                  </span>
                  <p className="font-mono font-bold text-foreground">
                    {selectedStripeLog.status}
                  </p>
                </div>
              </div>

              {/* Error Banner */}
              {(selectedStripeLog.error_message || selectedStripeLog.error_code) && (
                <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 space-y-1 text-xs">
                  <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px]">
                    <AlertCircle size={15} />
                    <span>Stripe Error: {selectedStripeLog.error_code || 'DECLINED'}</span>
                  </div>
                  <p className="font-mono leading-relaxed text-rose-400">
                    {selectedStripeLog.error_message}
                  </p>
                </div>
              )}

              {/* Request Data JSON */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>Outbound Request Data (Sanitized JSON)</span>
                  {selectedStripeLog.request_data && (
                    <button
                      type="button"
                      onClick={() => handleCopy(formatPayload(selectedStripeLog.request_data) || '', 'stripe_req')}
                      className="text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'stripe_req' ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedKey === 'stripe_req' ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                  )}
                </div>
                <div className="p-3.5 rounded-lg border border-border bg-card overflow-x-auto">
                  {selectedStripeLog.request_data ? (
                    <pre className="text-xs font-mono text-emerald-500 whitespace-pre-wrap leading-relaxed">
                      {formatPayload(selectedStripeLog.request_data)}
                    </pre>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No request data payload logged</span>
                  )}
                </div>
              </div>

              {/* Response Data JSON */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>Stripe API Response Data (JSON)</span>
                  {selectedStripeLog.response_data && (
                    <button
                      type="button"
                      onClick={() => handleCopy(formatPayload(selectedStripeLog.response_data) || '', 'stripe_res')}
                      className="text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'stripe_res' ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedKey === 'stripe_res' ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                  )}
                </div>
                <div className="p-3.5 rounded-lg border border-border bg-card overflow-x-auto">
                  {selectedStripeLog.response_data ? (
                    <pre className="text-xs font-mono text-sky-400 whitespace-pre-wrap leading-relaxed">
                      {formatPayload(selectedStripeLog.response_data)}
                    </pre>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No response data payload logged</span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border px-5 sm:px-6 py-3 bg-background flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-mono">
                Log ID: {selectedStripeLog.id}
              </span>
              <button
                type="button"
                onClick={() => setSelectedStripeLog(null)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-accent text-xs font-semibold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CLEAR EMAIL LOGS CONFIRMATION MODAL ─── */}
      {showClearEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 text-foreground">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-foreground">Clear Email Dispatch History</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete all recorded email dispatch and retry logs from the database?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                disabled={clearingEmail}
                onClick={() => setShowClearEmailModal(false)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-accent text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={clearingEmail}
                onClick={handleClearEmailLogs}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {clearingEmail ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>{clearingEmail ? 'Clearing...' : 'Confirm & Clear Email Logs'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CLEAR STRIPE LOGS CONFIRMATION MODAL ─── */}
      {showClearStripeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 text-foreground">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-foreground">Clear Stripe Payment Logs</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to permanently remove all recorded Stripe API calls, PaymentIntents, and error logs from the database?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                disabled={clearingStripe}
                onClick={() => setShowClearStripeModal(false)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-accent text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={clearingStripe}
                onClick={handleClearStripeLogs}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {clearingStripe ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>{clearingStripe ? 'Clearing...' : 'Confirm & Clear Stripe Logs'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
