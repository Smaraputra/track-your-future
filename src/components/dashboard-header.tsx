'use client';

import { signOut } from 'next-auth/react';
import { Header } from '@/components/header';

interface DashboardHeaderProps {
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
}

export function DashboardHeader({
  userName,
  userEmail,
  userImage,
}: DashboardHeaderProps) {
  return (
    <Header
      userName={userName}
      userEmail={userEmail}
      userImage={userImage}
      onSignOut={() => signOut({ redirectTo: '/' })}
    />
  );
}
