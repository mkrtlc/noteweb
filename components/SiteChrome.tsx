import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Menu, X } from 'lucide-react';
import { useReveal } from '../hooks/useReveal';

/** White NoteWeb mark for dark backgrounds: three linked notes forming an N. */
export const MarkWhite: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
    <path d="M9 24V8l14 16V8" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9" cy="8" r="3.2" fill="currentColor" />
    <circle cx="9" cy="24" r="3.2" fill="currentColor" />
    <circle cx="23" cy="8" r="3.2" fill="currentColor" />
    <circle cx="23" cy="24" r="3.2" fill="currentColor" />
  </svg>
);

export const Wordmark: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`inline-flex items-center gap-2 ${className}`}>
    <MarkWhite className="w-[22px] h-[22px]" />
    <span className="mk-serif text-[22px] leading-none tracking-[-0.02em]">NoteWeb</span>
  </span>
);

/** Animated navy/teal mesh with a warm glow, plus the faint blueprint grid. */
export const Atmosphere: React.FC<{ variant?: 'hero' | 'cta' }> = ({ variant = 'hero' }) => (
  <>
    <div className={`mk-blob mk-blob-teal`} />
    {variant === 'hero' && <div className="mk-blob mk-blob-sky" />}
    <div className="mk-blob mk-blob-glow" />
    <div className="mk-grid-lines" />
    <div className="mk-grain" />
  </>
);

/** Fixed top bar. Transparent over the hero, gradient once the page scrolls. */
export const SiteNav: React.FC<{ scroller?: React.RefObject<HTMLElement> ; solid?: boolean }> = ({ scroller, solid = false }) => {
  const [scrolled, setScrolled] = useState(solid);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (solid) return;
    const el = scroller?.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 24);
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scroller, solid]);

  return (
    <header className="mk-nav" data-scrolled={scrolled || open ? 'true' : 'false'}>
      <div className="mk-container h-full flex items-center justify-between gap-6">
        <Link to="/?home" aria-label="NoteWeb home" onClick={() => setOpen(false)}>
          <Wordmark className="text-white" />
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <a href="/#features" className="mk-nav-link">
            Features
          </a>
          <a href="/#inside" className="mk-nav-link">
            Product
          </a>
          <Link to="/pricing" className="mk-nav-link">
            Pricing
          </Link>
          <Link to="/blog" className="mk-nav-link">
            Blog
          </Link>
        </nav>
        <div className="hidden md:flex items-center gap-5">
          <Link to="/app" className="mk-nav-link">
            Open app
          </Link>
          <Link to="/app" className="mk-btn mk-btn-ghost-dark">
            Start free <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <button className="md:hidden p-2 -mr-2" onClick={() => setOpen(o => !o)} aria-label="Menu">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-white/10 bg-[#090718]/95 backdrop-blur">
          <div className="mk-container py-4 flex flex-col gap-1">
            {[
              ['Features', '/#features'],
              ['Product', '/#inside'],
              ['Pricing', '/pricing'],
              ['Blog', '/blog'],
              ['Help', '/help'],
            ].map(([label, href]) => (
              <a key={href} href={href} className="py-2.5 text-[15px] text-white/90" onClick={() => setOpen(false)}>
                {label}
              </a>
            ))}
            <Link to="/app" className="mk-btn mk-btn-light mt-3 justify-center">
              Start writing free <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export const SiteFooter: React.FC = () => (
  <footer className="bg-[#090718] text-white">
    <div className="mk-container pt-16 pb-10">
      <div className="flex flex-col md:flex-row justify-between gap-12">
        <div className="max-w-xs">
          <Wordmark />
          <p className="mt-4 text-[13px] leading-relaxed text-white/55">A private, local-first notebook for connected thinking. Your notes stay on your device.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-16 gap-y-8 text-[14px]">
          <div>
            <p className="text-[11px] tracking-[0.08em] uppercase text-white/45 mb-4">Product</p>
            <ul className="space-y-3">
              <li><Link to="/app" className="text-white/90 hover:text-white">Open NoteWeb</Link></li>
              <li><a href="/#features" className="text-white/90 hover:text-white">Features</a></li>
              <li><Link to="/pricing" className="text-white/90 hover:text-white">Pricing</Link></li>
              <li><Link to="/pro/welcome" className="text-white/90 hover:text-white">Activate Pro</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] tracking-[0.08em] uppercase text-white/45 mb-4">Resources</p>
            <ul className="space-y-3">
              <li><Link to="/blog" className="text-white/90 hover:text-white">Blog</Link></li>
              <li><Link to="/help" className="text-white/90 hover:text-white">Help center</Link></li>
              <li><a href="mailto:support@noteweb.co" className="text-white/90 hover:text-white">Contact</a></li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] tracking-[0.08em] uppercase text-white/45 mb-4">Privacy</p>
            <ul className="space-y-3">
              <li><span className="text-white/90">No account needed</span></li>
              <li><span className="text-white/90">Works offline</span></li>
              <li><span className="text-white/90">Export anytime</span></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mt-16 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-3 text-[12px] text-white/55">
        <span>© {new Date().getFullYear()} NoteWeb. All rights reserved.</span>
        <span>Made for people who think in links.</span>
      </div>
    </div>
  </footer>
);

/** Page wrapper for marketing pages: owns the scroll container, nav and footer. */
export const MarketingPage: React.FC<{ children: React.ReactNode; solidNav?: boolean; revealKey?: unknown }> = ({ children, solidNav, revealKey }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  useReveal([revealKey]);
  return (
    <div ref={ref} className="mk fixed inset-0 overflow-y-auto overflow-x-hidden">
      <SiteNav scroller={ref} solid={solidNav} />
      {children}
      <SiteFooter />
    </div>
  );
};

/** Back-compat default export used by older pages. */
const SiteHeader: React.FC = () => <SiteNav solid />;
export default SiteHeader;
