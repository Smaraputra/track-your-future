'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';

import { type ApplicationItem } from './applications-page-content';

interface DraggableApplicationCardProps {
  application: ApplicationItem;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function DraggableApplicationCard({
  application,
}: DraggableApplicationCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: application.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="border-border bg-background cursor-grab rounded-md border p-2 active:cursor-grabbing"
    >
      <Link
        href={`/applications/${application.id}`}
        className="font-heading text-primary block truncate text-sm hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {application.companyName}
      </Link>
      <p className="font-body text-muted-foreground truncate text-xs">
        {application.jobTitle}
      </p>
      {application.appliedAt && (
        <p className="font-body text-muted-foreground mt-1 text-[10px]">
          {formatDate(application.appliedAt)}
        </p>
      )}
      {application.roleCategoryName && (
        <p
          className="font-body mt-1 truncate text-[10px]"
          style={
            application.roleCategoryColor
              ? { color: application.roleCategoryColor }
              : undefined
          }
        >
          {application.roleCategoryName}
        </p>
      )}
    </div>
  );
}
