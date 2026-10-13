'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { API_BASE_URL } from '@/config/api';
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
    clientError: number;
    serverError: number;
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
  const [status, setStatus] = useState('');
  const [mostExpensive, setMostExpensive] = useState(false);
  const [minDuration, setMinDuration] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Inspector Modal
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);

  const fetchStats = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/logs/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (err) {
      console.error('Failed to load log stats:', err);
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
      if (status) params.set('status', status);
      if (mostExpensive) params.set('most_expensive', 'true');
      if (minDuration) params.set('min_duration', minDuration);

      const res = await fetch(`${API_BASE_URL}/admin/logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.items || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchLogs();
  }, [token, page, method, status, mostExpensive, minDuration]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchLogs();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Auto refresh every 6 seconds
  useEffect(() => {
    if (!autoRefresh || !token) return;
    const interval = setInterval(() => {
      fetchLogs();
      fetchStats();
    }, 6000);
    return () => clearInterval(interval);
  }, [autoRefresh, token, page, method, status, mostExpensive, minDuration]);

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to clear system logs from the database? (Winston log files on disk will be preserved for 30 days)')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/logs`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchLogs();
        fetchStats();
      }
    } catch (err) {
      console.error('Error clearing logs:', err);
    }
  };

  const getMethodBadge = (m: string) => {
    switch (m) {
      case 'GET':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'POST':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'PATCH':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'DELETE':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const getStatusBadge = (code: number) => {
    if (code >= 200 && code < 300) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
    if (code >= 400 && code < 500) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
    return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  };

  const getDurationBadge = (ms: number) => {
    if (ms < 100) return 'text-emerald-400 font-medium';
    if (ms < 500) return 'text-amber-400 font-semibold';
    return 'text-rose-400 font-bold';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Activity className="text-primary" size={26} />
              System Request Logger
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Winston 30-Day Retained
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time HTTP traffic monitoring, bottleneck duration analysis, query parameters, and sanitized payloads.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
              autoRefresh
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-card text-muted-foreground border-border'
            }`}
          >
            <RefreshCw size={12} className={autoRefresh ? 'animate-spin' : ''} />
            <span>{autoRefresh ? 'Live Stream: ON' : 'Live Stream: OFF'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              fetchLogs();
              fetchStats();
            }}
            className="p-2 rounded border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition cursor-pointer"
            title="Refresh Logs"
          >
            <RefreshCw size={14} />
          </button>
          <button
            type="button"
            onClick={handleClearLogs}
            className="p-2 rounded border border-border hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition cursor-pointer"
            title="Purge Database Logs"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Analytics KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-sm shadow-sm space-y-1">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Total Logged</span>
              <Activity size={14} className="text-primary" />
            </div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
              {stats.totalRequests.toLocaleString()}
            </div>
            <div className="text-[11px] text-muted-foreground">HTTP API requests recorded</div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-sm shadow-sm space-y-1">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Avg Latency</span>
              <Gauge size={14} className="text-amber-400" />
            </div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
              {stats.avgDurationMs} <span className="text-sm font-sans font-normal text-muted-foreground">ms</span>
            </div>
            <div className="text-[11px] text-muted-foreground">Mean server response time</div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-sm shadow-sm space-y-1">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Error Rate</span>
              <AlertTriangle size={14} className="text-rose-400" />
            </div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
              {stats.errorRate}%
            </div>
            <div className="text-[11px] text-muted-foreground">4xx & 5xx HTTP responses</div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-sm shadow-sm space-y-1">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Top Bottleneck</span>
              <Flame size={14} className="text-rose-500" />
            </div>
            <div className="font-mono text-lg font-bold text-rose-400 truncate">
              {stats.mostExpensiveRoutes[0] ? `${stats.mostExpensiveRoutes[0].duration_ms} ms` : '0 ms'}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {stats.mostExpensiveRoutes[0]?.route || 'None'}
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by route, query params, payload, IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-border rounded pl-9 pr-3 py-2 text-xs focus:outline-none"
            />
          </div>

          {/* Method Filter */}
          <div className="flex items-center gap-2">
            <select
              value={method}
              onChange={(e) => {
                setMethod(e.target.value);
                setPage(1);
              }}
              className="bg-background border border-border rounded px-2.5 py-2 text-xs font-semibold"
            >
              <option value="ALL">All Methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>

            {/* Status Code Filter */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="bg-background border border-border rounded px-2.5 py-2 text-xs"
            >
              <option value="">All Statuses</option>
              <option value="200">200 OK</option>
              <option value="201">201 Created</option>
              <option value="400">400 Bad Request</option>
              <option value="401">401 Unauthorized</option>
              <option value="403">403 Forbidden</option>
              <option value="404">404 Not Found</option>
              <option value="429">429 Rate Limited</option>
              <option value="500">500 Server Error</option>
            </select>

            {/* Min Duration */}
            <select
              value={minDuration}
              onChange={(e) => {
                setMinDuration(e.target.value);
                setPage(1);
              }}
              className="bg-background border border-border rounded px-2.5 py-2 text-xs"
            >
              <option value="">Any Duration</option>
              <option value="50">&gt; 50 ms</option>
              <option value="100">&gt; 100 ms</option>
              <option value="300">&gt; 300 ms</option>
              <option value="500">&gt; 500 ms (Slow)</option>
              <option value="1000">&gt; 1000 ms (Critical)</option>
            </select>

            {/* Most Expensive Toggle */}
            <button
              type="button"
              onClick={() => {
                setMostExpensive(!mostExpensive);
                setPage(1);
              }}
              className={`px-3 py-2 rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                mostExpensive
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-background border border-border text-muted-foreground hover:text-foreground'
              }`}
              title="Sort by slowest response duration descending"
            >
              <Flame size={13} />
              <span>Most Expensive</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="border border-border rounded-xl overflow-hidden bg-card/60 backdrop-blur-sm shadow-sm">
        {loading && logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            Loading system logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Activity className="mx-auto text-muted-foreground" size={24} />
            <p className="text-xs font-medium text-foreground">No logs found matching criteria</p>
            <p className="text-[11px] text-muted-foreground">Try clearing your filters or search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-background/80 border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-4">Route & Query</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Response Time</th>
                  <th className="py-3 px-3 hidden md:table-cell">Client IP</th>
                  <th className="py-3 px-4 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => {
                  const hasPayload = Boolean(log.payload && log.payload !== '{}' && log.payload !== 'null');
                  return (
                    <tr key={log.id} className="hover:bg-accent/30 transition">
                      {/* Timestamp */}
                      <td className="py-3 px-4 text-[11px] font-mono text-muted-foreground whitespace-nowrap">
                        {new Date(log.created_at).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false,
                        })}
                        <span className="text-[10px] block text-muted-foreground/60">
                          {new Date(log.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </td>

                      {/* Method */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getMethodBadge(log.method)}`}>
                          {log.method}
                        </span>
                      </td>

                      {/* Route & Query */}
                      <td className="py-3 px-4 max-w-md">
                        <div className="font-mono text-xs font-semibold text-foreground truncate">
                          {log.route}
                        </div>
                        {log.query && (
                          <div className="font-mono text-[11px] text-muted-foreground truncate">
                            ?{log.query}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${getStatusBadge(log.status_code)}`}>
                          {log.status_code}
                        </span>
                      </td>

                      {/* Duration */}
                      <td className={`py-3 px-3 text-right font-mono text-xs ${getDurationBadge(log.duration_ms)}`}>
                        {log.duration_ms} ms
                      </td>

                      {/* IP */}
                      <td className="py-3 px-3 text-[11px] font-mono text-muted-foreground hidden md:table-cell truncate max-w-[120px]">
                        {log.ip || '127.0.0.1'}
                      </td>

                      {/* Inspect Payload Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className={`px-2.5 py-1 rounded text-[11px] font-medium border transition cursor-pointer inline-flex items-center gap-1 ${
                            hasPayload
                              ? 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/30'
                              : 'bg-background hover:bg-accent text-muted-foreground border-border'
                          }`}
                          title="View Request Details & Payload"
                        >
                          <Code size={12} />
                          <span>{hasPayload ? 'Inspect Payload' : 'Details'}</span>
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
        <div className="border-t border-border px-4 py-3 flex items-center justify-between text-xs text-muted-foreground bg-background/50">
          <div>
            Showing {logs.length} of {total} requests • Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded border border-border hover:bg-accent disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded border border-border hover:bg-accent disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Log Details & Payload Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-background">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider border ${getMethodBadge(selectedLog.method)}`}>
                  {selectedLog.method}
                </span>
                <div>
                  <h3 className="font-mono text-sm font-bold text-foreground">
                    {selectedLog.route}
                  </h3>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-3 mt-0.5">
                    <span>Status: {selectedLog.status_code}</span>
                    <span>•</span>
                    <span>Response Time: <strong className={getDurationBadge(selectedLog.duration_ms)}>{selectedLog.duration_ms} ms</strong></span>
                    <span>•</span>
                    <span>{new Date(selectedLog.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-mono bg-background/40">
              {/* Query Parameters */}
              <div>
                <label className="text-muted-foreground font-sans font-semibold text-[11px] block uppercase tracking-wider mb-1">
                  Query String
                </label>
                <div className="p-3 rounded border border-border bg-card text-foreground break-all">
                  {selectedLog.query ? `?${selectedLog.query}` : '(No query parameters)'}
                </div>
              </div>

              {/* Request Payload / Body */}
              <div>
                <label className="text-muted-foreground font-sans font-semibold text-[11px] block uppercase tracking-wider mb-1">
                  Sanitized Request Payload (Body)
                </label>
                <div className="p-3 rounded border border-border bg-card text-foreground overflow-x-auto">
                  {selectedLog.payload ? (
                    <pre className="text-xs text-emerald-400 whitespace-pre-wrap">
                      {JSON.stringify(JSON.parse(selectedLog.payload), null, 2)}
                    </pre>
                  ) : (
                    <span className="text-muted-foreground font-sans italic">No body payload submitted with this request</span>
                  )}
                </div>
              </div>

              {/* Client IP & User Agent */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-muted-foreground font-sans font-semibold text-[11px] block uppercase tracking-wider mb-1">
                    Client IP Address
                  </label>
                  <div className="p-2.5 rounded border border-border bg-card text-foreground">
                    {selectedLog.ip || 'Unknown'}
                  </div>
                </div>
                <div>
                  <label className="text-muted-foreground font-sans font-semibold text-[11px] block uppercase tracking-wider mb-1">
                    User Agent
                  </label>
                  <div className="p-2.5 rounded border border-border bg-card text-foreground truncate">
                    {selectedLog.user_agent || 'Unknown'}
                  </div>
                </div>
              </div>

              {/* Error Stack */}
              {selectedLog.error_stack && (
                <div>
                  <label className="text-rose-400 font-sans font-semibold text-[11px] block uppercase tracking-wider mb-1">
                    Error Stack Trace
                  </label>
                  <pre className="p-3 rounded border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs overflow-x-auto whitespace-pre-wrap">
                    {selectedLog.error_stack}
                  </pre>
                </div>
              )}
            </div>

            <div className="border-t border-border px-6 py-3 bg-background flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 border border-border rounded hover:bg-accent text-xs font-semibold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
