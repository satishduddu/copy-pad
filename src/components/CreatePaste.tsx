import { useState } from 'react';
import { LinkIcon, Copy, Check } from 'lucide-react';

interface CreatePasteProps {
  apiUrl: string;
}

export function CreatePaste({ apiUrl }: CreatePasteProps) {
  const [content, setContent] = useState('');
  const [ttlSeconds, setTtlSeconds] = useState('');
  const [maxViews, setMaxViews] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pasteUrl, setPasteUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPasteUrl('');
    setLoading(true);

    try {
      const body: {
        content: string;
        ttl_seconds?: number;
        max_views?: number;
      } = { content };

      if (ttlSeconds) {
        const ttl = parseInt(ttlSeconds);
        if (isNaN(ttl) || ttl < 1) {
          throw new Error('TTL must be a positive integer');
        }
        body.ttl_seconds = ttl;
      }

      if (maxViews) {
        const views = parseInt(maxViews);
        if (isNaN(views) || views < 1) {
          throw new Error('Max views must be a positive integer');
        }
        body.max_views = views;
      }

      const response = await fetch(`${apiUrl}/create-paste`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create paste');
      }

      setPasteUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pasteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleReset = () => {
    setContent('');
    setTtlSeconds('');
    setMaxViews('');
    setPasteUrl('');
    setError('');
  };

  if (pasteUrl) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center gap-3 mb-6">
            <LinkIcon className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-semibold text-gray-800">Paste Created!</h2>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share this URL:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={pasteUrl}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-mono text-sm"
              />
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Create Another Paste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Create a Paste</h1>
        <p className="text-gray-600 mb-6">Share text snippets with optional expiration</p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              placeholder="Enter your text here..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="ttl" className="block text-sm font-medium text-gray-700 mb-2">
                Expire After (seconds)
              </label>
              <input
                id="ttl"
                type="number"
                min="1"
                value={ttlSeconds}
                onChange={(e) => setTtlSeconds(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional"
              />
            </div>

            <div>
              <label htmlFor="maxViews" className="block text-sm font-medium text-gray-700 mb-2">
                Max Views
              </label>
              <input
                id="maxViews"
                type="number"
                min="1"
                value={maxViews}
                onChange={(e) => setMaxViews(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Creating...' : 'Create Paste'}
          </button>
        </form>
      </div>
    </div>
  );
}
