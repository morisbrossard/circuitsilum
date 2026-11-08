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
      {components.map(([group, items]) => <div className="library-group" key={group}><div className="group-title">{group} <span>⌃</span></div>{items.filter(([, , label]) => label.toLowerCase().includes(search.toLowerCase())).map(([id, glyph, label, part]) => <button className="library-item" key={id} onClick={() => onComponent(label)}><Icon tone={group === "Entradas" ? "input-glyph" : group === "Lógica" ? "logic-glyph" : "output-glyph"}>{glyph}</Icon>{label}<em>{part}</em></button>)}</div>)}
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

function CircuitCanvas({ current, call, destination, zoom, setZoom, wireMode, setWireMode, connections, onPin, selectedPin }) {
  const holes = Array.from({ length: 28 }, (_, index) => index);
  const angle = -90 + (current - 1) * 60;
  return <section className="canvas-wrap"><div className="canvas-toolbar"><div className="tool-group"><button className={`tool ${!wireMode ? "active" : ""}`} onClick={() => setWireMode(false)}>↖ <span>Seleccionar</span></button><button className={`tool ${wireMode ? "active" : ""}`} onClick={() => setWireMode(true)}>⌁ <span>Cablear</span></button><button className="tool">✥ <span>Mover lienzo</span></button></div><div className="canvas-controls"><button onClick={() => setZoom(Math.max(70, zoom - 10))}>−</button><span>{zoom}%</span><button onClick={() => setZoom(Math.min(140, zoom + 10))}>＋</button><span className="divider" /><button onClick={() => setZoom(100)}>⌗ Ajustar</button></div></div>
    <div className="canvas breadboard-canvas"><div className="breadboard-title"><b>PROYECTO: ASCENSOR DIGITAL</b><span>Prototipo físico · vista de conexiones</span></div><div className="breadboard"><div className="power-rail positive">+</div><div className="power-rail negative">−</div><div className="hole-field">{[0, 1, 2, 3, 4, 5].map((row) => <div className="hole-row" key={row}>{holes.map((hole) => <i key={hole} />)}</div>)}</div><div className="center-groove" /><div className="hole-field lower">{[0, 1, 2, 3, 4, 5].map((row) => <div className="hole-row" key={row}>{holes.map((hole) => <i key={hole} />)}</div>)}</div>
      <div className="component-label label-chip">74HC74 <small>FLIP-FLOP D</small></div><div className="dip-chip dip-74hc"><b>74HC74</b><span>●</span>{Array.from({ length: 14 }, (_, index) => <i key={index} />)}</div>
      <div className="component-label label-comparator">74LS85 <small>COMPARADOR</small></div><div className="dip-chip dip-74ls"><b>74LS85</b><span>●</span>{Array.from({ length: 16 }, (_, index) => <i key={index} />)}</div>
      <div className="component-label label-registers">REGISTROS DE PISO · 6 FLIP-FLOPS D</div><div className="chip-row register-row">{["ACT Q0", "ACT Q1", "CALL Q0", "CALL Q1", "DEST Q0", "DEST Q1"].map((label) => <div className="mini-chip" key={label}><b>74LS74</b><small>{label}</small><span>●</span></div>)}</div>
      <div className="component-label label-decoders">DECODIFICACIÓN Y DISPLAY</div><div className="chip-row decoder-row">{["CALL", "DEST"].map((label) => <div className="decoder-unit" key={label}><div className="mini-chip"><b>74LS48</b><small>{label}</small><span>●</span></div><div className="seven-display">{label === "CALL" ? call : destination}</div></div>)}</div>
      <div className="component-label label-mux">SELECCIÓN NORMAL / ACCESIBLE</div><div className="chip-row mux-row">{["MUX LLAMADA", "MUX DESTINO"].map((label) => <div className="mini-chip mux-chip" key={label}><b>74LS153</b><small>{label}</small><span>●</span></div>)}</div>
      <div className="component-label label-comparators">DIRECCIÓN DE MOVIMIENTO</div><div className="chip-row comparator-row">{["ACTUAL → LLAMADA", "ACTUAL → DESTINO"].map((label) => <div className="mini-chip comparator-chip" key={label}><b>74LS85</b><small>{label}</small><span>●</span></div>)}</div>
      <div className="component-label label-switch">ENTRADA DE PISO</div><div className="dip-switch">{[1, 2, 3, 4].map((item) => <div className="switch-bit" key={item}><span className={call === item ? "on" : ""} /> <b>{item}</b></div>)}</div>
      <div className="led-bank">{[1, 2, 3, 4].map((item) => <div className="led-unit" key={item}><span className={`led-bulb ${current === item ? "lit" : ""}`} /><small>P{item}</small></div>)}</div>
      <div className="direction-leds"><div><span className={`led-bulb direction-up ${current < destination ? "lit" : ""}`} /><small>SUBIDA</small></div><div><span className={`led-bulb direction-down ${current > destination ? "lit" : ""}`} /><small>BAJADA</small></div><div><span className={`led-bulb direction-stop ${current === destination ? "lit" : ""}`} /><small>PARAR</small></div></div>
      <div className="resistor-bank">{[1, 2, 3, 4, 5, 6].map((item) => <div className="resistor" key={item}><span /><b>220Ω</b><span /></div>)}</div>
      <div className="wire-bundle"><span className="jumper blue" /><span className="jumper orange" /><span className="jumper yellow" /><span className="jumper green" /><span className="jumper red" /></div>
      <div className="component-label label-arduino">CONTROL FÍSICO</div><div className="micro-board arduino-board"><b>ARDUINO</b><small>CLK · MUX · SERVO</small><div className="header-pins">{Array.from({ length: 10 }, (_, index) => <i key={index} />)}</div></div>
      <div className="micro-board raspberry-board"><b>RASPBERRY PI</b><small>USB · AUDIO</small><div className="header-pins">{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</div></div>
      <div className="camera-board"><span>◉</span><b>ESP32-CAM</b><small>VIDEO USB</small></div><div className="speaker-board">♫ <small>PARLANTE</small></div>
      <div className="servo-board"><span className="servo-knob" style={{ transform: `rotate(${angle}deg)` }} /><b>SG90</b><small>SERVO · {angle}°</small></div>
      <svg className="board-wires" viewBox="0 0 1200 900" preserveAspectRatio="none"><path d="M90 105 C170 160 170 210 280 250" className="board-wire red-wire" /><path d="M210 155 C310 150 280 350 410 385" className="board-wire blue-wire" /><path d="M335 120 C450 155 470 235 560 280" className="board-wire yellow-wire" /><path d="M415 510 C520 460 570 430 710 445" className="board-wire green-wire" /><path d="M720 390 C820 330 890 310 990 340" className="board-wire orange-wire" />{connections.map((connection) => <path key={connection.id} d={connection.path} className="board-wire cyan-wire" />)}</svg>
      <div className={`connection-help ${wireMode ? "visible" : ""}`}>{wireMode ? "Selecciona dos pines para crear una conexión física" : "Cableado visible · activa Cablear para añadir conexiones"}</div>
    </div></div></section>;
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
  const [connections, setConnections] = useState([]);
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
    setConnections((items) => [...items, { id, path: "M880 670 C930 670 940 730 1000 730" }]);
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
  return <div className="app-shell"><Sidebar search={search} setSearch={setSearch} onComponent={(name) => console.info(`${name} seleccionado`)} /><main className="workspace"><header className="topbar"><div className="breadcrumbs"><span>Mis proyectos</span><b>/</b><strong>Ascensor 4 pisos</strong><span className="saved">● Guardado ahora</span></div><div className="top-actions"><button className="icon-button">↶</button><button className="icon-button">↷</button><span className="divider" /><button className="ghost-button">Compartir</button><button className="primary-button" onClick={run}><span>▶</span> Simular</button></div></header><CircuitCanvas current={current} call={call} destination={destination} zoom={zoom} setZoom={setZoom} wireMode={wireMode} setWireMode={(enabled) => { setWireMode(enabled); setSelectedPin(null); }} connections={connections} onPin={connectPin} selectedPin={selectedPin} /><section className="bottom-panel"><div className="panel-tabs"><button className="panel-tab active">Consola</button><button className="panel-tab">Propiedades</button><button className="panel-tab">Tabla de verdad</button><span className="panel-expand">⌃</span></div><div className="console">{logs.map((log) => <div className="console-line" key={log}><span className="console-time">10:03:21</span><span className="console-info">●</span> {log}</div>)}<div className="console-cursor">_</div></div></section></main><Inspector current={current} call={call} destination={destination} setCall={setCall} setDestination={setDestination} run={run} running={running} progress={progress} mode={mode} setMode={setMode} /></div>;
}
