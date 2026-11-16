export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  created_at: string;
}

export interface Server {
  id: string;
  name: string;
  icon_url?: string;
  owner_id: string;
  created_at: string;
  members?: ServerMember[];
  channels?: Channel[];
}

export interface ServerMember {
  id: string;
  server_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joined_at: string;
  user?: User;
}

export interface Channel {
  id: string;
  server_id: string;
  name: string;
  type: 'text' | 'voice' | 'category';
  position: number;
  topic?: string;
  created_at: string;
  messages?: Message[];
}

export interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  encrypted?: boolean;
  encrypted_content?: EncryptedContent;
  attachments?: Attachment[];
  reply_to?: string;
  created_at: string;
  updated_at?: string;
  user?: User;
  reactions?: Reaction[];
  disappearing_timer?: DisappearingTimer;
  expires_at?: string;
}

export interface EncryptedContent {
  type: number;
  body: number[];
  identityKey?: number[];
  senderDeviceId: number;
}

export type DisappearingTimer = 0 | 30 | 60 | 300 | 900 | 3600 | 86400 | 604800;

export interface SafetyNumber {
  user_id: string;
  contact_id: string;
  safety_number: string;
  verified: boolean;
  verified_at?: string;
}

export interface SignalPreKeyBundle {
  identityKey: string;
  registrationId: number;
  preKey: { keyId: number; publicKey: string };
  signedPreKey: { keyId: number; publicKey: string; signature: string };
  kyberPreKey?: { keyId: number; publicKey: string };
}

export interface Attachment {
  id: string;
  message_id: string;
  url: string;
  filename: string;
  size: number;
  content_type: string;
}

export interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface DirectMessage {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  messages?: Message[];
  user1?: User;
  user2?: User;
}

export interface VoiceState {
  user_id: string;
  channel_id: string;
  server_id: string;
  session_id: string;
  deaf: boolean;
  mute: boolean;
  self_deaf: boolean;
  self_mute: boolean;
  streaming: boolean;
  user?: User;
}

export interface LiveKitToken {
  token: string;
  url: string;
}