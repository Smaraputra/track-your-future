'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

import { RetroButton } from '@/components/retro-button';
import { Badge } from '@/components/ui/badge';

interface CoverLetterViewerProps {
  content: string;
  tone: string;
}

export function CoverLetterViewer({ content, tone }: CoverLetterViewerProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs capitalize">
          {tone}
        </Badge>
        <RetroButton variant="ghost" size="sm" onClick={handleCopy}>
          {copied ? (
            <Check className="size-3" />
          ) : (
            <Copy className="size-3" />
          )}
          {copied ? 'Copied' : 'Copy'}
        </RetroButton>
      </div>
      <div className="font-body text-foreground whitespace-pre-wrap text-sm leading-relaxed">
        {content}
      </div>
    </div>
  );
}
