'use client';

// Simplified Signal-like crypto implementation for demo purposes
// In production, use libsignal-protocol-typescript properly configured

import * as forge from 'node-forge';

// Types for our crypto operations
export interface SignalIdentity {
  identityKeyPair: { publicKey: Uint8Array; privateKey: Uint8Array };
  registrationId: number;
  preKeys: Map<number, { keyId: number; publicKey: Uint8Array; privateKey: Uint8Array }>;
  signedPreKey: { keyId: number; publicKey: Uint8Array; privateKey: Uint8Array; signature: Uint8Array };
  kyberPreKeys: Map<number, { keyId: number; publicKey: Uint8Array }>;
}

export interface EncryptedMessage {
  type: number;
  body: number[];
  identityKey?: number[];
}

export interface EncryptedContent {
  type: number;
  body: number[];
  identityKey?: number[];
  senderDeviceId: number;
}

export interface SafetyNumber {
  user_id: string;
  contact_id: string;
  safety_number: string;
  verified: boolean;
  verified_at?: string;
}

export interface SafetyNumberData {
  safetyNumber: string;
  verified: boolean;
  verifiedAt?: string;
}

export interface SignalPreKeyBundle {
  identityKey: string;
  registrationId: number;
  preKey: {
    keyId: number;
    publicKey: string;
  };
  signedPreKey: {
    keyId: number;
    publicKey: string;
    signature: string;
  };
  kyberPreKey?: {
    keyId: number;
    publicKey: string;
  };
}

// SignalProtocolStore interface (minimal)
interface SignalProtocolStore {
  getIdentityKeyPair(): Promise<{ publicKey: Uint8Array; privateKey: Uint8Array }>;
  getLocalRegistrationId(): Promise<number>;
  saveIdentity(address: string, identityKey: Uint8Array): Promise<void>;
  isTrustedIdentity(address: string, identityKey: Uint8Array, direction: number): Promise<boolean>;
  getIdentityKey(address: string): Promise<Uint8Array | null>;
  getPreKey(keyId: number): Promise<{ keyId: number; publicKey: Uint8Array; privateKey: Uint8Array } | null>;
  removePreKey(keyId: number): Promise<void>;
  storePreKey(keyId: number, record: { keyId: number; publicKey: Uint8Array; privateKey: Uint8Array }): Promise<void>;
  getSignedPreKey(keyId: number): Promise<{ keyId: number; publicKey: Uint8Array; privateKey: Uint8Array; signature: Uint8Array } | null>;
  storeSignedPreKey(keyId: number, record: { keyId: number; publicKey: Uint8Array; privateKey: Uint8Array; signature: Uint8Array }): Promise<void>;
  getKyberPreKey(keyId: number): Promise<{ keyId: number; publicKey: Uint8Array } | null>;
  storeKyberPreKey(keyId: number, record: { keyId: number; publicKey: Uint8Array }): Promise<void>;
  removeKyberPreKey(keyId: number): Promise<void>;
  getSession(address: string): Promise<any | null>;
  storeSession(address: string, record: any): Promise<void>;
  removeSession(address: string): Promise<void>;
  removeAllSessions(address: string): Promise<void>;
}

// Simplified in-memory store
class SignalStore implements SignalProtocolStore {
  private identityKeyPair: { publicKey: Uint8Array; privateKey: Uint8Array } | null = null;
  private registrationId: number = 0;
  private preKeys: Map<number, { keyId: number; publicKey: Uint8Array; privateKey: Uint8Array }> = new Map();
  private signedPreKey: { keyId: number; publicKey: Uint8Array; privateKey: Uint8Array; signature: Uint8Array } | null = null;
  private kyberPreKeys: Map<number, { keyId: number; publicKey: Uint8Array }> = new Map();
  private sessions: Map<string, any> = new Map();
  private identityKeys: Map<string, Uint8Array> = new Map();

  async getIdentityKeyPair(): Promise<{ publicKey: Uint8Array; privateKey: Uint8Array }> {
    if (!this.identityKeyPair) {
      const keys = await this.generateKeyPair();
      this.identityKeyPair = keys;
    }
    return this.identityKeyPair;
  }

  async getLocalRegistrationId(): Promise<number> {
    if (!this.registrationId) {
      this.registrationId = Math.floor(Math.random() * 0xFFFFFFFF);
    }
    return this.registrationId;
  }

  async saveIdentity(address: string, identityKey: Uint8Array): Promise<void> {
    this.identityKeys.set(address, identityKey);
  }

  async isTrustedIdentity(address: string, identityKey: Uint8Array, direction: number): Promise<boolean> {
    const stored = this.identityKeys.get(address);
    if (!stored) return true;
    return this.bytesToHex(stored) === this.bytesToHex(identityKey);
  }

  async getIdentityKey(address: string): Promise<Uint8Array | null> {
    return this.identityKeys.get(address) || null;
  }

  async getPreKey(keyId: number) {
    return this.preKeys.get(keyId) || null;
  }

