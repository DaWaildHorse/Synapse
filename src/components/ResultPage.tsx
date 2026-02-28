import { useState } from 'react';
import './ResultsPage.css';

// Componente auxiliar para los anillos de progreso
const CircularProgress = ({ percentage }: { percentage: number }) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="progress-ring-container">
      <svg className="progress-ring" width="60" height="60">
        <circle stroke="#E0E0E0" strokeWidth="4" fill="transparent" r={radius} cx="30" cy="30" />
        <circle
          stroke="#4A9EFF"
          strokeWidth="4"
          fill="transparent"
          r={radius}
          cx="30"
          cy="30"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <span className="progress-text">{percentage}%</span>
    </div>
  );
};

export default function ResultsPage() {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      console.log('Searching new URL:', message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="results-container">
      {/* Sidebar Historial */}
      <aside className="sidebar">
        <button className="history-btn">Historial</button>
        <div className="skeleton-list">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton-item sidebar-skeleton" />
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="results-main">
        {/* Logo Header */}
        <header className="results-header">
          <div className="app-logo-small">
            <img src="/app-logo.png" alt="App Logo" />
          </div>
        </header>

        <div className="content-grid">
          {/* Left Column: Summary */}
          <section className="summary-section">
            <h2 className="summary-title">Summary</h2>
            <div className="skeleton-text">
              <div className="skeleton-line w-40"></div>
              <div className="skeleton-line w-100 mt-lg"></div>
              <div className="skeleton-line w-80"></div>
              <div className="skeleton-line w-80"></div>
              <div className="skeleton-line w-60 mt-lg"></div>
              <div className="skeleton-line w-50"></div>
              <div className="skeleton-line w-100 mt-lg"></div>
              <div className="skeleton-line w-60"></div>
              <div className="skeleton-line w-100 mt-lg"></div>
              <div className="skeleton-line w-40"></div>
              <div className="skeleton-line w-100 mt-lg"></div>
              <div className="skeleton-line w-100"></div>
            </div>
          </section>

          {/* Right Column: Metrics & Graph */}
          <section className="visual-section">
            <div className="metrics-container">
              <CircularProgress percentage={20} />
              <CircularProgress percentage={40} />
              <CircularProgress percentage={12} />
              <CircularProgress percentage={90} />
            </div>

            <div className="graph-container">
              {/* Aquí irá tu canvas del grafo de nodos */}
              <div className="graph-placeholder">
                 <span style={{ color: '#B5B5B5' }}>[Graph Visualization Area]</span>
              </div>
            </div>
          </section>
        </div>

        {/* Bottom Search Input */}
        <div className="bottom-input-wrapper">
          <div className="input-container results-input-container">
            <input
              type="text"
              className="message-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="| Paste here your url"
            />
            <div className="input-actions">
              <button className="icon-btn send-btn" onClick={handleSend} aria-label="Send message">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}