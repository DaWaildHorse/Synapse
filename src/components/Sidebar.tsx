import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Estructura de nuestro historial real
export interface HistoryItem {
  id: string;
  title: string;
  timestamp: number;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Leemos de localStorage cada vez que el menú se abre
  useEffect(() => {
    if (isOpen) {
      const storedHistory = localStorage.getItem('synapse_history');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    }
  }, [isOpen]);

  // Función para agrupar dinámicamente las fechas
  const groupHistory = (items: HistoryItem[]) => {
    const groups: Record<string, HistoryItem[]> = {
      'Today': [],
      'Yesterday': [],
      'Previous': []
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    items.forEach(item => {
      const itemDate = new Date(item.timestamp);
      itemDate.setHours(0, 0, 0, 0);

      if (itemDate.getTime() === today.getTime()) {
        groups['Today'].push(item);
      } else if (itemDate.getTime() === yesterday.getTime()) {
        groups['Yesterday'].push(item);
      } else {
        groups['Previous'].push(item);
      }
    });

    // Limpiar grupos que estén vacíos
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) delete groups[key];
    });

    return groups;
  };

  const groupedHistory = groupHistory(history);

  // Cuando el usuario hace clic en una búsqueda antigua
  const handleHistoryClick = (query: string) => {
    navigate('/results', { state: { query } });
    onClose();
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      
      <aside className={`sidebar-overlay-menu ${isOpen ? 'open' : ''}`}>
        <button className="new-research-btn" onClick={() => { navigate('/'); onClose(); }}>
          <span>+</span> New Research
        </button>
        
        <div className="history-list">
          {Object.keys(groupedHistory).length === 0 ? (
            <p style={{ color: '#B5B5B5', textAlign: 'center', marginTop: '20px' }}>No recent research</p>
          ) : (
            Object.entries(groupedHistory).map(([dateLabel, items]) => (
              <div key={dateLabel} className="history-group">
                <span className="history-date">{dateLabel}</span>
                {items.map((item) => (
                  <button 
                    key={item.id} 
                    className="history-item"
                    onClick={() => handleHistoryClick(item.title)}
                    title={item.title}
                  >
                    {/* Cortamos el texto si es una URL muy larga */}
                    {item.title.length > 28 ? item.title.substring(0, 28) + '...' : item.title}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
        
        <div className="sidebar-footer">
          <div className="sidebar-logo">
            <img src="/app-logo.png" alt="Synapse" />
          </div>
          <span className="sidebar-copyright">Syn<span className="highlight">{'{app}'}</span>se © 2026</span>
        </div>
      </aside>
    </>
  );
}