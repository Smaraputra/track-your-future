import { BootSequence } from '@/components/boot-sequence';
import { LandingContent } from '@/components/landing-content';

export default function LandingPage() {
  return (
    <BootSequence>
      <LandingContent />
    </BootSequence>
  );
}
