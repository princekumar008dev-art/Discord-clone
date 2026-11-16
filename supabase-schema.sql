-- Discord Clone Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'idle', 'dnd', 'offline')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Servers table
CREATE TABLE public.servers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  icon_url TEXT,
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Server members table
CREATE TABLE public.server_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  server_id UUID REFERENCES public.servers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(server_id, user_id)
);

-- Channels table
CREATE TABLE public.channels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  server_id UUID REFERENCES public.servers(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'voice', 'category')),
  position INTEGER DEFAULT 0,
  topic TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  encrypted BOOLEAN DEFAULT FALSE,
  encrypted_content JSONB,
  reply_to UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  disappearing_timer INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Attachments table
CREATE TABLE public.attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  size INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reactions table
CREATE TABLE public.reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Direct Messages table
CREATE TABLE public.direct_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user1_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- DM Messages table
CREATE TABLE public.dm_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  dm_id UUID REFERENCES public.direct_messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voice States table (for tracking who's in voice channels)
CREATE TABLE public.voice_states (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE NOT NULL,
  server_id UUID REFERENCES public.servers(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT NOT NULL,
  deaf BOOLEAN DEFAULT FALSE,
  mute BOOLEAN DEFAULT FALSE,
  self_deaf BOOLEAN DEFAULT FALSE,
  self_mute BOOLEAN DEFAULT FALSE,
  streaming BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, channel_id)
);

-- Signal Keys table (for E2EE)
CREATE TABLE public.signal_keys (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  identity_key TEXT NOT NULL,
  registration_id INTEGER NOT NULL,
  pre_keys JSONB NOT NULL DEFAULT '{}',
  signed_pre_key JSONB NOT NULL,
  kyber_pre_keys JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safety Numbers table (for verification)
CREATE TABLE public.safety_numbers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  safety_number TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, contact_id)
);

-- Channel members table (for encryption key distribution)
CREATE TABLE public.channel_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);

-- Add disappearing_timer to channels
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS disappearing_timer INTEGER DEFAULT 0;

-- Indexes for performance
CREATE INDEX idx_messages_channel_id ON public.messages(channel_id);
CREATE INDEX idx_messages_user_id ON public.messages(user_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_messages_expires_at ON public.messages(expires_at);
CREATE INDEX idx_channels_server_id ON public.channels(server_id);
CREATE INDEX idx_server_members_user_id ON public.server_members(user_id);
CREATE INDEX idx_server_members_server_id ON public.server_members(server_id);
CREATE INDEX idx_reactions_message_id ON public.reactions(message_id);
CREATE INDEX idx_voice_states_channel_id ON public.voice_states(channel_id);
CREATE INDEX idx_dm_messages_dm_id ON public.dm_messages(dm_id);
CREATE INDEX idx_channel_members_channel_id ON public.channel_members(channel_id);
CREATE INDEX idx_channel_members_user_id ON public.channel_members(user_id);
CREATE INDEX idx_safety_numbers_user_id ON public.safety_numbers(user_id);

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: can read all, can update own
CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Servers: members can view, owner can update/delete
CREATE POLICY "Members can view servers" ON public.servers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.server_members WHERE server_id = id AND user_id = auth.uid())
);
CREATE POLICY "Owner can update server" ON public.servers FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owner can delete server" ON public.servers FOR DELETE USING (auth.uid() = owner_id);
CREATE POLICY "Authenticated users can create servers" ON public.servers FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Server members: members can view, admins can manage
CREATE POLICY "Members can view server members" ON public.server_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.server_members sm WHERE sm.server_id = server_id AND sm.user_id = auth.uid())
);
CREATE POLICY "Admins can manage members" ON public.server_members FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.server_members
    WHERE server_id = server_members.server_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- Channels: members can view, admins can manage
CREATE POLICY "Members can view channels" ON public.channels FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.server_members WHERE server_id = channels.server_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage channels" ON public.channels FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.server_members
    WHERE server_id = channels.server_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- Messages: members can view, authors can manage
