'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import {
  getSignalStore,
  encryptMessage,
  decryptMessage,
  calculateSafetyNumber,
  formatDisappearingTime,
  parseDisappearingTime,
  isMessageExpired,
  type DisappearingTimer,
  type EncryptedContent,
  type SafetyNumber,
  type SignalPreKeyBundle,
  type EncryptedMessage,
} from './crypto';

export function useSignal() {
  const { currentUser } = useStore();
  const [initialized, setInitialized] = useState(false);
  const [preKeyBundle, setPreKeyBundle] = useState<SignalPreKeyBundle | null>(null);
  const [safetyNumbers, setSafetyNumbers] = useState<Map<string, SafetyNumber>>(new Map());

  // Initialize Signal store on mount
  useEffect(() => {
    const init = async () => {
      if (!currentUser) return;

      const store = getSignalStore();
      const bundle = await store.generatePreKeyBundle();

      setPreKeyBundle({
        identityKey: Buffer.from(bundle.identityKey).toString('base64'),
        registrationId: bundle.registrationId,
        preKey: {
          keyId: bundle.preKey.keyId,
          publicKey: Buffer.from(bundle.preKey.publicKey).toString('base64'),
        },
        signedPreKey: {
          keyId: bundle.signedPreKey.keyId,
          publicKey: Buffer.from(bundle.signedPreKey.publicKey).toString('base64'),
          signature: Buffer.from(bundle.signedPreKey.signature).toString('base64'),
        },
        kyberPreKey: bundle.kyberPreKey ? {
          keyId: bundle.kyberPreKey.keyId,
          publicKey: Buffer.from(bundle.kyberPreKey.publicKey).toString('base64'),
        } : undefined,
      });

      // Save bundle to database
      const supabase = createClient();
      await supabase.from('signal_keys').upsert({
        user_id: currentUser.id,
        identity_key: Buffer.from(bundle.identityKey).toString('base64'),
        registration_id: bundle.registrationId,
        pre_keys: JSON.stringify({
          [bundle.preKey.keyId]: Buffer.from(bundle.preKey.publicKey).toString('base64'),
        }),
        signed_pre_key: JSON.stringify({
          keyId: bundle.signedPreKey.keyId,
          publicKey: Buffer.from(bundle.signedPreKey.publicKey).toString('base64'),
          signature: Buffer.from(bundle.signedPreKey.signature).toString('base64'),
        }),
        kyber_pre_keys: JSON.stringify(
          bundle.kyberPreKey ? {
            [bundle.kyberPreKey.keyId]: Buffer.from(bundle.kyberPreKey.publicKey).toString('base64'),
          } : {}
        ),
        updated_at: new Date().toISOString(),
      });

      setInitialized(true);
    };

    init();
  }, [currentUser]);

  // Encrypt message for channel (encrypt for each member)
  const encryptForChannel = useCallback(async (
    channelId: string,
    content: string
  ): Promise<Map<string, EncryptedContent>> => {
    if (!currentUser) throw new Error('Not authenticated');

    const supabase = createClient();

    // Get channel members
    const { data: members } = await supabase
      .from('channel_members')
      .select('user_id')
      .eq('channel_id', channelId);

    if (!members) return new Map();

    // Get signal keys for all members
    const userIds = members.map(m => m.user_id).filter(id => id !== currentUser.id);
    if (userIds.length === 0) return new Map();

    const { data: signalKeys } = await supabase
      .from('signal_keys')
      .select('user_id, identity_key, registration_id, pre_keys, signed_pre_key, kyber_pre_keys')
      .in('user_id', userIds);

    if (!signalKeys) return new Map();

    const keyMap = new Map(signalKeys.map(k => [k.user_id, k]));

    const encryptedMap = new Map<string, EncryptedContent>();

    for (const member of members) {
      if (member.user_id === currentUser.id) continue;

      try {
        const keys = keyMap.get(member.user_id);
        if (!keys) continue;

        const recipientBundle = {
          identityKey: Buffer.from(keys.identity_key, 'base64'),
          registrationId: keys.registration_id,
          preKey: JSON.parse(keys.pre_keys)[Object.keys(JSON.parse(keys.pre_keys))[0]],
          signedPreKey: JSON.parse(keys.signed_pre_key),
          kyberPreKey: keys.kyber_pre_keys ? JSON.parse(keys.kyber_pre_keys)[Object.keys(JSON.parse(keys.kyber_pre_keys))[0]] : undefined,
        };

        const encrypted = await encryptMessage(
          member.user_id,
          1,
          content,
          recipientBundle
        );

        encryptedMap.set(member.user_id, {
          type: encrypted.type,
          body: encrypted.body,
          identityKey: encrypted.identityKey,
          senderDeviceId: 1,
        });
      } catch (error) {
        console.error(`Failed to encrypt for ${member.user_id}:`, error);
      }
    }

    return encryptedMap;
  }, [currentUser]);

  // Decrypt message
  const decryptMessageContent = useCallback(async (
    encryptedContent: EncryptedContent,
    senderId: string
  ): Promise<string> => {
    if (!currentUser) throw new Error('Not authenticated');

    try {
      const decrypted = await decryptMessage(
        senderId,
        encryptedContent.senderDeviceId,
        {
          type: encryptedContent.type,
          body: encryptedContent.body,
          identityKey: encryptedContent.identityKey,
        }
      );
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return '[Encrypted message - unable to decrypt]';
    }
  }, [currentUser]);

  // Fetch and verify safety number
  const verifySafetyNumber = useCallback(async (contactId: string): Promise<SafetyNumber | null> => {
    if (!currentUser) return null;

    const supabase = createClient();

    // Get both users' identity keys
    const { data: keys } = await supabase
      .from('signal_keys')
      .select('user_id, identity_key')
      .in('user_id', [currentUser.id, contactId]);

    if (!keys || keys.length < 2) return null;

    const myKeys = keys.find(k => k.user_id === currentUser.id);
    const contactKeys = keys.find(k => k.user_id === contactId);

    if (!myKeys || !contactKeys) return null;

    const safetyNumber = await calculateSafetyNumber(
      Buffer.from(myKeys.identity_key, 'base64'),
      Buffer.from(contactKeys.identity_key, 'base64')
    );

    const sn: SafetyNumber = {
      user_id: currentUser.id,
      contact_id: contactId,
      safety_number: safetyNumber,
      verified: false,
    };

    // Save to database
    await supabase.from('safety_numbers').upsert({
      user_id: currentUser.id,
      contact_id: contactId,
      safety_number: safetyNumber,
      verified: false,
    });

    setSafetyNumbers(prev => new Map(prev).set(contactId, sn));
    return sn;
  }, [currentUser]);

  // Mark safety number as verified
  const markSafetyNumberVerified = useCallback(async (contactId: string) => {
    if (!currentUser) return;

    const supabase = createClient();
    await supabase.from('safety_numbers').update({
      verified: true,
      verified_at: new Date().toISOString(),
    }).eq('user_id', currentUser.id).eq('contact_id', contactId);

    setSafetyNumbers(prev => {
      const next = new Map(prev);
      const sn = next.get(contactId);
      if (sn) {
        next.set(contactId, { ...sn, verified: true, verified_at: new Date().toISOString() });
      }
      return next;
    });
  }, [currentUser]);

  // Disappearing messages
  const setDisappearingTimer = useCallback(async (
    channelId: string,
    timer: DisappearingTimer
  ) => {
    if (!currentUser) return;

    const supabase = createClient();
    await supabase.from('channels').update({
      disappearing_timer: timer,
    }).eq('id', channelId);
  }, [currentUser]);

  const getDisappearingTimer = useCallback(async (channelId: string): Promise<DisappearingTimer> => {
    const supabase = createClient();
    const { data } = await supabase
      .from('channels')
      .select('disappearing_timer')
      .eq('id', channelId)
      .single();
    return (data?.disappearing_timer as DisappearingTimer) || 0;
  }, []);

  return {
    initialized,
    preKeyBundle,
    safetyNumbers,
    encryptForChannel,
    decryptMessageContent,
    verifySafetyNumber,
    markSafetyNumberVerified,
    setDisappearingTimer,
    getDisappearingTimer,
    formatDisappearingTime,
    parseDisappearingTime,
    isMessageExpired,
  };
}

// Hook for handling encrypted message display
export function useEncryptedMessage(message: any, senderId: string) {
  const { decryptMessageContent } = useSignal();
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!message.encrypted || !message.encrypted_content) {
      setDecryptedContent(message.content);
      return;
    }

    const decrypt = async () => {
      setDecrypting(true);
      setError(null);
      try {
        const content = await decryptMessageContent(message.encrypted_content, senderId);
        setDecryptedContent(content);
      } catch (err) {
        setError('Failed to decrypt message');
        setDecryptedContent('[Unable to decrypt]');
      } finally {
        setDecrypting(false);
      }
    };

    decrypt();
  }, [message, senderId, decryptMessageContent]);

  return { decryptedContent, decrypting, error };
}