/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NavDrawer, HamburgerButton } from '@/app/components/ui/MobileDrawer';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  document.body.style.overflow = '';
});

describe('NavDrawer', () => {
  it('renders children', () => {
    render(
      <NavDrawer open={true} onClose={() => {}}>
        <div>menu content</div>
      </NavDrawer>
    );
    expect(screen.getByText('menu content')).toBeInTheDocument();
  });

  it('has role=dialog and aria-modal', () => {
    render(<NavDrawer open={true} onClose={() => {}}><div /></NavDrawer>);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('close button fires onClose', () => {
    const onClose = jest.fn();
    render(<NavDrawer open={true} onClose={onClose}><div /></NavDrawer>);
    fireEvent.click(screen.getByLabelText('Close menu'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('backdrop click fires onClose', () => {
    const onClose = jest.fn();
    const { container } = render(<NavDrawer open={true} onClose={onClose}><div /></NavDrawer>);
    const backdrop = container.querySelector('[aria-hidden]') as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ESC key fires onClose when open', () => {
    const onClose = jest.fn();
    render(<NavDrawer open={true} onClose={onClose}><div /></NavDrawer>);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ESC key does not fire onClose when closed', () => {
    const onClose = jest.fn();
    render(<NavDrawer open={false} onClose={onClose}><div /></NavDrawer>);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('locks body scroll when open', () => {
    render(<NavDrawer open={true} onClose={() => {}}><div /></NavDrawer>);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when closed', () => {
    const { rerender } = render(<NavDrawer open={true} onClose={() => {}}><div /></NavDrawer>);
    expect(document.body.style.overflow).toBe('hidden');
    rerender(<NavDrawer open={false} onClose={() => {}}><div /></NavDrawer>);
    expect(document.body.style.overflow).toBe('');
  });

  it('slides from left when side=left', () => {
    render(<NavDrawer open={true} onClose={() => {}} side="left"><div /></NavDrawer>);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveStyle({ left: '0px' });
  });

  it('slides from right by default', () => {
    render(<NavDrawer open={true} onClose={() => {}}><div /></NavDrawer>);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveStyle({ right: '0px' });
  });
});

describe('HamburgerButton', () => {
  it('renders with Open menu aria-label', () => {
    render(<HamburgerButton onClick={() => {}} />);
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });

  it('fires onClick when clicked', () => {
    const onClick = jest.fn();
    render(<HamburgerButton onClick={onClick} />);
    fireEvent.click(screen.getByLabelText('Open menu'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
