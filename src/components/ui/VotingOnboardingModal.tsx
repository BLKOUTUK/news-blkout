import React, { useState, useEffect } from 'react';
import { X, ThumbsUp, Crown, Users, ArrowRight } from 'lucide-react';

const STORAGE_KEY = 'blkout_voting_onboarded';

interface VotingOnboardingModalProps {
  onClose?: () => void;
}

const VotingOnboardingModal: React.FC<VotingOnboardingModalProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already seen the onboarding
    const hasSeenOnboarding = localStorage.getItem(STORAGE_KEY);
    if (!hasSeenOnboarding) {
      // Small delay to let page load first
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-liberation-sovereignty-gold/30 rounded-2xl max-w-md w-full p-6 md:p-8 shadow-2xl animate-scale-in">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-liberation-sovereignty-gold/20 rounded-full mb-4">
            <span className="text-3xl">👋</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome to BLKOUT News
          </h2>
          <p className="text-gray-400">
            We're different. <span className="text-liberation-sovereignty-gold font-semibold">YOU</span> decide what news matters.
          </p>
        </div>

        {/* How it works - visual steps */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
            <div className="flex-shrink-0 w-10 h-10 bg-liberation-sovereignty-gold/20 rounded-full flex items-center justify-center">
              <ThumbsUp className="h-5 w-5 text-liberation-sovereignty-gold" />
            </div>
            <div>
              <p className="text-white font-medium">Click 👍 on stories</p>
              <p className="text-gray-400 text-sm">Vote for news you find important</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
            <div className="flex-shrink-0 w-10 h-10 bg-liberation-pride-purple/20 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-liberation-pride-purple" />
            </div>
            <div>
              <p className="text-white font-medium">Community votes count</p>
              <p className="text-gray-400 text-sm">We tally votes every week</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
            <div className="flex-shrink-0 w-10 h-10 bg-liberation-sovereignty-gold/20 rounded-full flex items-center justify-center">
              <Crown className="h-5 w-5 text-liberation-sovereignty-gold" />
            </div>
            <div>
              <p className="text-white font-medium">Top story wins</p>
              <p className="text-gray-400 text-sm">Most-voted becomes Story of the Week</p>
            </div>
          </div>
        </div>

        {/* No login required callout */}
        <div className="bg-liberation-sovereignty-gold/10 border border-liberation-sovereignty-gold/20 rounded-lg p-3 mb-6 text-center">
          <p className="text-liberation-sovereignty-gold text-sm font-medium">
            No login required - just click and vote!
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleClose}
          className="w-full bg-liberation-sovereignty-gold hover:bg-liberation-sovereignty-gold/90 text-black py-3 px-6 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
        >
          Got it, let me vote!
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default VotingOnboardingModal;
