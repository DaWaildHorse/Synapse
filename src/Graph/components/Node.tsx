import React from "react";
import type { GraphNode } from "../types/graph";
import { getNodeColor, getNodeSize } from "../utils/graphUtils";

interface NodeProps {
  node: GraphNode;
  onClick?: (node: GraphNode) => void;
  onMouseEnter?: (node: GraphNode) => void;
  onMouseLeave?: (node: GraphNode) => void;
}

const Node: React.FC<NodeProps> = ({ node, onClick, onMouseEnter, onMouseLeave }) => {
  if (node.x === undefined || node.y === undefined) return null;

  return (
    <circle
      cx={node.x}
      cy={node.y}
      r={getNodeSize(node)}
      fill={getNodeColor(node.type)}
      stroke="#333"
      strokeWidth={1}
      onClick={() => onClick && onClick(node)}
      onMouseEnter={() => onMouseEnter && onMouseEnter(node)}
      onMouseLeave={() => onMouseLeave && onMouseLeave(node)}
      style={{ cursor: "pointer" }}
    />
  );
};

export default Node;