'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RetroButton } from '@/components/retro-button';
import { RetroInput } from '@/components/retro-input';

interface DataTabProps {
  createdAt: string;
}

export function DataTab({ createdAt }: DataTabProps) {
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = useCallback(() => {
    window.location.href = '/api/settings/export';
  }, []);

  const handleDelete = useCallback(async () => {
    if (confirmation !== 'DELETE MY ACCOUNT') return;
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch('/api/settings/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation }),
      });

      if (res.ok) {
        router.replace('/');
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? 'Failed to delete account');
      }
    } catch {
      setError('Network error');
    } finally {
      setDeleting(false);
    }
  }, [confirmation, router]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading text-primary text-sm">Account Info</h3>
        <p className="font-body text-muted-foreground mt-1 text-sm">
          Account created: {new Date(createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <div>
        <h3 className="font-heading text-primary text-sm">Export Data</h3>
        <p className="font-body text-muted-foreground mt-1 text-xs">
          Download all your data as JSON (GDPR compliant).
        </p>
        <RetroButton onClick={handleExport} variant="secondary" size="sm" className="mt-2">
          Export Data
        </RetroButton>
      </div>

      <div>
        <h3 className="font-heading text-sm text-destructive">Danger Zone</h3>
        <p className="font-body text-muted-foreground mt-1 text-xs">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>

        {!showDelete ? (
          <RetroButton
            variant="destructive"
            size="sm"
            className="mt-2"
            onClick={() => setShowDelete(true)}
          >
            Delete Account
          </RetroButton>
        ) : (
          <div className="mt-2 max-w-xs space-y-2">
            <p className="font-body text-destructive text-xs">
              Type <strong>DELETE MY ACCOUNT</strong> to confirm:
            </p>
            <RetroInput
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="DELETE MY ACCOUNT"
            />
            <div className="flex gap-2">
              <RetroButton
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting || confirmation !== 'DELETE MY ACCOUNT'}
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </RetroButton>
              <RetroButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDelete(false);
                  setConfirmation('');
                  setError(null);
                }}
              >
                Cancel
              </RetroButton>
            </div>
            {error && (
              <p className="font-body text-destructive text-xs">{error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
