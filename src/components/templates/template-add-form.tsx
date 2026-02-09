'use client';

import { useState } from 'react';

import { RetroButton } from '@/components/retro-button';
import { RetroInput } from '@/components/retro-input';

interface TemplateAddFormProps {
  roleId: string;
  onCreated: () => void;
  onCancel: () => void;
}

export function TemplateAddForm({
  roleId,
  onCreated,
  onCancel,
}: TemplateAddFormProps) {
  const [fieldKey, setFieldKey] = useState('');
  const [fieldValue, setFieldValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const res = await fetch(`/api/roles/${roleId}/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fieldKey: fieldKey.trim(), fieldValue: fieldValue.trim() }),
    });

    if (res.ok) {
      onCreated();
    } else {
      const data = await res.json().catch(() => null);
      if (res.status === 409) {
        setError(data?.error ?? 'A template with this key already exists');
      } else if (res.status === 403) {
        setError(data?.error ?? 'Template limit reached');
      } else {
        setError(data?.error ?? 'Failed to create template');
      }
    }

    setSaving(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-border space-y-3 rounded-md border p-4"
    >
      <div>
        <label
          htmlFor="new-field-key"
          className="font-body text-muted-foreground mb-1 block text-xs"
        >
          Field Key
        </label>
        <RetroInput
          id="new-field-key"
          value={fieldKey}
          onChange={(e) => setFieldKey(e.target.value)}
          placeholder="e.g., Years of experience"
          maxLength={200}
          required
        />
      </div>
      <div>
        <label
          htmlFor="new-field-value"
          className="font-body text-muted-foreground mb-1 block text-xs"
        >
          Field Value
        </label>
        <textarea
          id="new-field-value"
          value={fieldValue}
          onChange={(e) => setFieldValue(e.target.value)}
          placeholder="e.g., 5 years in frontend development"
          maxLength={2000}
          required
          rows={3}
          className="font-body placeholder:text-muted-foreground border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 caret-primary w-full rounded-md border px-3 py-2 text-sm outline-none transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:shadow-[0_0_8px_var(--primary)] disabled:pointer-events-none disabled:opacity-50"
        />
      </div>
      {error && (
        <p className="font-body text-destructive text-sm">{error}</p>
      )}
      <div className="flex gap-2">
        <RetroButton type="submit" size="sm" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </RetroButton>
        <RetroButton
          type="button"
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </RetroButton>
      </div>
    </form>
  );
}
