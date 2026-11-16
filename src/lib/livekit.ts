'use client';

import { Room, RoomEvent, LocalParticipant, RemoteParticipant, TrackPublication, Participant } from 'livekit-client';
import { createClient } from '@/lib/supabase/client';
import type { VoiceState } from '@/lib/types';
import { useStore } from '@/lib/store';

let room: Room | null = null;
let isConnecting = false;

export async function getLiveKitToken(channelId: string, serverId: string): Promise<{ token: string; url: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const response = await fetch('/api/livekit/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channelId,
      serverId,
      userId: user.id,
      username: user.user_metadata?.username || user.email,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get token');
  }

  return response.json();
}

export async function joinVoiceChannel(channelId: string, serverId: string): Promise<Room> {
  if (room?.state === 'connected' || isConnecting) {
    return room!;
  }

  isConnecting = true;

  try {
    const { token, url } = await getLiveKitToken(channelId, serverId);

    room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });

    // Set up event listeners
    setupRoomEvents(room, channelId, serverId);

    await room.connect(url, token);

    // Enable microphone by default
    await room.localParticipant.setMicrophoneEnabled(true);

    useStore.getState().setCurrentVoiceChannel(channelId);
    useStore.getState().setIsMuted(false);
    useStore.getState().setIsDeafened(false);

    isConnecting = false;
    return room;
  } catch (error) {
    isConnecting = false;
    throw error;
  }
}

function setupRoomEvents(room: Room, _channelId: string, _serverId: string) {
  room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
    console.log('Participant connected:', participant.identity);
    updateVoiceState(participant, true);
  });

  room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
    console.log('Participant disconnected:', participant.identity);
    updateVoiceState(participant, false);
  });

  room.on(RoomEvent.LocalTrackPublished, (publication: TrackPublication, _participant: LocalParticipant) => {
    console.log('Local track published:', publication.trackSid);
  });

  room.on(RoomEvent.TrackMuted, (_publication: TrackPublication, participant: Participant) => {
    updateParticipantMuteState(participant);
  });

  room.on(RoomEvent.TrackUnmuted, (_publication: TrackPublication, participant: Participant) => {
    updateParticipantMuteState(participant);
  });

  room.on(RoomEvent.ConnectionStateChanged, (state) => {
    console.log('Connection state:', state);
    if (state === 'disconnected') {
      useStore.getState().setCurrentVoiceChannel(null);
      useStore.getState().voiceStates.clear();
    }
  });
}

function getParticipantMuted(participant: LocalParticipant | RemoteParticipant): boolean {
  // Check if any audio track is muted
  for (const publication of participant.trackPublications.values()) {
    if (publication.kind === 'audio' && publication.isMuted) {
      return true;
    }
  }
  return false;
}

function updateVoiceState(participant: RemoteParticipant, connected: boolean) {
  const store = useStore.getState();
  const userId = participant.identity;

  if (connected) {
    const isMuted = getParticipantMuted(participant);
    const isDeafened = false; // LiveKit doesn't have deafen concept, we track locally

    const voiceState: VoiceState = {
      user_id: userId,
      channel_id: store.currentVoiceChannel || '',
      server_id: '', // Would need to track this
      session_id: participant.sid || '',
      deaf: isDeafened,
      mute: isMuted,
      self_deaf: isDeafened,
      self_mute: isMuted,
      streaming: false,
    };

    store.setVoiceState(voiceState);
  } else {
    store.removeVoiceState(userId);
  }
}

function updateParticipantMuteState(participant: Participant) {
  const store = useStore.getState();
  const userId = participant.identity;
  const existing = store.voiceStates.get(userId);

  if (existing) {
    const isMuted = getParticipantMuted(participant as LocalParticipant | RemoteParticipant);
    store.setVoiceState({
      ...existing,
      mute: isMuted,
      self_mute: isMuted,
    });
  }
}

export async function leaveVoiceChannel() {
  if (room) {
    await room.disconnect();
    room = null;
  }
  useStore.getState().setCurrentVoiceChannel(null);
  useStore.getState().voiceStates.clear();
}

export function getRoom(): Room | null {
  return room;
}

export async function toggleMute() {
  if (!room) return;
  const isMuted = getParticipantMuted(room.localParticipant);
  await room.localParticipant.setMicrophoneEnabled(!isMuted);
  useStore.getState().setIsMuted(!isMuted);
}

export async function toggleDeafen() {
  if (!room) return;
  const isDeafened = useStore.getState().isDeafened;
  // LiveKit doesn't have a direct deafen method, we mute all remote tracks
  for (const participant of room.remoteParticipants.values()) {
    for (const publication of participant.trackPublications.values()) {
      if (publication.kind === 'audio' && publication.track) {
        // @ts-ignore - track.enabled might not exist in types but works at runtime
        publication.track.enabled = !isDeafened;
      }
    }
  }
  useStore.getState().setIsDeafened(!isDeafened);
}

export async function toggleVideo() {
  if (!room) return;
  const isEnabled = room.localParticipant.isCameraEnabled;
  await room.localParticipant.setCameraEnabled(!isEnabled);
}

export async function toggleScreenShare() {
  if (!room) return;
  const isSharing = room.localParticipant.isScreenShareEnabled;
  if (isSharing) {
    await room.localParticipant.setScreenShareEnabled(false);
  } else {
    await room.localParticipant.setScreenShareEnabled(true);
  }
}