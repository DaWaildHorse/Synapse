export type NodeType = "claim" | "source" | "entity";

export interface GraphNode {
  id: string;
  type: NodeType;
  confidence?: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export type LinkType =
  | "MAKES"
  | "SUPPORTS"
  | "CONTRADICTS"
  | "MENTIONS";

export interface GraphLink {
  source: string;
  target: string;
  type: LinkType;
}