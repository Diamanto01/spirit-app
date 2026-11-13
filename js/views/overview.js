/* Spirit Notes – Übersicht / Datenbank (Karten, Tabelle, Board, Tags) */
(() => {
  const V = SN.views.overview = {};
  const h = SN.h, $ = SN.$;
  const st = { mode: localStorage.getItem('sn-ov-mode') || 'cards', q: '', tag: '', folder: '*', sort: 'updated', dir: -1 };

  V.render = () => {
    const root = $('#view-overview');
    root.innerHTML = '';
    const col = h('div.view-col');
    const notes = SN.notes.all().filter(n => !n.folder.startsWith('Vorlagen'));
    const backCount = new Map();
    notes.forEach(n => n.links.forEach(l => { const p = SN.notes.resolve(l.target); if (p) backCount.set(p, (backCount.get(p) || 0) + 1); }));
    const orphans = notes.filter(n => !n.links.length && !backCount.get(n.path)).length;
    const unresolved = new Set(notes.flatMap(n => n.links.filter(l => !SN.notes.resolve(l.target)).map(l => l.target.toLowerCase()))).size;

    const search = h('input.input', { placeholder: 'Notizen durchsuchen (Titel, Text, #tag) …', value: st.q, spellcheck: 'false' });
    search.addEventListener('input', SN.debounce(() => { st.q = search.value; draw(); }, 120));
    const folderSel = h('select.select', { onchange: (e) => { st.folder = e.target.value; draw(); } },
      h('option', { value: '*' }, 'Alle Ordner'), h('option', { value: '' }, '/ (Vault)'), ...SN.notes.folders().filter(f => !f.startsWith('Vorlagen')).map(f => h('option', { value: f, selected: st.folder === f ? true : null }, f)));
    folderSel.value = st.folder;
    const sortSel = h('select.select', { onchange: (e) => { st.sort = e.target.value; st.dir = ['name', 'folder'].includes(st.sort) ? 1 : -1; draw(); } },
      ...[['updated', 'Zuletzt geändert'], ['created', 'Erstellt'], ['name', 'Name'], ['words', 'Wörter'], ['links', 'Meiste Verbindungen']].map(([v, l]) => h('option', { value: v, selected: st.sort === v ? true : null }, l)));
    const seg = h('div.seg', ...[['cards', 'grid', 'Karten'], ['table', 'table', 'Tabelle'], ['board', 'kanban', 'Board'], ['tags', 'tag', 'Tags']].map(([m, i, l]) =>
      h('button' + (st.mode === m ? '.on' : ''), { html: SN.icon(i, 14) + l, onclick: () => { st.mode = m; localStorage.setItem('sn-ov-mode', m); V.render(); } })));

    col.append(
      h('div.view-head', h('div', h('h2.view-title', { html: 'Übersicht <span class="jp">一覧</span>' }), h('div.view-sub', 'Dein Vault als Datenbank – filtern, sortieren, ordnen.')), h('div.spacer'), seg,
        h('button.btn.primary', { html: SN.icon('file-plus', 16) + '<span>Neue Notiz</span>', onclick: () => SN.app.newNote() })),
      h('div.deco-line'),
      h('div.ov-stats',
        ovStat('file', notes.length, 'Notizen'), ovStat('feather', SN.fmtNum(notes.reduce((s, n) => s + n.words, 0)), 'Wörter'),
        ovStat('tag', SN.notes.allTags().length, 'Tags'), ovStat('link', notes.reduce((s, n) => s + n.links.length, 0), 'Links'),
        ovStat('graph', orphans, 'ohne Verbindung', () => { st.q = ':waise'; V.render(); }), ovStat('alert', unresolved, 'fehlende Notizen', () => { st.q = ':fehlt'; V.render(); })),
      h('div.ov-filters', h('div.grow.ov-search', SN.ico('search', 16), search), folderSel, sortSel,
        h('button.icon-btn', { title: 'Sortierrichtung', html: SN.icon('sort', 16), onclick: () => { st.dir *= -1; draw(); } })),
    );
    const tagBar = h('div.ov-tags');
    const tags = SN.notes.allTags();
    if (tags.length && st.mode !== 'tags') {
      tagBar.append(h('span.chip' + (!st.tag ? '.on' : ''), { onclick: () => { st.tag = ''; V.render(); } }, 'Alle'));
      tags.slice(0, 24).forEach(([t, n]) => tagBar.append(h('span.chip.tag' + (st.tag === t ? '.on' : ''), { onclick: () => { st.tag = st.tag === t ? '' : t; V.render(); } }, t, h('span.faint', ' ' + n))));
      col.append(tagBar);
    }
    const body = h('div.ov-body');
    col.append(body);
    root.append(col);

    function filtered() {
      let list = notes;
      const q = st.q.trim().toLowerCase();
      if (q === ':waise') list = list.filter(n => !n.links.length && !backCount.get(n.path));
      else if (q === ':fehlt') list = list.filter(n => n.links.some(l => !SN.notes.resolve(l.target)));
      else if (q.startsWith('#')) list = list.filter(n => n.tags.some(t => t.startsWith(q.slice(1))));
      else if (q) list = list.filter(n => n.name.toLowerCase().includes(q) || n.lower.includes(q));
      if (st.tag) list = list.filter(n => n.tags.includes(st.tag));
      if (st.folder !== '*') list = list.filter(n => n.folder === st.folder || (st.folder && n.folder.startsWith(st.folder + '/')));
      const key = { updated: n => n.updated || '', created: n => n.created || '', name: n => n.name.toLowerCase(), words: n => n.words, links: n => n.links.length + (backCount.get(n.path) || 0), folder: n => n.folder, tags: n => n.tags.join(','), tasks: n => n.tasks.length }[st.sort] || (n => n.updated);
      return [...list].sort((a, b) => { const x = key(a), y = key(b); return (x > y ? 1 : x < y ? -1 : 0) * st.dir; });
    }
    function draw() {
      body.innerHTML = '';
      const list = filtered();
      if (st.mode === 'cards') drawCards(body, list);
      else if (st.mode === 'table') drawTable(body, list, backCount, (k) => { if (st.sort === k) st.dir *= -1; else { st.sort = k; st.dir = ['name', 'folder', 'tags'].includes(k) ? 1 : -1; } draw(); });
      else if (st.mode === 'board') drawBoard(body, list);
      else drawTags(body);
      if (!list.length && st.mode !== 'tags') body.append(h('div.empty-hint', { html: `${SN.icon('search', 26)}<br>Keine passenden Notizen gefunden.` }));
    }
    draw();
  };
  function ovStat(icon, val, label, onclick) { return h('div.ov-stat' + (onclick ? '.click' : ''), { onclick }, SN.ico(icon, 16), h('b', val), h('span', label)); }

  function noteCard(n) {
    const cover = n.fm.cover || n.image;
    const c = h('div.note-card', { draggable: 'true', style: n.color ? { '--nc': n.color } : null, onclick: (e) => SN.editor.open(n.path, { newTab: e.ctrlKey }) },
      cover ? h('div.nc-cover', { style: { backgroundImage: `url("${SN.fs.url(cover)}")` } }) : h('div.nc-cover.none', h('span', { html: SN.icon(n.folder === 'Tagebuch' ? 'sun' : 'feather', 30) })),
      h('div.nc-body',
        h('div.nc-title', n.pinned ? h('span.ico', { html: SN.icon('pin', 13) }) : null, n.name),
        h('p.nc-ex', n.excerpt.slice(0, 140) || 'Noch leer …'),
        n.tags.length ? h('div.nc-tags', ...n.tags.slice(0, 4).map(t => h('span.chip.tag', t))) : null,
        h('div.nc-meta', h('span', { html: SN.icon('folder', 12) + ' ' + SN.esc(n.folder || 'Vault') }), h('span', SN.fmtRel(n.updated)), h('span', n.words + ' W.'))));
    c.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/sn-move', n.path); e.dataTransfer.setData('text/sn-note', n.path); });
    c.addEventListener('contextmenu', (e) => SN.ctxMenu(e, [
      { label: 'Öffnen', icon: 'file', onClick: () => SN.editor.open(n.path) },
      { label: n.pinned ? 'Von Favoriten entfernen' : 'Zu Favoriten', icon: 'pin', onClick: () => SN.notes.setFm(n.path, { pinned: !n.pinned }).then(() => { SN.emit('files'); V.render(); }) },
      { label: 'Verschieben nach …', icon: 'move', onClick: () => SN.sidebar.moveDialog(n.path) },
      { label: 'In Papierkorb', icon: 'trash', danger: true, onClick: async () => { if (await SN.confirm('Notiz löschen?', `„${SN.esc(n.name)}“ kommt in den Papierkorb.`, { danger: true, ok: 'Löschen' })) { await SN.notes.remove(n.path); V.render(); } } },
    ]));
    return c;
  }
  function drawCards(body, list) { const g = h('div.card-grid'); list.forEach(n => g.append(noteCard(n))); body.append(g); }
  function drawTable(body, list, backCount, onSort) {
    const cols = [['name', 'Name'], ['folder', 'Ordner'], ['tags', 'Tags'], ['words', 'Wörter'], ['links', 'Links ↔'], ['tasks', 'Aufgaben'], ['created', 'Erstellt'], ['updated', 'Geändert']];
    const t = h('table.db-table');
    t.append(h('thead', h('tr', ...cols.map(([k, l]) => h('th' + (st.sort === k ? '.sorted' : ''), { onclick: () => onSort(k) }, l, st.sort === k ? h('span', st.dir > 0 ? ' ▲' : ' ▼') : '')))));
    const tb = h('tbody');
    list.forEach(n => {
      const done = n.tasks.filter(x => x.done).length;
      tb.append(h('tr', { onclick: (e) => SN.editor.open(n.path, { newTab: e.ctrlKey }) },
        h('td.db-name', n.color ? h('i.dotc', { style: { background: n.color } }) : SN.ico('file', 14), h('b', n.name)),
        h('td.faint', n.folder || '–'),
        h('td', ...n.tags.slice(0, 3).map(x => h('span.chip.tag', x))),
        h('td.num', SN.fmtNum(n.words)),
        h('td.num', `${n.links.length} / ${backCount.get(n.path) || 0}`),
        h('td', n.tasks.length ? h('div.row', { style: { gap: '6px' } }, h('div.goal-bar', { style: { width: '50px' } }, h('i', { style: { width: (done / n.tasks.length * 100) + '%' } })), h('span.faint', `${done}/${n.tasks.length}`)) : h('span.faint', '–')),
        h('td.faint', n.created ? SN.fmtDate(n.created) : '–'),
        h('td.faint', SN.fmtRel(n.updated))));
    });
    t.append(tb);
    body.append(h('div.db-wrap', t));
  }
  function drawBoard(body, list) {
    const groups = new Map([['', []]]);
    SN.notes.folders().filter(f => !f.includes('/') && !f.startsWith('Vorlagen')).forEach(f => groups.set(f, []));
    list.forEach(n => { const top = n.folder.split('/')[0]; if (!groups.has(top)) groups.set(top, []); groups.get(top).push(n); });
    const board = h('div.board');
    for (const [f, ns] of groups) {
      const colEl = h('div.board-col', h('div.board-head', SN.ico(f ? 'folder' : 'home', 15), h('b', f || 'Vault'), h('span.faint', ns.length)));
      const items = h('div.board-items');
      ns.forEach(n => items.append(noteCard(n)));
      colEl.addEventListener('dragover', (e) => { if (e.dataTransfer.types.includes('text/sn-move')) { e.preventDefault(); colEl.classList.add('drop'); } });
      colEl.addEventListener('dragleave', () => colEl.classList.remove('drop'));
      colEl.addEventListener('drop', async (e) => { e.preventDefault(); colEl.classList.remove('drop'); const p = e.dataTransfer.getData('text/sn-move'); if (p && SN.dirname(p).split('/')[0] !== f) { await SN.sidebar.move(p, f); V.render(); } });
      colEl.append(items);
      board.append(colEl);
    }
    board.append(h('div.board-col.add', { onclick: async () => { const f = await SN.sidebar.newFolder(''); if (f) V.render(); } }, h('span', { html: SN.icon('folder-plus', 22) }), 'Neuer Ordner'));
    body.append(h('div.faint', { style: { fontSize: '12px', margin: '0 0 10px' } }, 'Tipp: Zieh Karten zwischen den Spalten, um Notizen in andere Ordner zu verschieben.'), board);
  }
  function drawTags(body) {
    const tags = SN.notes.allTags();
    if (!tags.length) { body.append(h('div.empty-hint', { html: 'Noch keine Tags.<br>Schreib z.B. <b>#idee</b> in eine Notiz oder füge Tags oben unter dem Titel hinzu.' })); return; }
    const max = tags[0][1];
    const cloud = h('div.big-cloud');
    tags.forEach(([t, n]) => cloud.append(h('span.cloud-tag', { style: { fontSize: (13 + (n / max) * 22) + 'px', opacity: .55 + .45 * (n / max) }, onclick: () => { st.tag = t; st.mode = 'cards'; V.render(); } }, '#' + t, h('sup', n))));
    body.append(cloud);
    const g = h('div.tag-groups');
    tags.slice(0, 12).forEach(([t]) => {
      const ns = SN.notes.all().filter(n => n.tags.includes(t)).slice(0, 6);
      g.append(h('div.card.tag-group', h('div.card-title', { html: `<span style="color:var(--accent2)">#</span>${SN.esc(t)}` }), ...ns.map(n => h('div.outline-item', { onclick: () => SN.editor.open(n.path) }, n.name))));
    });
    body.append(g);
  }
  V.filterTag = (t) => { st.tag = t; st.mode = st.mode === 'tags' ? 'cards' : st.mode; st.q = ''; };
})();
