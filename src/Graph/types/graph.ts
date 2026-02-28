export type NodeType = "claim" | "source" | "entity";

export interface GraphNode {
  id: string;
  label: string;        // human-readable name shown in the graph
  type: NodeType;
  confidence?: number;  // 0–1, only meaningful on "claim" nodes
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export type LinkType =
  | "MAKES"       // source → claim  (a source makes a claim)
  | "SUPPORTS"    // claim  → claim  (one claim supports another)
  | "CONTRADICTS" // claim  → claim  (one claim contradicts another)
  | "MENTIONS";   // source/claim → entity

export interface GraphLink {
  source: string; // node id
  target: string; // node id
  type: LinkType;
}

export interface GeminiGraphResponse {
  nodes: GraphNode[];
  links: GraphLink[];
}