import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DMClient } from './DMClient';

export default async function DMPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch DMs
  const { data: dms } = await supabase
    .from('direct_messages')
    .select(`
      *,
      user1:users!direct_messages_user1_id_fkey(id, username, avatar_url, status),
      user2:users!direct_messages_user2_id_fkey(id, username, avatar_url, status)
    `)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order('updated_at', { ascending: false });

  return <DMClient user={user} dms={dms || []} />;
}