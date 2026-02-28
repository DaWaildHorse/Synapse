// src/Graph/hooks/useForce.ts
import { useEffect, useRef, type RefObject } from "react";
import * as d3 from "d3";
import type { GraphNode, GraphLink } from "../types/graph";

export function useForceSimulation(
  nodes: GraphNode[],
  links: GraphLink[],
  width: number,
  height: number,
  onTick: () => void,
  svgRef: RefObject<SVGSVGElement | null>
) {
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);

  useEffect(() => {
    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance(80)
          // Higher link strength so neighbours spring toward the dragged node — key to the Obsidian feel
          .strength(0.8)
      )
      .force("charge", d3.forceManyBody().strength(-350))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<GraphNode>().radius(32).strength(0.9))
      
      .velocityDecay(0.15)
      .alphaDecay(0.01)
      .on("tick", onTick);

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
      simulationRef.current = null;
    };
  }, [nodes, links, width, height, onTick]);

  return simulationRef;
}