// script-src includes 'unsafe-inline'/'unsafe-eval' — required by Next.js hydration, Clerk, and Stripe.
// Tighten to nonce-based CSP in a future pass once Clerk/Stripe support it.
//
// Clerk CDN domains — all three required:
//   *.clerk.accounts.dev   — development instances (pk_test_*)
//   *.clerk.com            — Clerk-hosted production instances (pk_live_*)
//   clerk.visascout.io     — custom Clerk domain configured in Clerk dashboard for production
// Missing any one of these breaks Clerk on the respective environment.
export function buildCsp(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.clerk.accounts.dev https://*.clerk.com https://clerk.visascout.io https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https: wss:",
    "frame-src https://js.stripe.com https://*.stripe.com https://*.clerk.accounts.dev https://*.clerk.com https://clerk.visascout.io https://challenges.cloudflare.com",
    "worker-src blob:",
    "frame-ancestors 'none'",
    "object-src 'none'",
  ].join('; ');
}
