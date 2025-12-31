import { useState, useEffect } from 'react';
import { FileText, Clock, Eye, AlertCircle } from 'lucide-react';

interface ViewPasteProps {
  pasteId: string;
  apiUrl: string;
  onBack: () => void;
}

interface PasteData {
  content: string;
  remaining_views: number | null;
  expires_at: string | null;
}

export function ViewPaste({ pasteId, apiUrl, onBack }: ViewPasteProps) {
  const [paste, setPaste] = useState<PasteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPaste = async () => {
      try {
        const response = await fetch(`${apiUrl}/fetch-paste/${pasteId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch paste');
        }

        setPaste(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPaste();
  }, [pasteId, apiUrl]);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading paste...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h2 className="text-2xl font-semibold text-gray-800">Paste Not Found</h2>
          </div>

          <p className="text-gray-600 mb-6">{error}</p>

          <button
            onClick={onBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create New Paste
          </button>
        </div>
      </div>
    );
  }

  if (!paste) {
    return null;
  }

  const formatExpiration = (expiresAt: string | null) => {
    if (!expiresAt) return 'Never';
    const date = new Date(expiresAt);
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff < 0) return 'Expired';

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `${seconds} second${seconds > 1 ? 's' : ''}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-7 h-7" />
            <h1 className="text-2xl font-bold">Paste</h1>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            {paste.expires_at && (
              <div className="flex items-center gap-2 bg-blue-500 bg-opacity-50 px-3 py-1.5 rounded-lg">
                <Clock className="w-4 h-4" />
                <span>Expires in: {formatExpiration(paste.expires_at)}</span>
              </div>
            )}

            {paste.remaining_views !== null && (
              <div className="flex items-center gap-2 bg-blue-500 bg-opacity-50 px-3 py-1.5 rounded-lg">
                <Eye className="w-4 h-4" />
                <span>Remaining views: {paste.remaining_views}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto border border-gray-200">
              <code className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                {paste.content}
              </code>
            </pre>
          </div>

          <button
            onClick={onBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create New Paste
          </button>
        </div>
      </div>
    </div>
  );
}
