'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, Lock, Speaker, Hash, ChevronDown, ChevronRight, Edit, Trash2, Bell, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import type { Channel } from '@/lib/types';

export function ChannelSidebar() {
  const pathname = usePathname();
  const { channels, currentChannelId, setCurrentChannelId, currentServerId, currentUser, addChannel } = useStore();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [hoveredChannel, setHoveredChannel] = useState<string | null>(null);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'text' | 'voice'>('text');

  if (!currentServerId) {
    return (
      <div className="flex flex-col h-full bg-discord-channel-sidebar w-64 border-r border-discord-border flex-shrink-0">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-discord-text-muted text-sm">Select a server to view channels</p>
        </div>
      </div>
    );
  }

  const serverChannels = channels.filter(c => c.server_id === currentServerId);
  const categories = serverChannels.filter(c => c.type === 'category');
  const textChannels = serverChannels.filter(c => c.type === 'text');
  const voiceChannels = serverChannels.filter(c => c.type === 'voice');

  const handleCreateChannel = async () => {
    if (!newChannelName.trim() || !currentServerId || !currentUser) return;

    const supabase = createClient();
    const maxPos = Math.max(...serverChannels.map(c => c.position), 0);

    const { data, error } = await supabase
      .from('channels')
      .insert({
        server_id: currentServerId,
        name: newChannelName.trim(),
        type: newChannelType,
        position: maxPos + 1,
      })
      .select()
      .single();

    if (!error && data) {
      addChannel(data);
      setShowCreateChannel(false);
      setNewChannelName('');
    }
  };

  const isActive = (channelId: string) => pathname === `/server/${currentServerId}/channel/${channelId}`;

  return (
    <div className="flex flex-col h-full bg-discord-channel-sidebar w-64 border-r border-discord-border flex-shrink-0">
      {/* Server Header */}
      <div className="px-3 py-2 border-b border-discord-border flex items-center justify-between">
        <h3 className="text-discord-text font-semibold text-sm truncate">SERVER NAME</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setShowCreateChannel(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {/* Text Channels */}
        <ChannelCategory
          name="TEXT CHANNELS"
          channels={textChannels}
          icon={Hash}
          isActive={isActive}
          onSelect={setCurrentChannelId}
          hoveredChannel={hoveredChannel}
          setHoveredChannel={setHoveredChannel}
          onCreateClick={() => {
            setNewChannelType('text');
            setShowCreateChannel(true);
          }}
        />

        {/* Voice Channels */}
        <ChannelCategory
          name="VOICE CHANNELS"
          channels={voiceChannels}
          icon={Speaker}
          isActive={isActive}
          onSelect={setCurrentChannelId}
          hoveredChannel={hoveredChannel}
          setHoveredChannel={setHoveredChannel}
          onCreateClick={() => {
            setNewChannelType('voice');
            setShowCreateChannel(true);
          }}
        />
      </div>

      {/* Create Channel Modal */}
      {showCreateChannel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-discord-bg w-full max-w-md rounded-lg p-6">
            <h2 className="text-discord-text text-lg font-semibold mb-4">Create Channel</h2>
            <div className="space-y-3 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="channelType"
                  value="text"
                  checked={newChannelType === 'text'}
                  onChange={() => setNewChannelType('text')}
                  className="text-discord-blurple"
                />
                <Hash className="h-4 w-4 text-discord-text-muted" />
                <span className="text-discord-text text-sm">Text Channel</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="channelType"
                  value="voice"
                  checked={newChannelType === 'voice'}
                  onChange={() => setNewChannelType('voice')}
                  className="text-discord-blurple"
                />
                <Speaker className="h-4 w-4 text-discord-text-muted" />
                <span className="text-discord-text text-sm">Voice Channel</span>
              </label>
            </div>
            <Input
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder={newChannelType === 'text' ? 'channel-name' : 'Voice Channel'}
              autoFocus
              className="mb-4"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateChannel()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowCreateChannel(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateChannel} disabled={!newChannelName.trim()}>
                Create Channel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChannelCategory({
  name,
  channels,
  icon: Icon,
  isActive,
  onSelect,
  hoveredChannel,
  setHoveredChannel,
  onCreateClick,
}: {
  name: string;
  channels: Channel[];
  icon: React.ComponentType<{ className?: string }>;
  isActive: (id: string) => boolean;
  onSelect: (id: string) => void;
  hoveredChannel: string | null;
  setHoveredChannel: (id: string | null) => void;
  onCreateClick: () => void;
}) {
  if (channels.length === 0) return null;

  return (
    <div className="space-y-1 mb-4">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-discord-text-muted text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
          <Icon className="h-3.5 w-3.5" />
          {name}
        </span>
        <Button
          variant="ghost"
          size="xs"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onCreateClick}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {channels.map((channel) => (
        <ChannelItem
          key={channel.id}
          channel={channel}
          isActive={isActive(channel.id)}
          onClick={() => onSelect(channel.id)}
          onMouseEnter={() => setHoveredChannel(channel.id)}
          onMouseLeave={() => setHoveredChannel(null)}
          hoveredChannel={hoveredChannel}
        />
      ))}
    </div>
  );
}

function ChannelItem({
  channel,
  isActive,
  onClick,
  onMouseEnter,
  onMouseLeave,
  hoveredChannel,
}: {
  channel: Channel;
  isActive: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  hoveredChannel: string | null;
}) {
  const Icon = channel.type === 'voice' ? Speaker : Hash;
  const isVoice = channel.type === 'voice';

  return (
    <div className="group relative" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <Link
        href={`/server/${channel.server_id}/channel/${channel.id}`}
        onClick={(e) => {
          e.preventDefault();
          onClick();
        }}
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
          isActive
            ? 'bg-discord-blurple/20 text-discord-blurple font-medium'
            : 'text-discord-text-muted hover:text-discord-text hover:bg-discord-hover'
        )}
      >
        <Icon className={cn('h-4 w-4 flex-shrink-0', isVoice && 'text-green-500')} />
        <span className="truncate flex-1">{channel.name}</span>

        {/* Channel actions on hover */}
        {hoveredChannel === channel.id && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                <MessageSquare className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Channel Options</DropdownMenuLabel>
              <DropdownMenuItem>Edit Channel</DropdownMenuItem>
              <DropdownMenuItem>Notification Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Delete Channel</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </Link>
    </div>
  );
}