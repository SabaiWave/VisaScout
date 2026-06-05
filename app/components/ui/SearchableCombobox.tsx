'use client';

import { useState, useRef, useEffect, useId, KeyboardEvent } from 'react';

interface SearchableComboboxProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  id?: string;
}

export function SearchableCombobox({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  disabled = false,
  hasError = false,
  id,
}: SearchableComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const filtered = query.trim()
    ? options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  // Close on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
        setActiveIdx(-1);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  // Scroll active item into view
  useEffect(() => {
    if (activeIdx >= 0 && listRef.current) {
      const item = listRef.current.children[activeIdx] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIdx]);

  function openDropdown() {
    if (disabled) return;
    setOpen(true);
    setQuery('');
    setActiveIdx(-1);
  }

  function selectOption(option: string) {
    onChange(option);
    setOpen(false);
    setQuery('');
    setActiveIdx(-1);
    inputRef.current?.blur();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDropdown();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && filtered[activeIdx]) selectOption(filtered[activeIdx]);
      else if (filtered.length === 1) selectOption(filtered[0]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
      setActiveIdx(-1);
      inputRef.current?.blur();
    }
  }

  const borderColor = hasError
    ? 'var(--color-error)'
    : open
      ? 'var(--color-secondary)'
      : 'var(--color-border-strong)';

  const focusRing = open
    ? '0 0 0 3px rgba(99,102,241,0.18)'
    : 'none';

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger input */}
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          autoComplete="off"
          disabled={disabled}
          readOnly={!open}
          value={open ? query : value}
          placeholder={value || placeholder}
          onFocus={openDropdown}
          onChange={e => { setQuery(e.target.value); setActiveIdx(-1); }}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            border: `1px solid ${borderColor}`,
            borderRadius: 'var(--radius-md)',
            padding: '10px 36px 10px 14px',
            fontSize: '1rem',
            color: value && !open ? 'var(--color-text-primary)' : open ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
            background: disabled ? 'var(--color-bg-base)' : 'var(--color-bg-elevated)',
            outline: 'none',
            boxShadow: focusRing,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            transition: 'border-color 0.15s, box-shadow 0.15s',
            fontFamily: 'var(--font-body)',
          }}
        />
        {/* Chevron */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: `translateY(-50%) rotate(${open ? '180deg' : '0deg'})`,
            transition: 'transform 0.15s',
            pointerEvents: 'none',
            color: 'var(--color-text-tertiary)',
            display: 'flex',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>

      {/* Dropdown */}
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          style={{
            position: 'absolute',
            zIndex: 50,
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            maxHeight: 'min(240px, 40vh)',
            overflowY: 'auto',
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border-strong)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-dropdown)',
            margin: 0,
            padding: '4px',
            listStyle: 'none',
          }}
        >
          {filtered.length === 0 ? (
            <li style={{
              padding: '10px 12px',
              fontSize: '0.8rem',
              color: 'var(--color-text-tertiary)',
              fontFamily: 'var(--font-body)',
            }}>
              No results
            </li>
          ) : (
            filtered.map((option, idx) => (
              <li
                key={option}
                role="option"
                aria-selected={option === value}
                onPointerDown={e => { e.preventDefault(); selectOption(option); }}
                style={{
                  padding: '9px 12px',
                  fontSize: '0.875rem',
                  borderRadius: 'calc(var(--radius-md) - 2px)',
                  cursor: 'pointer',
                  color: option === value
                    ? 'var(--color-secondary-light)'
                    : idx === activeIdx
                      ? 'var(--color-text-primary)'
                      : 'var(--color-text-secondary)',
                  background: option === value
                    ? 'var(--color-secondary-subtle)'
                    : idx === activeIdx
                      ? 'var(--color-bg-subtle)'
                      : 'transparent',
                  fontWeight: option === value ? 600 : 400,
                  fontFamily: 'var(--font-body)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background 0.1s',
                }}
              >
                {option}
                {option === value && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-secondary)', flexShrink: 0 }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