  async removePreKey(keyId: number): Promise<void> {
    this.preKeys.delete(keyId);
  }

  async storePreKey(keyId: number, record: { keyId: number; publicKey: Uint8Array; privateKey: Uint8Array }): Promise<void> {
    this.preKeys.set(keyId, record);
  }

  async getSignedPreKey(keyId: number) {
    if (this.signedPreKey && this.signedPreKey.keyId === keyId) {
      return this.signedPreKey;
    }
    return null;
  }

  async storeSignedPreKey(keyId: number, record: { keyId: number; publicKey: Uint8Array; privateKey: Uint8Array; signature: Uint8Array }): Promise<void> {
    this.signedPreKey = record;
  }

  async getKyberPreKey(keyId: number) {
    return this.kyberPreKeys.get(keyId) || null;
  }

  async storeKyberPreKey(keyId: number, record: { keyId: number; publicKey: Uint8Array }): Promise<void> {
    this.kyberPreKeys.set(keyId, record);
  }

  async removeKyberPreKey(keyId: number): Promise<void> {
    this.kyberPreKeys.delete(keyId);
  }

  async getSession(address: string) {
    return this.sessions.get(address) || null;
  }

  async storeSession(address: string, record: any): Promise<void> {
    this.sessions.set(address, record);
  }

  async removeSession(address: string): Promise<void> {
    this.sessions.delete(address);
  }

  async removeAllSessions(address: string): Promise<void> {
    const prefix = `${address}:`;
    for (const key of this.sessions.keys()) {
      if (key.startsWith(prefix)) {
        this.sessions.delete(key);
      }
    }
  }

  // Prekey bundle generation
  async generatePreKeyBundle(): Promise<{
    identityKey: Uint8Array;
    registrationId: number;
    preKey: { keyId: number; publicKey: Uint8Array };
    signedPreKey: { keyId: number; publicKey: Uint8Array; signature: Uint8Array };
    kyberPreKey?: { keyId: number; publicKey: Uint8Array };
  }> {
    const identityKeyPair = await this.getIdentityKeyPair();
    const registrationId = await this.getLocalRegistrationId();

    // Generate prekey
    const preKeyId = Math.floor(Math.random() * 0xFFFFFFFF);
    const preKeyPair = await this.generateKeyPair();
    await this.storePreKey(preKeyId, { keyId: preKeyId, ...preKeyPair });

    // Generate signed prekey
    const signedPreKeyId = Math.floor(Math.random() * 0xFFFFFFFF);
    const signedPreKeyPair = await this.generateKeyPair();
    const signature = await this.sign(signedPreKeyPair.publicKey, identityKeyPair.privateKey);
    await this.storeSignedPreKey(signedPreKeyId, { keyId: signedPreKeyId, ...signedPreKeyPair, signature });

    // Generate Kyber prekey (placeholder for post-quantum)
    const kyberPreKeyId = Math.floor(Math.random() * 0xFFFFFFFF);
    const kyberPreKeyPair = await this.generateKeyPair();
    await this.storeKyberPreKey(kyberPreKeyId, { keyId: kyberPreKeyId, publicKey: kyberPreKeyPair.publicKey });

    return {
      identityKey: identityKeyPair.publicKey,
      registrationId,
      preKey: { keyId: preKeyId, publicKey: preKeyPair.publicKey },
      signedPreKey: { keyId: signedPreKeyId, publicKey: signedPreKeyPair.publicKey, signature },
      kyberPreKey: { keyId: kyberPreKeyId, publicKey: kyberPreKeyPair.publicKey },
    };
  }

  // Initialize with existing keys (for persistence)
  async initialize(identity: SignalIdentity): Promise<void> {
    this.identityKeyPair = identity.identityKeyPair;
    this.registrationId = identity.registrationId;
    this.preKeys = identity.preKeys;
    this.signedPreKey = identity.signedPreKey;
    this.kyberPreKeys = identity.kyberPreKeys;
  }

  // Export for persistence
  async exportIdentity(): Promise<SignalIdentity> {
    const identityKeyPair = await this.getIdentityKeyPair();
    return {
      identityKeyPair,
      registrationId: this.registrationId,
      preKeys: this.preKeys,
      signedPreKey: this.signedPreKey!,
      kyberPreKeys: this.kyberPreKeys,
    };
  }

  // Helper methods
  private async generateKeyPair(): Promise<{ publicKey: Uint8Array; privateKey: Uint8Array }> {
    const privateKey = new Uint8Array(32);
    crypto.getRandomValues(privateKey);
    const publicKey = await this.derivePublicKey(privateKey);
    return { publicKey, privateKey };
  }

  private async derivePublicKey(privateKey: Uint8Array): Promise<Uint8Array> {
    // Simplified: use SHA-256 of private key as public key (not cryptographically secure, for demo only)
    const hash = forge.md.sha256.create();
    hash.update(this.uint8ArrayToString(privateKey));
    return new Uint8Array(hash.digest().bytes().split('').map(c => c.charCodeAt(0) & 0xFF));
  }

