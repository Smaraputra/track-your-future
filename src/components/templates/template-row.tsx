'use client';

import { useRef, useState } from 'react';
import { ChevronUp, ChevronDown, Pencil, Trash2, Copy, Check } from 'lucide-react';

import { RetroButton } from '@/components/retro-button';
import { RetroInput } from '@/components/retro-input';

interface Template {
  id: string;
  fieldKey: string;
  fieldValue: string;
  position: number;
}

interface TemplateEditFormProps {
  template: Template;
  roleId: string;
  onSaved: () => void;
  onCancel: () => void;
}

function TemplateEditForm({
  template,
  roleId,
  onSaved,
  onCancel,
}: TemplateEditFormProps) {
  const [editKey, setEditKey] = useState(template.fieldKey);
  const [editValue, setEditValue] = useState(template.fieldValue);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError(null);
    setSaving(true);

    const res = await fetch(
      `/api/roles/${roleId}/templates/${template.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldKey: editKey.trim(),
          fieldValue: editValue.trim(),
        }),
      },
    );

    if (res.ok) {
      onSaved();
    } else {
      const data = await res.json().catch(() => null);
      if (res.status === 409) {
        setError(data?.error ?? 'A template with this key already exists');
      } else {
        setError(data?.error ?? 'Failed to update template');
      }
    }

    setSaving(false);
  }

  return (
    <div className="border-border space-y-3 rounded-md border p-4">
      <div>
        <label
          htmlFor={`edit-key-${template.id}`}
          className="font-body text-muted-foreground mb-1 block text-xs"
        >
          Field Key
        </label>
        <RetroInput
          id={`edit-key-${template.id}`}
          value={editKey}
          onChange={(e) => setEditKey(e.target.value)}
          maxLength={200}
        />
      </div>
      <div>
        <label
          htmlFor={`edit-value-${template.id}`}
          className="font-body text-muted-foreground mb-1 block text-xs"
        >
          Field Value
        </label>
        <textarea
          id={`edit-value-${template.id}`}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          maxLength={2000}
          rows={3}
          className="font-body placeholder:text-muted-foreground border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 caret-primary w-full rounded-md border px-3 py-2 text-sm outline-none transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:shadow-[0_0_8px_var(--primary)] disabled:pointer-events-none disabled:opacity-50"
        />
      </div>
      {error && (
        <p className="font-body text-destructive text-sm">{error}</p>
      )}
      <div className="flex gap-2">
        <RetroButton size="sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </RetroButton>
        <RetroButton
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </RetroButton>
      </div>
    </div>
  );
}

interface TemplateRowProps {
  template: Template;
  roleId: string;
  isFirst: boolean;
  isLast: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaved: () => void;
  onDeleteRequest: () => void;
  onReorder: (direction: 'up' | 'down') => void;
}

export function TemplateRow({
  template,
  roleId,
  isFirst,
  isLast,
  isEditing,
  onEdit,
  onCancelEdit,
  onSaved,
  onDeleteRequest,
  onReorder,
}: TemplateRowProps) {
  const [copied, setCopied] = useState(false);
  const copyTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  async function handleCopy() {
    await navigator.clipboard.writeText(template.fieldValue);
    setCopied(true);
    if (copyTimeout.current) clearTimeout(copyTimeout.current);
    copyTimeout.current = setTimeout(() => setCopied(false), 1500);
  }

  if (isEditing) {
    return (
      <TemplateEditForm
        template={template}
        roleId={roleId}
        onSaved={onSaved}
        onCancel={onCancelEdit}
      />
    );
  }

  return (
    <div className="border-border flex items-start gap-3 rounded-md border px-4 py-3">
      <div className="flex flex-col gap-0.5 pt-0.5">
        <button
          type="button"
          onClick={() => onReorder('up')}
          disabled={isFirst}
          className="text-muted-foreground hover:text-primary disabled:opacity-30 transition-colors"
          aria-label={`Move ${template.fieldKey} up`}
        >
          <ChevronUp className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => onReorder('down')}
          disabled={isLast}
          className="text-muted-foreground hover:text-primary disabled:opacity-30 transition-colors"
          aria-label={`Move ${template.fieldKey} down`}
        >
          <ChevronDown className="size-4" />
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-body text-foreground text-sm font-medium">
          {template.fieldKey}
        </p>
        <p className="font-body text-muted-foreground mt-0.5 whitespace-pre-wrap text-xs">
          {template.fieldValue}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <RetroButton
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          aria-label={`Copy ${template.fieldKey}`}
        >
          {copied ? (
            <Check className="size-4" />
          ) : (
            <Copy className="size-4" />
          )}
        </RetroButton>
        <RetroButton
          variant="ghost"
          size="icon"
          onClick={onEdit}
          aria-label={`Edit ${template.fieldKey}`}
        >
          <Pencil className="size-4" />
        </RetroButton>
        <RetroButton
          variant="ghost"
          size="icon"
          onClick={onDeleteRequest}
          aria-label={`Delete ${template.fieldKey}`}
        >
          <Trash2 className="size-4" />
        </RetroButton>
      </div>
    </div>
  );
}
