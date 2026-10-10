import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Logo from './Logo';

const SiteHeader: React.FC = () => (
  <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-100">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
      <Link to="/?home" className="flex items-center gap-2 font-bold tracking-tight text-slate-900">
        <Logo className="w-7 h-7" />
        NoteWeb
      </Link>
      <nav className="flex items-center gap-1 sm:gap-2 text-sm">
        <a href="/#features" className="hidden sm:inline px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900">
          Features
        </a>
        <Link to="/pricing" className="px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900">
          Pricing
        </Link>
        <Link to="/blog" className="hidden sm:inline px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900">
          Blog
        </Link>
        <Link to="/app" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800">
          Open app <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </nav>
    </div>
  </header>
);

export const SiteFooter: React.FC = () => (
  <footer className="border-t border-slate-100 bg-slate-50">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
      <div className="flex items-center gap-2">
        <Logo className="w-5 h-5" />
        <span>© {new Date().getFullYear()} NoteWeb. Your notes stay on your device.</span>
      </div>
      <nav className="flex items-center gap-5">
        <Link to="/app" className="hover:text-slate-800">App</Link>
        <Link to="/pricing" className="hover:text-slate-800">Pricing</Link>
        <Link to="/blog" className="hover:text-slate-800">Blog</Link>
        <Link to="/help" className="hover:text-slate-800">Help</Link>
      </nav>
    </div>
  </footer>
);

export default SiteHeader;
