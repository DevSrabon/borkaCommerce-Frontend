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

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-foreground">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Activity size={20} />
            </div>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Request Logs &amp; Traffic Monitor
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Real-time HTTP traffic logging powered by Winston &amp; PostgreSQL. Analyze latency bottlenecks and inspect sanitized payloads.
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
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
            title="Purge database logs"
          >
            <Trash2 size={13} />
            <span>Clear Logs</span>
          </button>
        </div>
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
                          {new Date(log.created_at).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false,
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
                    <span>{new Date(selectedLog.created_at).toLocaleString()}</span>
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
    </div>
  );
}
