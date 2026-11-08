export const signalStates = {
  low: "LOW",
  high: "HIGH",
  z: "Z",
  floating: "FLOATING",
  conflict: "CONFLICT",
};

export function createElectricalGraph(connections = []) {
  const graph = new Map();
  for (const connection of connections) {
    if (!connection?.from || !connection?.to) continue;
    if (!graph.has(connection.from)) graph.set(connection.from, new Set());
    if (!graph.has(connection.to)) graph.set(connection.to, new Set());
    graph.get(connection.from).add(connection.to);
    graph.get(connection.to).add(connection.from);
  }
  return graph;
}

export function findElectricalNodes(connections = []) {
  const graph = createElectricalGraph(connections);
  const nodes = [];
  const visited = new Set();
  for (const start of graph.keys()) {
    if (visited.has(start)) continue;
    const node = [];
    const pending = [start];
    visited.add(start);
    while (pending.length) {
      const current = pending.pop();
      node.push(current);
      for (const neighbor of graph.get(current) || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          pending.push(neighbor);
        }
      }
    }
    nodes.push(node);
  }
  return nodes;
}

export function validateElectricalConnections(connections = []) {
  const diagnostics = [];
  for (const node of findElectricalNodes(connections)) {
    const hasPower = node.some((pin) => /(?:5V|3V3|VCC)/i.test(pin));
    const hasGround = node.some((pin) => /GND/i.test(pin));
    if (hasPower && hasGround) diagnostics.push({ severity: "error", code: "POWER_GROUND_SHORT", node });
  }
  return diagnostics;
}
