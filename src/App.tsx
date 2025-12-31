import { useState, useEffect } from 'react';
import { CreatePaste } from './components/CreatePaste';
import { ViewPaste } from './components/ViewPaste';

const API_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : '/api';

function App() {
  const [route, setRoute] = useState<{ type: 'home' } | { type: 'view'; id: string }>({ type: 'home' });

  useEffect(() => {
    const handleRouteChange = () => {
      const path = window.location.pathname;
      const pasteMatch = path.match(/^\/p\/([^/]+)$/);

      if (pasteMatch) {
        setRoute({ type: 'view', id: pasteMatch[1] });
      } else {
        setRoute({ type: 'home' });
      }
    };

    handleRouteChange();

    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  const navigateHome = () => {
    window.history.pushState({}, '', '/');
    setRoute({ type: 'home' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 py-12 px-4">
      {route.type === 'home' ? (
        <CreatePaste apiUrl={API_URL} />
      ) : (
        <ViewPaste pasteId={route.id} apiUrl={API_URL} onBack={navigateHome} />
      )}
    </div>
  );
}

export default App;
