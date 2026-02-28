import type { NodeType, LinkType, GraphNode } from "../types/graph";

export function getNodeColor(type: NodeType): string {
  switch (type) {
    case "claim":
      return "#1F77B4"; // Blue for main claims
    case "source":
      return "#FF7F0E"; // Orange for sources (contrasting)
    case "entity":
      return "#2CA02C"; // Green for entities
    default:
      return "#92E0A9"; // Soft teal for other / unknown
  }
}

export function getNodeSize(node: GraphNode): number {
  switch (node.type) {
    case "claim":
      return 12;
    case "source":
      return 10;
    case "entity":
      return 8;
    default:
      return 6;
  }
}

export function getLinkColor(type: LinkType): string {
  switch (type) {
    case "SUPPORTS":
      return "#2CA02C"; // Green for supporting links
    case "CONTRADICTS":
      return "#D62728"; // Red for contradiction
    case "MAKES":
      return "#1F77B4"; // Blue for claims / neutral links
    case "MENTIONS":
      return "#94A3B8"; // Gray for references
    default:
      return "#ccc"; // fallback
  }
}