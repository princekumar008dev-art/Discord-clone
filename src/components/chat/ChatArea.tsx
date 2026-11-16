'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Paperclip, Smile, Gift, Send, Mic, Video, MoreVertical, Reply, Flag, Trash2, Edit, Copy, Pin, Hash, MessageSquare } from 'lucide-react';
import { cn, formatTime } from '@/lib/utils';
import { UserAvatar } from '@/components/ui';
import { Button } from '@/components/ui';
import { Textarea } from '@/components/ui';
import { ScrollArea } from '@/components/ui';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui';
import { useStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import type { Message, User, DisappearingTimer } from '@/lib/types';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useSignal, useEncryptedMessage } from '@/lib/signal/hooks';
import {
  EncryptedMessageIndicator,
  ChannelEncryptionBanner,
  EncryptedInputIndicator,
  ChannelTimerDisplay,
  DisappearingIndicator,
} from '@/components/signal';

export function ChatArea() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    currentChannelId,
    currentServerId,
    messages,
    setMessages,
    addMessage,
    updateMessage,
    removeMessage,
    currentUser,
    optimisticMessages,
    addOptimisticMessage,
    removeOptimisticMessage,
    clearUnread,
  } = useStore();

  const {
    getDisappearingTimer,
    formatDisappearingTime,
    encryptForChannel,
    decryptMessageContent,
  } = useSignal();

  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [disappearingTimer, setDisappearingTimer] = useState<DisappearingTimer>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Extract channel ID from pathname
  const channelId = pathname.split('/channel/')[1];

  // Load disappearing timer for channel
  useEffect(() => {
    if (channelId) {
      getDisappearingTimer(channelId).then(setDisappearingTimer);
    }
  }, [channelId, getDisappearingTimer]);

  // Load messages when channel changes
  useEffect(() => {
    if (!channelId || !currentServerId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setIsLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          user:users!messages_user_id_fkey(id, username, avatar_url, status)
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (!error && data) {
        setMessages(data as Message[]);
      }
      setIsLoading(false);
      clearUnread(channelId);
    };

    loadMessages();

    // Subscribe to realtime
    const supabase = createClient();
    channelRef.current = supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          // Check if it's not our own optimistic message
          if (newMsg.user_id !== currentUser?.id) {
            addMessage(newMsg);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` },
        (payload) => {
          updateMessage(payload.new.id, payload.new as Partial<Message>);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` },
        (payload) => {
          removeMessage(payload.old.id);
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [channelId, currentServerId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !channelId || !currentUser) return;

    const tempId = `temp-${Date.now()}`;
    let encryptedContent: Message['encrypted_content'] | undefined;
    let encrypted = false;

    // Encrypt message if encryption is enabled
    if (encryptionEnabled) {
      try {
        const encryptedMap = await encryptForChannel(channelId, newMessage.trim());
        // For simplicity, we'll store the first recipient's encryption
        // In production, you'd store per-recipient encryption
        const firstEntry = encryptedMap.entries().next().value;
        if (firstEntry) {
          encryptedContent = firstEntry[1];
          encrypted = true;
        }
      } catch (error) {
        console.error('Encryption failed, sending unencrypted:', error);
      }
    }

    const optimisticMsg: Message = {
      id: tempId,
      channel_id: channelId,
      user_id: currentUser.id,
      content: newMessage.trim(),
      encrypted,
      encrypted_content: encryptedContent,
      disappearing_timer: disappearingTimer,
      created_at: new Date().toISOString(),
      user: currentUser,
      attachments: [],
      reactions: [],
    };

    // Add optimistic message
    addOptimisticMessage(tempId, optimisticMsg);
    setNewMessage('');

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('messages')
        .insert({
          channel_id: channelId,
          user_id: currentUser.id,
          content: newMessage.trim(),
          encrypted,
          encrypted_content: encryptedContent,
          disappearing_timer: disappearingTimer,
        })
        .select(`
          *,
          user:users!messages_user_id_fkey(id, username, avatar_url, status)
        `)
        .single();

      if (error) throw error;

      // Replace optimistic with real message
      removeOptimisticMessage(tempId);
      addMessage(data as Message);
    } catch (error) {
      console.error('Failed to send message:', error);
      removeOptimisticMessage(tempId);
      // Could add error toast here
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as unknown as React.FormEvent);
    }
  };

  if (!channelId || !currentServerId) {
    return (
      <div className="flex-1 flex flex-col bg-discord-bg">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-discord-text text-xl font-semibold mb-2">Welcome to Discord Clone</h2>
            <p className="text-discord-text-muted">Select a channel to start chatting</p>
          </div>
        </div>
      </div>
    );
  }

  // Combine real and optimistic messages
  const allMessages = [
    ...messages,
    ...Array.from(optimisticMessages.values()),
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return (
    <div className="flex-1 flex flex-col bg-discord-bg min-w-0">
      {/* Channel Header */}
      <div className="h-16 px-4 border-b border-discord-border flex items-center justify-between bg-discord-channel-sidebar">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Hash className="h-5 w-5 text-discord-text-muted flex-shrink-0" />
          <div className="min-w-0">
            <h3 className="text-discord-text font-semibold truncate">channel-name</h3>
            <p className="text-discord-text-muted text-xs truncate">Topic goes here</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Encryption Indicator */}
          <EncryptedInputIndicator
            enabled={encryptionEnabled}
            onToggle={() => setEncryptionEnabled(!encryptionEnabled)}
          />
          {/* Disappearing Messages Timer */}
          <ChannelTimerDisplay
            timer={disappearingTimer}
            onClick={() => {}}
          />
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pin className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-20">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-discord-blurple border-t-transparent" />
            </div>
          ) : allMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-discord-text-muted">
              <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Send the first message!</p>
            </div>
          ) : (
            allMessages.map((message, index) => (
              <MessageItem
                key={message.id}
                message={message}
                currentUser={currentUser}
                showAvatar={index === 0 || allMessages[index - 1]?.user_id !== message.user_id}
                onUpdate={(content) => updateMessage(message.id, { content, updated_at: new Date().toISOString() })}
                onDelete={() => removeMessage(message.id)}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t border-discord-border bg-discord-channel-sidebar p-3">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <div className="relative flex-1">
            <div className="flex items-center gap-1 px-3 py-1 bg-discord-input rounded-lg">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-discord-text-muted hover:text-discord-text"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-discord-text-muted hover:text-discord-text"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-discord-text-muted hover:text-discord-text"
              >
                <Gift className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message #channel-name"
              className="bg-transparent border-none focus:ring-0 resize-none px-3 py-2 text-discord-text placeholder-discord-text-muted min-h-[44px] max-h-44"
              rows={1}
            />
            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-2 bg-discord-bg border border-discord-border rounded-lg p-2 shadow-lg z-10">
                <EmojiPicker onSelect={(emoji) => {
                  setNewMessage(prev => prev + emoji);
                  setShowEmojiPicker(false);
                  textareaRef.current?.focus();
                }} />
              </div>
            )}
          </div>
          <Button
            type="submit"
            variant="discord"
            size="icon"
            className="h-10 w-10 rounded-lg disabled:opacity-50"
            disabled={!newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function MessageItem({
  message,
  currentUser,
  showAvatar,
  onUpdate,
  onDelete,
}: {
  message: Message;
  currentUser: User | null;
  showAvatar: boolean;
  onUpdate: (content: string) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showActions, setShowActions] = useState(false);
  const isOwn = message.user_id === currentUser?.id;
  const { decryptedContent, decrypting, error } = useEncryptedMessage(message, message.user_id || '');

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onUpdate(editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const displayContent = message.encrypted && message.encrypted_content
    ? (decrypting ? '🔒 Decrypting...' : error || decryptedContent || '[Encrypted]')
    : message.content;

  return (
    <div
      className={cn('group relative', message.id.startsWith('temp-') && 'opacity-60')}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex gap-3">
        {showAvatar && (
          <UserAvatar
            src={message.user?.avatar_url}
            name={message.user?.username || 'User'}
            size="md"
            status={message.user?.status || 'offline'}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-discord-text font-semibold text-sm">
              {message.user?.username || 'Unknown'}
            </span>
            <span className="text-discord-text-muted text-xs">
              {formatTime(message.created_at)}
            </span>
            {/* Encryption Indicator */}
            <EncryptedMessageIndicator
              encrypted={!!message.encrypted}
              verified={message.encrypted && !!message.encrypted_content?.identityKey}
            />
            {/* Disappearing Message Indicator */}
            {message.disappearing_timer && message.disappearing_timer > 0 && (
              <DisappearingIndicator
                timestamp={new Date(message.created_at).getTime()}
                timer={message.disappearing_timer}
                compact
              />
            )}
            {isOwn && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>Edit</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigator.clipboard.writeText(message.content)}>Copy</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {}}>Pin</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={onDelete}>Delete</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Report</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {isEditing ? (
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveEdit();
                }
                if (e.key === 'Escape') handleCancelEdit();
              }}
              autoFocus
              className="bg-discord-input border-discord-border mt-1 min-h-[44px] max-h-44"
              rows={1}
            />
          ) : (
            <div className="text-discord-text mt-1 whitespace-pre-wrap break-words">
              {displayContent}
            </div>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {message.attachments.map((att) => (
                <div key={att.id} className="bg-discord-input rounded-lg p-2 max-w-xs">
                  <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-discord-blurple hover:underline text-sm flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    <span className="truncate">{att.filename}</span>
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="mt-2 flex gap-1 flex-wrap">
              {Object.entries(
                message.reactions.reduce((acc, r) => {
                  acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([emoji, count]) => (
                <button
                  key={emoji}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-discord-input text-sm hover:bg-discord-hover transition-colors"
                >
                  <span>{emoji}</span>
                  <span className="text-discord-text-muted">{count}</span>
                </button>
              ))}
              <button className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-transparent hover:bg-discord-hover transition-colors">
                <Smile className="h-3.5 w-3.5 text-discord-text-muted" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple emoji picker
function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
    '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '👌', '🤌', '🤏',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '🔥', '✨', '⭐', '💯', '🎉', '🎊', '🎈', '🎁', '🎀', '🏆',
  ];

  return (
    <div className="grid grid-cols-8 gap-1 max-w-xs">
      {emojis.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className="p-1.5 text-lg hover:bg-discord-hover rounded transition-colors"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}