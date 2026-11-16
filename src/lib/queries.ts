import { createClient } from '@/lib/supabase/server';
import type { Server, Channel, Message, User } from '@/lib/types';

export async function getUserServers(userId: string): Promise<Server[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('servers')
    .select(`
      *,
      server_members!inner(user_id)
    `)
    .eq('server_members.user_id', userId)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function getServerChannels(serverId: string): Promise<Channel[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('channels')
    .select('*')
    .eq('server_id', serverId)
    .order('position', { ascending: true });
  return data || [];
}

export async function getChannelMessages(channelId: string, limit = 100): Promise<Message[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('messages')
    .select(`
      *,
      user:users!messages_user_id_fkey(id, username, avatar_url, status)
    `)
    .eq('channel_id', channelId)
    .order('created_at', { ascending: true })
    .limit(limit);
  return data || [];
}

export async function getUserProfile(userId: string): Promise<User | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

export async function getDirectMessages(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('direct_messages')
    .select(`
      *,
      user1:users!direct_messages_user1_id_fkey(id, username, avatar_url, status),
      user2:users!direct_messages_user2_id_fkey(id, username, avatar_url, status),
      messages:messages!direct_messages_id_fkey(*, user:users!messages_user_id_fkey(id, username, avatar_url, status))
    `)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('updated_at', { ascending: false });
  return data || [];
}