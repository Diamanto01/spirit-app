/* Spirit Notes – App-Steuerung: Start, Ansichten, Tastenkürzel, Willkommen */
(() => {
  const A = SN.app = { view: null };
  const $ = SN.$, h = SN.h;
  const VIEWS = ['home', 'notes', 'overview', 'graph', 'planner', 'anime', 'gallery', 'settings'];

  // ---------- Zuletzt geöffnet ----------
  SN.recent = {
    list() { try { return JSON.parse(localStorage.getItem('sn-recent') || '[]'); } catch { return []; } },
    push(p) { const l = this.list().filter(x => x !== p); l.unshift(p); localStorage.setItem('sn-recent', JSON.stringify(l.slice(0, 20))); },
  };

  // ---------- Eigene Schreibzugriffe merken (damit der Datei-Wächter sie ignoriert) ----------
  SN._self = new Map();
  for (const fn of ['write', 'writeBin', 'rename', 'remove', 'mkdir', 'del']) {
    const orig = SN.fs[fn];
    SN.fs[fn] = (...a) => { a.slice(0, 2).forEach(p => typeof p === 'string' && SN._self.set(p, Date.now())); return orig.apply(SN.fs, a); };
  }

  // ======================================================================
  //  Start
  // ======================================================================
  A.boot = async () => {
    if (!SN.isElectron) document.body.classList.add('web');
    SN.hydrateIcons();
    SN.mobile.init();
    await SN.loadSettings();
    SN.themes.apply();
    $('.tb-logo-icon').innerHTML = SN.themes.logoSVG(24);
    if (!SN.isElectron && 'serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
    if (!SN.isElectron && navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    await SN.sync.load();
    // Handy: Einrichtung über den QR-Code-Link (#setup=…)
    const setup = !SN.isElectron && SN.sync.fromUrl();
    if (setup && (!SN.sync.cfg || SN.sync.cfg.token !== setup.token || SN.sync.cfg.repo !== setup.repo)) { await SN.fs.useDefault(); await SN.sync.saveCfg({ ...setup, device: SN.sync.device() }); }
    if (setup && SN.mobile.standalone()) history.replaceState(null, '', location.pathname + location.search);
    const info = await SN.fs.info();
    document.body.classList.remove('booting');
    if (!info.path || !info.exists) { if (SN.isElectron) await welcome(info); else await SN.mobile.welcome(); }
    await startVault();
    if (!SN.isElectron && SN.mobile.active && !SN.mobile.standalone() && (setup || !localStorage.getItem('sn-install-hint'))) { try { localStorage.setItem('sn-install-hint', '1'); } catch { } setTimeout(() => SN.mobile.installHint(!!setup), 900); }
  };

  function welcome(info) {
    return new Promise((resolve) => {
      const w = $('#welcome');
      w.classList.remove('hidden');
      const done = async (fn) => { const p = await fn(); if (!p) return; w.classList.add('hidden'); resolve(p); };
      w.innerHTML = '';
      w.append(h('div.card.ornate.welcome-box',
        h('div.welcome-logo', { html: SN.themes.logoSVG(96) }),
        h('div.welcome-jp', '精 霊 ノ ー ト'),
        h('h1.welcome-title', { html: 'Spirit <b>Notes</b>' }),
        h('p.welcome-text', { html: 'Willkommen! Hier schreibst du wie in Word, planst deine Tage, verknüpfst deine Gedanken wie in Obsidian und bewertest deine Anime.<br>Wähle zuerst, wo deine Notizen gespeichert werden sollen – deinen <b>Vault</b>.' }),
        h('div.welcome-actions',
          h('button.btn.primary', { html: SN.icon('sparkles', 18) + `<span>${SN.isElectron ? 'Standard-Ordner verwenden' : 'Im Browser starten'}</span>`, onclick: () => done(() => SN.fs.useDefault()) }),
          SN.isElectron ? h('button.btn', { html: SN.icon('folder-open', 18) + '<span>Eigenen Ordner wählen …</span>', onclick: () => done(() => SN.fs.choose()) }) : null),
        SN.isElectron && info.defaultPath ? h('div.welcome-path', 'Standard: ' + info.defaultPath) : null));
      SN.hydrateIcons(w);
    });
  }

  async function startVault() {
    await SN.stats.load();
    await SN.views.planner.init();
    await SN.views.anime.init();
    if (SN.fs.preloadBlobs) await SN.fs.preloadBlobs();
    // Erster Start mit Sync: zuerst alles vom anderen Gerät holen
    if (SN.sync.cfg && !(await SN.fs.exists('.spirit/sync-state.json'))) {
      const ov = h('div.sync-overlay', h('div.card.ornate', { html: `${SN.themes.logoSVG(64)}<b>Hole deine Daten …</b><small>Notizen, Bilder, Planer & Anime werden synchronisiert.</small><span class="spinner"></span>` }));
      document.body.append(ov);
      await SN.sync.run({ silent: false });
      ov.remove();
    }
    await SN.notes.build();
    if (!SN.notes.all().length && !SN.sync.cfg && !(await SN.fs.exists('.spirit/seeded'))) await seed();
    SN.editor.init();
    SN.sidebar.init();
    SN.sidebar.render();
    wire();
    applyLayout();
    await SN.editor.restoreTabs();
    A.show(VIEWS.includes(SN.settings.lastView) ? SN.settings.lastView : 'home');
    renderLevel(true);
    SN.on('stats', SN.debounce(() => renderLevel(), 300));
    SN.fs.onChanged && SN.fs.onChanged(onExternalChange);
    SN.focus.update();
    SN.sync.start();
    SN.sync.setState(SN.sync.state);
    if (SN.sync.cfg) setTimeout(() => SN.sync.run(), SN.isElectron ? 3000 : 600);
  }

  // ======================================================================
  //  Ansichten
  // ======================================================================
  A.show = (view) => {
    if (!VIEWS.includes(view)) view = 'home';
    const changed = A.view !== view;
    A.view = view;
    VIEWS.forEach(v => $('#view-' + v).classList.toggle('on', v === view));
    SN.$$('#activity .act').forEach(b => b.classList.toggle('on', b.dataset.view === view));
    SN.closePops(); SN.editor.closePop && SN.editor.closePop();
    if (view !== 'notes' && SN.views[view] && (changed || view !== 'graph')) SN.views[view].render();
    if (view === 'notes') { SN.editor.renderRight(); }
    SN.emit('view', view);
  };
  A.refresh = () => {
    if (A.view && A.view !== 'notes' && SN.views[A.view]) SN.views[A.view].render();
    SN.editor.renderRight();
  };

  function wire() {
    SN.$$('#activity .act').forEach(b => b.onclick = () => A.show(b.dataset.view));
    $('#tb-search').onclick = () => SN.palette.open();
    $('#tb-zen').onclick = () => A.zen();
    $('#tb-theme').onclick = (e) => SN.menuAt(e.currentTarget, [{ header: 'Theme' }, ...Object.entries(SN.themes.list).map(([id, t]) => ({ label: (SN.settings.theme === id ? '✦ ' : '') + t.name, icon: 'palette', onClick: () => { SN.saveSettings({ theme: id, accent: '' }); SN.themes.apply(); if (A.view === 'settings') SN.views.settings.render(); } })), { sep: true }, { label: 'Alle Einstellungen', icon: 'settings', onClick: () => A.show('settings') }]);
    $('#tb-timer').onclick = () => { A.show('planner'); SN.views.planner.tab('focus'); };
    $('#tb-sync').onclick = () => { if (SN.sync.state === 'error' && SN.sync.error) SN.toast(SN.sync.error, 'err', 6000); SN.sync.run({ silent: false }); };
    $('#act-level').onclick = () => SN.views.home.levelInfo();
    SN.$$('.rp-tabs button').forEach(b => b.onclick = () => SN.editor.setRight(b.dataset.rp));
    document.body.append(h('button.btn.zen-exit', { html: SN.icon('minimize', 15) + '<span>Zen beenden (Esc)</span>', onclick: () => A.zen(false) }));
    document.addEventListener('keydown', onKey);
    window.addEventListener('beforeunload', onUnload);
    SN.on('planner', () => { if (A.view === 'home') SN.views.home.render(); });
    // Links im Editor mit Strg-Klick öffnen
    document.addEventListener('click', (e) => { const a = e.target.closest('a[href^="http"]'); if (a && !a.closest('.ed-content')) { e.preventDefault(); A.openExternal(a.href); } });
  }
  function applyLayout() {
    document.body.classList.toggle('hide-sidebar', SN.settings.showSidebar === false);
    document.body.classList.toggle('hide-right', SN.settings.showRightPanel === false);
  }
  A.toggleSidebar = () => { SN.saveSettings({ showSidebar: SN.settings.showSidebar === false }); applyLayout(); };
  A.toggleRight = () => { SN.saveSettings({ showRightPanel: SN.settings.showRightPanel === false }); applyLayout(); SN.editor.renderRight(); };
  A.zen = (on) => {
    const now = on == null ? !document.body.classList.contains('zen') : on;
    if (now && A.view !== 'notes') A.show('notes');
    document.body.classList.toggle('zen', now);
    if (SN.isElectron) window.spirit.win.fullscreen(now).catch(() => {});
    if (now) SN.toast('Zen-Modus – nur du und deine Worte. Esc zum Beenden.', 'info', 2200);
  };
  A.cycleTheme = () => { const ids = Object.keys(SN.themes.list); const i = ids.indexOf(SN.settings.theme); SN.saveSettings({ theme: ids[(i + 1) % ids.length], accent: '' }); SN.themes.apply(); SN.toast('Theme: ' + SN.themes.list[SN.settings.theme].name); };
  A.searchTag = (t) => { SN.views.overview.filterTag(t); A.show('overview'); };
  A.openExternal = (url) => { if (SN.isElectron) window.spirit.openExternal(url); else window.open(url, '_blank'); };

  // ---------- Level-Anzeige ----------
  let lastLvl = null;
  function renderLevel(initial) {
    const lv = SN.stats.level();
    const r = 20, c = 2 * Math.PI * r;
    $('#act-level').innerHTML = `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="${r}" fill="none" stroke="var(--line)" stroke-width="3"/><circle cx="24" cy="24" r="${r}" fill="none" stroke="var(--accent2)" stroke-width="3" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - lv.pct)}" transform="rotate(-90 24 24)" style="filter:drop-shadow(0 0 4px var(--glow2))"/></svg><span>${lv.lvl}</span>`;
    $('#act-level').title = `Spirit-Level ${lv.lvl} – ${lv.title}\n${SN.fmtNum(lv.xp)} XP`;
    if (!initial && lastLvl != null && lv.lvl > lastLvl) { SN.sound('level'); SN.toast(`Level Up! Du bist jetzt Level ${lv.lvl} – „${lv.title}“ ✦`, 'level', 5000); }
    lastLvl = lv.lvl;
  }

  // ======================================================================
  //  Notizen anlegen
  // ======================================================================
  A.newNote = async (folder) => {
    if (folder == null) folder = SN.editor.active ? SN.dirname(SN.editor.active.path) : '';
    if (folder === 'Tagebuch' || folder.startsWith('Vorlagen')) folder = '';
    const p = await SN.notes.create({ folder, name: 'Unbenannt' });
    SN.sidebar.reveal(p);
    await SN.editor.open(p, { newTab: true });
  };
  A.newFromTemplate = () => {
    const grid = h('div.tpl-grid');
    const all = [...SN.notes.TEMPLATES, ...SN.notes.userTemplates().map(n => ({ id: 'u:' + n.path, name: n.name, icon: 'sparkles', desc: 'Eigene Vorlage', user: n.path }))];
    let m;
    for (const t of all) grid.append(h('div.tpl-card', { onclick: async () => {
      m.close();
      if (t.id === 'diary') return A.dailyNote();
      const title = await SN.prompt('Titel der neuen Notiz', t.id === 'blank' ? '' : t.name, 'Titel …');
      if (title === null) return;
      let html = t.html;
      let tags = t.tags || [];
      if (t.user) { const { fm, body } = SN.notes.parse(await SN.fs.read(t.user)); html = SN.notes.bodyToHtml(body); tags = Array.isArray(fm.tags) ? fm.tags : []; }
      const folder = t.id === 'anime' ? 'Anime' : t.id === 'story' || t.id === 'character' ? 'Geschichten' : (SN.editor.active ? SN.dirname(SN.editor.active.path) : '');
      const p = await SN.notes.create({ folder: folder.startsWith('Vorlagen') || folder === 'Tagebuch' ? '' : folder, name: title || 'Unbenannt', html: SN.notes.fillVars(html, title), fm: { tags } });
      SN.sidebar.reveal(p);
      SN.editor.open(p, { newTab: true });
    } }, h('div.tpl-ico', { html: SN.icon(t.icon, 22) }), h('b', t.name), h('small', t.desc)));
    m = SN.modal({ title: SN.icon('sparkles', 20) + ' Neue Notiz aus Vorlage <span class="jp">テンプレート</span>', sub: 'Tipp: Eigene Vorlagen legst du im Ordner „Vorlagen“ an – oder über ··· → „Als Vorlage speichern“.', body: grid, width: 760 });
  };
  A.dailyNote = async (date = new Date()) => {
    const key = SN.dateKey(date);
    let p = SN.notes.resolve('Tagebuch/' + key) || SN.notes.resolve(key);
    if (!p) {
      const tpl = SN.notes.TEMPLATES.find(t => t.id === 'diary');
      const d = date;
      const html = tpl.html.replace(/\{\{weekday\}\}/g, SN.DAYS[d.getDay()]).replace(/\{\{date\}\}/g, `${SN.pad(d.getDate())}.${SN.pad(d.getMonth() + 1)}.${d.getFullYear()}`).replace(/\{\{weekday_jp\}\}/g, SN.DAYS_JP[d.getDay()]);
      p = await SN.notes.create({ folder: 'Tagebuch', name: key, html, fm: { tags: ['tagebuch'] } });
      SN.sidebar.reveal(p);
    }
    SN.editor.open(p, { newTab: true });
  };
  A.randomNote = () => {
    const all = SN.notes.all().filter(n => !n.folder.startsWith('Vorlagen'));
    if (!all.length) return SN.toast('Noch keine Notizen vorhanden', 'warn');
    SN.editor.open(all[Math.floor(Math.random() * all.length)].path, { newTab: true });
  };

  // ---------- Import ----------
  A.importText = async (name, text, dir = 'Importiert') => {
    const base = name.replace(/\.(md|markdown|txt|html)$/i, '');
    let body = text;
    if (/\.txt$/i.test(name)) body = text.split(/\n{2,}/).map(p => `<p>${SN.esc(p).replace(/\n/g, '<br>')}</p>`).join('');
    if (/\.html$/i.test(name)) { const d = new DOMParser().parseFromString(text, 'text/html'); body = SN.sanitize(d.body.innerHTML); }
    const p = await SN.fs.uniqueNotePath(dir, base);
    const { fm } = SN.notes.parse(body);
    const out = /^---\r?\n/.test(body) ? body : SN.notes.serialize({ id: SN.uid(), created: new Date().toISOString(), tags: [], ...fm }, body);
    await SN.fs.write(p, out);
    return p;
  };
  A.importFiles = async () => {
    let items = [];
    if (SN.isElectron) items = await window.spirit.dialog.importFiles();
    else items = await Promise.all((await SN.pickFiles('.md,.txt,.markdown,.html,image/*', true)).map(async f => ({ name: f.name, text: /\.(md|txt|markdown|html)$/i.test(f.name) ? await f.text() : null, data: /\.(md|txt|markdown|html)$/i.test(f.name) ? null : await SN.readFileAsArrayBuffer(f) })));
    if (!items.length) return;
    let n = 0, i = 0;
    for (const it of items) {
      if (it.text != null) { await A.importText(it.name, it.text); n++; }
      else if (it.data) { await SN.fs.saveImage(it.data instanceof ArrayBuffer ? it.data : new Uint8Array(it.data).buffer, 'attachments', it.name.replace(/\.[^.]+$/, '') + '.' + SN.ext(it.name)); i++; }
    }
    await SN.notes.build();
    SN.toast(`Importiert: ${SN.plural(n, 'Notiz', 'Notizen')}${i ? `, ${SN.plural(i, 'Bild', 'Bilder')}` : ''} (Ordner „Importiert“)`, 'ok', 4000);
  };

  // ---------- Bild-Vollansicht ----------
  A.lightbox = (src, path) => {
    const back = h('div.lightbox', { onclick: (e) => { if (e.target === back || e.target.tagName === 'IMG') close(); } },
      h('img', { src }),
      path ? h('div.lb-tools', h('button.btn.small', { html: SN.icon('layers', 14) + '<span>Als Hintergrund</span>', onclick: (e) => { e.stopPropagation(); SN.saveSettings({ bgImage: path }); SN.themes.apply(); SN.toast('Hintergrund gesetzt ✦', 'ok'); } }),
        h('button.btn.small', { html: SN.icon('folder-open', 14) + '<span>Im Explorer</span>', onclick: (e) => { e.stopPropagation(); SN.fs.reveal(path); } })) : null);
    const close = () => { back.classList.remove('in'); setTimeout(() => back.remove(), 200); document.removeEventListener('keydown', esc, true); };
    const esc = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    document.addEventListener('keydown', esc, true);
    document.body.append(back);
    requestAnimationFrame(() => back.classList.add('in'));
  };

  // ======================================================================
  //  Tastenkürzel
  // ======================================================================
  function onKey(e) {
    const mod = e.ctrlKey || e.metaKey;
    const k = e.key.toLowerCase();
    if (document.querySelector('.modal-back') && !(mod && k === 'p')) return;
    if (e.key === 'F11') { e.preventDefault(); A.zen(); return; }
    if (e.key === 'Escape' && document.body.classList.contains('zen')) { A.zen(false); return; }
    if (!mod) return;
    if (k === 'n' && !e.shiftKey) { e.preventDefault(); A.newNote(); }
    else if (k === 'n' && e.shiftKey) { e.preventDefault(); A.newFromTemplate(); }
    else if (k === 'o') { e.preventDefault(); SN.palette.notes(); }
    else if (k === 'p') { e.preventDefault(); if (!document.querySelector('.modal-back')) SN.palette.open(); }
    else if (k === 'f' && e.shiftKey) { e.preventDefault(); SN.palette.search(); }
    else if (k === 'f' && A.view === 'notes' && SN.editor.active) { e.preventDefault(); SN.editor.find(); }
    else if (k === 'd') { e.preventDefault(); A.dailyNote(); }
    else if (k === 's') { e.preventDefault(); if (SN.editor.active) SN.editor.save(SN.editor.active, { snapshot: true, toast: true }); }
    else if (k === 'w' && A.view === 'notes' && SN.editor.active) { e.preventDefault(); SN.editor.close(SN.editor.active); }
    else if (k === 'tab' && SN.editor.tabs.length > 1) { e.preventDefault(); const t = SN.editor.tabs; const i = t.indexOf(SN.editor.active); SN.editor.activate(t[(i + (e.shiftKey ? -1 : 1) + t.length) % t.length]); A.show('notes'); }
    else if (k === 'g' && !e.shiftKey) { e.preventDefault(); A.show('graph'); }
    else if (k === ',') { e.preventDefault(); A.show('settings'); }
    else if (k === '\\') { e.preventDefault(); A.toggleSidebar(); }
    else if (/^[1-7]$/.test(e.key) && !e.altKey) { e.preventDefault(); A.show(VIEWS[Number(e.key) - 1]); }
  }

  // ---------- Externe Änderungen (z.B. in einem anderen Programm bearbeitet) ----------
  const pending = new Set();
  const flushExternal = SN.debounce(async () => {
    const files = [...pending]; pending.clear();
    let structural = false;
    for (const f of files) {
      if (!SN.notes.isNote(f)) { structural = true; continue; }
      try {
        if (await SN.fs.exists(f)) { const t = await SN.fs.read(f); const tab = SN.editor.tabs.find(x => x.path === f); if (tab && tab.lastText === t) continue; SN.notes.update(f, t); SN.emit('note:external', f); }
        else { SN.notes.map.delete(f); structural = true; }
      } catch { structural = true; }
    }
    if (structural) await SN.notes.refreshFiles();
    SN.emit('index');
  }, 500);
  function onExternalChange(files) {
    const now = Date.now();
    for (const f of files) {
      const t = SN._self.get(f);
      if (t && now - t < 4000) continue;
      if ([...SN._self.entries()].some(([p, ts]) => now - ts < 4000 && (f.startsWith(p + '/') || p.startsWith(f + '/')))) continue;
      pending.add(f);
    }
    if (pending.size) flushExternal();
  }

  // ---------- Beim Schließen alles speichern ----------
  let closing = false;
  function onUnload(e) {
    const dirtyStores = Object.values(SN.data).some(s => s.pending);
    if (closing) return;
    if (!SN.isElectron) { SN.editor.saveAll(); Object.values(SN.data).forEach(s => s.flush()); return; }
    if (SN.editor.anyDirty() || dirtyStores) {
      e.preventDefault(); e.returnValue = false;
      closing = true;
      Promise.all([SN.editor.saveAll(), ...Object.values(SN.data).map(s => s.flush())]).finally(() => setTimeout(() => window.close(), 150));
    }
  }

  // ======================================================================
  //  Start-Inhalte für einen neuen Vault
  // ======================================================================
  async function seed() {
    const now = new Date().toISOString();
    const mk = async (path, html, tags = [], extra = {}) => { await SN.fs.write(path, SN.notes.serialize({ id: SN.uid(), created: now, tags, ...extra }, html)); };
    await SN.fs.mkdir('Ideen'); await SN.fs.mkdir('Geschichten'); await SN.fs.mkdir('Tagebuch'); await SN.fs.mkdir('Vorlagen'); await SN.fs.mkdir('attachments');
    await mk('Willkommen.md', `<h1>Willkommen bei Spirit Notes</h1><p class="jp-sub">精霊ノートへようこそ</p>
<p>Das hier ist dein neuer Ort zum <b>Schreiben</b>, <b>Planen</b> und <b>Festhalten</b>. Alles wird als normale Datei in deinem Vault-Ordner gespeichert – du verlierst also nie etwas.</p>
<div class="callout" data-type="spirit"><div class="callout-title">Erste Schritte</div><p>Lies die [[Anleitung]], schau dir den <b>Graph</b> links an und erstelle dann mit <b>Strg + N</b> deine erste eigene Notiz.</p></div>
<h2>Was du hier alles machen kannst</h2>
<ul class="checklist"><li data-checked="true">Schreiben wie in Word – mit Farben, Schriften, Tabellen und Bildern</li><li data-checked="false">Notizen mit [[Meine Ideen]] und anderen Seiten verlinken</li><li data-checked="false">Im <b>Planer</b> Aufgaben und Termine eintragen</li><li data-checked="false">Im <b>Anime</b>-Tab deine Lieblingsserien bewerten</li><li data-checked="false">Ein eigenes Hintergrundbild in den Einstellungen setzen</li></ul>
<h2>Beispiel-Tabelle</h2><table><tbody><tr><th>Bereich</th><th>Wofür?</th><th>Kürzel</th></tr><tr><td>Notizen</td><td>Schreiben & verlinken</td><td>Strg 2</td></tr><tr><td>Übersicht</td><td>Alle Notizen als Datenbank</td><td>Strg 3</td></tr><tr><td>Graph</td><td>Verbindungen sehen</td><td>Strg G</td></tr><tr><td>Planer</td><td>Kalender, Board, Fokus</td><td>Strg 5</td></tr></tbody></table>
<details><summary>Ein kleines Geheimnis (Spoiler)</summary><p>Unten links siehst du dein <b>Spirit-Level</b>. Jedes Wort, jede Aufgabe und jeder fertig geschaute Anime bringt dir XP. ✦</p></details>
<p>Viel Spaß – die Zeit gehört dir. #spirit-notes</p>`, ['start']);
    await mk('Anleitung.md', `<h1>Anleitung</h1><p class="jp-sub">使い方</p>
<h2>Schreiben</h2><ul><li>Tippe <code>/</code> für ein Menü mit Überschriften, Listen, Tabellen, Boxen, Spoilern und mehr.</li><li>Tippe <code>[[</code> um eine andere Notiz zu verlinken – existiert sie noch nicht, wird sie beim Klick erstellt.</li><li>Markdown-Kürzel: <code>#</code> + Leertaste = Überschrift, <code>-</code> = Liste, <code>[]</code> = Checkliste, <code>&gt;</code> = Zitat, <code>---</code> = Trennlinie.</li><li>Bilder einfach mit <b>Strg + V</b> einfügen oder in die Notiz ziehen. Klick aufs Bild = Größe & Position ändern.</li><li>Tags schreibst du mit <code>#</code> direkt in den Text, z.B. #anleitung – oder oben unter dem Titel.</li></ul>
<h2>Speichern & Zeitreise</h2><div class="callout" data-type="info"><div class="callout-title">Automatisch gespeichert</div><p>Alles speichert sich automatisch. Mit <b>Strg + S</b> legst du zusätzlich eine Version an. Über das Uhr-Symbol (Zeitreise) in der Toolbar springst du zu früheren Versionen zurück.</p></div>
<h2>Organisieren</h2><ul><li><b>Übersicht</b>: Alle Notizen als Karten, Tabelle oder Board – Board-Karten ziehen = in Ordner verschieben.</li><li><b>Graph</b>: Zeigt, wie deine Notizen verbunden sind. Probier den <b>Zeitraffer</b>!</li><li><b>Rechte Leiste</b>: Gliederung, Backlinks, lokaler Graph & Statistik der offenen Notiz.</li><li><b>Strg + P</b>: Befehlspalette – findet alles.</li></ul>
<h2>Planen</h2><p>Im Planer kannst du Aufgaben in natürlicher Sprache eintippen, z.B. <i>„Referat vorbereiten morgen 16 Uhr !hoch #schule“</i>. Datum, Uhrzeit, Priorität und Tag werden automatisch erkannt. Mit Erinnerung bekommst du eine Windows-Benachrichtigung.</p>
<h2>Anime</h2><p>Such einen Anime online – Cover, Folgen und Genres werden automatisch übernommen. Bewerte mit Sternen und Detail-Werten (Story, Charaktere, Animation, Musik, Spaß) und sortiere deine Favoriten in die <b>Tier-Liste</b>.</p>
<p>Zurück zu [[Willkommen]].</p>`, ['anleitung', 'start']);
    await mk('Ideen/Meine Ideen.md', `<h1>Meine Ideen</h1><div class="callout" data-type="tip"><div class="callout-title">Tipp</div><p>Sammle hier alles, was dir einfällt – später kannst du daraus eigene Notizen machen und sie verlinken.</p></div><ul><li>Eine eigene Geschichte schreiben → [[Kapitel 1 – Die stehengebliebene Uhr]]</li><li>Eine Liste mit Anime, die ich noch schauen will</li><li><br></li></ul><p>Siehe auch: [[Willkommen]] #idee</p>`, ['idee']);
    await mk('Geschichten/Kapitel 1 – Die stehengebliebene Uhr.md', `<h1>Kapitel 1 – Die stehengebliebene Uhr</h1><div class="callout" data-type="tip"><div class="callout-title">Zusammenfassung</div><p>Ein Beispiel-Kapitel, damit du siehst, wie Geschichten im Graph verbunden werden. Lösch es einfach, wenn du willst.</p></div><p><b>Charaktere:</b> [[Akari]]</p><hr><p>Die alte Turmuhr der Stadt war seit genau dreizehn Jahren stehengeblieben – um 12 Minuten nach Mitternacht. Niemand wusste warum, und niemand schien es zu bemerken. Niemand außer Akari.</p><p>In der Nacht, in der sie das erste Mal das leise <i>Tick</i> hörte, wusste sie, dass sich alles ändern würde.</p><p><br></p>`, ['story']);
    await mk('Geschichten/Akari.md', `<h1>Akari</h1><table><tbody><tr><th>Name</th><td>Akari Tokime</td></tr><tr><th>Alter</th><td>17</td></tr><tr><th>Fähigkeit</th><td>Kann für drei Sekunden die Zeit anhalten</td></tr><tr><th>Lieblingsfarbe</th><td><span style="color: rgb(225, 29, 72);">Karminrot</span></td></tr></tbody></table><h2>Persönlichkeit</h2><p>Neugierig, ein bisschen frech und immer zu spät – ironischerweise.</p><p>Taucht auf in: [[Kapitel 1 – Die stehengebliebene Uhr]] #charakter</p>`, ['charakter']);
    await mk('Vorlagen/Leseliste.md', `<h1>{{title}}</h1><p>Angelegt am {{date}}</p><ul class="checklist"><li data-checked="false"><br></li></ul>`, ['vorlage']);
    await SN.fs.write('.spirit/seeded', now);
    // Beispiel-Aufgaben
    const d = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return SN.dateKey(x); };
    const t = SN.data.planner.value.tasks;
    if (!t.length) {
      const base = { desc: '', time: '', status: 'todo', tags: [], color: '', note: '', repeat: 'none', remind: false, notified: false, created: now, doneAt: null, subtasks: [] };
      t.push({ ...base, id: SN.uid(), title: 'Spirit Notes erkunden', due: d(0), prio: 3, note: 'Willkommen.md', subtasks: [{ id: SN.uid(), text: 'Anleitung lesen', done: false }, { id: SN.uid(), text: 'Theme aussuchen', done: false }, { id: SN.uid(), text: 'Hintergrundbild setzen', done: false }] });
      t.push({ ...base, id: SN.uid(), title: 'Ersten Anime bewerten', due: d(1), prio: 2, tags: ['anime'] });
      t.push({ ...base, id: SN.uid(), title: 'Wochenplan erstellen', due: d(3), prio: 1, tags: ['plan'] });
      t.push({ ...base, id: SN.uid(), title: 'Eigene Geschichte weiterschreiben', due: '', prio: 0, status: 'doing', tags: ['story'] });
      SN.data.planner.save(); SN.data.planner.flush();
    }
    await SN.notes.build();
    SN.saveSettings({ openTabs: ['Willkommen.md'], activeTab: 'Willkommen.md' });
  }

  window.addEventListener('DOMContentLoaded', () => A.boot().catch(e => { console.error(e); document.body.classList.remove('booting'); SN.toast('Startfehler: ' + e.message, 'err', 10000); }));
})();
