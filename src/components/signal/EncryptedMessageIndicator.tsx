'use client';

import { Lock, LockOpen, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Button } from '@/components/ui';

interface EncryptedMessageIndicatorProps {
  encrypted: boolean;
  verified?: boolean;
  senderVerified?: boolean;
  className?: string;
}

export function EncryptedMessageIndicator({
  encrypted,
  verified = false,
  senderVerified = false,
  className
}: EncryptedMessageIndicatorProps) {
  if (!encrypted) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn('flex items-center gap-1 text-discord-text-muted', className)}>
            <LockOpen className="h-3.5 w-3.5" />
            <span className="text-xs">Unencrypted</span>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-discord-text">This message is not end-to-end encrypted</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('flex items-center gap-1', className)}>
          <Lock className={cn(
            'h-3.5 w-3.5',
            verified ? 'text-discord-green' : 'text-discord-blurple'
          )} />
          <span className={cn(
            'text-xs font-medium',
            verified ? 'text-discord-green' : 'text-discord-blurple'
          )}>
            {verified ? 'Encrypted' : 'Encrypted'}
          </span>
          {senderVerified && (
            <span className="text-xs text-discord-green">✓</span>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" align="start">
        <div className="space-y-1">
          <p className="text-discord-text font-medium">
            {verified ? '🔒 End-to-end encrypted' : '🔒 Encrypted'}
          </p>
          <p className="text-discord-text-muted text-xs">
            {verified
              ? 'Verified with safety number. Only you and the recipient can read this message.'
              : 'End-to-end encrypted. Verify safety number for additional security.'
            }
          </p>
          {!verified && (
            <p className="text-discord-blurple text-xs">
              Click to verify safety number
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// Encryption status banner for channel
interface ChannelEncryptionBannerProps {
  encrypted: boolean;
  allMembersVerified: boolean;
  memberCount: number;
  onVerifyClick?: () => void;
}

export function ChannelEncryptionBanner({
  encrypted,
  allMembersVerified,
  memberCount,
  onVerifyClick
}: ChannelEncryptionBannerProps) {
  if (!encrypted) return null;

  return (
    <div className={cn(
      'px-4 py-2 border-b border-discord-border flex items-center justify-between',
      allMembersVerified
        ? 'bg-green-500/10 border-green-500/20'
        : 'bg-yellow-500/10 border-yellow-500/20'
    )}>
      <div className="flex items-center gap-2">
        <Lock className={cn(
          'h-4 w-4',
          allMembersVerified ? 'text-discord-green' : 'text-discord-yellow'
        )} />
        <span className="text-sm font-medium text-discord-text">
          End-to-end encrypted
        </span>
        {allMembersVerified && (
          <span className="text-xs text-discord-green font-medium">
            ✓ {memberCount} verified
          </span>
        )}
      </div>
      {!allMembersVerified && onVerifyClick && (
        <Button variant="ghost" size="sm" onClick={onVerifyClick}>
          Verify
        </Button>
      )}
    </div>
  );
}

// Encrypted input indicator
interface EncryptedInputIndicatorProps {
  enabled: boolean;
  onToggle?: () => void;
}

export function EncryptedInputIndicator({ enabled, onToggle }: EncryptedInputIndicatorProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 rounded-lg transition-colors',
            enabled
              ? 'text-discord-blurple hover:bg-discord-blurple/10'
              : 'text-discord-text-muted hover:text-discord-text hover:bg-discord-hover'
          )}
          onClick={onToggle}
          disabled={!onToggle}
        >
          <Lock className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-discord-text">
          {enabled ? 'End-to-end encryption enabled' : 'Encryption unavailable'}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}