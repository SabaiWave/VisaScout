'use client';
import { useEffect } from 'react';

// Clerk lazily injects <style> tags when popover/modal opens, not just on hydration.
// Each new Clerk <style> tag comes after ours, winning the cascade.
// MutationObserver watches <head> and re-appends our override LAST after every Clerk injection.
// html body prefix raises specificity to beat Clerk's single-class selectors.
export function ClerkFontFix() {
  useEffect(() => {
    const id = 'vs-clerk-font-fix';

    function reinsert() {
      const existing = document.getElementById(id);
      if (existing) existing.remove();
      const el = document.createElement('style');
      el.id = id;
      el.textContent = `html body [class*="cl-"],html body [class*="cl-"] *{font-family:var(--font-body),system-ui,sans-serif!important}`;
      document.head.appendChild(el);
    }

    reinsert();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if ((node as Element).tagName === 'STYLE' && (node as Element).id !== id) {
            reinsert();
            return;
          }
        }
      }
    });

    observer.observe(document.head, { childList: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
