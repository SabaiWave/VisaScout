/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { useUser } from '@clerk/nextjs';
import { SidebarAccount } from '@/app/components/SidebarAccount';

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
  (useUser as unknown as jest.Mock).mockReturnValue({ user: null });
});

describe('SidebarAccount', () => {
  it('shows fallback initials when no user', () => {
    render(<SidebarAccount />);
    expect(screen.getByText('??')).toBeInTheDocument();
  });

  it('shows initials from user name', () => {
    (useUser as unknown as jest.Mock).mockReturnValue({
      user: { firstName: 'Alex', lastName: 'Smith', emailAddresses: [] },
    });
    render(<SidebarAccount />);
    expect(screen.getByText('AS')).toBeInTheDocument();
  });

  it('shows email when user has email', () => {
    (useUser as unknown as jest.Mock).mockReturnValue({
      user: { firstName: null, lastName: null, emailAddresses: [{ emailAddress: 'alex@test.com' }] },
    });
    render(<SidebarAccount />);
    expect(screen.getByText('alex@test.com')).toBeInTheDocument();
  });

  it('shows ADMIN badge when isAdmin=true', () => {
    render(<SidebarAccount isAdmin />);
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  it('hides ADMIN badge when isAdmin=false', () => {
    render(<SidebarAccount isAdmin={false} />);
    expect(screen.queryByText('ADMIN')).not.toBeInTheDocument();
  });

  it('shows operational status', () => {
    render(<SidebarAccount />);
    expect(screen.getByText('Operational')).toBeInTheDocument();
  });
});
