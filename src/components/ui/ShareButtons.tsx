import React, { useState } from 'react';
import { Share2, Twitter, Facebook, Linkedin, Link, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ShareButtonsProps {
  articleId: string;
  articleTitle: string;
  sourceUrl: string;
  className?: string;
}

const ShareButtons: React.FC<ShareButtonsProps> = ({
  articleId,
  articleTitle,
  sourceUrl,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Track share event in analytics
  const trackShare = async (platform: string) => {
    try {
      await supabase.from('newsroom_analytics').insert({
        article_id: articleId,
        event_type: 'share',
        metadata: {
          platform,
          timestamp: new Date().toISOString(),
        },
      });

      // Also increment share count on article if column exists
      // This is optional and depends on if you add a share_count column
    } catch (error) {
      console.error('Failed to track share:', error);
      // Non-blocking
    }
  };

  const handleShare = (platform: string) => {
    const shareText = `${articleTitle} - via @BLKOUTuk`;
    let url = '';

    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(sourceUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(sourceUrl)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(sourceUrl)}`;
        break;
    }

    if (url) {
      // Open share dialog
      window.open(url, '_blank', 'width=600,height=400,noopener,noreferrer');

      // Track the share
      trackShare(platform);

      // Close the share menu
      setShowShareMenu(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(sourceUrl);
      setCopied(true);
      trackShare('copy_link');

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);

      // Close the share menu after a short delay
      setTimeout(() => setShowShareMenu(false), 500);
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('Failed to copy link. Please try again.');
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Share button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowShareMenu(!showShareMenu);
        }}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-white/5 text-gray-400 hover:bg-liberation-pride-purple/10 hover:text-liberation-pride-purple transition-all"
        title="Share article"
      >
        <Share2 className="h-4 w-4" />
        <span className="hidden sm:inline">Share</span>
      </button>

      {/* Share menu dropdown */}
      {showShareMenu && (
        <>
          {/* Backdrop to close menu when clicking outside */}
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.stopPropagation();
              setShowShareMenu(false);
            }}
          />

          {/* Share options */}
          <div
            className="absolute right-0 top-full mt-2 bg-gray-900 border border-white/10 rounded-lg shadow-xl p-2 z-20 min-w-[200px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs text-gray-400 px-3 py-2 font-semibold uppercase tracking-wide">
              Share Article
            </div>

            {/* Twitter */}
            <button
              onClick={() => handleShare('twitter')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors text-sm"
            >
              <Twitter className="h-4 w-4 text-blue-400" />
              <span>Twitter</span>
            </button>

            {/* Facebook */}
            <button
              onClick={() => handleShare('facebook')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors text-sm"
            >
              <Facebook className="h-4 w-4 text-blue-500" />
              <span>Facebook</span>
            </button>

            {/* LinkedIn */}
            <button
              onClick={() => handleShare('linkedin')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors text-sm"
            >
              <Linkedin className="h-4 w-4 text-blue-600" />
              <span>LinkedIn</span>
            </button>

            {/* Divider */}
            <div className="h-px bg-white/10 my-2" />

            {/* Copy link */}
            <button
              onClick={handleCopyLink}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm ${
                copied
                  ? 'text-liberation-sovereignty-gold'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Link copied!</span>
                </>
              ) : (
                <>
                  <Link className="h-4 w-4" />
                  <span>Copy link</span>
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ShareButtons;
