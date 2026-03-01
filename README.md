# Synapse — *Less noise, more truth.*

> **Synapse** is an AI-powered fact-checking and information analysis tool that helps users cut through misinformation by surfacing both supporting and contradicting sources for any claim or URL.

---

## Table of Contents

- [What is Synapse?](#what-is-synapse)
- [How it Works](#how-it-works)
- [Live Deployment](#live-deployment)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started Locally](#getting-started-locally)
- [Environment Variables](#environment-variables)
- [API Configuration](#api-configuration)
- [Knowledge Graph](#knowledge-graph)
- [Troubleshooting](#troubleshooting)

---

## What is Synapse?

In today's information overload, it's hard to know what's true. Most tools only confirm biases. **Synapse deliberately surfaces opposing viewpoints**, helping users form balanced, informed opinions.

### Target Users
- Journalists verifying sources before publishing
- Researchers cross-referencing claims
- Students fact-checking before citing
- Fact-checkers and anyone who wants to verify information before sharing it

---

## How it Works

Paste any URL into Synapse and the AI will:

1. **Analyze claims** — identifies the core topic and key assertions
2. **Find sources** — surfaces both supporting AND contradicting sources, giving you both sides of the story
3. **Visualize relationships** — renders an interactive knowledge graph of claims, sources, and entities
4. **Provide veracity metrics** — agree / disagree / neutral percentages at a glance via circular progress indicators
5. **Enable deeper exploration** — click any node in the graph to get detailed context, key facts, and write personal notes

---

## Live Deployment

Synapse is hosted on **AWS Amplify**:

🔗 **[View Deployment on AWS Amplify](https://us-east-1.console.aws.amazon.com/amplify/apps/d19r8hl9k67i3o/branches/main/deployments?region=us-east-1)**

- **Region:** `us-east-1` (N. Virginia)
- **Branch:** `main` (auto-deploys on push)
- **Platform:** AWS Amplify Hosting (static + SSR capable)

Deployments are triggered automatically on every push to the `main` branch via the Amplify CI/CD pipeline.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS v4 + CSS Modules |
| Routing | React Router v6 |
| Graph physics | D3.js (force simulation) |
| AI / LLM | Google Gemini (`@google/genai` SDK) |
| Hosting | AWS Amplify |
| Persistence | `localStorage` (client-side caching) |

---

## Project Structure

```
synapse/
├── public/
│   └── app-logo.png
├── src/
│   ├── main.tsx                    # App entry point
│   ├── App.tsx                     # Router — defines / and /results routes
│   ├── index.css                   # Global styles + Tailwind import
│   │
│   ├── components/
│   │   ├── HomePage.tsx            # Landing page with URL input
│   │   ├── HomePage.css            # Landing page styles
│   │   ├── ResultPage.tsx          # Main results view (analysis + graph)
│   │   ├── ResultsPage.css         # Results page styles
│   │   ├── Sidebar.tsx             # History sidebar
│   │   ├── GraphBackground.tsx     # Animated canvas background
│   │   ├── LoadingGraphAnimation.tsx
│   │   │
│   │   └── Graph/                  # Self-contained graph module
│   │       ├── components/
│   │       │   ├── Graph.tsx       # Main SVG graph (zoom, pan, drag)
│   │       │   ├── Node.tsx        # Individual node renderer + label
│   │       │   └── Link.tsx        # Edge renderer
│   │       ├── hooks/
│   │       │   ├── useForce.ts     # D3 force simulation (Obsidian-like physics)
│   │       │   └── useGeminiGraph.ts  # Hook: loading/error/generate state
│   │       ├── services/
│   │       │   └── GeminiGraphService.ts  # Gemini API calls + validation + retry
│   │       ├── types/
│   │       │   └── graph.ts        # GraphNode, GraphLink, NodeType, LinkType
│   │       └── utils/
│   │           └── graphUtils.ts   # Color/size helpers per node/link type
│   │
│   └── services/
│       └── geminiService.ts        # Top-level analysis API call (analyzeInformation)
│
├── .env                            # API keys (never commit this)
├── .env.example                    # Template for required env vars
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Getting Started Locally

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- A Google Gemini API key ([get one here](https://aistudio.google.com/app/apikey))

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd synapse

# 2. Install dependencies
npm install

# 3. Set up environment variables
# Then edit .env and add your Gemini API key (see below)

# 4. Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.
---

## Environment Variables

Create a `.env` file in the project root or change it in the services/geminiService.ts:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

The key is read at build time by Vite via `import.meta.env.VITE_GEMINI_API_KEY`. For AWS Amplify, set the same variable in **Amplify Console → App settings → Environment variables**.

---

## API Configuration

Synapse uses the Google Gemini API in two places:

### 1. Top-level analysis — `src/services/geminiService.ts`
This is the **first** call made when a URL is submitted. It performs the full claim analysis, returns the graph structure, summary, and veracity metrics. **If you need to swap models, change prompts, or update the API key handling, this is the primary file to edit.**

### 2. Node detail fetching — `src/components/Graph/services/GeminiGraphService.ts`
This handles per-node detail calls when a user clicks a graph node. It includes:
- Exponential backoff retry on 429 rate-limit errors (2s → 4s → 8s)
- Response validation to ensure the JSON shape is correct
- A `localStorage` cache so each node is only fetched once per session

### Changing the model

In either service file, find the `model` field and update it:

```ts
// GeminiGraphService.ts
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",  // ← change this
  ...
});
```

Available models: `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-3-flash-preview`

### Rate limit issues (429 errors)

If you encounter 429 errors:
1. **Use a different API key** — update `VITE_GEMINI_API_KEY` in `.env` and restart
2. The retry logic in `GeminiGraphService.ts` will automatically retry up to 3 times with exponential backoff

---

## Knowledge Graph

The graph module (`src/components/Graph/`) is a fully self-contained interactive visualization built on D3.js force simulation.

### Node types

| Type | Color | Description |
|---|---|---|
| `claim` | 🔵 Blue | A statement that can be true/false or debated |
| `source` | 🟢 Green | A person, publication, or institution |
| `entity` | 🟡 Amber | A concrete noun — place, event, concept |

### Link types

| Type | Color | Description |
|---|---|---|
| `SUPPORTS` | Green | One claim supports another |
| `CONTRADICTS` | Red | One claim contradicts another |
| `MAKES` | Gray | A source makes a claim |
| `MENTIONS` | Light gray | A source or claim mentions an entity |

### Interaction

| Action | Behavior |
|---|---|
| **Drag node** | Obsidian-like physics — neighbours spring toward the dragged node |
| **Scroll** | Zoom in/out |
| **Click + drag background** | Pan the graph |
| **Click node** | Opens detail panel with summary, key facts, related topics, and personal notes |

### Persistence

All graph data, node details, and personal notes are persisted to `localStorage` namespaced by query, so revisiting the same URL loads instantly without an API call.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Blank white page | Open browser console (`F12`). Check for missing imports or CSS file errors |
| 429 Too Many Requests | Switch to `gemini-2.0-flash` in `GeminiGraphService.ts` or rotate API key in `.env` |
| Graph not rendering | Pass correct numeric `width` and `height` props to `<Graph>` — it requires pixel values |
| Old data showing | Clear localStorage: `localStorage.clear()` in browser console, then reload |
| Amplify deploy fails | Check that `VITE_GEMINI_API_KEY` is set in Amplify Console → Environment variables |
| StrictMode double API call | Already handled via `didGenerate` ref guard in the component |

---

## Contributing

1. Create a feature branch from `main`
2. Make changes and test locally with `npm run dev`
3. Push — Amplify will auto-deploy `main` on merge

---

*Synapse © 2025 — Less noise, more truth.*
