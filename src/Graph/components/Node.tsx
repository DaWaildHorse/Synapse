import React from "react";
import type { GraphNode } from "../types/graph";
import { getNodeColor, getNodeSize } from "../utils/graphUtils";

interface NodeProps {
  node: GraphNode;
  onClick?: (node: GraphNode) => void;
  onMouseEnter?: (node: GraphNode) => void;
  onMouseLeave?: (node: GraphNode) => void;
  /** Called when the user presses down on a node to start a drag */
  onPointerDown?: (node: GraphNode, e: React.PointerEvent) => void;
}

const Node: React.FC<NodeProps> = ({
  node,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onPointerDown,
}) => {
  if (node.x === undefined || node.y === undefined) return null;

  return (
    <circle
      cx={node.x}
      cy={node.y}
      r={getNodeSize(node)}
      fill={getNodeColor(node.type)}
      stroke="#333"
      strokeWidth={1}
      onClick={() => onClick?.(node)}
      onMouseEnter={() => onMouseEnter?.(node)}
      onMouseLeave={() => onMouseLeave?.(node)}
      onPointerDown={(e) => onPointerDown?.(node, e)}
      style={{ cursor: "grab" }}
    />
  );
};

export default Node;