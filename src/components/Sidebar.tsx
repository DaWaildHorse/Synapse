import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Fondo oscuro que permite cerrar el menú al hacer clic afuera */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      
      <aside className={`sidebar-overlay-menu ${isOpen ? 'open' : ''}`}>
        <button className="history-btn">Historial</button>
        <div className="skeleton-list">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton-item sidebar-skeleton" />
          ))}
        </div>
      </aside>
    </>
  );
}