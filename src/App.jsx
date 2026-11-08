import { useEffect, useMemo, useRef, useState } from "react";
import { componentCatalog } from "./domain/componentCatalog";
import { validateElectricalConnections } from "./domain/electricalGraph";
import { simulateDigitalCircuit } from "./domain/digitalEngine";
const bits = (floor) => (floor - 1).toString(2).padStart(2, "0");

function Icon({ children, tone = "" }) {
  return <span className={`component-glyph ${tone}`}>{children}</span>;
}

function Sidebar({ onComponent, search, setSearch }) {
  return <aside className="sidebar">
    <div className="brand"><div className="brand-mark"><span /><span /><span /></div><div><strong>Circuit<span>Lab</span></strong><small>Digital circuit studio</small></div></div>
    <div className="sidebar-section"><div className="section-label">Proyecto</div><button className="project-card active"><span className="project-icon">⌁</span><span><b>Ascensor 4 pisos</b><small>Simulación principal</small></span><i>•••</i></button><button className="new-project"><span>＋</span> Nuevo proyecto</button></div>
    <div className="sidebar-section library"><div className="section-label">Biblioteca <kbd>⌘ K</kbd></div><label className="search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar componente..." /></label>
      {componentCatalog.map(({ group, items }) => <div className="library-group" key={group}><div className="group-title">{group} <span>⌃</span></div>{items.filter(({ label }) => label.toLowerCase().includes(search.toLowerCase())).map((item) => <button className="library-item" draggable onDragStart={(event) => event.dataTransfer.setData("component", JSON.stringify(item))} key={item.id} onClick={() => onComponent(item)}><Icon tone={group === "Entradas" ? "input-glyph" : group === "Lógica" ? "logic-glyph" : "output-glyph"}>{item.glyph}</Icon>{item.label}<em>{item.part}</em></button>)}</div>)}
    </div>
    <div className="sidebar-bottom"><div className="status-row"><span className="status-dot" /> Simulador online <span className="live">LIVE</span></div><button className="user"><span className="avatar">JM</span><span><b>Juan Manuel</b><small>Personal workspace</small></span><span className="more">⌄</span></button></div>
  </aside>;
}

function Node({ className, title, subtitle, icon, children, onPointerDown }) {
  return <div className={`circuit-node ${className}`} onPointerDown={onPointerDown}><div className="node-head"><span className="node-icon">{icon}</span><div><b>{title}</b><small>{subtitle}</small></div><i>•••</i></div>{children}</div>;
}

function Pin({ id, selected, onClick }) {
  return <button className={`connection-pin ${selected ? "selected" : ""}`} title={`Conectar ${id}`} onClick={(event) => { event.stopPropagation(); onClick(id); }} />;
}

function CircuitCanvas({ current, call, destination, zoom, setZoom, wireMode, setWireMode, connections, onPin, selectedPin, placed, setPlaced, selectedComponent, setSelectedComponent }) {
  const columns = Array.from({ length: 30 }, (_, index) => index + 1);
  const angle = -90 + (current - 1) * 60;
  const chips = [
    ["74LS74", "state-chip", 3, 4], ["74LS48", "decode-chip", 14, 4],
    ["74LS48", "decode-chip", 25, 4], ["74LS85", "compare-chip", 36, 4],
    ["74LS85", "compare-chip", 47, 4], ["74LS153", "mux-chip", 58, 4],
  ];
  const HoleGroup = ({ side }) => <div className={`hole-groups ${side}`}>{columns.map((column) => <div className="hole-column" key={column}>{Array.from({ length: 5 }, (_, hole) => <span key={hole} />)}</div>)}</div>;
  const Chip = ({ name, tone, column, row }) => <div className={`tink-chip ${tone}`} style={{ left: `${column * 14 + 46}px`, top: `${row * 30 + 132}px` }}><i className="chip-notch" /><b>{name}</b><div className="chip-legs top">{Array.from({ length: 7 }, (_, index) => <span key={index} />)}</div><div className="chip-legs bottom">{Array.from({ length: 7 }, (_, index) => <span key={index} />)}</div></div>;
  return <section className="canvas-wrap">
    <div className="canvas-toolbar"><div className="tool-group"><button className={`tool ${!wireMode ? "active" : ""}`} onClick={() => setWireMode(false)}>↖ <span>Seleccionar</span></button><button className={`tool ${wireMode ? "active" : ""}`} onClick={() => setWireMode(true)}>⌁ <span>Cablear</span></button><button className="tool">✥ <span>Mover lienzo</span></button></div><div className="canvas-controls"><button onClick={() => setZoom(Math.max(70, zoom - 10))}>−</button><span>{zoom}%</span><button onClick={() => setZoom(Math.min(140, zoom + 10))}>＋</button><span className="divider" /><button onClick={() => setZoom(100)}>⌗ Ajustar</button></div></div>
    <div className="canvas tink-workspace" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const data = JSON.parse(event.dataTransfer.getData("component") || "{}"); if (!data.label) return; const rect = event.currentTarget.getBoundingClientRect(); setPlaced((items) => [...items, { id: `${data.id}-${Date.now()}`, ...data, x: event.clientX - rect.left, y: event.clientY - rect.top }]); }}>
      <div className="tink-header"><div><b>Ascensor digital</b><span>Diseño físico · protoboard</span></div><div className="tink-status"><span /> Guardado ahora</div></div>
      <div className="tink-stage clean-stage">
        <div className="empty-workspace">
          {!placed.length && <div className="empty-workspace-copy"><b>Lienzo vacío</b><span>Arrastra componentes desde la biblioteca para comenzar</span></div>}
          {placed.map((item) => <DraggableComponent key={item.id} item={item} selected={selectedComponent === item.id} onSelect={() => setSelectedComponent(item.id)} onMove={(x, y) => setPlaced((items) => items.map((entry) => entry.id === item.id ? { ...entry, x, y } : entry))} />)}
        </div>
      </div>
      <div className={`connection-help ${wireMode ? "visible" : ""}`}>{wireMode ? "Selecciona dos contactos para conectar" : "Arrastra componentes desde la biblioteca y conéctalos por sus contactos"}</div>
    </div>
  </section>;
}

