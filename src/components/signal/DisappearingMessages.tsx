'use client';

import { useState } from 'react';
import { Clock, Timer, TimerOff, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { formatDisappearingTime, parseDisappearingTime, type DisappearingTimer } from '@/lib/signal/crypto';

interface DisappearingMessagesProps {
  channelId: string;
  currentTimer: DisappearingTimer;
  onChange: (timer: DisappearingTimer) => void;
}

const timerOptions: { value: DisappearingTimer; label: string; description: string }[] = [
  { value: 0, label: 'Off', description: 'Messages never disappear' },
  { value: 30, label: '30 seconds', description: 'Messages disappear after 30 seconds' },
  { value: 60, label: '1 minute', description: 'Messages disappear after 1 minute' },
  { value: 300, label: '5 minutes', description: 'Messages disappear after 5 minutes' },
  { value: 900, label: '15 minutes', description: 'Messages disappear after 15 minutes' },
  { value: 3600, label: '1 hour', description: 'Messages disappear after 1 hour' },
  { value: 86400, label: '1 day', description: 'Messages disappear after 1 day' },
  { value: 604800, label: '1 week', description: 'Messages disappear after 1 week' },
];

export function DisappearingMessages({ channelId, currentTimer, onChange }: DisappearingMessagesProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative">
      {/* Timer Badge in Channel Header */}
      {currentTimer > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 text-discord-yellow hover:text-discord-yellow hover:bg-discord-yellow/10"
          onClick={() => setExpanded(!expanded)}
        >
          <Timer className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{formatDisappearingTime(currentTimer)}</span>
        </Button>
      )}

      {/* Dropdown Menu */}
      <div className={cn(
        'absolute right-0 top-full mt-1 z-50 bg-discord-bg border border-discord-border rounded-lg shadow-lg min-w-[180px] py-1 animate-fadeIn',
        expanded ? 'block' : 'hidden'
      )}>
        <div className="px-3 py-2 border-b border-discord-border flex items-center gap-2">
          <Timer className="h-4 w-4 text-discord-text-muted" />
          <span className="text-discord-text text-sm font-medium">Disappearing Messages</span>
        </div>

        <div className="py-1 max-h-64 overflow-y-auto">
          {timerOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setExpanded(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors',
                currentTimer === option.value
                  ? 'bg-discord-blurple/10 text-discord-blurple'
                  : 'text-discord-text hover:bg-discord-hover'
              )}
            >
              <div className="flex-1 text-left">
                <p className="font-medium">{option.label}</p>
                <p className="text-xs text-discord-text-muted">{option.description}</p>
              </div>
              {currentTimer === option.value && (
                <Check className="h-4 w-4 text-discord-blurple flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Disappearing Message Indicator for individual messages
interface DisappearingIndicatorProps {
  timestamp: number;
  timer: DisappearingTimer;
  compact?: boolean;
}

export function DisappearingIndicator({ timestamp, timer, compact = false }: DisappearingIndicatorProps) {
  if (timer === 0) return null;

  const expiresAt = timestamp + timer * 1000;
  const now = Date.now();
  const remaining = expiresAt - now;

  if (remaining <= 0) return null;

  const formatRemaining = (ms: number): string => {
    if (ms < 1000) return '<1s';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <span className={cn(
      'flex items-center gap-1 text-discord-yellow/80',
      compact ? 'text-xs' : 'text-sm'
    )}>
      <Timer className={cn('h-3 w-3', compact && 'h-2.5 w-2.5')} />
      <span>{formatRemaining(remaining)}</span>
    </span>
  );
}

// Channel header timer display
interface ChannelTimerDisplayProps {
  timer: DisappearingTimer;
  onClick?: () => void;
}

export function ChannelTimerDisplay({ timer, onClick }: ChannelTimerDisplayProps) {
  if (timer === 0) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="flex items-center gap-1 text-discord-yellow hover:text-discord-yellow hover:bg-discord-yellow/10"
      onClick={onClick}
    >
      <Timer className="h-3.5 w-3.5" />
      <span className="text-xs font-medium">{formatDisappearingTime(timer)}</span>
    </Button>
  );
}