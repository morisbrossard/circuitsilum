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
  const angle = -90 + (current - 1) * 60;
  return <section className="canvas-wrap"><div className="canvas-toolbar"><div className="tool-group"><button className={`tool ${!wireMode ? "active" : ""}`} onClick={() => setWireMode(false)}>↖ <span>Seleccionar</span></button><button className={`tool ${wireMode ? "active" : ""}`} onClick={() => setWireMode(true)}>⌁ <span>Cablear</span></button><button className="tool">✥ <span>Mover lienzo</span></button></div><div className="canvas-controls"><button onClick={() => setZoom(Math.max(70, zoom - 10))}>−</button><span>{zoom}%</span><button onClick={() => setZoom(Math.min(140, zoom + 10))}>＋</button><span className="divider" /><button onClick={() => setZoom(100)}>⌗ Ajustar</button></div></div>
    <div className="canvas"><div className="canvas-grid" /><svg className="wires" viewBox="0 0 1200 900" preserveAspectRatio="none"><path d="M264 192 C330 192 329 192 392 192" className="wire active-wire" /><path d="M264 269 C330 269 330 269 392 269" className="wire active-wire" /><path d="M516 230 C585 230 585 210 652 210" className="wire active-wire" /><path d="M771 250 C828 250 828 250 886 250" className="wire active-wire" />{connections.map((connection) => <path key={connection.id} d={connection.path} className="wire physical-wire" />)}</svg>
      <div className="canvas-label label-inputs">PISO DE LLAMADA <span>2-bit input</span></div><div className="canvas-label label-logic">LÓGICA DE CONTROL</div><div className="canvas-label label-output">ESTADO Y SALIDA</div>
      <Node className="node-buttons" title="Pushbuttons" subtitle="Entrada de piso" icon="▦"><div className="node-body button-stack">{[1, 2, 3, 4].map((floor) => <button key={floor} className={`floor-btn ${call === floor ? "selected" : ""}`}><span className="tiny-led" /> Piso {floor}<b>{bits(floor)}</b></button>)}</div></Node>
      <Node className="node-or" title="OR gates" subtitle="Codificador de piso" icon="≥1"><div className="node-body gate-body"><div><span className="signal-line" /><strong>Q0</strong><small>2 OR 4</small><span className="output-dot active" /></div><div><span className="signal-line" /><strong>Q1</strong><small>3 OR 4</small><span className="output-dot" /></div></div></Node>
      <Node className="node-register" title="Registro de llamada" subtitle="74LS74 · 2-bit" icon="D"><div className="node-body register-body"><div className="register-bit"><b>D0</b><span className="bit active">{bits(call)[1]}</span><small>Q0</small></div><div className="register-bit"><b>D1</b><span className="bit">{bits(call)[0]}</span><small>Q1</small></div><div className="clock-line">CLK <span>◷</span></div></div></Node>
      <Node className="node-display" title="Display llamada" subtitle="74LS48 · 7-segment" icon="▦"><div className="node-body display-body"><div className="seven-seg"><span className="seg a on" /><span className="seg b on" /><span className="seg c on" /><span className="seg d on" /><span className="seg f on" /><span className="seg g on" /></div><strong>{call}</strong></div></Node>
      <Node className="node-current" title="Piso actual" subtitle="Registro + indicador LED" icon="✦"><div className="node-body current-body"><div className="current-floor"><span className="floor-number">{current}</span><span>PISO<br />ACTUAL</span></div><div className="floor-leds">{[1, 2, 3, 4].map((floor) => <span className={`floor-led ${current === floor ? "on" : ""}`} key={floor}>{floor}</span>)}</div></div></Node>
      <Node className="node-comparator" title="Comparador" subtitle="74LS85 · dirección" icon="≷"><div className="node-body comparator-body"><div className="compare-row"><span>A</span><b>{bits(current)}</b><span className="compare-sign">{current < destination ? "‹" : current > destination ? "›" : "="}</span><b>{bits(destination)}</b><span>B</span></div><div className="direction"><span className={`direction-light up ${current < destination ? "on" : ""}`} /> Subida <span className={`direction-light down ${current > destination ? "on" : ""}`} /> Bajada <span className={`direction-light stop ${current === destination ? "on" : ""}`} /> Parar</div></div></Node>
      <Node className="node-servo" title="Servo motor" subtitle="SG90 · Arduino control" icon="⌁"><div className="node-body servo-body"><div className="servo-visual"><span className="servo-arm" style={{ transform: `rotate(${angle}deg)` }} /><span className="servo-center" /></div><div><b>{angle < 0 ? "−" : ""}{Math.abs(angle)}°</b><small>Posición actual</small></div></div></Node>
      <Node className="node-arduino" title="Arduino" subtitle="Controlador físico" icon="A"><div className="node-body physical-body"><span>CLK · MUX · SERVO</span><div className="pin-row"><Pin id="arduino:5V" selected={selectedPin === "arduino:5V"} onClick={onPin} /><small>5V</small><Pin id="arduino:GND" selected={selectedPin === "arduino:GND"} onClick={onPin} /><small>GND</small><Pin id="arduino:D9" selected={selectedPin === "arduino:D9"} onClick={onPin} /><small>D9</small></div></div></Node>
      <Node className="node-raspberry" title="Raspberry Pi" subtitle="Modo accesible" icon="π"><div className="node-body physical-body"><span>GESTOS · AUDIO</span><div className="pin-row"><Pin id="raspberry:USB" selected={selectedPin === "raspberry:USB"} onClick={onPin} /><small>USB</small><Pin id="raspberry:AUDIO" selected={selectedPin === "raspberry:AUDIO"} onClick={onPin} /><small>AUDIO</small></div></div></Node>
      <Node className="node-camera" title="ESP32-CAM" subtitle="Cámara USB" icon="◉"><div className="node-body physical-body"><span>VIDEO USB</span><div className="pin-row"><Pin id="camera:USB" selected={selectedPin === "camera:USB"} onClick={onPin} /><small>USB</small><Pin id="camera:GND" selected={selectedPin === "camera:GND"} onClick={onPin} /><small>GND</small></div></div></Node>
      <Node className="node-speaker" title="Parlante" subtitle="Salida de audio" icon="♫"><div className="node-body physical-body"><span>AMPLIFICADO</span><div className="pin-row"><Pin id="speaker:IN" selected={selectedPin === "speaker:IN"} onClick={onPin} /><small>IN</small><Pin id="speaker:GND" selected={selectedPin === "speaker:GND"} onClick={onPin} /><small>GND</small></div></div></Node>
      <div className="drop-hint">Arrastra componentes desde la biblioteca para comenzar</div>
      <div className={`connection-help ${wireMode ? "visible" : ""}`}>{wireMode ? "Selecciona dos pines para crear una conexión física" : "Activa Cablear para conectar pines"}</div>
    </div><div className="minimap"><span /><i /></div></section>;
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