  private async sign(data: Uint8Array, privateKey: Uint8Array): Promise<Uint8Array> {
    // Simplified signing
    const hash = forge.md.sha256.create();
    hash.update(this.uint8ArrayToString(data));
    hash.update(this.uint8ArrayToString(privateKey));
    return new Uint8Array(hash.digest().bytes().split('').map(c => c.charCodeAt(0) & 0xFF));
  }

  private uint8ArrayToString(arr: Uint8Array): string {
    return String.fromCharCode.apply(null, Array.from(arr));
  }

  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

// Singleton store instance
let signalStore: SignalStore | null = null;

export function getSignalStore(): SignalStore {
  if (!signalStore) {
    signalStore = new SignalStore();
  }
  return signalStore;
}

// Encryption/Decryption functions (simplified XOR-based for demo)
export async function encryptMessage(
  recipientAddress: string,
  recipientDeviceId: number,
  plaintext: string,
  senderBundle?: any
): Promise<EncryptedMessage> {
  const store = getSignalStore();

  // Simple XOR encryption for demo (NOT SECURE - use proper libsignal in production)
  const key = await generateSharedKey(recipientAddress, senderBundle);
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const encrypted = new Uint8Array(data.length);

  for (let i = 0; i < data.length; i++) {
    encrypted[i] = data[i] ^ key[i % key.length];
  }

  return {
    type: 2, // SignalMessage
    body: Array.from(encrypted),
    identityKey: Array.from(key.slice(0, 32)),
  };
}

export async function decryptMessage(
  senderAddress: string,
  senderDeviceId: number,
  encryptedMessage: EncryptedMessage
): Promise<string> {
  // Simple XOR decryption for demo
  const key = encryptedMessage.identityKey || new Array(32).fill(0);
  const encrypted = new Uint8Array(encryptedMessage.body);
  const decrypted = new Uint8Array(encrypted.length);

  for (let i = 0; i < encrypted.length; i++) {
    decrypted[i] = encrypted[i] ^ key[i % key.length];
  }

  return new TextDecoder().decode(decrypted);
}

async function generateSharedKey(address: string, bundle?: any): Promise<Uint8Array> {
  // Generate a deterministic key from address
  const hash = forge.md.sha256.create();
  hash.update(address);
  if (bundle) {
    hash.update(bundle.identityKey || '');
  }
  const bytes = hash.digest().bytes();
  return new Uint8Array(bytes.split('').map(c => c.charCodeAt(0) & 0xFF));
}

function uint8ArrayToString(arr: Uint8Array): string {
  return String.fromCharCode.apply(null, Array.from(arr));
}

// Safety Number calculation

export async function calculateSafetyNumber(
  localIdentityKey: Uint8Array,
  remoteIdentityKey: Uint8Array
): Promise<string> {
  const combined = new Uint8Array(localIdentityKey.length + remoteIdentityKey.length);
  combined.set(localIdentityKey);
  combined.set(remoteIdentityKey, localIdentityKey.length);

  const md = forge.md.sha512.create();
  md.update(uint8ArrayToString(combined));

  const hash = md.digest().bytes();
  const safetyNumberBytes = hash.slice(0, 30);

  let result = '';
  for (let i = 0; i < safetyNumberBytes.length; i += 3) {
    const chunk = (safetyNumberBytes.charCodeAt(i) << 16) |
                  (safetyNumberBytes.charCodeAt(i + 1) << 8) |
                  safetyNumberBytes.charCodeAt(i + 2);
    const group = (chunk % 100000).toString().padStart(5, '0');
    result += group + ' ';
  }

  return result.trim();
}

// Disappearing messages timer
export type DisappearingTimer = 0 | 30 | 60 | 300 | 900 | 3600 | 86400 | 604800; // seconds

export interface DisappearingMessageConfig {
  timer: DisappearingTimer;
  enabled: boolean;
}

export function formatDisappearingTime(seconds: DisappearingTimer): string {
  if (seconds === 0) return 'Off';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${seconds / 60}m`;
  if (seconds < 86400) return `${seconds / 3600}h`;
  return `${seconds / 86400}d`;
}

export function parseDisappearingTime(str: string): DisappearingTimer {
  const map: Record<string, DisappearingTimer> = {
    'Off': 0,
    '30s': 30,
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '1h': 3600,
    '1d': 86400,
    '1w': 604800,
  };
  return map[str] || 0;
}

// Message expiration check
export function isMessageExpired(
  timestamp: number,
  timer: DisappearingTimer
): boolean {
  if (timer === 0) return false;
  const now = Date.now();
  return now - timestamp > timer * 1000;
}

// Generate secure random for message padding
export function generateMessagePadding(min = 16, max = 256): Uint8Array {
  const length = min + Math.floor(Math.random() * (max - min));
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return array;
}