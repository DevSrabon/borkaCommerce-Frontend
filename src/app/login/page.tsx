'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setSession } from '../../store/authSlice';
import { Mail, Lock, User, Phone, CheckCircle, AlertCircle } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);

  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // If already logged in, redirect
    if (mounted && token) {
      const redirect = searchParams?.get('redirect') || '/';
      router.push(redirect);
    }
  }, [mounted, token]);

  if (!mounted) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const endpoint = isRegister ? 'register' : 'login';

    try {
      const res = await fetch(`http://localhost:8080/ecommerce/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(isRegister ? form : { email: form.email, password: form.password }),
      });

      const data = await res.json();
      if (res.ok) {
        if (isRegister) {
          setSuccess('Account created successfully! Please login.');
          setIsRegister(false);
          setForm((prev) => ({ ...prev, password: '' }));
        } else {
          // Logged in! Save session
          dispatch(
            setSession({
              user: data.user,
              token: data.token,
            })
          );
          const redirect = searchParams?.get('redirect') || '/';
          router.push(redirect);
        }
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      // Mock Bypass for testing when backend is down
      if (!isRegister && form.email === 'srabon@example.com' && form.password === 'password123') {
        dispatch(
          setSession({
            user: {
              id: 'mock-cust-1',
              first_name: 'Srabon',
              last_name: 'Rahman',
              email: 'srabon@example.com',
              phone: '+971501234567',
              email_verified: true,
            },
            token: 'mock-session-token-srabon',
          })
        );
        const redirect = searchParams?.get('redirect') || '/';
        router.push(redirect);
      } else {
        setError('Connection failed. Mock Login: srabon@example.com / password123');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-20 w-full">
      <div className="bg-card border border-border p-8 rounded-md shadow-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="font-serif text-2xl font-bold tracking-wide uppercase">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-xs text-muted-foreground font-light">
            {isRegister ? 'Register for exclusive Eid offers and checkout tracking' : 'Sign in to access your profile and cart checkout'}
          </p>
        </div>

        {/* Message banners */}
        {error && (
          <div className="flex items-center gap-2 text-xs bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded-md">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-xs bg-green-500/10 border border-green-500/30 text-green-500 p-3 rounded-md">
            <CheckCircle size={14} />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">First Name</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                    <User size={14} />
                  </span>
                  <input
                    type="text"
                    name="first_name"
                    className="w-full text-xs bg-background border border-border rounded pl-9 pr-3 py-2.5 focus:outline-none"
                    value={form.first_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  className="w-full text-xs bg-background border border-border rounded px-3 py-2.5 focus:outline-none"
                  value={form.last_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Email Address</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                <Mail size={14} />
              </span>
              <input
                type="email"
                name="email"
                placeholder="srabon@example.com"
                className="w-full text-xs bg-background border border-border rounded pl-9 pr-3 py-2.5 focus:outline-none"
                value={form.email}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          {isRegister && (
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Phone (Optional)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                  <Phone size={14} />
                </span>
                <input
                  type="text"
                  name="phone"
                  placeholder="+971 50 123 4567"
                  className="w-full text-xs bg-background border border-border rounded pl-9 pr-3 py-2.5 focus:outline-none"
                  value={form.phone}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Password</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                <Lock size={14} />
              </span>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                className="w-full text-xs bg-background border border-border rounded pl-9 pr-3 py-2.5 focus:outline-none"
                value={form.password}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 btn-luxury rounded-sm tracking-wider uppercase text-xs font-semibold flex items-center justify-center cursor-pointer ${loading ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : ''
              }`}
          >
            {loading ? 'Processing...' : isRegister ? 'Register' : 'Login'}
          </button>
        </form>

        {/* Toggle link */}
        <div className="text-center pt-2">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              setSuccess('');
            }}
            className="text-xs text-primary hover:underline font-medium"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm font-light text-muted-foreground">Loading authorization...</div>}>
      <LoginContent />
    </Suspense>
  );
}
