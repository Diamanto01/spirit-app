/* Spirit Notes – Seitenleiste: Dateibaum, Favoriten, Tags */
(() => {
  const S = SN.sidebar = { open: new Set(JSON.parse(localStorage.getItem('sn-open-folders') || '[]')) };
  const $ = SN.$, h = SN.h;
  const HIDE = (p) => p.startsWith('.spirit') || p === 'attachments' || p.startsWith('attachments/');

  S.init = () => {
    $('#sb-new').onclick = () => SN.app.newNote();
    $('#sb-template').onclick = () => SN.app.newFromTemplate();
    $('#sb-folder').onclick = () => S.newFolder('');
    $('#sb-daily').onclick = () => SN.app.dailyNote();
    $('#sb-more').onclick = (e) => SN.menuAt(e.currentTarget, [
      { label: 'Dateien importieren (.md, .txt, Bilder)', icon: 'upload', onClick: () => SN.app.importFiles() },
      { label: 'Zufällige Notiz', icon: 'dice', onClick: () => SN.app.randomNote() },
      { label: 'Alle Ordner zuklappen', icon: 'folder', onClick: () => { S.open.clear(); saveOpen(); S.render(); } },
      { label: 'Vault-Ordner öffnen', icon: 'folder-open', onClick: () => SN.fs.openFolder() },
      { label: 'Papierkorb', icon: 'trash', onClick: () => SN.views.settings.trash() },
    ]);
    $('#sb-filter').addEventListener('input', SN.debounce(S.render, 120));
    $('#sb-tags-toggle').onclick = () => $('#sb-tags').classList.toggle('collapsed');
    const tree = $('#sb-tree');
    tree.addEventListener('dragover', (e) => { if (e.target === tree) { e.preventDefault(); } });
    tree.addEventListener('drop', (e) => { if (e.target === tree) { e.preventDefault(); dropInto(e, ''); } });
    tree.addEventListener('contextmenu', (e) => { if (e.target === tree) SN.ctxMenu(e, [{ label: 'Neue Notiz', icon: 'file-plus', onClick: () => SN.app.newNote('') }, { label: 'Neuer Ordner', icon: 'folder-plus', onClick: () => S.newFolder('') }]); });
    SN.on('files', SN.debounce(S.render, 50));
    SN.on('index', S.render);
    SN.on('note:updated', SN.debounce(S.render, 300));
    SN.on('editor:active', S.highlight);
  };
  const saveOpen = () => localStorage.setItem('sn-open-folders', JSON.stringify([...S.open]));

  S.render = () => {
    const filter = ($('#sb-filter').value || '').toLowerCase().trim();
    const notes = SN.notes.all();
    $('#sb-count').textContent = notes.length;
    // Favoriten
    const pinned = notes.filter(n => n.pinned).sort((a, b) => a.name.localeCompare(b.name));
    $('#sb-pinned-wrap').classList.toggle('hidden', !pinned.length);
    $('#sb-pinned').innerHTML = '';
    pinned.forEach(n => $('#sb-pinned').append(noteItem(n)));
    // Baum
    const tree = $('#sb-tree'); tree.innerHTML = '';
    if (filter) {
      const hits = notes.filter(n => n.name.toLowerCase().includes(filter) || n.tags.some(t => t.includes(filter.replace(/^#/, ''))) || n.lower.includes(filter))
        .sort((a, b) => (b.name.toLowerCase().includes(filter) - a.name.toLowerCase().includes(filter)) || a.name.localeCompare(b.name));
      if (!hits.length) tree.append(h('div.empty-hint', 'Nichts gefunden.'));
      hits.forEach(n => tree.append(noteItem(n, true)));
    } else {
      const root = { dirs: new Map(), notes: [] };
      for (const f of SN.notes.files) {
        if (HIDE(f.path)) continue;
        if (f.isDir) { ensure(root, f.path); continue; }
        if (!SN.notes.isNote(f.path)) continue;
        const meta = SN.notes.get(f.path); if (!meta) continue;
        ensure(root, SN.dirname(f.path)).notes.push(meta);
      }
      renderDir(tree, root, '');
      if (!notes.length) tree.append(h('div.empty-hint', 'Dein Vault ist leer. Erstelle deine erste Notiz!'));
    }
    // Tags
    const tg = $('#sb-tags'); tg.innerHTML = '';
    const tags = SN.notes.allTags();
    if (!tags.length) tg.append(h('div.faint', { style: { fontSize: '12px', padding: '2px 4px' } }, 'Noch keine Tags. Schreib #tag in eine Notiz.'));
    tags.slice(0, 40).forEach(([t, n]) => tg.append(h('span.chip.tag', { title: `${n} Notizen`, onclick: () => { $('#sb-filter').value = '#' + t; S.render(); } }, t, h('span.faint', ' ' + n))));
    S.highlight();
  };
  function ensure(root, dir) {
    if (!dir) return root;
    let node = root, acc = '';
    for (const part of dir.split('/')) { acc = acc ? acc + '/' + part : part; if (!node.dirs.has(part)) node.dirs.set(part, { dirs: new Map(), notes: [], path: acc }); node = node.dirs.get(part); }
    return node;
  }
  function renderDir(el, node, depth) {
    const dirs = [...node.dirs.entries()].sort((a, b) => a[0].localeCompare(b[0], 'de'));
    for (const [name, d] of dirs) {
      const open = S.open.has(d.path);
      const count = countNotes(d);
      const item = h('div.tree-item.folder' + (open ? '.open' : ''), { draggable: 'true', data: { path: d.path } },
        h('span.ico.chev', { html: SN.icon('chev-r', 13) }), h('span.ico', { html: SN.icon(open ? 'folder-open' : 'folder', 16) }), h('span.name', name), h('span.meta', count || ''));
      item.onclick = () => { open ? S.open.delete(d.path) : S.open.add(d.path); saveOpen(); S.render(); };
      item.addEventListener('contextmenu', (e) => SN.ctxMenu(e, [
        { label: 'Neue Notiz hier', icon: 'file-plus', onClick: () => SN.app.newNote(d.path) },
        { label: 'Neuer Unterordner', icon: 'folder-plus', onClick: () => S.newFolder(d.path) },
        { label: 'Umbenennen', icon: 'edit', onClick: () => renameFolder(d.path) },
        { label: 'Im Explorer zeigen', icon: 'folder-open', onClick: () => SN.fs.reveal(d.path) },
        { sep: true },
        { label: 'Ordner löschen', icon: 'trash', danger: true, onClick: async () => { if (await SN.confirm('Ordner löschen?', `„${SN.esc(name)}“ und alle ${count} Notizen darin kommen in den Papierkorb.`, { danger: true, ok: 'Löschen' })) SN.notes.remove(d.path); } },
      ]));
      dragWire(item, d.path, true);
      el.append(item);
      if (open) { const ch = h('div.tree-children'); renderDir(ch, d, depth + 1); el.append(ch); }
    }
    node.notes.sort((a, b) => a.name.localeCompare(b.name, 'de', { numeric: true })).forEach(n => el.append(noteItem(n)));
  }
  const countNotes = (d) => d.notes.length + [...d.dirs.values()].reduce((s, x) => s + countNotes(x), 0);

  function noteItem(n, showFolder) {
    const icon = n.folder === 'Tagebuch' ? 'sun' : n.folder.startsWith('Vorlagen') ? 'sparkles' : 'file';
    const item = h('div.tree-item', { draggable: 'true', title: n.path, data: { path: n.path } },
      n.color ? h('span.dotc', { style: { background: n.color, boxShadow: `0 0 6px ${n.color}` } }) : h('span.ico', { html: SN.icon(icon, 15) }),
      h('span.name', n.name), showFolder && n.folder ? h('span.meta', n.folder) : null);
    item.onclick = (e) => SN.editor.open(n.path, { newTab: e.ctrlKey || e.metaKey });
    item.addEventListener('auxclick', (e) => { if (e.button === 1) SN.editor.open(n.path, { newTab: true }); });
    item.addEventListener('contextmenu', (e) => SN.ctxMenu(e, [
      { label: 'Öffnen', icon: 'file', onClick: () => SN.editor.open(n.path) },
      { label: 'In neuem Tab öffnen', icon: 'plus', onClick: () => SN.editor.open(n.path, { newTab: true }) },
      { sep: true },
      { label: n.pinned ? 'Von Favoriten entfernen' : 'Zu Favoriten', icon: 'pin', onClick: () => SN.notes.setFm(n.path, { pinned: !n.pinned }).then(() => SN.emit('files')) },
      { label: 'Umbenennen', icon: 'edit', onClick: async () => { const v = await SN.prompt('Notiz umbenennen', n.name); if (v && v !== n.name) { const np = (n.folder ? n.folder + '/' : '') + SN.slug(v) + '.md'; if (await SN.fs.exists(np)) return SN.toast('Name ist schon vergeben', 'warn'); if (SN.editor.isOpen(n.path)) await SN.editor.saveAll(); SN.notes.rename(n.path, np); } } },
      { label: 'Verschieben nach …', icon: 'move', onClick: () => S.moveDialog(n.path) },
      { label: 'Im Explorer zeigen', icon: 'folder-open', onClick: () => SN.fs.reveal(n.path) },
      { sep: true },
      { label: 'In Papierkorb', icon: 'trash', danger: true, onClick: async () => { if (await SN.confirm('Notiz löschen?', `„${SN.esc(n.name)}“ kommt in den Papierkorb.`, { danger: true, ok: 'Löschen' })) SN.notes.remove(n.path); } },
    ]));
    dragWire(item, n.path, false);
    return item;
  }

  // ---------- Drag & Drop (Notizen/Ordner verschieben) ----------
  function dragWire(item, path, isDir) {
    item.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/sn-move', path); if (!isDir) e.dataTransfer.setData('text/sn-note', path); e.dataTransfer.effectAllowed = 'copyMove'; });
    if (!isDir) return;
    item.addEventListener('dragover', (e) => { if (e.dataTransfer.types.includes('text/sn-move') || e.dataTransfer.types.includes('Files')) { e.preventDefault(); item.classList.add('drop'); } });
    item.addEventListener('dragleave', () => item.classList.remove('drop'));
    item.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); item.classList.remove('drop'); dropInto(e, path); });
  }
  async function dropInto(e, dir) {
    const src = e.dataTransfer.getData('text/sn-move');
    if (src) return S.move(src, dir);
    const files = Array.from(e.dataTransfer.files || []);
    for (const f of files) {
      if (/\.(md|txt|markdown)$/i.test(f.name)) { const text = await f.text(); await SN.app.importText(f.name, text, dir); }
      else if (f.type.startsWith('image/')) { await SN.fs.saveImage(f, 'attachments', f.name.replace(/\.[^.]+$/, '')); }
    }
    if (files.length) { await SN.notes.build(); SN.toast(`${SN.plural(files.length, 'Datei', 'Dateien')} importiert`, 'ok'); }
  }
  S.move = async (src, dir) => {
    const name = SN.basename(src);
    const dest = (dir ? dir + '/' : '') + name;
    if (dest === src || (dir + '/').startsWith(src + '/')) return;
    if (await SN.fs.exists(dest)) return SN.toast('Dort gibt es schon etwas mit diesem Namen', 'warn');
    await SN.editor.saveAll();
    const isDir = SN.notes.files.find(f => f.path === src)?.isDir;
    if (isDir) await SN.notes.renameFolder(src, dest);
    else await SN.notes.rename(src, dest);
    if (dir) { S.open.add(dir); saveOpen(); }
    SN.toast(`Verschoben nach ${dir || 'Vault'}`, 'ok');
  };
  S.moveDialog = (path) => {
    const folders = ['', ...SN.notes.folders()];
    const list = h('div.move-list');
    folders.forEach(f => list.append(h('div.tree-item.folder', { onclick: () => { m.close(); S.move(path, f); } }, h('span.ico', { html: SN.icon('folder', 16) }), h('span.name', f || '/ (Vault)'))));
    const m = SN.modal({ title: SN.icon('move', 20) + ' Verschieben nach …', body: list, width: 420, buttons: [{ label: 'Neuer Ordner …', icon: 'folder-plus', left: true, onClick: async (c) => { c(); const f = await S.newFolder(''); if (f) S.move(path, f); } }, { label: 'Abbrechen' }] });
  };
  S.newFolder = async (parent) => {
    const v = await SN.prompt('Neuer Ordner', '', 'z.B. Geschichten, Schule, Ideen');
    if (!v) return null;
    const p = (parent ? parent + '/' : '') + SN.slug(v);
    await SN.fs.mkdir(p);
    if (parent) S.open.add(parent);
    S.open.add(p); saveOpen();
    await SN.notes.refreshFiles();
    return p;
  };
  async function renameFolder(p) {
    const v = await SN.prompt('Ordner umbenennen', SN.basename(p));
    if (!v || v === SN.basename(p)) return;
    const np = (SN.dirname(p) ? SN.dirname(p) + '/' : '') + SN.slug(v);
    await SN.editor.saveAll();
    await SN.notes.renameFolder(p, np);
    if (S.open.has(p)) { S.open.delete(p); S.open.add(np); saveOpen(); }
  }
  S.highlight = () => {
    const act = SN.editor.active?.path;
    SN.$$('#sidebar .tree-item').forEach(el => el.classList.toggle('active', !!act && el.dataset.path === act));
  };
  S.reveal = (path) => {
    let d = SN.dirname(path);
    while (d) { S.open.add(d); d = SN.dirname(d); }
    saveOpen(); S.render();
  };
})();
