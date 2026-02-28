import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockHistory = [
  { id: 1, title: 'Machine Learning basics', date: 'Today' },
  { id: 2, title: 'React hooks deep dive', date: 'Today' },
  { id: 3, title: 'AWS Lambda optimization', date: 'Yesterday' },
  { id: 4, title: 'GraphQL vs REST APIs', date: 'Yesterday' },
  { id: 5, title: 'Docker containerization', date: 'Last 7 days' },
  { id: 6, title: 'TypeScript best practices', date: 'Last 7 days' },
  { id: 7, title: 'Neural networks intro', date: 'Last 7 days' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const groupedHistory = mockHistory.reduce((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {} as Record<string, typeof mockHistory>);

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      
      <aside className={`sidebar-overlay-menu ${isOpen ? 'open' : ''}`}>
        <button className="new-research-btn" onClick={() => { navigate('/'); onClose(); }}>
          <span>+</span> New Research
        </button>
        
        <div className="history-list">
          {Object.entries(groupedHistory).map(([date, items]) => (
            <div key={date} className="history-group">
              <span className="history-date">{date}</span>
              {items.map((item) => (
                <button key={item.id} className="history-item">
                  {item.title}
                </button>
              ))}
            </div>
          ))}
        </div>
        
        <div className="sidebar-footer">
          <div className="sidebar-logo">
            <img src="/app-logo.png" alt="Synapse" />
          </div>
          <span className="sidebar-copyright">Syn<span className="highlight">{'{app}'}</span>se © 2025</span>
        </div>
      </aside>
    </>
  );
}