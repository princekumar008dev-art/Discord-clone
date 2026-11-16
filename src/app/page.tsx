import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MessageSquare, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user's servers
  const { data: servers } = await supabase
    .from('servers')
    .select(`
      *,
      server_members!inner(user_id)
    `)
    .eq('server_members.user_id', user.id)
    .order('created_at', { ascending: false });

  // If user has servers, redirect to first one
  if (servers && servers.length > 0) {
    const firstServer = servers[0];
    const { data: channels } = await supabase
      .from('channels')
      .select('*')
      .eq('server_id', firstServer.id)
      .eq('type', 'text')
      .order('position', { ascending: true })
      .limit(1);

    if (channels && channels.length > 0) {
      redirect(`/server/${firstServer.id}/channel/${channels[0].id}`);
    } else {
      redirect(`/server/${firstServer.id}`);
    }
  }

  // No servers - show empty state with create server option
  return (
    <div className="min-h-screen bg-discord-bg flex items-center justify-center">
      <div className="text-center px-4">
        <div className="w-24 h-24 bg-discord-blurple/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <MessageSquare className="h-12 w-12 text-discord-blurple" />
        </div>
        <h1 className="text-3xl font-bold text-discord-text mb-2">Welcome to Discord Clone</h1>
        <p className="text-discord-text-muted mb-8 max-w-md mx-auto">
          You don't have any servers yet. Create your first server to start chatting with friends!
        </p>
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('create-server'));
          }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-discord-blurple text-white rounded-lg font-medium hover:bg-discord-blurple/90 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Create a Server
        </button>
      </div>
    </div>
  );
}