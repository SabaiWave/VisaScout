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
  .lps-toc-head {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-tertiary);
    margin-bottom: 16px;
  }
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
    const elements = ids.map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-10% 0px -75% 0px', threshold: 0 }
    );

    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [tocItems]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SHELL_CSS }} />
      <div className="lps-wrap">
        <aside className="lps-toc" aria-label="Contents">
          <div className="lps-toc-head">Contents</div>
          <nav>
            {tocItems.map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`lps-link${activeId === item.id ? ' active' : ''}`}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>
        <div>
          {children}
        </div>
      </div>
    </>
  );
}
