import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import GraphBackground from './GraphBackground';
import LoadingGraphAnimation from './LoadingGraphAnimation';
import { analyzeInformation } from '../services/geminiService';
import { getNodeDetail } from '../Graph/services/GeminiGraphService';
import Graph from '../Graph/components/Graph';
import type { GraphNode } from '../Graph/types/graph';
import type { NodeDetail } from '../Graph/services/GeminiGraphService';
import './ResultsPage.css';
import './HomePage.css';

// ── Types ──────────────────────────────────────────────────────────────────────

interface NodeData    { id: string; label: string; type: 'claim' | 'source' | 'entity'; confidence?: number; }
interface LinkData    { source: string; target: string; type: 'MAKES' | 'SUPPORTS' | 'CONTRADICTS' | 'MENTIONS'; }
interface GraphData   { nodes: NodeData[]; links: LinkData[]; }
interface SummaryData { summary: string; details: string; keyFacts: string[]; relatedTopics: string[]; }
interface AnalysisResult {
  graph: GraphData;
  analysis: SummaryData;
  metrics: { veracity: number; agree: number; disagree: number; neutral: number; };
}

type LeftPanel = 'analysis' | 'node';

const TYPE_COLOR: Record<string, string> = {
  claim:  '#3b82f6',
  source: '#10b981',
  entity: '#f59e0b',
};

// ── localStorage helpers ───────────────────────────────────────────────────────

function loadJSON<T>(key: string): T | null {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) as T : null; }
  catch { return null; }
}
function saveJSON(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* full */ }
}
function storageKeys(query: string) {
  const q = query.slice(0, 80); // keep keys short
  return {
    result:  `synapse:result:${q}`,
    details: `synapse:details:${q}`,
    notes:   `synapse:notes:${q}`,
  };
}
function saveToHistory(query: string) {
  const stored = localStorage.getItem('synapse_history');
  const history = stored ? JSON.parse(stored) : [];
  if (!query || (history.length > 0 && history[0].title === query)) return;
  history.unshift({ id: Date.now().toString(), title: query, timestamp: Date.now() });
  localStorage.setItem('synapse_history', JSON.stringify(history));
}

// ── CircularProgress ───────────────────────────────────────────────────────────

