/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth } from '@clerk/nextjs';
import { LandingNav } from '@/app/components/LandingNav';

jest.mock('@clerk/nextjs', () => ({ useAuth: jest.fn() }));

jest.mock('next/link', () => {
  const MockLink = ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) =>
    <a href={href} {...props}>{children}</a>;
  MockLink.displayName = 'MockLink';
  return MockLink;
});

jest.mock('@/app/components/SidebarAccount', () => ({
  SidebarAccount: () => <div data-testid="sidebar-account" />,
}));

jest.mock('@/app/components/ui/BrandGlyph', () => ({
  BrandGlyph: () => <div data-testid="brand-glyph" />,
}));

jest.mock('@/app/components/ui/navLinkStyles', () => ({
  navLinkStyle: {},
  ctaLinkStyle: {},
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  document.body.style.overflow = '';
});

describe('LandingNav — loading state', () => {
  it('does not show auth links while Clerk loads', () => {
    (useAuth as unknown as jest.Mock).mockReturnValue({ isSignedIn: false, isLoaded: false });
    render(<LandingNav />);
    expect(screen.queryByRole('link', { name: /sign in/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument();
  });
});

describe('LandingNav — signed out', () => {
  beforeEach(() => {
    (useAuth as unknown as jest.Mock).mockReturnValue({ isSignedIn: false, isLoaded: true });
  });

  it('shows Sign In and Get Brief in desktop nav', () => {
    render(<LandingNav />);
    // NavDrawer always mounts in DOM; both desktop + drawer Sign In links render
    expect(screen.getAllByRole('link', { name: /^sign in$/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /get brief/i })).toBeInTheDocument();
  });

  it('does not show Dashboard link', () => {
    render(<LandingNav />);
    expect(screen.queryByRole('link', { name: /^dashboard$/i })).not.toBeInTheDocument();
  });

  it('shows hamburger button', () => {
    render(<LandingNav />);
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });

  it('drawer shows Get Started CTA', () => {
    render(<LandingNav />);
    expect(screen.getByRole('link', { name: /get started/i })).toBeInTheDocument();
  });

  it('drawer does not show Generate Brief', () => {
    render(<LandingNav />);
    expect(screen.queryByRole('link', { name: /generate brief/i })).not.toBeInTheDocument();
  });

  it('drawer does not show SidebarAccount', () => {
    render(<LandingNav />);
    expect(screen.queryByTestId('sidebar-account')).not.toBeInTheDocument();
  });
});

describe('LandingNav — signed in', () => {
  beforeEach(() => {
    (useAuth as unknown as jest.Mock).mockReturnValue({ isSignedIn: true, isLoaded: true });
  });

  it('shows Dashboard and Generate Brief in desktop nav', () => {
    render(<LandingNav />);
    // NavDrawer always mounts; both desktop + drawer Dashboard/Generate Brief links render
    expect(screen.getAllByRole('link', { name: /^dashboard$/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /generate brief/i }).length).toBeGreaterThan(0);
  });

  it('does not show Sign In or Get Brief links', () => {
    render(<LandingNav />);
    expect(screen.queryByRole('link', { name: /^sign in$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /get brief/i })).not.toBeInTheDocument();
  });

  it('drawer shows SidebarAccount', () => {
    render(<LandingNav />);
    expect(screen.getByTestId('sidebar-account')).toBeInTheDocument();
  });

  it('drawer shows Generate Brief CTA', () => {
    render(<LandingNav />);
    expect(screen.getAllByRole('link', { name: /generate brief/i }).length).toBeGreaterThan(0);
  });

  it('drawer does not show Get Started link', () => {
    render(<LandingNav />);
    expect(screen.queryByRole('link', { name: /get started/i })).not.toBeInTheDocument();
  });
});
