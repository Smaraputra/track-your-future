'use client';

import { RetroButton } from '@/components/retro-button';

interface StepCvUploadProps {
  onUploaded: () => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepCvUpload({ onNext, onBack }: StepCvUploadProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-primary text-lg">Upload CV</h2>
        <p className="font-body text-muted-foreground text-sm">
          Upload your CV to enable AI-powered features like CV parsing and match scoring.
          You can do this later from the Documents page.
        </p>
      </div>

      <div className="border-border rounded-md border border-dashed p-8 text-center">
        <p className="font-body text-muted-foreground text-sm">
          CV upload is available on the{' '}
          <span className="text-primary">Documents</span> page after setup.
        </p>
      </div>

      <div className="flex justify-between">
        <RetroButton variant="ghost" onClick={onBack}>Back</RetroButton>
        <RetroButton onClick={onNext}>Skip</RetroButton>
      </div>
    </div>
  );
}
