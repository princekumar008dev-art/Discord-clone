'use client';

import { useState } from 'react';
import { CheckCircle, Shield, AlertCircle, Copy, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { UserAvatar } from '@/components/ui';

interface SafetyNumberVerificationProps {
  contactId: string;
  contactName: string;
  contactAvatar?: string;
  onVerified: () => void;
  onClose: () => void;
}

export function SafetyNumberVerification({
  contactId,
  contactName,
  contactAvatar,
  onVerified,
  onClose,
}: SafetyNumberVerificationProps) {
  const [safetyNumber, setSafetyNumber] = useState<string>('');
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  // Format safety number in groups of 5 digits
  const formatSafetyNumber = (num: string): string => {
    return num.match(/.{1,5}/g)?.join(' ') || num;
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      // In a real app, this would call the verify function from useSignal
      // For now, simulate verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      setVerified(true);
      onVerified();
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setVerifying(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(safetyNumber.replace(/\s/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-discord-bg w-full max-w-md rounded-lg overflow-hidden border border-discord-border">
        {/* Header */}
        <div className="p-4 border-b border-discord-border flex items-center justify-between">
          <h2 className="text-discord-text text-lg font-semibold">Verify Safety Number</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Explanation */}
          <div className="bg-discord-channel-sidebar rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="h-6 w-6 text-discord-green" />
              <span className="text-discord-text font-medium">End-to-End Encryption</span>
            </div>
            <p className="text-discord-text-muted text-sm">
              Safety numbers allow you to verify that your messages and calls are end-to-end encrypted.
              Compare the numbers below with {contactName} to confirm your conversation is secure.
            </p>
          </div>

          {/* Safety Number Display */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-discord-text-muted text-sm">Your Safety Number</span>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="ml-1">{copied ? 'Copied!' : 'Copy'}</span>
              </Button>
            </div>
            <div className="bg-discord-input rounded-lg p-4 font-mono text-lg text-discord-text select-all">
              {formatSafetyNumber(safetyNumber || 'Loading...')}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-discord-text-muted text-sm">{contactName}'s Safety Number</span>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                <RefreshCw className="h-4 w-4" />
                <span className="ml-1">Refresh</span>
              </Button>
            </div>
            <div className="bg-discord-input rounded-lg p-4 font-mono text-lg text-discord-text select-all">
              {formatSafetyNumber(safetyNumber || 'Loading...')}
            </div>
          </div>

          {/* Verification Methods */}
          <div className="border-t border-discord-border pt-4">
            <h3 className="text-discord-text text-sm font-medium mb-3">Verification Methods</h3>

            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {}}
              >
                <span className="w-8 h-8 rounded-full bg-discord-blurple/20 flex items-center justify-center mr-3">
                  <AlertCircle className="h-4 w-4 text-discord-blurple" />
                </span>
                <div className="text-left">
                  <p className="text-discord-text font-medium">Scan QR Code</p>
                  <p className="text-discord-text-muted text-xs">Scan each other's QR code in person</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {}}
              >
                <span className="w-8 h-8 rounded-full bg-discord-green/20 flex items-center justify-center mr-3">
                  <CheckCircle className="h-4 w-4 text-discord-green" />
                </span>
                <div className="text-left">
                  <p className="text-discord-text font-medium">Compare Numbers</p>
                  <p className="text-discord-text-muted text-xs">Read numbers aloud to verify they match</p>
                </div>
              </Button>
            </div>
          </div>

          {/* Verify Button */}
          <Button
            variant={verified ? 'discord' : 'discord'}
            className={cn('w-full', verified && 'bg-discord-green hover:bg-discord-green/90')}
            onClick={handleVerify}
            disabled={verifying || verified}
          >
            {verifying ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full mr-2" />
                Verifying...
              </>
            ) : verified ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Verified!
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Mark as Verified
              </>
            )}
          </Button>

          {!verified && (
            <p className="text-center text-discord-text-muted text-xs">
              Only mark as verified if you've confirmed the numbers match in person or over a secure channel.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}