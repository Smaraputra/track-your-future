'use client';

import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import Link from 'next/link';

import { RetroButton } from '@/components/retro-button';
import { TemplateRow } from '@/components/templates/template-row';
import { TemplateAddForm } from '@/components/templates/template-add-form';
import { DeleteTemplateDialog } from '@/components/templates/delete-template-dialog';
import { useSubscription } from '@/hooks/use-subscription';
import { PLAN_LIMITS } from '@/lib/billing/plans';

interface Template {
  id: string;
  fieldKey: string;
  fieldValue: string;
  position: number;
}

interface TemplateListProps {
  roleId: string;
  initialTemplates: Template[];
  globalTemplateCount: number;
}

export function TemplateList({
  roleId,
  initialTemplates,
  globalTemplateCount,
}: TemplateListProps) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [globalCount, setGlobalCount] = useState(globalTemplateCount);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);
  const { tier } = useSubscription();
  const limit = PLAN_LIMITS[tier].resources.formFieldTemplates;

  const refreshTemplates = useCallback(async () => {
    const res = await fetch(`/api/roles/${roleId}/templates`);
    if (res.ok) {
      const data = await res.json();
      setTemplates(data);
      setGlobalCount((prev) => prev + (data.length - templates.length));
    }
  }, [roleId, templates.length]);

  async function handleReorder(index: number, direction: 'up' | 'down') {
    const newTemplates = [...templates];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newTemplates.length) return;

    // Optimistic update
    [newTemplates[index], newTemplates[swapIndex]] = [
      newTemplates[swapIndex],
      newTemplates[index],
    ];
    setTemplates(newTemplates);

    const orderedIds = newTemplates.map((t) => t.id);
    const res = await fetch(`/api/roles/${roleId}/templates/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds }),
    });

    if (!res.ok) {
      refreshTemplates();
    }
  }

  function handleCreated() {
    setAddingNew(false);
    setGlobalCount((prev) => prev + 1);
    refreshTemplates();
  }

  function handleDeleted() {
    setDeleteTarget(null);
    setGlobalCount((prev) => prev - 1);
    refreshTemplates();
  }

  function handleSaved() {
    setEditingId(null);
    refreshTemplates();
  }

  const atLimit = limit !== null && globalCount >= limit;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-body text-muted-foreground text-sm">
          {templates.length} template{templates.length !== 1 ? 's' : ''}
          {limit !== null ? ` (${globalCount} / ${limit} total)` : ''}
        </p>
        <RetroButton
          size="sm"
          disabled={atLimit || addingNew}
          onClick={() => {
            setEditingId(null);
            setAddingNew(true);
          }}
        >
          <Plus className="size-4" />
          Add Field
        </RetroButton>
      </div>

      {addingNew && (
        <TemplateAddForm
          roleId={roleId}
          onCreated={handleCreated}
          onCancel={() => setAddingNew(false)}
        />
      )}

      {templates.length === 0 && !addingNew ? (
        <div className="border-border rounded-md border p-8 text-center">
          <p className="font-heading text-primary text-lg">
            No Templates Yet
          </p>
          <p className="font-body text-muted-foreground mt-1 text-sm">
            Add reusable form field answers to quickly fill job applications.
          </p>
          <RetroButton
            size="sm"
            className="mt-4"
            disabled={atLimit}
            onClick={() => setAddingNew(true)}
          >
            <Plus className="size-4" />
            Add Your First Field
          </RetroButton>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((template, index) => (
            <TemplateRow
              key={template.id}
              template={template}
              roleId={roleId}
              isFirst={index === 0}
              isLast={index === templates.length - 1}
              isEditing={editingId === template.id}
              onEdit={() => {
                setAddingNew(false);
                setEditingId(template.id);
              }}
              onCancelEdit={() => setEditingId(null)}
              onSaved={handleSaved}
              onDeleteRequest={() => setDeleteTarget(template)}
              onReorder={(dir) => handleReorder(index, dir)}
            />
          ))}
        </div>
      )}

      {atLimit && tier === 'free' && (
        <p className="font-body text-muted-foreground text-center text-xs">
          Free plan template limit reached.{' '}
          <Link href="/pricing" className="text-primary hover:underline">
            Upgrade to Pro
          </Link>{' '}
          for unlimited templates.
        </p>
      )}

      {deleteTarget && (
        <DeleteTemplateDialog
          roleId={roleId}
          templateId={deleteTarget.id}
          fieldKey={deleteTarget.fieldKey}
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