function DraggableComponent({ item, selected, onSelect, onMove }) {
  const start = useRef(null);
  const handlePointerDown = (event) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    start.current = { x: event.clientX - item.x, y: event.clientY - item.y };
  };
  const handlePointerMove = (event) => {
    if (start.current) onMove(event.clientX - start.current.x, event.clientY - start.current.y);
  };
  const handlePointerUp = () => { start.current = null; };
  if (item.kind === "breadboard") {
    const columns = Array.from({ length: 30 }, (_, index) => index + 1);
    const holes = (prefix) => columns.map((column) => <div className="breadboard-column" key={`${prefix}-${column}`}>{Array.from({ length: 5 }, (_, hole) => <span key={hole} />)}</div>);
    return <div className={`placed-component breadboard-instance ${selected ? "selected" : ""}`} style={{ left: item.x, top: item.y, transform: `rotate(${item.rotation || 0}deg)` }} onClick={(event) => { event.stopPropagation(); onSelect(); }} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
      <div className="breadboard-rail breadboard-rail-top"><b>+</b><span /> <b>−</b></div>
      <div className="breadboard-scale">{columns.filter((column) => column % 5 === 0).map((column) => <b key={column}>{column}</b>)}</div>
      <div className="breadboard-bank breadboard-bank-upper"><span className="breadboard-label">a&nbsp; b&nbsp; c&nbsp; d&nbsp; e</span>{holes("upper")}</div>
      <div className="breadboard-channel" />
      <div className="breadboard-bank breadboard-bank-lower"><span className="breadboard-label">f&nbsp; g&nbsp; h&nbsp; i&nbsp; j</span>{holes("lower")}</div>
      <div className="breadboard-rail breadboard-rail-bottom"><b>+</b><span /> <b>−</b></div>
    </div>;
  }
  return <div className={`placed-component ${selected ? "selected" : ""}`} style={{ left: item.x, top: item.y, transform: `rotate(${item.rotation || 0}deg)` }} onClick={(event) => { event.stopPropagation(); onSelect(); }} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}><Icon tone="logic-glyph">{item.glyph}</Icon><b>{item.label}</b><small>{item.part}</small></div>;
}

