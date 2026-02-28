import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import GraphBackground from './GraphBackground';
import { analyzeInformation } from '../services/geminiService';
import './ResultsPage.css';
import './HomePage.css';

// --- INTERFACES ---
interface NodeData { id: string; label: string; type: 'claim' | 'source' | 'entity'; confidence?: number; }
interface LinkData { source: string; target: string; type: 'MAKES' | 'SUPPORTS' | 'CONTRADICTS' | 'MENTIONS'; }
interface GraphData { nodes: NodeData[]; links: LinkData[]; }
interface SummaryData { summary: string; details: string; keyFacts: string[]; relatedTopics: string[]; }
interface AnalysisResult { graph: GraphData; analysis: SummaryData; metrics: { veracity: number; agree: number; disagree: number; neutral: number; }; }

const CircularProgress = ({ percentage, label }: { percentage: number, label: string }) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
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

  return (
    <div className="flex flex-col items-center gap-2">
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
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <span className="progress-text font-semibold">{percentage}%</span>
      </div>
      <span className="text-xs text-gray-500 text-center max-w-[80px] leading-tight" style={{ color: '#B5B5B5' }}>{label}</span>
    </div>
  );
};

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [resultData, setResultData] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    const initialQuery = location.state?.query;
    if (initialQuery) {
      executeSearch(initialQuery);
    } else {
      setIsLoading(false);
    }
  }, [location.state]);

  const executeSearch = async (query: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300000)); // 3s delay for animation testing
      const data = await analyzeInformation(query);
      setResultData(data);
    } catch (error) {
      console.error("Falló la llamada a la API", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (message.trim()) {
      executeSearch(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- LÓGICA PARA EXTRAER FUENTES ---
  // Filtramos los nodos que son 'source' y revisamos cómo se conectan al claim principal.
  const getSources = (type: 'SUPPORTS' | 'CONTRADICTS') => {
    if (!resultData) return [];

    // 1. Encontrar los IDs de los enlaces (links) del tipo deseado
    const linksOfType = resultData.graph.links.filter(link => link.type === type);
    const sourceIds = linksOfType.map(link => link.source);

    // 2. Buscar los labels (nombres) de los nodos que coinciden con esos IDs
    return resultData.graph.nodes
      .filter(node => node.type === 'source' && sourceIds.includes(node.id))
      .map(node => node.label);
  };

  const supportingSources = getSources('SUPPORTS');
  const contradictingSources = getSources('CONTRADICTS');

  return (
    <div className="home-container results-container">
      <GraphBackground blurAmount={3} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <header className="header">
        <div className="header-left">
          <button className="icon-btn menu-btn" aria-label="Menu" onClick={() => setIsSidebarOpen(true)}>
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

      <main className="results-main">
        <div className="content-grid">
          
          <section className="summary-section" style={{ zIndex: 1, backgroundColor: 'rgba(255,255,255,0.85)', padding: '20px', borderRadius: '16px', backdropFilter: 'blur(10px)', overflowY: 'auto' }}>
            <h2 className="summary-title">Summary</h2>
            
            {isLoading ? (
              <div className="skeleton-text">
                <div className="skeleton-line w-40" style={{ animationDelay: '0s' }}></div>
                <div className="skeleton-line w-100 mt-lg" style={{ animationDelay: '0.1s' }}></div>
                <div className="skeleton-line w-80" style={{ animationDelay: '0.2s' }}></div>
                <div className="skeleton-line w-80" style={{ animationDelay: '0.3s' }}></div>
                <div className="skeleton-line w-60 mt-lg" style={{ animationDelay: '0.4s' }}></div>
                <div className="skeleton-line w-50" style={{ animationDelay: '0.5s' }}></div>
                <div className="skeleton-line w-40 mt-lg" style={{ animationDelay: '0.6s' }}></div>
                <div className="skeleton-line w-100" style={{ animationDelay: '0.7s' }}></div>
                <div className="skeleton-line w-80" style={{ animationDelay: '0.8s' }}></div>
                <div className="skeleton-line w-60" style={{ animationDelay: '0.9s' }}></div>
                <div className="skeleton-line w-50 mt-lg" style={{ animationDelay: '1s' }}></div>
                <div className="skeleton-line w-80" style={{ animationDelay: '1.1s' }}></div>
                <div className="skeleton-line w-60" style={{ animationDelay: '1.2s' }}></div>
                <div className="skeleton-line w-100 mt-lg" style={{ animationDelay: '1.3s' }}></div>
                <div className="skeleton-line w-50" style={{ animationDelay: '1.4s' }}></div>
              </div>
            ) : resultData ? (
              <div className="real-content flex flex-col gap-6" style={{ color: '#4A4A4A' }}>
                <div>
                  <h3 style={{ color: '#4A9EFF', marginBottom: '8px', fontSize: '1.2rem' }}>Overview</h3>
                  <p>{resultData.analysis.summary}</p>
                </div>
                <div>
                  <h3 style={{ color: '#4A9EFF', marginBottom: '8px', fontSize: '1.2rem' }}>Details</h3>
                  <p>{resultData.analysis.details}</p>
                </div>
                <div>
                  <h3 style={{ color: '#4A9EFF', marginBottom: '8px', fontSize: '1.2rem' }}>Key Facts</h3>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '20px', margin: 0 }}>
                    {resultData.analysis.keyFacts.map((fact, index) => (
                      <li key={index} style={{ marginBottom: '4px' }}>{fact}</li>
                    ))}
                  </ul>
                </div>

                {/* --- NUEVA SECCIÓN DE FUENTES (EXTRAÍDAS DEL GRAFO) --- */}
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <h3 style={{ color: '#10B981', marginBottom: '8px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13l4 4L19 7"></path></svg>
                      Fuentes a favor
                    </h3>
                    {supportingSources.length > 0 ? (
                      <ul style={{ listStyleType: 'disc', paddingLeft: '20px', margin: 0, fontSize: '0.9rem' }}>
                        {supportingSources.map((source, i) => <li key={i}>{source}</li>)}
                      </ul>
                    ) : (
                      <p style={{ fontSize: '0.9rem', color: '#9CA3AF' }}>No se encontraron fuentes de apoyo explícitas.</p>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <h3 style={{ color: '#EF4444', marginBottom: '8px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      Fuentes en contra
                    </h3>
                    {contradictingSources.length > 0 ? (
                      <ul style={{ listStyleType: 'disc', paddingLeft: '20px', margin: 0, fontSize: '0.9rem' }}>
                        {contradictingSources.map((source, i) => <li key={i}>{source}</li>)}
                      </ul>
                    ) : (
                      <p style={{ fontSize: '0.9rem', color: '#9CA3AF' }}>No se encontraron fuentes de contradicción explícitas.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 style={{ color: '#4A9EFF', marginBottom: '8px', fontSize: '1.2rem' }}>Related Topics</h3>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                     {resultData.analysis.relatedTopics.map((topic, index) => (
                       <span key={index} style={{ backgroundColor: '#E0E0E0', padding: '4px 12px', borderRadius: '16px', fontSize: '0.9rem' }}>
                         {topic}
                       </span>
                     ))}
                  </div>
                </div>
              </div>
            ) : <p style={{ color: '#B5B5B5' }}>Sin resultados. Ingresa un enlace abajo.</p>}
          </section>

          <section className="visual-section" style={{ zIndex: 1 }}>
            <div className="metrics-container" style={{ backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', padding: '20px 10px', display: 'flex', justifyContent: 'space-around' }}>
               {isLoading ? (
                  <>
                    <CircularProgress percentage={0} label="Veracity" />
                    <CircularProgress percentage={0} label="Agree" />
                    <CircularProgress percentage={0} label="Disagree" />
                    <CircularProgress percentage={0} label="Neutral" />
                  </>
               ) : resultData ? (
                 <>
                    <CircularProgress percentage={resultData.metrics.veracity} label="Veracity" />
                    <CircularProgress percentage={resultData.metrics.agree} label="Agree" />
                    <CircularProgress percentage={resultData.metrics.disagree} label="Disagree" />
                    <CircularProgress percentage={resultData.metrics.neutral} label="Neutral" />
                 </>
               ) : null}
            </div>

            <div className="graph-container" style={{ backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)' }}>
              <div className="graph-placeholder">
                 <span style={{ color: '#B5B5B5' }}>
                   {isLoading ? 'Analizando información con Syn{app}se...' : 
                    resultData ? `Se extrajeron ${resultData.graph.nodes.length} nodos. [Espacio para renderizar el grafo interactivo]` 
                    : '[Graph Visualization Area]'}
                 </span>
              </div>
            </div>
          </section>
        </div>

        <div className="bottom-input-wrapper">
          <div className="input-container" style={{ maxWidth: '800px', width: '100%', margin: '0 auto', zIndex: 2 }}>
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
        </div>
      </main>
    </div>
  );
}