import { useEffect, useMemo, useRef, useState } from "react";

const components = [
  ["Entradas", [["pushbutton", "●", "Pushbutton", "IN"], ["switch", "↔", "Switch", "IN"], ["clock", "◷", "Clock", "CLK"]]],
  ["Lógica", [["and", "∧", "AND gate", "74LS08"], ["or", "≥1", "OR gate", "74LS32"], ["xor", "⊻", "XOR gate", "74LS86"], ["not", "¬", "NOT gate", "74LS04"], ["mux", "▱", "Multiplexer", "74LS153"]]],
  ["Memoria & salida", [["flipflop", "D", "Flip-Flop D", "74LS74"], ["display", "▦", "7-segment", "74LS48"], ["led", "✦", "LED", "OUT"], ["servo", "⌁", "Servo SG90", "OUT"]]],
  ["Control físico", [["arduino", "A", "Arduino", "MCU"], ["raspberry", "π", "Raspberry Pi", "HOST"], ["camera", "◉", "ESP32-CAM", "CAM"], ["speaker", "♫", "Parlante", "AUDIO"]]],
];
const bits = (floor) => (floor - 1).toString(2).padStart(2, "0");

function Icon({ children, tone = "" }) {
  return <span className={`component-glyph ${tone}`}>{children}</span>;
}

