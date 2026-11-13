/* Spirit Notes – Galerie aller Bilder im Vault */
(() => {
  const V = SN.views.gallery = {};
  const h = SN.h, $ = SN.$;
  let filter = 'all';

  V.render = async () => {
    const root = $('#view-gallery');
    root.innerHTML = '';
    const col = h('div.view-col');
    const imgs = SN.notes.files.filter(f => !f.isDir && SN.isImage(f.path) && !f.path.startsWith('.spirit/trash')).sort((a, b) => (b.mtime || 0) - (a.mtime || 0));
    const used = new Map();
    for (const n of SN.notes.all()) {
      const re = /(?:src|data-src)="([^"]+)"|cover:\s*"?([^"\n]+)/g;
      const raw = n.image ? [n.image] : [];
      raw.forEach(p => used.set(p, [...(used.get(p) || []), n.path]));
    }
    // genauer: Bilder in Notiztexten suchen
    await Promise.all(SN.notes.all().map(async n => {
      try {
        const t = await SN.fs.read(n.path);
        for (const m of t.matchAll(/(?:src|data-src)="([^"]+)"|cover:\s*"?([^"\n]+?)"?\n/g)) { const p = decodeURI(m[1] || m[2] || ''); if (p) used.set(p, [...new Set([...(used.get(p) || []), n.path])]); }
      } catch { }
    }));
    const animeCovers = new Set(SN.views.anime.list().map(a => a.cover));
    const seg = h('div.seg', ...[['all', 'Alle'], ['notes', 'In Notizen'], ['anime', 'Anime-Cover'], ['unused', 'Unbenutzt']].map(([k, l]) => h('button' + (filter === k ? '.on' : ''), { onclick: () => { filter = k; V.render(); } }, l)));
    col.append(h('div.view-head', h('div', h('h2.view-title', { html: 'Galerie <span class="jp">画廊</span>' }), h('div.view-sub', `${SN.plural(imgs.length, 'Bild', 'Bilder')} in deinem Vault – zieh sie direkt in eine Notiz.`)), h('div.spacer'), seg,
      h('button.btn.primary', { html: SN.icon('upload', 16) + '<span>Bilder hinzufügen</span>', onclick: async () => {
        const files = await SN.pickFiles('image/*', true); if (!files.length) return;
        for (const f of files) await SN.fs.saveImage(f, 'attachments', f.name.replace(/\.[^.]+$/, ''));
        await SN.notes.refreshFiles(); V.render(); SN.toast(`${SN.plural(files.length, 'Bild', 'Bilder')} hinzugefügt`, 'ok');
      } })), h('div.deco-line'));
    let list = imgs;
    if (filter === 'notes') list = imgs.filter(f => used.has(f.path));
    if (filter === 'anime') list = imgs.filter(f => animeCovers.has(f.path));
    if (filter === 'unused') list = imgs.filter(f => !used.has(f.path) && !animeCovers.has(f.path) && SN.settings.bgImage !== f.path);
    const grid = h('div.gallery');
    if (!list.length) grid.append(h('div.empty-hint', { html: `${SN.icon('image', 34)}<br>Keine Bilder hier. Füge Bilder in Notizen ein (Strg+V, Drag & Drop oder /bild) oder lade sie hier hoch.` }));
    for (const f of list) {
      const u = used.get(f.path) || [];
      const tile = h('div.g-tile', { draggable: 'true', onclick: () => SN.app.lightbox(SN.fs.url(f.path), f.path) },
        h('img', { src: SN.fs.url(f.path), loading: 'lazy', alt: '' }),
        h('div.g-info', h('span', SN.basename(f.path)), u.length ? h('span.chip', { title: u.map(SN.noteName).join(', ') }, `${u.length} Notiz${u.length > 1 ? 'en' : ''}`) : animeCovers.has(f.path) ? h('span.chip', 'Anime') : null));
      tile.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/sn-image', f.path));
      tile.addEventListener('contextmenu', (e) => SN.ctxMenu(e, [
        { label: 'Groß ansehen', icon: 'eye', onClick: () => SN.app.lightbox(SN.fs.url(f.path), f.path) },
        { label: 'In aktuelle Notiz einfügen', icon: 'plus', onClick: () => insertIntoNote(f.path) },
        { label: 'Als App-Hintergrund setzen', icon: 'layers', onClick: () => { SN.saveSettings({ bgImage: f.path }); SN.themes.apply(); SN.toast('Hintergrund gesetzt ✦', 'ok'); } },
        ...u.map(p => ({ label: 'Öffnen: ' + SN.noteName(p), icon: 'file', onClick: () => SN.editor.open(p) })),
        { label: 'Im Explorer zeigen', icon: 'folder-open', onClick: () => SN.fs.reveal(f.path) },
        { sep: true },
        { label: 'Löschen', icon: 'trash', danger: true, onClick: async () => { if (await SN.confirm('Bild löschen?', u.length ? `Achtung: Das Bild wird in ${u.length} Notiz(en) verwendet.` : 'Das Bild kommt in den Papierkorb.', { danger: true, ok: 'Löschen' })) { await SN.fs.remove(f.path); await SN.notes.refreshFiles(); V.render(); } } },
      ]));
      grid.append(tile);
    }
    col.append(h('div.an-body', grid));
    root.append(col);
  };
  function insertIntoNote(p) {
    const tab = SN.editor.active;
    if (!tab) return SN.toast('Öffne zuerst eine Notiz', 'warn');
    SN.app.show('notes');
    tab.content.focus();
    const sel = getSelection(); if (!sel.rangeCount || !tab.content.contains(sel.anchorNode)) { const r = document.createRange(); r.selectNodeContents(tab.content); r.collapse(false); sel.removeAllRanges(); sel.addRange(r); }
    document.execCommand('insertHTML', false, `<img data-src="${SN.esc(p)}" src="${SN.esc(SN.fs.url(p))}"><p><br></p>`);
    tab.content.dispatchEvent(new Event('input'));
  }
})();
