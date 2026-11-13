/* Spirit Notes – Level-Belohnungen: Spirit-Pfad mit Themes, Partikeln, Stickern, Rahmen & Funkenspur
   Gespeichert in .spirit/rewards.json -> wird automatisch mit dem Handy synchronisiert. */
(() => {
  const R = SN.rewards = {};
  const h = SN.h, $ = SN.$;

  // ---------- Sticker (eigene Designs) ----------
  const G = (id, a, b) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
  R.STICKERS = {
    watch: { name: 'Taschenuhr', svg: `${G('w', '#ffe08a', '#c8901e')}<circle cx="32" cy="36" r="22" fill="#1a0a10" stroke="url(#w)" stroke-width="4"/><circle cx="32" cy="10" r="5" fill="none" stroke="url(#w)" stroke-width="3"/><rect x="29" y="12" width="6" height="4" rx="1" fill="url(#w)"/>${[0, 90, 180, 270].map(a => `<rect x="31" y="17" width="2" height="5" fill="#ffe08a" transform="rotate(${a} 32 36)"/>`).join('')}<line x1="32" y1="36" x2="32" y2="23" stroke="#e11d48" stroke-width="2.5" stroke-linecap="round"/><line x1="32" y1="36" x2="41" y2="40" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><circle cx="32" cy="36" r="2.5" fill="#e11d48"/>` },
    hourglass: { name: 'Sanduhr', svg: `${G('h', '#ffe08a', '#c8901e')}<rect x="14" y="6" width="36" height="6" rx="2" fill="url(#h)"/><rect x="14" y="52" width="36" height="6" rx="2" fill="url(#h)"/><path d="M19 12 h26 c0 12-9 15-9 20 s9 8 9 20 h-26 c0-12 9-15 9-20 s-9-8-9-20z" fill="rgba(255,255,255,.12)" stroke="#ffe08a" stroke-width="2"/><path d="M24 18 h16 c-1 6-6 9-8 12 c-2-3-7-6-8-12z" fill="#e11d48"/><path d="M22 51 c2-7 7-9 10-9 s8 2 10 9z" fill="#e11d48"/><line x1="32" y1="31" x2="32" y2="43" stroke="#ff6b8b" stroke-width="1.5" stroke-dasharray="1.5 2"/>` },
    gear: { name: 'Zahnrad', svg: `${G('g', '#ffe08a', '#b77d16')}<g transform="translate(32 32)">${Array.from({ length: 10 }, (_, i) => `<rect x="-4" y="-27" width="8" height="10" rx="2" fill="url(#g)" transform="rotate(${i * 36})"/>`).join('')}<circle r="19" fill="url(#g)"/><circle r="11" fill="#1a0a10"/><circle r="6" fill="#e11d48"/></g>` },
    moon: { name: 'Mondsichel', svg: `${G('m', '#fff4c7', '#d4af37')}<path d="M40 8 A24 24 0 1 0 54 44 A19 19 0 1 1 40 8z" fill="url(#m)"/><path d="M48 14 l1.8 4.2 4.2 1.8 -4.2 1.8 -1.8 4.2 -1.8-4.2 -4.2-1.8 4.2-1.8z" fill="#ff6b8b"/><circle cx="52" cy="30" r="1.6" fill="#fff"/>` },
    rose: { name: 'Karmesinrose', svg: `${G('r', '#ff4d6d', '#8b0a26')}<path d="M32 58 C30 48 31 40 32 34" stroke="#3f7d3a" stroke-width="3" fill="none"/><path d="M31 46 c-6-4-12-2-14 2 c6 2 10 2 14-2z" fill="#3f7d3a"/><circle cx="32" cy="24" r="16" fill="url(#r)"/><path d="M32 12 c-8 4-9 14-2 18 c6 3 12-2 10-8 c-1-4-5-5-7-3" fill="none" stroke="#ffb3c1" stroke-width="2" stroke-linecap="round"/><path d="M18 24 c2 8 8 12 14 12 s12-4 14-12" fill="none" stroke="#5a0618" stroke-width="2"/>` },
    sigil: { name: 'Sternsiegel', svg: `${G('s', '#c084fc', '#e11d48')}<circle cx="32" cy="32" r="27" fill="#12081c" stroke="url(#s)" stroke-width="3"/><circle cx="32" cy="32" r="21" fill="none" stroke="#d4af37" stroke-width="1" stroke-dasharray="2 3"/><polygon points="32,12 49.3,42 14.7,42" fill="none" stroke="#e9d5ff" stroke-width="2"/><polygon points="32,52 14.7,22 49.3,22" fill="none" stroke="#e9d5ff" stroke-width="2"/><circle cx="32" cy="32" r="4" fill="#d4af37"/>` },
    wings: { name: 'Flügel', svg: `${G('wi', '#ffffff', '#cdb4ff')}<path d="M30 34 C22 18 8 14 2 18 c6 2 8 6 8 6 c-5 0-7 3-7 3 c6 1 8 4 8 4 c-4 1-5 4-5 4 c10 2 18 1 24-1z" fill="url(#wi)"/><path d="M34 34 C42 18 56 14 62 18 c-6 2-8 6-8 6 c5 0 7 3 7 3 c-6 1-8 4-8 4 c4 1 5 4 5 4 c-10 2-18 1-24-1z" fill="url(#wi)"/><circle cx="32" cy="35" r="5" fill="#e11d48" stroke="#d4af37" stroke-width="2"/>` },
    crown: { name: 'Krone', svg: `${G('c', '#ffe08a', '#c8901e')}<path d="M8 46 L12 18 L24 32 L32 12 L40 32 L52 18 L56 46z" fill="url(#c)" stroke="#8a5a0a" stroke-width="1.5"/><rect x="8" y="46" width="48" height="8" rx="2" fill="url(#c)"/><circle cx="32" cy="38" r="5" fill="#e11d48"/><circle cx="19" cy="40" r="3" fill="#a855f7"/><circle cx="45" cy="40" r="3" fill="#38bdf8"/><circle cx="12" cy="18" r="2.5" fill="#fff4c7"/><circle cx="32" cy="12" r="2.5" fill="#fff4c7"/><circle cx="52" cy="18" r="2.5" fill="#fff4c7"/>` },
  };
  R.stickerUrl = (id) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="128" height="128">${R.STICKERS[id].svg}</svg>`);
  const STICKER_SETS = { time: ['watch', 'hourglass', 'gear', 'moon'], spirit: ['rose', 'sigil', 'wings', 'crown'] };

  // ---------- Der Spirit-Pfad ----------
  R.LIST = [
    { id: 'stk-time', lvl: 2, type: 'stickers', set: 'time', name: 'Zeit-Sticker', desc: 'Taschenuhr, Sanduhr, Zahnrad & Mondsichel – im Editor mit /sticker einfügen.' },
    { id: 'pt-gears', lvl: 3, type: 'particles', value: 'gears', name: 'Partikel: Zahnräder', desc: 'Goldene Uhrwerk-Zahnräder schweben durch die App.' },
    { id: 'th-midnight', lvl: 4, type: 'theme', value: 'midnight', name: 'Theme: Midnight Gold', desc: 'Tiefes Schwarz mit edlem Gold.' },
    { id: 'fr-crimson', lvl: 5, type: 'frame', value: 'crimson', name: 'Rahmen: Karmesin', desc: 'Ein roter Zier-Rahmen um dein Level.' },
    { id: 'pt-shooting', lvl: 6, type: 'particles', value: 'shooting', name: 'Partikel: Sternschnuppen', desc: 'Sternschnuppen ziehen über den Himmel.' },
    { id: 'th-bloodmoon', lvl: 7, type: 'theme', value: 'bloodmoon', name: 'Theme: Blood Moon', desc: 'Blutroter Mond über silberblauer Nacht.' },
    { id: 'stk-spirit', lvl: 8, type: 'stickers', set: 'spirit', name: 'Spirit-Sticker', desc: 'Rose, Sternsiegel, Flügel & Krone.' },
    { id: 'tr-sparks', lvl: 9, type: 'trail', value: 'sparks', name: 'Funkenspur', desc: 'Deine Maus (oder dein Finger) hinterlässt Funken.' },
    { id: 'fr-gold', lvl: 10, type: 'frame', value: 'gold', name: 'Rahmen: Gold', desc: 'Ein goldener Uhren-Rahmen für Level 10+.' },
    { id: 'pt-feathers', lvl: 11, type: 'particles', value: 'feathers', name: 'Partikel: Federn', desc: 'Weiche Federn schweben herab.' },
    { id: 'th-idol', lvl: 12, type: 'theme', value: 'idol', name: 'Theme: Starlight Idol', desc: 'Neon-Pink & Cyan wie auf einer Bühne.' },
    { id: 'pt-hearts', lvl: 14, type: 'particles', value: 'hearts', name: 'Partikel: Herzen', desc: 'Kleine Herzen für verliebte Kapitel.' },
    { id: 'fr-diamond', lvl: 15, type: 'frame', value: 'diamond', name: 'Rahmen: Diamant', desc: 'Funkelnder Kristall-Rahmen.' },
    { id: 'th-abyss', lvl: 16, type: 'theme', value: 'abyss', name: 'Theme: Abyss', desc: 'Türkis-Leuchten aus der Tiefe.' },
    { id: 'th-royal', lvl: 18, type: 'theme', value: 'royal', name: 'Theme: Chronos Royal', desc: 'Karmesin, Gold & Violett – königlich.' },
    { id: 'fr-royal', lvl: 20, type: 'frame', value: 'royal', name: 'Rahmen: Zeitkrone', desc: 'Der legendäre, sich drehende Rahmen.' },
  ];
  const TYPE_ICON = { stickers: 'sparkles', particles: 'star', theme: 'palette', frame: 'target', trail: 'zap' };
  const TYPE_LABEL = { stickers: 'Sticker', particles: 'Partikel', theme: 'Theme', frame: 'Rahmen', trail: 'Effekt' };

  // ---------- Speicher ----------
  R.init = async () => { R.store = SN.data.rewards = new SN.Store('rewards', { claimed: {}, equipped: { frame: '', trail: false } }); await R.store.load(); R.applyEquipped(); };
  R.claimed = (id) => !!(R.store && R.store.value.claimed[id]);
  R.level = () => SN.stats.level().lvl;
  R.ready = () => R.LIST.filter(r => r.lvl <= R.level() && !R.claimed(r.id));
  R.has = (type, value) => R.LIST.some(r => r.type === type && (r.value === value || r.set === value) && R.claimed(r.id));
  R.lockedTheme = (id) => { const r = R.LIST.find(x => x.type === 'theme' && x.value === id); return r && !R.claimed(r.id) ? r : null; };
  R.lockedParticles = (id) => { const r = R.LIST.find(x => x.type === 'particles' && x.value === id); return r && !R.claimed(r.id) ? r : null; };
  R.stickers = () => Object.entries(STICKER_SETS).filter(([set]) => R.has('stickers', set)).flatMap(([, ids]) => ids);
  R.applyEquipped = () => {
    const eq = R.store?.value.equipped || {};
    SN.themes.particles.trail(!!(eq.trail && R.has('trail', 'sparks')));
    document.body.dataset.frame = eq.frame && R.has('frame', eq.frame) ? eq.frame : '';
    SN.emit('rewards');
  };
  R.equip = (patch) => { Object.assign(R.store.value.equipped, patch); R.store.save(); R.applyEquipped(); };

  R.claim = (r, card, quiet) => {
    if (R.claimed(r.id) || r.lvl > R.level()) return;
    R.store.value.claimed[r.id] = new Date().toISOString();
    R.store.save();
    if (!quiet) SN.sound('level');
    if (card) burst(card);
    if (!quiet) SN.toast(`Belohnung eingesammelt: ${r.name} ✦`, 'level', 3500);
    if (r.type === 'frame' && !R.store.value.equipped.frame) R.equip({ frame: r.value });
    if (r.type === 'trail') R.equip({ trail: true });
    SN.emit('rewards');
  };
  R.use = (r) => {
    if (r.type === 'theme') { SN.saveSettings({ theme: r.value, accent: '' }); SN.themes.apply(); SN.toast(r.name + ' aktiv', 'ok'); }
    else if (r.type === 'particles') { SN.saveSettings({ particles: r.value }); SN.themes.apply(); SN.toast(r.name + ' aktiv', 'ok'); }
    else if (r.type === 'frame') R.equip({ frame: R.store.value.equipped.frame === r.value ? '' : r.value });
    else if (r.type === 'trail') R.equip({ trail: !R.store.value.equipped.trail });
    else if (r.type === 'stickers') { SN.app.show('notes'); if (!SN.editor.active) SN.toast('Öffne eine Notiz und tippe /sticker', 'info'); else SN.editor.stickerPicker(); }
    R.render();
  };
  function burst(card) {
    const r = card.getBoundingClientRect();
    const colors = ['var(--accent)', 'var(--accent2)', 'var(--accent3)', '#fff'];
    for (let i = 0; i < 26; i++) {
      const s = h('i.rw-spark', { style: { left: (r.left + r.width / 2) + 'px', top: (r.top + r.height / 2) + 'px', background: colors[i % 4], '--dx': (Math.cos(i / 26 * Math.PI * 2) * (80 + Math.random() * 90)).toFixed(0) + 'px', '--dy': (Math.sin(i / 26 * Math.PI * 2) * (80 + Math.random() * 90)).toFixed(0) + 'px' } });
      document.body.append(s); setTimeout(() => s.remove(), 1000);
    }
    card.classList.add('claimed-now');
  }

  // ---------- Level-Ring mit Rahmen ----------
  R.ring = (size, pct, inner, cls = '') => {
    const r = size / 2 - 6, c = 2 * Math.PI * r;
    return `<div class="lvl-ring ${cls}" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><defs><linearGradient id="lrg${size}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--accent2)"/></linearGradient></defs>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="${size > 60 ? 5 : 3}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="url(#lrg${size})" stroke-width="${size > 60 ? 5 : 3}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}" transform="rotate(-90 ${size / 2} ${size / 2})" style="filter:drop-shadow(0 0 4px var(--glow))"/></svg><span class="lvl-ring-in">${inner}</span><i class="lvl-frame"></i></div>`;
  };

  // ---------- Ansicht ----------
  R.render = () => {
    const root = $('#view-rewards'); if (!root) return;
    root.innerHTML = '';
    const lv = SN.stats.level();
    const ready = R.ready();
    const col = h('div.view-col');
    col.append(h('div.view-head', h('div', h('h2.view-title', { html: 'Belohnungen <span class="jp">報酬</span>' }), h('div.view-sub', 'Steig im Level auf und sammle Themes, Partikel, Sticker und Rahmen ein.')), h('div.spacer'),
      ready.length > 1 ? h('button.btn.primary', { html: SN.icon('sparkles', 16) + `<span>Alle ${ready.length} einsammeln</span>`, onclick: () => { SN.sound('level'); ready.forEach((r, i) => setTimeout(() => { R.claim(r, $(`.rw-card[data-id="${r.id}"]`), true); if (i === ready.length - 1) { SN.toast(`${ready.length} Belohnungen eingesammelt ✦ ${ready.map(x => x.name).join(' · ')}`, 'level', 5000); setTimeout(R.render, 900); } }, i * 260)); } }) : null),
      h('div.deco-line'));
    const body = h('div.rw-body');
    // Kopf mit Level
    body.append(h('div.card.ornate.rw-hero',
      h('div', { html: R.ring(112, lv.pct, `<b>${lv.lvl}</b><small>LEVEL</small>`, 'big') }),
      h('div.rw-hero-info',
        h('div.rw-title', lv.title),
        h('div.lv-bar', h('i', { style: { width: (lv.pct * 100) + '%' } })),
        h('div.faint', { style: { fontSize: '12.5px' } }, `${SN.fmtNum(lv.xp)} XP · noch ${SN.fmtNum(lv.next - lv.xp)} XP bis Level ${lv.lvl + 1}`),
        h('div.rw-hero-row',
          h('span.rw-pill' + (ready.length ? '.hot' : ''), { html: `${SN.icon('trophy', 14)} ${ready.length ? `${ready.length} bereit zum Einsammeln` : 'Alles eingesammelt'}` }),
          h('span.rw-pill', { html: `${SN.icon('check', 14)} ${R.LIST.filter(r => R.claimed(r.id)).length} / ${R.LIST.length} gesammelt` }),
          h('button.btn.small', { html: SN.icon('info', 14) + '<span>So bekommst du XP</span>', onclick: () => SN.views.home.levelInfo() })))));
    // Pfad
    const path = h('div.rw-path');
    for (const r of R.LIST) {
      const claimed = R.claimed(r.id), avail = !claimed && r.lvl <= lv.lvl, locked = r.lvl > lv.lvl;
      const eq = R.store.value.equipped;
      const active = (r.type === 'theme' && SN.settings.theme === r.value) || (r.type === 'particles' && SN.settings.particles === r.value) || (r.type === 'frame' && eq.frame === r.value) || (r.type === 'trail' && eq.trail);
      const card = h('div.rw-card' + (claimed ? '.claimed' : '') + (avail ? '.avail' : '') + (locked ? '.locked' : ''), { data: { id: r.id } },
        h('div.rw-lvl', { title: 'Level ' + r.lvl }, h('b', r.lvl)),
        h('div.rw-prev', preview(r)),
        h('div.rw-info', h('div.rw-type', { html: `${SN.icon(TYPE_ICON[r.type], 12)} ${TYPE_LABEL[r.type]}` }), h('b', r.name), h('p', r.desc)),
        h('div.rw-act',
          avail ? h('button.btn.primary.small', { html: SN.icon('sparkles', 14) + '<span>Einsammeln!</span>', onclick: (e) => { R.claim(r, card); setTimeout(R.render, 900); } }) : null,
          claimed ? h('button.btn.small' + (active ? '.on-eq' : ''), { onclick: () => R.use(r) },
            r.type === 'stickers' ? 'Einfügen' : r.type === 'frame' || r.type === 'trail' ? (active ? 'Ablegen' : 'Anlegen') : (active ? 'Aktiv ✓' : 'Benutzen')) : null,
          locked ? h('span.rw-lock', { html: `${SN.icon('pin', 13)} ab Level ${r.lvl}` }) : null));
      path.append(card);
    }
    body.append(path);
    col.append(body);
    root.append(col);
  };
  function preview(r) {
    if (r.type === 'stickers') return h('div.rw-stickers', ...STICKER_SETS[r.set].map(id => h('img', { src: R.stickerUrl(id), alt: R.STICKERS[id].name })));
    if (r.type === 'theme') { const t = SN.themes.list[r.value]; return h('div.rw-theme', { style: { background: `radial-gradient(circle at 80% 120%, ${t.vars.accent}66, transparent 60%), linear-gradient(160deg, ${t.vars.bg2}, ${t.vars.bg})` } }, h('i', { style: { background: t.vars.accent } }), h('i', { style: { background: t.vars.accent2 } }), h('i', { style: { background: t.vars.accent3 } })); }
    if (r.type === 'frame') return h('div', { html: R.ring(56, .7, `<b style="font-size:16px">★</b>`, 'preview frame-' + r.value) });
    const icons = { gears: 'settings', shooting: 'star', feathers: 'feather', hearts: 'heart', sparks: 'zap' };
    return h('div.rw-icon', { html: SN.icon(icons[r.value] || 'sparkles', 30) });
  }

  // Kurzer Hinweis nach einem Level-Up
  R.levelUp = (lvl) => {
    const newOnes = R.LIST.filter(r => r.lvl === lvl && !R.claimed(r.id));
    if (!newOnes.length) return;
    setTimeout(() => SN.toast(`Neue Belohnung: ${newOnes.map(r => r.name).join(', ')} – hier tippen zum Einsammeln!`, 'level', 7000, () => SN.app.show('rewards')), 1200);
  };
})();

SN.views.rewards = { render: () => SN.rewards.render() };