CREATE POLICY "Members can view messages" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.channels c
    JOIN public.server_members sm ON sm.server_id = c.server_id
    WHERE c.id = messages.channel_id AND sm.user_id = auth.uid()
  )
);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authors can update messages" ON public.messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Authors can delete messages" ON public.messages FOR DELETE USING (auth.uid() = user_id);

-- Attachments: same as messages
CREATE POLICY "Members can view attachments" ON public.attachments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.channels c ON c.id = m.channel_id
    JOIN public.server_members sm ON sm.server_id = c.server_id
    WHERE m.id = attachments.message_id AND sm.user_id = auth.uid()
  )
);
CREATE POLICY "Authors can manage attachments" ON public.attachments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.messages WHERE id = attachments.message_id AND user_id = auth.uid()
  )
);

-- Reactions: members can view, users can manage own
CREATE POLICY "Members can view reactions" ON public.reactions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.channels c ON c.id = m.channel_id
    JOIN public.server_members sm ON sm.server_id = c.server_id
    WHERE m.id = reactions.message_id AND sm.user_id = auth.uid()
  )
);
CREATE POLICY "Users can manage own reactions" ON public.reactions FOR ALL USING (auth.uid() = user_id);

-- Direct Messages: participants can view
CREATE POLICY "Participants can view DMs" ON public.direct_messages FOR SELECT USING (
  auth.uid() = user1_id OR auth.uid() = user2_id
);
CREATE POLICY "Users can create DMs" ON public.direct_messages FOR INSERT WITH CHECK (
  auth.uid() = user1_id OR auth.uid() = user2_id
);

-- DM Messages: participants can view
CREATE POLICY "Participants can view DM messages" ON public.dm_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.direct_messages WHERE id = dm_messages.dm_id AND (user1_id = auth.uid() OR user2_id = auth.uid())
  )
);
CREATE POLICY "Participants can send DM messages" ON public.dm_messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.direct_messages WHERE id = dm_messages.dm_id AND (user1_id = auth.uid() OR user2_id = auth.uid())
  )
);

-- Voice States: members can view, users can manage own
CREATE POLICY "Members can view voice states" ON public.voice_states FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.server_members WHERE server_id = voice_states.server_id AND user_id = auth.uid()
  )
);
CREATE POLICY "Users can manage own voice state" ON public.voice_states FOR ALL USING (auth.uid() = user_id);

-- Signal Keys: users can manage own keys, channel members can read
CREATE POLICY "Users can manage own signal keys" ON public.signal_keys FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Channel members can view signal keys" ON public.signal_keys FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.channel_members cm
    WHERE cm.user_id = signal_keys.user_id
    AND EXISTS (
      SELECT 1 FROM public.channel_members cm2
      WHERE cm2.channel_id = cm.channel_id AND cm2.user_id = auth.uid()
    )
  )
);

-- Safety Numbers: users can manage own verifications
CREATE POLICY "Users can manage own safety numbers" ON public.safety_numbers FOR ALL USING (auth.uid() = user_id);

-- Channel Members: members can view, users can manage own
CREATE POLICY "Members can view channel members" ON public.channel_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.channel_members cm
    WHERE cm.channel_id = channel_members.channel_id AND cm.user_id = auth.uid()
  )
);
CREATE POLICY "Users can manage own channel membership" ON public.channel_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_servers_updated_at BEFORE UPDATE ON public.servers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON public.channels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_direct_messages_updated_at BEFORE UPDATE ON public.direct_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_voice_states_updated_at BEFORE UPDATE ON public.voice_states FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_signal_keys_updated_at BEFORE UPDATE ON public.signal_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_channel_members_updated_at BEFORE UPDATE ON public.channel_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.server_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.voice_states;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.signal_keys;
ALTER PUBLICATION supabase_realtime ADD TABLE public.safety_numbers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_members;