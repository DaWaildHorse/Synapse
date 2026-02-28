import type { NodeType, LinkType, GraphNode } from "../types/graph";

export function getNodeColor(type: NodeType): string {
  switch (type) {
    case "claim":
      return "#4A9EFF"; // Primary blue
    case "source":
      return "#10B981"; // Green for sources
    case "entity":
      return "#f59e0b"; // Amber for entities
    default:
      return "#B5B5B5"; // Gray fallback
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
      return "#10B981"; // Green for supporting links
    case "CONTRADICTS":
      return "#EF4444"; // Red for contradiction
    case "MAKES":
      return "#4A9EFF"; // Primary blue for claims
    case "MENTIONS":
      return "#B5B5B5"; // Gray for references
    default:
      return "#D9D9D9"; // Light gray fallback
  }
}