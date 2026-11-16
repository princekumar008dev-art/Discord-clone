'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import type { Server, Channel, User } from '@/lib/types';

interface ServerChannelClientProps {
  server: Server;
  channel: Channel;
  channels: Channel[];
  user: any;
  profile: User | null;
  memberRole: string;
}

export function ServerChannelClient({
  server,
  channel,
  channels,
  user,
  profile,
  memberRole,
}: ServerChannelClientProps) {
  const {
    setServers,
    setChannels,
    setCurrentServerId,
    setCurrentChannelId,
    setCurrentUser,
    currentServerId,
    currentChannelId,
  } = useStore();

  // Initialize store on mount
  useEffect(() => {
    setCurrentServerId(server.id);
    setCurrentChannelId(channel.id);
    setChannels(channels);
    if (profile) {
      setCurrentUser(profile);
    }
  }, [server.id, channel.id, channels, profile]);

  // Load servers on first load
  useEffect(() => {
    const loadServers = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('servers')
        .select(`
          *,
          server_members!inner(user_id)
        `)
        .eq('server_members.user_id', user.id);
      if (data) setServers(data);
    };
    loadServers();
  }, [user.id, setServers]);

  return <MainLayout />;
}