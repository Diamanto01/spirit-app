/* Spirit Notes – Themes, Hintergrund-Motive & Partikel */
(() => {
  const T = SN.themes = {};
  T.list = {
    crimson: {
      name: 'Crimson Clock', jp: '時の紅', desc: 'Rot, Schwarz & Gold – Uhren und Gothic-Spitze.',
      particles: 'petals', motif: 'clock',
      vars: { bg: '#0a0608', bg2: '#150a0e', bg3: '#1f0e14', panel: 'rgba(20,9,13,.82)', panel2: 'rgba(32,13,20,.78)', line: 'rgba(212,175,55,.16)', line2: 'rgba(225,29,72,.28)',
        text: '#f6ecee', muted: '#b59aa2', faint: '#7d636b', accent: '#e11d48', accent2: '#d4af37', accent3: '#ff6b8b', glow: 'rgba(225,29,72,.45)', glow2: 'rgba(212,175,55,.35)', sel: 'rgba(225,29,72,.32)' },
      bar: '#0d0709', symbol: '#e9cf7c',
    },
    violet: {
      name: 'Violet Spirit', jp: '紫の精霊', desc: 'Violett & Schwarz mit leuchtenden Sternen.',
      particles: 'sparkles', motif: 'sigil',
      vars: { bg: '#07050d', bg2: '#100b1c', bg3: '#181029', panel: 'rgba(14,10,26,.82)', panel2: 'rgba(24,16,42,.78)', line: 'rgba(192,132,252,.16)', line2: 'rgba(168,85,247,.32)',
        text: '#f5f0ff', muted: '#a99bc4', faint: '#6f6388', accent: '#a855f7', accent2: '#e879f9', accent3: '#c4b5fd', glow: 'rgba(168,85,247,.5)', glow2: 'rgba(232,121,249,.35)', sel: 'rgba(168,85,247,.32)' },
      bar: '#0a0713', symbol: '#e9d5ff',
    },
    sakura: {
      name: 'Sakura Night', jp: '夜桜', desc: 'Nachtblau & Pink mit fallenden Blüten.',
      particles: 'sakura', motif: 'sakura',
      vars: { bg: '#080b18', bg2: '#0e1428', bg3: '#161d38', panel: 'rgba(12,16,34,.82)', panel2: 'rgba(22,28,56,.78)', line: 'rgba(244,114,182,.16)', line2: 'rgba(244,114,182,.3)',
        text: '#f4f1ff', muted: '#a3a7c8', faint: '#686d92', accent: '#f472b6', accent2: '#93c5fd', accent3: '#fbcfe8', glow: 'rgba(244,114,182,.45)', glow2: 'rgba(147,197,253,.35)', sel: 'rgba(244,114,182,.3)' },
      bar: '#0a0e1e', symbol: '#fbcfe8',
    },
    frost: {
      name: 'Frost Rabbit', jp: '氷結', desc: 'Eisblau & Silber mit sanftem Schnee.',
      particles: 'snow', motif: 'frost',
      vars: { bg: '#050c14', bg2: '#0a1622', bg3: '#112131', panel: 'rgba(8,18,30,.82)', panel2: 'rgba(14,30,46,.78)', line: 'rgba(125,211,252,.16)', line2: 'rgba(103,232,249,.3)',
        text: '#effaff', muted: '#98b4c6', faint: '#5e7a8c', accent: '#38bdf8', accent2: '#c4b5fd', accent3: '#a5f3fc', glow: 'rgba(56,189,248,.45)', glow2: 'rgba(196,181,253,.35)', sel: 'rgba(56,189,248,.28)' },
      bar: '#07111b', symbol: '#bae6fd',
    },
    flame: {
      name: 'Flame Spirit', jp: '炎の精霊', desc: 'Glut-Orange & Rot mit Funken.',
      particles: 'embers', motif: 'flame',
      vars: { bg: '#0c0605', bg2: '#170b08', bg3: '#22100b', panel: 'rgba(22,10,7,.84)', panel2: 'rgba(36,15,10,.78)', line: 'rgba(251,146,60,.16)', line2: 'rgba(249,115,22,.32)',
        text: '#fff4ec', muted: '#c4a291', faint: '#86675a', accent: '#f97316', accent2: '#facc15', accent3: '#fdba74', glow: 'rgba(249,115,22,.45)', glow2: 'rgba(250,204,21,.32)', sel: 'rgba(249,115,22,.3)' },
      bar: '#100806', symbol: '#fed7aa',
    },
    daylight: {
      name: 'Sakura Day', jp: '春の日', desc: 'Helles Theme – Rosé, Creme & Rubin.',
      particles: 'sakura', motif: 'clock', light: true,
      vars: { bg: '#fbf3f4', bg2: '#f5e6e9', bg3: '#eed8dc', panel: 'rgba(255,250,250,.86)', panel2: 'rgba(250,238,241,.86)', line: 'rgba(159,18,57,.13)', line2: 'rgba(190,18,60,.25)',
        text: '#2b1a20', muted: '#7d5d67', faint: '#a88a93', accent: '#be123c', accent2: '#b7791f', accent3: '#e11d48', glow: 'rgba(190,18,60,.25)', glow2: 'rgba(183,121,31,.25)', sel: 'rgba(190,18,60,.18)' },
      bar: '#f7e9ec', symbol: '#9f1239',
    },
    // ---- Belohnungs-Themes (werden durch Level freigeschaltet) ----
    midnight: {
      name: 'Midnight Gold', jp: '真夜中の金', desc: 'Tiefes Schwarz mit edlem Gold.', reward: true,
      particles: 'sparkles', motif: 'clock',
      vars: { bg: '#060504', bg2: '#0f0c07', bg3: '#18130b', panel: 'rgba(14,11,6,.84)', panel2: 'rgba(24,19,10,.8)', line: 'rgba(232,184,74,.18)', line2: 'rgba(232,184,74,.34)',
        text: '#fbf5e6', muted: '#b9a986', faint: '#7c6e52', accent: '#e8b84a', accent2: '#fff1c1', accent3: '#f5d27a', glow: 'rgba(232,184,74,.42)', glow2: 'rgba(255,241,193,.3)', sel: 'rgba(232,184,74,.28)' },
      bar: '#0a0805', symbol: '#f5d27a',
    },
    bloodmoon: {
      name: 'Blood Moon', jp: '血の月', desc: 'Blutroter Mond über silberblauer Nacht.', reward: true,
      particles: 'petals', motif: 'moon',
      vars: { bg: '#07060c', bg2: '#100b16', bg3: '#1a1020', panel: 'rgba(14,9,18,.84)', panel2: 'rgba(26,14,30,.8)', line: 'rgba(159,180,255,.16)', line2: 'rgba(255,46,77,.32)',
        text: '#f2f0fb', muted: '#a8a3c0', faint: '#6c6886', accent: '#ff2e4d', accent2: '#9fb4ff', accent3: '#ff7a8e', glow: 'rgba(255,46,77,.5)', glow2: 'rgba(159,180,255,.35)', sel: 'rgba(255,46,77,.3)' },
      bar: '#0b0810', symbol: '#c9d4ff',
    },
    idol: {
      name: 'Starlight Idol', jp: '星の歌姫', desc: 'Neon-Pink & Cyan wie auf einer Bühne.', reward: true,
      particles: 'shooting', motif: 'sigil',
      vars: { bg: '#0b0616', bg2: '#140a26', bg3: '#1e1036', panel: 'rgba(18,9,34,.82)', panel2: 'rgba(30,16,54,.78)', line: 'rgba(95,242,255,.16)', line2: 'rgba(255,95,183,.34)',
        text: '#fff5fd', muted: '#b9a6cf', faint: '#7a6a91', accent: '#ff5fb7', accent2: '#5ff2ff', accent3: '#ffd1f0', glow: 'rgba(255,95,183,.5)', glow2: 'rgba(95,242,255,.4)', sel: 'rgba(255,95,183,.3)' },
      bar: '#100820', symbol: '#ffd1f0',
    },
    abyss: {
      name: 'Abyss', jp: '深淵', desc: 'Türkis-Leuchten aus der Tiefe.', reward: true,
      particles: 'snow', motif: 'frost',
      vars: { bg: '#020a0c', bg2: '#051316', bg3: '#0a1e22', panel: 'rgba(4,16,19,.84)', panel2: 'rgba(8,26,30,.8)', line: 'rgba(20,224,196,.15)', line2: 'rgba(20,224,196,.32)',
        text: '#ecfffb', muted: '#8fb7b1', faint: '#577a75', accent: '#14e0c4', accent2: '#8b7dff', accent3: '#7cf5e3', glow: 'rgba(20,224,196,.42)', glow2: 'rgba(139,125,255,.35)', sel: 'rgba(20,224,196,.26)' },
      bar: '#030d10', symbol: '#7cf5e3',
    },
    royal: {
      name: 'Chronos Royal', jp: '時の王冠', desc: 'Karmesin, Gold & Violett – königlich.', reward: true,
      particles: 'gears', motif: 'clock',
      vars: { bg: '#0a0610', bg2: '#140a1a', bg3: '#1f0f26', panel: 'rgba(20,9,24,.84)', panel2: 'rgba(32,14,38,.8)', line: 'rgba(255,215,0,.17)', line2: 'rgba(225,29,72,.34)',
        text: '#fff6f0', muted: '#c0a6b8', faint: '#806878', accent: '#e11d48', accent2: '#ffd700', accent3: '#b06cff', glow: 'rgba(225,29,72,.5)', glow2: 'rgba(255,215,0,.38)', sel: 'rgba(225,29,72,.32)' },
      bar: '#0e0814', symbol: '#ffd700',
    },
  };

  T.apply = () => {
    const s = SN.settings;
    const th = T.list[s.theme] || T.list.crimson;
    const root = document.documentElement;
    for (const [k, v] of Object.entries(th.vars)) root.style.setProperty('--' + k, v);
    if (s.accent) { root.style.setProperty('--accent', s.accent); root.style.setProperty('--glow', s.accent + '73'); root.style.setProperty('--sel', s.accent + '50'); }
    document.body.className = document.body.className.replace(/theme-\w+/g, '').trim() + ' theme-' + (T.list[s.theme] ? s.theme : 'crimson');
    document.body.classList.toggle('light', !!th.light);
    document.body.classList.toggle('no-motif', s.motif === false);
    root.style.setProperty('--ui-scale', s.uiScale || 1);
    root.style.fontSize = (14 * (s.uiScale || 1)) + 'px';
    // Hintergrundbild
    const bg = SN.$('#bg-image');
    if (s.bgImage) {
      bg.style.backgroundImage = `url("${SN.fs.url(s.bgImage)}")`;
      bg.style.opacity = s.bgOpacity; bg.style.filter = `blur(${s.bgBlur}px) saturate(1.1)`;
      bg.classList.add('on');
    } else bg.classList.remove('on');
    T.renderMotif(th.motif);
    T.particles.set(s.particles === 'auto' ? th.particles : s.particles, s.particleDensity * (document.body.classList.contains('mobile') ? 0.5 : 1));
    if (SN.isElectron) window.spirit.win.setOverlay({ bar: th.bar, symbol: th.symbol }).catch(() => {});
    SN.emit('theme', th);
  };

  // ---------- Hintergrund-Motiv (große SVG-Grafik, dreht sich langsam) ----------
  let motifClock = null;
  T.renderMotif = (type) => {
    const el = SN.$('#bg-motif');
    clearInterval(motifClock);
    const ring = (r, n, len, w) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; const x1 = 500 + Math.sin(a) * r, y1 = 500 - Math.cos(a) * r, x2 = 500 + Math.sin(a) * (r - len), y2 = 500 - Math.cos(a) * (r - len); return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke-width="${w}"/>`; }).join('');
    let svg = '';
    if (type === 'clock') {
      const roman = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
      const nums = roman.map((r, i) => { const a = i / 12 * Math.PI * 2; return `<text x="${(500 + Math.sin(a) * 335).toFixed(1)}" y="${(500 - Math.cos(a) * 335 + 18).toFixed(1)}" text-anchor="middle">${r}</text>`; }).join('');
      svg = `<svg viewBox="0 0 1000 1000" class="motif-svg clock"><g class="m-stroke">
        <circle cx="500" cy="500" r="470" stroke-width="2"/><circle cx="500" cy="500" r="455" stroke-width="1" stroke-dasharray="2 10"/>
        <circle cx="500" cy="500" r="400" stroke-width="3"/>${ring(400, 60, 14, 1.5)}${ring(400, 12, 34, 4)}
        <circle cx="500" cy="500" r="270" stroke-width="1"/><circle cx="500" cy="500" r="250" stroke-width="1" stroke-dasharray="1 6"/>
        <g class="m-spin">${ring(200, 24, 18, 1)}<circle cx="500" cy="500" r="200" stroke-width="1"/></g>
        </g><g class="m-num">${nums}</g>
        <g class="m-hands"><line id="mh-h" x1="500" y1="520" x2="500" y2="330" stroke-width="10"/><line id="mh-m" x1="500" y1="530" x2="500" y2="230" stroke-width="6"/><line id="mh-s" x1="500" y1="560" x2="500" y2="170" stroke-width="2"/><circle cx="500" cy="500" r="16"/></g></svg>`;
    } else if (type === 'sigil') {
      const star = (r, n, rot = 0) => { const pts = []; for (let i = 0; i < n; i++) { const a = rot + i / n * Math.PI * 2; pts.push([500 + Math.sin(a) * r, 500 - Math.cos(a) * r]); } return pts; };
      const hex = star(380, 6), tri1 = [hex[0], hex[2], hex[4]], tri2 = [hex[1], hex[3], hex[5]];
      const poly = (p) => `<polygon points="${p.map(q => q.map(v => v.toFixed(1)).join(',')).join(' ')}" stroke-width="2"/>`;
      svg = `<svg viewBox="0 0 1000 1000" class="motif-svg"><g class="m-stroke"><circle cx="500" cy="500" r="460" stroke-width="2"/><circle cx="500" cy="500" r="440" stroke-width="1" stroke-dasharray="3 9"/><circle cx="500" cy="500" r="380" stroke-width="2"/>${poly(tri1)}${poly(tri2)}<circle cx="500" cy="500" r="190" stroke-width="1.5"/><g class="m-spin">${poly(star(190, 5))}${ring(190, 40, 10, 1)}</g>${hex.map(p => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="26" stroke-width="2"/>`).join('')}</g></svg>`;
    } else if (type === 'sakura') {
      const petal = (a) => `<path transform="rotate(${a} 500 500)" d="M500 500 C 420 380, 430 250, 500 200 C 520 230, 540 230, 560 200 C 600 270, 590 390, 500 500 Z" stroke-width="2"/>`;
      svg = `<svg viewBox="0 0 1000 1000" class="motif-svg"><g class="m-stroke"><g class="m-spin">${[0, 72, 144, 216, 288].map(petal).join('')}</g><circle cx="500" cy="500" r="40" stroke-width="2"/><circle cx="500" cy="500" r="430" stroke-width="1" stroke-dasharray="2 12"/><circle cx="500" cy="500" r="470" stroke-width="1.5"/></g></svg>`;
    } else if (type === 'frost') {
      const arm = (a) => `<g transform="rotate(${a} 500 500)"><line x1="500" y1="500" x2="500" y2="90" stroke-width="3"/>${[180, 260, 340].map(y => `<path d="M500 ${y} l-${(420 - y) / 3.2} -${(420 - y) / 3.5} M500 ${y} l${(420 - y) / 3.2} -${(420 - y) / 3.5}" stroke-width="2"/>`).join('')}</g>`;
      svg = `<svg viewBox="0 0 1000 1000" class="motif-svg"><g class="m-stroke"><g class="m-spin">${[0, 60, 120, 180, 240, 300].map(arm).join('')}</g><circle cx="500" cy="500" r="460" stroke-width="1" stroke-dasharray="2 10"/></g></svg>`;
    } else if (type === 'moon') {
      const stars = Array.from({ length: 14 }, (_, i) => { const a = i * 2.39996, r = 260 + (i % 4) * 50; return `<path transform="translate(${(500 + Math.cos(a) * r).toFixed(0)} ${(500 + Math.sin(a) * r).toFixed(0)}) scale(${(0.5 + (i % 3) * 0.3).toFixed(1)})" d="M0 -18 4 -4 18 0 4 4 0 18 -4 4 -18 0 -4 -4z" stroke-width="2"/>`; }).join('');
      svg = `<svg viewBox="0 0 1000 1000" class="motif-svg"><g class="m-stroke"><circle cx="500" cy="500" r="230" stroke-width="3"/><path d="M590 300 A230 230 0 1 0 700 640 A190 190 0 1 1 590 300z" stroke-width="3"/><circle cx="500" cy="500" r="470" stroke-width="1" stroke-dasharray="2 12"/><g class="m-spin">${stars}</g></g></svg>`;
    } else if (type === 'flame') {
      const ray = (a, l) => `<path transform="rotate(${a} 500 500)" d="M500 ${500 - 150} Q ${520} ${500 - 150 - l / 2} 500 ${500 - 150 - l} Q ${480} ${500 - 150 - l / 2} 500 ${500 - 150}" stroke-width="2"/>`;
      svg = `<svg viewBox="0 0 1000 1000" class="motif-svg"><g class="m-stroke"><circle cx="500" cy="500" r="140" stroke-width="3"/><circle cx="500" cy="500" r="110" stroke-width="1"/><g class="m-spin">${Array.from({ length: 16 }, (_, i) => ray(i * 22.5, i % 2 ? 170 : 260)).join('')}</g><circle cx="500" cy="500" r="460" stroke-width="1" stroke-dasharray="2 10"/></g></svg>`;
    }
    el.innerHTML = svg;
    if (type === 'clock') {
      const tick = () => {
        const d = new Date(), s = d.getSeconds(), m = d.getMinutes() + s / 60, h = (d.getHours() % 12) + m / 60;
        const set = (id, deg) => { const e = document.getElementById(id); if (e) e.setAttribute('transform', `rotate(${deg} 500 500)`); };
        set('mh-h', h * 30); set('mh-m', m * 6); set('mh-s', s * 6);
      };
      tick(); motifClock = setInterval(tick, 1000);
    }
  };

  // ---------- Partikel ----------
  T.particles = (() => {
    const cv = () => SN.$('#particles');
    let ctx, parts = [], type = 'off', raf = null, density = 1, w = 0, h = 0, last = 0, trailOn = false, sparks = [];
    const onMove = (x, y) => { if (!trailOn) return; for (let i = 0; i < 2; i++) sparks.push({ x, y, vx: (Math.random() - .5) * 1.6, vy: (Math.random() - .5) * 1.6 - .4, life: 1, r: 1 + Math.random() * 2.2 }); if (sparks.length > 160) sparks.splice(0, sparks.length - 160); if (!raf) raf = requestAnimationFrame(frame); };
    window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY), { passive: true });
    window.addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t) onMove(t.clientX, t.clientY); }, { passive: true });
    const resize = () => { const c = cv(); if (!c) return; const dpr = devicePixelRatio || 1; w = innerWidth; h = innerHeight; c.width = w * dpr; c.height = h * dpr; c.style.width = w + 'px'; c.style.height = h + 'px'; ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    window.addEventListener('resize', resize);
    const css = (n) => getComputedStyle(document.documentElement).getPropertyValue('--' + n).trim();
    const spawn = (init) => {
      const p = { x: Math.random() * w, y: init ? Math.random() * h : -20, r: 0, vr: (Math.random() - .5) * .04, s: .6 + Math.random() * .9, life: Math.random() * Math.PI * 2 };
      if (type === 'embers') { p.y = init ? Math.random() * h : h + 10; p.vy = -(.3 + Math.random() * .7); p.vx = (Math.random() - .5) * .3; }
      else if (type === 'gears') { p.vy = .12 + Math.random() * .25; p.vx = (Math.random() - .5) * .15; p.vr = (Math.random() < .5 ? -1 : 1) * (.004 + Math.random() * .01); p.s = .6 + Math.random() * 1.4; p.teeth = 8 + Math.floor(Math.random() * 5); }
      else if (type === 'shooting') { p.x = Math.random() * w * 1.2; p.y = init ? Math.random() * h : -30 - Math.random() * h * .6; p.vx = -(5 + Math.random() * 5); p.vy = 3 + Math.random() * 3; p.star = Math.random() < .55; if (p.star) { p.vx = 0; p.vy = 0; p.y = Math.random() * h; } }
      else if (type === 'sparkles') { p.vy = (Math.random() - .5) * .1; p.vx = (Math.random() - .5) * .1; p.y = Math.random() * h; }
      else { p.vy = .25 + Math.random() * .55; p.vx = (Math.random() - .3) * .5; }
      return p;
    };
    const drawPetal = (p, color, color2) => {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(p.s, p.s * (0.6 + 0.4 * Math.abs(Math.sin(p.life))));
      const g = ctx.createLinearGradient(-6, -8, 6, 8); g.addColorStop(0, color); g.addColorStop(1, color2);
      ctx.fillStyle = g; ctx.globalAlpha = .75;
      ctx.beginPath(); ctx.moveTo(0, -9); ctx.bezierCurveTo(8, -7, 8, 5, 0, 9); ctx.bezierCurveTo(-8, 5, -8, -7, 0, -9); ctx.fill();
      ctx.restore();
    };
    const drawSakura = (p, color) => {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(p.s, p.s * (0.55 + 0.45 * Math.abs(Math.sin(p.life))));
      ctx.fillStyle = color; ctx.globalAlpha = .8;
      ctx.beginPath(); ctx.moveTo(0, 8); ctx.bezierCurveTo(-7, 3, -6, -6, -2, -8); ctx.lineTo(0, -5); ctx.lineTo(2, -8); ctx.bezierCurveTo(6, -6, 7, 3, 0, 8); ctx.fill();
      ctx.restore();
    };
    const frame = (t) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden) return;
      const dt = Math.min(50, t - last || 16) / 16; last = t;
      ctx.clearRect(0, 0, w, h);
      const a = css('accent'), a2 = css('accent2'), a3 = css('accent3');
      for (const p of parts) {
        p.life += .02 * dt; p.r += p.vr * dt;
        const sway = type === 'shooting' || type === 'gears' ? 0 : Math.sin(p.life) * (type === 'snow' ? .25 : .4);
        p.x += (p.vx + sway) * dt; p.y += p.vy * dt;
        if (type === 'petals') drawPetal(p, a, a3);
        else if (type === 'sakura') drawSakura(p, a3 || a);
        else if (type === 'gears') {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = .38; ctx.strokeStyle = p.s > 1.3 ? a : a2; ctx.lineWidth = 1.6;
          const R0 = 9 * p.s, R1 = 12 * p.s; ctx.beginPath();
          for (let i = 0; i < p.teeth * 2; i++) { const ang = i / (p.teeth * 2) * Math.PI * 2; const rr = i % 2 ? R0 : R1; ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); }
          ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 4 * p.s, 0, 7); ctx.stroke(); ctx.restore();
        }
        else if (type === 'shooting') {
          if (p.star) { const al = Math.max(0, Math.sin(p.life * 1.3)); ctx.globalAlpha = al * .8; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, .8 + p.s * .8, 0, 7); ctx.fill(); }
          else { const g = ctx.createLinearGradient(p.x, p.y, p.x - p.vx * 9, p.y - p.vy * 9); g.addColorStop(0, '#fff'); g.addColorStop(.3, a2); g.addColorStop(1, 'transparent'); ctx.globalAlpha = .9; ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 9, p.y - p.vy * 9); ctx.stroke(); }
        }
        else if (type === 'hearts') {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.sin(p.life) * .3); const s = 5 * p.s; ctx.globalAlpha = .7; ctx.fillStyle = p.s > 1.1 ? a : a3;
          ctx.beginPath(); ctx.moveTo(0, s * .9); ctx.bezierCurveTo(-s * 1.6, -s * .2, -s * .7, -s * 1.4, 0, -s * .5); ctx.bezierCurveTo(s * .7, -s * 1.4, s * 1.6, -s * .2, 0, s * .9); ctx.fill(); ctx.restore();
        }
        else if (type === 'feathers') {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.sin(p.life * .8) * .9); ctx.globalAlpha = .55; ctx.strokeStyle = '#fff'; ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; const s = 10 * p.s;
          ctx.beginPath(); ctx.moveTo(0, -s); ctx.quadraticCurveTo(s * .55, 0, 0, s); ctx.quadraticCurveTo(-s * .55, 0, 0, -s); ctx.fill(); ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(0, s * 1.2); ctx.stroke(); ctx.restore();
        }
        else if (type === 'snow') { ctx.globalAlpha = .55 * p.s; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(p.x, p.y, 1.2 + p.s * 1.6, 0, 7); ctx.fill(); }
        else if (type === 'embers') { const al = .5 + .5 * Math.sin(p.life * 3); ctx.globalAlpha = al * .8; ctx.fillStyle = Math.random() < .5 ? a : a2; ctx.shadowBlur = 8; ctx.shadowColor = a; ctx.beginPath(); ctx.arc(p.x, p.y, .8 + p.s * 1.4, 0, 7); ctx.fill(); ctx.shadowBlur = 0; }
        else if (type === 'sparkles') {
          const al = Math.max(0, Math.sin(p.life * 1.5)); ctx.globalAlpha = al * .9; ctx.fillStyle = p.s > 1.1 ? a2 : '#fff';
          const r = 1.5 + p.s * 2.5; ctx.beginPath(); ctx.moveTo(p.x, p.y - r * 2); ctx.quadraticCurveTo(p.x, p.y, p.x + r * 2, p.y); ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + r * 2); ctx.quadraticCurveTo(p.x, p.y, p.x - r * 2, p.y); ctx.quadraticCurveTo(p.x, p.y, p.x, p.y - r * 2); ctx.fill();
        }
        if (p.y > h + 30 || p.y < -40 - (type === 'shooting' ? h : 0) || p.x < -60 || p.x > w * 1.3) Object.assign(p, spawn(false));
        if (type === 'shooting' && p.star && Math.random() < .0008) Object.assign(p, spawn(false));
      }
      // Funkenspur (Belohnung)
      for (const s of sparks) {
        s.x += s.vx * dt; s.y += s.vy * dt; s.vy += .03 * dt; s.life -= .035 * dt;
        if (s.life <= 0) continue;
        ctx.globalAlpha = s.life; ctx.fillStyle = s.r > 2 ? a2 : a; ctx.shadowBlur = 8; ctx.shadowColor = a;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * s.life + .3, 0, 7); ctx.fill();
      }
      ctx.shadowBlur = 0;
      sparks = sparks.filter(s => s.life > 0);
      ctx.globalAlpha = 1;
      if (type === 'off' && !sparks.length) { cancelAnimationFrame(raf); raf = null; ctx.clearRect(0, 0, w, h); }
    };
    return {
      set(t, d = 1) {
        type = t || 'off'; density = d;
        if (!ctx) resize();
        cancelAnimationFrame(raf); raf = null;
        ctx && ctx.clearRect(0, 0, w, h);
        if (type === 'off') { parts = []; return; }
        const base = { petals: 26, sakura: 30, snow: 60, embers: 40, sparkles: 34, gears: 14, shooting: 40, hearts: 22, feathers: 16 }[type] || 30;
        parts = Array.from({ length: Math.round(base * density) }, () => spawn(true));
        raf = requestAnimationFrame(frame);
      },
      get type() { return type; },
      trail(on) { trailOn = !!on; if (!ctx) resize(); },
    };
  })();

  // ---------- Logo (Uhr mit Stern, eigenes Design) ----------
  T.logoSVG = (size = 26) => `<svg width="${size}" height="${size}" viewBox="0 0 64 64" class="logo-svg"><defs><linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--accent2)"/><stop offset="1" stop-color="var(--accent)"/></linearGradient></defs><circle cx="32" cy="32" r="29" fill="none" stroke="url(#lg1)" stroke-width="3"/><circle cx="32" cy="32" r="23" fill="none" stroke="var(--accent2)" stroke-width="1" stroke-dasharray="1.5 4.2" opacity=".8"/>${[0, 90, 180, 270].map(a => `<rect x="30.8" y="5.5" width="2.4" height="6" rx="1" fill="var(--accent2)" transform="rotate(${a} 32 32)"/>`).join('')}<path d="M32 13 35 27 46 32 35 37 32 51 29 37 18 32 29 27Z" fill="url(#lg1)"/><line x1="32" y1="32" x2="40" y2="20" stroke="var(--text)" stroke-width="2.4" stroke-linecap="round"/><circle cx="32" cy="32" r="3" fill="var(--text)"/></svg>`;
})();
