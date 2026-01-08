import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import NewsroomHome from './components/pages/NewsroomHome';
import ArticleDetail from './components/pages/ArticleDetail';
import SubmitArticleForm from './components/ui/SubmitArticleForm';
import ModerationDashboard from './components/pages/ModerationDashboard';
import Footer from './components/ui/Footer';
import { InstallPrompt, OfflineIndicator } from './components/pwa';

type Page = 'home' | 'article' | 'submit' | 'admin';

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

  const navigateToPlatform = () => {
    window.location.href = 'https://blkoutuk.com';
  };

  const navigateToSubmit = () => {
    setCurrentPage('submit');
    window.history.pushState({}, '', '/submit');
  };

  const navigateToAdmin = () => {
    setCurrentPage('admin');
    window.history.pushState({}, '', '/admin');
  };

  return (
    <div className="min-h-screen bg-liberation-black-power text-white flex flex-col">
      {/* Global Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={navigateToPlatform}
              className="flex items-center gap-2 text-gray-400 hover:text-liberation-gold-divine transition-colors"
              aria-label="Return to BLKOUT platform"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Back to Platform</span>
            </button>

            <div className="flex items-center gap-3">
              <img
                src="/images/blkoutlogo_wht_transparent.png"
                alt="BLKOUT Logo"
                className="h-10 md:h-12 w-auto"
              />
              <div className="text-left">
                <h1 className="text-lg md:text-xl font-black leading-tight">
                  <span className="text-liberation-gold-divine">NEWS THAT MATTERS</span>
                </h1>
                <p className="text-xs text-gray-400 hidden md:block">
                  News reports and analysis through a Black Queer lens
                </p>
              </div>
            </div>

            <button
              onClick={navigateToSubmit}
              className="px-4 py-2 bg-liberation-gold-divine text-black font-semibold rounded-md hover:bg-liberation-sovereignty-gold transition-colors text-sm"
            >
              Submit Story
            </button>
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
