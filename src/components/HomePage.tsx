import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import './HomePage.css';
import GraphBackground from './GraphBackground';

export default function HomePage() {
  const [message, setMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleSend = () => {
    if (message.trim()) {
      console.log('Sending:', message);
      // Pasamos la búsqueda a la vista de resultados
      navigate('/results', { state: { query: message.trim() } });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="home-container">
      <GraphBackground />
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
          <div className="app-logo">
            <img src="/app-logo.png" alt="App Logo" />
          </div>
        </div>
      </header>

      <main className="main-content">
        <h1 className="main-title"><span>Welcome to Syn</span><span className="highlight">{' {app} '}</span><span>se!</span></h1>
        <p className="subtitle">Less noise, more truth</p>

        <div className="input-container">
          <textarea
            className="message-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
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
      </main>
      
      <footer className="home-footer">
        <span>Syn<span className="highlight">{'{app}'}</span>se © 2025</span>
      </footer>
    </div>
  );
}