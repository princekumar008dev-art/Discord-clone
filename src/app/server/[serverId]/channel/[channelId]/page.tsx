import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { ServerChannelClient } from './ServerChannelClient';

interface Props {
  params: Promise<{ serverId: string; channelId: string }>;
}

export default async function ServerChannelPage({ params }: Props) {
  const { serverId, channelId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verify user is member of server
  const { data: member } = await supabase
    .from('server_members')
    .select('id, role')
    .eq('server_id', serverId)
    .eq('user_id', user.id)
    .single();

  if (!member) {
    redirect('/');
  }

  // Fetch server data
  const { data: server } = await supabase
    .from('servers')
    .select('*')
    .eq('id', serverId)
    .single();

  if (!server) {
    notFound();
  }

  // Fetch channels
  const { data: channels } = await supabase
    .from('channels')
    .select('*')
    .eq('server_id', serverId)
    .order('position', { ascending: true });

  // Fetch current channel
  const { data: channel } = await supabase
    .from('channels')
    .select('*')
    .eq('id', channelId)
    .eq('server_id', serverId)
    .single();

  if (!channel) {
    notFound();
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  // Pass data to client component via props
  return (
    <ServerChannelClient
      server={server}
      channel={channel}
      channels={channels || []}
      user={user}
      profile={profile}
      memberRole={member.role}
    />
  );
}