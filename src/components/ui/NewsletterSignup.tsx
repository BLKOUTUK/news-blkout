import React, { useState } from 'react';
import { Mail, Check, AlertCircle, Share2 } from 'lucide-react';

// CRM API endpoint - unified signup across all BLKOUT apps (UK-hosted)
const CRM_API_URL = process.env.NEXT_PUBLIC_CRM_API_URL || 'https://crm.blkoutuk.cloud';

interface SignupResponse {
  success: boolean;
  message: string;
  referralCode?: string;
  shareUrl?: string;
}

const NewsletterSignup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<SignupResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      // Call unified CRM API instead of local endpoint
      const response = await fetch(`${CRM_API_URL}/api/community/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName: firstName || undefined,
          subscriptions: {
            newsletter: true,
            events: false,
            blkouthub: false,
            volunteer: false,
          },
          consentGiven: true,
          source: 'news_blkout',
          sourceUrl: window.location.href,
        }),
      });

      const data: SignupResponse = await response.json();

      if (data.success) {
        setStatus('success');
        setResult(data);
        setEmail('');
        setFirstName('');
      } else {
        setStatus('error');
        setResult(data);
      }
    } catch (error) {
      setStatus('error');
      setResult({ success: false, message: 'Failed to subscribe. Please try again.' });
    }
  };

  const handleCopyShareLink = () => {
    if (result?.shareUrl) {
      navigator.clipboard.writeText(result.shareUrl);
    }
  };

  if (status === 'success' && result) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-16 h-16 bg-liberation-healing-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-liberation-healing-green" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to the Community!</h2>
        <p className="text-gray-400 mb-6">{result.message}</p>

        {/* Share section */}
        {result.shareUrl && (
          <div className="bg-white/5 rounded-lg p-4 text-left">
            <div className="flex items-center gap-2 text-liberation-sovereignty-gold mb-3">
              <Share2 className="h-4 w-4" />
              <span className="text-sm font-medium">Invite friends to join</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={result.shareUrl}
                className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-gray-300"
              />
              <button
                onClick={handleCopyShareLink}
                className="bg-liberation-sovereignty-gold hover:bg-liberation-sovereignty-gold/80 text-black px-4 py-2 rounded text-sm font-medium"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto text-center">
      <Mail className="h-12 w-12 text-liberation-sovereignty-gold mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-white mb-4">
        Stay Informed with Our <span className="text-liberation-sovereignty-gold">Weekly Digest</span>
      </h2>
      <p className="text-gray-400 mb-6">
        Get the top community-curated stories delivered to your inbox every week.
      </p>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-3">
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First name (optional)"
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-liberation-sovereignty-gold"
          disabled={status === 'loading'}
        />
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            required
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-liberation-sovereignty-gold"
            disabled={status === 'loading'}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="bg-liberation-sovereignty-gold hover:bg-liberation-sovereignty-gold/90 text-black px-6 py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
          </button>
        </div>

        {status === 'error' && result && (
          <div className="mt-4 p-3 rounded-lg flex items-center gap-2 text-sm bg-liberation-resistance-red/20 text-liberation-resistance-red">
            <AlertCircle className="h-4 w-4" />
            <span>{result.message}</span>
          </div>
        )}
      </form>

      <p className="text-xs text-gray-500 mt-4">
        We store your data securely on UK servers. You can unsubscribe or delete your data anytime.{' '}
        <a href="https://blkoutuk.com/privacy" className="text-liberation-healing-green hover:underline">
          Privacy Policy
        </a>
      </p>
    </div>
  );
};

export default NewsletterSignup;
