'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { SectionHeading } from '@/app/components/ui/SectionHeading';
import { Wordmark } from '@/app/components/ui/Wordmark';
import { NavLink } from '@/app/components/ui/NavLink';

const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID ?? '';

// ─── Layout helpers ───────────────────────────────────────────────────────────

function DevSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <SectionHeading size="sm" className="mb-3">{title}</SectionHeading>
      <div
        className="rounded-lg p-4"
        style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}
      >
        {children}
      </div>
    </div>
  );
}

function DevButton({ label, sublabel, onClick, href, newTab = false, accent = false }: {
  label: string;
  sublabel?: string;
  onClick?: () => void;
  href?: string;
  newTab?: boolean;
  accent?: boolean;
}) {
  const base: React.CSSProperties = {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '0.625rem 0.75rem',
    borderRadius: '6px',
    border: `1px solid ${accent ? 'rgba(99,102,241,0.3)' : 'var(--color-border)'}`,
    background: accent ? 'var(--color-secondary-subtle)' : 'var(--color-bg-base)',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    textDecoration: 'none',
  };

  const inner = (
    <>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: accent ? 'var(--color-secondary-light)' : 'var(--color-text-primary)' }}>
        {label}
      </span>
      {sublabel && (
        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginTop: '0.1rem', letterSpacing: '0.03em', textTransform: 'none', fontWeight: 400 }}>
          {sublabel}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <a href={href} target={newTab ? '_blank' : undefined} rel={newTab ? 'noreferrer' : undefined} style={base}>
        {inner}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} style={base}>
      {inner}
    </button>
  );
}

function DevGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DevPage() {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();

  const isAdmin = !!ADMIN_USER_ID && userId === ADMIN_USER_ID;
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (!isLoaded) return;
    if (!isDev || !isAdmin) router.replace('/');
  }, [isLoaded, isDev, isAdmin, router]);

  if (!isLoaded || !isDev || !isAdmin) return null;

  return (
    <div style={{ background: 'var(--color-bg-base)', minHeight: '100vh' }}>
      <nav
        className="sticky top-0 z-50 border-b px-6 py-4"
        style={{ background: 'var(--color-bg-base)', borderColor: 'var(--color-border-muted)' }}
      >
        <div className="max-w-[960px] mx-auto flex items-center justify-between">
          <Wordmark />
          <div className="flex items-center gap-2">
            <NavLink href="/app">Generate</NavLink>
            <NavLink href="/admin">Admin</NavLink>
          </div>
        </div>
      </nav>

      <main className="max-w-[960px] mx-auto px-4 sm:px-6 py-8">
        <SectionHeading size="md" as="h1" className="mb-1">Dev Tools</SectionHeading>
        <p className="text-sm mb-8" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          DEV ONLY · ADMIN GATED · NOT ACCESSIBLE IN PRODUCTION
        </p>

        {/* Brief Flows */}
        <DevSection title="Brief Flows">
          <DevGrid>
            <DevButton
              label="Quick Flow"
              sublabel="Stays on /app · live agent table"
              href="/app?trigger=quick"
              accent
            />
            <DevButton
              label="Paid Flow"
              sublabel="Pending page · skeleton rows"
              href="/brief/pending?dev=true"
              accent
            />
          </DevGrid>
        </DevSection>

        {/* State simulation */}
        <DevSection title="State Simulation">
          <p className="text-xs mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>
            EACH NAVIGATES TO THE TARGET PAGE AND TRIGGERS THAT STATE ON MOUNT.
          </p>
          <DevGrid>
            <DevButton label="Main: Error Banner ↗"      sublabel="/app?sim=error"              href="/app?sim=error"              newTab />
            <DevButton label="Main: Payment Cancelled ↗" sublabel="/app?cancelled=true"      href="/app?cancelled=true"         newTab />
            <DevButton label="Pending: Error ↗"          sublabel="/brief/pending?sim=error"  href="/brief/pending?sim=error"    newTab />
            <DevButton label="Pending: Timeout ↗"        sublabel="/brief/pending?sim=timeout" href="/brief/pending?sim=timeout" newTab />
          </DevGrid>
        </DevSection>

        {/* Log & Event Simulation */}
        <DevSection title="Log & Event Simulation (requires DEBUG_ALLOWED=true)">
          <p className="text-xs mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>
            FIRES REAL LOG/ANALYTICS CALLS VIA THE SAME CODE PATHS AS PRODUCTION. ALL ENTRIES TAGGED SIM:TRUE IN BETTERSTACK. OPENS IN NEW TAB — CHECK THE JSON RESPONSE TO CONFIRM WHAT WAS SENT.
          </p>
          <div className="mb-2">
            <span className="text-xs uppercase font-bold tracking-wider" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>
              Alert triggers
            </span>
          </div>
          <DevGrid>
            <DevButton
              label="▲ Error Log ↗"
              sublabel="level:error → must-have alert"
              href="/api/debug/sim?event=error"
              newTab
              accent
            />
            <DevButton
              label="▲ Brief Failed ↗"
              sublabel="event:brief.failed + level:error"
              href="/api/debug/sim?event=brief.failed"
              newTab
              accent
            />
            <DevButton
              label="▲ Payment Completed ↗"
              sublabel="event:payment.completed · $19 sim"
              href="/api/debug/sim?event=payment.completed"
              newTab
              accent
            />
            <DevButton
              label="▲ Free Cap Hit ↗"
              sublabel="event:free_cap.reached"
              href="/api/debug/sim?event=free-cap.reached"
              newTab
              accent
            />
          </DevGrid>
          <div className="mt-3 mb-2">
            <span className="text-xs uppercase font-bold tracking-wider" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>
              Dashboard events
            </span>
          </div>
          <DevGrid>
            <DevButton
              label="Brief Started ↗"
              sublabel="event:brief.started · free tier"
              href="/api/debug/sim?event=brief.started"
              newTab
            />
            <DevButton
              label="Checkout Started ↗"
              sublabel="event:checkout.started · $19 standard"
              href="/api/debug/sim?event=checkout.started"
              newTab
            />
            <DevButton
              label="Brief Generated ↗"
              sublabel="event:brief.generated · healthy"
              href="/api/debug/sim?event=brief.generated"
              newTab
            />
            <DevButton
              label="Brief Generated Degraded ↗"
              sublabel="event:brief.generated · degraded:true"
              href="/api/debug/sim?event=brief.generated.degraded"
              newTab
            />
          </DevGrid>
        </DevSection>

        {/* Debug API */}
        <DevSection title="Debug API (requires DEBUG_ALLOWED=true)">
          <p className="text-xs mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>
            OPENS IN NEW TAB. RETURNS 404 UNLESS DEBUG_ALLOWED IS SET IN .ENV.LOCAL.
          </p>
          <DevGrid>
            <DevButton label="Health Check ↗"  sublabel="GET /api/debug/health"      href="/api/debug/health"      newTab />
            <DevButton label="Sentry Test ↗"   sublabel="GET /api/debug/sentry"      href="/api/debug/sentry"      newTab />
            <DevButton label="Pipeline Run ↗"  sublabel="GET /api/debug/pipeline"    href="/api/debug/pipeline"    newTab />
            <DevButton label="Welcome Email ↗" sublabel="GET /api/debug/email"        href="/api/debug/email"       newTab />
            <DevButton label="BetterStack ↗"   sublabel="GET /api/debug/betterstack" href="/api/debug/betterstack" newTab />
          </DevGrid>
        </DevSection>

        {/* Page navigation */}
        <DevSection title="Page Navigation">
          <p className="text-xs mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>
            OPENS IN NEW TAB — /DEV STAYS OPEN AS HOME BASE.
          </p>
          <DevGrid>
            <DevButton label="Home ↗"         href="/"                        newTab />
            <DevButton label="Generate ↗"     href="/app"                     newTab />
            <DevButton label="Dashboard ↗"    href="/dashboard"               newTab />
            <DevButton label="Contact ↗"      href="/contact"                 newTab />
            <DevButton label="How It Works ↗" href="/how-it-works"            newTab />
            <DevButton label="Admin ↗"        href="/admin"                   newTab />
            <DevButton label="Sign In ↗"      href="/sign-in"                 newTab />
            <DevButton label="Sign Up ↗"      href="/sign-up"                 newTab />
            <DevButton label="404 Page ↗"     href="/dev-this-does-not-exist" newTab />
            <DevButton label="Terms ↗"        href="/terms"                   newTab />
          </DevGrid>
        </DevSection>
      </main>
    </div>
  );
}
