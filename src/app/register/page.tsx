'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, AlertCircle, CheckCircle, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
    } else if (data.user) {
      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          username,
          email,
          status: 'online',
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }

      setSuccess('Account created! Please check your email to verify.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
    setIsLoading(false);
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

        <h1 className="text-3xl font-bold text-discord-text text-center mb-2">Create an Account</h1>
        <p className="text-discord-text-muted text-center mb-8">Join Discord Clone today</p>

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-discord-text mb-1 block">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-discord-text-muted" />
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="pl-10"
                required
                disabled={isLoading}
                minLength={3}
                maxLength={32}
              />
            </div>
          </div>

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
                placeholder="At least 8 characters"
                className="pl-10"
                required
                disabled={isLoading}
                minLength={8}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-discord-text mb-1 block">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-discord-text-muted" />
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="pl-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-discord-text-muted text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-discord-blurple hover:underline font-medium">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}