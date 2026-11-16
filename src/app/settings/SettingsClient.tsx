'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Bell, Palette, Key, Shield, LogOut, Save, Camera, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { UserAvatar } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/lib/store';

interface SettingsClientProps {
  user: any;
}

export function SettingsClient({ user }: SettingsClientProps) {
  const router = useRouter();
  const { currentUser, setCurrentUser } = useStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'notifications' | 'security'>('profile');

  // Profile form state
  const [username, setUsername] = useState(currentUser?.username || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || '');
  const [status, setStatus] = useState<'online' | 'idle' | 'dnd' | 'offline'>(currentUser?.status || 'online');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase
      .from('users')
      .update({ username, avatar_url: avatarUrl, status })
      .eq('id', user.id);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      // Update auth metadata
      await supabase.auth.updateUser({ data: { username } });

      // Update local store
      const updatedUser = {
        ...currentUser,
        id: currentUser?.id || user.id,
        username,
        avatar_url: avatarUrl,
        status,
        email,
        created_at: currentUser?.created_at || new Date().toISOString(),
      };
      setCurrentUser(updatedUser);
      setMessage({ type: 'success', text: 'Profile saved successfully!' });
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="flex-1 flex flex-col bg-discord-bg">
      {/* Settings Header */}
      <div className="h-16 px-6 border-b border-discord-border flex items-center justify-between bg-discord-channel-sidebar">
        <h2 className="text-discord-text text-xl font-semibold">User Settings</h2>
        <div className="flex items-center gap-2">
          <UserAvatar
            src={currentUser?.avatar_url}
            name={currentUser?.username || 'User'}
            size="md"
            status={currentUser?.status || 'online'}
          />
          <span className="text-discord-text text-sm font-medium">{currentUser?.username}</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-48 border-r border-discord-border bg-discord-channel-sidebar flex-shrink-0">
          <nav className="p-3 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'bg-discord-hover text-discord-text'
                      : 'text-discord-text-muted hover:text-discord-text hover:bg-discord-hover'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-discord-border">
            <Button variant="destructive" className="w-full" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'profile' && (
            <div className="max-w-2xl space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <UserAvatar
                    src={avatarUrl || currentUser?.avatar_url}
                    name={username || currentUser?.username || 'User'}
                    size="xl"
                    status={status}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute bottom-0 right-0 -translate-x-1/2 translate-y-1/2"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <h3 className="text-discord-text text-lg font-semibold">Profile</h3>
                  <p className="text-discord-text-muted text-sm">Customize your profile</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-discord-text block mb-1">Username</label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    maxLength={32}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-discord-text block mb-1">Email</label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    type="email"
                    disabled
                  />
                  <p className="text-discord-text-muted text-xs mt-1">Email changes require verification</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-discord-text block mb-1">Avatar URL</label>
                  <Input
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.png"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-discord-text block mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-discord-input border border-discord-border rounded-lg text-discord-text focus:outline-none focus:ring-1 focus:ring-discord-blurple"
                  >
                    <option value="online">Online</option>
                    <option value="idle">Idle</option>
                    <option value="dnd">Do Not Disturb</option>
                    <option value="offline">Invisible</option>
                  </select>
                </div>
              </div>

              {message && (
                <div className={cn(
                  'p-3 rounded-lg text-sm flex items-center gap-2',
                  message.type === 'success'
                    ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                    : 'bg-red-500/20 border border-red-500/50 text-red-300'
                )}>
                  {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  {message.text}
                </div>
              )}

              <Button onClick={handleSaveProfile} disabled={saving} className="w-full max-w-xs">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="max-w-2xl space-y-6">
              <h3 className="text-discord-text text-lg font-semibold">Appearance</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-discord-text block mb-2">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['light', 'dark', 'system'].map((theme) => (
                      <button
                        key={theme}
                        className={cn(
                          'p-4 border-2 rounded-lg transition-colors flex flex-col items-center gap-2',
                          theme === 'dark'
                            ? 'border-discord-blurple bg-discord-hover'
                            : 'border-discord-border hover:border-discord-blurple/50'
                        )}
                      >
                        <div className={cn(
                          'w-16 h-10 rounded border',
                          theme === 'light' ? 'bg-white border-gray-300' : 'bg-discord-bg border-discord-border'
                        )} />
                        <span className="text-sm capitalize">{theme}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-discord-text block mb-2">Message Display</label>
                  <div className="space-y-2">
                    {['compact', 'cozy'].map((display) => (
                      <label key={display} className="flex items-center gap-3 cursor-pointer p-3 border border-discord-border rounded-lg hover:bg-discord-hover">
                        <input type="radio" name="display" value={display} className="text-discord-blurple" />
                        <span className="capitalize">{display}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="max-w-2xl space-y-6">
              <h3 className="text-discord-text text-lg font-semibold">Notifications</h3>

              <div className="space-y-4">
                {[
                  'Enable Desktop Notifications',
                  'Notify on All Messages',
                  'Notify on Mentions Only',
                  'Notify on Direct Messages',
                  'Play Sound on Notification',
                ].map((setting, i) => (
                  <label key={i} className="flex items-center justify-between p-3 border border-discord-border rounded-lg">
                    <span className="text-discord-text">{setting}</span>
                    <input type="checkbox" className="w-5 h-5 text-discord-blurple rounded border-discord-border focus:ring-discord-blurple" defaultChecked />
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="max-w-2xl space-y-6">
              <h3 className="text-discord-text text-lg font-semibold">Security</h3>

              <div className="space-y-4 p-4 bg-discord-channel-sidebar rounded-lg border border-discord-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-discord-text font-medium">Two-Factor Authentication</h4>
                    <p className="text-discord-text-muted text-sm">Add an extra layer of security</p>
                  </div>
                  <Button variant="outline">Enable</Button>
                </div>
              </div>

              <div className="space-y-4 p-4 bg-discord-channel-sidebar rounded-lg border border-discord-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-discord-text font-medium">Change Password</h4>
                    <p className="text-discord-text-muted text-sm">Update your password</p>
                  </div>
                  <Button variant="outline">Change</Button>
                </div>
              </div>

              <div className="space-y-4 p-4 bg-discord-channel-sidebar rounded-lg border border-discord-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-discord-text font-medium">Active Sessions</h4>
                    <p className="text-discord-text-muted text-sm">Manage your logged-in devices</p>
                  </div>
                  <Button variant="outline">View</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}