// src/Graph/components/Graph.tsx
import React, { useState, useRef, useCallback, useEffect } from "react";
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
  onNodeClick?: (node: GraphNode) => void;
}

const Graph: React.FC<GraphProps> = ({ nodes, links, width = 1000, height = 800, onNodeClick }) => {
  const [, setTick] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);

  const draggingRef = useRef<{
    node: GraphNode;
    offsetX: number;
    offsetY: number;
    moved: boolean; // track if it was a drag or a click
  } | null>(null);

  const handleTick = useCallback(() => setTick((t) => t + 1), []);
  const simulationRef = useForceSimulation(nodes, links, width, height, handleTick);

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);
  }, [width, height]);

  const clientToLocal = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current || !gRef.current) return { x: clientX, y: clientY };
    const pt = svgRef.current.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const local = pt.matrixTransform(gRef.current.getScreenCTM()!.inverse());
    return { x: local.x, y: local.y };
  }, []);

  const handleNodePointerDown = useCallback((node: GraphNode, e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    const { x, y } = clientToLocal(e.clientX, e.clientY);
    const sim = simulationRef.current;
    if (sim) sim.alphaTarget(0.5).restart();
    node.fx = node.x;
    node.fy = node.y;
    draggingRef.current = { node, offsetX: x - (node.x ?? 0), offsetY: y - (node.y ?? 0), moved: false };
  }, [clientToLocal, simulationRef]);

  const handleSvgPointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const { node, offsetX, offsetY } = draggingRef.current;
    const { x, y } = clientToLocal(e.clientX, e.clientY);
    const dx = x - offsetX - (node.x ?? 0);
    const dy = y - offsetY - (node.y ?? 0);
    // Mark as drag only if moved more than 4px — avoids cancelling tiny clicks
    if (Math.sqrt(dx * dx + dy * dy) > 4) draggingRef.current.moved = true;
    node.fx = x - offsetX;
    node.fy = y - offsetY;
  }, [clientToLocal]);

  const handleSvgPointerUp = useCallback(( ) => {
    if (!draggingRef.current) return;
    const { node, moved } = draggingRef.current;
    const sim = simulationRef.current;
    if (sim) sim.alphaTarget(0);
    node.fx = null;
    node.fy = null;
    // Fire click only if the pointer didn't move (i.e. it was a tap/click, not a drag)
    if (!moved && onNodeClick) onNodeClick(node);
    draggingRef.current = null;
  }, [simulationRef, onNodeClick]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ display: "block", cursor: "grab" }}
      onPointerMove={handleSvgPointerMove}
      onPointerUp={handleSvgPointerUp}
      onPointerLeave={handleSvgPointerUp}
    >
      <g ref={gRef}>
        {links.map((link, i) => <Link key={`link-${i}`} link={link} />)}
        {nodes.map((node) => (
          <Node
            key={node.id}
            node={node}
            onPointerDown={(n, e) => handleNodePointerDown(n, e)}
          />
        ))}
      </g>
    </svg>
  );
};

export default Graph;