const CircularProgress = ({ percentage, label }: { percentage: number; label: string }) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="progress-ring-container">
        <svg className="progress-ring" width="60" height="60">
          <circle stroke="#E0E0E0" strokeWidth="4" fill="transparent" r={radius} cx="30" cy="30" />
          <circle
            stroke="#4A9EFF" strokeWidth="4" fill="transparent" r={radius} cx="30" cy="30"
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <span className="progress-text font-semibold">{percentage}%</span>
      </div>
      <span className="text-xs text-center max-w-[80px] leading-tight" style={{ color: '#B5B5B5' }}>{label}</span>
    </div>
  );
};
// ── Main component ────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const location  = useLocation();
  const navigate  = useNavigate();

  const [message,       setMessage]       = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading,     setIsLoading]     = useState(true);
  const [resultData,    setResultData]    = useState<AnalysisResult | null>(null);
  const [currentQuery,  setCurrentQuery]  = useState('');

  // ── Left panel state ───────────────────────────────────────────────────────
  const [leftPanel,     setLeftPanel]     = useState<LeftPanel>('analysis');
  const [selectedNode,  setSelectedNode]  = useState<GraphNode | null>(null);
  const [nodeDetail,    setNodeDetail]    = useState<NodeDetail | null>(null);
  const [nodeLoading,   setNodeLoading]   = useState(false);
  const [nodeError,     setNodeError]     = useState<string | null>(null);
  const [noteFocused,   setNoteFocused]   = useState(false);
  const [notes,         setNotes]         = useState<Record<string, string>>({});

  const detailCache = useRef<Map<string, NodeDetail>>(new Map());
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [graphSize, setGraphSize] = useState({ width: 500, height: 400 });

  // Measure graph container
  useEffect(() => {
    const el = graphContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setGraphSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Run search ─────────────────────────────────────────────────────────────

  const executeSearch = async (query: string) => {
    setCurrentQuery(query);
    setIsLoading(true);
    setLeftPanel('analysis');
    setSelectedNode(null);
    setNodeDetail(null);

    const keys = storageKeys(query);

    // Load persisted result if available
    const cached = loadJSON<AnalysisResult>(keys.result);
    if (cached) {
      setResultData(cached);
      setNotes(loadJSON<Record<string, string>>(keys.notes) ?? {});
      detailCache.current = new Map(
        Object.entries(loadJSON<Record<string, NodeDetail>>(keys.details) ?? {})
      );
      setIsLoading(false);
      return;
    }

    try {
      const data = await analyzeInformation(query);
      setResultData(data);
      saveJSON(keys.result, data);
      saveToHistory(query);
      setNotes({});
      detailCache.current.clear();
    } catch (err) {
      console.error('API call failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initialQuery = location.state?.query;
    if (initialQuery) executeSearch(initialQuery);
    else setIsLoading(false);
  }, [location.state]);

  // Persist notes on change
  useEffect(() => {
    if (!currentQuery) return;
    saveJSON(storageKeys(currentQuery).notes, notes);
  }, [notes, currentQuery]);

  // ── Node click ─────────────────────────────────────────────────────────────

  const handleNodeClick = async (node: GraphNode) => {
    setSelectedNode(node);
    setLeftPanel('node');
    setNodeError(null);

    if (detailCache.current.has(node.id)) {
      setNodeDetail(detailCache.current.get(node.id)!);
      return;
    }

    setNodeDetail(null);
    setNodeLoading(true);
    try {
      const d = await getNodeDetail(node.label, node.type, currentQuery);
      detailCache.current.set(node.id, d);
      saveJSON(storageKeys(currentQuery).details, Object.fromEntries(detailCache.current));
      setNodeDetail(d);
    } catch (err) {
      setNodeError(err instanceof Error ? err.message : String(err));
    } finally {
      setNodeLoading(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const getSources = (type: 'SUPPORTS' | 'CONTRADICTS') => {
    if (!resultData) return [];
    const ids = new Set(resultData.graph.links.filter(l => l.type === type).map(l => l.source));
    return resultData.graph.nodes.filter(n => n.type === 'source' && ids.has(n.id)).map(n => n.label);
  };
  const supportingSources    = getSources('SUPPORTS');
  const contradictingSources = getSources('CONTRADICTS');

  const handleSend = () => {
    if (message.trim()) { executeSearch(message.trim()); setMessage(''); }
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const currentNote = selectedNode ? (notes[selectedNode.id] ?? '') : '';
  const wordCount   = currentNote.trim() === '' ? 0 : currentNote.trim().split(/\s+/).length;

  // Cast graph data to Graph component types (structurally identical)
  const graphNodes = (resultData?.graph.nodes ?? []) as unknown as GraphNode[];
  const graphLinks = resultData?.graph.links ?? [];

  // ── Render ─────────────────────────────────────────────────────────────────

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

          {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
          <section
            className="summary-section"
            style={{ zIndex: 1, backgroundColor: 'rgba(255,255,255,0.1)', padding: '0', borderRadius: '16px', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            {/* Tab bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                onClick={() => setLeftPanel('analysis')}
                style={{
                  flex: 1, padding: '12px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  background: leftPanel === 'analysis' ? 'rgba(74,158,255,0.15)' : 'transparent',
                  color: leftPanel === 'analysis' ? '#4A9EFF' : '#9CA3AF',
                  borderBottom: leftPanel === 'analysis' ? '2px solid #4A9EFF' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                Analysis
              </button>
              <button
                onClick={() => selectedNode && setLeftPanel('node')}
                style={{
                  flex: 1, padding: '12px', border: 'none', cursor: selectedNode ? 'pointer' : 'default', fontSize: 13, fontWeight: 600,
                  background: leftPanel === 'node' ? 'rgba(74,158,255,0.15)' : 'transparent',
                  color: leftPanel === 'node' ? '#4A9EFF' : selectedNode ? '#9CA3AF' : '#4A4A4A',
                  borderBottom: leftPanel === 'node' ? '2px solid #4A9EFF' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                {selectedNode ? selectedNode.label : 'Node Detail'}
              </button>
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

              {/* ── ANALYSIS TAB ── */}
              {leftPanel === 'analysis' && (
                <>
                  <h2 className="summary-title">{isLoading ? 'Searching...' : 'Summary'}</h2>
                  {isLoading ? (
                    <div className="skeleton-text">
                      {[0,.1,.2,.3,.4,.5,.6,.7,.8,.9,1,1.1,1.2,1.3,1.4].map((d,i) => (
                        <div key={i} className={`skeleton-line ${['w-40','w-100','w-80','w-80','w-60','w-50','w-40','w-100','w-80','w-60','w-50','w-80','w-60','w-100','w-50'][i]} ${i>0?'mt-lg':''}`} style={{ animationDelay: `${d}s` }} />
                      ))}
                    </div>
                  ) : resultData ? (
                    <div className="real-content flex flex-col gap-6" style={{ color: '#4A4A4A' }}>
                      <div>
                        <h3 style={{ color: '#4A9EFF', marginBottom: 8, fontSize: '1.2rem' }}>Overview</h3>
                        <p>{resultData.analysis.summary}</p>
                      </div>
                      <div>
                        <h3 style={{ color: '#4A9EFF', marginBottom: 8, fontSize: '1.2rem' }}>Details</h3>
                        <p>{resultData.analysis.details}</p>
                      </div>
                      <div>
                        <h3 style={{ color: '#4A9EFF', marginBottom: 8, fontSize: '1.2rem' }}>Key Facts</h3>
                        <ul style={{ listStyleType: 'disc', paddingLeft: 20, margin: 0 }}>
                          {resultData.analysis.keyFacts.map((f, i) => <li key={i} style={{ marginBottom: 4 }}>{f}</li>)}
                        </ul>
                      </div>
                      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <h3 style={{ color: '#10B981', marginBottom: 8, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13l4 4L19 7" /></svg>
                            Supporting Sources
                          </h3>
                          {supportingSources.length > 0
                            ? <ul style={{ listStyleType: 'disc', paddingLeft: 20, margin: 0, fontSize: '0.9rem' }}>{supportingSources.map((s,i) => <li key={i}>{s}</li>)}</ul>
                            : <p style={{ fontSize: '0.9rem', color: '#9CA3AF' }}>No supporting sources found.</p>}
                        </div>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <h3 style={{ color: '#EF4444', marginBottom: 8, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            Contradicting Sources
                          </h3>
                          {contradictingSources.length > 0
                            ? <ul style={{ listStyleType: 'disc', paddingLeft: 20, margin: 0, fontSize: '0.9rem' }}>{contradictingSources.map((s,i) => <li key={i}>{s}</li>)}</ul>
                            : <p style={{ fontSize: '0.9rem', color: '#9CA3AF' }}>No contradicting sources found.</p>}
                        </div>
                      </div>
                      <div>
                        <h3 style={{ color: '#4A9EFF', marginBottom: 8, fontSize: '1.2rem' }}>Related Topics</h3>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {resultData.analysis.relatedTopics.map((t, i) => (
                            <span key={i} style={{ backgroundColor: '#E0E0E0', padding: '4px 12px', borderRadius: 16, fontSize: '0.9rem' }}>{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: '#B5B5B5' }}>No results. Enter a URL or topic below.</p>
                  )}
                </>
              )}

              {/* ── NODE DETAIL TAB ── */}
              {leftPanel === 'node' && selectedNode && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', flexShrink: 0, background: TYPE_COLOR[selectedNode.type] ?? '#999', display: 'inline-block' }} />
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#4A4A4A' }}>{selectedNode.label}</h2>
                    <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', borderRadius: 16, padding: '4px 12px', color: TYPE_COLOR[selectedNode.type] ?? '#999', background: 'rgba(74,158,255,0.1)' }}>
                      {selectedNode.type}
                    </span>
                  </div>

                  {/* Confidence bar */}
                  {selectedNode.type === 'claim' && selectedNode.confidence !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: '#B5B5B5' }}>Confidence</span>
                      <div style={{ flex: 1, height: 6, background: '#E0E0E0', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 999,
                          width: `${Math.round(selectedNode.confidence * 100)}%`,
                          background: selectedNode.confidence > 0.66 ? '#10B981' : selectedNode.confidence > 0.33 ? '#f59e0b' : '#EF4444',
                        }} />
                      </div>
                      <span style={{ fontSize: 12, color: '#B5B5B5', minWidth: 32 }}>{Math.round(selectedNode.confidence * 100)}%</span>
                    </div>
                  )}

                  {/* Loading */}
                  {nodeLoading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #E0E0E0', borderTopColor: '#4A9EFF', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                      <span style={{ fontSize: 14, color: '#B5B5B5' }}>Fetching details…</span>
                      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                  )}

                  {/* Error */}
                  {nodeError && (
                    <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)' }}>
                      <p style={{ margin: 0, fontSize: 14, color: '#EF4444' }}>{nodeError}</p>
                    </div>
                  )}

                  {/* Detail content */}
                  {nodeDetail && (
                    <>
                      <div>
                        <h3 style={{ color: '#4A9EFF', marginBottom: 8, fontSize: '1.2rem' }}>Summary</h3>
                        <p style={{ margin: 0, color: '#4A4A4A' }}>{nodeDetail.summary}</p>
                      </div>
                      <div>
                        <h3 style={{ color: '#4A9EFF', marginBottom: 8, fontSize: '1.2rem' }}>Details</h3>
                        <p style={{ margin: 0, color: '#4A4A4A' }}>{nodeDetail.details}</p>
                      </div>
                      <div>
                        <h3 style={{ color: '#4A9EFF', marginBottom: 8, fontSize: '1.2rem' }}>Key Facts</h3>
                        <ul style={{ listStyleType: 'disc', paddingLeft: 20, margin: 0, color: '#4A4A4A' }}>
                          {nodeDetail.keyFacts.map((f, i) => <li key={i} style={{ marginBottom: 4 }}>{f}</li>)}
                        </ul>
                      </div>
                      <div>
                        <h3 style={{ color: '#4A9EFF', marginBottom: 8, fontSize: '1.2rem' }}>Related Topics</h3>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {nodeDetail.relatedTopics.map((t, i) => (
                            <span key={i} style={{ backgroundColor: '#E0E0E0', padding: '4px 12px', borderRadius: 16, fontSize: '0.9rem' }}>{t}</span>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Personal Notes */}
                  <div>
                    <h3 style={{ color: '#4A9EFF', marginBottom: 8, fontSize: '1.2rem' }}>My Notes</h3>
                    <div style={{
                      borderRadius: 12,
                      border: noteFocused ? '2px solid #4A9EFF' : '2px solid #E0E0E0',
                      background: 'rgba(255,255,255,0.5)',
                      transition: 'border-color 0.15s',
                      overflow: 'hidden',
                    }}>
                      <textarea
                        value={currentNote}
                        onChange={(e) => setNotes(prev => ({ ...prev, [selectedNode.id]: e.target.value }))}
                        onFocus={() => setNoteFocused(true)}
                        onBlur={() => setNoteFocused(false)}
                        placeholder="Write your thoughts on this node…"
                        rows={4}
                        style={{
                          width: '100%', background: 'transparent', border: 'none', outline: 'none',
                          resize: 'none', padding: '14px 16px', boxSizing: 'border-box',
                          color: '#4A4A4A', fontSize: 14, lineHeight: 1.7, fontFamily: 'inherit',
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 14px 10px' }}>
                        <span style={{ fontSize: 12, color: '#B5B5B5' }}>
                          {wordCount > 0 ? `${wordCount} word${wordCount === 1 ? '' : 's'}` : ''}
                        </span>
                        {currentNote.trim() !== '' && (
                          <button
                            onClick={() => setNotes(prev => ({ ...prev, [selectedNode.id]: '' }))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12, color: '#B5B5B5' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#B5B5B5')}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </section>

          {/* ── RIGHT PANEL ─────────────────────────────────────────────────── */}
          <section className="visual-section" style={{ zIndex: 1 }}>

            {/* Metrics */}
            <div className="metrics-container" style={{ backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', padding: '20px 10px', display: 'flex', justifyContent: 'space-around' }}>
              {isLoading ? (
                ['Veracity','Agree','Disagree','Neutral'].map(l => <CircularProgress key={l} percentage={0} label={l} />)
              ) : resultData ? (
                <>
                  <CircularProgress percentage={resultData.metrics.veracity}  label="Veracity"  />
                  <CircularProgress percentage={resultData.metrics.agree}     label="Agree"     />
                  <CircularProgress percentage={resultData.metrics.disagree}  label="Disagree"  />
                  <CircularProgress percentage={resultData.metrics.neutral}   label="Neutral"   />
                </>
              ) : null}
            </div>

            {/* Graph */}
            <div
              ref={graphContainerRef}
              className="graph-container"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', position: 'relative', overflow: 'hidden' }}
            >
              {isLoading ? (
                <LoadingGraphAnimation />
              ) : resultData ? (
                <Graph
                  nodes={graphNodes}
                  links={graphLinks}
                  width={graphSize.width}
                  height={graphSize.height}
                  onNodeClick={handleNodeClick}
                />
              ) : (
                <div className="graph-placeholder">
                  <span style={{ color: '#B5B5B5' }}>Graph will appear here</span>
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Bottom input */}
        <div className="bottom-input-wrapper">
          <div className="input-container" style={{ maxWidth: 800, width: '100%', margin: '0 auto', zIndex: 2 }}>
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
              <button className="icon-btn send-btn" onClick={handleSend} aria-label="Send">
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