'use client';

import { useCallback, useState } from 'react';
import { RetroButton } from '@/components/retro-button';
import { RetroInput } from '@/components/retro-input';

interface ProfileTabProps {
  name: string;
  email: string;
}

export function ProfileTab({ name: initialName, email }: ProfileTabProps) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Name updated' });
      } else {
        const data = await res.json().catch(() => null);
        setMessage({ type: 'error', text: data?.error ?? 'Failed to update' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  }, [name]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading text-primary text-sm">Display Name</h3>
        <div className="mt-2 flex gap-2">
          <RetroInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="max-w-xs"
          />
          <RetroButton
            onClick={handleSave}
            disabled={saving || name.trim() === initialName}
            size="sm"
          >
            {saving ? 'Saving...' : 'Save'}
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

      <div>
        <h3 className="font-heading text-primary text-sm">Email</h3>
        <p className="font-body text-muted-foreground mt-1 text-sm">{email}</p>
        <p className="font-body text-muted-foreground mt-1 text-xs">
          Email cannot be changed at this time.
        </p>
      </div>
    </div>
  );
}
