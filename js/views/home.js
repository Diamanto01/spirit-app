/* Spirit Notes – Home-Dashboard */
(() => {
  const V = SN.views.home = {};
  const h = SN.h, $ = SN.$;
  const QUOTES = [
    'Jede Sekunde, die du schreibst, gehört für immer dir.',
    'Die Uhr tickt nicht gegen dich – sie tickt für deine Geschichte.',
    'Kleine Schritte sind auch Schritte. Heute zählt.',
    'Deine Ideen sind wie Sterne: Man sieht sie erst, wenn man sie aufschreibt.',
    'Ein Plan ist ein Wunsch mit Uhrzeit.',
    'Mut ist, das erste Wort auf ein leeres Blatt zu setzen.',
    'Zeit kann man nicht zurückdrehen – aber Notizen kann man wiederfinden.',
    'Heute ist die beste Episode, um anzufangen.',
    'Was du heute festhältst, erzählt dir morgen, wer du warst.',
    'Selbst das größte Abenteuer beginnt mit einer einzigen Zeile.',
    'Nicht perfekt, aber geschrieben – das ist schon ein Sieg.',
    'Lass die Gedanken tanzen und den Stift folgen.',
    'Jede Notiz ist ein kleines Uhrwerk deiner Gedanken.',
    'Wer plant, hat mehr Zeit für das, was Spaß macht.',
  ];
  let clockTimer = null;

  V.render = () => {
    const root = $('#view-home');
    root.innerHTML = '';
    clearInterval(clockTimer);
    const wrap = h('div.home');
    const d = new Date(), hr = d.getHours();
    const greet = hr < 5 ? 'Gute Nacht' : hr < 11 ? 'Guten Morgen' : hr < 17 ? 'Hallo' : hr < 22 ? 'Guten Abend' : 'Gute Nacht';
    const quote = QUOTES[(d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate()) % QUOTES.length];
    const lv = SN.stats.level();
    const streak = SN.stats.streak();

    // ---------- Hero ----------
    const capture = h('input.input.capture', { placeholder: 'Schnellnotiz … (Enter speichert in „Inbox“)', spellcheck: 'true' });
    capture.addEventListener('keydown', async (e) => { if (e.key === 'Enter' && capture.value.trim()) { await V.capture(capture.value.trim()); capture.value = ''; } });
    const hero = h('div.card.ornate.hero',
      h('div.hero-left',
        h('div.hero-date', { html: `${SN.DAYS[d.getDay()]}, ${d.getDate()}. ${SN.MONTHS[d.getMonth()]} ${d.getFullYear()} <span class="jp">${SN.DAYS_JP[d.getDay()]}</span>` }),
        h('h1.hero-greet', { html: `${greet}, <span>${SN.esc(SN.settings.name || 'Spirit')}</span>` }),
        h('div.hero-quote', { html: `<span>❝</span> ${SN.esc(quote)}` }),
        h('div.hero-capture', SN.ico('feather', 16), capture),
        h('div.hero-actions',
          h('button.btn.primary', { html: SN.icon('file-plus', 16) + '<span>Neue Notiz</span>', onclick: () => SN.app.newNote() }),
          h('button.btn', { html: SN.icon('sun', 16) + '<span>Tagesnotiz</span>', onclick: () => SN.app.dailyNote() }),
          h('button.btn', { html: SN.icon('timer', 16) + '<span>Fokus starten</span>', onclick: () => { SN.app.show('planner'); SN.views.planner.tab('focus'); } }),
          h('button.btn', { html: SN.icon('tv', 16) + '<span>Anime hinzufügen</span>', onclick: () => { SN.app.show('anime'); SN.views.anime.add(); } }))),
      h('div.hero-clock', { html: clockSVG() }));
    wrap.append(hero);

    // ---------- Level & Stats ----------
    const notes = SN.notes.all().filter(n => !n.folder.startsWith('Vorlagen'));
    const totalWords = notes.reduce((s, n) => s + n.words, 0);
    const anime = SN.views.anime.list();
    const tasks = SN.views.planner.tasks();
    const today = SN.stats.day();
    const goal = SN.settings.dailyGoal || 500;
    const stats = h('div.home-stats',
      h('div.card.level-card', { onclick: () => SN.app.show('rewards') },
        h('div.level-ring', { html: SN.rewards.ring(74, lv.pct, `<b>${lv.lvl}</b>`) }),
        h('div', h('div.lv-title', lv.title), h('div.faint', { style: { fontSize: '12px' } }, `${SN.fmtNum(lv.xp)} XP · noch ${SN.fmtNum(lv.next - lv.xp)} bis Lv. ${lv.lvl + 1}`),
          h('div.lv-streak', { html: `${SN.icon('flame', 15)} <b>${streak}</b> ${streak === 1 ? 'Tag' : 'Tage'} Streak` }),
          SN.rewards.ready().length ? h('div.rw-pill.hot', { style: { marginTop: '6px', whiteSpace: 'nowrap' }, title: 'Belohnungen einsammeln', html: `${SN.icon('trophy', 13)} ${SN.rewards.ready().length} bereit!` }) : null)),
      stat('file', SN.fmtNum(notes.length), 'Notizen'),
      stat('feather', SN.fmtNum(totalWords), 'Wörter im Vault'),
      stat('tv', SN.fmtNum(anime.length), 'Anime in der Liste'),
      stat('check', SN.fmtNum(tasks.filter(t => t.status === 'done').length), 'Aufgaben erledigt'),
      h('div.card.stat.goal-card', { title: 'Tagesziel – in den Einstellungen änderbar' },
        h('div.goal-ring', { html: ring(Math.min(1, today.words / goal), 54, `<tspan class="g-n">${Math.min(999, Math.round(today.words / goal * 100))}%</tspan>`) }),
        h('div', h('b', `${SN.fmtNum(today.words)} / ${SN.fmtNum(goal)}`), h('span', 'Wörter heute'))));
    wrap.append(stats);

    // ---------- Raster ----------
    const grid = h('div.home-grid');
    // Heute
    const todayKey = SN.todayKey();
    const due = tasks.filter(t => t.status !== 'done' && t.due && t.due <= todayKey).sort((a, b) => (a.due + (a.time || '')).localeCompare(b.due + (b.time || '')));
    const todayCard = h('div.card.ornate', h('div.card-title', { html: `${SN.icon('calendar', 16)} Heute <span class="jp">今日</span>` },
      h('div.act-r', h('button.icon-btn', { title: 'Aufgabe hinzufügen', html: SN.icon('plus', 16), onclick: () => SN.views.planner.quickAdd({ due: todayKey }) }))));
    if (!due.length) todayCard.append(h('div.empty-hint', { html: `${SN.icon('sparkles', 22)}<br>Nichts fällig – genieß die freie Zeit!` }));
    due.slice(0, 7).forEach(t => todayCard.append(SN.views.planner.taskRow(t, { compact: true })));
    const nnotes = notes.flatMap(n => n.tasks.filter(t => !t.done).map(t => ({ ...t, path: n.path }))).slice(0, 3);
    if (nnotes.length) { todayCard.append(h('div.rp-h', { style: { marginTop: '12px' } }, 'Offen in Notizen')); nnotes.forEach(t => todayCard.append(h('div.mini-task', { onclick: () => SN.editor.open(t.path) }, h('span.box'), h('span.t', t.text), h('span.faint', SN.noteName(t.path))))); }
    grid.append(todayCard);

    // Weiterschreiben
    const recent = [...notes].sort((a, b) => (b.updated || '').localeCompare(a.updated || '')).slice(0, 6);
    const rc = h('div.card.ornate.span2', h('div.card-title', { html: `${SN.icon('feather', 16)} Weiterschreiben <span class="jp">続き</span>` },
      h('div.act-r', h('button.btn.small.ghost', { onclick: () => SN.app.show('overview') }, 'Alle ansehen'))));
    const rg = h('div.recent-grid');
    if (!recent.length) rg.append(h('div.empty-hint', 'Noch keine Notizen – leg los!'));
    recent.forEach(n => rg.append(h('div.recent-card', { onclick: () => SN.editor.open(n.path) },
      n.image ? h('div.rc-img', { style: { backgroundImage: `url("${SN.fs.url(n.image)}")` } }) : h('div.rc-img.none', { html: SN.icon('feather', 26) }),
      h('div.rc-body', h('b', n.name), h('p', n.excerpt.slice(0, 90) || 'Leer …'), h('small', SN.fmtRel(n.updated))))));
    rc.append(rg);
    grid.append(rc);

    // Anime – gerade am Schauen
    const watching = anime.filter(a => a.status === 'watching').slice(0, 4);
    const ac = h('div.card.ornate', h('div.card-title', { html: `${SN.icon('tv', 16)} Gerade am Schauen <span class="jp">視聴中</span>` }));
    if (!watching.length) ac.append(h('div.empty-hint', { html: 'Kein Anime auf „Schaue ich“.<br>' }, h('button.btn.small', { style: { marginTop: '8px' }, onclick: () => { SN.app.show('anime'); SN.views.anime.add(); } }, '+ Anime hinzufügen')));
    watching.forEach(a => ac.append(SN.views.anime.miniRow(a, () => V.render())));
    grid.append(ac);

    // Heatmap
    const hm = h('div.card.ornate.span2', h('div.card-title', { html: `${SN.icon('chart', 16)} Aktivität <span class="jp">記録</span>` }, h('div.act-r.faint', { style: { fontSize: '11.5px' } }, 'Letzte 26 Wochen')));
    hm.append(heatmap());
    grid.append(hm);

    // Zufallsnotiz / Erinnerung
    const old = notes.filter(n => n.words > 20);
    const pick = old.length ? old[(d.getDate() * 7 + d.getMonth()) % old.length] : null;
    const memo = h('div.card.ornate', h('div.card-title', { html: `${SN.icon('history', 16)} Aus deinem Vault <span class="jp">思い出</span>` }));
    if (pick) memo.append(h('div.memo', { onclick: () => SN.editor.open(pick.path) }, h('b', pick.name), h('p', pick.excerpt), h('small.faint', 'Geschrieben ' + SN.fmtRel(pick.created || pick.updated))));
    else memo.append(h('div.empty-hint', 'Hier erscheint jeden Tag eine Notiz aus deiner Vergangenheit.'));
    memo.append(h('button.btn.small', { style: { marginTop: '10px' }, html: SN.icon('dice', 14) + '<span>Zufällige Notiz</span>', onclick: () => SN.app.randomNote() }));
    grid.append(memo);

    wrap.append(grid);
    root.append(wrap);

    // Uhr animieren
    const tick = () => {
      const n = new Date(), s = n.getSeconds() + n.getMilliseconds() / 1000, m = n.getMinutes() + s / 60, hh = (n.getHours() % 12) + m / 60;
      const set = (id, deg) => { const e = document.getElementById(id); if (e) e.setAttribute('transform', `rotate(${deg} 100 100)`); };
      set('hc-h', hh * 30); set('hc-m', m * 6); set('hc-s', Math.floor(s) * 6);
      const dt = document.getElementById('hc-digital'); if (dt) dt.textContent = `${SN.pad(n.getHours())}:${SN.pad(n.getMinutes())}`;
    };
    tick(); clockTimer = setInterval(() => { if (SN.app.view !== 'home') return; tick(); }, 1000);
  };

  function stat(icon, val, label) { return h('div.card.stat', h('span.ico.stat-ico', { html: SN.icon(icon, 20) }), h('div', h('b', val), h('span', label))); }
  function ring(pct, size, inner) {
    const r = size / 2 - 6, c = 2 * Math.PI * r;
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><defs><linearGradient id="rg${size}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--accent2)"/></linearGradient></defs>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="5"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="url(#rg${size})" stroke-width="5" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}" transform="rotate(-90 ${size / 2} ${size / 2})" style="filter:drop-shadow(0 0 4px var(--glow))"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central">${inner}</text></svg>`;
  }
  function clockSVG() {
    const roman = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    let ticks = '';
    for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, big = i % 5 === 0; const r1 = 88, r2 = big ? 80 : 84; ticks += `<line x1="${100 + Math.sin(a) * r1}" y1="${100 - Math.cos(a) * r1}" x2="${100 + Math.sin(a) * r2}" y2="${100 - Math.cos(a) * r2}" stroke="${big ? 'var(--accent2)' : 'var(--faint)'}" stroke-width="${big ? 2 : 1}"/>`; }
    const nums = roman.map((r, i) => { const a = i / 12 * Math.PI * 2; return `<text x="${100 + Math.sin(a) * 63}" y="${100 - Math.cos(a) * 63}" text-anchor="middle" dominant-baseline="central">${r}</text>`; }).join('');
    return `<svg viewBox="0 0 200 200" class="home-clock"><defs><radialGradient id="hcg" cx="50%" cy="40%"><stop offset="0" stop-color="var(--bg3)"/><stop offset="1" stop-color="var(--bg)"/></radialGradient>
      <linearGradient id="hcr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--accent2)"/><stop offset=".5" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--accent2)"/></linearGradient></defs>
      <circle cx="100" cy="100" r="97" fill="url(#hcg)" stroke="url(#hcr)" stroke-width="3"/>
      <circle cx="100" cy="100" r="91" fill="none" stroke="var(--line2)" stroke-width="1"/>
      <g class="hc-spin"><circle cx="100" cy="100" r="44" fill="none" stroke="var(--accent2)" stroke-width=".8" stroke-dasharray="2 5" opacity=".7"/><path d="M100 58 L104 96 L142 100 L104 104 L100 142 L96 104 L58 100 L96 96 Z" fill="var(--accent)" opacity=".12"/></g>
      ${ticks}<g class="hc-num">${nums}</g>
      <text id="hc-digital" x="100" y="128" text-anchor="middle" class="hc-digital">00:00</text>
      <line id="hc-h" x1="100" y1="108" x2="100" y2="56" stroke="var(--text)" stroke-width="4.5" stroke-linecap="round"/>
      <line id="hc-m" x1="100" y1="112" x2="100" y2="30" stroke="var(--accent2)" stroke-width="3" stroke-linecap="round"/>
      <g id="hc-s"><line x1="100" y1="118" x2="100" y2="22" stroke="var(--accent)" stroke-width="1.4" stroke-linecap="round"/><circle cx="100" cy="30" r="3" fill="var(--accent)"/></g>
      <circle cx="100" cy="100" r="5" fill="var(--accent)" stroke="var(--accent2)" stroke-width="1.5"/></svg>`;
  }
  function heatmap() {
    const days = SN.stats.store.value.days;
    const weeks = 26, end = new Date(); end.setHours(0, 0, 0, 0);
    const start = new Date(end); start.setDate(start.getDate() - (weeks * 7 - 1) - ((end.getDay() + 6) % 7 - 6 < 0 ? 0 : 0));
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const wrap = h('div.heatmap');
    const grid = h('div.hm-grid');
    let total = 0, active = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const k = SN.dateKey(cur); const x = days[k];
      const score = x ? (x.words || 0) / 50 + (x.tasks || 0) * 2 + (x.notes || 0) * 2 + (x.focus || 0) / 12 + (x.anime || 0) * 2 : 0;
      if (score > 0) { active++; total += x.words || 0; }
      const lvl = score <= 0 ? 0 : score < 2 ? 1 : score < 6 ? 2 : score < 14 ? 3 : 4;
      grid.append(h('i.l' + lvl, { title: `${SN.fmtDate(cur)}: ${x ? `${x.words || 0} Wörter, ${x.tasks || 0} Aufgaben, ${x.focus || 0} Min. Fokus` : 'keine Aktivität'}` }));
      cur.setDate(cur.getDate() + 1);
    }
    wrap.append(h('div.hm-days', ...['Mo', '', 'Mi', '', 'Fr', '', 'So'].map(t => h('span', t))), grid);
    return h('div', wrap, h('div.hm-foot', h('span.faint', `${active} aktive Tage · ${SN.fmtNum(total)} Wörter geschrieben`), h('span.hm-legend', 'weniger', ...[0, 1, 2, 3, 4].map(l => h('i.l' + l)), 'mehr')));
  }

  V.capture = async (text) => {
    let p = SN.notes.resolve('Inbox');
    const line = `<ul><li><b>${SN.fmtDate(new Date())} ${SN.fmtTime(new Date())}</b> – ${SN.esc(text)}</li></ul>`;
    if (!p) p = await SN.notes.create({ name: 'Inbox', html: `<h1>Inbox</h1><p class="jp-sub">受信箱</p><p>Hier landen deine Schnellnotizen vom Home-Bildschirm.</p>${line}`, fm: { tags: ['inbox'] } });
    else {
      const t = SN.editor.tabs.find(t => t.path === p);
      if (t) await SN.editor.save(t);
      const txt = await SN.fs.read(p);
      const { fm, body } = SN.notes.parse(txt);
      const nt = SN.notes.serialize(fm, body.trim() + '\n' + line);
      await SN.fs.write(p, nt); SN.notes.update(p, nt); SN.emit('note:external', p);
    }
    SN.toast('In Inbox gespeichert ✦', 'ok');
  };

  V.levelInfo = () => {
    const lv = SN.stats.level(), t = SN.stats.store.value.totals;
    SN.modal({ title: SN.icon('trophy', 20) + ` Spirit-Level ${lv.lvl} <span class="jp">霊力</span>`, sub: lv.title, width: 460, body: h('div',
      h('div.lv-bar', h('i', { style: { width: (lv.pct * 100) + '%' } })),
      h('p.muted', { style: { fontSize: '12.5px' } }, `${SN.fmtNum(lv.xp)} XP – noch ${SN.fmtNum(lv.next - lv.xp)} XP bis Level ${lv.lvl + 1}.`),
      h('div.xp-table', { html: `<div><span>Geschriebene Wörter</span><b>${SN.fmtNum(t.words || 0)}</b><small>1 XP / 5 Wörter</small></div>
        <div><span>Erstellte Notizen</span><b>${SN.fmtNum(t.notes || 0)}</b><small>15 XP</small></div>
        <div><span>Erledigte Aufgaben</span><b>${SN.fmtNum(t.tasks || 0)}</b><small>20 XP</small></div>
        <div><span>Fokus-Minuten</span><b>${SN.fmtNum(t.focus || 0)}</b><small>2 XP / Min.</small></div>
        <div><span>Fertig geschaute Anime</span><b>${SN.fmtNum(t.anime || 0)}</b><small>40 XP</small></div>` })),
      buttons: [{ label: 'Weiter so!', primary: true }] });
  };
})();
