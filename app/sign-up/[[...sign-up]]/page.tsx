import { SignUp } from '@clerk/nextjs';
import { LandingNav } from '@/app/components/LandingNav';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg-base)' }}>
      <LandingNav />
      <div className="flex-1 flex items-center justify-center px-4">
        <SignUp />
      </div>
    </div>
  );
}
