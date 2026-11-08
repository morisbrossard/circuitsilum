import { findElectricalNodes, signalStates } from "./electricalGraph";

export { signalStates };

export function resolveSignal(drivers = []) {
  const defined = drivers.filter((value) => value !== signalStates.z && value !== signalStates.floating);
  if (!defined.length) return signalStates.floating;
  if (defined.every((value) => value === signalStates.high)) return signalStates.high;
  if (defined.every((value) => value === signalStates.low)) return signalStates.low;
  return signalStates.conflict;
}

function binaryInputs(inputs, count) {
  return Array.from({ length: count }, (_, index) => inputs[index] || signalStates.floating);
}

export const logicFunctions = {
  and: (inputs) => binaryInputs(inputs, 2).every((value) => value === signalStates.high) ? signalStates.high : signalStates.low,
  or: (inputs) => binaryInputs(inputs, 2).some((value) => value === signalStates.high) ? signalStates.high : signalStates.low,
  not: (inputs) => inputs[0] === signalStates.high ? signalStates.low : signalStates.high,
  nand: (inputs) => logicFunctions.and(inputs) === signalStates.high ? signalStates.low : signalStates.high,
  nor: (inputs) => logicFunctions.or(inputs) === signalStates.high ? signalStates.low : signalStates.high,
  xor: (inputs) => binaryInputs(inputs, 2).filter((value) => value === signalStates.high).length === 1 ? signalStates.high : signalStates.low,
  xnor: (inputs) => logicFunctions.xor(inputs) === signalStates.high ? signalStates.low : signalStates.high,
};

export function evaluateLogicGate(type, inputs) {
  const evaluate = logicFunctions[type];
  if (!evaluate) throw new Error(`Unsupported logic gate: ${type}`);
  return evaluate(inputs);
}

export function createSequentialState() {
  return { q: signalStates.low, qNot: signalStates.high, previousClock: signalStates.low };
}

export function evaluate74LS74(state, inputs) {
  const next = { ...state };
  const clear = inputs.clear ?? signalStates.high;
  const preset = inputs.preset ?? signalStates.high;
  const data = inputs.data ?? signalStates.floating;
  const clock = inputs.clock ?? signalStates.low;
  if (clear === signalStates.low && preset === signalStates.low) {
    next.q = signalStates.conflict;
    next.qNot = signalStates.conflict;
  } else if (clear === signalStates.low) {
    next.q = signalStates.low;
    next.qNot = signalStates.high;
  } else if (preset === signalStates.low) {
    next.q = signalStates.high;
    next.qNot = signalStates.low;
  } else if (state.previousClock === signalStates.low && clock === signalStates.high) {
    next.q = data;
    next.qNot = data === signalStates.high ? signalStates.low : data === signalStates.low ? signalStates.high : signalStates.conflict;
  }
  next.previousClock = clock;
  return next;
}

export function simulateDigitalCircuit({ connections = [], componentStates = {}, cycles = 1 } = {}) {
  const nodes = findElectricalNodes(connections);
  const diagnostics = [];
  const resolvedNodes = nodes.map((node) => ({ pins: node, state: resolveSignal(node.map((pin) => componentStates[pin]).filter(Boolean)) }));
  for (const node of resolvedNodes) {
    if (node.state === signalStates.conflict) diagnostics.push({ severity: "error", code: "SIGNAL_CONFLICT", pins: node.pins });
  }
  return { cycles, nodes: resolvedNodes, diagnostics };
}
