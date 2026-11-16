'use client';

import { useState } from 'react';
import { Menu, ChevronLeft, ChevronRight, Users, MessageSquare, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { ServerSidebar } from './ServerSidebar';
import { ChannelSidebar } from './ChannelSidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import { RightSidebar } from './RightSidebar';
import { VoiceChannel } from '@/components/voice/VoiceChannel';
import { useStore } from '@/lib/store';

export function MainLayout() {
  const { sidebarOpen, setSidebarOpen, rightSidebarOpen, setRightSidebarOpen } = useStore();
  const [channelSidebarOpen, setChannelSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-discord-bg overflow-hidden">
      {/* Server Sidebar */}
      <div className={cn(
        'transition-all duration-200 ease-in-out',
        sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'
      )}>
        <ServerSidebar />
      </div>

      {/* Channel Sidebar */}
      <div className={cn(
        'transition-all duration-200 ease-in-out flex-shrink-0',
        channelSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
      )}>
        {channelSidebarOpen && <ChannelSidebar />}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile header */}
        <div className="lg:hidden h-14 px-3 border-b border-discord-border flex items-center justify-between bg-discord-channel-sidebar">
          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1 text-center">
            <h3 className="text-discord-text font-semibold text-sm">Channel Name</h3>
          </div>
          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setRightSidebarOpen(!rightSidebarOpen)}>
            <Users className="h-5 w-5" />
          </Button>
        </div>

        <ChatArea />
      </div>

      {/* Right Sidebar */}
      <RightSidebar />

      {/* Voice Channel Bar */}
      <VoiceChannel />

      {/* Mobile sidebar toggles */}
      {!sidebarOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed left-4 top-4 z-40 lg:hidden h-10 w-10 rounded-full bg-discord-bg border border-discord-border"
          onClick={() => setSidebarOpen(true)}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}