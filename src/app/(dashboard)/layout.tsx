import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema/auth';
import { getUserSubscription } from '@/lib/billing/feature-gate';
import { Sidebar } from '@/components/sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import { PastDueBanner } from '@/components/past-due-banner';
import { OnboardingGuard } from '@/components/onboarding/onboarding-guard';
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

  // Check onboarding status
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { onboardingCompleted: true },
  });
  const onboardingCompleted = user?.onboardingCompleted ?? false;

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
            <OnboardingGuard completed={onboardingCompleted}>
              {children}
            </OnboardingGuard>
          </main>
        </div>
      </div>
    </SubscriptionProvider>
  );
}
