'use client';

import { Settings, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface UserMenuProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  onSignOut?: () => void;
  className?: string;
}

export function UserMenu({
  name,
  email,
  image,
  onSignOut,
  className,
}: UserMenuProps) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] rounded-full',
          className
        )}
      >
        <Avatar className="size-8 border border-border">
          <AvatarImage src={image ?? undefined} alt={name ?? 'User'} />
          <AvatarFallback className="bg-surface text-muted-foreground font-body text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-surface border-border font-body w-56"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            {name && (
              <p className="text-sm font-medium leading-none">{name}</p>
            )}
            {email && (
              <p className="text-muted-foreground text-xs leading-none">
                {email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/settings" className="cursor-pointer">
            <Settings className="mr-2 size-4" />
            Settings
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut} className="cursor-pointer">
          <LogOut className="mr-2 size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
