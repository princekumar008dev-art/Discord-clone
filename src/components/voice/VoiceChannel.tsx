'use client';

import { useEffect, useState } from 'react';
import { Mic, MicOff, Headphones, HeadphoneOff, Video, VideoOff, Monitor, MonitorOff, Share2, Users, X, Volume2, VolumeX, Settings, WifiOff, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui';
import { Button } from '@/components/ui';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui';
import { useStore } from '@/lib/store';
import { joinVoiceChannel, leaveVoiceChannel, toggleMute, toggleDeafen, toggleVideo, toggleScreenShare, getRoom } from '@/lib/livekit';
import { RoomEvent, RemoteParticipant, TrackPublication } from 'livekit-client';

export function VoiceChannel() {
  const {
    currentVoiceChannel,
    setCurrentVoiceChannel,
    voiceStates,
    isMuted,
    setIsMuted,
    isDeafened,
    setIsDeafened,
    currentUser,
    currentServerId,
    currentChannelId,
  } = useStore();

  const [participants, setParticipants] = useState<Map<string, RemoteParticipant>>(new Map());
  const [localVideoTrack, setLocalVideoTrack] = useState<TrackPublication | null>(null);
  const [screenShareTrack, setScreenShareTrack] = useState<TrackPublication | null>(null);
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>('disconnected');
  const [error, setError] = useState<string | null>(null);

  // Join voice channel when currentVoiceChannel changes
  useEffect(() => {
    if (currentVoiceChannel && currentServerId && currentChannelId) {
      const channelId = currentVoiceChannel;
      const serverId = currentServerId;

      const join = async () => {
        setConnectionState('connecting');
        setError(null);
        try {
          const room = await joinVoiceChannel(channelId, serverId);
          setConnectionState('connected');

          // Set up participant tracking
          room.on(RoomEvent.ParticipantConnected, (participant) => {
            setParticipants(prev => new Map(prev).set(participant.identity, participant));
          });

          room.on(RoomEvent.ParticipantDisconnected, (participant) => {
            setParticipants(prev => {
              const next = new Map(prev);
              next.delete(participant.identity);
              return next;
            });
          });

          // Track local video
          room.localParticipant.on(RoomEvent.LocalTrackPublished, (publication) => {
            if (publication.track?.kind === 'video') {
              if (publication.source === 'screen_share') {
                setScreenShareTrack(publication);
              } else {
                setLocalVideoTrack(publication);
              }
            }
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to join voice channel');
          setConnectionState('disconnected');
          setCurrentVoiceChannel(null);
        }
      };

      join();

      return () => {
        leaveVoiceChannel();
        setParticipants(new Map());
        setLocalVideoTrack(null);
        setScreenShareTrack(null);
      };
    } else {
      leaveVoiceChannel();
      setParticipants(new Map());
      setLocalVideoTrack(null);
      setScreenShareTrack(null);
      setConnectionState('disconnected');
    }
  }, [currentVoiceChannel, currentServerId, currentChannelId, setCurrentVoiceChannel]);

  // Get all voice states including local user
  const allVoiceStates = Array.from(voiceStates.values());
  const localVoiceState = currentUser ? voiceStates.get(currentUser.id) : null;

  if (!currentVoiceChannel) {
    return null; // Voice panel handled in RightSidebar
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-discord-channel-sidebar border-t border-discord-border z-40">
      <div className="max-w-screen-2xl mx-auto">
        <div className="h-40 flex items-center justify-between p-4 gap-4">
          {/* Left: Channel info + participants */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-3 h-3 rounded-full',
                connectionState === 'connected' ? 'bg-green-500' :
                connectionState === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
              )} />
              <div>
                <p className="text-discord-text font-medium">Voice Channel</p>
                <p className="text-discord-text-muted text-sm">
                  {connectionState === 'connected' && `${participants.size + 1} connected`}
                </p>
              </div>
            </div>

            {/* Participants avatars */}
            <div className="flex -space-x-2 overflow-hidden max-w-[200px]">
              {currentUser && (
                <UserAvatar
                  src={currentUser.avatar_url}
                  name={currentUser.username}
                  size="sm"
                  status={localVoiceState?.self_mute ? 'dnd' : 'online'}
                />
              )}
              {Array.from(participants.values()).slice(0, 4).map((participant) => {
                const vs = voiceStates.get(participant.identity);
                return (
                  <UserAvatar
                    key={participant.identity}
                    name={participant.name || participant.identity}
                    size="sm"
                    status={vs?.self_mute ? 'dnd' : 'online'}
                  />
                );
              })}
              {participants.size > 4 && (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-discord-input text-discord-text-muted text-xs font-medium ml-1">
                  +{participants.size - 4}
                </div>
              )}
            </div>
          </div>

          {/* Center: Voice controls */}
          <div className="flex items-center gap-2">
            {/* Deafen */}
            <Button
              variant={isDeafened ? 'discord' : 'ghost'}
              size="icon"
              className="h-10 w-10"
              onClick={toggleDeafen}
              disabled={connectionState !== 'connected'}
            >
              {isDeafened ? <HeadphoneOff className="h-5 w-5" /> : <Headphones className="h-5 w-5" />}
            </Button>

            {/* Mute */}
            <Button
              variant={isMuted ? 'discord' : 'ghost'}
              size="icon"
              className="h-10 w-10"
              onClick={toggleMute}
              disabled={connectionState !== 'connected'}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>

            {/* Video */}
            <Button
              variant={localVideoTrack ? 'discord' : 'ghost'}
              size="icon"
              className="h-10 w-10"
              onClick={toggleVideo}
              disabled={connectionState !== 'connected'}
            >
              {localVideoTrack ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>

            {/* Screen Share */}
            <Button
              variant={screenShareTrack ? 'discord' : 'ghost'}
              size="icon"
              className="h-10 w-10"
              onClick={toggleScreenShare}
              disabled={connectionState !== 'connected'}
            >
              {screenShareTrack ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
            </Button>

            {/* Stream/Go Live */}
            <Button variant="ghost" size="icon" className="h-10 w-10" disabled>
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Right: Settings + Disconnect */}
          <div className="flex items-center gap-2 justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Voice Settings</DropdownMenuLabel>
                <DropdownMenuItem>Input Volume</DropdownMenuItem>
                <DropdownMenuItem>Output Volume</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Voice Activity</DropdownMenuItem>
                <DropdownMenuItem>Push to Talk</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Noise Suppression</DropdownMenuItem>
                <DropdownMenuItem>Echo Cancellation</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="destructive"
              size="icon"
              className="h-10 w-10"
              onClick={() => {
                leaveVoiceChannel();
                setCurrentVoiceChannel(null);
              }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-2 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
            <Button variant="ghost" size="xs" onClick={() => setError(null)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Video preview if camera on */}
        {localVideoTrack && (
          <div className="absolute bottom-48 right-4 z-30">
            <video
              autoPlay
              muted
              playsInline
              className="w-48 h-36 rounded-lg border border-discord-border"
              ref={(el) => {
                if (el && localVideoTrack.track) {
                  // @ts-ignore - track is a MediaStreamTrack at runtime
                  el.srcObject = new MediaStream([localVideoTrack.track]);
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Voice channel list item for channel sidebar
export function VoiceChannelItem({
  channel,
  isActive,
  onClick,
  participantCount = 0,
}: {
  channel: any;
  isActive: boolean;
  onClick: () => void;
  participantCount: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
        isActive
          ? 'bg-discord-blurple/20 text-discord-blurple font-medium'
          : 'text-discord-text-muted hover:text-discord-text hover:bg-discord-hover'
      )}
    >
      <div className={cn('w-5 h-5 flex items-center justify-center', isActive ? 'text-discord-blurple' : 'text-discord-text-muted')}>
        <Headphones className="h-4 w-4" />
      </div>
      <span className="truncate flex-1">{channel.name}</span>
      {participantCount > 0 && (
        <span className={cn(
          'text-xs px-1.5 py-0.5 rounded-full',
          isActive ? 'bg-discord-blurple/30 text-discord-blurple' : 'bg-discord-hover text-discord-text-muted'
        )}>
          {participantCount}
        </span>
      )}
      {hovered && !isActive && (
        <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto">
          <Users className="h-3.5 w-3.5" />
        </Button>
      )}
    </button>
  );
}