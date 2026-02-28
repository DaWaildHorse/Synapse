import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import './HomePage.css';
import GraphBackground from './GraphBackground';

export default function HomePage() {
  const [message, setMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [maxConnections, setMaxConnections] = useState(0);
  const [won, setWon] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const navigate = useNavigate();

  const handleConnectionChange = (max: number) => {
    setMaxConnections(max);
    if (max >= 50 && !won) {
      setWon(true);
      setShowCongrats(true);
    }
  };

  const isValidUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  // Función auxiliar para guardar en caché
  const saveToHistory = (query: string) => {
  const stored = localStorage.getItem('synapse_history');
  let history = stored ? JSON.parse(stored) : [];

  // Evitamos guardar búsquedas vacías o exactamente iguales a la última
  if (!query || (history.length > 0 && history[0].title === query)) return;

  const newItem = {
    id: Date.now().toString(),
    title: query,
    timestamp: Date.now()
  };

  history.unshift(newItem); // Colocamos la búsqueda más reciente al inicio
  localStorage.setItem('synapse_history', JSON.stringify(history));
};

  const handleSend = () => {
      if (!message.trim()) return;
      if (!isValidUrl(message.trim())) {
          setError('Please enter a valid URL');
          setShake(true);
          setTimeout(() => setShake(false), 400);
          return;
      }
      setError('');
      console.log('Sending:', message);
      saveToHistory(message.trim());
      setMessage('');
      const query = message.trim();
      setIsExiting(true);
      setTimeout(() => {
          navigate('/results', {state: {query}});
      }, 500);
  };

    const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="home-container">
      <GraphBackground onMaxConnectionsChange={handleConnectionChange} nodeCount={won ? 300 : 100} />
      <div className="graph-stat">{maxConnections}</div>
      {showCongrats && (
        <div className="congrats-message" onClick={() => setShowCongrats(false)}>
          🎉 Congratulations! You reached 50 connections!
          <span className="dismiss-hint">Click to dismiss</span>
        </div>
      )}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <header className="header">
        <div className="header-left">
          <button
            className="icon-btn menu-btn"
            aria-label="Menu"
            onClick={() => setIsSidebarOpen(true)}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4A9EFF" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="app-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <img src="/app-logo.png" alt="App Logo" />
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className={`hero-content${isExiting ? ' exiting' : ''}`}>
          <h1 className="main-title"><span>Welcome to Syn</span><span className="highlight">{' {app} '}</span><span>se!</span></h1>
          <p className="subtitle">Less noise, more truth</p>
        </div>

        <div className={`input-container${shake ? ' shake' : ''}${isExiting ? ' to-bottom' : ''}`}>
          <textarea
            className="message-input"
            value={message}
            onChange={(e) => { setMessage(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="Paste here your url..."
            rows={1}
          />
          <div className="input-actions">
            <button className="icon-btn" aria-label="Voice input">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
            <button className="icon-btn send-btn" onClick={handleSend} aria-label="Send message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
        {error && !isExiting && <p className="error-message">{error}</p>}
      </main>
      
      <footer className="home-footer">
        <span>Syn<span className="highlight">{'{app}'}</span>se © 2025</span>
      </footer>
    </div>
  );
}