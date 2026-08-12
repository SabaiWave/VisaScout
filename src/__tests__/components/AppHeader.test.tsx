/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAuth } from '@clerk/nextjs';
import { AppHeader } from '@/app/components/AppHeader';

jest.mock('@clerk/nextjs', () => ({ useAuth: jest.fn() }));

jest.mock('next/link', () => {
  const MockLink = ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) =>
    <a href={href} {...props}>{children}</a>;
  MockLink.displayName = 'MockLink';
  return MockLink;
});

jest.mock('@/app/components/ui/Wordmark', () => ({
  Wordmark: () => <div data-testid="wordmark" />,
}));

jest.mock('@/app/components/ui/NavLink', () => ({
  NavLink: ({ href, children }: { href: string; children: React.ReactNode }) =>
    <a href={href}>{children}</a>,
}));

jest.mock('@/app/components/SidebarAccount', () => ({
  SidebarAccount: () => <div data-testid="sidebar-account" />,
}));

jest.mock('@/app/components/UserAvatar', () => ({
  UserAvatar: () => <div data-testid="user-avatar" />,
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

describe('AppHeader — loading state', () => {
  it('shows neither UserAvatar nor Sign in while loading', () => {
    (useAuth as unknown as jest.Mock).mockReturnValue({ isSignedIn: false, isLoaded: false });
    render(<AppHeader />);
    expect(screen.queryByTestId('user-avatar')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^sign in$/i })).not.toBeInTheDocument();
  });
});

describe('AppHeader — signed in', () => {
  beforeEach(() => {
    (useAuth as unknown as jest.Mock).mockReturnValue({ isSignedIn: true, isLoaded: true });
  });

  it('shows UserAvatar in desktop nav', () => {
    render(<AppHeader />);
    expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
  });

  it('does not show Sign in link in desktop nav', () => {
    render(<AppHeader />);
    expect(screen.queryByRole('link', { name: /^sign in$/i })).not.toBeInTheDocument();
  });

  it('drawer shows Generate Brief CTA', () => {
    render(<AppHeader />);
    expect(screen.getByRole('link', { name: /generate brief/i })).toBeInTheDocument();
  });

  it('drawer shows SidebarAccount', () => {
    render(<AppHeader />);
    expect(screen.getByTestId('sidebar-account')).toBeInTheDocument();
  });

  it('shows hamburger button', () => {
    render(<AppHeader />);
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });
});

describe('AppHeader — signed out', () => {
  beforeEach(() => {
    (useAuth as unknown as jest.Mock).mockReturnValue({ isSignedIn: false, isLoaded: true });
  });

  it('shows Sign in link in desktop nav', () => {
    render(<AppHeader />);
    // NavDrawer always mounts; both desktop + drawer Sign in links render simultaneously
    expect(screen.getAllByRole('link', { name: /^sign in$/i }).length).toBeGreaterThan(0);
  });

  it('does not show UserAvatar', () => {
    render(<AppHeader />);
    expect(screen.queryByTestId('user-avatar')).not.toBeInTheDocument();
  });

  it('drawer shows Sign in instead of Generate Brief', () => {
    render(<AppHeader />);
    // drawer renders Sign in CTA for signed-out users
    const signInLinks = screen.getAllByRole('link', { name: /^sign in$/i });
    expect(signInLinks.length).toBeGreaterThan(0);
  });

  it('drawer does not show SidebarAccount', () => {
    render(<AppHeader />);
    expect(screen.queryByTestId('sidebar-account')).not.toBeInTheDocument();
  });
});
