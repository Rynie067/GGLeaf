import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Circle, Clock3, Download, FileDown, ImagePlus, Layers, Pause, Play,
  Plus, Search, Settings2, Sparkles, Square, Trash2, Type, Upload, WandSparkles,
  X, Check, ChevronDown
} from 'lucide-react';

type LayerKind = 'text' | 'rect' | 'circle' | 'image';
type Motion = 'none' | 'fade' | 'slide-up' | 'slide-left' | 'pop' | 'bounce' | 'zoom';
type Layer = {
  id: string;
  kind: LayerKind;
  name: string;
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  fontSize: number;
  fontFamily: string;
  weight: number;
  align: CanvasTextAlign;
  opacity: number;
  rotation: number;
  start: number;
  duration: number;
  motion: Motion;
  stroke: string;
  strokeWidth: number;
  radius: number;
  image?: string;
};
type Project = {
  name: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  background: string;
  transparent: boolean;
};
type Template = { id: string; name: string; category: string; tag: string; description: string; accent: string; layers: Layer[] };

const uid = () => Math.random().toString(36).slice(2, 10);
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const makeLayer = (kind: LayerKind, values: Partial<Layer> = {}): Layer => ({
  id: uid(), kind, name: kind === 'text' ? 'Text layer' : kind === 'rect' ? 'Rectangle' : kind === 'circle' ? 'Circle' : 'Image',
  text: 'Your text', x: 960, y: 540, w: kind === 'text' ? 900 : 420, h: kind === 'text' ? 150 : 220,
  color: '#f7f8fb', fontSize: 104, fontFamily: 'Arial', weight: 800, align: 'center',
  opacity: 1, rotation: 0, start: 0, duration: 5, motion: 'pop', stroke: '#10131a',
  strokeWidth: 0, radius: 34, ...values,
});

const templates: Template[] = [
  { id: 'money', name: 'Money Counter', category: 'Minecraft', tag: 'POPULAR', description: 'A bold cash total reveal', accent: '#69e1a5', layers: [
    makeLayer('rect', { name: 'Counter plate', x: 960, y: 540, w: 810, h: 250, color: '#151c25', radius: 42, motion: 'zoom' }),
    makeLayer('text', { name: 'Label', text: 'BALANCE', x: 960, y: 475, fontSize: 38, color: '#9aa8b9', weight: 700, motion: 'fade' }),
    makeLayer('text', { name: 'Money amount', text: '$100,000,000', x: 960, y: 570, fontSize: 104, color: '#69e1a5', motion: 'bounce', strokeWidth: 0 }),
  ]},
  { id: 'subscribe', name: 'Subscribe Pop-up', category: 'YouTube', tag: 'ESSENTIAL', description: 'A clean subscribe callout', accent: '#ff626d', layers: [
    makeLayer('rect', { name: 'Button', x: 960, y: 540, w: 640, h: 190, color: '#f04452', radius: 42, motion: 'pop' }),
    makeLayer('text', { name: 'Subscribe text', text: 'SUBSCRIBE', x: 960, y: 555, fontSize: 82, color: '#ffffff', motion: 'slide-up' }),
  ]},
  { id: 'kill', name: 'Elimination Counter', category: 'Minecraft', tag: 'GAMING', description: 'A competitive kill counter', accent: '#f6b94b', layers: [
    makeLayer('rect', { name: 'Panel', x: 960, y: 540, w: 530, h: 260, color: '#191b26', radius: 28, motion: 'slide-up' }),
    makeLayer('text', { name: 'KILLS label', text: 'ELIMINATIONS', x: 960, y: 475, fontSize: 34, color: '#f6b94b', motion: 'fade' }),
    makeLayer('text', { name: 'Kill count', text: '25', x: 960, y: 585, fontSize: 130, color: '#ffffff', motion: 'pop' }),
  ]},
  { id: 'lower', name: 'Creator Lower Third', category: 'YouTube', tag: 'CLEAN', description: 'Name and role title card', accent: '#9c8cff', layers: [
    makeLayer('rect', { name: 'Accent bar', x: 490, y: 790, w: 16, h: 190, color: '#9c8cff', radius: 8, motion: 'slide-left' }),
    makeLayer('text', { name: 'Creator name', text: 'RYNIETR', x: 850, y: 760, w: 950, fontSize: 76, align: 'left', color: '#ffffff', motion: 'slide-up' }),
    makeLayer('text', { name: 'Subtitle', text: 'MINECRAFT CREATOR', x: 850, y: 850, w: 950, fontSize: 32, align: 'left', color: '#aab3c2', weight: 600, motion: 'fade' }),
  ]},
  { id: 'rank', name: 'Rank Reveal', category: 'Minecraft', tag: 'NEW', description: 'A dramatic rank announcement', accent: '#70b7ff', layers: [
    makeLayer('circle', { name: 'Glow disc', x: 960, y: 500, w: 370, h: 370, color: '#213d69', motion: 'zoom' }),
    makeLayer('text', { name: 'Rank', text: 'LEGEND', x: 960, y: 510, fontSize: 104, color: '#70b7ff', motion: 'bounce' }),
    makeLayer('text', { name: 'Caption', text: 'NEW RANK UNLOCKED', x: 960, y: 640, fontSize: 30, color: '#ffffff', motion: 'fade' }),
  ]},
  { id: 'intro', name: 'Title Intro', category: 'Intros', tag: 'MOTION', description: 'A bold cinematic title', accent: '#e9a7ff', layers: [
    makeLayer('text', { name: 'Main title', text: 'THE JOURNEY', x: 960, y: 520, fontSize: 116, color: '#ffffff', motion: 'zoom', strokeWidth: 2 }),
    makeLayer('rect', { name: 'Underline', x: 960, y: 625, w: 500, h: 10, color: '#e9a7ff', radius: 6, motion: 'slide-left' }),
  ]},
];

