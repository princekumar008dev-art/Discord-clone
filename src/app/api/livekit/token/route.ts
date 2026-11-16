import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { channelId, serverId, userId, username } = await request.json();

    if (!channelId || !serverId) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Verify user is member of server
    const { data: member } = await supabase
      .from('server_members')
      .select('id')
      .eq('server_id', serverId)
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json({ message: 'Not a member of this server' }, { status: 403 });
    }

    // Verify channel exists and is voice type
    const { data: channel } = await supabase
      .from('channels')
      .select('id, type')
      .eq('id', channelId)
      .eq('server_id', serverId)
      .single();

    if (!channel || channel.type !== 'voice') {
      return NextResponse.json({ message: 'Invalid voice channel' }, { status: 404 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      console.error('LiveKit credentials not configured');
      return NextResponse.json({ message: 'Voice not configured' }, { status: 503 });
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: user.id,
      name: username || user.user_metadata?.username || user.email,
      ttl: '6h',
    });

    at.addGrant({
      roomJoin: true,
      room: `voice-${serverId}-${channelId}`,
      roomCreate: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({
      token,
      url: livekitUrl,
    });
  } catch (error) {
    console.error('LiveKit token error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}