/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useClerk } from '@clerk/nextjs';
import { SidebarAccount } from '@/app/components/SidebarAccount';

jest.mock('@clerk/nextjs', () => ({
  useClerk: jest.fn(),
}));

jest.mock('next/link', () => {
  const MockLink = ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) =>
    <a href={href} {...props}>{children}</a>;
  MockLink.displayName = 'MockLink';
  return MockLink;
});

const mockSignOut = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useClerk as unknown as jest.Mock).mockReturnValue({ signOut: mockSignOut });
});

describe('SidebarAccount', () => {
  it('Account Settings links to /dashboard/account', () => {
    render(<SidebarAccount />);
    expect(screen.getByRole('link', { name: /account settings/i })).toHaveAttribute('href', '/dashboard/account');
  });

  it('calls signOut with redirectUrl when Sign Out clicked', () => {
    render(<SidebarAccount />);
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
    expect(mockSignOut).toHaveBeenCalledWith({ redirectUrl: '/' });
  });

  it('renders both actions', () => {
    render(<SidebarAccount />);
    expect(screen.getByRole('link', { name: /account settings/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });
});