const initialProject: Project = { name: 'Untitled composition', width: 1920, height: 1080, fps: 60, duration: 6, background: '#0d111a', transparent: true };
const initialLayers = templates[0].layers.map((l) => ({ ...l, id: uid() }));

function drawScene(canvas: HTMLCanvasElement, layers: Layer[], project: Project, time: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = project.width, H = project.height;
  if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
  ctx.clearRect(0, 0, W, H);
  if (!project.transparent) { ctx.fillStyle = project.background; ctx.fillRect(0, 0, W, H); }
  for (const layer of layers) {
    const local = time - layer.start;
    if (local < 0 || local > layer.duration) continue;
    const introLength = Math.min(0.72, Math.max(0.18, layer.duration * 0.28));
    const p = clamp(local / introLength, 0, 1);
    let alpha = 1, scale = 1, offsetX = 0, offsetY = 0;
    if (layer.motion === 'fade') alpha = p;
    if (layer.motion === 'slide-up') { alpha = p; offsetY = (1 - p) * 120; }
    if (layer.motion === 'slide-left') { alpha = p; offsetX = (1 - p) * 160; }
    if (layer.motion === 'pop') { alpha = p; scale = 0.72 + 0.28 * p; }
    if (layer.motion === 'zoom') { alpha = p; scale = 0.45 + 0.55 * p; }
    if (layer.motion === 'bounce') { alpha = p; scale = p < 1 ? 0.55 + 0.45 * (1 - Math.pow(1 - p, 2) * Math.cos(p * Math.PI * 3)) : 1; }
    const fadeOut = clamp((layer.duration - local) / 0.18, 0, 1);
    ctx.save();
    ctx.globalAlpha = layer.opacity * alpha * fadeOut;
    ctx.translate(layer.x + offsetX, layer.y + offsetY);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    if (layer.kind === 'rect' || layer.kind === 'circle') {
      ctx.fillStyle = layer.color;
      ctx.beginPath();
      if (layer.kind === 'circle') ctx.ellipse(0, 0, layer.w / 2, layer.h / 2, 0, 0, Math.PI * 2);
      else {
        const x = -layer.w / 2, y = -layer.h / 2, r = Math.min(layer.radius, layer.w / 2, layer.h / 2);
        ctx.moveTo(x + r, y); ctx.arcTo(x + layer.w, y, x + layer.w, y + layer.h, r);
        ctx.arcTo(x + layer.w, y + layer.h, x, y + layer.h, r);
        ctx.arcTo(x, y + layer.h, x, y, r); ctx.arcTo(x, y, x + layer.w, y, r); ctx.closePath();
      }
      ctx.fill();
      if (layer.strokeWidth > 0) { ctx.lineWidth = layer.strokeWidth; ctx.strokeStyle = layer.stroke; ctx.stroke(); }
    } else if (layer.kind === 'image' && layer.image) {
      const img = imageCache.get(layer.id);
      if (img?.complete && img.naturalWidth > 0) ctx.drawImage(img, -layer.w / 2, -layer.h / 2, layer.w, layer.h);
    } else {
      ctx.font = String(layer.weight) + ' ' + String(layer.fontSize) + 'px ' + layer.fontFamily;
      ctx.textAlign = layer.align;
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(0,0,0,.34)';
      ctx.shadowBlur = 22;
      ctx.shadowOffsetY = 8;
      const lines = layer.text.split('\n');
      const lineHeight = layer.fontSize * 1.12;
      const startY = -((lines.length - 1) * lineHeight) / 2;
      lines.forEach((line, i) => {
        if (layer.strokeWidth > 0) { ctx.lineWidth = layer.strokeWidth; ctx.strokeStyle = layer.stroke; ctx.strokeText(line, 0, startY + i * lineHeight, layer.w); }
        ctx.fillStyle = layer.color;
        ctx.fillText(line, 0, startY + i * lineHeight, layer.w);
      });
    }
    ctx.restore();
  }
}
const imageCache = new Map<string, HTMLImageElement>();

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const [project, setProject] = useState<Project>(initialProject);
  const [layers, setLayers] = useState<Layer[]>(initialLayers);
  const [selectedId, setSelectedId] = useState<string>(initialLayers[2].id);
  const [activeTab, setActiveTab] = useState<'library' | 'layers' | 'settings'>('library');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [notice, setNotice] = useState('');
  const [exporting, setExporting] = useState(false);
  const selected = layers.find((l) => l.id === selectedId) || null;
  const categories = ['All', 'Minecraft', 'YouTube', 'Intros'];
  const filteredTemplates = useMemo(() => templates.filter((t) => (category === 'All' || t.category === category) && (t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()))), [category, search]);

  const render = useCallback((time = playhead) => {
    if (canvasRef.current) drawScene(canvasRef.current, layers, project, time);
  }, [layers, project, playhead]);

  useEffect(() => { render(); }, [render]);
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = (now - last) / 1000; last = now;
      setPlayhead((current) => {
        const next = current + delta;
        if (next >= project.duration) { setPlaying(false); return 0; }
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, project.duration]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const updateLayer = (patch: Partial<Layer>) => {
    if (!selected) return;
    setLayers((items) => items.map((l) => l.id === selected.id ? { ...l, ...patch } : l));
  };
  const applyTemplate = (template: Template) => {
    const next = template.layers.map((l) => ({ ...l, id: uid() }));
    setLayers(next); setSelectedId(next[next.length - 1].id); setProject((p) => ({ ...p, name: template.name })); setPlayhead(0); setPlaying(false); setActiveTab('layers');
  };
  const addLayer = (kind: LayerKind) => {
    const layer = makeLayer(kind, { x: 960, y: 540, start: playhead, duration: Math.max(1, project.duration - playhead) });
    setLayers((items) => [...items, layer]); setSelectedId(layer.id); setActiveTab('layers');
  };
  const deleteLayer = () => {
    if (!selected) return;
    const rest = layers.filter((l) => l.id !== selected.id);
    setLayers(rest); setSelectedId(rest[rest.length - 1]?.id || '');
  };
  const updateProject = (patch: Partial<Project>) => setProject((p) => ({ ...p, ...patch }));

  const exportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawScene(canvas, layers, project, playhead);
    canvas.toBlob((blob) => {
      if (!blob) return setNotice('PNG export failed in this browser.');
      const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = 'ggleaf-frame.png'; a.click(); URL.revokeObjectURL(url);
      setNotice('PNG frame exported.');
    }, 'image/png');
  };
  const exportProject = () => {
    const blob = new Blob([JSON.stringify({ version: 1, project, layers }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = 'ggleaf-project.json'; a.click(); URL.revokeObjectURL(url);
    setNotice('Project file saved.');
  };
  const loadProject = async (file?: File) => {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data.project || !Array.isArray(data.layers)) throw new Error('Invalid project file');
      setProject(data.project); setLayers(data.layers); setSelectedId(data.layers[0]?.id || ''); setPlayhead(0); setNotice('Project loaded.');
    } catch { setNotice('Could not open this project file.'); }
  };
  const addImage = async (file?: File) => {
    if (!file) return;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file);
    });
    const layer = makeLayer('image', { name: file.name, image: dataUrl, w: 720, h: 480, motion: 'fade', start: playhead, duration: Math.max(1, project.duration - playhead) });
    const img = new Image(); img.src = dataUrl; imageCache.set(layer.id, img);
    img.onload = () => render();
    setLayers((items) => [...items, layer]); setSelectedId(layer.id); setActiveTab('layers');
  };
  const exportWebm = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!('MediaRecorder' in window) || !canvas.captureStream) { setNotice('WebM recording is not supported in this browser.'); return; }
    setExporting(true); setPlaying(false);
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
    const stream = canvas.captureStream(project.fps);
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12000000 });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = 'ggleaf-animation.webm'; a.click(); URL.revokeObjectURL(url);
      stream.getTracks().forEach((track) => track.stop()); setExporting(false); setNotice('WebM animation exported.');
    };
    recorder.start();
    const start = performance.now();
    const frame = () => {
      const elapsed = (performance.now() - start) / 1000;
      drawScene(canvas, layers, project, Math.min(elapsed, project.duration));
      if (elapsed >= project.duration) recorder.stop();
      else requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><WandSparkles size={18} /></div><span>GG<span className="brand-leaf">LEAF</span></span><span className="studio-pill">STUDIO</span></div>
        <div className="project-name"><span className="live-dot" />{project.name}<ChevronDown size={14} /></div>
        <div className="top-actions">
          <button className="quiet-button" onClick={exportProject}><FileDown size={15} /> Save project</button>
          <button className="quiet-button" onClick={() => projectInputRef.current?.click()}><Upload size={15} /> Open</button>
          <button className="export-button" onClick={exportWebm} disabled={exporting}><Download size={15} /> {exporting ? 'Rendering…' : 'Export video'}</button>
          <input ref={projectInputRef} type="file" accept="application/json,.json" hidden onChange={(e) => loadProject(e.target.files?.[0])} />
        </div>
      </header>

      <main className="workspace">
        <aside className="left-panel">
          <div className="panel-tabs">
            <button className={activeTab === 'library' ? 'active' : ''} onClick={() => setActiveTab('library')}><WandSparkles size={16} /> Library</button>
            <button className={activeTab === 'layers' ? 'active' : ''} onClick={() => setActiveTab('layers')}><Layers size={16} /> Layers</button>
            <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}><Settings2 size={16} /> Project</button>
          </div>
          {activeTab === 'library' && <div className="library-content">
            <div className="panel-heading"><div><h2>Animation library</h2><p>Start with a template, make it yours.</p></div><span className="count-pill">{templates.length}</span></div>
            <div className="search-box"><Search size={15} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search animations..." /><kbd>/</kbd></div>
            <div className="category-row">{categories.map((c) => <button key={c} className={category === c ? 'selected' : ''} onClick={() => setCategory(c)}>{c}</button>)}</div>
            <div className="template-list">{filteredTemplates.map((t) => <button className="template-card" key={t.id} onClick={() => applyTemplate(t)}>
              <div className="template-preview" style={{ '--accent': t.accent } as CSSProperties}>
                <div className={'mini-art mini-' + t.id}><span>{t.id === 'money' ? '$100M' : t.id === 'subscribe' ? 'SUBSCRIBE' : t.id === 'kill' ? '25 KILLS' : t.id === 'lower' ? 'RYNIETR' : t.id === 'rank' ? 'LEGEND' : 'THE JOURNEY'}</span></div><span className="template-tag">{t.tag}</span>
              </div><div className="template-meta"><div><strong>{t.name}</strong><p>{t.description}</p></div><span className="template-arrow">↗</span></div>
            </button>)}
              {filteredTemplates.length === 0 && <div className="empty-state">No animations match that search.</div>}
            </div>
            <div className="panel-footer"><Sparkles size={14} /> More community templates can be added here.</div>
          </div>}
          {activeTab === 'layers' && <div className="layers-content">
            <div className="panel-heading"><div><h2>Composition</h2><p>{layers.length} editable layers</p></div><span className="count-pill">{layers.length}</span></div>
            <div className="add-layer-grid">
              <button onClick={() => addLayer('text')}><Type size={17} /> Text</button>
              <button onClick={() => addLayer('rect')}><Square size={17} /> Shape</button>
              <button onClick={() => addLayer('circle')}><Circle size={17} /> Circle</button>
              <button onClick={() => fileRef.current?.click()}><ImagePlus size={17} /> Image</button>
              <input ref={fileRef} hidden type="file" accept="image/*" onChange={(e) => addImage(e.target.files?.[0])} />
            </div>
            <div className="layer-list">{[...layers].reverse().map((layer) => <button key={layer.id} className={'layer-row ' + (selectedId === layer.id ? 'chosen' : '')} onClick={() => setSelectedId(layer.id)}>
              <span className="layer-icon">{layer.kind === 'text' ? <Type size={15} /> : layer.kind === 'circle' ? <Circle size={15} /> : layer.kind === 'image' ? <ImagePlus size={15} /> : <Square size={15} />}</span>
              <span className="layer-label"><strong>{layer.name}</strong><small>{layer.kind.toUpperCase()} · {layer.motion}</small></span>
              <span className="layer-color" style={{ background: layer.color }} />
            </button>)}
              {layers.length === 0 && <div className="empty-state">Add a layer to begin.</div>}
            </div>
            <div className="panel-footer"><Layers size={14} /> Select a layer to edit every property.</div>
          </div>}
          {activeTab === 'settings' && <div className="settings-content">
            <div className="panel-heading"><div><h2>Project settings</h2><p>Canvas and output options</p></div></div>
            <label className="field-label">Composition name<input value={project.name} onChange={(e) => updateProject({ name: e.target.value })} /></label>
            <div className="field-grid"><label className="field-label">Width<input type="number" value={project.width} onChange={(e) => updateProject({ width: clamp(Number(e.target.value), 320, 3840) })} /></label><label className="field-label">Height<input type="number" value={project.height} onChange={(e) => updateProject({ height: clamp(Number(e.target.value), 240, 2160) })} /></label></div>
            <div className="field-grid"><label className="field-label">Frame rate<select value={project.fps} onChange={(e) => updateProject({ fps: Number(e.target.value) })}><option value="24">24 FPS</option><option value="30">30 FPS</option><option value="60">60 FPS</option></select></label><label className="field-label">Duration (s)<input type="number" min="1" max="60" value={project.duration} onChange={(e) => { const v = clamp(Number(e.target.value), 1, 60); updateProject({ duration: v }); setPlayhead((p) => Math.min(p, v)); }} /></label></div>
            <label className="field-label">Background color<div className="color-input"><input type="color" value={project.background} onChange={(e) => updateProject({ background: e.target.value })} /><span>{project.background}</span></div></label>
            <label className="toggle-row"><span><strong>Transparent background</strong><small>Preserve alpha in canvas exports where supported.</small></span><input type="checkbox" checked={project.transparent} onChange={(e) => updateProject({ transparent: e.target.checked })} /></label>
            <button className="wide-secondary" onClick={exportPng}><Download size={15} /> Export current frame as PNG</button>
          </div>}
        </aside>

        <section className="center-panel">
          <div className="canvas-toolbar"><div className="breadcrumb">Workspace <span>/</span> <strong>{project.name}</strong></div><div className="canvas-actions"><span className="resolution-pill">{project.width} × {project.height}</span><button title="Export PNG frame" onClick={exportPng}><Download size={16} /></button></div></div>
          <div className="canvas-area">
            <div className="canvas-wrap"><canvas ref={canvasRef} width={project.width} height={project.height} /></div>
            <div className="canvas-hint"><span className="hint-dot" /> Preview canvas <span>·</span> {project.fps} FPS <span>·</span> {project.transparent ? 'Transparent' : 'Solid background'}</div>
          </div>
          <div className="timeline-panel">
            <div className="timeline-head"><div className="timeline-title"><Clock3 size={16} /><strong>Timeline</strong><span>{playhead.toFixed(2)}s / {project.duration.toFixed(2)}s</span></div><div className="timeline-controls"><button className="play-button" onClick={() => { if (playhead >= project.duration) setPlayhead(0); setPlaying((v) => !v); }}>{playing ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}</button><button onClick={() => { setPlaying(false); setPlayhead(0); }}>↺</button><span className="fps-label">{project.fps} FPS</span></div></div>
            <div className="ruler"><span>0:00</span><span>{(project.duration / 4).toFixed(1)}s</span><span>{(project.duration / 2).toFixed(1)}s</span><span>{(project.duration * .75).toFixed(1)}s</span><span>{project.duration.toFixed(1)}s</span></div>
            <div className="scrubber-wrap"><input aria-label="Timeline playhead" type="range" min="0" max={project.duration} step="0.01" value={playhead} onChange={(e) => { setPlaying(false); setPlayhead(Number(e.target.value)); }} /><div className="track-stack">{layers.map((l) => <button key={l.id} className={'track ' + (selectedId === l.id ? 'track-active' : '')} onClick={() => setSelectedId(l.id)}><span>{l.name}</span><i style={{ left: (l.start / project.duration * 100) + '%', width: (l.duration / project.duration * 100) + '%' }} /></button>)}</div></div>
            <div className="timeline-bottom"><span>{layers.length} layers</span><span>Drag the playhead to preview your animation</span></div>
          </div>
        </section>

        <aside className="right-panel">
          <div className="inspector-head"><div><span className="eyebrow">PROPERTIES</span><h2>{selected ? selected.name : 'Inspector'}</h2></div>{selected && <button className="icon-danger" title="Delete layer" onClick={deleteLayer}><Trash2 size={16} /></button>}</div>
          {!selected ? <div className="inspector-empty"><Layers size={28} /><strong>No layer selected</strong><p>Choose a layer from the left panel to customize it.</p><button onClick={() => setActiveTab('layers')}>Open layers</button></div> : <div className="inspector-scroll">
            <section className="inspector-section"><div className="section-title"><span>CONTENT</span><ChevronDown size={14} /></div>
              <label className="field-label">Layer name<input value={selected.name} onChange={(e) => updateLayer({ name: e.target.value })} /></label>
              {selected.kind === 'text' && <><label className="field-label">Text<textarea rows={3} value={selected.text} onChange={(e) => updateLayer({ text: e.target.value })} /></label><div className="field-grid"><label className="field-label">Font size<input type="number" min="8" max="400" value={selected.fontSize} onChange={(e) => updateLayer({ fontSize: clamp(Number(e.target.value), 8, 400) })} /></label><label className="field-label">Weight<select value={selected.weight} onChange={(e) => updateLayer({ weight: Number(e.target.value) })}><option value="400">Regular</option><option value="600">Semibold</option><option value="700">Bold</option><option value="800">Extra bold</option><option value="900">Black</option></select></label></div><div className="field-grid"><label className="field-label">Font family<select value={selected.fontFamily} onChange={(e) => updateLayer({ fontFamily: e.target.value })}><option>Arial</option><option>Georgia</option><option>Impact</option><option>Verdana</option><option>Trebuchet MS</option><option>Courier New</option></select></label><label className="field-label">Alignment<select value={selected.align} onChange={(e) => updateLayer({ align: e.target.value as CanvasTextAlign })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label></div></>}
            </section>
            <section className="inspector-section"><div className="section-title"><span>APPEARANCE</span><ChevronDown size={14} /></div>
              <label className="field-label">Fill color<div className="color-input"><input type="color" value={selected.color} onChange={(e) => updateLayer({ color: e.target.value })} /><span>{selected.color}</span></div></label>
              <div className="field-grid"><label className="field-label">Opacity <b>{Math.round(selected.opacity * 100)}%</b><input type="range" min="0" max="1" step="0.01" value={selected.opacity} onChange={(e) => updateLayer({ opacity: Number(e.target.value) })} /></label><label className="field-label">Rotation<input type="number" value={selected.rotation} onChange={(e) => updateLayer({ rotation: Number(e.target.value) })} /></label></div>
              <div className="field-grid"><label className="field-label">Outline<input type="color" value={selected.stroke} onChange={(e) => updateLayer({ stroke: e.target.value })} /></label><label className="field-label">Outline width<input type="number" min="0" max="30" value={selected.strokeWidth} onChange={(e) => updateLayer({ strokeWidth: clamp(Number(e.target.value), 0, 30) })} /></label></div>
              {(selected.kind === 'rect' || selected.kind === 'circle' || selected.kind === 'image') && <div className="field-grid"><label className="field-label">Width<input type="number" value={selected.w} onChange={(e) => updateLayer({ w: clamp(Number(e.target.value), 1, 3840) })} /></label><label className="field-label">Height<input type="number" value={selected.h} onChange={(e) => updateLayer({ h: clamp(Number(e.target.value), 1, 2160) })} /></label></div>}
              {selected.kind === 'rect' && <label className="field-label">Corner radius<input type="range" min="0" max="120" value={selected.radius} onChange={(e) => updateLayer({ radius: Number(e.target.value) })} /></label>}
            </section>
            <section className="inspector-section"><div className="section-title"><span>TRANSFORM</span><ChevronDown size={14} /></div>
              <div className="field-grid"><label className="field-label">Position X<input type="number" value={selected.x} onChange={(e) => updateLayer({ x: Number(e.target.value) })} /></label><label className="field-label">Position Y<input type="number" value={selected.y} onChange={(e) => updateLayer({ y: Number(e.target.value) })} /></label></div>
              {selected.kind === 'text' && <label className="field-label">Text box width<input type="number" value={selected.w} onChange={(e) => updateLayer({ w: clamp(Number(e.target.value), 50, 3840) })} /></label>}
            </section>
            <section className="inspector-section"><div className="section-title"><span>MOTION & TIMING</span><ChevronDown size={14} /></div>
              <label className="field-label">Entrance animation<select value={selected.motion} onChange={(e) => updateLayer({ motion: e.target.value as Motion })}><option value="none">None</option><option value="fade">Fade in</option><option value="slide-up">Slide up</option><option value="slide-left">Slide from left</option><option value="pop">Pop</option><option value="bounce">Bounce</option><option value="zoom">Zoom</option></select></label>
              <div className="field-grid"><label className="field-label">Start (s)<input type="number" min="0" max={project.duration} step=".1" value={selected.start} onChange={(e) => updateLayer({ start: clamp(Number(e.target.value), 0, project.duration) })} /></label><label className="field-label">Duration (s)<input type="number" min=".1" max={project.duration} step=".1" value={selected.duration} onChange={(e) => updateLayer({ duration: clamp(Number(e.target.value), .1, project.duration) })} /></label></div>
              <div className="motion-preview"><Sparkles size={15} /><span>{selected.motion === 'none' ? 'No entrance animation' : selected.motion.replace('-', ' ') + ' entrance'} </span><button onClick={() => { setPlayhead(selected.start); setPlaying(true); }}>Preview</button></div>
            </section>
          </div>}
          <div className="inspector-footer"><span><span className="status-dot" /> All changes are live</span><button onClick={() => { const resetLayers = initialLayers.map((l) => ({ ...l, id: uid() })); setLayers(resetLayers); setSelectedId(resetLayers[2]?.id || ''); setPlayhead(0); setNotice('Template reset.'); }}><X size={13} /> Reset</button></div>
        </aside>
      </main>
      {notice && <div className="toast"><Check size={16} /> {notice}</div>}
      <footer className="statusbar"><span><span className="status-dot" /> GGLeaf Studio · Personal build</span><span>Canvas {project.width} × {project.height}</span><span>Local project · No account required</span></footer>
    </div>
  );
}

export default App;