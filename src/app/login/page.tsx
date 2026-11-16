'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, AlertCircle, CheckCircle, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Logged in successfully!');
      router.push('/');
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleOAuth = async (provider: 'github' | 'google' | 'discord') => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen bg-discord-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-discord-blurple rounded-2xl flex items-center justify-center">
            <MessageSquare className="h-10 w-10 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-discord-text text-center mb-2">Welcome Back</h1>
        <p className="text-discord-text-muted text-center mb-8">Log in to continue to Discord Clone</p>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 text-green-300 rounded-lg flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4" />
            {success}
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="space-y-2 mb-6">
          <Button variant="outline" className="w-full" onClick={() => handleOAuth('github')}>
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
            Continue with GitHub
          </Button>
          <Button variant="outline" className="w-full" onClick={() => handleOAuth('google')}>
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>
          <Button variant="outline" className="w-full" onClick={() => handleOAuth('discord')}>
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.675 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.083.083 0 0 0 .031.057 19.9 19.9 0 0 0 5.992 4.929.078.078 0 0 0 .085-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.007-.128 10.2 10.2 0 0 1 .372-.524.074.074 0 0 1 .105-.008c3.532 1.72 7.35 1.72 10.886 0 .14.09.255.21.348.327a.074.074 0 0 1 .017.107 11.82 11.82 0 0 1-1.61.992.077.077 0 0 0-.048.096c.324.934.747 1.82 1.268 2.627a.077.077 0 0 0 .115.023 19.839 19.839 0 0 0 4.968-3.93.077.077 0 0 0 .023-.116c.211-.567.304-1.17.235-1.733a.066.066 0 0 0-.064-.074 22.035 22.035 0 0 0-1.195-.592c-.333-.097-.676-.076-1.004.053-.345.135-.709.193-1.074.113-.297-.064-.556-.223-.807-.435a.07.07 0 0 1-.014-.108 12.28 12.28 0 0 0 .608-1.912.073.073 0 0 0-.073-.072 19.775 19.775 0 0 0-4.928-1.21.074.074 0 0 0-.08 0c-3.07.679-6.086 2.049-8.94 3.813a.068.068 0 0 0-.03.112.082.082 0 0 0 .058.065C8.874 19.485 13.193 20.82 17.774 20.63c.346-.014.693-.083 1.02-.212a.077.077 0 0 0 .044-.12c-.205-.568-.31-1.168-.315-1.747a.068.068 0 0 1 .024-.097 20.163 20.163 0 0 0 1.239-.601.075.075 0 0 1 .083.01L20.35 21.9a.077.077 0 0 0 .114-.025.076.076 0 0 0 .018-.104c-.231-3.064-1.275-6.012-3.672-8.566a.061.061 0 0 0-.01-.089.078.078 0 0 0-.083-.022 17.98 17.98 0 0 1-3.625-.783.072.072 0 0 1-.053-.105.075.075 0 0 1 .101-.024c1.218-.334 2.403-.798 3.527-1.384a.07.07 0 0 0 .033-.104.074.074 0 0 0-.08-.024 14.28 14.28 0 0 0-1.254.516.076.076 0 0 1-.101-.004.07.07 0 0 0-.048-.087 10.74 10.74 0 0 0-.468-.333.077.077 0 0 0-.095.018.073.073 0 0 0-.014.116c-.09.3-.13.604-.13.913 0 .336.05.67.148.997a.071.071 0 0 0 .09.042 15.286 15.286 0 0 0 3.26-.786c.599-.241 1.188-.51 1.74-.797a.077.077 0 0 0 .023-.118c-.149-.63-.26-1.27-.33-1.913a.065.065 0 0 1 .032-.086 17.2 17.2 0 0 0 1.04-.745.07.07 0 0 0-.02-.11.076.076 0 0 0-.085-.027 18.875 18.875 0 0 1-2.16-.796.07.07 0 0 0-.086-.023H9.86a.07.07 0 0 1-.07-.07V8.37a.07.07 0 0 1 .07-.07h5.36a.07.07 0 0 1 .07.07v5.36a.07.07 0 0 1-.07.07h-1.82a.07.07 0 0 0-.07.07v2.09a.07.07 0 0 0 .07.07h1.82a.07.07 0 0 1 .07.07v2.09a.07.07 0 0 1-.07.07h-5.36a.07.07 0 0 1-.07-.07v-2.09a.07.07 0 0 0-.07-.07h1.82a.07.07 0 0 0 .07-.07v-2.09a.07.07 0 0 1 .07-.07h5.36a.07.07 0 0 1 .07.07v5.36a.07.07 0 0 0 .07.07h1.82a.07.07 0 0 1 .07.07v2.09a.07.07 0 0 0 .07.07c.327 0 .64-.08.918-.23a.074.074 0 0 0 .05-.122c-.18-.808-.315-1.61-.37-2.41a.07.07 0 0 0-.07-.07h-1.82a.07.07 0 0 1-.07-.07v-2.09a.07.07 0 0 0-.07-.07h5.36a.07.07 0 0 0 .07-.07V8.37a.07.07 0 0 0-.07-.07z"/>
            </svg>
            Continue with Discord
          </Button>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-discord-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-discord-bg text-discord-text-muted">Or continue with email</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-discord-text mb-1 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-discord-text-muted" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="pl-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-discord-text mb-1 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-discord-text-muted" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Log In'}
          </Button>
        </form>

        <p className="text-center text-discord-text-muted text-sm mt-6">
          Don't have an account?{' '}
          <Link href="/register" className="text-discord-blurple hover:underline font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}