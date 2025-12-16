import React, { useState } from 'react';
import { Send, Loader2, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import type { ArticleCategory } from '@/types/newsroom';
import { submitArticleToIvor } from '@/config/api';

interface SubmitArticleFormProps {
  onClose?: () => void;
}

const SubmitArticleForm: React.FC<SubmitArticleFormProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    excerpt: '',
    category: 'community' as ArticleCategory,
    submittedBy: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [liberationInfo, setLiberationInfo] = useState<{
    score: number;
    autoPublished: boolean;
  } | null>(null);

  const categories: ArticleCategory[] = [
    'liberation',
    'community',
    'politics',
    'culture',
    'economics',
    'health',
    'technology',
    'opinion',
    'analysis',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setLiberationInfo(null);

    try {
      // Submit through IVOR Core API (Liberation Layer 3)
      const result = await submitArticleToIvor({
        title: formData.title,
        url: formData.url,
        excerpt: formData.excerpt,
        category: formData.category,
        submittedBy: formData.submittedBy || 'anonymous',
      });

      if (result.success) {
        setSubmitStatus('success');

        // Store liberation info for display
        if (result.liberation) {
          setLiberationInfo({
            score: result.liberation.score,
            autoPublished: result.liberation.autoPublished,
          });
        }

        setFormData({
          title: '',
          url: '',
          excerpt: '',
          category: 'community',
          submittedBy: '',
        });

        // Auto-close after success (longer if auto-published to show celebration)
        setTimeout(() => {
          if (onClose) onClose();
        }, result.liberation?.autoPublished ? 3000 : 2000);
      } else {
        setSubmitStatus('error');
        setErrorMessage(result.message || 'Submission failed');
      }
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-black border-2 border-liberation-gold-divine p-6 rounded-lg">
      <h3 className="text-2xl font-bold text-liberation-gold-divine mb-4">
        Submit a Story
      </h3>
      <p className="text-gray-300 mb-6">
        Share news, articles, or stories that matter to our community. All submissions go through moderation.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
            Article Title *
          </label>
          <input
            id="title"
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:border-liberation-gold-divine"
            placeholder="Enter article title"
          />
        </div>

        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-1">
            Article URL *
          </label>
          <input
            id="url"
            type="url"
            required
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:border-liberation-gold-divine"
            placeholder="https://example.com/article"
          />
        </div>

        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium text-gray-300 mb-1">
            Brief Summary
          </label>
          <textarea
            id="excerpt"
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:border-liberation-gold-divine"
            rows={3}
            placeholder="Brief description of the article (optional)"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">
            Category
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as ArticleCategory })}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:border-liberation-gold-divine capitalize"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat} className="capitalize">
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="submittedBy" className="block text-sm font-medium text-gray-300 mb-1">
            Your Name (optional)
          </label>
          <input
            id="submittedBy"
            type="text"
            value={formData.submittedBy}
            onChange={(e) => setFormData({ ...formData, submittedBy: e.target.value })}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:border-liberation-gold-divine"
            placeholder="Anonymous"
          />
        </div>

        {submitStatus === 'success' && (
          <div className="flex flex-col gap-2 p-3 bg-liberation-healing-green/20 border border-liberation-healing-green rounded-md">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-liberation-healing-green" />
              <p className="text-liberation-healing-green font-semibold">
                {liberationInfo?.autoPublished
                  ? '🏴‍☠️ Article auto-published! (Liberation-compliant)'
                  : 'Article submitted for moderation!'}
              </p>
            </div>
            {liberationInfo && (
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Shield className="w-4 h-4" />
                <span>Liberation Score: {Math.round(liberationInfo.score * 100)}%</span>
              </div>
            )}
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="flex items-center gap-2 p-3 bg-liberation-resistance-red/20 border border-liberation-resistance-red rounded-md">
            <AlertCircle className="w-5 h-5 text-liberation-resistance-red" />
            <p className="text-liberation-resistance-red">{errorMessage}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-liberation-gold-divine text-black font-semibold rounded-md hover:bg-liberation-sovereignty-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Article
              </>
            )}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-700 text-gray-300 font-semibold rounded-md hover:bg-gray-900 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default SubmitArticleForm;
