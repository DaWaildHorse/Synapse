import React, { useState, useCallback } from "react";
import type { GraphNode, GraphLink } from "../types/graph";
import { useForceSimulation } from "../hooks/useForce";
import Node from "./Node";
import Link from "./Link";

interface GraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  width?: number;
  height?: number;
}

const Graph: React.FC<GraphProps> = ({ nodes, links, width = 1000, height = 800 }) => {
  const [, setTick] = useState(0);

  const handleTick = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  useForceSimulation(nodes, links, width, height, handleTick);

  return (
    <svg width={width} height={height}>
      {/* Render Links */}
      {links.map((link, i) => (
        <Link key={i} link={link} />
      ))}

      {/* Render Nodes */}
      {nodes.map((node) => (
        <Node key={node.id} node={node} />
      ))}
    </svg>
  );
};

export default Graph;