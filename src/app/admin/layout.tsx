'use client';

import { API_BASE_URL } from '@/config/api';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Boxes,
  Image,
  Settings,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LogOut,
  ShieldCheck,
  Folder,
  Tag,
  Percent,
  Star,
  MessageSquare,
  FileText,
  BookOpen,
  Sun,
  Moon,
} from 'lucide-react';
import { clearSession } from '../../store/authSlice';
import { useDispatch } from 'react-redux';

const NAV_MODULES = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/pages', label: 'Pages Builder', icon: FileText },
  { href: '/admin/blogs', label: 'Blog & Comments', icon: BookOpen },
  { href: '/admin/chat', label: 'Support Chat', icon: MessageSquare },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Folder },
  { href: '/admin/attributes', label: 'Attributes', icon: Tag },
  { href: '/admin/offers', label: 'Offers/Campaigns', icon: Percent },
  { href: '/admin/reviews', label: 'Reviews & Ratings', icon: Star },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { href: '/admin/banners', label: 'Banners', icon: Image },
  { href: '/admin/settings', label: 'Site Settings', icon: Settings },
];

const ADMIN_EMAILS = ['srabon@example.com', 'admin@example.com'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [validating, setValidating] = useState(true);
  const [chatUnread, setChatUnread] = useState(0);
  const [adminTheme, setAdminTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('admin_theme') as 'light' | 'dark' | null;
    if (saved === 'light' || saved === 'dark') {
      setAdminTheme(saved);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (adminTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    return () => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.removeAttribute('data-theme');
    };
  }, [adminTheme, mounted]);

  useEffect(() => {
    if (!token) return;
    const fetchUnread = () => {
      fetch(`${API_BASE_URL}/admin/chat/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data.unread_total === 'number') {
            setChatUnread(data.unread_total);
          }
        })
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 4000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (!mounted) return;

    // Allow viewing the admin login page without layout protection redirect loops
    if (pathname === '/admin/login') {
      setValidating(false);
      return;
    }

    if (!token || !user) {
      router.push('/admin/login');
      return;
    }

    // Verify session validity against backend
    const verifySession = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/ecommerce/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          // Token is dead or expired
          dispatch(clearSession());
          router.push('/admin/login?reason=expired');
          return;
        }

        if (res.ok) {
          const profile = await res.json();
          const isAdmin =
            profile.role === 'ADMIN' || ADMIN_EMAILS.includes(profile.email?.toLowerCase());

          if (!isAdmin) {
            router.push('/');
            return;
          }
        }
      } catch (err) {
        // If network issue, allow local dev mock admin
        const isAdmin = user.role === 'ADMIN' || ADMIN_EMAILS.includes(user.email?.toLowerCase());
        if (!isAdmin) {
          router.push('/');
          return;
        }
      } finally {
        setValidating(false);
      }
    };

    verifySession();
  }, [mounted, token, user, pathname, router, dispatch]);

  if (!mounted) return null;

  // Don't wrap admin login page with sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (validating) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-3">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">
          Verifying Administrator Session...
        </p>
      </div>
    );
  }

  const handleLogout = () => {
    dispatch(clearSession());
    router.push('/admin/login');
  };

  const toggleTheme = () => {
    const nextTheme = adminTheme === 'dark' ? 'light' : 'dark';
    setAdminTheme(nextTheme);
    localStorage.setItem('admin_theme', nextTheme);
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div
      className={`flex min-h-screen bg-background text-foreground transition-colors duration-200 ${
        adminTheme === 'dark' ? 'dark' : 'light'
      }`}
      data-theme={adminTheme}
    >
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 flex flex-col border-r border-border bg-card transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Brand */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-border ${collapsed ? 'justify-center' : ''}`}>
          <div className="h-8 w-8 shrink-0 rounded-md bg-primary flex items-center justify-center">
            <ShieldCheck size={16} className="text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-foreground truncate">Admin Panel</p>
              <p className="text-[10px] text-muted-foreground truncate">Saba Al Wadi</p>
            </div>
          )}
        </div>

        {/* Navigation Modules */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 px-2">
          {NAV_MODULES.map((mod) => {
            const active = isActive(mod.href, mod.exact);
            const Icon = mod.icon;
            return (
              <Link
                key={mod.href}
                href={mod.href}
                title={collapsed ? mod.label : undefined}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-xs font-medium transition-all duration-150 group ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <Icon size={16} className="shrink-0" />
                {!collapsed && <span className="truncate">{mod.label}</span>}
                {!collapsed && mod.href === '/admin/chat' && chatUnread > 0 && (
                  <span className="ml-auto flex items-center justify-center px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-red-600 text-white animate-pulse">
                    {chatUnread}
                  </span>
                )}
                {!collapsed && active && mod.href !== '/admin/chat' && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground opacity-80" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer — Collapse toggle + theme switcher + user info + storefront link */}
        <div className="border-t border-border space-y-1 p-2">
          {/* Sidebar theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition cursor-pointer ${
              collapsed ? 'justify-center' : ''
            }`}
            title={`Switch to ${adminTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {adminTheme === 'dark' ? (
              <Moon size={14} className="text-amber-400 shrink-0" />
            ) : (
              <Sun size={14} className="text-amber-600 shrink-0" />
            )}
            {!collapsed && (
              <div className="flex-1 flex items-center justify-between text-left">
                <span>Theme</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent border border-border text-foreground">
                  {adminTheme === 'dark' ? 'Dark' : 'Light'}
                </span>
              </div>
            )}
          </button>

          <Link
            href="/"
            target="_blank"
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'View Storefront' : undefined}
          >
            <ExternalLink size={14} className="shrink-0" />
            {!collapsed && <span>View Storefront</span>}
          </Link>

          {!collapsed && user && (
            <div className="px-3 py-2 text-[10px] text-muted-foreground border-t border-border mt-1 pt-2 flex items-center justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{user.email}</p>
                <p className="uppercase tracking-wider text-amber-500 font-bold">{user.role || 'Administrator'}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-1 rounded hover:bg-accent text-zinc-400 hover:text-red-400 transition cursor-pointer"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
          {collapsed && (
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="w-full flex items-center justify-center p-2 rounded hover:bg-accent text-zinc-400 hover:text-red-400 transition cursor-pointer"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent flex items-center justify-center shadow-sm transition cursor-pointer"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Main content area */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-60'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm px-6 py-3 flex items-center justify-between shadow-xs">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {NAV_MODULES.find((m) => isActive(m.href, m.exact))?.label ?? 'Admin'}
            </h2>
            <p className="text-[10px] text-muted-foreground font-mono">
              {pathname}
            </p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-xs">
            <span className="hidden sm:block text-muted-foreground font-medium">
              {new Date().toLocaleDateString('en-AE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>

            {/* Production-Grade Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${adminTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background hover:bg-accent text-foreground transition-all duration-200 shadow-xs cursor-pointer group"
              aria-label="Toggle theme mode"
            >
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:rotate-12">
                {adminTheme === 'dark' ? (
                  <Moon size={13} className="text-amber-400 fill-amber-400/20" />
                ) : (
                  <Sun size={13} className="text-amber-600 fill-amber-600/20" />
                )}
              </div>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground group-hover:text-foreground">
                {adminTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
