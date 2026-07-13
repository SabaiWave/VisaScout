/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { useUser } from '@clerk/nextjs';
import { UserAvatar } from '@/app/components/UserAvatar';

jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
}));

jest.mock('next/link', () => {
  const MockLink = ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) =>
    <a href={href} {...props}>{children}</a>;
  MockLink.displayName = 'MockLink';
  return MockLink;
});

beforeEach(() => {
  jest.clearAllMocks();
  (useUser as unknown as jest.Mock).mockReturnValue({
    user: {
      primaryEmailAddress: { emailAddress: 'alex@sabaiwave.com' },
    },
  });
});

describe('UserAvatar', () => {
  it('renders initial from email', () => {
    render(<UserAvatar />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('links to /dashboard/account', () => {
    render(<UserAvatar />);
    expect(screen.getByRole('link', { name: /account settings/i })).toHaveAttribute('href', '/dashboard/account');
  });

  it('uppercases initial', () => {
    (useUser as unknown as jest.Mock).mockReturnValue({
      user: { primaryEmailAddress: { emailAddress: 'zara@example.com' } },
    });
    render(<UserAvatar />);
    expect(screen.getByText('Z')).toBeInTheDocument();
  });

  it('falls back to "A" when user not loaded', () => {
    (useUser as unknown as jest.Mock).mockReturnValue({ user: null });
    render(<UserAvatar />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });
});
