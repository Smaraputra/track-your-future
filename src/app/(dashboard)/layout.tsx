import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getUserSubscription } from '@/lib/billing/feature-gate';
import { Sidebar } from '@/components/sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import { PastDueBanner } from '@/components/past-due-banner';
import { SubscriptionProvider } from '@/hooks/use-subscription';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const subscription = await getUserSubscription(session.user.id);

  return (
    <SubscriptionProvider
      value={{
        tier: subscription.tier,
        status: subscription.status,
        trialEnd: subscription.trialEnd?.toISOString() ?? null,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        currentPeriodEnd:
          subscription.currentPeriodEnd?.toISOString() ?? null,
      }}
    >
      <div className="flex h-screen overflow-hidden">
        <Sidebar className="hidden lg:flex" />
        <div className="flex flex-1 flex-col overflow-hidden">
          <DashboardHeader
            userName={session.user.name}
            userEmail={session.user.email}
            userImage={session.user.image}
          />
          <PastDueBanner />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </SubscriptionProvider>
  );
}
