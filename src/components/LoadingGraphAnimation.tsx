import { useState, useEffect, useRef } from 'react';

interface Node {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  ttl: number;
  createdAt: number;
}

const PROXIMITY_THRESHOLD = 80;
const MAX_CONNECTIONS = 3;
const MIN_DISTANCE = 30;

export default function LoadingGraphAnimation() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const nodeIdRef = useRef(0);

  useEffect(() => {
    const spawnNode = () => {
      const newNode: Node = {
        id: nodeIdRef.current++,
        x: Math.random() * 280 + 10,
        y: Math.random() * 180 + 10,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 12 + 6,
        opacity: 0,
        ttl: Math.random() * 5000 + 5000,
        createdAt: Date.now(),
      };

      setNodes(prev => [...prev, newNode]);

      setTimeout(() => {
        setNodes(prev => prev.map(n => n.id === newNode.id ? { ...n, opacity: 1 } : n));
      }, 50);
    };

    const cleanup = () => {
      const now = Date.now();
      setNodes(prev => prev.filter(n => now - n.createdAt <= n.ttl));
    };

    const moveNodes = () => {
      setNodes(prev => prev.map((n, i) => {
        let { x, y, vx, vy } = n;
        // Gentle separation when too close
        for (let j = 0; j < prev.length; j++) {
          if (i === j) continue;
          const dx = x - prev[j].x, dy = y - prev[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MIN_DISTANCE && dist > 0) {
            x += (dx / dist) * 1.2;
            y += (dy / dist) * 1.2;
          }
        }
        x += vx;
        y += vy;
        if (x < 10 || x > 290) vx *= -1;
        if (y < 10 || y > 190) vy *= -1;
        return { ...n, x, y, vx, vy };
      }));
    };

    const spawnInterval = setInterval(spawnNode, 400);
    const cleanupInterval = setInterval(cleanup, 500);
    const moveInterval = setInterval(moveNodes, 50);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(cleanupInterval);
      clearInterval(moveInterval);
    };
  }, []);

  // Compute edges dynamically based on proximity with connection limit
  const edges: { from: Node; to: Node }[] = [];
  const connectionCount: Record<number, number> = {};
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      if ((connectionCount[a.id] || 0) >= MAX_CONNECTIONS || (connectionCount[b.id] || 0) >= MAX_CONNECTIONS) continue;
      const dx = a.x - b.x, dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= MIN_DISTANCE && dist < PROXIMITY_THRESHOLD) {
        edges.push({ from: a, to: b });
        connectionCount[a.id] = (connectionCount[a.id] || 0) + 1;
        connectionCount[b.id] = (connectionCount[b.id] || 0) + 1;
      }
    }
  }

  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
      {edges.map((edge, i) => (
        <line
          key={i}
          x1={`${edge.from.x / 3}%`} y1={`${edge.from.y / 2}%`}
          x2={`${edge.to.x / 3}%`} y2={`${edge.to.y / 2}%`}
          stroke="#4A9EFF"
          strokeWidth="1"
          opacity={Math.min(edge.from.opacity, edge.to.opacity) * 0.5}
        />
      ))}
      {nodes.map(node => (
        <circle
          key={node.id}
          cx={`${node.x / 3}%`}
          cy={`${node.y / 2}%`}
          r={node.size}
          fill="#4A9EFF"
          opacity={node.opacity}
          style={{ transition: 'opacity 0.3s' }}
        />
      ))}
    </svg>
  );
}
