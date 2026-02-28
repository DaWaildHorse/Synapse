import type { NodeType, LinkType, GraphNode } from "../types/graph";

export function getNodeColor(type: NodeType): string {
  switch (type) {
    case "claim":
      return "#3b82f6"; // blue
    case "source":
      return "#10b981"; // green
    case "entity":
      return "#f59e0b"; // amber
    default:
      return "#999";
  }
}

export function getNodeSize(node: GraphNode): number {
  if (node.type === "claim") return 12;
  if (node.type === "source") return 10;
  return 6;
}

export function getLinkColor(type: LinkType): string {
  switch (type) {
    case "SUPPORTS":
      return "#22c55e"; // green
    case "CONTRADICTS":
      return "#ef4444"; // red
    case "MAKES":
      return "#94a3b8"; // gray
    case "MENTIONS":
      return "#cbd5e1"; // light gray
    default:
      return "#ccc";
  }
}