function Inspector({ current, call, destination, setCall, setDestination, run, running, progress, mode, setMode }) {
  return <aside className="inspector"><div className="inspector-head"><div><span className="eyebrow">SIMULACIÓN</span><h2>Control del ascensor</h2></div><button className="close-inspector">×</button></div><div className="mode-card"><div className="mode-title"><span className="pulse" /> Modo {mode === "normal" ? "normal" : "accesible"} <span className="chevron">⌄</span></div><p>Selecciona una llamada y un destino para ejecutar la secuencia.</p><div className="mode-switch">{["normal", "accesible"].map((item) => <button key={item} className={`mode-option ${mode === item ? "active" : ""}`} onClick={() => setMode(item)}>{item[0].toUpperCase() + item.slice(1)}</button>)}</div></div>
    <FloorPicker label="Piso de llamada" value={call} onChange={setCall} /><FloorPicker label="Piso de destino" value={destination} onChange={setDestination} />
    <div className="route-preview"><RoutePoint label="ACTUAL" value={current} tone="current-dot" /><div className="route-line"><i /><i /><i /></div><RoutePoint label="LLAMADA" value={call} tone="call-dot" /><div className="route-line dashed" /><RoutePoint label="DESTINO" value={destination} tone="destination-dot" /></div>
    <button className="run-simulation" onClick={run} disabled={running}><span>{running ? "◌" : "▶"}</span> {running ? "Ejecutando..." : "Ejecutar secuencia"}</button><div className="sequence-status"><div className="inspector-label">Estado de secuencia <span className="state-chip">{running ? "EN CURSO" : progress === 100 ? "COMPLETADO" : "LISTO"}</span></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><div className="sequence-steps"><div className="step done"><span>✓</span><div><b>Piso actual</b><small>Inicializado en piso {current}</small></div></div><div className="step active"><span>2</span><div><b>Ir a llamada</b><small>{running ? `Moviendo hacia piso ${call}` : "Esperando ejecución"}</small></div></div><div className="step"><span>3</span><div><b>Ir a destino</b><small>Bloqueado hasta confirmar llamada</small></div></div></div></div><div className="arduino-card"><div className="arduino-icon">⌁</div><div><b>Arduino conectado</b><small>Control de CLK · Servo · MUX</small></div><span className="connected-dot" /></div></aside>;
}

function FloorPicker({ label, value, onChange }) { return <div className="inspector-section"><div className="inspector-label">{label} <span className="required">REQUERIDO</span></div><div className="floor-select">{[1, 2, 3, 4].map((floor) => <button key={floor} className={value === floor ? "active" : ""} onClick={() => onChange(floor)}>{floor}</button>)}</div></div>; }
function RoutePoint({ label, value, tone }) { return <div className="route-point"><span className={`route-dot ${tone}`} /><div><small>{label}</small><b>Piso {value}</b></div></div>; }

