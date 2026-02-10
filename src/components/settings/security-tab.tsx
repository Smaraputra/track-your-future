'use client';

import { useCallback, useState } from 'react';
import { RetroButton } from '@/components/retro-button';
import { RetroInput } from '@/components/retro-input';

interface SecurityTabProps {
  hasPassword: boolean;
  linkedProviders: string[];
}

export function SecurityTab({ hasPassword, linkedProviders }: SecurityTabProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChangePassword = useCallback(async () => {
    if (!currentPassword || newPassword.length < 8) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Password changed' });
        setCurrentPassword('');
        setNewPassword('');
      } else {
        const data = await res.json().catch(() => null);
        setMessage({ type: 'error', text: data?.error ?? 'Failed to change password' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  }, [currentPassword, newPassword]);

  return (
    <div className="space-y-6">
      {hasPassword && (
        <div>
          <h3 className="font-heading text-primary text-sm">Change Password</h3>
          <div className="mt-2 max-w-xs space-y-2">
            <RetroInput
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
            />
            <RetroInput
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 8 chars)"
            />
            <RetroButton
              onClick={handleChangePassword}
              disabled={saving || !currentPassword || newPassword.length < 8}
              size="sm"
            >
              {saving ? 'Changing...' : 'Change Password'}
            </RetroButton>
          </div>
          {message && (
            <p
              className={`font-body mt-2 text-xs ${
                message.type === 'success' ? 'text-primary' : 'text-destructive'
              }`}
            >
              {message.text}
            </p>
          )}
        </div>
      )}

      <div>
        <h3 className="font-heading text-primary text-sm">Linked Accounts</h3>
        {linkedProviders.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {linkedProviders.map((provider) => (
              <li
                key={provider}
                className="font-body text-foreground flex items-center gap-2 text-sm capitalize"
              >
                <span className="bg-primary size-1.5 rounded-full" />
                {provider}
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-body text-muted-foreground mt-1 text-sm">
            No linked OAuth accounts
          </p>
        )}
      </div>

      {!hasPassword && (
        <div>
          <p className="font-body text-muted-foreground text-xs">
            Your account uses OAuth login only. Password management is not available.
          </p>
        </div>
      )}
    </div>
  );
}
