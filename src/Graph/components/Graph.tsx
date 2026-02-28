import React, { useState, useRef, useCallback } from "react";
import type { GraphNode, GraphLink } from "../types/graph";
import { useForceSimulation } from "../hooks/useForce";
import Node from "./Node";
import Link from "./Link";
import * as d3 from "d3";

interface GraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  width?: number;
  height?: number;
}

const Graph: React.FC<GraphProps> = ({ nodes, links, width = 1000, height = 800 }) => {
  const [, setTick] = useState(0);
  const svgRef = useRef<SVGSVGElement>;

  const handleTick = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  useForceSimulation(nodes, links, width, height, handleTick, svgRef);

  // Zoom & Pan behavior
  const handleZoom = useCallback(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = svg.select("g");
    const zoom = d3.zoom<SVGSVGElement, unknown>().on("zoom", (event) => {
      g.attr("transform", event.transform);
    });
    svg.call(zoom as any);
  }, []);

  React.useEffect(() => {
    handleZoom();
  }, [handleZoom]);

  return (
    <svg ref={svgRef} width={width} height={height} style={{ border: "1px solid #ccc" }}>
      <g>
        {/* Render Links */}
        {links.map((link, i) => (
          <Link key={i} link={link} />
        ))}

        {/* Render Nodes */}
        {nodes.map((node) => (
          <Node key={node.id} node={node} />
        ))}
      </g>
    </svg>
  );
};

export default Graph;