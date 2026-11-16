'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Server, Channel, Message, VoiceState } from '@/lib/types';

interface AppState {
  // User
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  // Servers
  servers: Server[];
  setServers: (servers: Server[]) => void;
  addServer: (server: Server) => void;
  updateServer: (id: string, data: Partial<Server>) => void;
  removeServer: (id: string) => void;

  // Current server/channel
  currentServerId: string | null;
  setCurrentServerId: (id: string | null) => void;
  currentChannelId: string | null;
  setCurrentChannelId: (id: string | null) => void;

  // Channels (for current server)
  channels: Channel[];
  setChannels: (channels: Channel[]) => void;
  addChannel: (channel: Channel) => void;
  updateChannel: (id: string, data: Partial<Channel>) => void;
  removeChannel: (id: string) => void;

  // Messages (for current channel)
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, data: Partial<Message>) => void;
  removeMessage: (id: string) => void;
  optimisticMessages: Map<string, Message>;
  addOptimisticMessage: (tempId: string, message: Message) => void;
  removeOptimisticMessage: (tempId: string) => void;

  // Voice
  voiceStates: Map<string, VoiceState>;
  setVoiceState: (state: VoiceState) => void;
  removeVoiceState: (userId: string) => void;
  currentVoiceChannel: string | null;
  setCurrentVoiceChannel: (id: string | null) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  isDeafened: boolean;
  setIsDeafened: (deafened: boolean) => void;

  // UI
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  rightSidebarOpen: boolean;
  setRightSidebarOpen: (open: boolean) => void;
  userMenuOpen: boolean;
  setUserMenuOpen: (open: boolean) => void;

  // Direct Messages
  dms: Array<{ id: string; user: User; lastMessage?: Message; unread: number }>;
  setDMs: (dms: AppState['dms']) => void;
  addDM: (dm: AppState['dms'][0]) => void;

  // Unread counts
  unreadCounts: Map<string, number>;
  incrementUnread: (channelId: string) => void;
  clearUnread: (channelId: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // User
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),

      // Servers
      servers: [],
      setServers: (servers) => set({ servers }),
      addServer: (server) => set((state) => ({ servers: [server, ...state.servers] })),
      updateServer: (id, data) => set((state) => ({
        servers: state.servers.map(s => s.id === id ? { ...s, ...data } : s)
      })),
      removeServer: (id) => set((state) => ({
        servers: state.servers.filter(s => s.id !== id)
      })),

      // Current server/channel
      currentServerId: null,
      setCurrentServerId: (id) => set({ currentServerId: id }),
      currentChannelId: null,
      setCurrentChannelId: (id) => set({ currentChannelId: id }),

      // Channels
      channels: [],
      setChannels: (channels) => set({ channels }),
      addChannel: (channel) => set((state) => ({ channels: [...state.channels, channel] })),
      updateChannel: (id, data) => set((state) => ({
        channels: state.channels.map(c => c.id === id ? { ...c, ...data } : c)
      })),
      removeChannel: (id) => set((state) => ({
        channels: state.channels.filter(c => c.id !== id)
      })),

      // Messages
      messages: [],
      setMessages: (messages) => set({ messages }),
      addMessage: (message) => set((state) => ({
        messages: [...state.messages, message].sort((a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      })),
      updateMessage: (id, data) => set((state) => ({
        messages: state.messages.map(m => m.id === id ? { ...m, ...data } : m)
      })),
      removeMessage: (id) => set((state) => ({
        messages: state.messages.filter(m => m.id !== id)
      })),
      optimisticMessages: new Map(),
      addOptimisticMessage: (tempId, message) => set((state) => {
        const newMap = new Map(state.optimisticMessages);
        newMap.set(tempId, message);
        return { optimisticMessages: newMap };
      }),
      removeOptimisticMessage: (tempId) => set((state) => {
        const newMap = new Map(state.optimisticMessages);
        newMap.delete(tempId);
        return { optimisticMessages: newMap };
      }),

      // Voice
      voiceStates: new Map(),
      setVoiceState: (state) => set((prev) => {
        const newMap = new Map(prev.voiceStates);
        newMap.set(state.user_id, state);
        return { voiceStates: newMap };
      }),
      removeVoiceState: (userId) => set((prev) => {
        const newMap = new Map(prev.voiceStates);
        newMap.delete(userId);
        return { voiceStates: newMap };
      }),
      currentVoiceChannel: null,
      setCurrentVoiceChannel: (id) => set({ currentVoiceChannel: id }),
      isMuted: false,
      setIsMuted: (muted) => set({ isMuted: muted }),
      isDeafened: false,
      setIsDeafened: (deafened) => set({ isDeafened: deafened }),

      // UI
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      rightSidebarOpen: false,
      setRightSidebarOpen: (open) => set({ rightSidebarOpen: open }),
      userMenuOpen: false,
      setUserMenuOpen: (open) => set({ userMenuOpen: open }),

      // DMs
      dms: [],
      setDMs: (dms) => set({ dms }),
      addDM: (dm) => set((state) => ({ dms: [dm, ...state.dms] })),

      // Unread counts
      unreadCounts: new Map(),
      incrementUnread: (channelId) => set((state) => {
        const newMap = new Map(state.unreadCounts);
        newMap.set(channelId, (newMap.get(channelId) || 0) + 1);
        return { unreadCounts: newMap };
      }),
      clearUnread: (channelId) => set((state) => {
        const newMap = new Map(state.unreadCounts);
        newMap.set(channelId, 0);
        return { unreadCounts: newMap };
      }),
    }),
    {
      name: 'discord-clone-store',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        rightSidebarOpen: state.rightSidebarOpen,
        isMuted: state.isMuted,
        isDeafened: state.isDeafened,
      }),
    }
  )
);