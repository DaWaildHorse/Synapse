import React from "react";
import Graph from "./Graph/components/Graph";
import type { GraphNode, GraphLink } from "./Graph/types/graph";

const App: React.FC = () => {
  // Sample nodes
  const nodes: GraphNode[] = [
    { id: "claim1", type: "claim" },
    { id: "claim2", type: "claim" },
    { id: "sourceA", type: "source" },
    { id: "sourceB", type: "source" },
    { id: "entity1", type: "entity" },
  ];

  // Sample links
  const links: GraphLink[] = [
    { source: "sourceA", target: "claim1", type: "MAKES" },
    { source: "sourceB", target: "claim2", type: "MAKES" },
    { source: "claim1", target: "entity1", type: "MENTIONS" },
    { source: "claim2", target: "entity1", type: "MENTIONS" },
    { source: "claim1", target: "claim2", type: "CONTRADICTS" },
  ];

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <h1 style={{ textAlign: "center" }}>Graph View</h1>
      <Graph nodes={nodes} links={links} width={1200} height={800} />
    </div>
  );
};

export default App;