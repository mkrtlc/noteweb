import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { hasExistingNotes } from './services/storageService';

const NotesApp = lazy(() => import('./pages/NotesApp'));
const Landing = lazy(() => import('./pages/Landing'));
const Pricing = lazy(() => import('./pages/Pricing'));
const BlogList = lazy(() => import('./components/BlogList'));
const BlogPostPage = lazy(() => import('./components/BlogPost'));
const HelpPage = lazy(() => import('./components/HelpPage'));
const SharedNote = lazy(() => import('./pages/SharedNote'));
const ProWelcome = lazy(() => import('./pages/ProWelcome'));
const PublishedNote = lazy(() => import('./pages/PublishedNote'));
const PublicSite = lazy(() => import('./pages/PublicSite'));

const Loading: React.FC = () => (
  <div className="h-full w-full flex items-center justify-center bg-white">
    <div className="w-6 h-6 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" aria-label="Loading" />
  </div>
);

/**
 * "/" shows the landing page to first-time visitors. People who already have
 * notes in this browser go straight to the app, as they always have.
 * "/?home" always shows the landing page (used by the in-app logo).
 */
const Home: React.FC = () => {
  const location = useLocation();
  const forceLanding = new URLSearchParams(location.search).has('home');
  if (!forceLanding && hasExistingNotes()) return <Navigate to="/app" replace />;
  return <Landing />;
};

const App: React.FC = () => (
  <BrowserRouter>
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/app" element={<NotesApp />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/blog" element={<BlogList />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/share" element={<SharedNote />} />
        <Route path="/pro/welcome" element={<ProWelcome />} />
        <Route path="/p/:slug" element={<PublishedNote />} />
        <Route path="/u/:handle" element={<PublicSite />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;
