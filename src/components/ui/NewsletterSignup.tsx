import React, { useState } from 'react';
import { Mail, Check, AlertCircle } from 'lucide-react';

const NewsletterSignup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, frequency: 'weekly' }),
      });

      if (response.ok) {
        setStatus('success');
        setMessage('Successfully subscribed! Check your email for confirmation.');
        setEmail('');
      } else {
        setStatus('error');
        setMessage('Failed to subscribe. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Failed to subscribe. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto text-center">
      <Mail className="h-12 w-12 text-liberation-sovereignty-gold mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-white mb-4">
        Stay Informed with Our <span className="text-liberation-sovereignty-gold">Weekly Digest</span>
      </h2>
      <p className="text-gray-400 mb-6">
        Get the top community-curated stories delivered to your inbox every week.
      </p>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            required
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-liberation-sovereignty-gold"
            disabled={status === 'loading' || status === 'success'}
          />
          <button
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            className="bg-liberation-sovereignty-gold hover:bg-liberation-sovereignty-gold/90 text-black px-6 py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Subscribing...' : status === 'success' ? 'Subscribed!' : 'Subscribe'}
          </button>
        </div>

        {message && (
          <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
            status === 'success' ? 'bg-liberation-healing-green/20 text-liberation-healing-green' :
            'bg-liberation-resistance-red/20 text-liberation-resistance-red'
          }`}>
            {status === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{message}</span>
          </div>
        )}
      </form>

      <p className="text-xs text-gray-500 mt-4">
        We respect your privacy. Unsubscribe anytime. No spam, ever.
      </p>
    </div>
  );
};

export default NewsletterSignup;
