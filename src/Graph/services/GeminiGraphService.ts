import { GoogleGenAI } from "@google/genai";
import type { GeminiGraphResponse, NodeType, LinkType } from "../types/graph";

const SYSTEM_PROMPT = `
You are a knowledge-graph extraction engine.
Given a topic or news, respond with ONLY a valid JSON object — no markdown, no explanation. Search the internet for other sources that support the information and other that have different points of view

The JSON must match this exact shape:
{
  "nodes": [
    {
      "id": "unique_snake_case_id",
      "label": "Short human-readable name",
      "type": "claim" | "source" | "entity",
      "confidence": 0.0–1.0   // only for claim nodes; omit for others
    }
  ],
  "links": [
    {
      "source": "node_id",
      "target": "node_id",
      "type": "MAKES" | "SUPPORTS" | "CONTRADICTS" | "MENTIONS"
    }
  ]
}

Node type rules:
- "source"  → a person, publication, institution, or dataset that asserts things
- "claim"   → a statement that can be true/false, debated, or supported
- "entity"  → a concrete noun (place, technology, event, concept) that is referenced but not itself a claim

Link type rules:
- MAKES        → source makes a claim  (source → claim)
- SUPPORTS     → one claim supports another  (claim → claim)
- CONTRADICTS  → one claim contradicts another  (claim → claim)
- MENTIONS     → a source or claim mentions an entity  (any → entity)

Constraints:
- Every link's source and target must be an id that exists in nodes.
- Produce between 6 and 20 nodes and a proportional number of links.
- Use concise labels (≤ 6 words).
- Return ONLY the JSON object. No prose before or after.
`.trim();

const NODE_DETAIL_PROMPT = `
You are a research assistant. Given a node from a knowledge graph, provide a concise but informative breakdown.
Respond with ONLY a valid JSON object — no markdown, no explanation.

The JSON must match this exact shape:
{
  "summary": "overview of the node",
  "details": "deeper explanation, context, or background",
  "keyFacts": ["fact 1", "fact 2", "fact 3"],
  "relatedTopics": ["topic 1", "topic 2", "topic 3"]
}

Return ONLY the JSON object. No prose before or after.
`.trim();


const VALID_NODE_TYPES = new Set<NodeType>(["claim", "source", "entity"]);
const VALID_LINK_TYPES = new Set<LinkType>(["MAKES", "SUPPORTS", "CONTRADICTS", "MENTIONS"]);

function validate(raw: unknown): GeminiGraphResponse {
  if (typeof raw !== "object" || raw === null)
    throw new Error("Gemini response is not an object");

  const { nodes, links } = raw as Record<string, unknown>;
  if (!Array.isArray(nodes) || !Array.isArray(links))
    throw new Error("Missing nodes or links array");

  const nodeIds = new Set<string>();

  const validatedNodes = nodes.map((n: unknown, i) => {
    if (typeof n !== "object" || n === null)
      throw new Error(`Node ${i} is not an object`);
    const node = n as Record<string, unknown>;

    if (typeof node.id !== "string" || !node.id)
      throw new Error(`Node ${i} missing id`);
    if (typeof node.label !== "string" || !node.label)
      throw new Error(`Node ${i} missing label`);
    if (!VALID_NODE_TYPES.has(node.type as NodeType))
      throw new Error(`Node ${i} has invalid type: ${node.type}`);

    nodeIds.add(node.id);

    return {
      id: node.id,
      label: node.label as string,
      type: node.type as NodeType,
      ...(node.type === "claim" && typeof node.confidence === "number"
        ? { confidence: Math.min(1, Math.max(0, node.confidence)) }
        : {}),
    };
  });

  const validatedLinks = links.map((l: unknown, i) => {
    if (typeof l !== "object" || l === null)
      throw new Error(`Link ${i} is not an object`);
    const link = l as Record<string, unknown>;

    if (!nodeIds.has(link.source as string))
      throw new Error(`Link ${i} source "${link.source}" not found in nodes`);
    if (!nodeIds.has(link.target as string))
      throw new Error(`Link ${i} target "${link.target}" not found in nodes`);
    if (!VALID_LINK_TYPES.has(link.type as LinkType))
      throw new Error(`Link ${i} has invalid type: ${link.type}`);

    return {
      source: link.source as string,
      target: link.target as string,
      type: link.type as LinkType,
    };
  });

  return { nodes: validatedNodes, links: validatedLinks };
}

function getAI() {
  return new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
}

function parseJSON(rawText: string): unknown {
  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse Gemini JSON: ${cleaned.slice(0, 200)}`);
  }
}

export async function generateGraphFromTopic(
  topic: string
): Promise<GeminiGraphResponse> {
  if (!topic.trim()) throw new Error("Topic must not be empty");

  const response = await getAI().models.generateContent({
    model: "gemini-2.5-flash",
    contents: [topic],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.4,
      responseMimeType: "application/json",
    },
  });

  return validate(parseJSON(response.text ?? ""));
}

export interface NodeDetail {
  summary: string;
  details: string;
  keyFacts: string[];
  relatedTopics: string[];
}

export async function getNodeDetail(
  nodeLabel: string,
  nodeType: string,
  context: string  // the original topic, so Gemini has context
): Promise<NodeDetail> {
  const prompt = `Node label: "${nodeLabel}"\nNode type: "${nodeType}"\nGraph topic context: "${context}"`;

  const response = await getAI().models.generateContent({
    model: "gemini-2.5-flash",
    contents: [prompt],
    config: {
      systemInstruction: NODE_DETAIL_PROMPT,
      temperature: 0.4,
      responseMimeType: "application/json",
    },
  });

  const raw = parseJSON(response.text ?? "") as Record<string, unknown>;

  return {
    summary: typeof raw.summary === "string" ? raw.summary : "",
    details: typeof raw.details === "string" ? raw.details : "",
    keyFacts: Array.isArray(raw.keyFacts) ? raw.keyFacts.map(String) : [],
    relatedTopics: Array.isArray(raw.relatedTopics) ? raw.relatedTopics.map(String) : [],
  };
}