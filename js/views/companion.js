/* Spirit Notes – Begleiterin: kümmere dich um dein Anime-Mädchen (Tamagotchi-artiges Spiel)
   Sie reagiert auf das, was du im Spiel machst – und auf deine Aufgaben, Notizen & Fokus-Zeit. */
(() => {
  const V = SN.views.companion = {};
  const C = SN.companion = {};
  const h = SN.h, $ = SN.$;
  const A = () => SN.compArt, L = () => SN.compLines;
  let store;

  // ------------------------------------------------------------------ Spieldaten
  const TIERS = [[0, 'Fremde'], [40, 'Bekannte'], [120, 'Freunde'], [260, 'Gute Freunde'], [450, 'Beste Freunde'], [700, 'Seelenverwandt']];
  const NEEDS = [['hunger', 'Hunger', '🍙', '#fb923c'], ['energy', 'Energie', '⚡', '#facc15'], ['fun', 'Laune', '🎈', '#f472b6'], ['clean', 'Pflege', '🫧', '#38bdf8']];
  const FOODS = {
    onigiri: { n: 'Onigiri', e: '🍙', p: 5, hunger: 25 }, ramen: { n: 'Ramen', e: '🍜', p: 12, hunger: 45, energy: 5 }, parfait: { n: 'Erdbeer-Parfait', e: '🍨', p: 10, hunger: 20, fun: 15 },
    taiyaki: { n: 'Taiyaki', e: '🐟', p: 8, hunger: 22, fun: 8 }, mochi: { n: 'Mochi', e: '🍡', p: 8, hunger: 18, fun: 8 }, choco: { n: 'Dunkle Schokolade', e: '🍫', p: 6, hunger: 12, fun: 12 },
    bento: { n: 'Bento-Box', e: '🍱', p: 15, hunger: 55 }, cake: { n: 'Erdbeertorte', e: '🍰', p: 9, hunger: 15, fun: 18 }, tea: { n: 'Grüner Tee', e: '🍵', p: 4, hunger: 5, energy: 15 },
    curry: { n: 'Scharfes Curry', e: '🍛', p: 12, hunger: 40 }, natto: { n: 'Natto', e: '🥢', p: 6, hunger: 25 }, salad: { n: 'Salat', e: '🥗', p: 7, hunger: 20 },
    spicy: { n: 'Scharfe Chips', e: '🌶️', p: 5, hunger: 10, fun: 5 }, garlic: { n: 'Knoblauchbrot', e: '🧄', p: 6, hunger: 22 },
  };
  const GIFTS = { flowers: { n: 'Blumenstrauß', e: '💐', p: 20 }, plush: { n: 'Plüschtier', e: '🧸', p: 30 }, game: { n: 'Videospiel', e: '🎮', p: 35 }, book: { n: 'Sternenbuch', e: '📖', p: 25 }, candle: { n: 'Duftkerze', e: '🕯️', p: 20 }, letter: { n: 'Liebevoller Brief', e: '💌', p: 10 }, gem: { n: 'Funkelkristall', e: '💎', p: 60 } };
  const OUTFIT_P = { casual: 0, pajama: 0, school: 60, hoodie: 60, gothic: 80, summer: 90, yukata: 120 };
  const ACC_P = { cat: 50, glasses: 40, phones: 60, crown: 70, witch: 80, straw: 70, tiara: 100 };
  const DECOR_P = { clock: 35, plant: 40, poster: 45, plush: 50, lamp: 55, rug: 60, lights: 70 };
  const DECAY = { awake: { hunger: 5, energy: 4, fun: 4, clean: 2.5 }, asleep: { hunger: 2.5, energy: -18, fun: 0, clean: 1 } };   // pro Stunde
  const today = () => SN.todayKey();
  const tierOf = (aff) => { let i = 0; TIERS.forEach((t, k) => { if (aff >= t[0]) i = k; }); return i; };
  const clamp = (v) => Math.max(0, Math.min(100, v));
  const coinSVG = (s = 16) => `<svg class="coin" width="${s}" height="${s}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#f5c542" stroke="#b7861b" stroke-width="2"/><circle cx="12" cy="12" r="6.5" fill="none" stroke="#fff3c4" stroke-width="1.4" opacity=".8"/><path d="M12 7.5l1.3 3 3.2.3-2.4 2.1.7 3.1-2.8-1.6-2.8 1.6.7-3.1-2.4-2.1 3.2-.3z" fill="#fff6d6"/></svg>`;

  C.init = async () => {
    store = SN.data.companion = new SN.Store('companion', { active: '', girls: {}, coins: 0, owned: {}, decor: {}, opts: { toasts: true }, daily: '', wish: null, earn: {} });
    await store.load();
    SN.on('bump', onBump);
    SN.on('data:companion', () => updateNav());
    setInterval(() => { const g = cur(); if (!g) return; tick(g); if (SN.app.view === 'companion') { updateHud(); drawRoom(); } else needToast(g); }, 60000);
    updateNav();
  };
  const cur = () => store && store.value.active ? store.value.girls[store.value.active] : null;
  const def = () => A().GIRLS[store.value.active];
  const nameOf = (g = cur()) => (g && g.name) || (def() && def().name) || 'Begleiterin';
  const user = () => SN.settings.name || 'du';
  const save = () => store.save();

  function tick(g) {
    const now = Date.now();
    let hrs = Math.min(72, Math.max(0, (now - (g.t || now)) / 3600000));
    g.t = now;
    if (!hrs) return;
    const d = g.asleep ? DECAY.asleep : DECAY.awake;
    for (const k of Object.keys(d)) g[k] = clamp(g[k] - d[k] * hrs);
    if (g.asleep && g.energy >= 100) g.wakeReady = true;
    // längere Vernachlässigung kostet etwas Zuneigung (nie unter 0)
    const crit = NEEDS.filter(([k]) => g[k] <= 0).length;
    if (crit && hrs > 3) g.aff = Math.max(0, g.aff - Math.min(10, Math.round(crit * hrs / 6)));
    save();
  }
  const mood = (g) => (g.hunger + g.energy + g.fun + g.clean) / 4;
  const lowest = (g) => NEEDS.map(([k]) => [k, g[k]]).sort((a, b) => a[1] - b[1])[0];
  function idleExpr(g) {
    if (g.asleep) return 'sleep';
    const [k, v] = lowest(g);
    if (v < 20) return { hunger: 'hungry', energy: 'sleepy', fun: 'pout', clean: 'shy' }[k];
    const m = mood(g);
    return m > 75 ? 'happy' : m > 45 ? 'neutral' : 'sad';
  }
  const needText = (g) => { const [k, v] = lowest(g); if (v >= 35) return ''; return { hunger: 'Ich hab Hunger.', energy: 'Ich bin so müde.', fun: 'Mir ist langweilig.', clean: 'Ich fühl mich nicht frisch.' }[k]; };
  function gainAff(g, kind, n, cap) {
    const c = g.caps && g.caps.d === today() ? g.caps : (g.caps = { d: today() });
    c[kind] = (c[kind] || 0) + 1;
    if (cap && c[kind] > cap) return 0;
    const before = tierOf(g.aff);
    g.aff = Math.max(0, (g.aff || 0) + n);
    const after = tierOf(g.aff);
    if (after > before) setTimeout(() => { say('tierup', { tier: TIERS[after][1] }); fx('love', 10); SN.sound('level'); }, 2600);
    return n;
  }
  function coins(n, why) {
    store.value.coins = Math.max(0, (store.value.coins || 0) + n);
    save();
    if (n > 0 && SN.app.view === 'companion') { const el = $('.cp-coins b'); if (el) { el.textContent = SN.fmtNum(store.value.coins); el.parentElement.classList.remove('bump'); void el.offsetWidth; el.parentElement.classList.add('bump'); } }
    if (why && n > 0) flyText(`+${n}`, true);
  }
  const canPay = (p) => (store.value.coins || 0) >= p;

  // ------------------------------------------------------------------ Produktivität (Planer, Notizen, Fokus)
  const toastAt = { t: 0 };
  function earnCap(kind, n, cap) {
    const e = store.value.earn.d === today() ? store.value.earn : (store.value.earn = { d: today() });
    const left = Math.max(0, cap - (e[kind] || 0));
    const got = Math.min(left, n);
    e[kind] = (e[kind] || 0) + got;
    return got;
  }
  function onBump(field, n) {
    const g = cur(); if (!g || n <= 0) return;
    const day = SN.stats.day();
    let ev = null, vars = {}, earned = 0;
    if (field === 'tasks') { earned = earnCap('tasks', 5 * n, 60); ev = day.tasks >= 3 && day.tasks % 3 === 0 ? 'tasks_many' : 'task_done'; vars.n = day.tasks; gainAff(g, 'task', 2, 10); }
    else if (field === 'focus') { earned = earnCap('focus', n, 60); ev = 'focus_done'; gainAff(g, 'focus', 3, 4); }
    else if (field === 'notes') { earned = earnCap('notes', 3, 15); ev = 'note_new'; }
    else if (field === 'anime') { earned = earnCap('anime', 15, 45); ev = 'anime_done'; const a = SN.views.anime.list().filter(x => x.status === 'completed').sort((x, y) => (y.updated || '') > (x.updated || '') ? 1 : -1)[0]; vars.anime = a ? a.title : 'den Anime'; }
    else if (field === 'words') {
      const before = day.words - n;
      g.wordAcc = (g.wordAcc || 0) + n;
      if (g.wordAcc >= 50) { earned = earnCap('words', Math.floor(g.wordAcc / 50), 40); g.wordAcc %= 50; }
      const marks = [1, 500, 1000, 2000];
      const hit = marks.find(m => before < m && day.words >= m);
      if (hit) { ev = hit === 1 ? 'words' : 'words_many'; vars.n = SN.fmtNum(day.words); }
    }
    if (earned) coins(earned);
    save();
    checkWish();
    if (!ev) return;
    if (SN.app.view === 'companion') say(ev, vars);
    else if (store.value.opts.toasts !== false && (Date.now() - toastAt.t > 8000 || field === 'tasks')) { toastAt.t = Date.now(); compToast(ev, vars, earned); }
  }
  function compToast(ev, vars, earned) {
    const g = cur(); if (!g) return;
    const { text, expr } = L().pick(store.value.active, ev, { user: user(), ...vars }, tierOf(g.aff));
    const t = h('div.toast.comp-toast.clickable', { onclick: () => { t.remove(); SN.app.show('companion'); } },
      h('div.ct-face', { html: A().face(store.value.active, expr, look(g)) }),
      h('div.ct-body', h('b', nameOf(g)), h('span', text), earned ? h('small', { html: `${coinSVG(12)} +${earned}` }) : null));
    $('#toast-root').append(t);
    requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 400); }, 6000);
  }
  function needToast(g) {
    if (store.value.opts.toasts === false || g.asleep) return;
    const [k, v] = lowest(g);
    if (v > 15 || Date.now() - (g.needToast || 0) < 3 * 3600000) return;
    g.needToast = Date.now(); save();
    compToast({ hunger: 'hungry', energy: 'tired', fun: 'bored', clean: 'dirty' }[k], {}, 0);
  }

  // ------------------------------------------------------------------ Tageswunsch & Bonus
  function makeWish(g) {
    const d = def();
    const opts = [
      { k: 'feed', food: d.likes, text: `Ich hätte so gern ${FOODS[d.likes].n} ${FOODS[d.likes].e}!` },
      { k: 'words', n: 300, text: 'Schreib heute mindestens 300 Wörter!' },
      { k: 'play', text: 'Spiel heute ein Spiel mit mir!' },
      { k: 'bath', text: 'Ein schönes, warmes Bad wäre toll.' },
      { k: 'pat', n: 5, text: 'Streichel mir heute fünfmal über den Kopf!' },
    ];
    if (SN.views.planner.tasks().some(t => t.status !== 'done')) opts.push({ k: 'tasks', n: 3, text: 'Schaffst du heute 3 Aufgaben aus deinem Planer?' });
    opts.push({ k: 'focus', n: 25, text: 'Mach heute 25 Minuten Fokus-Zeit!' });
    const w = opts[Math.floor(Math.random() * opts.length)];
    return { d: today(), girl: store.value.active, prog: 0, done: false, ...w };
  }
  function wishProgress(w) {
    const day = SN.stats.day();
    if (w.k === 'words') return Math.min(1, day.words / w.n);
    if (w.k === 'tasks') return Math.min(1, day.tasks / w.n);
    if (w.k === 'focus') return Math.min(1, day.focus / w.n);
    if (w.k === 'pat') return Math.min(1, (w.prog || 0) / w.n);
    return w.prog ? 1 : 0;
  }
  function checkWish(kind, extra) {
    const w = store.value.wish, g = cur();
    if (!w || w.done || w.d !== today() || w.girl !== store.value.active) return;
    if (kind && kind === w.k && (kind !== 'feed' || extra === w.food)) w.prog = (w.prog || 0) + 1;
    if (wishProgress(w) >= 1) {
      w.done = true; coins(30, true); gainAff(g, 'wish', 15);
      save();
      if (SN.app.view === 'companion') { setTimeout(() => { say('wish_done'); fx('love', 12); }, 1800); drawWish(); }
      else compToast('wish_done', {}, 30);
    } else { save(); if (SN.app.view === 'companion') drawWish(); }
  }
  function daily(g) {
    const q = [];
    if (store.value.daily !== today()) {
      store.value.daily = today();
      const n = 15 + tierOf(g.aff) * 5;
      coins(n); q.push(['daily', { n }]);
    }
    if (!store.value.wish || store.value.wish.d !== today() || store.value.wish.girl !== store.value.active) { store.value.wish = makeWish(g); q.push(['wish', { wish: store.value.wish.text }]); }
    save();
    return q;
  }

  // ------------------------------------------------------------------ Ansicht
  let ui = { expr: null, exprUntil: 0, bubbleQ: [], typing: false, idleT: null, blinkT: null, greeted: 0 };
  V.render = () => {
    const root = $('#view-companion');
    root.innerHTML = '';
    clearTimeout(ui.idleT); clearTimeout(ui.blinkT);
    if (!store) return;
    const g = cur();
    if (!g || ui.picking) return renderSelect(root);
    tick(g);
    renderGame(root, g);
  };

  // ---------- Auswahl ----------
  function renderSelect(root) {
    const col = h('div.view-col');
    col.append(h('div.view-head', h('div', h('h2.view-title', { html: 'Wähle deine Begleiterin <span class="jp">相棒</span>' }), h('div.view-sub', 'Um wen möchtest du dich kümmern? Du kannst später jederzeit wechseln – jede behält ihren Fortschritt.')),
      h('div.spacer'), cur() ? h('button.btn', { html: SN.icon('x', 15) + '<span>Abbrechen</span>', onclick: () => { ui.picking = false; V.render(); } }) : null), h('div.deco-line'));
    const grid = h('div.cp-pick');
    for (const [id, d] of Object.entries(A().GIRLS)) {
      const known = store.value.girls[id];
      const fav = FOODS[d.likes];
      grid.append(h('div.cp-card' + (store.value.active === id ? '.on' : ''), { style: { '--gc': d.hair, '--ga': d.accent } },
        h('div.cp-card-art', { html: A().girl(id, { expr: 'happy' }) }),
        h('div.cp-card-body',
          h('div.cp-card-name', known && known.name ? known.name : d.name), h('div.cp-card-type', d.type), h('p', d.desc),
          h('div.cp-card-meta', h('span', `Liebt: ${fav.e} ${fav.n}`), known ? h('span', { html: `♥ ${TIERS[tierOf(known.aff)][1]}` }) : null),
          h('button.btn.primary', { html: SN.icon('heart', 15) + `<span>${known ? 'Zu ihr wechseln' : 'Sie wählen'}</span>`, onclick: () => choose(id) }))));
    }
    col.append(h('div.cp-pick-wrap', grid, h('div.cp-note.faint', 'Alle Mädchen sind eigene, für Spirit Notes gezeichnete Figuren.')));
    root.append(col);
  }
  async function choose(id) {
    const d = A().GIRLS[id];
    const old = cur();
    let g = store.value.girls[id];
    const first = !g;
    if (first) {
      const name = await SN.prompt('Wie soll sie heißen?', d.name, d.name, 'Du kannst den Namen später jederzeit ändern.');
      if (name === null) return;
      g = store.value.girls[id] = { name: (name || d.name).trim().slice(0, 24) || d.name, hunger: 70, energy: 80, fun: 70, clean: 85, aff: 0, t: Date.now(), asleep: false, outfit: d.outfit, acc: [], met: today() };
      store.value.owned['outfit_' + d.outfit] = true;
      // Startguthaben für deine bisherige Arbeit
      if (!Object.keys(store.value.girls).some(k => k !== id)) {
        const t = SN.stats.store.value.totals || {};
        const bonus = 60 + Math.min(240, Math.round((t.tasks || 0) * 2 + (t.words || 0) / 100 + (t.focus || 0) / 2 + (t.anime || 0) * 5 + (t.notes || 0)));
        store.value.coins = (store.value.coins || 0) + bonus;
        setTimeout(() => SN.toast(`Startguthaben für deine bisherige Arbeit: ${bonus} Spirit-Münzen ✦`, 'level', 6000), 1200);
      }
    }
    if (old && store.value.active !== id) { g.t = g.t || Date.now(); }
    store.value.active = id;
    g.lastSeen = Date.now();
    ui.picking = false; ui.greeted = 0; ui.intro = first;
    save(); updateNav(); V.render();
  }

  // ---------- Spiel ----------
  const look = (g) => ({ outfit: g.asleep ? 'pajama' : g.outfit, acc: g.acc || [] });
  function renderGame(root, g) {
    const d = def();
    root.append(h('div.cp-wrap',
      h('div.cp-stage', { data: { tod: A().timeOfDay() } },
        h('div.cp-room'),
        h('div.cp-hud',
          h('div.cp-name', h('b', nameOf(g)), h('button.icon-btn.small', { title: 'Umbenennen', html: SN.icon('edit', 13), onclick: rename }), h('span.cp-tier')),
          h('div.spacer'),
          h('div.cp-coins', { title: 'Spirit-Münzen – bekommst du für Aufgaben, Fokus, Schreiben & Spiele', html: `${coinSVG(18)}<b>${SN.fmtNum(store.value.coins || 0)}</b>` })),
        h('div.cp-char', { title: 'Streicheln: auf den Kopf tippen' }),
        h('div.cp-fx'), h('div.cp-fx2'),
        h('div.cp-bubble.hidden', { onclick: () => hideBubble() })),
      h('div.cp-panel',
        h('div.cp-needs'),
        h('div.cp-aff'),
        h('div.cp-wish'),
        h('div.cp-actions',
          act('🍙', 'Füttern', foodMenu), act('🎮', 'Spielen', gamesMenu), act('💬', 'Reden', talkMenu), act('🫧', 'Pflegen', careMenu),
          h('button.cp-act.sleep', { onclick: toggleSleep }, h('span.cp-act-ico'), h('span.cp-act-l')),
          act('🎁', 'Geschenke', giftMenu), act('👗', 'Anziehen', wardrobe), act('🛋️', 'Zimmer', roomMenu)),
        h('form.cp-chat', { onsubmit: (e) => { e.preventDefault(); const i = e.target.querySelector('input'); const t = i.value.trim(); if (!t) return; i.value = ''; chat(t); } },
          h('input.input', { placeholder: `Schreib ${nameOf(g)} etwas …`, maxlength: 200, autocomplete: 'off', enterkeyhint: 'send' }),
          h('button.btn.primary', { type: 'submit', html: SN.icon('arrow-r', 16) })),
        h('div.cp-foot',
          h('button.btn.small.ghost', { html: SN.icon('refresh', 13) + '<span>Begleiterin wechseln</span>', onclick: () => { ui.picking = true; say('bye'); setTimeout(V.render, 900); } }),
          h('label.cp-opt', h('input', { type: 'checkbox', checked: store.value.opts.toasts !== false ? true : null, onchange: (e) => { store.value.opts.toasts = e.target.checked; save(); } }), h('span', 'Reaktionen auch in anderen Tabs'))))));
    void d;
    const charEl = $('.cp-char');
    charEl.addEventListener('pointerdown', onCharTap);
    drawRoom(); drawChar(); updateHud(); drawWish(); blinkLoop();
    // Begrüßung
    const first = ui.intro; ui.intro = false;
    const q = [];
    if (first) q.push(['intro', {}]);
    else if (Date.now() - ui.greeted > 30 * 60000) {
      const away = Date.now() - (g.lastSeen || Date.now());
      if (g.wakeReady && g.asleep) { g.asleep = false; g.wakeReady = false; q.push(['wake', {}]); drawRoom(); }
      else if (away > 12 * 3600000) q.push(['missed', {}]);
      else q.push(['greet_' + ({ morning: 'morning', day: 'day', evening: 'evening', night: 'night' }[A().timeOfDay()]), {}]);
    }
    ui.greeted = Date.now();
    g.lastSeen = Date.now(); save();
    if (!g.asleep) q.push(...daily(g));
    drawWish(); updateHud();
    q.forEach(([ev, v], i) => setTimeout(() => say(ev, v, { queue: true }), 400 + i * 50));
    idleLoop();
  }
  const act = (ico, label, fn) => h('button.cp-act', { onclick: fn }, h('span.cp-act-ico', ico), h('span.cp-act-l', label));
  async function rename() {
    const g = cur(); const v = await SN.prompt('Neuer Name', nameOf(g)); if (!v) return;
    g.name = v.trim().slice(0, 24); save(); updateNav(); V.render();
  }
  function drawRoom() {
    const el = $('.cp-room'); if (!el) return;
    const g = cur();
    const decor = {}; for (const k of Object.keys(DECOR_P)) if (store.value.owned['decor_' + k] && store.value.decor[k] !== false) decor[k] = true;
    el.innerHTML = A().room({ tod: A().timeOfDay(), decor, dark: g.asleep });
    const now = new Date(); const m = el.querySelector('.clk-m'), hh = el.querySelector('.clk-h');
    if (m) m.setAttribute('transform', `rotate(${now.getMinutes() * 6})`);
    if (hh) hh.setAttribute('transform', `rotate(${(now.getHours() % 12) * 30 + now.getMinutes() / 2 - 90})`);
  }
  function drawChar(expr) {
    const el = $('.cp-char'); if (!el) return;
    const g = cur();
    const e = expr || (Date.now() < ui.exprUntil && ui.expr) || idleExpr(g);
    el.innerHTML = A().girl(store.value.active, { expr: e, ...look(g) });
    el.classList.toggle('asleep', !!g.asleep);
  }
  function setExpr(e, ms = 3800) { ui.expr = e; ui.exprUntil = Date.now() + ms; drawChar(e); clearTimeout(ui.exprT); ui.exprT = setTimeout(() => drawChar(), ms + 30); }
  function updateHud() {
    const g = cur(); if (!g || !$('.cp-needs')) return;
    $('.cp-needs').innerHTML = '';
    for (const [k, l, ico, col] of NEEDS) {
      const v = Math.round(g[k]);
      $('.cp-needs').append(h('div.cp-need' + (v < 25 ? '.low' : ''), { title: `${l}: ${v}%` }, h('span.cp-need-ico', ico), h('div.cp-need-main', h('div.cp-need-top', h('span', l), h('b', v + '%')), h('div.cp-bar', h('i', { style: { width: v + '%', background: col } })))));
    }
    const ti = tierOf(g.aff), next = TIERS[ti + 1];
    const pct = next ? (g.aff - TIERS[ti][0]) / (next[0] - TIERS[ti][0]) : 1;
    $('.cp-aff').innerHTML = '';
    $('.cp-aff').append(h('div.cp-aff-top', h('span', { html: `<i class="hrt">♥</i> Zuneigung: <b>${TIERS[ti][1]}</b>` }), h('small.faint', next ? `noch ${next[0] - Math.floor(g.aff)} bis „${next[1]}“` : 'Höchste Stufe!')),
      h('div.cp-bar.aff', h('i', { style: { width: (pct * 100) + '%' } })));
    const tierEl = $('.cp-tier'); if (tierEl) tierEl.innerHTML = '♥'.repeat(ti + 1) + '<span>' + '♥'.repeat(TIERS.length - 1 - ti) + '</span>';
    const sb = $('.cp-act.sleep');
    if (sb) { sb.querySelector('.cp-act-ico').textContent = g.asleep ? '☀️' : '🌙'; sb.querySelector('.cp-act-l').textContent = g.asleep ? 'Aufwecken' : 'Schlafen'; }
    const coinsEl = $('.cp-coins b'); if (coinsEl) coinsEl.textContent = SN.fmtNum(store.value.coins || 0);
    if (Date.now() >= ui.exprUntil) drawChar();
  }
  function drawWish() {
    const el = $('.cp-wish'); if (!el) return;
    const w = store.value.wish; el.innerHTML = '';
    if (!w || w.d !== today() || w.girl !== store.value.active) return;
    const p = wishProgress(w);
    el.append(h('div.cp-wish-card' + (w.done ? '.done' : ''), h('span.cp-wish-ico', w.done ? '💖' : '🌠'),
      h('div', h('small', w.done ? 'Tageswunsch erfüllt!' : 'Ihr Tageswunsch'), h('div', w.text), !w.done ? h('div.cp-bar.wish', h('i', { style: { width: (p * 100) + '%' } })) : null),
      h('span.cp-wish-rw', { html: w.done ? '✓' : `${coinSVG(13)}30` })));
  }

  // ---------- Sprechblase ----------
  function say(ev, vars = {}, opt = {}) {
    const g = cur(); if (!g) return;
    const line = L().pick(store.value.active, ev, { user: user(), need: needText(g), ...vars }, tierOf(g.aff));
    if (opt.queue) { ui.bubbleQ.push({ ...line, ev, opt }); if (!ui.typing) nextBubble(); return; }
    ui.bubbleQ = [{ ...line, ev, opt }];
    nextBubble();
  }
  function nextBubble() {
    const b = $('.cp-bubble'); const it = ui.bubbleQ.shift();
    if (!b || !it) { ui.typing = false; return; }
    ui.typing = true;
    setExpr(it.expr, Math.max(3200, it.text.length * 55));
    const fxMap = { love: 'love', joy: 'sparkle', excited: 'sparkle', angry: 'anger', pout: 'anger', cry: 'tear', sleep: 'zzz', sleepy: 'zzz', shy: 'love', content: 'note', surprised: 'shock' };
    if (fxMap[it.expr] && !it.opt.noFx) fx(fxMap[it.expr], it.expr === 'love' ? 6 : 3);
    if (/joy|excited/.test(it.expr)) hop();
    b.classList.remove('hidden');
    b.innerHTML = '';
    const txt = h('span'); b.append(h('b', nameOf(g())), txt);
    let i = 0; clearInterval(ui.typeT);
    ui.typeT = setInterval(() => { i += 2; txt.textContent = it.text.slice(0, i); if (i >= it.text.length) { clearInterval(ui.typeT); } }, 22);
    clearTimeout(ui.bubbleT);
    ui.bubbleT = setTimeout(() => { if (ui.bubbleQ.length) nextBubble(); else { ui.typing = false; b.classList.add('hidden'); } }, Math.max(3600, it.text.length * 60));
    function g() { return cur(); }
  }
  function hideBubble() { clearTimeout(ui.bubbleT); clearInterval(ui.typeT); if (ui.bubbleQ.length) nextBubble(); else { ui.typing = false; $('.cp-bubble')?.classList.add('hidden'); } }
  C.say = say;

  // ---------- Effekte ----------
  function fx(kind, n = 3) {
    const box = $('.cp-fx'); if (!box) return;
    const sym = { love: ['♥', '#ff5c93'], sparkle: ['✦', '#ffd45c'], note: ['♪', '#ffffff'], anger: ['💢', ''], tear: ['💧', ''], zzz: ['Z', '#c7d2fe'], shock: ['❗', ''], bubble: ['○', '#bfe9ff'], food: ['', ''] }[kind] || ['✦', '#fff'];
    for (let i = 0; i < n; i++) {
      const s = h('span.cp-p.' + kind, { style: { left: (26 + Math.random() * 48) + '%', top: (kind === 'bubble' ? 30 + Math.random() * 45 : 6 + Math.random() * 24) + '%', color: sym[1] || null, animationDelay: (i * 0.12) + 's', fontSize: (16 + Math.random() * 14) + 'px' } }, sym[0]);
      box.append(s); setTimeout(() => s.remove(), 2200 + i * 120);
    }
  }
  function flyText(t, coin) {
    const box = $('.cp-fx2'); if (!box) return;
    const s = h('span.cp-fly', { html: (coin ? coinSVG(16) : '') + SN.esc(t) }); box.append(s); setTimeout(() => s.remove(), 1600);
  }
  function popItem(emoji) { const box = $('.cp-fx'); if (!box) return; const s = h('span.cp-item', emoji); box.append(s); setTimeout(() => s.remove(), 1700); }
  function hop() { const el = $('.cp-char'); if (!el) return; el.classList.remove('hop'); void el.offsetWidth; el.classList.add('hop'); }
  function blinkLoop() {
    clearTimeout(ui.blinkT);
    ui.blinkT = setTimeout(() => { const el = $('.cp-char'); if (!el) return; if (!cur()?.asleep) { el.classList.add('blink'); setTimeout(() => el.classList.remove('blink'), 140); } blinkLoop(); }, 2500 + Math.random() * 3500);
  }
  function idleLoop() {
    clearTimeout(ui.idleT);
    ui.idleT = setTimeout(() => {
      const g = cur(); if (!g || SN.app.view !== 'companion' || !$('.cp-char')) return;
      if (!document.hidden && !ui.typing && !$('.modal-back')) {
        if (g.asleep) fx('zzz', 2);
        else { const [k, v] = lowest(g); say(v < 25 ? { hunger: 'hungry', energy: 'tired', fun: 'bored', clean: 'dirty' }[k] : Math.random() < .15 ? 'story' : 'idle'); }
      }
      idleLoop();
    }, 35000 + Math.random() * 30000);
  }

  // ------------------------------------------------------------------ Interaktionen
  function onCharTap(e) {
    const g = cur(); const el = e.currentTarget;
    const r = el.querySelector('svg').getBoundingClientRect();
    const y = (e.clientY - r.top) / r.height;
    if (g.asleep) { say('sleep_talk'); fx('zzz', 2); return; }
    if (y < 0.3) {
      // Kopf streicheln
      g.pats = (g.pats || []).filter(t => Date.now() - t < 20000); g.pats.push(Date.now());
      el.classList.remove('patted'); void el.offsetWidth; el.classList.add('patted');
      SN.sound('pop');
      if (g.pats.length > 5) { say('pat_spam'); return; }
      g.fun = clamp(g.fun + 2);
      gainAff(g, 'pat', 1, 12); checkWish('pat');
      fx('love', 3); say('pat'); save(); updateHud();
    } else { say('poke'); fx('shock', 1); }
  }
  function feed(key) {
    const g = cur(), f = FOODS[key], d = def();
    if (g.asleep) return say('sleep_talk');
    if (g.hunger >= 96 && key !== 'tea') return say('feed_full');
    if (!canPay(f.p)) return say('poor');
    coins(-f.p);
    g.hunger = clamp(g.hunger + (f.hunger || 0)); g.energy = clamp(g.energy + (f.energy || 0)); g.fun = clamp(g.fun + (f.fun || 0));
    popItem(f.e);
    if (key === d.likes) { gainAff(g, 'feedfav', 6, 3); g.fun = clamp(g.fun + 10); setTimeout(() => say('feed_like', { food: f.n }), 500); }
    else if (key === d.dislikes) { g.fun = clamp(g.fun - 10); setTimeout(() => say('feed_dislike', { food: f.n }), 500); }
    else { gainAff(g, 'feed', 2, 6); setTimeout(() => say('feed_ok', { food: f.n }), 500); }
    checkWish('feed', key);
    save(); updateHud();
  }
  function gift(key) {
    const g = cur(), it = GIFTS[key], d = def();
    if (g.asleep) return say('sleep_talk');
    if (!canPay(it.p)) return say('poor');
    coins(-it.p); popItem(it.e);
    const fav = key === d.gift;
    gainAff(g, 'gift', fav ? 25 : key === 'gem' ? 20 : 8, 3);
    g.fun = clamp(g.fun + (fav ? 25 : 12));
    checkWish('gift');
    setTimeout(() => { say(fav ? 'gift_like' : 'gift_ok', { gift: it.n }); fx('love', fav ? 10 : 5); }, 500);
    save(); updateHud();
  }
  function care(kind) {
    const g = cur(); if (g.asleep) return say('sleep_talk');
    if (kind === 'bath') { g.clean = 100; g.energy = clamp(g.energy - 4); g.fun = clamp(g.fun + 6); gainAff(g, 'bath', 3, 2); checkWish('bath'); fx('bubble', 10); }
    else { g.clean = clamp(g.clean + 22); g.fun = clamp(g.fun + 6); gainAff(g, 'brush', 2, 3); fx('sparkle', 4); }
    setTimeout(() => say('bath'), 700);
    save(); updateHud();
  }
  function toggleSleep() {
    const g = cur();
    if (g.asleep) {
      g.asleep = false; g.wakeReady = false;
      if (g.energy < 40) { g.fun = clamp(g.fun - 6); say('wake'); setExpr('pout'); } else say('wake');
    } else {
      const night = A().timeOfDay() === 'night';
      if (g.energy > 75 && !night) return say('sleep_refuse');
      g.asleep = true; say('sleep'); fx('zzz', 4);
    }
    save(); drawRoom(); drawChar(); updateHud();
  }

  // ---------- Menüs (Shop) ----------
  function shopGrid(items, onPick, { owned, equipped, priceOf } = {}) {
    const grid = h('div.cp-shop');
    for (const [k, it] of items) {
      const p = priceOf ? priceOf(k, it) : it.p;
      const has = owned && owned(k), on = equipped && equipped(k);
      grid.append(h('button.cp-item-btn' + (has ? '.owned' : '') + (on ? '.on' : '') + (!has && p > (store.value.coins || 0) ? '.poor' : ''), { onclick: () => onPick(k, it) },
        h('span.cp-item-ico', { html: it.svg || SN.esc(it.e) }), h('b', it.n), it.sub ? h('small', it.sub) : null,
        h('span.cp-price', { html: on ? '✓ an' : has ? 'Besitzt du' : p ? `${coinSVG(12)}${p}` : 'gratis' })));
    }
    return grid;
  }
  const wallet = () => h('div.cp-wallet', { html: `Deine Münzen: ${coinSVG(15)} <b>${SN.fmtNum(store.value.coins || 0)}</b>` });
  function menu(title, body, w = 640) { return SN.modal({ title, body: h('div', wallet(), body), width: w, cls: 'cp-modal' }); }
  function foodMenu() {
    const d = def();
    const items = Object.entries(FOODS).map(([k, f]) => [k, { ...f, sub: [f.hunger ? `Hunger +${f.hunger}` : '', f.energy ? `Energie +${f.energy}` : '', f.fun ? `Laune +${f.fun}` : ''].filter(Boolean).join(' · ') + (k === d.likes ? ' · ♥' : '') }]);
    const m = menu('🍙 Füttern', shopGrid(items, (k) => { m.close(); feed(k); }));
  }
  function giftMenu() {
    const m = menu('🎁 Geschenk machen', shopGrid(Object.entries(GIFTS).map(([k, it]) => [k, { ...it, sub: 'Zuneigung ♥' }]), (k) => { m.close(); gift(k); }));
  }
  function careMenu() {
    const m = menu('🫧 Pflegen', h('div.cp-shop', h('button.cp-item-btn', { onclick: () => { m.close(); care('bath'); } }, h('span.cp-item-ico', '🛁'), h('b', 'Baden'), h('small', 'Pflege 100%'), h('span.cp-price', 'gratis')),
      h('button.cp-item-btn', { onclick: () => { m.close(); care('brush'); } }, h('span.cp-item-ico', '🪮'), h('b', 'Haare kämmen'), h('small', 'Pflege +22 · Laune +6'), h('span.cp-price', 'gratis'))), 460);
  }
  function wardrobe() {
    const g = cur(), d = def();
    const body = h('div');
    const draw = () => {
      body.innerHTML = '';
      const prev = h('div.cp-ward-prev', { html: A().girl(store.value.active, { expr: 'happy', outfit: g.outfit, acc: g.acc }) });
      const outfits = Object.entries(A().OUTFITS).filter(([k]) => k !== 'pajama').map(([k, n]) => [k, { n, svg: A().girl(store.value.active, { expr: 'neutral', outfit: k }).replace('viewBox="0 0 600 800"', `viewBox="${A().BODY_BOX}"`) }]);
      const accs = Object.entries(A().ACC).filter(([k]) => ACC_P[k]).map(([k, n]) => [k, { n, svg: A().face(store.value.active, 'neutral', { acc: [k] }) }]);
      body.append(h('div.cp-ward', prev, h('div.cp-ward-lists',
        h('h4', 'Outfits'), shopGrid(outfits, (k) => buy('outfit_' + k, OUTFIT_P[k], () => { g.outfit = k; }), { owned: (k) => k === d.outfit || store.value.owned['outfit_' + k] || !OUTFIT_P[k], equipped: (k) => g.outfit === k, priceOf: (k) => OUTFIT_P[k] }),
        h('h4', 'Accessoires'), shopGrid(accs, (k) => buy('acc_' + k, ACC_P[k], () => { g.acc = (g.acc || []).includes(k) ? g.acc.filter(x => x !== k) : [...(g.acc || []).filter(x => !(A().ACC[x] && ['cat', 'phones', 'crown', 'tiara', 'witch', 'straw'].includes(x) && ['cat', 'phones', 'crown', 'tiara', 'witch', 'straw'].includes(k))), k]; }), { owned: (k) => store.value.owned['acc_' + k], equipped: (k) => (g.acc || []).includes(k), priceOf: (k) => ACC_P[k] }))));
    };
    const buy = (key, price, apply) => {
      const owned = store.value.owned[key] || !price || key === 'outfit_' + d.outfit;
      if (!owned) { if (!canPay(price)) { say('poor'); return; } coins(-price); store.value.owned[key] = true; }
      apply(); save(); drawChar(); draw(); body.parentElement && (body.parentElement.querySelector('.cp-wallet b').textContent = SN.fmtNum(store.value.coins));
      say(owned ? 'dress' : 'buy');
    };
    draw();
    menu('👗 Anziehen', body, 860);
  }
  function roomMenu() {
    const body = h('div');
    const items = Object.entries(A().DECOR).map(([k, n]) => [k, { n, e: { plant: '🪴', plush: '🐰', poster: '🖼️', lights: '✨', rug: '🟣', clock: '🕰️', lamp: '🌟' }[k], sub: 'Für euer Zimmer' }]);
    const draw = () => { body.innerHTML = ''; body.append(shopGrid(items, (k) => {
      const key = 'decor_' + k;
      if (!store.value.owned[key]) { if (!canPay(DECOR_P[k])) return say('poor'); coins(-DECOR_P[k]); store.value.owned[key] = true; store.value.decor[k] = true; gainAff(cur(), 'decor', 3, 5); say('buy'); fx('sparkle', 5); }
      else store.value.decor[k] = store.value.decor[k] === false;
      save(); drawRoom(); draw(); const wb = body.parentElement && body.parentElement.querySelector('.cp-wallet b'); if (wb) wb.textContent = SN.fmtNum(store.value.coins);
    }, { owned: (k) => store.value.owned['decor_' + k], equipped: (k) => store.value.owned['decor_' + k] && store.value.decor[k] !== false, priceOf: (k) => DECOR_P[k] })); };
    draw();
    menu('🛋️ Zimmer einrichten', h('div', h('div.faint.cp-hint', 'Gekaufte Sachen kannst du mit einem Klick auf- und abbauen.'), body));
  }
  function talkMenu() {
    const g = cur();
    const opts = [
      ['💭', 'Wie geht’s dir?', () => say(mood(g) >= 50 && lowest(g)[1] >= 30 ? 'how_good' : 'how_bad')],
      ['📖', 'Erzähl mir was über dich', () => { say('story'); gainAff(g, 'talk', 2, 5); }],
      ['😂', 'Erzähl einen Witz', () => { say('joke'); g.fun = clamp(g.fun + 5); }],
      ['🌸', 'Kompliment machen', () => { const c = (g.caps && g.caps.d === today() && g.caps.comp) || 0; say(c >= 3 ? 'compliment_much' : 'compliment'); gainAff(g, 'comp', 4, 3); }],
      ['✅', 'Motivier mich (Planer)', motivate],
      ['📺', 'Was soll ich schauen?', recommendAnime],
      ['✍️', 'Woran soll ich schreiben?', recommendNote],
    ];
    const m = menu('💬 Reden', h('div.cp-talk', ...opts.map(([e, l, fn]) => h('button.cp-talk-btn', { onclick: () => { m.close(); if (g.asleep) return say('sleep_talk'); fn(); save(); updateHud(); } }, h('span', e), l))), 480);
  }
  function motivate() {
    const open = SN.views.planner.tasks().filter(t => t.status !== 'done' && (!t.due || t.due <= today()));
    const done = SN.stats.day().tasks || 0;
    if (open.length) say('task_open', { n: open.length });
    else if (done) say('tasks_many', { n: done });
    else say('tasks_none');
  }
  function recommendAnime() {
    const list = SN.views.anime.list();
    const plan = list.filter(a => a.status === 'plan'), watching = list.filter(a => a.status === 'watching');
    const pick = (plan.length ? plan : watching.length ? watching : list)[Math.floor(Math.random() * Math.max(1, (plan.length ? plan : watching.length ? watching : list).length))];
    if (pick) say('chat_anime', { anime: pick.title });
    else { say('chat_anime', { anime: 'etwas aus „Entdecken“' }); }
  }
  function recommendNote() {
    const notes = SN.notes.all().filter(n => !n.folder.startsWith('Vorlagen')).sort((a, b) => (b.mtime || 0) - (a.mtime || 0));
    say('chat_write', { note: notes[0] ? notes[0].name : 'einer neuen Geschichte' });
  }
  // Freies Schreiben – einfache Erkennung, worum es geht
  function chat(text) {
    const g = cur(); const t = text.toLowerCase();
    const bubbleMe = h('div.cp-me', text); $('.cp-fx2')?.append(bubbleMe); setTimeout(() => bubbleMe.remove(), 2600);
    if (g.asleep) return setTimeout(() => say('sleep_talk'), 500);
    const is = (re) => re.test(t);
    let ev = 'chat_unknown', fn = null;
    if (is(/suizid|selbstmord|umbringen|nicht mehr leben|ritzen|selbstverletz/)) ev = 'help';
    else if (is(/\b(hallo|hi|hey|moin|servus|huhu|yo)\b|guten (morgen|tag|abend)/)) ev = 'chat_hi';
    else if (is(/wie geht|alles (gut|ok)|wie fühlst/)) ev = mood(g) >= 50 && lowest(g)[1] >= 30 ? 'how_good' : 'how_bad';
    else if (is(/lieb dich|mag dich|hab dich (lieb|gern)|love you/)) { ev = 'chat_love'; gainAff(g, 'love', 2, 2); }
    else if (is(/süß|hübsch|schön|niedlich|cute|toll|wunderbar|beste/)) { ev = 'compliment'; gainAff(g, 'comp', 4, 3); }
    else if (is(/danke|dankeschön|thx/)) ev = 'chat_thanks';
    else if (is(/traurig|müde|stress|schlecht|down|einsam|angst|weinen|kaputt|überfordert/)) ev = 'chat_sad';
    else if (is(/hunger|essen|futter|lecker/)) { ev = g.hunger < 50 ? 'hungry' : 'how_good'; }
    else if (is(/spiel|langweil|game|zocken/)) { ev = 'play_start'; fn = gamesMenu; }
    else if (is(/gute nacht|schlafen|bett|nacht/)) ev = A().timeOfDay() === 'night' ? 'sleep' : 'greet_night';
    else if (is(/aufgabe|todo|planer|arbeit|lernen|hausaufgabe|schule/)) return motivate();
    else if (is(/schreib|notiz|geschichte|kapitel|buch/)) return recommendNote();
    else if (is(/anime|serie|schauen|empfehl/)) return recommendAnime();
    else if (is(/witz|lustig|lachen/)) ev = 'joke';
    else if (is(/wer bist|wie heißt|dein name/)) ev = 'chat_name';
    else if (is(/erzähl|über dich/)) ev = 'story';
    setTimeout(() => { say(ev); if (fn) setTimeout(fn, 1500); }, 450);
    save();
  }

  // ------------------------------------------------------------------ Minispiele
  function gamesMenu() {
    const g = cur();
    if (g.asleep) return say('sleep_talk');
    if (g.energy < 12) return say('play_tired');
    const m = menu('🎮 Zusammen spielen', h('div.cp-shop',
      h('button.cp-item-btn', { onclick: () => { m.close(); catchGame(); } }, h('span.cp-item-ico', '💖'), h('b', 'Herzen fangen'), h('small', 'Fang Herzen & Sterne, weich den Gewitterwolken aus'), h('span.cp-price', { html: `bis ${coinSVG(12)}40` })),
      h('button.cp-item-btn', { onclick: () => { m.close(); rps(); } }, h('span.cp-item-ico', '✌️'), h('b', 'Schere, Stein, Papier'), h('small', 'Best of 3 gegen ' + nameOf(g)), h('span.cp-price', { html: `${coinSVG(12)}12` })),
      h('button.cp-item-btn', { onclick: () => { m.close(); memory(); } }, h('span.cp-item-ico', '🃏'), h('b', 'Memory'), h('small', 'Finde alle Paare'), h('span.cp-price', { html: `bis ${coinSVG(12)}25` }))), 560);
  }
  function afterGame(kind, coinsWon, result, score) {
    const g = cur();
    g.fun = clamp(g.fun + 22); g.energy = clamp(g.energy - 8); g.hunger = clamp(g.hunger - 4);
    gainAff(g, 'play', 3, 5); checkWish('play');
    if (coinsWon) coins(coinsWon, true);
    save(); updateHud();
    setTimeout(() => say(result === 'great' ? 'play_great' : result === 'win' ? 'play_win' : result === 'lose' ? 'play_lose' : 'play_draw', { n: score }), 300);
  }
  function catchGame() {
    const g = cur();
    const cv = h('canvas.cp-cv', { width: 360, height: 460 });
    const info = h('div.cp-game-info', h('span.sc', 'Punkte: 0'), h('span.tm', '30 s'));
    let done = false;
    const m = SN.modal({ title: '💖 Herzen fangen', body: h('div.cp-game', info, cv, h('div.faint.cp-hint', 'Maus/Finger bewegen oder ← → Tasten')), width: 420, cls: 'cp-modal', onClose: () => { done = true; } });
    const ctx = cv.getContext('2d');
    let x = 180, score = 0, items = [], t0 = performance.now(), last = t0, spawn = 0;
    const DUR = 30000;
    const move = (e) => { const r = cv.getBoundingClientRect(); x = Math.max(24, Math.min(336, ((e.touches ? e.touches[0].clientX : e.clientX) - r.left) / r.width * 360)); };
    cv.addEventListener('pointermove', move); cv.addEventListener('pointerdown', move);
    cv.addEventListener('touchmove', (e) => { e.preventDefault(); move(e); }, { passive: false });
    const keys = {}; const kd = (e) => { keys[e.key] = e.type === 'keydown'; }; document.addEventListener('keydown', kd); document.addEventListener('keyup', kd);
    const faceImg = new Image(); faceImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(A().face(store.value.active, 'happy', look(g)));
    say('play_start');
    const loop = (now) => {
      if (done) { document.removeEventListener('keydown', kd); document.removeEventListener('keyup', kd); return; }
      const dt = Math.min(50, now - last); last = now;
      const el = now - t0, left = Math.max(0, DUR - el);
      if (keys.ArrowLeft) x = Math.max(24, x - dt * .45); if (keys.ArrowRight) x = Math.min(336, x + dt * .45);
      spawn -= dt;
      if (spawn <= 0) { const r = Math.random(); items.push({ x: 20 + Math.random() * 320, y: -20, v: .12 + Math.random() * .1 + el / DUR * .12, k: r < .16 ? 'cloud' : r < .3 ? 'star' : 'heart' }); spawn = 520 - el / DUR * 240; }
      const bg = ctx.createLinearGradient(0, 0, 0, 460); bg.addColorStop(0, '#2a1630'); bg.addColorStop(1, '#4a2140');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, 360, 460);
      for (let i = 0; i < 18; i++) { ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect((i * 97) % 360, (i * 53 + el * .02) % 460, 2, 2); }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      items = items.filter(it => {
        it.y += it.v * dt;
        ctx.font = it.k === 'cloud' ? '30px sans-serif' : '26px sans-serif';
        ctx.fillStyle = it.k === 'heart' ? '#ff5c93' : '#ffd45c';
        ctx.fillText(it.k === 'cloud' ? '⛈️' : it.k === 'star' ? '★' : '♥', it.x, it.y);
        if (it.y > 392 && it.y < 432 && Math.abs(it.x - x) < 36) { score = Math.max(0, score + (it.k === 'cloud' ? -3 : it.k === 'star' ? 3 : 1)); SN.sound(it.k === 'cloud' ? 'tick' : 'pop'); return false; }
        return it.y < 480;
      });
      if (faceImg.complete && faceImg.naturalWidth) ctx.drawImage(faceImg, x - 36, 384, 72, 78); else { ctx.font = '40px sans-serif'; ctx.fillText('🧺', x, 420); }
      info.querySelector('.sc').textContent = 'Punkte: ' + score; info.querySelector('.tm').textContent = Math.ceil(left / 1000) + ' s';
      if (left <= 0) {
        done = true;
        const won = Math.min(40, Math.round(score / 1.5));
        ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, 360, 460); ctx.fillStyle = '#fff'; ctx.font = 'bold 30px sans-serif'; ctx.fillText(`${score} Punkte!`, 180, 200); ctx.font = '18px sans-serif'; ctx.fillText(`+${won} Spirit-Münzen`, 180, 240);
        setTimeout(() => { m.close(); afterGame('catch', won, score >= 30 ? 'great' : score >= 12 ? 'win' : 'lose', score); }, 1600);
        return;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  function rps() {
    const g = cur(); const H = { r: ['✊', 'Stein'], p: ['✋', 'Papier'], s: ['✌️', 'Schere'] };
    let me = 0, her = 0, round = 0;
    const face = h('div.cp-rps-face', { html: A().face(store.value.active, 'excited', look(g)) });
    const stage = h('div.cp-rps-stage', h('span.you', '❔'), h('b', 'VS'), h('span.her', '❔'));
    const score = h('div.cp-rps-score', 'Du 0 : 0 ' + nameOf(g));
    const btns = h('div.cp-rps-btns', ...Object.entries(H).map(([k, [e, n]]) => h('button.btn', { onclick: () => playR(k) }, h('span', e), n)));
    const m = SN.modal({ title: '✌️ Schere, Stein, Papier', body: h('div.cp-rps', face, score, stage, btns), width: 440, cls: 'cp-modal' });
    function playR(k) {
      if (round >= 3 || btns.dataset.busy) return;
      btns.dataset.busy = '1';
      const keys = Object.keys(H); const hk = keys[Math.floor(Math.random() * 3)];
      stage.querySelector('.you').textContent = H[k][0]; stage.querySelector('.her').textContent = '…';
      setTimeout(() => {
        stage.querySelector('.her').textContent = H[hk][0];
        const win = (k === 'r' && hk === 's') || (k === 'p' && hk === 'r') || (k === 's' && hk === 'p');
        if (k !== hk) { if (win) me++; else her++; round++; }
        face.innerHTML = A().face(store.value.active, k === hk ? 'surprised' : win ? 'pout' : 'smug', look(g));
        score.textContent = `Du ${me} : ${her} ${nameOf(g)}`;
        delete btns.dataset.busy;
        if (me === 2 || her === 2 || round >= 3) setTimeout(() => { m.close(); afterGame('rps', me > her ? 12 : 3, me > her ? 'win' : her > me ? 'lose' : 'draw'); }, 1100);
      }, 550);
    }
  }
  function memory() {
    const icons = ['🍙', '🍡', '🌸', '⭐', '🍫', '🎀'];
    const deck = [...icons, ...icons].sort(() => Math.random() - .5);
    let open = [], found = 0, moves = 0, lock = false;
    const info = h('div.cp-game-info', h('span.mv', 'Züge: 0'), h('span', 'Paare: 0/6'));
    const grid = h('div.cp-mem', ...deck.map((e, i) => h('button.cp-mem-card', { data: { i }, onclick: (ev) => flip(ev.currentTarget, e) }, h('span.front', e), h('span.back', '✦'))));
    const m = SN.modal({ title: '🃏 Memory', body: h('div.cp-game', info, grid), width: 440, cls: 'cp-modal' });
    say('play_start');
    function flip(el, e) {
      if (lock || el.classList.contains('open')) return;
      el.classList.add('open'); open.push([el, e]); SN.sound('tick');
      if (open.length < 2) return;
      moves++; info.querySelector('.mv').textContent = 'Züge: ' + moves;
      const [[a, x], [b, y]] = open;
      if (x === y) { found++; open = []; a.classList.add('found'); b.classList.add('found'); info.lastChild.textContent = `Paare: ${found}/6`; SN.sound('pop');
        if (found === 6) setTimeout(() => { m.close(); const won = Math.max(5, 31 - moves); afterGame('memory', won, moves <= 9 ? 'great' : 'win', won * 10); }, 700); }
      else { lock = true; setTimeout(() => { a.classList.remove('open'); b.classList.remove('open'); open = []; lock = false; }, 800); }
    }
  }

  // ------------------------------------------------------------------ Navigation & Home-Karte
  function updateNav() {
    const n = cur() ? nameOf() : 'Freundin';
    SN.$$('[data-view="companion"] small').forEach(s => { s.textContent = n; });
  }
  C.homeCard = () => {
    const g = cur(); if (!g) return null;
    tick(g);
    const pick = L().pick(store.value.active, g.asleep ? 'sleep_talk' : lowest(g)[1] < 25 ? { hunger: 'hungry', energy: 'tired', fun: 'bored', clean: 'dirty' }[lowest(g)[0]] : 'idle', { user: user() }, tierOf(g.aff));
    return h('div.card.cp-home', { onclick: () => SN.app.show('companion') },
      h('div.cp-home-face', { html: A().face(store.value.active, g.asleep ? 'sleep' : pick.expr, look(g)) }),
      h('div.cp-home-body', h('b', nameOf(g)), h('p', `„${pick.text}“`),
        h('div.cp-home-needs', ...NEEDS.map(([k, l, ico, col]) => h('span', { title: l }, ico, h('i', h('em', { style: { width: Math.round(g[k]) + '%', background: col } })))))));
  };
  C.state = () => store && store.value;
})();
