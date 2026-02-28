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
}

const Graph: React.FC<GraphProps> = ({ nodes, links, width = 1000, height = 800 }) => {
  const [, setTick] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);

  // Track which node is being dragged and the SVG-space offset
  const draggingRef = useRef<{
    node: GraphNode;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const handleTick = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  const simulationRef = useForceSimulation(nodes, links, width, height, handleTick, svgRef);

  // ── Zoom / pan ────────────────────────────────────────────────────────────
  const gRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);
  }, [width, height]);

  // ── Drag helpers ──────────────────────────────────────────────────────────

  /** Convert a PointerEvent's client coords into the inner <g>'s local space */
  const clientToLocal = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      if (!svgRef.current || !gRef.current) return { x: clientX, y: clientY };
      const pt = svgRef.current.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const local = pt.matrixTransform(gRef.current.getScreenCTM()!.inverse());
      return { x: local.x, y: local.y };
    },
    []
  );

  const handleNodePointerDown = useCallback(
    (node: GraphNode, e: React.PointerEvent) => {
      e.stopPropagation();
      (e.target as Element).setPointerCapture(e.pointerId);

      const { x, y } = clientToLocal(e.clientX, e.clientY);

      // Heat up the simulation — neighbours start springing toward the node
      const sim = simulationRef.current;
      if (sim) sim.alphaTarget(0.5).restart();

      // Pin the node
      node.fx = node.x;
      node.fy = node.y;

      draggingRef.current = {
        node,
        offsetX: x - (node.x ?? 0),
        offsetY: y - (node.y ?? 0),
      };
    },
    [clientToLocal, simulationRef]
  );

  const handleSvgPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      const { node, offsetX, offsetY } = draggingRef.current;
      const { x, y } = clientToLocal(e.clientX, e.clientY);

      // Move pinned position to cursor — simulation handles the rest
      node.fx = x - offsetX;
      node.fy = y - offsetY;
    },
    [clientToLocal]
  );

  const handleSvgPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      const { node } = draggingRef.current;

      // Gradually cool the simulation back down instead of cutting it off abruptly
      const sim = simulationRef.current;
      if (sim) sim.alphaTarget(0);

      // Release the node so physics takes over again
      node.fx = null;
      node.fy = null;

      draggingRef.current = null;
    },
    [simulationRef]
  );

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ border: "1px solid #ccc", cursor: draggingRef.current ? "grabbing" : "grab" }}
      onPointerMove={handleSvgPointerMove}
      onPointerUp={handleSvgPointerUp}
      onPointerLeave={handleSvgPointerUp} // safety: release if pointer leaves the SVG
    >
      <g ref={gRef}>
        {links.map((link, i) => (
          <Link key={`link-${i}`} link={link} />
        ))}
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