export default function App() {
  const [current, setCurrent] = useState(1);
  const [call, setCall] = useState(3);
  const [destination, setDestination] = useState(4);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(33);
  const [zoom, setZoom] = useState(100);
  const [mode, setMode] = useState("normal");
  const [search, setSearch] = useState("");
  const [wireMode, setWireMode] = useState(false);
  const [selectedPin, setSelectedPin] = useState(null);
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const [connections, setConnections] = useState(() => JSON.parse(localStorage.getItem("circuitsim-connections") || "[]"));
  const timer = useRef(null);
  const logs = useMemo(() => [`Comparando piso actual ${bits(current)} con destino ${bits(destination)}...`, `Registro de llamada actualizado Q = ${bits(call)}`], [current, call, destination]);

  useEffect(() => () => clearInterval(timer.current), []);
  function connectPin(pin) {
    if (!wireMode) return;
    if (!selectedPin) {
      setSelectedPin(pin);
      return;
    }
    if (selectedPin === pin) {
      setSelectedPin(null);
      return;
    }
    const id = `${selectedPin}-${pin}`;
    const point = (value) => {
      const index = Number(value.split(":")[1] || 0);
      return { x: 90 + (index % 30) * 28, y: 80 + Math.floor(index / 30) * 20 };
    };
    const first = point(selectedPin);
    const second = point(pin);
    setConnections((items) => [...items, { id, from: selectedPin, to: pin, path: `M${first.x} ${first.y} C${first.x + 70} ${first.y} ${second.x - 70} ${second.y} ${second.x} ${second.y}` }]);
    setSelectedPin(null);
  }
  function run() {
    if (running) return;
    setRunning(true); setProgress(50);
    let floor = current;
    const target = call;
    timer.current = setInterval(() => {
      if (floor === target) {
        clearInterval(timer.current);
        setProgress(72);
        setTimeout(() => {
          let next = floor;
          timer.current = setInterval(() => {
            if (next === destination) { clearInterval(timer.current); setRunning(false); setProgress(100); return; }
            next += next < destination ? 1 : -1; floor = next; setCurrent(next);
          }, 600);
        }, 500);
        return;
      }
      floor += floor < target ? 1 : -1; setCurrent(floor);
    }, 600);
  }
  const [placed, setPlaced] = useState(() => JSON.parse(localStorage.getItem("circuitsim-placed") || "[]"));
  const [selectedComponent, setSelectedComponent] = useState(null);
  function commitPlaced(update) {
    setPlaced((previous) => {
      const next = typeof update === "function" ? update(previous) : update;
      if (JSON.stringify(previous) === JSON.stringify(next)) return previous;
      setPast((items) => [...items, previous].slice(-50));
      setFuture([]);
      return next;
    });
  }
  function addComponent(item) {
    commitPlaced((items) => [...items, { ...item, id: `${item.id}-${Date.now()}`, x: item.kind === "breadboard" ? 24 : 180 + (items.length % 5) * 105, y: item.kind === "breadboard" ? 64 : 180 + Math.floor(items.length / 5) * 70, rotation: 0 }]);
  }
  function undo() {
    setPast((items) => {
      if (!items.length) return items;
      const previous = items[items.length - 1];
      setFuture((redo) => [placed, ...redo].slice(0, 50));
      setPlaced(previous);
      return items.slice(0, -1);
    });
    setSelectedComponent(null);
  }
  function redo() {
    setFuture((items) => {
      if (!items.length) return items;
      const next = items[0];
      setPast((history) => [...history, placed].slice(-50));
      setPlaced(next);
      return items.slice(1);
    });
  }
  function deleteSelected() {
    if (selectedComponent) {
      commitPlaced((items) => items.filter((item) => item.id !== selectedComponent));
      setSelectedComponent(null);
    }
  }
  function duplicateSelected() {
    const source = placed.find((item) => item.id === selectedComponent);
    if (!source) return;
    const copy = { ...source, id: `${source.id}-copy-${Date.now()}`, x: source.x + 24, y: source.y + 24 };
    commitPlaced((items) => [...items, copy]);
    setSelectedComponent(copy.id);
  }
  function rotateSelected() {
    if (selectedComponent) commitPlaced((items) => items.map((item) => item.id === selectedComponent ? { ...item, rotation: (item.rotation || 0) + 90 } : item));
  }
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.target.matches("input,textarea")) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); event.shiftKey ? redo() : undo(); }
      else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") { event.preventDefault(); redo(); }
      else if (event.key === "Delete" || event.key === "Backspace") deleteSelected();
      else if (event.key.toLowerCase() === "r") rotateSelected();
      else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") { event.preventDefault(); duplicateSelected(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });
  useEffect(() => localStorage.setItem("circuitsim-placed", JSON.stringify(placed)), [placed]);
  useEffect(() => localStorage.setItem("circuitsim-connections", JSON.stringify(connections)), [connections]);
  const selected = placed.find((item) => item.id === selectedComponent);
  const diagnostics = validateElectricalConnections(connections);
  const digitalSimulation = simulateDigitalCircuit({ connections, cycles: running ? 1 : 0 });
  const validation = connections.length === 0 ? "Sin conexiones añadidas" : diagnostics.length ? "Advertencia: posible cortocircuito de alimentación" : "Conexiones sin cortocircuitos detectados";
  return <div className="app-shell"><Sidebar search={search} setSearch={setSearch} onComponent={addComponent} /><main className="workspace"><header className="topbar"><div className="breadcrumbs"><span>Mis proyectos</span><b>/</b><strong>Ascensor 4 pisos</strong><span className="saved">● Guardado ahora</span></div><div className="top-actions"><button className="icon-button" onClick={undo} title="Deshacer">↶</button><button className="icon-button" onClick={redo} title="Rehacer">↷</button><span className="divider" /><button className="ghost-button">Compartir</button><button className="primary-button" onClick={run}><span>▶</span> Simular</button></div></header><CircuitCanvas current={current} call={call} destination={destination} zoom={zoom} setZoom={setZoom} wireMode={wireMode} setWireMode={(enabled) => { setWireMode(enabled); setSelectedPin(null); }} connections={connections} onPin={connectPin} selectedPin={selectedPin} placed={placed} setPlaced={setPlaced} selectedComponent={selectedComponent} setSelectedComponent={setSelectedComponent} /><section className="bottom-panel"><div className="panel-tabs"><button className="panel-tab active">Consola</button><button className="panel-tab">Propiedades</button><span className="panel-expand">⌃</span></div><div className="console">{logs.map((log) => <div className="console-line" key={log}><span className="console-time">10:03:21</span><span className="console-info">●</span> {log}</div>)}<div className="console-line"><span className="console-info">●</span> {validation}</div><div className="console-line"><span className="console-info">●</span> Motor digital: {digitalSimulation.nodes.length} nodos, {digitalSimulation.diagnostics.length} conflictos</div>{selected && <div className="console-line"><span className="console-ok">✓</span> Seleccionado: <b>{selected.label}</b> · posición {Math.round(selected.x)}, {Math.round(selected.y)}</div>}<div className="console-cursor">_</div></div></section></main><Inspector current={current} call={call} destination={destination} setCall={setCall} setDestination={setDestination} run={run} running={running} progress={progress} mode={mode} setMode={setMode} /></div>;
}
