// src/Graph/hooks/useGeminiGraph.ts
import { useState, useCallback } from "react";
import type { GraphNode, GraphLink } from "../types/graph";
import { generateGraphFromTopic } from "../services/GeminiGraphService";

interface UseGeminiGraphState {
  nodes: GraphNode[];
  links: GraphLink[];
  loading: boolean;
  error: string | null;
}

interface UseGeminiGraphReturn extends UseGeminiGraphState {
  generate: (topic: string) => Promise<void>;
  reset: () => void;
}

const EMPTY: UseGeminiGraphState = {
  nodes: [],
  links: [],
  loading: false,
  error: null,
};

/**
 * Usage:
 *   const { nodes, links, loading, error, generate } = useGeminiGraph();
 *   generate("The role of social media in the 2024 US election");
 */
export function useGeminiGraph(): UseGeminiGraphReturn {
  const [state, setState] = useState<UseGeminiGraphState>(EMPTY);

  const generate = useCallback(async (topic: string) => {
    setState({ nodes: [], links: [], loading: true, error: null });
    try {
      const { nodes, links } = await generateGraphFromTopic(topic);
      setState({ nodes, links, loading: false, error: null });
    } catch (err) {
      setState({
        nodes: [],
        links: [],
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, []);

  const reset = useCallback(() => setState(EMPTY), []);

  return { ...state, generate, reset };
}