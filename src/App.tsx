import React, { useState, useEffect } from 'react';
import { Crown } from 'lucide-react';
import NewsroomHome from './components/pages/NewsroomHome';
import ArticleDetail from './components/pages/ArticleDetail';
import WinnersPage from './components/pages/WinnersPage';
import SubmitArticleForm from './components/ui/SubmitArticleForm';
import ModerationDashboard from './components/pages/ModerationDashboard';
import Footer from './components/ui/Footer';
import { InstallPrompt, OfflineIndicator } from './components/pwa';

type Page = 'home' | 'article' | 'submit' | 'admin' | 'winners';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  // URL-based routing detection
  useEffect(() => {
    const path = window.location.pathname;

    if (path === '/admin') {
      setCurrentPage('admin');
    } else if (path === '/submit') {
      setCurrentPage('submit');
    } else if (path === '/winners') {
      setCurrentPage('winners');
    } else if (path.startsWith('/article/')) {
      const articleId = path.split('/article/')[1];
      if (articleId) {
        setSelectedArticleId(articleId);
        setCurrentPage('article');
      }
    } else {
      setCurrentPage('home');
    }
  }, []);

  // Listen for browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;

      if (path === '/admin') {
        setCurrentPage('admin');
      } else if (path === '/submit') {
        setCurrentPage('submit');
      } else if (path === '/winners') {
        setCurrentPage('winners');
      } else if (path.startsWith('/article/')) {
        const articleId = path.split('/article/')[1];
        if (articleId) {
          setSelectedArticleId(articleId);
          setCurrentPage('article');
        }
      } else {
        setCurrentPage('home');
        setSelectedArticleId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToArticle = (articleId: string) => {
    setSelectedArticleId(articleId);
    setCurrentPage('article');
    window.history.pushState({}, '', `/article/${articleId}`);
  };

  const navigateToHome = () => {
    setCurrentPage('home');
    setSelectedArticleId(null);
    window.history.pushState({}, '', '/');
  };

  const navigateToSubmit = () => {
    setCurrentPage('submit');
    window.history.pushState({}, '', '/submit');
  };

  const navigateToWinners = () => {
    setCurrentPage('winners');
    window.history.pushState({}, '', '/winners');
  };

  const navigateToAdmin = () => {
    setCurrentPage('admin');
    window.history.pushState({}, '', '/admin');
  };

  return (
    <div className="min-h-screen bg-liberation-black-power text-white flex flex-col">
      {/* Section identity bar — News = purple-deep (Round 2 chrome, mirrors community-platform) */}
      <div className="sticky top-0 z-40 h-1 bg-liberation-pride-purple-deep" aria-hidden />

      {/* Global Navigation — Option C hybrid 5-button cross-app nav. Each button carries its own
          section-accent underline; News is current and shows the active state. */}
      <nav className="sticky top-1 z-40 bg-liberation-black-power border-b border-liberation-gold-divine/30 shadow-lg backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-18">
            {/* Logo + brand */}
            <button onClick={navigateToHome} className="flex items-center gap-3" aria-label="News home">
              <img
                src="/images/blkoutlogo_wht_transparent.png"
                alt="BLKOUT"
                className="h-10 md:h-12 w-auto hover:scale-105 transition-transform drop-shadow-lg"
              />
              <div className="hidden md:block text-left border-l border-liberation-gold-divine/30 pl-3">
                <div className="font-signature font-black text-lg tracking-tight uppercase text-liberation-gold-divine leading-none">News That Matters</div>
                <p className="text-xs text-gray-400 font-disrupt italic mt-1">through a Black queer lens</p>
              </div>
            </button>

            {/* Desktop cross-app nav — News is current; others hover-accent per section. */}
            <div className="hidden lg:flex items-center gap-4">
              <a
                href="https://blkoutuk.com"
                className="px-4 py-2 text-base font-signature font-black uppercase tracking-tight transition-colors duration-200 border-b-2 border-transparent text-gray-200 hover:text-liberation-gold-divine hover:border-liberation-gold-divine/60"
              >
                Home
              </a>
              <a
                href="https://events.blkoutuk.com"
                className="px-4 py-2 text-base font-signature font-black uppercase tracking-tight transition-colors duration-200 border-b-2 border-transparent text-gray-200 hover:text-liberation-events hover:border-liberation-events/60"
              >
                Events
              </a>
              <button
                onClick={navigateToHome}
                className="px-4 py-2 text-base font-signature font-black uppercase tracking-tight transition-colors duration-200 border-b-2 text-liberation-pride-purple-deep border-liberation-pride-purple-deep"
                aria-current="page"
              >
                News
              </button>
              <a
                href="https://blkoutuk.com/intro"
                className="px-4 py-2 text-base font-signature font-black uppercase tracking-tight transition-colors duration-200 border-b-2 border-transparent text-gray-200 hover:text-liberation-aivor hover:border-liberation-aivor/60"
              >
                AIvor
              </a>
              <a
                href="https://voices.blkoutuk.cloud"
                className="px-4 py-2 text-base font-signature font-black uppercase tracking-tight transition-colors duration-200 border-b-2 border-transparent text-gray-200 hover:text-liberation-pan-african-green hover:border-liberation-pan-african-green/60"
              >
                Voices
              </a>
            </div>

            {/* News-specific actions on the right of the nav. */}
            <div className="flex items-center gap-2">
              <button
                onClick={navigateToWinners}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-bold uppercase tracking-wider transition-colors duration-200 border-b-2 border-transparent text-gray-300 hover:text-liberation-pride-purple-deep hover:border-liberation-pride-purple-deep/60"
              >
                <Crown className="h-4 w-4" />
                Top Stories
              </button>
              <button
                onClick={navigateToSubmit}
                className="px-4 py-2 bg-liberation-pride-purple-deep text-white font-signature font-black uppercase tracking-wider text-sm hover:bg-liberation-pride-purple transition-colors border border-liberation-pride-purple-deep"
              >
                Submit Story
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <NewsroomHome onArticleClick={navigateToArticle} />
        )}
        {currentPage === 'article' && selectedArticleId && (
          <ArticleDetail articleId={selectedArticleId} onBack={navigateToHome} />
        )}
        {currentPage === 'submit' && (
          <div className="max-w-3xl mx-auto px-4 py-8">
            <SubmitArticleForm onClose={navigateToHome} />
          </div>
        )}
        {currentPage === 'winners' && (
          <WinnersPage />
        )}
        {currentPage === 'admin' && (
          <ModerationDashboard />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* PWA Components */}
      <OfflineIndicator />
      <InstallPrompt />
    </div>
  );
}

export default App;
