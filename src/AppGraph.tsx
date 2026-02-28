// src/App.tsx
import React, { useEffect, useRef, useState } from "react";
import Graph from "./Graph/components/Graph";
import { useGeminiGraph } from "./Graph/hooks/usegeminigraph";
import { getNodeDetail } from "./Graph/services/GeminiGraphService";
import type { GraphNode, GraphLink } from "./Graph/types/graph";
import type { NodeDetail } from "./Graph/services/GeminiGraphService";

const TOPIC = "The role of social media in the 2024 US election";

const STORAGE_KEYS = {
  graph:   "graph:nodes_links",
  details: "graph:node_details",
  notes:   "graph:notes",
};

const TYPE_COLOR: Record<string, string> = {
  claim:  "#3b82f6",
  source: "#10b981",
  entity: "#f59e0b",
};

// ── localStorage helpers ───────────────────────────────────────────────────

function loadJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch { return null; }
}

function saveJSON(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { /* storage full — fail silently */ }
}

// ── Component ──────────────────────────────────────────────────────────────

const App: React.FC = () => {
  const { nodes: freshNodes, links: freshLinks, generate } = useGeminiGraph();

  // Hydrate from localStorage on first render
  const persisted = loadJSON<{ nodes: GraphNode[]; links: GraphLink[] }>(STORAGE_KEYS.graph);
  const [nodes, setNodes] = useState<GraphNode[]>(persisted?.nodes ?? []);
  const [links, setLinks] = useState<GraphLink[]>(persisted?.links ?? []);

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [detail, setDetail]             = useState<NodeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError]   = useState<string | null>(null);
  const [noteFocused, setNoteFocused]   = useState(false);

  // Notes: persisted per node id
  const [notes, setNotes] = useState<Record<string, string>>(
    () => loadJSON<Record<string, string>>(STORAGE_KEYS.notes) ?? {}
  );

  // Detail cache: persisted across sessions
  const cache = useRef<Map<string, NodeDetail>>(
    new Map(Object.entries(loadJSON<Record<string, NodeDetail>>(STORAGE_KEYS.details) ?? {}))
  );

  const didGenerate = useRef(false);

  // Only call Gemini if we have no persisted graph
  useEffect(() => {
    if (persisted?.nodes?.length) return; // already have data
    if (didGenerate.current) return;
    didGenerate.current = true;
    generate(TOPIC);
  }, []);

  // When Gemini returns fresh data, update state + persist
  useEffect(() => {
    if (!freshNodes.length) return;
    setNodes(freshNodes);
    setLinks(freshLinks);
    saveJSON(STORAGE_KEYS.graph, { nodes: freshNodes, links: freshLinks });
  }, [freshNodes, freshLinks]);

  // Persist notes whenever they change
  useEffect(() => {
    saveJSON(STORAGE_KEYS.notes, notes);
  }, [notes]);

  const handleNodeClick = async (node: GraphNode) => {
    setSelectedNode(node);
    setDetailError(null);

    // Serve from cache instantly — no spinner, no API call
    if (cache.current.has(node.id)) {
      setDetail(cache.current.get(node.id)!);
      return;
    }

    setDetail(null);
    setDetailLoading(true);
    try {
      const d = await getNodeDetail(node.label, node.type, TOPIC);
      cache.current.set(node.id, d);
      // Persist the whole cache to localStorage
      saveJSON(STORAGE_KEYS.details, Object.fromEntries(cache.current));
      setDetail(d);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : String(err));
    } finally {
      setDetailLoading(false);
    }
  };

  const currentNote = selectedNode ? (notes[selectedNode.id] ?? "") : "";
  const wordCount   = currentNote.trim() === "" ? 0 : currentNote.trim().split(/\s+/).length;

  const handleClearAll = () => {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    setNodes([]);
    setLinks([]);
    cache.current.clear();
    setNotes({});
    setSelectedNode(null);
    setDetail(null);
    didGenerate.current = false;
    generate(TOPIC);
  };

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", background: "#0f172a", color: "#e2e8f0", fontFamily: "sans-serif" }}>

      {/* ── Left — detail panel ──────────────────────────────────────────── */}
      <div style={{
        width: "50%", height: "100%", boxSizing: "border-box",
        padding: selectedNode ? "32px 28px" : 0,
        overflowY: "auto", borderRight: "1px solid #1e293b",
        display: "flex", flexDirection: "column", gap: 20,
      }}>

        {!selectedNode && (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p className="text-sm text-slate-600">Click a node to see details</p>
          </div>
        )}

        {selectedNode && (
          <>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", flexShrink: 0, background: TYPE_COLOR[selectedNode.type] ?? "#999", display: "inline-block" }} />
              <h2 className="text-3xl font-bold text-slate-100 m-0">{selectedNode.label}</h2>
              <span
                className="ml-auto text-xs font-semibold tracking-widest uppercase rounded-full px-3 py-1 bg-slate-800"
                style={{ color: TYPE_COLOR[selectedNode.type] ?? "#999" }}
              >
                {selectedNode.type}
              </span>
            </div>

            {/* Confidence bar */}
            {selectedNode.type === "claim" && selectedNode.confidence !== undefined && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="text-xs text-slate-500">Confidence</span>
                <div style={{ flex: 1, height: 6, background: "#1e293b", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 999,
                    width: `${Math.round(selectedNode.confidence * 100)}%`,
                    background: selectedNode.confidence > 0.66 ? "#22c55e" : selectedNode.confidence > 0.33 ? "#f59e0b" : "#ef4444",
                  }} />
                </div>
                <span className="text-xs text-slate-400" style={{ minWidth: 32 }}>
                  {Math.round(selectedNode.confidence * 100)}%
                </span>
              </div>
            )}

            {/* Loading */}
            {detailLoading && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #334155", borderTopColor: "#3b82f6", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                <span className="text-sm text-slate-500">Fetching details…</span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {/* Error */}
            {detailError && (
              <div style={{ padding: "10px 14px", background: "#450a0a", borderRadius: 8, border: "1px solid #7f1d1d" }}>
                <p className="text-sm text-red-300 m-0">{detailError}</p>
              </div>
            )}

            {detail && (
              <>
                <Section title="Summary">
                  <p className="text-lg leading-relaxed text-slate-300 m-0">{detail.summary}</p>
                </Section>
                <Section title="Details">
                  <p className="text-lg leading-relaxed text-slate-400 m-0">{detail.details}</p>
                </Section>
                <Section title="Key Facts">
                  <ul className="m-0 pl-5 flex flex-col gap-2">
                    {detail.keyFacts.map((f, i) => (
                      <li key={i} className="text-base leading-relaxed text-slate-400">{f}</li>
                    ))}
                  </ul>
                </Section>
                <Section title="Related Topics">
                  <div className="flex flex-wrap gap-2">
                    {detail.relatedTopics.map((t, i) => (
                      <span key={i} className="text-sm px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
                        {t}
                      </span>
                    ))}
                  </div>
                </Section>
              </>
            )}

            {/* Personal Notes */}
            <Section title="My Notes">
              <div style={{
                borderRadius: 12,
                border: noteFocused ? "1px solid #3b82f6" : "1px solid #1e293b",
                background: "#0f172a",
                transition: "border-color 0.15s",
                overflow: "hidden",
              }}>
                <textarea
                  value={currentNote}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [selectedNode.id]: e.target.value }))}
                  onFocus={() => setNoteFocused(true)}
                  onBlur={() => setNoteFocused(false)}
                  placeholder="Write your thoughts on this node…"
                  rows={5}
                  style={{
                    width: "100%", background: "transparent", border: "none", outline: "none",
                    resize: "none", padding: "14px 16px", boxSizing: "border-box",
                    color: "#e2e8f0", fontSize: 15, lineHeight: 1.7, fontFamily: "inherit",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 14px 10px" }}>
                  <span className="text-xs text-slate-600">
                    {wordCount > 0 ? `${wordCount} word${wordCount === 1 ? "" : "s"}` : ""}
                  </span>
                  {currentNote.trim() !== "" && (
                    <button
                      onClick={() => setNotes((prev) => ({ ...prev, [selectedNode.id]: "" }))}
                      className="text-xs text-slate-600 hover:text-red-400 transition-colors"
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </Section>

            {/* Regenerate graph */}
            <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid #1e293b" }}>
              <button
                onClick={handleClearAll}
                className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                ↺ Regenerate graph &amp; clear cache
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Right — graph ───────────────────────────────────────────────── */}
      <div style={{ width: "50%", height: "100%" }}>
        <Graph
          nodes={nodes}
          links={links}
          width={window.innerWidth * 0.5}
          height={window.innerHeight}
          onNodeClick={handleNodeClick}
        />
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={`flex flex-col gap-2 ${className ?? ""}`}>
    <p className="text-xs font-semibold tracking-widest uppercase text-slate-600 m-0">{title}</p>
    {children}
  </div>
);

export default App;