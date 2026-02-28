import React from "react";
import type { GraphNode } from "../types/graph";
import { getNodeColor, getNodeSize } from "../utils/graphUtils";

interface NodeProps {
  node: GraphNode;
  onClick?: (node: GraphNode) => void;
  onMouseEnter?: (node: GraphNode) => void;
  onMouseLeave?: (node: GraphNode) => void;
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

  const r = getNodeSize(node);

  return (
    <g
      transform={`translate(${node.x},${node.y})`}
      style={{ cursor: "grab" }}
      onClick={() => onClick?.(node)}
      onMouseEnter={() => onMouseEnter?.(node)}
      onMouseLeave={() => onMouseLeave?.(node)}
      onPointerDown={(e) => onPointerDown?.(node, e)}
    >
      <circle
        r={r}
        fill={getNodeColor(node.type)}
        stroke="#4A9EFF"
        strokeWidth={1.5}
      />

      {/* Label sits just below the circle */}
      <text
        y={r + 11}
        textAnchor="middle"
        fontSize={9}
        fill="#4A4A4A"
        stroke="#FFFFFF"
        strokeWidth={2.5}
        paintOrder="stroke"
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {node.label}
      </text>

      {/* Confidence badge for claim nodes */}
      {node.type === "claim" && node.confidence !== undefined && (
        <text
          y={4}
          textAnchor="middle"
          fontSize={7}
          fontWeight="bold"
          fill="#fff"
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          {Math.round(node.confidence * 100)}%
        </text>
      )}
    </g>
  );
};

export default Node;