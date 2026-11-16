'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, ChevronDown, Home, Hash, MessageSquare, Users, Settings, LogOut, Search, UserPlus, Compass, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui';
import { useStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';

interface Server {
  id: string;
  name: string;
  icon_url?: string;
  owner_id: string;
}

export function ServerSidebar() {
  const pathname = usePathname();
  const { servers, currentServerId, setCurrentServerId, currentUser, addServer } = useStore();
  const [hoveredServer, setHoveredServer] = useState<string | null>(null);
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [newServerName, setNewServerName] = useState('');

  const handleCreateServer = async () => {
    if (!newServerName.trim() || !currentUser) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from('servers')
      .insert({
        name: newServerName.trim(),
        owner_id: currentUser.id,
      })
      .select()
      .single();

    if (!error && data) {
      // Add owner as member
      await supabase.from('server_members').insert({
        server_id: data.id,
        user_id: currentUser.id,
        role: 'owner',
      });

      // Create default channels
      await supabase.from('channels').insert([
        { server_id: data.id, name: 'general', type: 'text', position: 0 },
        { server_id: data.id, name: 'Voice Channels', type: 'category', position: 1 },
        { server_id: data.id, name: 'General', type: 'voice', position: 2 },
      ]);

      addServer(data);
      setCurrentServerId(data.id);
      setShowCreateServer(false);
      setNewServerName('');
    }
  };

  const isDMRoute = pathname.startsWith('/dm');
  const isSettingsRoute = pathname.startsWith('/settings');

  return (
    <div className="flex flex-col h-full bg-discord-sidebar w-72 border-r border-discord-border flex-shrink-0">
      {/* App Icon / Home */}
      <Link
        href="/"
        className={cn(
          'flex items-center justify-center h-14 px-2 mx-2 rounded-lg transition-colors',
          (pathname === '/' || isDMRoute) && 'bg-discord-hover'
        )}
        title="Home"
      >
        <Home className="h-5 w-5 text-discord-text-muted" />
      </Link>

      {/* Server List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {servers.map((server) => (
          <ServerListItem
            key={server.id}
            server={server}
            isActive={currentServerId === server.id}
            onClick={() => setCurrentServerId(server.id)}
            onMouseEnter={() => setHoveredServer(server.id)}
            onMouseLeave={() => setHoveredServer(null)}
          />
        ))}

        {/* Add Server Button */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 px-2 py-1.5 hover:bg-discord-hover"
          onClick={() => setShowCreateServer(true)}
        >
          <Plus className="h-5 w-5 text-discord-text-muted" />
          <span className="text-discord-text-muted text-sm">Add a Server</span>
        </Button>

        {/* Explore Public Servers */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 px-2 py-1.5 hover:bg-discord-hover"
        >
          <Compass className="h-5 w-5 text-discord-text-muted" />
          <span className="text-discord-text-muted text-sm">Explore Public Servers</span>
        </Button>
      </div>

      {/* DM Section */}
      <div className="border-t border-discord-border p-2">
        <Link
          href="/dm"
          className={cn(
            'flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors',
            isDMRoute && 'bg-discord-hover'
          )}
        >
          <MessageSquare className="h-5 w-5 text-discord-text-muted" />
          <span className="text-discord-text text-sm font-medium">Direct Messages</span>
        </Link>
      </div>

      {/* User Profile / Settings */}
      <div className="p-2 border-t border-discord-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Link href="/settings" className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-discord-hover w-full">
              <UserAvatar
                src={currentUser?.avatar_url}
                name={currentUser?.username || 'User'}
                size="md"
                status={currentUser?.status || 'online'}
              />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-discord-text text-sm font-medium truncate">
                  {currentUser?.username || 'User'}
                </p>
                <p className="text-discord-text-muted text-xs truncate">
                  {currentUser?.email}
                </p>
              </div>
            </Link>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/settings/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/appearance" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Appearance
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                window.location.href = '/login';
              }}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Create Server Modal */}
      {showCreateServer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-discord-bg w-full max-w-md rounded-lg p-6">
            <h2 className="text-discord-text text-lg font-semibold mb-4">Create a Server</h2>
            <p className="text-discord-text-muted text-sm mb-4">
              What's the name of your server?
            </p>
            <Input
              value={newServerName}
              onChange={(e) => setNewServerName(e.target.value)}
              placeholder="My Server"
              autoFocus
              className="mb-4"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateServer()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowCreateServer(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateServer} disabled={!newServerName.trim()}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ServerListItem({
  server,
  isActive,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  server: Server;
  isActive: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        'relative flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
        isActive
          ? 'bg-discord-blurple'
          : 'bg-transparent hover:bg-discord-hover'
      )}
      title={server.name}
    >
      {server.icon_url ? (
        <img
          src={server.icon_url}
          alt={server.name}
          className="w-8 h-8 rounded-lg"
        />
      ) : (
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-lg',
            isActive ? 'bg-discord-blurple' : 'bg-discord-blurple/80'
          )}
        >
          {server.name.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Active indicator */}
      {isActive && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-discord-blurple" />
      )}

      {/* Notification badge placeholder */}
      <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full hidden" />
    </button>
  );
}