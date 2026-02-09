'use client';

import { useState } from 'react';

import { RetroSelect } from '@/components/retro-select';
import { APPLICATION_STATUSES, STATUS_CONFIG } from '@/lib/applications';

interface ApplicationStatusSelectProps {
  applicationId: string;
  currentStatus: string;
  onStatusChanged: () => void;
}

export function ApplicationStatusSelect({
  applicationId,
  currentStatus,
  onStatusChanged,
}: ApplicationStatusSelectProps) {
  const [status, setStatus] = useState(currentStatus);
  const [updating, setUpdating] = useState(false);

  const options = APPLICATION_STATUSES.map((s) => ({
    value: s,
    label: STATUS_CONFIG[s].label,
  }));

  async function handleChange(newStatus: string) {
    if (newStatus === status) return;
    setUpdating(true);
    setStatus(newStatus);

    const res = await fetch(`/api/applications/${applicationId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) {
      setStatus(status);
    }

    setUpdating(false);
    onStatusChanged();
  }

  return (
    <RetroSelect
      options={options}
      value={status}
      onValueChange={handleChange}
      disabled={updating}
    />
  );
}
