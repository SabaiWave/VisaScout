import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { SignIn } from '@clerk/nextjs';
import { LandingNav } from '@/app/components/LandingNav';

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ redirect_url?: string }> }) {
  const { userId } = await auth();
  if (userId) {
    const params = await searchParams;
    let target = '/app';
    if (params.redirect_url) {
      try {
        // Extract pathname only — prevents open redirect
        const url = new URL(params.redirect_url);
        target = url.pathname + url.search;
      } catch {
        if (params.redirect_url.startsWith('/')) target = params.redirect_url;
      }
    }
    redirect(target);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg-base)' }}>
      <LandingNav />
      <div className="flex-1 flex items-center justify-center px-4">
        <SignIn forceRedirectUrl="/app" signUpUrl="/sign-up" />
      </div>
    </div>
  );
}
