'use client';

import { Lock } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSubscription } from '@/hooks/use-subscription';
import { cn } from '@/lib/utils';

interface UpgradeGateProps {
  children: React.ReactNode;
  className?: string;
}

export function UpgradeGate({ children, className }: UpgradeGateProps) {
  const { tier } = useSubscription();

  if (tier === 'pro') {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('relative', className)}>
            <div className="pointer-events-none opacity-40">{children}</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-surface/80 border-border flex items-center gap-2 rounded-md border px-3 py-1.5">
                <Lock className="text-muted-foreground size-4" />
                <span className="font-body text-muted-foreground text-xs">
                  Pro
                </span>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Upgrade to Pro to unlock this feature</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
