'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppearanceTab } from './appearance-tab';
import { ProfileTab } from './profile-tab';
import { SecurityTab } from './security-tab';
import { SubscriptionTab } from './subscription-tab';
import { DataTab } from './data-tab';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  hasPassword: boolean;
  createdAt: string;
}

interface SubscriptionInfo {
  tier: 'free' | 'pro';
  status: string | null;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
}

interface SettingsContentProps {
  user: UserInfo;
  linkedProviders: string[];
  subscription: SubscriptionInfo;
  billingDisabled?: boolean;
}

export function SettingsContent({
  user,
  linkedProviders,
  subscription,
  billingDisabled = false,
}: SettingsContentProps) {
  return (
    <Tabs defaultValue="appearance" className="w-full">
      <TabsList variant="line" className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="appearance" className="font-body text-xs">
          Appearance
        </TabsTrigger>
        <TabsTrigger value="profile" className="font-body text-xs">
          Profile
        </TabsTrigger>
        <TabsTrigger value="security" className="font-body text-xs">
          Security
        </TabsTrigger>
        <TabsTrigger value="subscription" className="font-body text-xs">
          Subscription
        </TabsTrigger>
        <TabsTrigger value="data" className="font-body text-xs">
          Data
        </TabsTrigger>
      </TabsList>

      <TabsContent value="appearance" className="mt-4">
        <AppearanceTab />
      </TabsContent>
      <TabsContent value="profile" className="mt-4">
        <ProfileTab name={user.name} email={user.email} />
      </TabsContent>
      <TabsContent value="security" className="mt-4">
        <SecurityTab
          hasPassword={user.hasPassword}
          linkedProviders={linkedProviders}
        />
      </TabsContent>
      <TabsContent value="subscription" className="mt-4">
        <SubscriptionTab subscription={subscription} billingDisabled={billingDisabled} />
      </TabsContent>
      <TabsContent value="data" className="mt-4">
        <DataTab createdAt={user.createdAt} />
      </TabsContent>
    </Tabs>
  );
}
