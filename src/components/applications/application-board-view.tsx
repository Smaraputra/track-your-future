'use client';

import {
  DndContext,
  DragOverlay,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useState } from 'react';

import { RetroStatusBadge } from '@/components/retro-status-badge';
import { DraggableApplicationCard } from './draggable-application-card';
import {
  APPLICATION_STATUSES,
  STATUS_CONFIG,
  type ApplicationStatus,
} from '@/lib/applications';
import { type ApplicationItem } from './applications-page-content';

interface ApplicationBoardViewProps {
  applications: ApplicationItem[];
  onStatusChange: (applicationId: string, newStatus: string) => void;
}

function DroppableColumn({
  status,
  applications,
}: {
  status: ApplicationStatus;
  applications: ApplicationItem[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = STATUS_CONFIG[status];

  return (
    <div className="flex w-[200px] shrink-0 flex-col">
      <div className="mb-2 flex items-center gap-2">
        <RetroStatusBadge status={status} />
        <span className="font-body text-muted-foreground text-xs">
          {applications.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`border-border flex min-h-[200px] flex-1 flex-col gap-2 rounded-md border p-2 transition-colors ${
          isOver ? 'border-primary/50 bg-primary/5' : 'bg-surface'
        }`}
      >
        <SortableContext
          items={applications.map((a) => a.id)}
          strategy={verticalListSortingStrategy}
        >
          {applications.map((app) => (
            <DraggableApplicationCard key={app.id} application={app} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export function ApplicationBoardView({
  applications,
  onStatusChange,
}: ApplicationBoardViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const columns = APPLICATION_STATUSES.map((status) => ({
    status,
    apps: applications.filter((a) => a.currentStatus === status),
  }));

  const activeApp = activeId
    ? applications.find((a) => a.id === activeId)
    : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const app = applications.find((a) => a.id === active.id);
    if (!app) return;

    // Determine target status: if dropped on a column, use column id;
    // if dropped on a card, find that card's status
    let targetStatus = over.id as string;
    if (!APPLICATION_STATUSES.includes(targetStatus as ApplicationStatus)) {
      const targetApp = applications.find((a) => a.id === over.id);
      if (targetApp) {
        targetStatus = targetApp.currentStatus;
      }
    }

    if (app.currentStatus !== targetStatus) {
      onStatusChange(app.id, targetStatus);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {columns.map(({ status, apps }) => (
          <DroppableColumn key={status} status={status} applications={apps} />
        ))}
      </div>

      <DragOverlay>
        {activeApp ? (
          <div className="border-primary bg-background rounded-md border p-2 shadow-lg">
            <p className="font-heading text-primary text-sm">
              {activeApp.companyName}
            </p>
            <p className="font-body text-muted-foreground text-xs">
              {activeApp.jobTitle}
            </p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
