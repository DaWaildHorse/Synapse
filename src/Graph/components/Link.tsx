import React from "react";
import type{ GraphLink, GraphNode } from "../types/graph";
import { getLinkColor } from "../utils/graphUtils";

interface LinkProps {
  link: GraphLink;
}

const Link: React.FC<LinkProps> = ({ link }) => {
  const source = link.source as unknown as GraphNode;
  const target = link.target as unknown as GraphNode;

  if (!source?.x || !source?.y || !target?.x || !target?.y) return null;

  return (
    <line
      x1={source.x}
      y1={source.y}
      x2={target.x}
      y2={target.y}
      stroke={getLinkColor(link.type)}
      strokeWidth={1.5}
      opacity={0.8}
    />
  );
};

export default Link;