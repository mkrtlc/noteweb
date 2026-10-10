import { useEffect } from 'react';

/**
 * Fades .mk-reveal elements in as they scroll into view. The scroll container
 * is the page wrapper (marketing pages scroll inside a fixed full-screen div).
 */
export const useReveal = (deps: unknown[] = []) => {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.mk-reveal:not([data-shown="true"])'));
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => (el.dataset.shown = 'true'));
      return;
    }
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.shown = 'true';
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
