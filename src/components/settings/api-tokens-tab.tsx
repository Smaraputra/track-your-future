'use client';

import { useCallback, useState } from 'react';
import { RetroButton } from '@/components/retro-button';
import { RetroInput } from '@/components/retro-input';
import { RetroSelect } from '@/components/retro-select';

export interface ApiTokenSummary {
  id: string;
  name: string;
  tokenPrefix: string;
  scope: 'read' | 'write';
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface ApiTokensTabProps {
  initialTokens: ApiTokenSummary[];
}

const SCOPE_OPTIONS = [
  { value: 'read', label: 'Read-only' },
  { value: 'write', label: 'Read & write' },
];

const EXPIRY_OPTIONS = [
  { value: 'never', label: 'No expiry' },
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '365', label: '365 days' },
];

function formatDate(value: string | null): string {
  if (!value) return 'Never';
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function ApiTokensTab({ initialTokens }: ApiTokensTabProps) {
  const [tokens, setTokens] = useState<ApiTokenSummary[]>(initialTokens);
  const [name, setName] = useState('');
  const [scope, setScope] = useState<'read' | 'write'>('read');
  const [expiry, setExpiry] = useState('never');
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleCreate = useCallback(async () => {
    if (!name.trim()) return;
    setCreating(true);
    setMessage(null);
    setPlaintext(null);
    setCopied(false);

    try {
      const body: { name: string; scope: string; expiresInDays?: number } = {
        name: name.trim(),
        scope,
      };
      if (expiry !== 'never') body.expiresInDays = Number(expiry);

      const res = await fetch('/api/settings/api-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data) {
        const { token, ...summary } = data as ApiTokenSummary & { token: string };
        setTokens((prev) => [summary, ...prev]);
        setPlaintext(token);
        setName('');
        setScope('read');
        setExpiry('never');
      } else {
        setMessage({ type: 'error', text: data?.error ?? 'Failed to create token' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setCreating(false);
    }
  }, [name, scope, expiry]);

  const handleCopy = useCallback(async () => {
    if (!plaintext) return;
    try {
      await navigator.clipboard.writeText(plaintext);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }, [plaintext]);

  const handleRevoke = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/settings/api-tokens/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTokens((prev) => prev.filter((t) => t.id !== id));
      } else {
        const data = await res.json().catch(() => null);
        setMessage({ type: 'error', text: data?.error ?? 'Failed to revoke token' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setConfirmingId(null);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading text-primary text-sm">API Tokens</h3>
        <p className="font-body text-muted-foreground mt-1 text-xs">
          Personal tokens for programmatic access to your data via the{' '}
          <code className="text-foreground">/api/v1</code> endpoints. Send the token as{' '}
          <code className="text-foreground">Authorization: Bearer &lt;token&gt;</code>. A token only
          ever reaches your own data.
        </p>
      </div>

      {/* One-time plaintext reveal */}
      {plaintext && (
        <div className="border-primary bg-surface space-y-2 border p-3">
          <p className="font-body text-primary text-xs">
            Copy your new token now. For security it will not be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="text-foreground bg-background flex-1 overflow-x-auto border border-border px-2 py-1 text-xs">
              {plaintext}
            </code>
            <RetroButton size="sm" onClick={handleCopy}>
              {copied ? 'Copied' : 'Copy'}
            </RetroButton>
          </div>
        </div>
      )}

      {/* Create form */}
      <div className="border-border max-w-md space-y-2 border p-3">
        <h4 className="font-heading text-foreground text-xs">Create a token</h4>
        <RetroInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Token name (e.g. CLI, Zapier)"
          maxLength={100}
        />
        <div className="flex gap-2">
          <RetroSelect
            options={SCOPE_OPTIONS}
            value={scope}
            onValueChange={(v) => setScope(v as 'read' | 'write')}
            className="flex-1"
          />
          <RetroSelect
            options={EXPIRY_OPTIONS}
            value={expiry}
            onValueChange={setExpiry}
            className="flex-1"
          />
        </div>
        <RetroButton onClick={handleCreate} disabled={creating || !name.trim()} size="sm">
          {creating ? 'Creating...' : 'Create Token'}
        </RetroButton>
      </div>

      {message && (
        <p
          className={`font-body text-xs ${
            message.type === 'success' ? 'text-primary' : 'text-destructive'
          }`}
        >
          {message.text}
        </p>
      )}

      {/* Token list */}
      <div>
        <h4 className="font-heading text-foreground mb-2 text-xs">Active tokens</h4>
        {tokens.length === 0 ? (
          <p className="font-body text-muted-foreground text-sm">No active tokens.</p>
        ) : (
          <ul className="space-y-2">
            {tokens.map((token) => (
              <li
                key={token.id}
                className="border-border flex flex-wrap items-center justify-between gap-2 border p-2"
              >
                <div className="min-w-0">
                  <p className="font-body text-foreground text-sm">
                    {token.name}{' '}
                    <span className="text-muted-foreground text-xs">
                      ({token.scope === 'write' ? 'read & write' : 'read-only'})
                    </span>
                  </p>
                  <p className="font-body text-muted-foreground text-xs">
                    <code className="text-foreground">{token.tokenPrefix}...</code> · created{' '}
                    {formatDate(token.createdAt)} · last used {formatDate(token.lastUsedAt)}
                    {token.expiresAt ? ` · expires ${formatDate(token.expiresAt)}` : ''}
                  </p>
                </div>
                {confirmingId === token.id ? (
                  <div className="flex gap-2">
                    <RetroButton
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRevoke(token.id)}
                    >
                      Confirm
                    </RetroButton>
                    <RetroButton variant="ghost" size="sm" onClick={() => setConfirmingId(null)}>
                      Cancel
                    </RetroButton>
                  </div>
                ) : (
                  <RetroButton
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmingId(token.id)}
                  >
                    Revoke
                  </RetroButton>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
