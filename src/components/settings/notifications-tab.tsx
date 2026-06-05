'use client';

import { useCallback, useState } from 'react';
import { RetroButton } from '@/components/retro-button';

interface EmailPreferences {
  product: boolean;
  reminders: boolean;
}

interface NotificationsTabProps {
  preferences: EmailPreferences;
}

const OPTIONS: {
  key: keyof EmailPreferences;
  label: string;
  description: string;
}[] = [
  {
    key: 'product',
    label: 'Product updates',
    description:
      'Welcome message, new features, and tips for getting more out of your account.',
  },
  {
    key: 'reminders',
    label: 'Reminders',
    description:
      'Nudges about stale applications and follow-ups you may want to act on.',
  },
];

export function NotificationsTab({ preferences: initial }: NotificationsTabProps) {
  const [prefs, setPrefs] = useState<EmailPreferences>(initial);
  const [baseline, setBaseline] = useState<EmailPreferences>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const dirty =
    prefs.product !== baseline.product || prefs.reminders !== baseline.reminders;

  const handleSave = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/settings/email-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Preferences saved' });
        setBaseline(prefs);
      } else {
        const data = await res.json().catch(() => null);
        setMessage({ type: 'error', text: data?.error ?? 'Failed to save' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  }, [prefs]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading text-primary text-sm">Email Notifications</h3>
        <p className="font-body text-muted-foreground mt-1 text-xs">
          Choose which non-essential emails you receive. Security and account
          emails (verification, password resets) are always sent.
        </p>
      </div>

      <div className="space-y-4">
        {OPTIONS.map((option) => (
          <label
            key={option.key}
            className="flex cursor-pointer items-start gap-3"
          >
            <input
              type="checkbox"
              className="accent-primary mt-0.5 h-4 w-4"
              checked={prefs[option.key]}
              onChange={(e) =>
                setPrefs((p) => ({ ...p, [option.key]: e.target.checked }))
              }
            />
            <span>
              <span className="font-body text-foreground block text-sm">
                {option.label}
              </span>
              <span className="font-body text-muted-foreground block text-xs">
                {option.description}
              </span>
            </span>
          </label>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <RetroButton onClick={handleSave} disabled={saving || !dirty} size="sm">
          {saving ? 'Saving...' : 'Save preferences'}
        </RetroButton>
        {message && (
          <p
            className={`font-body text-xs ${
              message.type === 'success' ? 'text-primary' : 'text-destructive'
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
