import { useEffect } from "react";
import * as d3 from "d3";
import type { GraphNode, GraphLink } from "../types/graph";

export function useForceSimulation(
  nodes: GraphNode[],
  links: GraphLink[],
  width: number,
  height: number,
  onTick: () => void
) {
  useEffect(() => {
    const simulation = d3
      .forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(120)
      )
      .force("charge", d3.forceManyBody().strength(-250))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40))
      .on("tick", onTick);

    return () => {
      simulation.stop();
    };
  }, [nodes, links, width, height, onTick]);
}