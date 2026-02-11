'use client';

import { Loader2 } from 'lucide-react';
import { RetroButton } from '@/components/retro-button';

interface StepSummaryProps {
  data: {
    name: string;
    roleName: string;
    roleColor: string;
    cvUploaded: boolean;
  };
  loading: boolean;
  onComplete: () => void;
  onBack: () => void;
}

export function StepSummary({ data, loading, onComplete, onBack }: StepSummaryProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="font-body text-muted-foreground text-xs mb-1">user@tyf:~$ init --step=confirm</p>
        <h2 className="font-heading text-primary text-shadow-glow text-lg">Ready to Launch</h2>
        <p className="font-body text-muted-foreground text-sm">
          Review your setup and initialize your dashboard.
        </p>
      </div>

      <div className="border-border space-y-2 rounded-md border p-4">
        <div className="flex justify-between">
          <span className="font-body text-muted-foreground text-sm">Name</span>
          <span className="font-body text-foreground text-sm">
            {data.name || 'Not set'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-body text-muted-foreground text-sm">Role</span>
          <span className="font-body text-foreground flex items-center gap-2 text-sm">
            {data.roleName ? (
              <>
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: data.roleColor }}
                />
                {data.roleName}
              </>
            ) : (
              'Skipped'
            )}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-body text-muted-foreground text-sm">CV</span>
          <span className="font-body text-foreground text-sm">
            {data.cvUploaded ? 'Uploaded' : 'Upload later'}
          </span>
        </div>
      </div>

      <div className="flex justify-between">
        <RetroButton variant="ghost" onClick={onBack} disabled={loading}>
          Back
        </RetroButton>
        <RetroButton onClick={onComplete} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Initializing...
            </>
          ) : (
            'Initialize Dashboard'
          )}
        </RetroButton>
      </div>
    </div>
  );
}
