import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { SignUp } from '@clerk/nextjs';
import { LandingNav } from '@/app/components/LandingNav';

export default async function SignUpPage() {
  const { userId } = await auth();
  if (userId) redirect('/app');

  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: 'var(--color-bg-base)' }}>
      <div className="chart-texture" aria-hidden="true" />
      <LandingNav />
      <div className="flex-1 flex items-center justify-center px-4 relative z-10">
        <SignUp forceRedirectUrl="/app" signInUrl="/sign-in" />
      </div>
    </div>
  );
}