function Sidebar({ onComponent, search, setSearch }) {
  return <aside className="sidebar">
    <div className="brand"><div className="brand-mark"><span /><span /><span /></div><div><strong>Circuit<span>Lab</span></strong><small>Digital circuit studio</small></div></div>
    <div className="sidebar-section"><div className="section-label">Proyecto</div><button className="project-card active"><span className="project-icon">⌁</span><span><b>Ascensor 4 pisos</b><small>Simulación principal</small></span><i>•••</i></button><button className="new-project"><span>＋</span> Nuevo proyecto</button></div>
    <div className="sidebar-section library"><div className="section-label">Biblioteca <kbd>⌘ K</kbd></div><label className="search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar componente..." /></label>
      {components.map(([group, items]) => <div className="library-group" key={group}><div className="group-title">{group} <span>⌃</span></div>{items.filter(([, , label]) => label.toLowerCase().includes(search.toLowerCase())).map(([id, glyph, label, part]) =>       <button className="library-item" draggable onDragStart={(event) => event.dataTransfer.setData("component", JSON.stringify({ id, label, part, glyph }))} key={id} onClick={() => onComponent(label)}><Icon tone={group === "Entradas" ? "input-glyph" : group === "Lógica" ? "logic-glyph" : "output-glyph"}>{glyph}</Icon>{label}<em>{part}</em></button>)}</div>)}
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
  const columns = Array.from({ length: 60 }, (_, index) => index + 1);
  const angle = -90 + (current - 1) * 60;
  const chips = [
    ["74LS74", "state-chip", 13, 3], ["74LS48", "decode-chip", 31, 3],
    ["74LS48", "decode-chip", 43, 3], ["74LS85", "compare-chip", 22, 8],
    ["74LS85", "compare-chip", 35, 8], ["74LS153", "mux-chip", 48, 8],
  ];
  const HoleGroup = ({ side }) => <div className={`hole-groups ${side}`}>{Array.from({ length: 12 }, (_, group) => <div className="hole-group" key={group}>{Array.from({ length: 5 }, (_, hole) => <span key={hole} />)}</div>)}</div>;
  const Chip = ({ name, tone, column, row }) => <div className={`tink-chip ${tone}`} style={{ left: `${column * 14 + 46}px`, top: `${row * 30 + 132}px` }}><i className="chip-notch" /><b>{name}</b><div className="chip-legs top">{Array.from({ length: 7 }, (_, index) => <span key={index} />)}</div><div className="chip-legs bottom">{Array.from({ length: 7 }, (_, index) => <span key={index} />)}</div></div>;
  return <section className="canvas-wrap">
    <div className="canvas-toolbar"><div className="tool-group"><button className={`tool ${!wireMode ? "active" : ""}`} onClick={() => setWireMode(false)}>↖ <span>Seleccionar</span></button><button className={`tool ${wireMode ? "active" : ""}`} onClick={() => setWireMode(true)}>⌁ <span>Cablear</span></button><button className="tool">✥ <span>Mover lienzo</span></button></div><div className="canvas-controls"><button onClick={() => setZoom(Math.max(70, zoom - 10))}>−</button><span>{zoom}%</span><button onClick={() => setZoom(Math.min(140, zoom + 10))}>＋</button><span className="divider" /><button onClick={() => setZoom(100)}>⌗ Ajustar</button></div></div>
    <div className="canvas tink-workspace" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const data = JSON.parse(event.dataTransfer.getData("component") || "{}"); if (!data.label) return; const rect = event.currentTarget.getBoundingClientRect(); setPlaced((items) => [...items, { id: `${data.id}-${Date.now()}`, ...data, x: event.clientX - rect.left, y: event.clientY - rect.top }]); }}>
      <div className="tink-header"><div><b>Ascensor digital</b><span>Diseño físico · protoboard</span></div><div className="tink-status"><span /> Guardado ahora</div></div>
      <div className="tink-stage"><div className="tink-board">
        <div className="board-rail rail-top"><b>+</b>{columns.map((column) => <i key={column} />)}<b>−</b></div>
        <div className="board-rail rail-bottom"><b>+</b>{columns.map((column) => <i key={column} />)}<b>−</b></div>
        <div className="board-scale top">{columns.filter((column) => column % 5 === 0).map((column) => <b key={column}>{column}</b>)}</div>
        <HoleGroup side="upper" /><HoleGroup side="lower" /><div className="tink-channel" />
        <div className="board-markers upper-marker">a&nbsp; b&nbsp; c&nbsp; d&nbsp; e</div><div className="board-markers lower-marker">f&nbsp; g&nbsp; h&nbsp; i&nbsp; j</div>
        <div className="floor-switch">{[1, 2, 3, 4].map((floor) => <button className={call === floor ? "on" : ""} key={floor} onClick={() => onPin(`floor:${floor}`)}>{floor}</button>)}</div>
        <div className="seven-segment call-seven">{call}</div><div className="seven-segment destination-seven">{destination}</div>
        {chips.map(([name, tone, column, row]) => <Chip key={`${name}-${column}`} name={name} tone={tone} column={column} row={row} />)}
        <div className="led-strip">{[1, 2, 3, 4].map((floor) => <div key={floor}><span className={current === floor ? "lit" : ""} /><small>P{floor}</small></div>)}</div>
        <div className="resistor-strip">{[1, 2, 3, 4, 5].map((item) => <span key={item}><i />220Ω<i /></span>)}</div>
        <div className="arduino-mini"><b>ARDUINO UNO</b><small>CONTROL</small><div>{Array.from({ length: 8 }, (_, index) => <i key={index} />)}</div></div>
        <div className="servo-mini"><span className="servo-knob" style={{ transform: `rotate(${angle}deg)` }} /><b>SG90</b></div>
        <svg className="tink-wires" viewBox="0 0 980 560" preserveAspectRatio="none"><path className="wire-red" d="M120 115 C155 90 190 90 225 115" /><path className="wire-blue" d="M240 115 C290 75 330 75 380 115" /><path className="wire-yellow" d="M425 115 C470 95 505 95 545 115" /><path className="wire-green" d="M300 355 C350 385 390 385 430 355" /><path className="wire-purple" d="M520 355 C570 395 620 395 675 355" />{connections.map((connection) => <path key={connection.id} d={connection.path} className="wire-cyan" />)}</svg>
        <div className="tink-contact-overlay">{Array.from({ length: 120 }, (_, index) => <button key={index} className={`tink-contact ${selectedPin === `contact:${index}` ? "selected" : ""}`} onClick={() => onPin(`contact:${index}`)} title={`Contacto ${index + 1}`} />)}</div>
        {placed.map((item) => <DraggableComponent key={item.id} item={item} selected={selectedComponent === item.id} onSelect={() => setSelectedComponent(item.id)} onMove={(x, y) => setPlaced((items) => items.map((entry) => entry.id === item.id ? { ...entry, x, y } : entry))} />)}
      </div></div>
      <div className={`connection-help ${wireMode ? "visible" : ""}`}>{wireMode ? "Selecciona dos contactos para conectar" : "Arrastra componentes desde la biblioteca y conéctalos por sus contactos"}</div>
    </div>
  </section>;
}

