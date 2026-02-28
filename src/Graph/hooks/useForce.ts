import { useEffect } from "react";
import * as d3 from "d3";
import type { GraphNode, GraphLink } from "../types/graph";
import type { RefObject } from "react";

export function useForceSimulation(
  nodes: GraphNode[],
  links: GraphLink[],
  width: number,
  height: number,
  onTick: () => void,
  svgRef: RefObject<SVGSVGElement>
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
 // Attach drag behavior if SVG ref exists
    if (svgRef?.current) {
      const svg = d3.select(svgRef.current);

      svg
        .selectAll<SVGCircleElement, GraphNode>("circle")
        .call(
          d3
            .drag<SVGCircleElement, GraphNode>()
            .on("start", (event, d) => {
              if (!event.active) simulation.alphaTarget(0.3).restart();
              d.fx = d.x;
              d.fy = d.y;
            })
            .on("drag", (event, d) => {
              d.fx = event.x;
              d.fy = event.y;
            })
            .on("end", (event, d) => {
              if (!event.active) simulation.alphaTarget(0);
              d.fx = null;
              d.fy = null;
            })
        );
    }

    return () => {
      simulation.stop();
    };
  }, [nodes, links, width, height, onTick, svgRef]);
}