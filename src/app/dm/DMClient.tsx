'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';

interface DMClientProps {
  user: any;
  dms: any[];
}

export function DMClient({ user, dms }: DMClientProps) {
  const { setCurrentServerId, setCurrentChannelId, setChannels, setCurrentUser, setServers } = useStore();

  useEffect(() => {
    setCurrentServerId(null);
    setCurrentChannelId(null);
    setChannels([]);
    setServers([]);
  }, [setCurrentServerId, setCurrentChannelId, setChannels, setServers]);

  return <MainLayout />;
}