function DraggableComponent({ item, selected, onSelect, onMove }) {
  const start = useRef(null);
  return <div className={`placed-component ${selected ? "selected" : ""}`} style={{ left: item.x, top: item.y }} onClick={(event) => { event.stopPropagation(); onSelect(); }} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); start.current = { x: event.clientX - item.x, y: event.clientY - item.y }; }} onPointerMove={(event) => { if (start.current) onMove(event.clientX - start.current.x, event.clientY - start.current.y); }} onPointerUp={() => { start.current = null; }}><Icon tone="logic-glyph">{item.glyph}</Icon><b>{item.label}</b><small>{item.part}</small></div>;
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
  useEffect(() => localStorage.setItem("circuitsim-placed", JSON.stringify(placed)), [placed]);
  useEffect(() => localStorage.setItem("circuitsim-connections", JSON.stringify(connections)), [connections]);
  const selected = placed.find((item) => item.id === selectedComponent);
  const validation = connections.length === 0 ? "Sin conexiones añadidas" : connections.some((wire) => wire.from.includes("5V") && wire.to.includes("GND")) || connections.some((wire) => wire.from.includes("GND") && wire.to.includes("5V")) ? "Advertencia: posible cortocircuito 5V-GND" : "Conexiones sin cortocircuitos detectados";
  return <div className="app-shell"><Sidebar search={search} setSearch={setSearch} onComponent={(name) => console.info(`${name} seleccionado`)} /><main className="workspace"><header className="topbar"><div className="breadcrumbs"><span>Mis proyectos</span><b>/</b><strong>Ascensor 4 pisos</strong><span className="saved">● Guardado ahora</span></div><div className="top-actions"><button className="icon-button">↶</button><button className="icon-button">↷</button><span className="divider" /><button className="ghost-button">Compartir</button><button className="primary-button" onClick={run}><span>▶</span> Simular</button></div></header><CircuitCanvas current={current} call={call} destination={destination} zoom={zoom} setZoom={setZoom} wireMode={wireMode} setWireMode={(enabled) => { setWireMode(enabled); setSelectedPin(null); }} connections={connections} onPin={connectPin} selectedPin={selectedPin} placed={placed} setPlaced={setPlaced} selectedComponent={selectedComponent} setSelectedComponent={setSelectedComponent} /><section className="bottom-panel"><div className="panel-tabs"><button className="panel-tab active">Consola</button><button className="panel-tab">Propiedades</button><span className="panel-expand">⌃</span></div><div className="console">{logs.map((log) => <div className="console-line" key={log}><span className="console-time">10:03:21</span><span className="console-info">●</span> {log}</div>)}<div className="console-line"><span className="console-info">●</span> {validation}</div>{selected && <div className="console-line"><span className="console-ok">✓</span> Seleccionado: <b>{selected.label}</b> · posición {Math.round(selected.x)}, {Math.round(selected.y)}</div>}<div className="console-cursor">_</div></div></section></main><Inspector current={current} call={call} destination={destination} setCall={setCall} setDestination={setDestination} run={run} running={running} progress={progress} mode={mode} setMode={setMode} /></div>;
}
