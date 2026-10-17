'use client';

import { API_BASE_URL } from '@/config/api';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setSession } from '../../store/authSlice';
import TurnstileWidget from '@/components/TurnstileWidget';
import { Mail, Lock, User, Phone, CheckCircle, AlertCircle, KeyRound, RefreshCw, ArrowRight } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);

  const [isRegister, setIsRegister] = useState(false);
  const [step, setStep] = useState<'AUTH' | 'OTP'>('AUTH');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string>('');

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
  const [resending, setResending] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [socialConfig, setSocialConfig] = useState<{ google_client_id?: string; facebook_app_id?: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    fetch(`${API_BASE_URL}/ecommerce/auth/social-config`)
      .then((r) => r.json())
      .then((cfg) => {
        if (cfg) {
          setSocialConfig(cfg);
          if (cfg.facebook_app_id && typeof window !== 'undefined' && !(window as any).FB) {
            (window as any).fbAsyncInit = function () {
              (window as any).FB.init({
                appId: cfg.facebook_app_id,
                cookie: true,
                xfbml: true,
                version: 'v18.0',
              });
            };
            const s = document.createElement('script');
            s.id = 'facebook-jssdk';
            s.src = 'https://connect.facebook.net/en_US/sdk.js';
            s.async = true;
            s.defer = true;
            document.head.appendChild(s);
          }

          if (cfg.google_client_id && typeof window !== 'undefined' && !(window as any).google?.accounts?.oauth2) {
            const g = document.createElement('script');
            g.id = 'google-gsi-client';
            g.src = 'https://accounts.google.com/gsi/client';
            g.async = true;
            g.defer = true;
            document.head.appendChild(g);
          }
        }
      })
      .catch(() => {});

    if (mounted && token) {
      const redirect = searchParams?.get('redirect') || '/';
      router.push(redirect);
    }
  }, [mounted, token, searchParams, router]);

  if (!mounted) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (isRegister) {
      // 1. Register with Email OTP Flow
      try {
        const res = await fetch(`${API_BASE_URL}/ecommerce/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, captcha_token: captchaToken }),
        });

        const data = await res.json();
        if (res.ok) {
          setOtpEmail(form.email);
          setStep('OTP');
          setDevOtpHint(data.dev_otp || null);
          setSuccess('A 6-digit verification code has been sent to your email.');
        } else {
          setError(data.message || 'Registration failed');
        }
      } catch (err: any) {
        setError('Network error. Please make sure the backend server is reachable.');
      } finally {
        setLoading(false);
      }
    } else {
      // 2. Standard Login
      try {
        const res = await fetch(`${API_BASE_URL}/ecommerce/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, password: form.password, captcha_token: captchaToken }),
        });

        const data = await res.json();
        if (res.ok) {
          dispatch(
            setSession({
              user: data.user,
              token: data.token,
            })
          );
          const redirect = searchParams?.get('redirect') || '/';
          router.push(redirect);
        } else {
          setError(data.message || 'Invalid credentials');
        }
      } catch (err: any) {
        setError('Network error during login');
      } finally {
        setLoading(false);
      }
    }
  };

  // OTP Verification Submit
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/ecommerce/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail, otp: otpCode }),
      });

      const data = await res.json();
      if (res.ok) {
        dispatch(
          setSession({
            user: data.user,
            token: data.token,
          })
        );
        setSuccess('Email verified successfully! Welcome to Saba Al Wadi.');
        const redirect = searchParams?.get('redirect') || '/';
        router.push(redirect);
      } else {
        setError(data.message || 'Invalid verification code');
      }
    } catch (err: any) {
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setError('');
    setResending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ecommerce/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setDevOtpHint(data.dev_otp || null);
        setSuccess('New 6-digit verification code sent to your email.');
      } else {
        setError(data.message || 'Failed to resend verification code');
      }
    } catch (err: any) {
      setError('Network error while resending code');
    } finally {
      setResending(false);
    }
  };

  // Social Login (Google / Facebook)
  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setError('');
    setLoading(true);

    const completeSocialAuth = async (
      email: string,
      name: string,
      social_id: string,
      accessToken?: string,
      avatarUrl?: string
    ) => {
      try {
        const res = await fetch(`${API_BASE_URL}/ecommerce/auth/social-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider,
            email,
            name,
            social_id,
            access_token: accessToken,
            avatar_url: avatarUrl,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          dispatch(
            setSession({
              user: data.user,
              token: data.token,
            })
          );
          const redirect = searchParams?.get('redirect') || '/';
          router.push(redirect);
        } else {
          setError(data.message || `${provider} sign in failed`);
        }
      } catch {
        setError(`Failed to complete ${provider} authentication with server`);
      } finally {
        setLoading(false);
      }
    };

    try {
      // 1. Google OAuth via Google Identity Services (GIS)
      if (provider === 'google') {
        const clientId = socialConfig?.google_client_id?.trim();
        if (!clientId) {
          setLoading(false);
          setError('Google OAuth Client ID is not configured. Please enter your Google Client ID in Admin > Settings > Social Logins.');
          return;
        }

        // Ensure script is attached
        if (typeof window !== 'undefined' && !(window as any).google?.accounts?.oauth2) {
          if (!document.getElementById('google-gsi-client')) {
            const g = document.createElement('script');
            g.id = 'google-gsi-client';
            g.src = 'https://accounts.google.com/gsi/client';
            g.async = true;
            g.defer = true;
            document.head.appendChild(g);
          }
        }

        // Wait up to 2.5s for GIS script
        let attempts = 0;
        while (typeof window !== 'undefined' && !(window as any).google?.accounts?.oauth2 && attempts < 25) {
          await new Promise((r) => setTimeout(r, 100));
          attempts++;
        }

        if (typeof window === 'undefined' || !(window as any).google?.accounts?.oauth2) {
          setLoading(false);
          setError('Google Sign-In SDK could not be loaded. Please ensure browser extensions or shields are not blocking Google.');
          return;
        }

        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              setLoading(false);
              if (tokenResponse.error !== 'popup_closed_by_user') {
                setError(`Google sign-in error: ${tokenResponse.error_description || tokenResponse.error}`);
              }
              return;
            }

            if (tokenResponse.access_token) {
              try {
                const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                if (!userRes.ok) {
                  throw new Error('Failed to retrieve verified Google profile');
                }
                const profile = await userRes.json();
                const email = profile.email;
                const name =
                  profile.name ||
                  `${profile.given_name || ''} ${profile.family_name || ''}`.trim() ||
                  'Google User';
                const socialId = profile.sub;
                const avatar = profile.picture;

                await completeSocialAuth(email, name, socialId, tokenResponse.access_token, avatar);
              } catch (err: any) {
                setError(err?.message || 'Failed to authenticate Google user');
                setLoading(false);
              }
            } else {
              setLoading(false);
            }
          },
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      }

      // 2. Facebook SDK Login
      if (provider === 'facebook' && typeof window !== 'undefined' && (window as any).FB) {
        (window as any).FB.login(
          (response: any) => {
            if (response.authResponse) {
              const accessToken = response.authResponse.accessToken;
              const userId = response.authResponse.userID;
              (window as any).FB.api('/me', { fields: 'name,email,picture' }, async (userInfo: any) => {
                const fbEmail = userInfo.email || `fb_${userId}@sabaalwadi.customer`;
                const fbName = userInfo.name || 'Facebook User';
                const fbAvatar = userInfo.picture?.data?.url;
                try {
                  await completeSocialAuth(fbEmail, fbName, userId, accessToken, fbAvatar);
                } catch {
                  setError('Facebook sign-in failed on server');
                  setLoading(false);
                }
              });
            } else {
              setLoading(false);
              setError('Facebook login was cancelled');
            }
          },
          { scope: 'public_profile,email' }
        );
        return;
      }

      setError(`Could not initiate ${provider} login. Please verify settings.`);
      setLoading(false);
    } catch (err: any) {
      setError(`Failed to connect with ${provider}: ${err?.message || ''}`);
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-24 w-full">
      <div className="bg-card border border-border p-6 sm:p-8 rounded-lg shadow-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide uppercase text-foreground">
            {step === 'OTP' ? 'Verify Email' : isRegister ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-xs text-muted-foreground font-light leading-relaxed">
            {step === 'OTP'
              ? `Enter the 6-digit code sent to ${otpEmail}`
              : isRegister
              ? 'Register with email OTP verification for luxury abaya orders & discounts'
              : 'Sign in to access your luxury abaya orders and profile'}
          </p>
        </div>

        {/* Message banners */}
        {error && (
          <div className="flex items-center gap-2 text-xs bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded-md">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-xs bg-green-500/10 border border-green-500/30 text-green-500 p-3 rounded-md">
            <CheckCircle size={15} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* STEP 1: AUTH FORM (Login / Register) */}
        {step === 'AUTH' && (
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-3 pb-2">
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                className="flex items-center justify-center gap-2 py-2.5 px-3 border border-border rounded-md hover:bg-accent/50 text-xs font-medium transition cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin('facebook')}
                className="flex items-center justify-center gap-2 py-2.5 px-3 border border-border rounded-md hover:bg-accent/50 text-xs font-medium transition cursor-pointer"
              >
                <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Facebook</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-border w-full" />
              <span className="bg-card px-2 text-xs uppercase font-semibold text-muted-foreground tracking-wider absolute">
                Or with Email
              </span>
            </div>

            {isRegister && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">First Name</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <User size={13} />
                    </span>
                    <input
                      type="text"
                      name="first_name"
                      placeholder="Fatima"
                      className="w-full text-xs bg-background border border-border rounded pl-8 pr-3 py-2.5 focus:outline-none focus:border-primary"
                      value={form.first_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    placeholder="Al-Zaabi"
                    className="w-full text-xs bg-background border border-border rounded px-3 py-2.5 focus:outline-none focus:border-primary"
                    value={form.last_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Email Address</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Mail size={13} />
                </span>
                <input
                  type="email"
                  name="email"
                  placeholder="fatima@example.com"
                  className="w-full text-xs bg-background border border-border rounded pl-8 pr-3 py-2.5 focus:outline-none focus:border-primary"
                  value={form.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {isRegister && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Phone (Optional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Phone size={13} />
                  </span>
                  <input
                    type="text"
                    name="phone"
                    placeholder="+971 50 123 4567"
                    className="w-full text-xs bg-background border border-border rounded pl-8 pr-3 py-2.5 focus:outline-none focus:border-primary"
                    value={form.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Lock size={13} />
                </span>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  className="w-full text-xs bg-background border border-border rounded pl-8 pr-3 py-2.5 focus:outline-none focus:border-primary"
                  value={form.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <TurnstileWidget onVerify={(t) => setCaptchaToken(t)} />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground rounded text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Please wait...' : isRegister ? 'Register with Email OTP' : 'Sign In'}
              <ArrowRight size={14} />
            </button>
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION FORM */}
        {step === 'OTP' && (
          <form onSubmit={handleOtpSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase block text-center">
                6-Digit Verification Code
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <KeyRound size={16} />
                </span>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  className="w-full text-center font-mono text-xl tracking-[0.5em] font-bold bg-background border border-border rounded py-3 focus:outline-none focus:border-primary"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                />
              </div>
            </div>

            {devOtpHint && (
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded text-center text-xs">
                <span>Dev Preview Code: </span>
                <strong className="font-mono text-sm tracking-widest">{devOtpHint}</strong>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otpCode.length < 6}
              className="w-full py-3 bg-primary text-primary-foreground rounded text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => setStep('AUTH')}
                className="text-muted-foreground hover:text-foreground transition underline"
              >
                Back to registration
              </button>

              <button
                type="button"
                disabled={resending}
                onClick={handleResendOtp}
                className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={12} className={resending ? 'animate-spin' : ''} />
                {resending ? 'Sending...' : 'Resend Code'}
              </button>
            </div>
          </form>
        )}

        {/* Toggle link */}
        {step === 'AUTH' && (
          <div className="text-center pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
                setSuccess('');
              }}
              className="text-xs text-primary hover:underline font-medium cursor-pointer"
            >
              {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Sign Up with OTP"}
            </button>
          </div>
        )}
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
