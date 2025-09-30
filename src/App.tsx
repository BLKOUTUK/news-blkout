import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import NewsroomHome from './components/pages/NewsroomHome';
import ArticleDetail from './components/pages/ArticleDetail';
import SubmitArticleForm from './components/ui/SubmitArticleForm';
import Footer from './components/ui/Footer';

type Page = 'home' | 'article' | 'submit';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  const navigateToArticle = (articleId: string) => {
    setSelectedArticleId(articleId);
    setCurrentPage('article');
  };

  const navigateToHome = () => {
    setCurrentPage('home');
    setSelectedArticleId(null);
  };

  const navigateToPlatform = () => {
    window.location.href = 'https://blkout.vercel.app';
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

            <div className="text-center">
              <h1 className="text-xl md:text-2xl font-black">
                BLKOUT <span className="text-liberation-gold-divine">NEWSROOM</span>
              </h1>
              <p className="text-xs text-gray-400 hidden md:block">
                Community-Curated Liberation News
              </p>
            </div>

            <button
              onClick={() => setCurrentPage('submit')}
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
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
