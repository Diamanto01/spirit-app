/* Spirit Notes – Editor (wie Word) mit Tabs, Toolbar, [[Links]], Slash-Befehlen, Bildern, Tabellen, Zeitreise */
(() => {
  const Ed = SN.editor = { tabs: [], active: null };
  const $ = SN.$, h = SN.h;
  const COLORS = ['#e11d48', '#fb7185', '#f472b6', '#d946ef', '#a855f7', '#6366f1', '#3b82f6', '#38bdf8', '#14b8a6', '#10b981', '#84cc16', '#facc15', '#d4af37', '#f97316', '#ef4444', '#ffffff', '#d4d4d8', '#a1a1aa', '#71717a', '#3f3f46', '#000000'];
  const HILITES = ['rgba(225,29,72,.35)', 'rgba(244,114,182,.35)', 'rgba(168,85,247,.35)', 'rgba(59,130,246,.35)', 'rgba(20,184,166,.35)', 'rgba(16,185,129,.35)', 'rgba(250,204,21,.45)', 'rgba(212,175,55,.45)', 'rgba(249,115,22,.4)', 'rgba(255,255,255,.25)'];
  const FONTS = [
    { id: 'Lora', label: 'Lora (Serif)', css: "'Lora', Georgia, serif" },
    { id: 'Poppins', label: 'Poppins (Modern)', css: "'Poppins', sans-serif" },
    { id: 'Spirit Serif', label: 'Spirit Serif (Anime)', css: "'Spirit Serif', serif" },
    { id: 'Spirit Script', label: 'Spirit Script (Schnörkel)', css: "'Spirit Script', cursive" },
    { id: 'Georgia', label: 'Georgia', css: 'Georgia, serif' },
    { id: 'Consolas', label: 'Mono (Code)', css: "Consolas, 'Cascadia Code', monospace" },
  ];
  const SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64];
  const BLOCKS = [
    { tag: 'P', label: 'Text', icon: 'text' }, { tag: 'H1', label: 'Überschrift 1', icon: 'heading' }, { tag: 'H2', label: 'Überschrift 2', icon: 'heading' },
    { tag: 'H3', label: 'Überschrift 3', icon: 'heading' }, { tag: 'H4', label: 'Überschrift 4', icon: 'heading' }, { tag: 'BLOCKQUOTE', label: 'Zitat', icon: 'quote' }, { tag: 'PRE', label: 'Code-Block', icon: 'code' },
  ];

  // ======================================================================
  //  Init
  // ======================================================================
  Ed.init = () => {
    document.execCommand('defaultParagraphSeparator', false, 'p');
    buildToolbar();
    buildEmpty();
    Ed.renderStatus();
    document.addEventListener('selectionchange', SN.debounce(() => { if (Ed.active && document.activeElement === Ed.active.content) { updateToolbarState(); Ed.renderStatus(); maybeTableTools(); } }, 60));
    SN.on('note:renamed', (o, n) => { const t = Ed.tabs.find(t => t.path === o); if (t) { t.path = n; t.titleEl.value = SN.noteName(n); renderTabs(); persistTabs(); } });
    SN.on('note:deleted', (p) => { const t = Ed.tabs.find(t => t.path === p); if (t) Ed.close(t, true); });
    SN.on('note:external', async (p) => { const t = Ed.tabs.find(t => t.path === p); if (t && !t.dirty) await reload(t); });
    SN.on('index', () => { Ed.tabs.forEach(markBroken); Ed.renderRight(); });
    SN.on('note:updated', SN.debounce(() => { Ed.tabs.forEach(markBroken); Ed.renderRight(); }, 400));
    SN.on('settings', applyEditorSettings);
    applyEditorSettings();
    window.addEventListener('resize', () => { hideFloat(); closeEdPop(); });
  };

  function applyEditorSettings() {
    const s = SN.settings;
    document.body.classList.remove('ed-font-sans', 'ed-font-mono', 'ed-font-head', 'ed-wide', 'ed-full');
    if (s.editorFont === 'sans') document.body.classList.add('ed-font-sans');
    if (s.editorFont === 'mono') document.body.classList.add('ed-font-mono');
    if (s.editorFont === 'head') document.body.classList.add('ed-font-head');
    if (s.editorWidth === 'wide') document.body.classList.add('ed-wide');
    if (s.editorWidth === 'full') document.body.classList.add('ed-full');
    document.documentElement.style.setProperty('--ed-size', (s.editorSize || 17) + 'px');
    Ed.tabs.forEach(t => t.content.spellcheck = s.spellcheck !== false);
  }

  // ======================================================================
  //  Tabs
  // ======================================================================
  Ed.current = () => Ed.active;
  Ed.isOpen = (p) => Ed.tabs.some(t => t.path === p);
  Ed.anyDirty = () => Ed.tabs.some(t => t.dirty);

  Ed.open = async (path, { newTab = false, focus = true, line } = {}) => {
    if (!path) return;
    if (SN.mobile && SN.mobile.active) newTab = false; // Handy: immer nur eine offene Notiz
    SN.app.show('notes');
    let tab = Ed.tabs.find(t => t.path === path);
    if (!tab) {
      let idx = Ed.tabs.length;
      if (!newTab && Ed.active && !Ed.active.keep) { idx = Ed.tabs.indexOf(Ed.active); await Ed.close(Ed.active, true, true); }
      tab = await createTab(path);
      if (!tab) return;
      Ed.tabs.splice(Math.min(idx, Ed.tabs.length), 0, tab);
    }
    Ed.activate(tab, focus);
    if (line) scrollToHeading(tab, line);
    SN.recent.push(path);
    return tab;
  };

  async function createTab(path) {
    let text;
    try { text = await SN.fs.read(path); } catch (e) { SN.toast('Datei konnte nicht geöffnet werden', 'err'); return null; }
    const page = h('div.ed-page');
    const inner = h('div.ed-inner');
    const cover = h('div.ed-cover.hidden');
    const titleEl = h('input.ed-title', { value: SN.noteName(path), placeholder: 'Titel', spellcheck: 'false' });
    const props = h('div.ed-props');
    const content = h('div.ed-content', { contenteditable: 'true', spellcheck: SN.settings.spellcheck !== false ? 'true' : 'false' });
    inner.append(cover, titleEl, props, content);
    page.append(inner);
    $('#pages').append(page);
    const tab = { path, page, inner, cover, titleEl, props, content, fm: {}, lastSaved: '', lastText: '', words: 0, dirty: false, lastSnap: 0, keep: false };
    fill(tab, text);
    wireTab(tab);
    return tab;
  }

  function fill(tab, text) {
    const { fm, body } = SN.notes.parse(text);
    tab.fm = fm;
    tab.content.innerHTML = toEditorHtml(SN.notes.bodyToHtml(body));
    tab.lastSaved = fromEditorHtml(tab.content);
    tab.lastText = text;
    tab.words = SN.countWords(SN.notes.htmlText(tab.lastSaved).replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, a, b) => b || a));
    markBroken(tab);
    renderProps(tab);
    renderCover(tab);
  }
  async function reload(tab) {
    try { const text = await SN.fs.read(tab.path); if (text === tab.lastText) return; fill(tab, text); if (tab === Ed.active) Ed.renderRight(); } catch { }
  }

  Ed.activate = (tab, focus = true) => {
    if (Ed.active && Ed.active !== tab && Ed.active.dirty) Ed.save(Ed.active);
    Ed.active = tab;
    Ed.tabs.forEach(t => t.page.classList.toggle('on', t === tab));
    $('#ed-empty').classList.toggle('hidden', !!tab);
    $('#toolbar').classList.toggle('disabled', !tab);
    renderTabs(); Ed.renderStatus(); Ed.renderRight(); persistTabs();
    closeFind();
    SN.emit('editor:active', tab && tab.path);
    if (tab && focus) setTimeout(() => { if (tab.content.textContent.trim() === '' && SN.noteName(tab.path).startsWith('Unbenannt')) { tab.titleEl.focus(); tab.titleEl.select(); } else if (!(SN.mobile && SN.mobile.active)) tab.content.focus({ preventScroll: true }); }, 30);
  };

  Ed.close = async (tab, force, silent) => {
    if (!tab) return;
    if (tab.dirty) await Ed.save(tab);
    const i = Ed.tabs.indexOf(tab);
    Ed.tabs.splice(i, 1);
    tab.page.remove();
    if (Ed.active === tab) { Ed.active = null; if (!silent) Ed.activate(Ed.tabs[Math.min(i, Ed.tabs.length - 1)] || null); }
    renderTabs(); persistTabs();
  };
  Ed.closeAll = async () => { for (const t of [...Ed.tabs]) await Ed.close(t, true, true); Ed.activate(null); };

  function renderTabs() {
    const bar = $('#tabs-bar');
    bar.innerHTML = '';
    for (const t of Ed.tabs) {
      const meta = SN.notes.get(t.path);
      const el = h('div.tab' + (t === Ed.active ? '.on' : '') + (t.dirty ? '.dirty' : ''), { title: t.path, draggable: 'true' },
        h('span.ico', { html: SN.icon(meta?.fm?.pinned ? 'pin' : 'file', 14), style: meta?.color ? { color: meta.color } : null }),
        h('span.t', SN.noteName(t.path)),
        h('span.x', { html: SN.icon('x', 12), onclick: (e) => { e.stopPropagation(); Ed.close(t); } }));
      el.addEventListener('mousedown', (e) => { if (e.button === 1) { e.preventDefault(); Ed.close(t); } });
      el.addEventListener('click', () => Ed.activate(t));
      el.addEventListener('contextmenu', (e) => SN.ctxMenu(e, [
        { label: 'Schließen', icon: 'x', onClick: () => Ed.close(t) },
        { label: 'Andere schließen', icon: 'x-circle', onClick: async () => { for (const o of Ed.tabs.filter(o => o !== t)) await Ed.close(o, true, true); Ed.activate(t); } },
        { label: 'Alle schließen', icon: 'trash', onClick: () => Ed.closeAll() },
        { sep: true },
        { label: 'Im Explorer zeigen', icon: 'folder-open', onClick: () => SN.fs.reveal(t.path) },
      ]));
      el.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/sn-note', t.path); e.dataTransfer.setData('text/sn-tab', String(Ed.tabs.indexOf(t))); });
      el.addEventListener('dragover', (e) => e.preventDefault());
      el.addEventListener('drop', (e) => { const from = Number(e.dataTransfer.getData('text/sn-tab')); if (isNaN(from) || e.dataTransfer.getData('text/sn-tab') === '') return; e.preventDefault(); const [m] = Ed.tabs.splice(from, 1); Ed.tabs.splice(Ed.tabs.indexOf(t) + (from <= Ed.tabs.indexOf(t) ? 1 : 0), 0, m); renderTabs(); persistTabs(); });
      bar.append(el);
    }
    bar.append(h('button.icon-btn.tab-add', { title: 'Neue Notiz', html: SN.icon('plus', 16), onclick: () => SN.app.newNote() }));
    const on = bar.querySelector('.tab.on'); on && on.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  const persistTabs = SN.debounce(() => SN.saveSettings({ openTabs: Ed.tabs.map(t => t.path), activeTab: Ed.active?.path || null }), 400);
  Ed.restoreTabs = async () => {
    const { openTabs = [], activeTab } = SN.settings;
    for (const p of openTabs) if (SN.notes.get(p)) { const t = await createTab(p); if (t) Ed.tabs.push(t); }
    const act = Ed.tabs.find(t => t.path === activeTab) || Ed.tabs[0] || null;
    Ed.activate(act, false);
  };

  // ======================================================================
  //  Konvertierung Editor <-> Datei
  // ======================================================================
  const WIKI = /\[\[([^\]|#\n]+)(#[^\]|\n]*)?(?:\|([^\]\n]+))?\]\]/g;
  function toEditorHtml(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    tpl.content.querySelectorAll('img').forEach(img => {
      let rel = img.dataset.src || img.getAttribute('src') || '';
      if (rel && !/^(https?:|data:|blob:)/.test(rel)) { img.dataset.src = rel; img.src = SN.fs.url(rel); }
    });
    const walker = document.createTreeWalker(tpl.content, NodeFilter.SHOW_TEXT);
    const nodes = []; let n;
    while ((n = walker.nextNode())) if (n.data.includes('[[') && !n.parentElement?.closest('pre,code')) nodes.push(n);
    for (const t of nodes) {
      const frag = document.createDocumentFragment(); let last = 0; let m; WIKI.lastIndex = 0;
      while ((m = WIKI.exec(t.data))) {
        frag.append(t.data.slice(last, m.index));
        frag.append(makeLink(m[1].trim() + (m[2] || ''), m[3]));
        last = m.index + m[0].length;
      }
      frag.append(t.data.slice(last));
      t.replaceWith(frag);
    }
    return tpl.innerHTML;
  }
  function makeLink(target, alias) {
    const s = document.createElement('span');
    s.className = 'wikilink'; s.contentEditable = 'false'; s.dataset.target = target; s.textContent = alias || target.replace(/#.*/, '');
    return s;
  }
  const INERT = document.implementation.createHTMLDocument('');
  function fromEditorHtml(content) {
    const c = INERT.importNode(content, true); // inert: Bilder werden hier nicht geladen
    c.querySelectorAll('.wikilink').forEach(s => {
      const t = s.dataset.target, a = s.textContent;
      s.replaceWith(document.createTextNode(`[[${t}${a && a !== t.replace(/#.*/, '') ? '|' + a : ''}]]`));
    });
    c.querySelectorAll('img').forEach(img => { if (img.dataset.src) { img.setAttribute('src', img.dataset.src); img.removeAttribute('data-src'); } img.classList.remove('sel'); if (!img.className) img.removeAttribute('class'); });
    c.querySelectorAll('[contenteditable]').forEach(e => e.removeAttribute('contenteditable'));
    c.querySelectorAll('font[size="7"]').forEach(f => f.removeAttribute('size'));
    return c.innerHTML.replace(/​/g, '');
  }
  Ed.fromEditorHtml = fromEditorHtml;
  Ed.toEditorHtml = toEditorHtml;
  function markBroken(tab) { tab.content.querySelectorAll('.wikilink').forEach(s => s.classList.toggle('broken', !SN.notes.resolve(s.dataset.target.replace(/#.*/, '')))); }

  // ======================================================================
  //  Speichern & Zeitreise
  // ======================================================================
  function markDirty(tab) {
    if (!tab.dirty) { tab.dirty = true; renderTabs(); }
    setSaveState('saving');
    clearTimeout(tab.saveTimer);
    tab.saveTimer = setTimeout(() => Ed.save(tab), 800);
  }
  Ed.save = async (tab = Ed.active, { snapshot = false, toast = false } = {}) => {
    if (!tab) return;
    clearTimeout(tab.saveTimer);
    const html = fromEditorHtml(tab.content);
    if (!tab.fm.id) tab.fm.id = SN.uid();
    if (!tab.fm.created) tab.fm.created = new Date().toISOString();
    const text = SN.notes.serialize(tab.fm, html);
    if (text !== tab.lastText) {
      try { await SN.fs.write(tab.path, text); } catch (e) { SN.toast('Speichern fehlgeschlagen: ' + e.message, 'err'); setSaveState('error'); return; }
      tab.lastSaved = html; tab.lastText = text;
      const meta = SN.notes.update(tab.path, text);
      const delta = meta.words - tab.words;
      if (delta > 0) SN.stats.bump('words', delta);
      tab.words = meta.words;
      if (snapshot || Date.now() - tab.lastSnap > 10 * 60 * 1000) await snapshotTab(tab, text);
    } else if (snapshot) await snapshotTab(tab, text);
    tab.dirty = false;
    renderTabs(); setSaveState('saved'); Ed.renderStatus();
    if (toast) SN.toast('Gespeichert ✦', 'ok', 1400);
  };
  Ed.saveAll = async () => { for (const t of Ed.tabs) if (t.dirty) await Ed.save(t); };
  async function snapshotTab(tab, text) {
    tab.lastSnap = Date.now();
    const dir = `.spirit/history/${tab.fm.id}`;
    try {
      await SN.fs.write(`${dir}/${Date.now()}.md`, text);
      const list = await SN.fs.listDir(dir);
      if (list.length > 60) for (const old of list.slice(0, list.length - 60)) await SN.fs.del(`${dir}/${old}`);
    } catch (e) { console.warn('Snapshot', e); }
  }
  Ed.history = async (tab = Ed.active) => {
    if (!tab) return;
    await Ed.save(tab, { snapshot: true });
    const dir = `.spirit/history/${tab.fm.id}`;
    const list = (await SN.fs.listDir(dir)).filter(n => n.endsWith('.md')).sort().reverse();
    const listEl = h('div.hist-list');
    const prev = h('div.hist-preview.ed-content');
    let chosen = null;
    const show = async (name, el) => {
      chosen = name;
      listEl.querySelectorAll('.hist-item').forEach(x => x.classList.toggle('on', x === el));
      const txt = await SN.fs.read(`${dir}/${name}`);
      const { body } = SN.notes.parse(txt);
      prev.innerHTML = toEditorHtml(SN.notes.bodyToHtml(body));
      prev.querySelectorAll('.wikilink').forEach(s => s.removeAttribute('contenteditable'));
    };
    for (const [i, name] of list.entries()) {
      const ts = Number(name.replace('.md', ''));
      const el = h('div.hist-item', { onclick: () => show(name, el) }, h('b', i === 0 ? 'Aktuelle Version' : SN.fmtDate(ts, true)), h('small', SN.fmtRel(ts)));
      listEl.append(el);
    }
    if (!list.length) listEl.append(h('div.empty-hint', 'Noch keine Versionen.'));
    const body = h('div.hist-wrap', listEl, prev);
    SN.modal({
      title: SN.icon('history', 20) + ' Zeitreise <span class="jp">時間旅行</span>', sub: 'Spring zu einer früheren Version dieser Notiz zurück. Versionen werden automatisch alle 10 Minuten und bei Strg+S gespeichert.',
      body, width: 980, cls: 'hist-modal',
      buttons: [{ label: 'Schließen', value: null }, { label: 'Diese Version wiederherstellen', primary: true, icon: 'reset', onClick: async (close) => {
        if (!chosen) return SN.toast('Wähle zuerst eine Version', 'warn');
        const txt = await SN.fs.read(`${dir}/${chosen}`);
        const { body } = SN.notes.parse(txt);
        tab.content.focus();
        document.execCommand('selectAll'); document.execCommand('insertHTML', false, toEditorHtml(SN.notes.bodyToHtml(body)));
        markDirty(tab); await Ed.save(tab, { snapshot: true });
        close(); SN.toast('Version wiederhergestellt – die Zeit wurde zurückgedreht ⟲', 'ok');
      } }],
    });
    const first = listEl.querySelector('.hist-item'); if (first) first.click();
  };

  // ======================================================================
  //  Eigenschaften (Tags, Datum, Titelbild)
  // ======================================================================
  function renderProps(tab) {
    const p = tab.props; p.innerHTML = '';
    const meta = SN.notes.get(tab.path);
    const created = tab.fm.created ? SN.fmtDate(tab.fm.created) : '–';
    p.append(h('span.prop', SN.ico('calendar', 13), created), h('span.sep', '·'));
    p.append(h('span.prop', SN.ico('folder', 13), SN.dirname(tab.path) || 'Vault'), h('span.sep', '·'));
    const tags = Array.isArray(tab.fm.tags) ? tab.fm.tags : [];
    tags.forEach(t => p.append(h('span.chip.tag', { onclick: () => SN.app.searchTag(t) }, t, h('span.x', { html: '×', onclick: (e) => { e.stopPropagation(); tab.fm.tags = tags.filter(x => x !== t); renderProps(tab); markDirty(tab); } }))));
    const add = h('input.tag-add', { placeholder: '+ Tag hinzufügen', spellcheck: 'false' });
    add.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const v = add.value.trim().replace(/^#/, '').toLowerCase().replace(/\s+/g, '-');
        if (v && !tags.includes(v)) { tab.fm.tags = [...tags, v]; renderProps(tab); markDirty(tab); setTimeout(() => tab.props.querySelector('.tag-add').focus(), 0); }
      }
    });
    p.append(add);
    if (meta && meta.tags.some(t => !tags.includes(t))) p.append(h('span.faint', { style: { fontSize: '11px' } }, 'im Text: ' + meta.tags.filter(t => !tags.includes(t)).map(t => '#' + t).join(' ')));
  }
  function renderCover(tab) {
    if (tab.fm.cover) { tab.cover.classList.remove('hidden'); tab.cover.style.backgroundImage = `url("${SN.fs.url(tab.fm.cover)}")`; }
    else tab.cover.classList.add('hidden');
  }

  // ======================================================================
  //  Ereignisse pro Tab
  // ======================================================================
  function wireTab(tab) {
    const c = tab.content;
    tab.titleEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); placeCaretStart(c); } });
    tab.titleEl.addEventListener('change', () => renameFromTitle(tab));
    tab.titleEl.addEventListener('blur', () => renameFromTitle(tab));

    c.addEventListener('input', (e) => { markDirty(tab); onInput(tab, e); if (SN.settings.typewriter) typewriter(tab); });
    c.addEventListener('keydown', (e) => onKey(tab, e));
    c.addEventListener('paste', (e) => onPaste(tab, e));
    c.addEventListener('drop', (e) => onDrop(tab, e));
    c.addEventListener('dragover', (e) => { if (e.dataTransfer.types.includes('Files') || e.dataTransfer.types.includes('text/sn-note')) e.preventDefault(); });
    c.addEventListener('mousedown', (e) => {
      const li = e.target.closest('ul.checklist > li');
      if (li && e.target === li && e.clientX - li.getBoundingClientRect().left < 26) {
        e.preventDefault();
        const on = li.dataset.checked !== 'true';
        li.dataset.checked = on ? 'true' : 'false';
        if (on) { SN.sound('done'); SN.stats.bump('tasks', 1); }
        markDirty(tab);
      }
    });
    c.addEventListener('click', (e) => {
      const wl = e.target.closest('.wikilink');
      if (wl) { e.preventDefault(); hidePreview(); openLink(wl.dataset.target, e.ctrlKey || e.metaKey || e.button === 1); return; }
      const a = e.target.closest('a[href]');
      if (a && (e.ctrlKey || e.metaKey)) { e.preventDefault(); SN.app.openExternal(a.href); return; }
      const img = e.target.closest('img');
      c.querySelectorAll('img.sel').forEach(i => i !== img && i.classList.remove('sel'));
      if (img) { img.classList.add('sel'); imageTools(tab, img); } else hideFloat('img');
    });
    c.addEventListener('dblclick', (e) => { const img = e.target.closest('img'); if (img) SN.app.lightbox(img.src); });
    let hoverT;
    c.addEventListener('mouseover', (e) => {
      const wl = e.target.closest('.wikilink');
      clearTimeout(hoverT);
      if (wl) hoverT = setTimeout(() => showPreview(wl), 380); else hidePreview();
    });
    c.addEventListener('mouseleave', () => { clearTimeout(hoverT); hidePreview(); });
    tab.page.addEventListener('scroll', () => { hideFloat(); closeEdPop(); hidePreview(); }, { passive: true });
  }

  async function renameFromTitle(tab) {
    const want = SN.slug(tab.titleEl.value);
    if (!want) { tab.titleEl.value = SN.noteName(tab.path); return; }
    if (want === SN.noteName(tab.path)) return;
    const dir = SN.dirname(tab.path);
    const np = (dir ? dir + '/' : '') + want + '.md';
    if (await SN.fs.exists(np) && np.toLowerCase() !== tab.path.toLowerCase()) { SN.toast('Eine Notiz mit diesem Namen gibt es schon', 'warn'); tab.titleEl.value = SN.noteName(tab.path); return; }
    if (tab.dirty) await Ed.save(tab);
    await SN.notes.rename(tab.path, np);
  }

  async function openLink(target, newTab) {
    const name = target.replace(/#.*/, '');
    let p = SN.notes.resolve(name);
    if (!p) {
      p = await SN.notes.create({ name });
      SN.toast(`Neue Notiz „${name}“ erstellt`, 'ok');
    }
    const head = target.includes('#') ? target.split('#')[1] : null;
    Ed.open(p, { newTab: newTab || true, line: head });
  }
  Ed.openLink = openLink;

  function scrollToHeading(tab, text) {
    const hd = Array.from(tab.content.querySelectorAll('h1,h2,h3,h4')).find(x => x.textContent.trim().toLowerCase() === String(text).toLowerCase());
    if (hd) { hd.scrollIntoView({ behavior: 'smooth', block: 'start' }); hd.animate([{ background: 'var(--sel)' }, { background: 'transparent' }], 1400); }
  }
  Ed.scrollToHeading = (t) => Ed.active && scrollToHeading(Ed.active, t);

  // ---------- Caret-Helfer ----------
  function caret() {
    const sel = getSelection(); if (!sel.rangeCount) return null;
    const r = sel.getRangeAt(0); if (!r.collapsed) return null;
    let node = r.startContainer, off = r.startOffset;
    if (node.nodeType !== 3) { const ch = node.childNodes[off - 1]; if (ch && ch.nodeType === 3) { node = ch; off = ch.data.length; } else return { node: null, before: '', range: r }; }
    return { node, off, before: node.data.slice(0, off), range: r };
  }
  function caretRect() {
    const sel = getSelection(); if (!sel.rangeCount) return null;
    const r = sel.getRangeAt(0).cloneRange(); r.collapse(true);
    let rect = r.getClientRects()[0];
    if (!rect || (!rect.width && !rect.height && !rect.left)) { const el = r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentElement; rect = el.getBoundingClientRect(); }
    return rect;
  }
  function selectBack(node, off, len) { const r = document.createRange(); r.setStart(node, off - len); r.setEnd(node, off); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  function placeCaretStart(el) { el.focus(); const r = document.createRange(); r.setStart(el, 0); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  function currentBlock(root) {
    let n = getSelection().anchorNode;
    while (n && n !== root) { if (n.nodeType === 1 && /^(P|H[1-6]|LI|BLOCKQUOTE|PRE|DIV|TD|TH|SUMMARY)$/.test(n.tagName)) return n; n = n.parentNode; }
    return null;
  }
  function textBeforeCaretInBlock(block) {
    const sel = getSelection(); if (!sel.rangeCount || !block) return '';
    const r = document.createRange(); r.setStart(block, 0); r.setEnd(sel.anchorNode, sel.anchorOffset);
    return r.toString();
  }

  // ======================================================================
  //  Eingabe: Markdown-Kürzel, [[ Autovervollständigung, / Befehle
  // ======================================================================
  function onInput(tab, e) {
    const cr = caret();
    if (!cr || !cr.node) { closeEdPop(); return; }
    // [[Name]] direkt getippt -> Link
    const full = cr.before.match(/\[\[([^\]\n]+)\]\]$/);
    if (full) { selectBack(cr.node, cr.off, full[0].length); insertLink(full[1].split('|')[0].trim(), full[1].split('|')[1]); closeEdPop(); return; }
    const wl = cr.before.match(/\[\[([^\]\n]*)$/);
    if (wl) return linkPopup(tab, cr, wl[1]);
    const sl = cr.before.match(/(?:^|\s)\/([\p{L}\d]{0,20})$/u);
    if (sl && !cr.node.parentElement.closest('pre,code')) return slashPopup(tab, cr, sl[1]);
    closeEdPop();
  }

  function onKey(tab, e) {
    // Popups navigieren
    if (pop && pop.el) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); pop.move(e.key === 'ArrowDown' ? 1 : -1); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pop.choose(); return; }
      if (e.key === 'Escape') { e.preventDefault(); closeEdPop(); return; }
    }
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); cmd.link(); return; }
    if (mod && e.shiftKey && e.key.toLowerCase() === 'x') { e.preventDefault(); exec('strikeThrough'); return; }
    if (mod && e.shiftKey && e.key.toLowerCase() === 'h') { e.preventDefault(); exec('hiliteColor', 'rgba(212,175,55,.45)'); return; }
    if (mod && e.shiftKey && e.key.toLowerCase() === 'c') { e.preventDefault(); cmd.checklist(); return; }
    if (mod && e.altKey && /^[1-4]$/.test(e.key)) { e.preventDefault(); formatBlock('H' + e.key); return; }
    if (mod && e.altKey && e.key === '0') { e.preventDefault(); formatBlock('P'); return; }
    if (mod && e.key === 'Enter') { const li = getSelection().anchorNode?.parentElement?.closest('ul.checklist > li'); if (li) { e.preventDefault(); li.dataset.checked = li.dataset.checked === 'true' ? 'false' : 'true'; if (li.dataset.checked === 'true') SN.sound('done'); markDirty(tab); } return; }

    const block = currentBlock(tab.content);
    // Leertaste in <summary> nicht als Klick werten
    if (e.key === ' ' && block && block.tagName === 'SUMMARY') { e.preventDefault(); document.execCommand('insertText', false, ' '); return; }
    // Markdown-Kürzel
    if (e.key === ' ' && block && !block.closest('pre')) {
      const pre = textBeforeCaretInBlock(block);
      const map = { '#': 'H1', '##': 'H2', '###': 'H3', '####': 'H4', '>': 'BLOCKQUOTE', '```': 'PRE' };
      const done = (fn) => { e.preventDefault(); const cr = caret(); if (cr && cr.node) { selectBack(cr.node, cr.off, pre.length); document.execCommand('delete'); } fn(); markDirty(tab); };
      if (map[pre] && block.tagName !== 'LI') return done(() => formatBlock(map[pre]));
      if (/^[-*+]$/.test(pre) && block.tagName !== 'LI') return done(() => cmd.list('ul'));
      if (/^1[.)]$/.test(pre) && block.tagName !== 'LI') return done(() => cmd.list('ol'));
      if (/^\[ ?\]$/.test(pre)) return done(() => cmd.checklist(true));
      if (/^\[x\]$/i.test(pre)) return done(() => { const li = cmd.checklist(true); if (li) li.dataset.checked = 'true'; });
    }
    if (e.key === 'Enter' && !e.shiftKey && block) {
      const pre = textBeforeCaretInBlock(block);
      if (pre === '---' && block.textContent === '---') { e.preventDefault(); const cr = caret(); selectBack(cr.node, cr.off, 3); document.execCommand('delete'); cmd.hr(); return; }
      // Neue Checklisten-Zeile immer unerledigt
      if (block.tagName === 'LI' && block.parentElement.classList.contains('checklist')) setTimeout(() => { const li = getSelection().anchorNode && (getSelection().anchorNode.nodeType === 1 ? getSelection().anchorNode : getSelection().anchorNode.parentElement).closest('li'); if (li && li !== block && li.parentElement.classList.contains('checklist')) li.dataset.checked = 'false'; }, 0);
      // Enter am Ende eines Codeblocks zweimal -> raus
      if (block.tagName === 'PRE' && /\n\n$/.test(block.textContent) && pre.length === block.textContent.length) { e.preventDefault(); block.textContent = block.textContent.replace(/\n+$/, ''); const p = h('p', h('br')); block.after(p); placeCaretStart(p); markDirty(tab); return; }
    }
    if (e.key === 'Tab') {
      const cell = getSelection().anchorNode?.parentElement?.closest('td,th') || (getSelection().anchorNode?.nodeType === 1 && getSelection().anchorNode.closest('td,th'));
      if (cell) { e.preventDefault(); moveCell(cell, e.shiftKey ? -1 : 1); return; }
      if (block && block.tagName === 'LI') { e.preventDefault(); exec(e.shiftKey ? 'outdent' : 'indent'); return; }
      e.preventDefault(); document.execCommand('insertText', false, ' '); return;
    }
    if (e.key === 'Escape') { tab.content.querySelectorAll('img.sel').forEach(i => i.classList.remove('sel')); hideFloat(); }
  }

  // ---------- Popup-Infrastruktur ----------
  let pop = null;
  function closeEdPop() { if (pop && pop.el) pop.el.remove(); pop = null; }
  Ed.closePop = closeEdPop;
  function openEdPop(items, onChoose, rect, header) {
    closeEdPop();
    if (!items.length) return;
    const el = h('div.ed-pop');
    let idx = 0;
    const render = () => {
      el.innerHTML = '';
      if (header) el.append(h('div.ph', header));
      items.forEach((it, i) => {
        if (it.group) { el.append(h('div.ph', it.group)); return; }
        const row = h('div.pi' + (i === idx ? '.on' : ''), { html: `${SN.icon(it.icon || 'dot', 16)}<div>${SN.esc(it.label)}${it.sub ? `<small>${SN.esc(it.sub)}</small>` : ''}</div>` });
        row.addEventListener('mousedown', (e) => { e.preventDefault(); idx = i; onChoose(items[i]); closeEdPop(); });
        row.addEventListener('mouseenter', () => { idx = i; el.querySelectorAll('.pi').forEach(x => x.classList.remove('on')); row.classList.add('on'); });
        el.append(row);
      });
      const on = el.querySelector('.pi.on'); on && on.scrollIntoView({ block: 'nearest' });
    };
    const sel = (d) => { do { idx = (idx + d + items.length) % items.length; } while (items[idx].group); render(); };
    if (items[0].group) idx = 1;
    render();
    $('#pop-root').append(el);
    const r = rect || { left: innerWidth / 2, bottom: innerHeight / 2, top: innerHeight / 2 };
    const er = el.getBoundingClientRect();
    el.style.left = Math.min(r.left, innerWidth - er.width - 12) + 'px';
    el.style.top = (r.bottom + er.height + 10 > innerHeight ? r.top - er.height - 6 : r.bottom + 6) + 'px';
    pop = { el, move: sel, choose: () => { onChoose(items[idx]); closeEdPop(); } };
  }

  // ---------- [[ Link-Autovervollständigung ----------
  function linkPopup(tab, cr, q) {
    const ql = q.toLowerCase().trim();
    let notes = SN.notes.all().filter(n => n.path !== tab.path);
    if (ql) notes = notes.map(n => ({ n, s: score(n.name.toLowerCase(), ql) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s).map(x => x.n);
    else notes.sort((a, b) => (b.updated || '').localeCompare(a.updated || ''));
    const items = notes.slice(0, 9).map(n => ({ label: n.name, sub: n.folder || 'Vault', icon: 'file', target: n.name }));
    if (ql && !notes.some(n => n.name.toLowerCase() === ql)) items.push({ label: `Neue Notiz „${q.trim()}“`, icon: 'file-plus', target: q.trim(), create: true });
    openEdPop(items, (it) => {
      const c2 = caret(); if (!c2 || !c2.node) return;
      const m = c2.before.match(/\[\[([^\]\n]*)$/); if (!m) return;
      selectBack(c2.node, c2.off, m[0].length);
      insertLink(it.target);
      if (it.create) SN.notes.create({ name: it.target }).then(() => markBroken(tab));
    }, caretRect(), 'Mit Notiz verlinken');
  }
  function score(name, q) { if (name === q) return 100; if (name.startsWith(q)) return 80; if (name.includes(q)) return 60 - name.indexOf(q); let i = 0; for (const ch of name) if (ch === q[i]) i++; return i === q.length ? 20 : 0; }
  Ed.score = score;
  function insertLink(target, alias) {
    const span = makeLink(target, alias);
    span.classList.toggle('broken', !SN.notes.resolve(target));
    const sel = getSelection(); if (!sel.rangeCount) return;
    const r = sel.getRangeAt(0);
    r.deleteContents();
    const space = document.createTextNode('\u00a0');
    r.insertNode(space); r.insertNode(span);
    const nr = document.createRange(); nr.setStart(space, 1); nr.collapse(true);
    sel.removeAllRanges(); sel.addRange(nr);
    Ed.active && markDirty(Ed.active);
  }

  // ---------- / Befehle ----------
  const SLASH = [
    { group: 'Text' },
    { id: 'p', label: 'Text', sub: 'Normaler Absatz', icon: 'text', kw: 'text absatz paragraph', run: () => formatBlock('P') },
    { id: 'h1', label: 'Überschrift 1', sub: 'Große Überschrift', icon: 'heading', kw: 'h1 titel überschrift heading', run: () => formatBlock('H1') },
    { id: 'h2', label: 'Überschrift 2', sub: 'Mittlere Überschrift', icon: 'heading', kw: 'h2 überschrift heading', run: () => formatBlock('H2') },
    { id: 'h3', label: 'Überschrift 3', sub: 'Kleine Überschrift', icon: 'heading', kw: 'h3 überschrift heading', run: () => formatBlock('H3') },
    { id: 'quote', label: 'Zitat', icon: 'quote', kw: 'zitat quote', run: () => formatBlock('BLOCKQUOTE') },
    { id: 'code', label: 'Code-Block', icon: 'code', kw: 'code programm', run: () => formatBlock('PRE') },
    { group: 'Listen' },
    { id: 'ul', label: 'Aufzählung', icon: 'list', kw: 'liste aufzählung bullet', run: () => cmd.list('ul') },
    { id: 'ol', label: 'Nummerierte Liste', icon: 'list-ol', kw: 'nummer liste ordered', run: () => cmd.list('ol') },
    { id: 'todo', label: 'Checkliste', sub: 'Aufgaben zum Abhaken', icon: 'list-check', kw: 'check todo aufgabe checkliste', run: () => cmd.checklist(true) },
    { group: 'Einfügen' },
    { id: 'img', label: 'Bild', sub: 'Vom PC einfügen', icon: 'image', kw: 'bild image foto', run: () => cmd.image() },
    { id: 'table', label: 'Tabelle', icon: 'table', kw: 'tabelle table', run: () => cmd.table() },
    { id: 'hr', label: 'Trennlinie', icon: 'hr', kw: 'trenner linie divider', run: () => cmd.hr() },
    { id: 'link', label: 'Link zu Notiz', sub: '[[ ]]', icon: 'wikilink', kw: 'link notiz verbinden wiki', run: () => document.execCommand('insertText', false, '[[') },
    { id: 'date', label: 'Datum heute', icon: 'calendar', kw: 'datum heute date', run: () => document.execCommand('insertText', false, SN.fmtDate(new Date())) },
    { id: 'time', label: 'Uhrzeit', icon: 'clock', kw: 'zeit uhr time', run: () => document.execCommand('insertText', false, SN.fmtTime(new Date())) },
    { id: 'toc', label: 'Inhaltsverzeichnis', icon: 'list', kw: 'inhalt verzeichnis toc', run: () => cmd.toc() },
    { group: 'Boxen' },
    { id: 'info', label: 'Info-Box', icon: 'info', kw: 'info box callout', run: () => cmd.callout('info') },
    { id: 'tip', label: 'Tipp-Box', icon: 'lightbulb', kw: 'tipp box idee', run: () => cmd.callout('tip') },
    { id: 'warn', label: 'Warnung', icon: 'alert', kw: 'warnung achtung', run: () => cmd.callout('warn') },
    { id: 'spirit', label: 'Spirit-Box', sub: 'Im Theme-Look', icon: 'sparkles', kw: 'spirit box magie', run: () => cmd.callout('spirit') },
    { id: 'qbox', label: 'Zitat-Box', icon: 'quote', kw: 'zitat box', run: () => cmd.callout('quote') },
    { id: 'spoiler', label: 'Spoiler', sub: 'Aufklappbar versteckt', icon: 'spoiler', kw: 'spoiler versteckt details', run: () => cmd.spoiler() },
  ];
  function slashPopup(tab, cr, q) {
    const ql = q.toLowerCase();
    let items = ql ? SLASH.filter(s => !s.group && (s.label.toLowerCase().includes(ql) || s.kw.includes(ql))) : SLASH;
    if (!items.length) return closeEdPop();
    openEdPop(items, (it) => {
      const c2 = caret(); if (!c2 || !c2.node) return;
      const m = c2.before.match(/\/([\p{L}\d]{0,20})$/u); if (!m) return;
      selectBack(c2.node, c2.off, m[0].length);
      document.execCommand('delete');
      it.run(); markDirty(tab);
    }, caretRect());
  }

  // ======================================================================
  //  Befehle
  // ======================================================================
  function exec(c, v = null) { document.execCommand('styleWithCSS', false, c === 'hiliteColor' || c === 'foreColor' || c === 'fontName'); document.execCommand(c, false, v); Ed.active && markDirty(Ed.active); updateToolbarState(); }
  function formatBlock(tag) {
    const b = Ed.active && currentBlock(Ed.active.content);
    if (b && b.tagName === tag && tag !== 'P') tag = 'P';
    document.execCommand('formatBlock', false, tag);
    Ed.active && markDirty(Ed.active); updateToolbarState();
  }
  function setFontSize(px) {
    document.execCommand('styleWithCSS', false, true);
    document.execCommand('fontSize', false, '7');
    const c = Ed.active.content;
    c.querySelectorAll('[style*="xxx-large"]').forEach(e => e.style.fontSize = px + 'px');
    c.querySelectorAll('font[size="7"]').forEach(f => { const s = h('span', { style: { fontSize: px + 'px' } }); s.append(...f.childNodes); f.replaceWith(s); });
    markDirty(Ed.active);
  }
  const cmd = {
    checklist(force) {
      const b = Ed.active && currentBlock(Ed.active.content);
      const ul = b && b.closest('ul');
      if (ul && Ed.active.content.contains(ul)) {
        if (force && ul.classList.contains('checklist')) return b.closest('li');
        ul.classList.toggle('checklist'); ul.querySelectorAll(':scope > li').forEach(li => { if (ul.classList.contains('checklist')) li.dataset.checked = li.dataset.checked || 'false'; else delete li.dataset.checked; }); markDirty(Ed.active); return b.closest('li');
      }
      return cmd.list('check');
    },
    list(type) {
      const tab = Ed.active; if (!tab) return null;
      const sel = getSelection();
      const b = currentBlock(tab.content);
      // Mehrere Absätze markiert oder schon in einer Liste -> Browser-Befehl
      if (!b || !sel.isCollapsed || b.tagName === 'LI' || b.tagName === 'TD' || b.tagName === 'TH' || b.tagName === 'SUMMARY' || b.classList.contains('callout') || b.classList.contains('callout-title')) {
        document.execCommand(type === 'ol' ? 'insertOrderedList' : 'insertUnorderedList');
        if (type === 'check') { const n = getSelection().anchorNode; const l = (n?.nodeType === 1 ? n : n?.parentElement)?.closest('ul'); if (l) { l.classList.add('checklist'); l.querySelectorAll(':scope > li').forEach(li => li.dataset.checked = li.dataset.checked || 'false'); } }
        markDirty(tab); updateToolbarState(); return null;
      }
      const list = document.createElement(type === 'ol' ? 'ol' : 'ul');
      if (type === 'check') list.className = 'checklist';
      const li = document.createElement('li');
      if (type === 'check') li.dataset.checked = 'false';
      while (b.firstChild) li.appendChild(b.firstChild);
      if (!li.textContent.trim() && !li.querySelector('img')) { li.innerHTML = ''; li.appendChild(document.createElement('br')); }
      list.appendChild(li);
      b.replaceWith(list);
      const r = document.createRange();
      if (li.firstChild && li.firstChild.nodeName === 'BR') r.setStart(li, 0); else { r.selectNodeContents(li); r.collapse(false); }
      sel.removeAllRanges(); sel.addRange(r);
      markDirty(tab); updateToolbarState();
      return li;
    },
    async image() {
      const tab = Ed.active; if (!tab) return;
      const sel = getSelection(); const saved = sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
      const files = await SN.pickFiles('image/*', true);
      if (!files.length) return;
      tab.content.focus();
      if (saved) { sel.removeAllRanges(); sel.addRange(saved); }
      for (const f of files) await insertImageFile(tab, f);
    },
    table(rows = 3, cols = 3) {
      const id = 't' + SN.uid();
      const head = '<tr>' + Array.from({ length: cols }, (_, i) => `<th${i === 0 ? ` id="${id}"` : ''}>Spalte ${i + 1}</th>`).join('') + '</tr>';
      const body = Array.from({ length: rows - 1 }, () => '<tr>' + '<td><br></td>'.repeat(cols) + '</tr>').join('');
      document.execCommand('insertHTML', false, `<table><tbody>${head}${body}</tbody></table><p><br></p>`);
      selectNode(id);
      markDirty(Ed.active);
    },
    hr() { document.execCommand('insertHTML', false, '<hr><p><br></p>'); markDirty(Ed.active); },
    callout(type) {
      const titles = { info: 'Info', tip: 'Tipp', warn: 'Achtung', spirit: 'Spirit', quote: 'Zitat', danger: 'Gefahr', mood: 'Stimmung' };
      const id = 'c' + SN.uid();
      document.execCommand('insertHTML', false, `<div class="callout" data-type="${type}"><div class="callout-title">${titles[type] || 'Info'}</div><p id="${id}">Text …</p></div><p><br></p>`);
      selectNode(id); markDirty(Ed.active);
    },
    spoiler() {
      const id = 's' + SN.uid();
      document.execCommand('insertHTML', false, `<details open><summary>Spoiler – klick zum Aufklappen</summary><p id="${id}">Geheimer Text …</p></details><p><br></p>`);
      selectNode(id); markDirty(Ed.active);
    },
    async link() {
      const sel = getSelection(); const saved = sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
      const existing = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement).closest('a');
      const url = await SN.prompt('Link einfügen', existing ? existing.getAttribute('href') : 'https://', 'https://…', 'Leer lassen, um einen Link zu entfernen.');
      if (url === null) return;
      Ed.active.content.focus(); if (saved) { sel.removeAllRanges(); sel.addRange(saved); }
      if (!url) { exec('unlink'); return; }
      if (sel.isCollapsed) document.execCommand('insertHTML', false, `<a href="${SN.esc(url)}">${SN.esc(url)}</a>&nbsp;`);
      else exec('createLink', url);
      markDirty(Ed.active);
    },
    toc() {
      const hs = Array.from(Ed.active.content.querySelectorAll('h1,h2,h3')).filter(x => x.textContent.trim());
      if (!hs.length) return SN.toast('Noch keine Überschriften vorhanden', 'warn');
      const name = SN.noteName(Ed.active.path);
      document.execCommand('insertHTML', false, `<div class="callout" data-type="spirit"><div class="callout-title">Inhalt</div><ul>${hs.map(x => `<li>${makeLink(name + '#' + x.textContent.trim(), x.textContent.trim()).outerHTML}</li>`).join('')}</ul></div><p><br></p>`);
      markDirty(Ed.active);
    },
    clear() { exec('removeFormat'); const b = currentBlock(Ed.active.content); if (b && /^H\d|BLOCKQUOTE|PRE$/.test(b.tagName)) formatBlock('P'); },
  };
  Ed.cmd = cmd;
  function selectNode(id) {
    const el = document.getElementById(id); if (!el) return;
    el.removeAttribute('id');
    const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  }

  // ---------- Bilder ----------
  async function insertImageFile(tab, file) {
    try {
      const rel = await SN.fs.saveImage(file, 'attachments', file.name ? file.name.replace(/\.[^.]+$/, '') : SN.noteName(tab.path));
      await SN.notes.refreshFiles();
      document.execCommand('insertHTML', false, `<img data-src="${SN.esc(rel)}" src="${SN.esc(SN.fs.url(rel))}" alt=""><p><br></p>`);
      markDirty(tab);
      SN.emit('images');
    } catch (e) { SN.toast('Bild konnte nicht gespeichert werden: ' + e.message, 'err'); }
  }
  function onPaste(tab, e) {
    const files = Array.from(e.clipboardData.files || []).filter(f => f.type.startsWith('image/'));
    if (files.length) { e.preventDefault(); files.forEach(f => insertImageFile(tab, f)); return; }
    const html = e.clipboardData.getData('text/html');
    if (html) {
      e.preventDefault();
      const tpl = document.createElement('template');
      tpl.innerHTML = SN.sanitize(html.replace(/<!--[\s\S]*?-->/g, ''), { keepClasses: false });
      tpl.content.querySelectorAll('[style]').forEach(el => { const ta = el.style.textAlign; el.removeAttribute('style'); if (ta) el.style.textAlign = ta; });
      tpl.content.querySelectorAll('font').forEach(f => f.replaceWith(...f.childNodes));
      tpl.content.querySelectorAll('span:not([class])').forEach(s => s.replaceWith(...s.childNodes));
      document.execCommand('insertHTML', false, toEditorHtml(tpl.innerHTML));
      markDirty(tab);
    }
  }
  async function onDrop(tab, e) {
    const note = e.dataTransfer.getData('text/sn-note');
    const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/'));
    const img = e.dataTransfer.getData('text/sn-image');
    if (!note && !files.length && !img) return;
    e.preventDefault();
    const r = document.caretRangeFromPoint(e.clientX, e.clientY);
    if (r) { const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    tab.content.focus();
    if (img) { document.execCommand('insertHTML', false, `<img data-src="${SN.esc(img)}" src="${SN.esc(SN.fs.url(img))}"><p><br></p>`); markDirty(tab); return; }
    if (note) { insertLink(SN.noteName(note)); markDirty(tab); return; }
    for (const f of files) await insertImageFile(tab, f);
  }

  // ---------- Schwebende Werkzeuge (Bild / Tabelle) ----------
  let floatEl = null, floatKind = null;
  function hideFloat(kind) { if (floatEl && (!kind || floatKind === kind)) { floatEl.remove(); floatEl = null; floatKind = null; } }
  function showFloat(kind, anchorRect, tools) {
    hideFloat();
    floatEl = h('div.float-tools'); floatKind = kind;
    for (const t of tools) {
      if (t === '|') { floatEl.append(h('div.tb-sep')); continue; }
      floatEl.append(h('button.tool', { title: t.title || t.label || '', html: (t.icon ? SN.icon(t.icon, 15) : '') + (t.label ? `<span>${t.label}</span>` : ''), onmousedown: (e) => { e.preventDefault(); t.run(); } }));
    }
    $('#pop-root').append(floatEl);
    const fr = floatEl.getBoundingClientRect();
    floatEl.style.left = SN.clamp(anchorRect.left + anchorRect.width / 2 - fr.width / 2, 8, innerWidth - fr.width - 8) + 'px';
    floatEl.style.top = Math.max(50, anchorRect.top - fr.height - 8) + 'px';
  }
  function imageTools(tab, img) {
    const set = (fn) => () => { fn(); markDirty(tab); setTimeout(() => imageTools(tab, img), 30); };
    showFloat('img', img.getBoundingClientRect(), [
      { label: '25%', run: set(() => img.style.width = '25%') }, { label: '50%', run: set(() => img.style.width = '50%') },
      { label: '75%', run: set(() => img.style.width = '75%') }, { label: '100%', run: set(() => img.style.width = '100%') }, '|',
      { icon: 'align-l', title: 'Links (Text fließt herum)', run: set(() => { img.style.float = 'left'; if (!img.style.width || img.style.width === '100%') img.style.width = '40%'; }) },
      { icon: 'align-c', title: 'Zentriert', run: set(() => { img.style.float = ''; }) },
      { icon: 'align-r', title: 'Rechts (Text fließt herum)', run: set(() => { img.style.float = 'right'; if (!img.style.width || img.style.width === '100%') img.style.width = '40%'; }) }, '|',
      { icon: 'layers', title: 'Als Titelbild der Notiz', run: () => { tab.fm.cover = img.dataset.src || img.src; renderCover(tab); markDirty(tab); SN.toast('Titelbild gesetzt', 'ok'); } },
      { icon: 'eye', title: 'Groß ansehen', run: () => SN.app.lightbox(img.src) },
      { icon: 'trash', title: 'Bild entfernen', run: () => { img.remove(); hideFloat(); markDirty(tab); } },
    ]);
  }
  function maybeTableTools() {
    const tab = Ed.active; if (!tab) return;
    const n = getSelection().anchorNode;
    const cell = n && (n.nodeType === 1 ? n : n.parentElement)?.closest('td,th');
    if (!cell || !tab.content.contains(cell)) { hideFloat('table'); return; }
    const table = cell.closest('table'), row = cell.parentElement;
    const ci = Array.from(row.children).indexOf(cell);
    const t = (fn) => () => { fn(); markDirty(tab); setTimeout(maybeTableTools, 20); };
    showFloat('table', table.getBoundingClientRect(), [
      { icon: 'plus', label: 'Zeile', title: 'Zeile darunter', run: t(() => { const r = row.cloneNode(true); r.querySelectorAll('td,th').forEach(c => { const td = h('td', h('br')); c.replaceWith(td); }); row.after(r); }) },
      { icon: 'plus', label: 'Spalte', title: 'Spalte rechts', run: t(() => table.querySelectorAll('tr').forEach(r => { const ref = r.children[ci]; const nc = h(ref && ref.tagName === 'TH' ? 'th' : 'td', h('br')); ref ? ref.after(nc) : r.append(nc); })) },
      { icon: 'minus', label: 'Zeile', title: 'Zeile löschen', run: t(() => { if (table.querySelectorAll('tr').length > 1) row.remove(); }) },
      { icon: 'minus', label: 'Spalte', title: 'Spalte löschen', run: t(() => { if (row.children.length > 1) table.querySelectorAll('tr').forEach(r => r.children[ci] && r.children[ci].remove()); }) }, '|',
      { icon: 'heading', title: 'Kopfzeile an/aus', run: t(() => { const first = table.querySelector('tr'); Array.from(first.children).forEach(c => { const n = h(c.tagName === 'TH' ? 'td' : 'th'); n.append(...c.childNodes); c.replaceWith(n); }); }) },
      { icon: 'trash', title: 'Tabelle löschen', run: () => { table.remove(); hideFloat(); markDirty(tab); } },
    ]);
  }
  function moveCell(cell, d) {
    const cells = Array.from(cell.closest('table').querySelectorAll('td,th'));
    let i = cells.indexOf(cell) + d;
    if (i >= cells.length) { const row = cell.parentElement; const r = row.cloneNode(true); r.querySelectorAll('td,th').forEach(c => c.replaceWith(h('td', h('br')))); row.after(r); i = cells.length; markDirty(Ed.active); }
    const target = Array.from(cell.closest('table').querySelectorAll('td,th'))[Math.max(0, i)];
    if (target) { const r = document.createRange(); r.selectNodeContents(target); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  }

  // ---------- Link-Vorschau beim Drüberfahren ----------
  let prevEl = null;
  async function showPreview(wl) {
    hidePreview();
    const p = SN.notes.resolve(wl.dataset.target.replace(/#.*/, ''));
    const r = wl.getBoundingClientRect();
    prevEl = h('div.hover-preview');
    if (!p) prevEl.append(h('h4', wl.dataset.target), h('div.pv', 'Diese Notiz existiert noch nicht – klick, um sie zu erstellen.'));
    else {
      const txt = await SN.fs.read(p).catch(() => '');
      const { body } = SN.notes.parse(txt);
      const pv = h('div.pv.ed-content', { html: toEditorHtml(SN.notes.bodyToHtml(body)) });
      prevEl.append(h('h4', SN.noteName(p)), pv);
    }
    $('#pop-root').append(prevEl);
    const pr = prevEl.getBoundingClientRect();
    prevEl.style.left = SN.clamp(r.left, 8, innerWidth - pr.width - 8) + 'px';
    prevEl.style.top = (r.bottom + pr.height + 12 > innerHeight ? r.top - pr.height - 8 : r.bottom + 8) + 'px';
  }
  function hidePreview() { if (prevEl) { prevEl.remove(); prevEl = null; } }

  function typewriter(tab) {
    const r = caretRect(); if (!r) return;
    const pr = tab.page.getBoundingClientRect();
    tab.page.scrollTop += (r.top - pr.top) - pr.height * 0.42;
  }

  // ======================================================================
  //  Toolbar
  // ======================================================================
  function buildToolbar() {
    const tb = $('#toolbar');
    const B = (icon, title, run, extra = '') => h('button.tool' + extra, { title, html: SN.icon(icon, 17), onmousedown: (e) => { e.preventDefault(); run(e); }, data: { cmd: icon } });
    const S = () => h('div.tb-sep');
    const blockBtn = h('button.tool.drop', { title: 'Absatzformat', html: `<span id="tb-block">Text</span>${SN.icon('chev-d', 14)}`, onmousedown: (e) => { e.preventDefault(); SN.menuAt(blockBtn, BLOCKS.map(b => ({ label: b.label, icon: b.icon, onClick: () => { refocus(); formatBlock(b.tag); } }))); } });
    const fontBtn = h('button.tool.drop', { title: 'Schriftart', html: `<span>Schrift</span>${SN.icon('chev-d', 14)}`, onmousedown: (e) => { e.preventDefault(); const r = saveSel(); SN.menuAt(fontBtn, FONTS.map(f => ({ label: f.label, icon: 'type', onClick: () => { restoreSel(r); exec('fontName', f.id); } }))); } });
    const sizeBtn = h('button.tool.drop.sm', { title: 'Schriftgröße', html: `<span>Größe</span>${SN.icon('chev-d', 14)}`, onmousedown: (e) => { e.preventDefault(); const r = saveSel(); SN.menuAt(sizeBtn, SIZES.map(s => ({ label: s + ' px', icon: 'type', onClick: () => { restoreSel(r); setFontSize(s); } }))); } });
    const colorBtn = h('button.tool.tool-color', { title: 'Textfarbe', html: `${SN.icon('type', 16)}<span class="bar" style="background:var(--accent)"></span>`, onmousedown: (e) => { e.preventDefault(); const r = saveSel(); SN.colorPop(colorBtn, COLORS, (c) => { restoreSel(r); if (c) exec('foreColor', c); else exec('removeFormat'); colorBtn.querySelector('.bar').style.background = c || 'var(--accent)'; }); } });
    const hlBtn = h('button.tool.tool-color', { title: 'Markieren (Strg+Umschalt+H)', html: `${SN.icon('highlight', 16)}<span class="bar" style="background:var(--accent2)"></span>`, onmousedown: (e) => { e.preventDefault(); const r = saveSel(); SN.colorPop(hlBtn, HILITES, (c) => { restoreSel(r); exec('hiliteColor', c || 'transparent'); }); } });
    const alignBtn = h('button.tool', { title: 'Ausrichtung', html: SN.icon('align-l', 17) + SN.icon('chev-d', 12), onmousedown: (e) => { e.preventDefault(); SN.menuAt(alignBtn, [
      { label: 'Links', icon: 'align-l', onClick: () => { refocus(); exec('justifyLeft'); } }, { label: 'Zentriert', icon: 'align-c', onClick: () => { refocus(); exec('justifyCenter'); } },
      { label: 'Rechts', icon: 'align-r', onClick: () => { refocus(); exec('justifyRight'); } }, { label: 'Blocksatz', icon: 'align-j', onClick: () => { refocus(); exec('justifyFull'); } }]); } });
    const boxBtn = h('button.tool', { title: 'Box einfügen', html: SN.icon('callout', 17) + SN.icon('chev-d', 12), onmousedown: (e) => { e.preventDefault(); const r = saveSel(); SN.menuAt(boxBtn, [
      { label: 'Info-Box', icon: 'info', onClick: () => { restoreSel(r); cmd.callout('info'); } }, { label: 'Tipp-Box', icon: 'lightbulb', onClick: () => { restoreSel(r); cmd.callout('tip'); } },
      { label: 'Warnung', icon: 'alert', onClick: () => { restoreSel(r); cmd.callout('warn'); } }, { label: 'Spirit-Box', icon: 'sparkles', onClick: () => { restoreSel(r); cmd.callout('spirit'); } },
      { label: 'Zitat-Box', icon: 'quote', onClick: () => { restoreSel(r); cmd.callout('quote'); } }, { label: 'Spoiler', icon: 'spoiler', onClick: () => { restoreSel(r); cmd.spoiler(); } }]); } });
    const exportBtn = h('button.tool', { title: 'Exportieren', html: SN.icon('download', 17), onmousedown: (e) => { e.preventDefault(); SN.menuAt(exportBtn, [
      { header: 'Exportieren als' },
      { label: 'PDF', icon: 'printer', onClick: () => Ed.export('pdf') }, { label: 'Word-kompatibel (.html)', icon: 'file', onClick: () => Ed.export('html') },
      { label: 'Markdown (.md)', icon: 'code', onClick: () => Ed.export('md') }, { label: 'Reiner Text (.txt)', icon: 'text', onClick: () => Ed.export('txt') },
      { sep: true }, { label: 'Als Markdown kopieren', icon: 'copy', onClick: () => Ed.export('copy') }, { label: 'Drucken', icon: 'printer', onClick: () => Ed.export('print') }]); } });
    const moreBtn = h('button.tool', { title: 'Mehr', html: SN.icon('more', 17), onmousedown: (e) => { e.preventDefault(); noteMenu(moreBtn); } });

    tb.append(
      B('undo', 'Rückgängig (Strg+Z)', () => exec('undo')), B('redo', 'Wiederholen (Strg+Y)', () => exec('redo')), S(),
      blockBtn, fontBtn, sizeBtn, S(),
      B('bold', 'Fett (Strg+B)', () => exec('bold')), B('italic', 'Kursiv (Strg+I)', () => exec('italic')), B('underline', 'Unterstrichen (Strg+U)', () => exec('underline')), B('strike', 'Durchgestrichen (Strg+Umschalt+X)', () => exec('strikeThrough')),
      colorBtn, hlBtn, S(),
      alignBtn, B('list', 'Aufzählung', () => cmd.list('ul')), B('list-ol', 'Nummerierte Liste', () => cmd.list('ol')), B('list-check', 'Checkliste (Strg+Umschalt+C)', () => cmd.checklist()),
      B('outdent', 'Einzug verkleinern', () => exec('outdent')), B('indent', 'Einzug vergrößern', () => exec('indent')), S(),
      B('link', 'Web-Link (Strg+K)', () => cmd.link()), B('wikilink', 'Notiz verlinken [[ ]]', () => { refocus(); document.execCommand('insertText', false, '[['); onInput(Ed.active); }),
      B('image', 'Bild einfügen', () => cmd.image()), B('table', 'Tabelle', () => { refocus(); cmd.table(); }), B('hr', 'Trennlinie', () => { refocus(); cmd.hr(); }), boxBtn,
      B('eraser', 'Formatierung entfernen', () => cmd.clear()),
      h('div.tb-right',
        B('search', 'Suchen & Ersetzen (Strg+F)', () => Ed.find()),
        B('history', 'Zeitreise – frühere Versionen', () => Ed.history()),
        exportBtn, moreBtn,
        B('sidebar-r', 'Rechte Leiste ein/aus', () => SN.app.toggleRight())),
    );
    tb.classList.add('disabled');
  }
  const refocus = () => { if (Ed.active && document.activeElement !== Ed.active.content) Ed.active.content.focus(); };
  const saveSel = () => { const s = getSelection(); return s.rangeCount && Ed.active && Ed.active.content.contains(s.anchorNode) ? s.getRangeAt(0).cloneRange() : null; };
  const restoreSel = (r) => { if (!Ed.active) return; Ed.active.content.focus(); if (r) { const s = getSelection(); s.removeAllRanges(); s.addRange(r); } };

  function updateToolbarState() {
    const tb = $('#toolbar'); if (!Ed.active) return;
    const st = { bold: 'bold', italic: 'italic', underline: 'underline', strike: 'strikeThrough', list: 'insertUnorderedList', 'list-ol': 'insertOrderedList' };
    for (const [k, c] of Object.entries(st)) { const b = tb.querySelector(`[data-cmd="${k}"]`); if (b) { let on = false; try { on = document.queryCommandState(c); } catch { } b.classList.toggle('on', on); } }
    const blk = currentBlock(Ed.active.content);
    const inCheck = blk && blk.closest('ul.checklist');
    tb.querySelector('[data-cmd="list-check"]')?.classList.toggle('on', !!inCheck);
    if (inCheck) tb.querySelector('[data-cmd="list"]')?.classList.remove('on');
    const tag = blk ? (blk.closest('h1,h2,h3,h4,blockquote,pre')?.tagName || 'P') : 'P';
    const lab = BLOCKS.find(b => b.tag === tag)?.label || 'Text';
    const el = $('#tb-block'); if (el) el.textContent = lab;
  }

  function noteMenu(anchor) {
    const tab = Ed.active; if (!tab) return;
    SN.menuAt(anchor, [
      { label: tab.fm.pinned ? 'Von Favoriten entfernen' : 'Zu Favoriten', icon: 'pin', onClick: () => { tab.fm.pinned = !tab.fm.pinned; markDirty(tab); Ed.save(tab).then(() => SN.emit('files')); } },
      { label: 'Farbe der Notiz', icon: 'palette', onClick: () => SN.colorPop(anchor, COLORS.slice(0, 15), (c) => { tab.fm.color = c || undefined; markDirty(tab); Ed.save(tab).then(() => SN.emit('files')); }) },
      { label: tab.fm.cover ? 'Titelbild entfernen' : 'Titelbild wählen', icon: 'layers', onClick: async () => {
        if (tab.fm.cover) { delete tab.fm.cover; renderCover(tab); markDirty(tab); return; }
        const [f] = await SN.pickFiles('image/*'); if (!f) return;
        tab.fm.cover = await SN.fs.saveImage(f, 'attachments', 'cover'); renderCover(tab); markDirty(tab); SN.notes.refreshFiles();
      } },
      { label: 'Als Vorlage speichern', icon: 'sparkles', onClick: async () => { await Ed.save(tab); const p = await SN.fs.uniqueNotePath('Vorlagen', SN.noteName(tab.path)); await SN.fs.write(p, SN.notes.serialize({ id: SN.uid(), created: new Date().toISOString() }, fromEditorHtml(tab.content))); await SN.notes.build(); SN.toast('Als Vorlage gespeichert (Ordner „Vorlagen“)', 'ok'); } },
      { label: 'Verschieben nach …', icon: 'move', onClick: () => SN.sidebar.moveDialog(tab.path) },
      { label: 'Duplizieren', icon: 'copy', onClick: async () => { await Ed.save(tab); const p = await SN.notes.create({ folder: SN.dirname(tab.path), name: SN.noteName(tab.path) + ' Kopie', html: fromEditorHtml(tab.content), fm: { tags: tab.fm.tags || [] } }); Ed.open(p, { newTab: true }); } },
      { label: 'Aufgabe im Planer erstellen', icon: 'calendar', onClick: () => SN.views.planner.quickAdd({ title: SN.noteName(tab.path), note: tab.path }) },
      { sep: true },
      { label: 'Im Explorer zeigen', icon: 'folder-open', onClick: () => SN.fs.reveal(tab.path) },
      { label: 'In Papierkorb verschieben', icon: 'trash', danger: true, onClick: async () => { if (await SN.confirm('Notiz löschen?', `„${SN.esc(SN.noteName(tab.path))}“ wird in den Papierkorb verschoben. Du kannst sie in den Einstellungen wiederherstellen.`, { danger: true, ok: 'Löschen' })) SN.notes.remove(tab.path); } },
    ]);
  }

  // ======================================================================
  //  Suchen & Ersetzen (CSS Highlights)
  // ======================================================================
  let findState = null;
  Ed.find = () => {
    const tab = Ed.active; if (!tab) return;
    const bar = $('#findbar'); bar.classList.remove('hidden'); bar.innerHTML = '';
    const q = h('input.input', { placeholder: 'Suchen …', spellcheck: 'false' });
    const rp = h('input.input', { placeholder: 'Ersetzen durch …', spellcheck: 'false' });
    const cnt = h('span.cnt');
    const cs = h('button.tool', { title: 'Groß/Klein beachten', html: '<b>Aa</b>' });
    findState = { matches: [], idx: -1, cs: false };
    const run = () => {
      CSS.highlights?.delete('sn-find'); CSS.highlights?.delete('sn-find-cur');
      findState.matches = [];
      const term = q.value; if (!term) { cnt.textContent = ''; return; }
      const walker = document.createTreeWalker(tab.content, NodeFilter.SHOW_TEXT);
      const needle = findState.cs ? term : term.toLowerCase();
      let n;
      while ((n = walker.nextNode())) {
        const hay = findState.cs ? n.data : n.data.toLowerCase();
        let i = hay.indexOf(needle);
        while (i >= 0) { const r = new Range(); r.setStart(n, i); r.setEnd(n, i + term.length); findState.matches.push(r); i = hay.indexOf(needle, i + term.length); }
      }
      if (window.Highlight && CSS.highlights) CSS.highlights.set('sn-find', new Highlight(...findState.matches));
      findState.idx = findState.matches.length ? 0 : -1;
      go(0);
    };
    const go = (d) => {
      const m = findState.matches; if (!m.length) { cnt.textContent = q.value ? 'keine Treffer' : ''; return; }
      findState.idx = (findState.idx + d + m.length) % m.length;
      const r = m[findState.idx];
      if (window.Highlight && CSS.highlights) CSS.highlights.set('sn-find-cur', new Highlight(r));
      const rect = r.getBoundingClientRect(), pr = tab.page.getBoundingClientRect();
      if (rect.top < pr.top + 60 || rect.bottom > pr.bottom - 40) tab.page.scrollTop += rect.top - pr.top - pr.height / 3;
      cnt.textContent = `${findState.idx + 1} / ${m.length}`;
    };
    const replaceOne = () => {
      const r = findState.matches[findState.idx]; if (!r) return;
      const s = getSelection(); s.removeAllRanges(); s.addRange(r); tab.content.focus();
      document.execCommand('insertText', false, rp.value); markDirty(tab); run();
    };
    const replaceAll = () => {
      const n = findState.matches.length; if (!n) return;
      for (const r of [...findState.matches].reverse()) { const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('insertText', false, rp.value); }
      markDirty(tab); run(); SN.toast(`${n} Treffer ersetzt`, 'ok');
    };
    q.addEventListener('input', run);
    q.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); go(e.shiftKey ? -1 : 1); } if (e.key === 'Escape') closeFind(); });
    rp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); replaceOne(); } if (e.key === 'Escape') closeFind(); });
    cs.addEventListener('click', () => { findState.cs = !findState.cs; cs.classList.toggle('on', findState.cs); run(); });
    bar.append(SN.ico('search', 16), q, cnt,
      h('button.tool', { title: 'Vorheriger (Umschalt+Enter)', html: SN.icon('chev-u', 16), onclick: () => go(-1) }),
      h('button.tool', { title: 'Nächster (Enter)', html: SN.icon('chev-d', 16), onclick: () => go(1) }), cs,
      h('div.tb-sep'), rp,
      h('button.btn.small', { onclick: replaceOne }, 'Ersetzen'), h('button.btn.small', { onclick: replaceAll }, 'Alle ersetzen'),
      h('div', { style: { flex: 1 } }), h('button.tool', { title: 'Schließen', html: SN.icon('x', 16), onclick: closeFind }));
    const sel = getSelection().toString();
    if (sel && sel.length < 60) q.value = sel;
    q.focus(); q.select(); run();
  };
  function closeFind() { $('#findbar').classList.add('hidden'); CSS.highlights?.delete('sn-find'); CSS.highlights?.delete('sn-find-cur'); findState = null; }

  // ======================================================================
  //  Export
  // ======================================================================
  async function inlineImages(html) {
    const tpl = document.createElement('template'); tpl.innerHTML = html;
    for (const img of tpl.content.querySelectorAll('img')) {
      const src = img.getAttribute('src') || '';
      if (/^https?:|^data:/.test(src)) continue;
      try { const b = await (await fetch(SN.fs.url(src))).blob(); img.src = await SN.readFileAsDataURL(b); } catch { }
    }
    return tpl.innerHTML;
  }
  function exportDoc(title, body, forPrint) {
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#e11d48';
    return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>${SN.esc(title)}</title><style>
      body{font-family:Georgia,'Lora',serif;max-width:760px;margin:40px auto;padding:0 30px;color:#221418;line-height:1.7;font-size:15px}
      h1,h2,h3{font-family:'Palatino Linotype',Georgia,serif;line-height:1.25}h1{border-bottom:2px solid ${accent};padding-bottom:6px}h2{color:${accent}}h3{color:#8a6d1d}
      img{max-width:100%;border-radius:8px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #d9c3c8;padding:6px 10px;text-align:left}th{background:#f8e8eb}
      blockquote{border-left:3px solid ${accent};margin:1em 0;padding:.4em 1em;color:#6b4a53;background:#fbf1f3}
      pre{background:#f4eef0;padding:12px;border-radius:8px;white-space:pre-wrap}code{font-family:Consolas,monospace}
      ul.checklist{list-style:none;padding-left:.3em}ul.checklist li::before{content:'☐ ';color:${accent}}ul.checklist li[data-checked="true"]::before{content:'☑ '}ul.checklist li[data-checked="true"]{text-decoration:line-through;color:#888}
      .callout{border:1px solid #e5c8cf;background:#fdf4f6;border-radius:10px;padding:10px 14px;margin:1em 0}.callout-title{font-weight:bold;text-transform:uppercase;font-size:.8em;letter-spacing:.1em;color:${accent}}
      details{border:1px solid #e5c8cf;border-radius:10px;padding:8px 12px}hr{border:0;border-top:1px solid #d9c3c8;margin:2em 0}.title{font-size:2.2em;margin:0 0 .2em}.meta{color:#987;font-size:.85em;margin-bottom:2em}
      ${forPrint ? '@page{margin:18mm}' : ''}</style></head><body><h1 class="title">${SN.esc(title)}</h1><div class="meta">Spirit Notes · ${SN.fmtDate(new Date())}</div>${body}</body></html>`;
  }
  Ed.export = async (kind) => {
    const tab = Ed.active; if (!tab) return;
    await Ed.save(tab);
    const title = SN.noteName(tab.path);
    const raw = fromEditorHtml(tab.content);
    const linked = raw.replace(WIKI, (_, t, hh, a) => `<b>${SN.esc(a || t)}</b>`);
    try {
      if (kind === 'md' || kind === 'copy') {
        const md = `# ${title}\n\n` + SN.notes.htmlToMarkdown(raw);
        if (kind === 'copy') { await navigator.clipboard.writeText(md); return SN.toast('Als Markdown kopiert', 'ok'); }
        return saveOut(title + '.md', md, [{ name: 'Markdown', extensions: ['md'] }]);
      }
      if (kind === 'txt') return saveOut(title + '.txt', title + '\n\n' + SN.notes.htmlText(linked).replace(/\n{3,}/g, '\n\n'), [{ name: 'Text', extensions: ['txt'] }]);
      if (kind === 'html') return saveOut(title + '.html', exportDoc(title, await inlineImages(linked)), [{ name: 'HTML (öffnet auch in Word)', extensions: ['html'] }]);
      if (kind === 'pdf' || kind === 'print') {
        const tpl = document.createElement('template'); tpl.innerHTML = linked;
        tpl.content.querySelectorAll('img').forEach(i => { const s = i.getAttribute('src'); if (s && !/^(https?:|data:)/.test(s)) i.src = SN.fs.url(s); });
        const docHtml = exportDoc(title, SN.isElectron ? tpl.innerHTML : await inlineImages(linked), true);
        if (SN.isElectron && kind === 'pdf') { const p = await window.spirit.pdf({ html: docHtml, defaultName: title + '.pdf' }); if (p) SN.toast('PDF gespeichert', 'ok'); return; }
        const fr = h('iframe', { style: { position: 'fixed', width: '0', height: '0', border: '0', right: '0', bottom: '0' } });
        document.body.append(fr); fr.contentDocument.open(); fr.contentDocument.write(docHtml); fr.contentDocument.close();
        setTimeout(() => { fr.contentWindow.print(); setTimeout(() => fr.remove(), 2000); }, 500);
      }
    } catch (e) { SN.toast('Export fehlgeschlagen: ' + e.message, 'err'); }
  };
  async function saveOut(name, text, filters) {
    if (SN.isElectron) { const p = await window.spirit.dialog.save({ defaultName: name, filters, text }); if (p) SN.toast('Exportiert: ' + SN.basename(p.replace(/\\/g, '/')), 'ok'); return; }
    const a = h('a', { href: URL.createObjectURL(new Blob([text], { type: 'text/plain' })), download: name }); a.click();
  }

  // ======================================================================
  //  Statusleiste
  // ======================================================================
  let saveState = 'saved';
  function setSaveState(s) { saveState = s; const el = $('#statusbar .save-state'); if (el) { el.className = 'st save-state ' + s; el.innerHTML = s === 'saving' ? `${SN.icon('clock', 13)} speichert …` : s === 'error' ? `${SN.icon('alert', 13)} Fehler` : `${SN.icon('check', 13)} gespeichert`; } }
  Ed.renderStatus = () => {
    const sb = $('#statusbar'); const tab = Ed.active;
    if (!tab) { sb.innerHTML = `<span class="st">${SN.icon('feather', 13)} Spirit Notes</span><span class="grow"></span>`; return; }
    const txt = tab.content.innerText || '';
    const words = SN.countWords(txt), chars = txt.replace(/\s/g, '').length;
    const selTxt = getSelection().toString();
    const sw = selTxt && tab.content.contains(getSelection().anchorNode) ? SN.countWords(selTxt) : 0;
    const today = SN.stats.store ? SN.stats.day().words : 0;
    const goal = SN.settings.dailyGoal || 500;
    sb.innerHTML = '';
    sb.append(
      h('span.st', { html: `${SN.icon('text', 13)} ${SN.fmtNum(words)} Wörter${sw ? ` <span class="faint">(${sw} markiert)</span>` : ''}` }),
      h('span.st', { html: `${SN.fmtNum(chars)} Zeichen` }),
      h('span.st', { html: `${SN.icon('clock', 13)} ${Math.max(1, Math.round(words / 200))} Min. Lesezeit` }),
      h('span.grow'),
      h('span.st', { title: 'Tagesziel (in den Einstellungen änderbar)', html: `${SN.icon('target', 13)} Heute ${SN.fmtNum(today)} / ${SN.fmtNum(goal)}` }, h('span.goal-bar', h('i', { style: { width: Math.min(100, today / goal * 100) + '%' } }))),
      h('button.tool', { title: 'Schreibmaschinen-Modus: Zeile bleibt in der Mitte', html: SN.icon('align-c', 14), class: SN.settings.typewriter ? 'on' : '', onclick: () => { SN.saveSettings({ typewriter: !SN.settings.typewriter }); Ed.renderStatus(); SN.toast('Schreibmaschinen-Modus ' + (SN.settings.typewriter ? 'an' : 'aus')); } }),
      h('button.tool', { title: 'Zen-Modus (F11)', html: SN.icon('maximize', 14), onclick: () => SN.app.zen() }),
      h('span.st.save-state'),
    );
    setSaveState(tab.dirty ? 'saving' : saveState === 'error' ? 'error' : 'saved');
  };

  // ======================================================================
  //  Leerer Zustand
  // ======================================================================
  function buildEmpty() {
    const el = $('#ed-empty');
    el.innerHTML = '';
    el.append(
      h('div.big-clock', { html: SN.themes.logoSVG(170) }),
      h('h2', { html: 'Keine Notiz geöffnet <span class="jp">白紙</span>' }),
      h('p', 'Die Zeit gehört dir. Starte eine neue Notiz, nimm eine Vorlage oder öffne etwas aus deinem Vault.'),
      h('div.row',
        h('button.btn.primary', { html: SN.icon('file-plus', 16) + '<span>Neue Notiz</span>', onclick: () => SN.app.newNote() }),
        h('button.btn', { html: SN.icon('sparkles', 16) + '<span>Aus Vorlage</span>', onclick: () => SN.app.newFromTemplate() }),
        h('button.btn', { html: SN.icon('sun', 16) + '<span>Tagesnotiz</span>', onclick: () => SN.app.dailyNote() }),
        h('button.btn', { html: SN.icon('dice', 16) + '<span>Zufällige Notiz</span>', onclick: () => SN.app.randomNote() })),
      h('div.shortcuts', { html: '<kbd>Strg N</kbd><span>Neue Notiz</span><kbd>Strg O</kbd><span>Notiz schnell öffnen</span><kbd>Strg P</kbd><span>Befehlspalette</span><kbd>Strg Umschalt F</kbd><span>Überall suchen</span><kbd>/</kbd><span>Befehle im Text</span><kbd>[[</kbd><span>Notizen verlinken</span>' }),
    );
  }

  // ======================================================================
  //  Rechte Leiste: Gliederung, Backlinks, lokaler Graph, Info
  // ======================================================================
  let rpTab = 'outline';
  Ed.setRight = (t) => { rpTab = t; SN.$$('.rp-tabs button').forEach(b => b.classList.toggle('on', b.dataset.rp === t)); Ed.renderRight(); };
  Ed.renderRight = SN.debounce(() => {
    const body = $('#rp-body'); if (!body) return;
    const tab = Ed.active;
    body.innerHTML = '';
    if (!tab) { body.append(h('div.empty-hint', 'Öffne eine Notiz, um hier Gliederung, Verknüpfungen und Infos zu sehen.')); return; }
    const meta = SN.notes.get(tab.path);
    if (rpTab === 'outline') {
      const hs = Array.from(tab.content.querySelectorAll('h1,h2,h3')).filter(x => x.textContent.trim());
      body.append(h('div.rp-h', SN.ico('list', 13), 'Gliederung', h('span.n', hs.length)));
      if (!hs.length) body.append(h('div.empty-hint', 'Füge Überschriften hinzu (# + Leertaste), dann erscheint hier ein Inhaltsverzeichnis.'));
      hs.forEach(x => body.append(h('div.outline-item.l' + x.tagName[1], { onclick: () => { x.scrollIntoView({ behavior: 'smooth', block: 'start' }); x.animate([{ background: 'var(--sel)' }, { background: 'transparent' }], 1200); } }, x.textContent.trim())));
    } else if (rpTab === 'links') {
      const bl = SN.notes.backlinks(tab.path);
      body.append(h('div.rp-h', SN.ico('link', 13), 'Verlinkt von', h('span.n', bl.length)));
      if (!bl.length) body.append(h('div.empty-hint', 'Noch keine Notiz verlinkt hierher. Schreib in einer anderen Notiz [[' + SN.noteName(tab.path) + ']].'));
      const nm = SN.noteName(tab.path);
      bl.forEach(b => body.append(h('div.bl-item', { onclick: (e) => Ed.open(b.path, { newTab: e.ctrlKey }) }, h('div.t', SN.ico('file', 13), SN.noteName(b.path)),
        ...b.snippets.map(s => h('div.s', { html: SN.esc(s).replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, a, c) => `<b>${c || a}</b>`) })))));
      const out = (meta?.links || []);
      body.append(h('div.rp-h', { style: { marginTop: '18px' } }, SN.ico('arrow-r', 13), 'Ausgehende Links', h('span.n', out.length)));
      [...new Set(out.map(l => l.target))].forEach(t => { const p = SN.notes.resolve(t); body.append(h('div.outline-item', { style: p ? null : { opacity: .55, fontStyle: 'italic' }, onclick: () => openLink(t) }, (p ? '⟡ ' : '+ ') + t)); });
      const un = SN.notes.unlinked(tab.path);
      if (un.length) {
        body.append(h('div.rp-h', { style: { marginTop: '18px' } }, SN.ico('eye', 13), 'Unverlinkte Erwähnungen', h('span.n', un.length)));
        un.slice(0, 12).forEach(p => body.append(h('div.outline-item', { onclick: () => Ed.open(p) }, SN.noteName(p))));
      }
    } else if (rpTab === 'local') {
      body.append(h('div.rp-h', SN.ico('graph', 13), 'Lokaler Graph'));
      const cv = h('canvas.local-graph');
      body.append(cv, h('div.faint', { style: { fontSize: '11.5px', marginTop: '8px' } }, 'Zeigt diese Notiz und alles, was direkt damit verbunden ist. Klick auf einen Punkt öffnet die Notiz.'));
      requestAnimationFrame(() => SN.graph.local(cv, tab.path));
    } else if (rpTab === 'info') {
      const txt = tab.content.innerText || '';
      const words = SN.countWords(txt);
      const sentences = (txt.match(/[.!?]+(\s|$)/g) || []).length || 1;
      body.append(h('div.rp-h', SN.ico('info', 13), 'Statistik'),
        h('div.info-grid',
          h('div.info-cell', h('b', SN.fmtNum(words)), h('span', 'Wörter')),
          h('div.info-cell', h('b', SN.fmtNum(txt.replace(/\s/g, '').length)), h('span', 'Zeichen')),
          h('div.info-cell', h('b', Math.round(words / sentences) || 0), h('span', 'Wörter / Satz')),
          h('div.info-cell', h('b', tab.content.querySelectorAll('img').length), h('span', 'Bilder')),
          h('div.info-cell', h('b', meta?.links.length || 0), h('span', 'Links')),
          h('div.info-cell', h('b', meta ? `${meta.tasks.filter(t => t.done).length}/${meta.tasks.length}` : '0/0'), h('span', 'Aufgaben erledigt'))),
        h('div.rp-h', SN.ico('calendar', 13), 'Daten'),
        h('div.muted', { style: { fontSize: '12.5px', lineHeight: '1.9' } },
          h('div', 'Erstellt: ' + (tab.fm.created ? SN.fmtDate(tab.fm.created, true) : '–')),
          h('div', 'Geändert: ' + (meta?.updated ? SN.fmtDate(meta.updated, true) : '–')),
          h('div', 'Pfad: ' + tab.path)),
        h('div.rp-h', { style: { marginTop: '14px' } }, SN.ico('tag', 13), 'Alle Tags'),
        h('div.tag-cloud', ...(meta?.tags || []).map(t => h('span.chip.tag', { onclick: () => SN.app.searchTag(t) }, t))));
      const freq = {};
      (txt.toLowerCase().match(/\p{L}{5,}/gu) || []).forEach(w => freq[w] = (freq[w] || 0) + 1);
      const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8);
      if (top.length) body.append(h('div.rp-h', { style: { marginTop: '14px' } }, SN.ico('chart', 13), 'Häufigste Wörter'), ...top.map(([w, n]) => h('div.row', { style: { fontSize: '12px', margin: '3px 0' } }, h('span.grow', w), h('div.goal-bar', { style: { width: '80px' } }, h('i', { style: { width: (n / top[0][1] * 100) + '%' } })), h('span.faint', { style: { width: '22px', textAlign: 'right' } }, n))));
    }
  }, 120);
})();
