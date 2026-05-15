import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/terms',
  '/privacy',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/brief/(.*)',
  '/api/webhooks/(.*)',   // Stripe webhooks — no auth headers
  '/api/brief/poll',     // Brief status polling — UUID is the access token
  '/api/debug/(.*)',     // Debug endpoints — protected by DEBUG_ALLOWED env var inside the route
]);

const isApiRoute = createRouteMatcher(['/api/(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  const { userId } = await auth();

  if (!userId) {
    if (isApiRoute(req)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // Page routes — redirect to sign-in
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
