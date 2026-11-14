/* Spirit Notes – Befehlspalette, Schnell-Öffnen & Volltextsuche */
(() => {
  const P = SN.palette = {};
  const h = SN.h;

  const commands = () => [
    { label: 'Neue Notiz', icon: 'file-plus', kbd: 'Strg N', run: () => SN.app.newNote() },
    { label: 'Neue Notiz aus Vorlage', icon: 'sparkles', run: () => SN.app.newFromTemplate() },
    { label: 'Tagesnotiz öffnen', icon: 'sun', kbd: 'Strg D', run: () => SN.app.dailyNote() },
    { label: 'Zufällige Notiz', icon: 'dice', run: () => SN.app.randomNote() },
    { label: 'Überall suchen', icon: 'search', kbd: 'Strg Umschalt F', run: () => P.search() },
    { label: 'Gehe zu: Home', icon: 'home', run: () => SN.app.show('home') },
    { label: 'Gehe zu: Notizen', icon: 'feather', run: () => SN.app.show('notes') },
    { label: 'Gehe zu: Übersicht / Datenbank', icon: 'table', run: () => SN.app.show('overview') },
    { label: 'Gehe zu: Graph', icon: 'graph', kbd: 'Strg G', run: () => SN.app.show('graph') },
    { label: 'Gehe zu: Planer', icon: 'calendar', run: () => SN.app.show('planner') },
    { label: 'Gehe zu: Anime', icon: 'tv', run: () => SN.app.show('anime') },
    { label: 'Gehe zu: Galerie', icon: 'image', run: () => SN.app.show('gallery') },
    { label: 'Gehe zu: Einstellungen', icon: 'settings', run: () => SN.app.show('settings') },
    { label: 'Aufgabe hinzufügen', icon: 'plus', run: () => SN.views.planner.quickAdd({}) },
    { label: 'Anime hinzufügen', icon: 'tv', run: () => { SN.app.show('anime'); SN.views.anime.add(); } },
    { label: 'Fokus-Timer starten', icon: 'timer', run: () => { SN.app.show('planner'); SN.views.planner.tab('focus'); SN.focus.start(); } },
    { label: 'Zen-Modus', icon: 'maximize', kbd: 'F11', run: () => SN.app.zen() },
    { label: 'Theme wechseln', icon: 'palette', run: () => SN.app.cycleTheme() },
    { label: 'Belohnungen öffnen', icon: 'trophy', run: () => SN.app.show('rewards') },
    { label: 'Begleiterin öffnen (Anime-Freundin)', icon: 'heart', run: () => SN.app.show('companion') },
    { label: 'Anime entdecken (suchen & Infos lesen)', icon: 'compass', run: () => SN.views.anime.showTab('discover') },
    { label: 'Anime stöbern – was schaue ich als Nächstes?', icon: 'scroll', run: () => { SN.views.anime.showTab('discover'); SN.discover.feed(); } },
    ...Object.entries(SN.themes.list).filter(([id]) => !SN.rewards.lockedTheme(id)).map(([id, t]) => ({ label: 'Theme: ' + t.name, icon: 'palette', run: () => { SN.saveSettings({ theme: id, accent: '' }); SN.themes.apply(); } })),
    { label: 'Seitenleiste ein/aus', icon: 'sidebar-l', run: () => SN.app.toggleSidebar() },
    { label: 'Rechte Leiste ein/aus', icon: 'sidebar-r', run: () => SN.app.toggleRight() },
    { label: 'Dateien importieren', icon: 'upload', run: () => SN.app.importFiles() },
    { label: 'Papierkorb', icon: 'trash', run: () => SN.views.settings.trash() },
    { label: 'Vault-Ordner öffnen', icon: 'folder-open', run: () => SN.fs.openFolder() },
    ...(SN.editor.active ? [
      { label: 'Notiz: Zeitreise (Versionen)', icon: 'history', run: () => SN.editor.history() },
      { label: 'Notiz: Als PDF exportieren', icon: 'printer', run: () => SN.editor.export('pdf') },
      { label: 'Notiz: Als Markdown exportieren', icon: 'code', run: () => SN.editor.export('md') },
      { label: 'Notiz: Suchen & Ersetzen', icon: 'search', kbd: 'Strg F', run: () => SN.editor.find() },
      { label: 'Notiz: Inhaltsverzeichnis einfügen', icon: 'list', run: () => { SN.editor.active.content.focus(); SN.editor.cmd.toc(); } },
      { label: 'Notiz: Im Explorer zeigen', icon: 'folder-open', run: () => SN.fs.reveal(SN.editor.active.path) },
    ] : []),
  ];

  function hi(text, q) {
    if (!q) return SN.esc(text);
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return SN.esc(text);
    return SN.esc(text.slice(0, i)) + '<mark>' + SN.esc(text.slice(i, i + q.length)) + '</mark>' + SN.esc(text.slice(i + q.length));
  }

  function open({ mode = 'all', placeholder }) {
    const input = h('input.pal-input', { placeholder, spellcheck: 'false' });
    const list = h('div.pal-list');
    let items = [], idx = 0;
    const body = h('div', h('div.pal-input-wrap', { html: SN.icon(mode === 'search' ? 'search' : 'command', 18) }, input), list,
      h('div.pal-foot', { html: '<span><kbd>↑↓</kbd> wählen</span><span><kbd>Enter</kbd> öffnen</span><span><kbd>Strg Enter</kbd> neuer Tab</span><span><kbd>Esc</kbd> schließen</span>' }));
    const m = SN.modal({ body, cls: 'palette', width: 660 });
    const run = (it, e) => { if (!it) return; m.close(); setTimeout(() => it.run(e || {}), 10); };
    const draw = () => {
      const q = input.value.trim();
      const ql = q.toLowerCase();
      items = [];
      list.innerHTML = '';
      const add = (group, arr) => { if (!arr.length) return; list.append(h('div.pal-group', group)); arr.forEach(it => { const i = items.length; items.push(it); const el = h('div.pal-item' + (i === idx ? '.on' : ''), { html: `${SN.icon(it.icon, 17)}<span class="t">${it.html || hi(it.label, q)}${it.sub ? `<small>${SN.esc(it.sub)}</small>` : ''}</span>${it.kbd ? `<kbd>${it.kbd}</kbd>` : ''}` }); el.onclick = (e) => run(it, { ctrlKey: e.ctrlKey }); el.onmouseenter = () => { idx = i; list.querySelectorAll('.pal-item').forEach((x, j) => x.classList.toggle('on', j === i)); }; list.append(el); }); };
      if (mode === 'search') {
        if (ql.length < 2) { list.append(h('div.empty-hint', 'Mindestens 2 Zeichen eingeben – durchsucht alle Notizen, Aufgaben & Anime.')); return; }
        const notes = SN.notes.all().map(n => {
          const ti = n.name.toLowerCase().includes(ql); const pos = n.lower.indexOf(ql);
          if (!ti && pos < 0) return null;
          const snip = pos >= 0 ? (pos > 40 ? '…' : '') + n.lower.slice(Math.max(0, pos - 40), pos + ql.length + 70) : n.excerpt.slice(0, 100);
          return { icon: 'file', label: n.name, html: `${hi(n.name, q)}<div class="pal-snip">${hi(snip, q)}</div>`, sub: '', s: (ti ? 10 : 0) + (n.lower.split(ql).length - 1), run: (e) => SN.editor.open(n.path, { newTab: e.ctrlKey }) };
        }).filter(Boolean).sort((a, b) => b.s - a.s).slice(0, 30);
        add(`Notizen (${notes.length})`, notes);
        add('Aufgaben', SN.views.planner.tasks().filter(t => t.title.toLowerCase().includes(ql)).slice(0, 8).map(t => ({ icon: t.status === 'done' ? 'check' : 'list-check', label: t.title, sub: t.due ? SN.fmtDate(SN.parseKey(t.due)) : '', run: () => SN.views.planner.edit(t) })));
        add('Anime', SN.views.anime.list().filter(a => a.title.toLowerCase().includes(ql)).slice(0, 8).map(a => ({ icon: 'tv', label: a.title, sub: a.score ? '★ ' + a.score : '', run: () => SN.views.anime.detail(a) })));
        if (!items.length) list.append(h('div.empty-hint', 'Keine Treffer.'));
      } else {
        let notes = SN.notes.all();
        if (ql) notes = notes.map(n => ({ n, s: SN.editor.score(n.name.toLowerCase(), ql) + (n.tags.some(t => t.includes(ql)) ? 15 : 0) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s).map(x => x.n);
        else { const rec = SN.recent.list(); notes = rec.map(p => SN.notes.get(p)).filter(Boolean).concat(notes.filter(n => !rec.includes(n.path)).sort((a, b) => (b.updated || '').localeCompare(a.updated || ''))); }
        const noteItems = notes.slice(0, mode === 'notes' ? 14 : 7).map(n => ({ icon: n.folder === 'Tagebuch' ? 'sun' : 'file', label: n.name, sub: n.folder, run: (e) => SN.editor.open(n.path, { newTab: e.ctrlKey }) }));
        if (ql && mode !== 'cmd' && !SN.notes.resolve(q)) noteItems.push({ icon: 'file-plus', label: `Neue Notiz „${q}“ erstellen`, run: async () => { const p = await SN.notes.create({ name: q }); SN.editor.open(p, { newTab: true }); } });
        if (mode !== 'cmd') add(ql ? 'Notizen' : 'Zuletzt geöffnet', noteItems);
        if (mode !== 'notes') add('Befehle', commands().filter(c => !ql || c.label.toLowerCase().includes(ql)).slice(0, ql ? 12 : 8));
        if (!items.length) list.append(h('div.empty-hint', 'Nichts gefunden.'));
      }
      idx = Math.min(idx, Math.max(0, items.length - 1));
    };
    input.addEventListener('input', () => { idx = 0; draw(); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); idx = (idx + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % Math.max(1, items.length); list.querySelectorAll('.pal-item').forEach((x, j) => x.classList.toggle('on', j === idx)); list.querySelector('.pal-item.on')?.scrollIntoView({ block: 'nearest' }); }
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); run(items[idx], { ctrlKey: e.ctrlKey }); }
    });
    draw();
    setTimeout(() => input.focus(), 30);
  }
  P.open = () => open({ mode: 'all', placeholder: 'Notiz öffnen oder Befehl ausführen …' });
  P.notes = () => open({ mode: 'notes', placeholder: 'Notiz schnell öffnen …' });
  P.commands = () => open({ mode: 'cmd', placeholder: 'Befehl …' });
  P.search = () => open({ mode: 'search', placeholder: 'In allen Notizen suchen …' });
})();
