'use client';

import { useState } from 'react';
import { X, Search, UserPlus, Settings, Bell, Pin, MoreVertical, Volume2, Video, ScreenShare, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui';
import { Button } from '@/components/ui';
import { ScrollArea } from '@/components/ui';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui';
import { useStore } from '@/lib/store';
import type { User } from '@/lib/types';

export function RightSidebar() {
  const {
    rightSidebarOpen,
    setRightSidebarOpen,
    currentServerId,
    currentChannelId,
    currentUser,
    voiceStates,
    currentVoiceChannel,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'members' | 'pinned' | 'files'>('members');
  const [searchQuery, setSearchQuery] = useState('');

  if (!rightSidebarOpen || !currentServerId) {
    return null;
  }

  // Mock members data - in real app, fetch from Supabase
  const members: (User & { role: string; voiceState?: any })[] = [
    { id: '1', username: 'AdminUser', email: 'admin@example.com', avatar_url: undefined, status: 'online' as const, created_at: '', role: 'owner' },
    { id: '2', username: 'Moderator', email: 'mod@example.com', avatar_url: undefined, status: 'idle' as const, created_at: '', role: 'moderator' },
    { id: '3', username: 'Member1', email: 'member1@example.com', avatar_url: undefined, status: 'online' as const, created_at: '', role: 'member' },
    { id: '4', username: 'Member2', email: 'member2@example.com', avatar_url: undefined, status: 'dnd' as const, created_at: '', role: 'member' },
    { id: '5', username: 'OfflineUser', email: 'offline@example.com', avatar_url: undefined, status: 'offline' as const, created_at: '', role: 'member' },
  ].filter(m => m.id !== currentUser?.id);

  // Add current user at top
  if (currentUser) {
    members.unshift({ ...currentUser, role: 'owner' });
  }

  const filteredMembers = members.filter(m =>
    m.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by role
  const roleOrder = ['owner', 'admin', 'moderator', 'member'];
  const groupedMembers = roleOrder.reduce((acc, role) => {
    const roleMembers = filteredMembers.filter(m => m.role === role);
    if (roleMembers.length > 0) {
      acc[role] = roleMembers;
    }
    return acc;
  }, {} as Record<string, typeof members>);

  // Voice participants
  const voiceParticipants = Array.from(voiceStates.values());

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-64 bg-discord-channel-sidebar border-l border-discord-border flex flex-col animate-in slide-in-from-right-2">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-discord-border">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('members')}
            className={cn(
              'px-2 py-1 rounded text-sm font-medium transition-colors',
              activeTab === 'members' ? 'bg-discord-hover text-discord-text' : 'text-discord-text-muted hover:text-discord-text'
            )}
          >
            Members
          </button>
          <button
            onClick={() => setActiveTab('pinned')}
            className={cn(
              'px-2 py-1 rounded text-sm font-medium transition-colors',
              activeTab === 'pinned' ? 'bg-discord-hover text-discord-text' : 'text-discord-text-muted hover:text-discord-text'
            )}
          >
            Pinned
          </button>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRightSidebarOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-discord-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-discord-text-muted" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-discord-input border-discord-border rounded text-sm text-discord-text placeholder-discord-text-muted focus:outline-none focus:ring-1 focus:ring-discord-blurple"
          />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {activeTab === 'members' && (
            <>
              {/* Voice Connected Section */}
              {currentVoiceChannel && voiceParticipants.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-discord-text-muted text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Volume2 className="h-3 w-3" />
                    Voice Connected
                  </h4>
                  {voiceParticipants.map((vs) => {
                    const member = members.find(m => m.id === vs.user_id);
                    return (
                      <div key={vs.user_id} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-discord-hover">
                        <UserAvatar
                          name={member?.username || vs.user_id}
                          size="sm"
                          status={vs.self_mute ? 'dnd' : 'online'}
                        />
                        <span className="text-discord-text text-sm truncate flex-1">
                          {member?.username || 'Unknown'}
                        </span>
                        {vs.self_mute && <Volume2 className="h-3.5 w-3.5 text-discord-text-muted" />}
                        {vs.self_deaf && <Volume2 className="h-3.5 w-3.5 text-discord-text-muted" />}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Member List by Role */}
              {Object.entries(groupedMembers).map(([role, roleMembers]) => (
                <div key={role} className="space-y-1">
                  <h4 className="text-discord-text-muted text-xs font-semibold uppercase tracking-wider">
                    {role.charAt(0).toUpperCase() + role.slice(1)}s
                  </h4>
                  {roleMembers.map((member) => (
                    <MemberItem
                      key={member.id}
                      member={member}
                      voiceState={voiceStates.get(member.id)}
                      isCurrentUser={member.id === currentUser?.id}
                    />
                  ))}
                </div>
              ))}

              {filteredMembers.length === 0 && (
                <div className="text-center py-8 text-discord-text-muted text-sm">
                  No members found
                </div>
              )}
            </>
          )}

          {activeTab === 'pinned' && (
            <div className="text-center py-8 text-discord-text-muted text-sm">
              <Pin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No pinned messages</p>
              <p className="text-xs">Right-click a message to pin it</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer - only show when in voice channel */}
      {currentVoiceChannel && (
        <div className="p-3 border-t border-discord-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-discord-text text-sm font-medium">Voice Channel</span>
            <span className="text-discord-text-muted text-xs">Connected</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-10 w-10 flex-1">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 flex-1">
              <ScreenShare className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 flex-1">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="destructive" className="h-10 flex-1" onClick={() => {
              // Leave voice channel
            }}>
              Disconnect
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function MemberItem({
  member,
  voiceState,
  isCurrentUser,
}: {
  member: User & { role: string };
  voiceState?: any;
  isCurrentUser: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const roleColors = {
    owner: 'text-yellow-400',
    admin: 'text-red-400',
    moderator: 'text-blue-400',
    member: '',
  };

  const roleIcons = {
    owner: '👑',
    admin: '🛡️',
    moderator: '⚔️',
    member: '',
  };

  return (
    <div className="relative group">
      <button
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-discord-hover transition-colors"
        onClick={() => setShowMenu(!showMenu)}
      >
        <UserAvatar
          src={member.avatar_url}
          name={member.username}
          size="sm"
          status={voiceState?.self_mute ? 'dnd' : member.status}
        />
        <div className="flex-1 min-w-0 flex items-center gap-1">
          <span className="text-discord-text text-sm truncate font-medium">
            {member.username}
          </span>
          {roleIcons[member.role as keyof typeof roleIcons] && (
            <span className="text-xs">{roleIcons[member.role as keyof typeof roleIcons]}</span>
          )}
          {isCurrentUser && (
            <span className="text-discord-text-muted text-xs">(you)</span>
          )}
        </div>
        {voiceState && (
          <div className="flex items-center gap-1">
            {voiceState.self_mute && <Volume2 className="h-3.5 w-3.5 text-discord-text-muted" />}
            {voiceState.self_deaf && <Volume2 className="h-3.5 w-3.5 text-discord-text-muted" />}
            {voiceState.streaming && <Video className="h-3.5 w-3.5 text-green-500" />}
          </div>
        )}
      </button>

      {/* Member context menu */}
      {showMenu && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-discord-bg border border-discord-border rounded-lg shadow-lg min-w-[180px] py-1">
          <button className="w-full px-3 py-1.5 text-left text-sm text-discord-text hover:bg-discord-hover">
            Message
          </button>
          <button className="w-full px-3 py-1.5 text-left text-sm text-discord-text hover:bg-discord-hover">
            Voice Call
          </button>
          <button className="w-full px-3 py-1.5 text-left text-sm text-discord-text hover:bg-discord-hover">
            Video Call
          </button>
          <hr className="my-1 border-discord-border" />
          <button className="w-full px-3 py-1.5 text-left text-sm text-discord-text hover:bg-discord-hover">
            Profile
          </button>
          {!isCurrentUser && (
            <>
              <hr className="my-1 border-discord-border" />
              <button className="w-full px-3 py-1.5 text-left text-sm text-discord-text hover:bg-discord-hover">
                Mute
              </button>
              <button className="w-full px-3 py-1.5 text-left text-sm text-discord-text hover:bg-discord-hover">
                Deafen
              </button>
              <button className="w-full px-3 py-1.5 text-left text-sm text-destructive hover:bg-discord-hover">
                Kick
              </button>
              <button className="w-full px-3 py-1.5 text-left text-sm text-destructive hover:bg-discord-hover">
                Ban
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}