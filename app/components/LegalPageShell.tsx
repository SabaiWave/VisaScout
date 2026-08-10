'use client';

import { useEffect, useState } from 'react';

const SHELL_CSS = `
  .lps-wrap {
    display: grid;
    grid-template-columns: 220px minmax(0, 720px);
    gap: 48px;
    max-width: 1040px;
    margin: 0 auto;
  }
  .lps-toc { position: sticky; top: 80px; height: fit-content; }
  /* .lps-toc-head font props from global .vs-mono-label */
  .lps-toc-head { margin-bottom: 16px; }
  .lps-link {
    display: block;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-secondary);
    text-decoration: none;
    padding: 5px 0 5px 12px;
    border-left: 2px solid transparent;
    line-height: 1.4;
    transition: color 0.12s, border-color 0.12s;
  }
  .lps-link:hover { color: var(--color-text-primary); }
  .lps-link.active { color: var(--color-secondary); border-left-color: var(--color-secondary); }
  @media (max-width: 820px) {
    .lps-wrap { grid-template-columns: 1fr; }
    .lps-toc { display: none; }
  }
`;

interface TocItem {
  id: string;
  label: string;
}

export function LegalPageShell({ tocItems, children }: { tocItems: TocItem[]; children: React.ReactNode }) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const ids = tocItems.map(t => t.id);

    const onScroll = () => {
      // At bottom of page → last section active
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8) {
        setActiveId(ids[ids.length - 1]);
        return;
      }
      // Last section whose heading has crossed 100px below viewport top
      const threshold = window.scrollY + 100;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= threshold) current = id;
      }
      setActiveId(current);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [tocItems]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SHELL_CSS }} />
      <div className="lps-wrap">
        <aside className="lps-toc" aria-label="Contents">
          <div className="lps-toc-head vs-mono-label">Contents</div>
          <nav>
            {tocItems.map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`lps-link${activeId === item.id ? ' active' : ''}`}
                onClick={() => setActiveId(item.id)}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>
        <div style={{ paddingBottom: '60vh' }}>
          {children}
        </div>
      </div>
    </>
  );
}
