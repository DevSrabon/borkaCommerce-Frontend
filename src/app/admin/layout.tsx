'use client';

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
} from 'lucide-react';

const NAV_MODULES = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Folder },
  { href: '/admin/attributes', label: 'Attributes', icon: Tag },
  { href: '/admin/offers', label: 'Offers/Campaigns', icon: Percent },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { href: '/admin/banners', label: 'Banners', icon: Image },
  { href: '/admin/settings', label: 'Site Settings', icon: Settings },
];

const ADMIN_EMAILS = ['srabon@example.com', 'admin@example.com'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!token || !user) {
      router.push('/login?redirect=admin');
      return;
    }
    if (!ADMIN_EMAILS.includes(user.email?.toLowerCase())) {
      router.push('/');
    }
  }, [mounted, token, user]);

  if (!mounted) return null;

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-background">
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
                {!collapsed && active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground opacity-80" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer — Collapse toggle + user info + storefront link */}
        <div className="border-t border-border space-y-1 p-2">
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
            <div className="px-3 py-2 text-[10px] text-muted-foreground border-t border-border mt-1 pt-2">
              <p className="font-semibold text-foreground truncate">{user.email}</p>
              <p className="uppercase tracking-wider">Administrator</p>
            </div>
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
        <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {NAV_MODULES.find((m) => isActive(m.href, m.exact))?.label ?? 'Admin'}
            </h2>
            <p className="text-[10px] text-muted-foreground">
              {pathname}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="hidden sm:block">
              {new Date().toLocaleDateString('en-AE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
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
