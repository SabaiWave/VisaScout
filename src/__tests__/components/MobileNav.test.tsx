/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MobileNav } from '@/app/dashboard/MobileNav';

jest.mock('next/navigation', () => ({ usePathname: () => '/dashboard' }));

jest.mock('next/link', () => {
  const MockLink = ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) =>
    <a href={href} {...props}>{children}</a>;
  MockLink.displayName = 'MockLink';
  return MockLink;
});

jest.mock('@/app/components/ui/Wordmark', () => ({
  Wordmark: () => <div data-testid="wordmark" />,
}));

jest.mock('@/app/dashboard/SidebarAccount', () => ({
  SidebarAccount: () => <div data-testid="sidebar-account" />,
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

describe('MobileNav', () => {
  it('renders hamburger button', () => {
    render(<MobileNav isAdmin={false} showDev={false} />);
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });

  it('always shows Generate Brief in drawer', () => {
    render(<MobileNav isAdmin={false} showDev={false} />);
    expect(screen.getByRole('link', { name: /generate brief/i })).toBeInTheDocument();
  });

  describe('isSignedIn flag', () => {
    it('true: shows My Briefs in drawer', () => {
      render(<MobileNav isAdmin={false} showDev={false} isSignedIn={true} />);
      expect(screen.getByRole('link', { name: /my briefs/i })).toBeInTheDocument();
    });

    it('false: hides My Briefs from drawer', () => {
      render(<MobileNav isAdmin={false} showDev={false} isSignedIn={false} />);
      expect(screen.queryByRole('link', { name: /my briefs/i })).not.toBeInTheDocument();
    });

    it('true: shows SidebarAccount', () => {
      render(<MobileNav isAdmin={false} showDev={false} isSignedIn={true} />);
      expect(screen.getByTestId('sidebar-account')).toBeInTheDocument();
    });

    it('false: shows Sign In and Get Started instead', () => {
      render(<MobileNav isAdmin={false} showDev={false} isSignedIn={false} />);
      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /get started/i })).toBeInTheDocument();
    });
  });

  describe('isAdmin flag', () => {
    it('true: shows Admin link in drawer', () => {
      render(<MobileNav isAdmin={true} showDev={false} />);
      expect(screen.getByRole('link', { name: /^admin$/i })).toBeInTheDocument();
    });

    it('false: hides Admin link from drawer', () => {
      render(<MobileNav isAdmin={false} showDev={false} />);
      expect(screen.queryByRole('link', { name: /^admin$/i })).not.toBeInTheDocument();
    });
  });

  describe('showDev flag', () => {
    it('true: shows Dev link in drawer', () => {
      render(<MobileNav isAdmin={false} showDev={true} />);
      expect(screen.getByRole('link', { name: /^dev$/i })).toBeInTheDocument();
    });

    it('false: hides Dev link from drawer', () => {
      render(<MobileNav isAdmin={false} showDev={false} />);
      expect(screen.queryByRole('link', { name: /^dev$/i })).not.toBeInTheDocument();
    });
  });

  it('Admin and Dev links hidden by default (both false)', () => {
    render(<MobileNav isAdmin={false} showDev={false} />);
    expect(screen.queryByRole('link', { name: /^admin$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^dev$/i })).not.toBeInTheDocument();
  });
});
