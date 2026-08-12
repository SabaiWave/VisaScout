/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { BriefCard } from '@/app/dashboard/BriefCard';

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));

jest.mock('@/app/components/ui/ConfirmDialog', () => ({
  ConfirmDialog: ({
    open,
    title,
    onConfirm,
    onCancel,
  }: {
    open: boolean;
    title: string;
    onConfirm: () => void;
    onCancel: () => void;
  }) =>
    open ? (
      <div>
        <span>{title}</span>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null,
}));

const mockPush = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as unknown as jest.Mock).mockReturnValue({ push: mockPush });
  global.fetch = jest.fn().mockResolvedValue({ ok: true }) as jest.Mock;
});

const baseBrief = {
  id: 'brief-abc',
  created_at: '2026-08-01T00:00:00Z',
  nationality: 'United States',
  destination: 'Thailand',
  depth: 'standard',
  overall_confidence: 'high',
  payment_status: 'free',
  degraded: false,
  rerun_count: 0,
};

describe('BriefCard — rendering', () => {
  it('shows destination', () => {
    render(<BriefCard brief={baseBrief} />);
    expect(screen.getByText('Thailand')).toBeInTheDocument();
  });

  it('shows nationality', () => {
    render(<BriefCard brief={baseBrief} />);
    expect(screen.getByText('United States')).toBeInTheDocument();
  });

  it('has aria-label containing destination on outer card', () => {
    const { container } = render(<BriefCard brief={baseBrief} />);
    // outer div has role="button" + aria-label; inner <button> also has same label
    const card = container.querySelector('div[role="button"]') as HTMLElement;
    expect(card).toHaveAttribute('aria-label', 'View Thailand brief');
  });

  it('shows HIGH confidence badge when not generating', () => {
    render(<BriefCard brief={baseBrief} />);
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });

  it('shows MEDIUM confidence badge', () => {
    render(<BriefCard brief={{ ...baseBrief, overall_confidence: 'medium' }} />);
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
  });

  it('shows DEGRADED tag when degraded=true', () => {
    render(<BriefCard brief={{ ...baseBrief, degraded: true }} />);
    expect(screen.getByText('DEGRADED')).toBeInTheDocument();
  });

  it('does not show DEGRADED tag when degraded=false', () => {
    render(<BriefCard brief={baseBrief} />);
    expect(screen.queryByText('DEGRADED')).not.toBeInTheDocument();
  });
});

describe('BriefCard — generating states', () => {
  const generatingStatuses = ['queued', 'processing', 'pending'];

  generatingStatuses.forEach((status) => {
    it(`shows RUNNING badge when payment_status=${status}`, () => {
      render(<BriefCard brief={{ ...baseBrief, payment_status: status, overall_confidence: null }} />);
      expect(screen.getByText('RUNNING')).toBeInTheDocument();
    });
  });

  it('links to ?pending=1 when generating', () => {
    const { container } = render(<BriefCard brief={{ ...baseBrief, payment_status: 'queued' }} />);
    fireEvent.click(container.querySelector('button.db-view') as HTMLElement);
    expect(mockPush).toHaveBeenCalledWith('/brief/brief-abc?pending=1');
  });
});

describe('BriefCard — keyboard navigation', () => {
  // Outer div has role="button" and handles onKeyDown; inner <button> has same aria-label.
  // Target the outer div directly to avoid ambiguity.
  function getOuterCard(container: HTMLElement) {
    return container.querySelector('div[role="button"]') as HTMLElement;
  }

  it('Enter key navigates to brief', () => {
    const { container } = render(<BriefCard brief={baseBrief} />);
    fireEvent.keyDown(getOuterCard(container), { key: 'Enter' });
    expect(mockPush).toHaveBeenCalledWith('/brief/brief-abc');
  });

  it('Space key navigates to brief', () => {
    const { container } = render(<BriefCard brief={baseBrief} />);
    fireEvent.keyDown(getOuterCard(container), { key: ' ' });
    expect(mockPush).toHaveBeenCalledWith('/brief/brief-abc');
  });

  it('other keys do not navigate', () => {
    const { container } = render(<BriefCard brief={baseBrief} />);
    fireEvent.keyDown(getOuterCard(container), { key: 'Tab' });
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe('BriefCard — delete flow', () => {
  it('delete button opens confirm dialog', () => {
    render(<BriefCard brief={baseBrief} />);
    fireEvent.click(screen.getByLabelText('Delete brief'));
    expect(screen.getByText('DELETE BRIEF')).toBeInTheDocument();
  });

  it('cancel hides confirm dialog without deleting', () => {
    render(<BriefCard brief={baseBrief} />);
    fireEvent.click(screen.getByLabelText('Delete brief'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('DELETE BRIEF')).not.toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('confirm calls DELETE api with brief id', async () => {
    render(<BriefCard brief={baseBrief} />);
    fireEvent.click(screen.getByLabelText('Delete brief'));
    fireEvent.click(screen.getByText('Confirm'));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/brief/brief-abc', { method: 'DELETE' });
    });
  });

  it('confirm calls onDelete callback after delete', async () => {
    const onDelete = jest.fn();
    render(<BriefCard brief={baseBrief} onDelete={onDelete} />);
    fireEvent.click(screen.getByLabelText('Delete brief'));
    fireEvent.click(screen.getByText('Confirm'));
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledTimes(1);
    });
  });
});
