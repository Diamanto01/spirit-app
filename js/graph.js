/* Spirit Notes – Graph-Ansicht (wie Obsidian) mit Kräfte-Simulation, Zeitraffer & lokalem Graph */
(() => {
  const G = SN.graph = {};
  const h = SN.h, $ = SN.$;
  const PAL = ['#e11d48', '#d4af37', '#a855f7', '#38bdf8', '#f472b6', '#34d399', '#f97316', '#818cf8', '#facc15', '#2dd4bf', '#fb7185', '#c084fc'];
  const hash = (s) => { let x = 0; for (const c of s) x = (x * 31 + c.charCodeAt(0)) | 0; return Math.abs(x); };
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue('--' + n).trim();

  G.data = (opts = {}) => {
    const o = { tags: false, orphans: true, unresolved: true, ...opts };
    const nodes = new Map(), links = [];
    const folders = new Map();
    for (const n of SN.notes.all()) {
      if (n.folder.startsWith('Vorlagen')) continue;
      const top = n.folder.split('/')[0] || '';
      if (!folders.has(top)) folders.set(top, top ? PAL[(hash(top) + 1) % PAL.length] : css('accent'));
      nodes.set(n.path, { id: n.path, label: n.name, kind: 'note', color: n.color || folders.get(top), folder: top, created: Date.parse(n.created || n.updated) || 0, deg: 0 });
    }
    const seen = new Set();
    for (const n of SN.notes.all()) {
      if (!nodes.has(n.path)) continue;
      for (const l of n.links) {
        let t = SN.notes.resolve(l.target);
        if (!t) { if (!o.unresolved) continue; t = 'ghost:' + l.target.toLowerCase(); if (!nodes.has(t)) nodes.set(t, { id: t, label: l.target, kind: 'ghost', color: css('faint'), created: nodes.get(n.path).created, deg: 0 }); }
        if (t === n.path || !nodes.has(t)) continue;
        const k = [n.path, t].sort().join('→'); if (seen.has(k)) continue; seen.add(k);
        links.push({ s: n.path, t });
      }
      if (o.tags) for (const tg of n.tags) {
        const id = 'tag:' + tg;
        if (!nodes.has(id)) nodes.set(id, { id, label: '#' + tg, kind: 'tag', color: css('accent2'), created: 0, deg: 0 });
        links.push({ s: n.path, t: id, tag: true });
      }
    }
    for (const l of links) { nodes.get(l.s).deg++; nodes.get(l.t).deg++; }
    let arr = [...nodes.values()];
    if (!o.orphans) arr = arr.filter(n => n.deg > 0);
    const keep = new Set(arr.map(n => n.id));
    return { nodes: arr, links: links.filter(l => keep.has(l.s) && keep.has(l.t)), folders };
  };

  // ======================================================================
  //  Graph-Renderer
  // ======================================================================
  class GraphView {
    constructor(canvas, { nodes, links }, opts = {}) {
      this.cv = canvas; this.ctx = canvas.getContext('2d'); this.opts = { repel: 1, link: 1, size: 1, labels: true, ...opts };
      this.nodes = nodes; this.links = links; this.byId = new Map(nodes.map(n => [n.id, n]));
      this.links.forEach(l => { l.a = this.byId.get(l.s); l.b = this.byId.get(l.t); });
      this.adj = new Map(nodes.map(n => [n.id, new Set()]));
      this.links.forEach(l => { this.adj.get(l.s).add(l.t); this.adj.get(l.t).add(l.s); });
      const R = Math.sqrt(nodes.length) * 40 + 40;
      nodes.forEach((n, i) => { if (n.x == null) { const a = i * 2.39996; const r = R * Math.sqrt((i + 1) / nodes.length); n.x = Math.cos(a) * r; n.y = Math.sin(a) * r; } n.vx = 0; n.vy = 0; n.vis = 1; });
      this.cam = { x: 0, y: 0, k: 1 }; this.alpha = 1; this.hover = null; this.drag = null; this.highlight = null; this.reveal = null;
      this.resize(); this.bind(); this.loop = this.loop.bind(this); this.raf = requestAnimationFrame(this.loop);
      this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(canvas);
    }
    destroy() { cancelAnimationFrame(this.raf); this.ro.disconnect(); this.dead = true; window.removeEventListener('mousemove', this._mm); window.removeEventListener('mouseup', this._mu); }
    resize() { const r = this.cv.getBoundingClientRect(); const d = devicePixelRatio || 1; this.w = r.width; this.h = r.height; this.cv.width = r.width * d; this.cv.height = r.height * d; this.ctx.setTransform(d, 0, 0, d, 0, 0); }
    toWorld(x, y) { return { x: (x - this.w / 2) / this.cam.k + this.cam.x, y: (y - this.h / 2) / this.cam.k + this.cam.y }; }
    radius(n) { return (n.kind === 'tag' ? 5 : 4 + Math.sqrt(n.deg) * 2.6) * this.opts.size * (n.id === this.opts.center ? 1.5 : 1); }
    pick(mx, my) { const p = this.toWorld(mx, my); let best = null, bd = Infinity; for (const n of this.nodes) { if (n.vis < .5) continue; const d = Math.hypot(n.x - p.x, n.y - p.y); const r = this.radius(n) + 5 / this.cam.k; if (d < r && d < bd) { bd = d; best = n; } } return best; }
    bind() {
      const cv = this.cv; let down = null, moved = false;
      cv.addEventListener('mousedown', (e) => { const r = cv.getBoundingClientRect(); const mx = e.clientX - r.left, my = e.clientY - r.top; const n = this.pick(mx, my); down = { mx, my, cx: this.cam.x, cy: this.cam.y, n }; moved = false; if (n) { this.drag = n; n.fx = n.x; n.fy = n.y; this.alpha = Math.max(this.alpha, .4); } });
      window.addEventListener('mousemove', this._mm = (e) => {
        if (this.dead) return;
        const r = cv.getBoundingClientRect(); const mx = e.clientX - r.left, my = e.clientY - r.top;
        if (down) {
          if (Math.hypot(mx - down.mx, my - down.my) > 3) moved = true;
          if (this.drag) { const p = this.toWorld(mx, my); this.drag.fx = p.x; this.drag.fy = p.y; this.alpha = Math.max(this.alpha, .3); }
          else { this.cam.x = down.cx - (mx - down.mx) / this.cam.k; this.cam.y = down.cy - (my - down.my) / this.cam.k; }
        } else if (mx >= 0 && my >= 0 && mx <= this.w && my <= this.h) {
          const n = this.pick(mx, my); if (n !== this.hover) { this.hover = n; cv.style.cursor = n ? 'pointer' : 'grab'; }
        }
      });
      window.addEventListener('mouseup', this._mu = (e) => {
        if (this.dead || !down) return;
        if (this.drag) { this.drag.fx = null; this.drag.fy = null; }
        if (!moved && down.n && this.opts.onClick) this.opts.onClick(down.n, e);
        this.drag = null; down = null;
      });
      cv.addEventListener('wheel', (e) => {
        e.preventDefault();
        const r = cv.getBoundingClientRect(); const mx = e.clientX - r.left, my = e.clientY - r.top;
        const before = this.toWorld(mx, my);
        this.cam.k = SN.clamp(this.cam.k * Math.exp(-e.deltaY * 0.0015), 0.15, 5);
        const after = this.toWorld(mx, my);
        this.cam.x += before.x - after.x; this.cam.y += before.y - after.y;
      }, { passive: false });
      cv.addEventListener('mouseleave', () => { this.hover = null; });
    }
    step() {
      const N = this.nodes, a = this.alpha, rep = 2400 * this.opts.repel, L = 95 * this.opts.link;
      for (let i = 0; i < N.length; i++) {
        const p = N[i]; if (p.vis < .05) continue;
        for (let j = i + 1; j < N.length; j++) {
          const q = N[j]; if (q.vis < .05) continue;
          let dx = q.x - p.x, dy = q.y - p.y, d2 = dx * dx + dy * dy;
          if (d2 > 360000) continue;
          if (d2 < 1) { dx = Math.random() - .5; dy = Math.random() - .5; d2 = 1; }
          const f = rep / d2 * a; const d = Math.sqrt(d2);
          const fx = dx / d * f, fy = dy / d * f;
          p.vx -= fx; p.vy -= fy; q.vx += fx; q.vy += fy;
        }
      }
      for (const l of this.links) {
        const p = l.a, q = l.b; if (!p || !q || p.vis < .05 || q.vis < .05) continue;
        const dx = q.x - p.x, dy = q.y - p.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = (d - (l.tag ? L * .8 : L)) * 0.04 * a;
        const fx = dx / d * f, fy = dy / d * f;
        p.vx += fx; p.vy += fy; q.vx -= fx; q.vy -= fy;
      }
      for (const n of N) {
        n.vx -= n.x * 0.006 * a; n.vy -= n.y * 0.006 * a;
        if (n.fx != null) { n.x = n.fx; n.y = n.fy; n.vx = n.vy = 0; continue; }
        n.vx *= .82; n.vy *= .82;
        n.x += SN.clamp(n.vx, -30, 30); n.y += SN.clamp(n.vy, -30, 30);
      }
      this.alpha = Math.max(this.opts.local ? 0.02 : 0.015, this.alpha * 0.985);
    }
    fit() {
      const vis = this.nodes.filter(n => n.vis > .5); if (!vis.length) return;
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      vis.forEach(n => { x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x); y1 = Math.max(y1, n.y); });
      this.cam.x = (x0 + x1) / 2; this.cam.y = (y0 + y1) / 2;
      this.cam.k = SN.clamp(Math.min(this.w / (x1 - x0 + 120), this.h / (y1 - y0 + 120)), 0.2, 2.2);
    }
    playTimelapse(ms = 9000) {
      const sorted = [...this.nodes].sort((a, b) => a.created - b.created);
      sorted.forEach(n => n.vis = 0);
      const t0 = performance.now();
      this.reveal = { sorted, t0, ms };
      this.alpha = 1;
    }
    loop(t) {
      if (this.dead) return;
      this.raf = requestAnimationFrame(this.loop);
      if (!this.cv.isConnected || this.cv.offsetParent === null) return;
      if (this.reveal) {
        const { sorted, t0, ms } = this.reveal; const k = (t - t0) / ms; const cnt = Math.floor(k * sorted.length);
        sorted.forEach((n, i) => { if (i <= cnt) n.vis = Math.min(1, n.vis + .08); });
        if (k > 1.05) { this.reveal = null; this.nodes.forEach(n => n.vis = 1); }
        this.alpha = Math.max(this.alpha, .25);
        if (this.opts.onReveal) this.opts.onReveal(Math.min(1, k), sorted[Math.min(sorted.length - 1, Math.max(0, cnt))]);
      }
      this.step();
      if (this.opts.autoFit && this.alpha > .1) this.fit();
      this.draw(t);
    }
    draw(t) {
      const c = this.ctx, k = this.cam.k;
      c.clearRect(0, 0, this.w, this.h);
      c.save(); c.translate(this.w / 2, this.h / 2); c.scale(k, k); c.translate(-this.cam.x, -this.cam.y);
      const focus = this.hover || (this.highlight ? null : null);
      const nb = focus ? this.adj.get(focus.id) : null;
      const accent = css('accent'), accent2 = css('accent2'), text = css('text'), line = css('line2');
      const hl = this.highlight;
      // Links
      c.lineCap = 'round';
      for (const l of this.links) {
        const p = l.a, q = l.b; if (!p || !q) continue;
        const v = Math.min(p.vis, q.vis); if (v < .05) continue;
        const act = focus && (p === focus || q === focus);
        c.globalAlpha = v * (focus ? (act ? .95 : .08) : .5);
        c.strokeStyle = act ? accent : (l.tag ? accent2 : line);
        c.lineWidth = (act ? 1.8 : 1) / Math.sqrt(k);
        c.beginPath(); c.moveTo(p.x, p.y);
        const mx = (p.x + q.x) / 2 + (q.y - p.y) * .08, my = (p.y + q.y) / 2 - (q.x - p.x) * .08;
        c.quadraticCurveTo(mx, my, q.x, q.y); c.stroke();
      }
      // Knoten
      for (const n of this.nodes) {
        if (n.vis < .05) continue;
        const r = this.radius(n) * (0.4 + 0.6 * n.vis);
        const dim = (focus && n !== focus && !nb.has(n.id)) || (hl && !hl.has(n.id));
        c.globalAlpha = n.vis * (dim ? .15 : 1);
        const isC = n.id === this.opts.center || n === focus;
        c.shadowBlur = isC ? 22 : (dim ? 0 : 10); c.shadowColor = n.color;
        if (n.kind === 'tag') {
          c.fillStyle = n.color; c.save(); c.translate(n.x, n.y); c.rotate(Math.PI / 4); c.fillRect(-r * .8, -r * .8, r * 1.6, r * 1.6); c.restore();
        } else if (n.kind === 'ghost') {
          c.strokeStyle = n.color; c.lineWidth = 1.4 / k; c.setLineDash([3 / k, 3 / k]); c.beginPath(); c.arc(n.x, n.y, r, 0, 7); c.stroke(); c.setLineDash([]);
        } else {
          const g = c.createRadialGradient(n.x - r * .3, n.y - r * .3, r * .1, n.x, n.y, r);
          g.addColorStop(0, '#fff'); g.addColorStop(.25, n.color); g.addColorStop(1, n.color);
          c.fillStyle = g; c.beginPath(); c.arc(n.x, n.y, r, 0, 7); c.fill();
        }
        if (isC) { c.shadowBlur = 0; c.strokeStyle = accent2; c.lineWidth = 1.5 / k; c.beginPath(); c.arc(n.x, n.y, r + 4 / k + Math.sin(t / 300) * 1.2 / k, 0, 7); c.stroke(); }
        c.shadowBlur = 0;
      }
      // Beschriftungen
      if (this.opts.labels) {
        c.textAlign = 'center'; c.textBaseline = 'top';
        for (const n of this.nodes) {
          if (n.vis < .5) continue;
          const show = n === focus || (nb && nb.has(n.id)) || (hl && hl.has(n.id)) || k > (this.opts.local ? 0.3 : 0.75) || n.id === this.opts.center || n.deg >= 6;
          if (!show) continue;
          const dim = (focus && n !== focus && !nb.has(n.id)) || (hl && !hl.has(n.id));
          c.globalAlpha = dim ? .15 : (n === focus ? 1 : .85);
          const fs = (n === focus ? 13 : 11) / Math.max(.6, Math.min(k, 1.6));
          c.font = `${n === focus ? 600 : 400} ${fs}px Poppins, sans-serif`;
          c.fillStyle = n.kind === 'ghost' ? css('faint') : text;
          c.lineWidth = 3 / k; c.strokeStyle = css('bg');
          const label = n.label.length > 28 ? n.label.slice(0, 26) + '…' : n.label;
          c.strokeText(label, n.x, n.y + this.radius(n) + 4 / k);
          c.fillText(label, n.x, n.y + this.radius(n) + 4 / k);
        }
      }
      c.restore(); c.globalAlpha = 1;
    }
  }
  G.GraphView = GraphView;

  // ---------- Lokaler Graph (rechte Leiste) ----------
  let localView = null;
  G.local = (canvas, path) => {
    if (localView) localView.destroy();
    const all = G.data({ tags: false, orphans: true, unresolved: true });
    const keep = new Set([path]);
    all.links.forEach(l => { if (l.s === path) keep.add(l.t); if (l.t === path) keep.add(l.s); });
    const second = new Set(keep);
    all.links.forEach(l => { if (keep.has(l.s) && keep.size < 40) second.add(l.t); if (keep.has(l.t) && keep.size < 40) second.add(l.s); });
    const nodes = all.nodes.filter(n => second.has(n.id)).map(n => ({ ...n }));
    const ids = new Set(nodes.map(n => n.id));
    const links = all.links.filter(l => ids.has(l.s) && ids.has(l.t)).map(l => ({ ...l }));
    localView = new GraphView(canvas, { nodes, links }, { local: true, center: path, autoFit: true, size: .9, onClick: (n) => { if (n.kind === 'note' && n.id !== path) SN.editor.open(n.id); else if (n.kind === 'ghost') SN.editor.openLink(n.label); } });
  };

  // ======================================================================
  //  Volle Graph-Ansicht
  // ======================================================================
  const V = SN.views.graph = {};
  let view = null;
  V.render = () => {
    const root = $('#view-graph');
    if (!root.dataset.built) {
      root.dataset.built = 1;
      root.innerHTML = '';
      const canvas = h('canvas.graph-canvas');
      const info = h('div.graph-info');
      const panel = h('div.graph-panel.card');
      const legend = h('div.graph-legend');
      const timeline = h('div.graph-timeline.hidden', h('div.gt-bar', h('i')), h('span.gt-date'));
      const tog = h('button.btn.small.graph-toggle', { html: SN.icon('settings', 14) + '<span>Filter</span>', onclick: () => panel.classList.toggle('open') });
      root.append(canvas, info, panel, legend, timeline, tog);
      V.canvas = canvas; V.info = info; V.panel = panel; V.legend = legend; V.timeline = timeline;
      buildPanel(panel);
      SN.on('index', () => { if (SN.app.view === 'graph') V.rebuild(); else V.stale = true; });
      SN.on('note:updated', SN.debounce(() => { V.stale = true; }, 500));
    }
    if (!view || V.stale) V.rebuild();
  };
  V.rebuild = () => {
    V.stale = false;
    const g = SN.settings.graph;
    const data = G.data(g);
    const old = view ? new Map(view.nodes.map(n => [n.id, n])) : new Map();
    data.nodes.forEach(n => { const o = old.get(n.id); if (o) { n.x = o.x; n.y = o.y; } });
    if (view) view.destroy();
    view = new GraphView(V.canvas, data, { ...g, onClick: (n, e) => {
      if (n.kind === 'note') SN.editor.open(n.id, { newTab: e.ctrlKey });
      else if (n.kind === 'tag') SN.app.searchTag(n.label.slice(1));
      else SN.editor.openLink(n.label);
    }, onReveal: (k, n) => { V.timeline.querySelector('i').style.width = (k * 100) + '%'; if (n && n.created) V.timeline.querySelector('.gt-date').textContent = SN.fmtDate(n.created); } });
    if (!old.size) setTimeout(() => view && view.fit(), 900);
    V.info.innerHTML = `<b>${data.nodes.filter(n => n.kind === 'note').length}</b> Notizen · <b>${data.links.length}</b> Verbindungen${data.nodes.some(n => n.kind === 'ghost') ? ` · <span class="faint">${data.nodes.filter(n => n.kind === 'ghost').length} noch nicht erstellt</span>` : ''}`;
    V.legend.innerHTML = '';
    [...data.folders.entries()].slice(0, 10).forEach(([f, col]) => V.legend.append(h('span', h('i', { style: { background: col, boxShadow: `0 0 8px ${col}` } }), f || 'Vault')));
    applySearch();
  };
  function applySearch() {
    const q = (V.search?.value || '').toLowerCase().trim();
    if (!view) return;
    view.highlight = q ? new Set(view.nodes.filter(n => n.label.toLowerCase().includes(q) || (n.kind === 'note' && SN.notes.get(n.id)?.tags.some(t => t.includes(q.replace('#', ''))))).map(n => n.id)) : null;
  }
  function buildPanel(p) {
    const g = () => SN.settings.graph;
    const set = (patch, rebuild) => { SN.saveSettings({ graph: { ...g(), ...patch } }); if (rebuild) V.rebuild(); else if (view) { Object.assign(view.opts, patch); view.alpha = Math.max(view.alpha, .5); } };
    V.search = h('input.input', { placeholder: 'Im Graph suchen …', spellcheck: 'false', oninput: applySearch });
    const tog = (key, label, rebuild = true) => {
      const b = h('label.switch-row', h('span', label), h('input', { type: 'checkbox', checked: g()[key] ? true : null, onchange: (e) => set({ [key]: e.target.checked }, rebuild) }), h('i.switch'));
      return b;
    };
    const slider = (key, label, min, max, step) => h('label.slider-row', h('span', label), h('input', { type: 'range', min, max, step, value: g()[key], oninput: (e) => set({ [key]: Number(e.target.value) }, false) }));
    p.append(
      h('div.card-title', { html: `${SN.icon('graph', 16)} Graph <span class="jp">繋がり</span>` }),
      V.search,
      h('div.gp-sec', 'Filter'),
      tog('tags', 'Tags als Knoten'), tog('orphans', 'Notizen ohne Links'), tog('unresolved', 'Noch nicht erstellte'),
      tog('labels', 'Beschriftungen', false),
      h('div.gp-sec', 'Kräfte'),
      slider('repel', 'Abstoßung', .3, 3, .1), slider('link', 'Linklänge', .4, 3, .1), slider('size', 'Knotengröße', .5, 2.5, .1),
      h('div.row', { style: { marginTop: '12px', flexWrap: 'wrap', gap: '6px' } },
        h('button.btn.small.primary', { html: SN.icon('play', 14) + '<span>Zeitraffer</span>', title: 'Zeigt, wie dein Vault über die Zeit gewachsen ist', onclick: () => { if (!view) return; V.timeline.classList.remove('hidden'); view.playTimelapse(); setTimeout(() => V.timeline.classList.add('hidden'), 10500); } }),
        h('button.btn.small', { html: SN.icon('target', 14) + '<span>Zentrieren</span>', onclick: () => view && view.fit() }),
        h('button.btn.small', { html: SN.icon('reset', 14) + '<span>Neu</span>', title: 'Anordnung neu berechnen', onclick: () => { view && view.nodes.forEach(n => { n.x = (Math.random() - .5) * 400; n.y = (Math.random() - .5) * 400; }); view.alpha = 1; } })),
    );
  }
})();
