/* Spirit Notes – Notiz-Index: Parsen, Links, Tags, Backlinks, Vorlagen */
(() => {
  const N = SN.notes = { files: [], map: new Map() };
  const WIKI_RE = /\[\[([^\]|#\n]+)(#[^\]|\n]*)?(?:\|([^\]\n]+))?\]\]/g;
  const TAG_RE = /(?:^|[\s(,;])#([\p{L}][\p{L}\p{N}_\-/]*)/gu;
  const HIDDEN_DIRS = ['.spirit'];

  // ---------- Frontmatter ----------
  N.parse = (text) => {
    text = String(text || '').replace(/^﻿/, '');
    const fm = {};
    let body = text;
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (m) {
      body = text.slice(m[0].length);
      let lastKey = null;
      for (const line of m[1].split(/\r?\n/)) {
        const li = line.match(/^\s+-\s+(.*)$/);
        if (li && lastKey) { if (!Array.isArray(fm[lastKey])) fm[lastKey] = []; fm[lastKey].push(unq(li[1])); continue; }
        const kv = line.match(/^([\w-]+):\s*(.*)$/);
        if (!kv) continue;
        lastKey = kv[1];
        fm[kv[1]] = val(kv[2]);
      }
    }
    return { fm, body };
  };
  const unq = (s) => { s = s.trim(); return (/^".*"$|^'.*'$/.test(s)) ? s.slice(1, -1).replace(/\\"/g, '"') : s; };
  const val = (v) => {
    v = v.trim();
    if (v === '') return '';
    if (v.startsWith('[') && v.endsWith(']')) return v.slice(1, -1).split(',').map(x => unq(x)).filter(Boolean);
    if (v === 'true') return true; if (v === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
    return unq(v);
  };
  const ser = (v) => {
    if (Array.isArray(v)) return '[' + v.map(x => /[,\[\]:#"]/.test(x) ? JSON.stringify(x) : x).join(', ') + ']';
    if (typeof v === 'string' && (/[:#\[\]{}"]|^\s|\s$/.test(v) || v === '')) return JSON.stringify(v);
    return String(v);
  };
  N.serialize = (fm, html) => {
    const keys = Object.keys(fm).filter(k => fm[k] !== undefined && fm[k] !== null && !(Array.isArray(fm[k]) && !fm[k].length && k !== 'tags'));
    const head = keys.length ? '---\n' + keys.map(k => `${k}: ${ser(fm[k])}`).join('\n') + '\n---\n' : '';
    return head + html.trim() + '\n';
  };

  // ---------- Markdown <-> HTML ----------
  N.isHTML = (body) => /^\s*<(p|h[1-6]|div|ul|ol|blockquote|pre|table|img|hr|details|span|br)[\s>/]/i.test(body);
  N.bodyToHtml = (body) => {
    if (!body.trim()) return '<p><br></p>';
    if (N.isHTML(body)) return SN.sanitize(body);
    // Obsidian-Einbettungen ![[bild.png]] -> Bild
    let md = body.replace(/!\[\[([^\]|]+)(?:\|(\d+))?\]\]/g, (_, f, w) => {
      const p = N.findFile(f.trim());
      return p ? `<img data-src="${SN.esc(p)}"${w ? ` style="width:${w}px"` : ''}>` : `[[${f}]]`;
    });
    let html = window.marked ? marked.parse(md, { gfm: true, breaks: true }) : `<p>${SN.esc(md).replace(/\n/g, '<br>')}</p>`;
    const tpl = document.createElement('template');
    tpl.innerHTML = SN.sanitize(html);
    // GFM-Checklisten -> eigene Checklisten
    tpl.content.querySelectorAll('li > input[type=checkbox]').forEach(cb => {
      const li = cb.parentElement; li.dataset.checked = cb.checked ? 'true' : 'false';
      li.parentElement.classList.add('checklist'); cb.remove();
    });
    // relative Bildpfade merken
    tpl.content.querySelectorAll('img[src]').forEach(img => {
      const s = img.getAttribute('src');
      if (!/^(https?:|data:|blob:)/.test(s)) { img.dataset.src = decodeURI(s); img.removeAttribute('src'); }
    });
    return tpl.innerHTML;
  };

  N.htmlToMarkdown = (html) => {
    const tpl = document.createElement('template'); tpl.innerHTML = html;
    const inline = (n) => Array.from(n.childNodes).map(md).join('');
    const md = (n) => {
      if (n.nodeType === 3) return n.textContent.replace(/ /g, ' ');
      if (n.nodeType !== 1) return '';
      const t = n.tagName, c = () => inline(n);
      switch (t) {
        case 'H1': case 'H2': case 'H3': case 'H4': case 'H5': case 'H6': return `\n${'#'.repeat(+t[1])} ${c().trim()}\n\n`;
        case 'P': case 'DIV': if (n.classList.contains('callout-title')) return ''; return n.classList.contains('callout') ? `\n> [!${n.dataset.type || 'info'}] ${n.querySelector('.callout-title')?.textContent || ''}\n> ${c().trim().replace(/\n/g, '\n> ')}\n\n` : `${c().trim()}\n\n`;
        case 'BR': return '  \n';
        case 'B': case 'STRONG': return `**${c()}**`;
        case 'I': case 'EM': return `*${c()}*`;
        case 'S': case 'STRIKE': case 'DEL': return `~~${c()}~~`;
        case 'U': return `<u>${c()}</u>`;
        case 'MARK': return `==${c()}==`;
        case 'CODE': return n.parentElement?.tagName === 'PRE' ? c() : '`' + c() + '`';
        case 'PRE': return '\n```\n' + n.textContent.replace(/\n$/, '') + '\n```\n\n';
        case 'BLOCKQUOTE': return c().trim().split('\n').map(l => '> ' + l).join('\n') + '\n\n';
        case 'A': return `[${c()}](${n.getAttribute('href') || ''})`;
        case 'IMG': return `![${n.alt || ''}](${encodeURI(n.dataset.src || n.getAttribute('src') || '')})`;
        case 'HR': return '\n---\n\n';
        case 'UL': case 'OL': {
          const cl = n.classList.contains('checklist');
          return Array.from(n.children).map((li, i) => {
            const pre = cl ? `- [${li.dataset.checked === 'true' ? 'x' : ' '}] ` : t === 'OL' ? `${i + 1}. ` : '- ';
            return pre + inline(li).trim().replace(/\n/g, '\n   ');
          }).join('\n') + '\n\n';
        }
        case 'TABLE': {
          const rows = Array.from(n.querySelectorAll('tr')).map(tr => Array.from(tr.children).map(td => inline(td).trim().replace(/\|/g, '\\|').replace(/\n/g, ' ')));
          if (!rows.length) return '';
          const w = Math.max(...rows.map(r => r.length));
          const line = (r) => '| ' + Array.from({ length: w }, (_, i) => r[i] || '').join(' | ') + ' |';
          return '\n' + [line(rows[0]), '|' + ' --- |'.repeat(w), ...rows.slice(1).map(line)].join('\n') + '\n\n';
        }
        case 'DETAILS': return `\n<details>\n<summary>${n.querySelector('summary')?.textContent || 'Spoiler'}</summary>\n\n${Array.from(n.childNodes).filter(x => x.tagName !== 'SUMMARY').map(md).join('').trim()}\n</details>\n\n`;
        case 'SUMMARY': return '';
        case 'SPAN': return n.classList.contains('wikilink') ? `[[${n.dataset.target}${n.textContent !== n.dataset.target ? '|' + n.textContent : ''}]]` : c();
        default: return c();
      }
    };
    return inline(tpl.content).replace(/\n{3,}/g, '\n\n').trim() + '\n';
  };

  // ---------- Extraktion ----------
  N.htmlText = (html) => {
    const s = html.replace(/<\/(p|div|h[1-6]|li|blockquote|pre|tr|summary|details)>/gi, '$&\n').replace(/<br\s*\/?>/gi, '\n').replace(/<(td|th)[^>]*>/gi, ' ');
    const d = document.createElement('template'); d.innerHTML = s;
    return (d.content.textContent || '').replace(/ /g, ' ');
  };
  N.extract = (path, text, file) => {
    const { fm, body } = N.parse(text);
    const html = N.isHTML(body) ? body : N.bodyToHtml(body);
    const plain = N.htmlText(html);
    const links = [];
    let m; WIKI_RE.lastIndex = 0;
    while ((m = WIKI_RE.exec(plain))) links.push({ target: m[1].trim(), alias: m[3] || null });
    const tags = new Set((Array.isArray(fm.tags) ? fm.tags : (fm.tags ? String(fm.tags).split(/[ ,]+/) : [])).map(t => String(t).replace(/^#/, '').toLowerCase()).filter(Boolean));
    TAG_RE.lastIndex = 0;
    while ((m = TAG_RE.exec(plain))) tags.add(m[1].toLowerCase());
    const tpl = document.createElement('template'); tpl.innerHTML = html;
    const tasks = Array.from(tpl.content.querySelectorAll('ul.checklist > li')).map(li => ({ text: li.textContent.trim().replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g, (_, t, a) => a || t), done: li.dataset.checked === 'true' })).filter(t => t.text);
    const headings = Array.from(tpl.content.querySelectorAll('h1,h2,h3')).map(h => ({ level: +h.tagName[1], text: h.textContent.trim() })).filter(h => h.text);
    const img = tpl.content.querySelector('img');
    const cleanText = plain.replace(WIKI_RE, (_, t, h, a) => a || t).replace(/\s+/g, ' ').trim();
    return {
      path, name: SN.noteName(path), folder: SN.dirname(path),
      id: fm.id || null, fm,
      created: fm.created || (file && file.ctime ? new Date(file.ctime).toISOString() : null),
      updated: file && file.mtime ? new Date(file.mtime).toISOString() : (fm.updated || new Date().toISOString()),
      tags: [...tags], links, tasks, headings,
      words: SN.countWords(cleanText), chars: cleanText.length,
      excerpt: cleanText.slice(0, 220),
      image: img ? (img.dataset.src || img.getAttribute('src')) : null,
      pinned: fm.pinned === true, color: fm.color || null,
      text: plain, lower: cleanText.toLowerCase(),
    };
  };

  // ---------- Index ----------
  N.isNote = (p) => /\.md$/i.test(p) && !HIDDEN_DIRS.some(d => p.startsWith(d + '/'));
  N.build = async () => {
    N.files = await SN.fs.list();
    const notes = N.files.filter(f => !f.isDir && N.isNote(f.path));
    N.map = new Map();
    const chunk = 24;
    for (let i = 0; i < notes.length; i += chunk) {
      await Promise.all(notes.slice(i, i + chunk).map(async f => {
        try { N.map.set(f.path, N.extract(f.path, await SN.fs.read(f.path), f)); } catch (e) { console.warn('Konnte nicht lesen', f.path, e); }
      }));
    }
    SN.emit('index');
  };
  N.refreshFiles = async () => { N.files = await SN.fs.list(); SN.emit('files'); };
  N.all = () => [...N.map.values()];
  N.get = (p) => N.map.get(p);
  N.findFile = (name) => {
    const low = name.toLowerCase();
    const f = N.files.find(f => !f.isDir && (f.path.toLowerCase() === low || SN.basename(f.path).toLowerCase() === low));
    return f ? f.path : null;
  };
  N.resolve = (target) => {
    if (!target) return null;
    let t = target.trim().replace(/\.md$/i, '').toLowerCase();
    if (t.includes('/')) { for (const p of N.map.keys()) if (p.toLowerCase().replace(/\.md$/, '') === t) return p; }
    let best = null;
    for (const p of N.map.keys()) if (SN.noteName(p).toLowerCase() === t) { if (!best || p.length < best.length) best = p; }
    return best;
  };
  N.update = (path, text, file) => {
    const meta = N.extract(path, text, file || { mtime: Date.now(), ctime: N.map.get(path)?.created ? Date.parse(N.map.get(path).created) : Date.now() });
    N.map.set(path, meta);
    if (!N.files.find(f => f.path === path)) N.files.push({ path, isDir: false, mtime: Date.now(), ctime: Date.now() });
    else { const f = N.files.find(f => f.path === path); f.mtime = Date.now(); }
    SN.emit('note:updated', path, meta);
    return meta;
  };
  N.backlinks = (path) => {
    const out = [];
    const me = N.map.get(path); if (!me) return out;
    for (const n of N.map.values()) {
      if (n.path === path) continue;
      if (!n.links.some(l => N.resolve(l.target) === path)) continue;
      const snippets = [];
      const re = /\[\[([^\]|#\n]+)(#[^\]|\n]*)?(?:\|([^\]\n]+))?\]\]/g;
      let m;
      while ((m = re.exec(n.text)) && snippets.length < 3) {
        if (N.resolve(m[1]) !== path) continue;
        const s = Math.max(0, m.index - 70), e = Math.min(n.text.length, m.index + m[0].length + 70);
        snippets.push((s > 0 ? '…' : '') + n.text.slice(s, e).replace(/\s+/g, ' ').trim() + (e < n.text.length ? '…' : ''));
      }
      out.push({ path: n.path, snippets });
    }
    return out;
  };
  N.unlinked = (path) => {
    const me = N.map.get(path); if (!me || me.name.length < 3) return [];
    const name = me.name.toLowerCase();
    const re = new RegExp(`(^|[^\\p{L}])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}]|$)`, 'u');
    return N.all().filter(n => n.path !== path && re.test(n.lower) && !n.links.some(l => N.resolve(l.target) === path)).map(n => n.path);
  };
  N.allTags = () => {
    const m = new Map();
    for (const n of N.map.values()) for (const t of n.tags) m.set(t, (m.get(t) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  };
  N.folders = () => N.files.filter(f => f.isDir && !f.path.startsWith('.spirit') && !f.path.startsWith('attachments')).map(f => f.path).sort();

  // ---------- Erstellen / Umbenennen / Löschen ----------
  N.create = async ({ folder = '', name = 'Unbenannt', html = '<p><br></p>', fm = {} } = {}) => {
    const path = await SN.fs.uniqueNotePath(folder, name);
    const now = new Date().toISOString();
    const text = N.serialize({ id: SN.uid(), created: now, tags: [], ...fm }, html);
    await SN.fs.write(path, text);
    N.update(path, text, { mtime: Date.now(), ctime: Date.now() });
    SN.stats.bump('notes', 1);
    SN.emit('files');
    return path;
  };
  N.rename = async (oldPath, newPath) => {
    if (oldPath === newPath) return newPath;
    await SN.fs.rename(oldPath, newPath);
    const oldName = SN.noteName(oldPath), newName = SN.noteName(newPath);
    const meta = N.map.get(oldPath);
    N.map.delete(oldPath);
    const f = N.files.find(f => f.path === oldPath); if (f) f.path = newPath;
    if (meta) N.map.set(newPath, { ...meta, path: newPath, name: newName, folder: SN.dirname(newPath) });
    let updated = 0;
    if (oldName !== newName) {
      const esc = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`\\[\\[${esc}(#[^\\]|]*)?(\\|[^\\]]*)?\\]\\]`, 'gi');
      for (const n of N.all()) {
        if (!n.links.some(l => l.target.toLowerCase() === oldName.toLowerCase())) continue;
        try {
          const txt = await SN.fs.read(n.path);
          const nt = txt.replace(re, (_, h, a) => `[[${newName}${h || ''}${a || ''}]]`);
          if (nt !== txt) { await SN.fs.write(n.path, nt); N.update(n.path, nt); updated++; SN.emit('note:external', n.path); }
        } catch (e) { console.warn(e); }
      }
    }
    SN.emit('note:renamed', oldPath, newPath);
    SN.emit('files');
    if (updated) SN.toast(`${SN.plural(updated, 'Link', 'Links')} in anderen Notizen aktualisiert`, 'ok');
    return newPath;
  };
  N.renameFolder = async (oldDir, newDir) => {
    await SN.fs.rename(oldDir, newDir);
    for (const [p, meta] of [...N.map]) if (p.startsWith(oldDir + '/')) {
      const np = newDir + p.slice(oldDir.length);
      N.map.delete(p); N.map.set(np, { ...meta, path: np, folder: SN.dirname(np) });
      SN.emit('note:renamed', p, np);
    }
    await N.refreshFiles();
  };
  N.remove = async (path) => {
    await SN.fs.remove(path);
    const gone = [...N.map.keys()].filter(p => p === path || p.startsWith(path + '/'));
    gone.forEach(p => { N.map.delete(p); SN.emit('note:deleted', p); });
    N.files = N.files.filter(f => f.path !== path && !f.path.startsWith(path + '/'));
    SN.emit('files');
  };
  N.setFm = async (path, patch) => {
    const txt = await SN.fs.read(path);
    const { fm, body } = N.parse(txt);
    Object.assign(fm, patch);
    const nt = N.serialize(fm, body);
    await SN.fs.write(path, nt);
    N.update(path, nt);
    SN.emit('note:external', path);
  };

  // ---------- Vorlagen ----------
  N.fillVars = (html, title) => {
    const d = new Date();
    return html.replace(/\{\{date\}\}/g, `${SN.pad(d.getDate())}.${SN.pad(d.getMonth() + 1)}.${d.getFullYear()}`)
      .replace(/\{\{time\}\}/g, SN.fmtTime(d)).replace(/\{\{title\}\}/g, SN.esc(title || ''))
      .replace(/\{\{weekday\}\}/g, SN.DAYS[d.getDay()]).replace(/\{\{weekday_jp\}\}/g, SN.DAYS_JP[d.getDay()]);
  };
  N.TEMPLATES = [
    { id: 'blank', name: 'Leere Notiz', icon: 'file', desc: 'Ein leeres Blatt.', html: '<p><br></p>' },
    { id: 'diary', name: 'Tagebuch', icon: 'sun', desc: 'Stimmung, Erlebnisse, Dankbarkeit.', tags: ['tagebuch'], html:
      `<h1>{{weekday}}, {{date}}</h1><p class="jp-sub">{{weekday_jp}}</p><div class="callout" data-type="mood"><div class="callout-title">Stimmung</div><p>★★★☆☆ – </p></div><h2>Was heute passiert ist</h2><p><br></p><h2>Dafür bin ich dankbar</h2><ul><li><br></li></ul><h2>Morgen will ich …</h2><ul class="checklist"><li data-checked="false"><br></li></ul>` },
    { id: 'plan', name: 'Projekt-Plan', icon: 'target', desc: 'Ziel, Meilensteine, Aufgaben.', tags: ['projekt'], html:
      `<h1>{{title}}</h1><div class="callout" data-type="info"><div class="callout-title">Ziel</div><p>Was will ich erreichen?</p></div><h2>Meilensteine</h2><ul class="checklist"><li data-checked="false">Schritt 1</li><li data-checked="false">Schritt 2</li><li data-checked="false">Schritt 3</li></ul><h2>Ideen</h2><ul><li><br></li></ul><h2>Zeitplan</h2><table><tbody><tr><th>Was</th><th>Bis wann</th><th>Status</th></tr><tr><td><br></td><td><br></td><td><br></td></tr><tr><td><br></td><td><br></td><td><br></td></tr></tbody></table><h2>Notizen</h2><p><br></p>` },
    { id: 'anime', name: 'Anime-Review', icon: 'tv', desc: 'Bewertung, Lieblingsszenen, Fazit.', tags: ['anime', 'review'], html:
      `<h1>{{title}}</h1><table><tbody><tr><th>Studio</th><td><br></td></tr><tr><th>Episoden</th><td><br></td></tr><tr><th>Genre</th><td><br></td></tr><tr><th>Geschaut</th><td>{{date}}</td></tr></tbody></table><h2>Bewertung</h2><ul><li><b>Story:</b> /10</li><li><b>Charaktere:</b> /10</li><li><b>Animation:</b> /10</li><li><b>Musik:</b> /10</li></ul><h2>Lieblingscharakter</h2><p><br></p><details><summary>Beste Szene (Spoiler)</summary><p><br></p></details><h2>Fazit</h2><div class="callout" data-type="quote"><div class="callout-title">In einem Satz</div><p><br></p></div>` },
    { id: 'story', name: 'Story-Kapitel', icon: 'book', desc: 'Für eigene Geschichten & Fanfics.', tags: ['story'], html:
      `<h1>{{title}}</h1><div class="callout" data-type="tip"><div class="callout-title">Zusammenfassung</div><p>Worum geht es in diesem Kapitel?</p></div><p><b>Charaktere:</b> </p><p><b>Ort:</b> </p><hr><p><br></p>` },
    { id: 'character', name: 'Charakter-Profil', icon: 'sparkles', desc: 'Eigene Figuren (OCs) entwerfen.', tags: ['charakter'], html:
      `<h1>{{title}}</h1><table><tbody><tr><th>Name</th><td><br></td></tr><tr><th>Alter</th><td><br></td></tr><tr><th>Fähigkeit</th><td><br></td></tr><tr><th>Waffe / Item</th><td><br></td></tr><tr><th>Lieblingsfarbe</th><td><br></td></tr></tbody></table><h2>Aussehen</h2><p><br></p><h2>Persönlichkeit</h2><p><br></p><h2>Hintergrund</h2><p><br></p><h2>Beziehungen</h2><ul><li><br></li></ul>` },
    { id: 'meeting', name: 'Notizen / Unterricht', icon: 'list', desc: 'Datum, Thema, Mitschrift, To-dos.', html:
      `<h1>{{title}}</h1><p><b>Datum:</b> {{date}}, {{time}}</p><p><b>Thema:</b> </p><h2>Mitschrift</h2><ul><li><br></li></ul><h2>Wichtig</h2><div class="callout" data-type="warn"><div class="callout-title">Nicht vergessen</div><p><br></p></div><h2>Aufgaben</h2><ul class="checklist"><li data-checked="false"><br></li></ul>` },
    { id: 'week', name: 'Wochenplan', icon: 'calendar', desc: 'Sieben Tage auf einen Blick.', tags: ['plan'], html:
      `<h1>Wochenplan</h1><p class="jp-sub">今週の予定</p><table><tbody><tr><th>Tag</th><th>Vormittag</th><th>Nachmittag</th><th>Abend</th></tr>${['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'].map(d => `<tr><th>${d}</th><td><br></td><td><br></td><td><br></td></tr>`).join('')}</tbody></table><h2>Wochenziele</h2><ul class="checklist"><li data-checked="false"><br></li></ul>` },
    { id: 'idea', name: 'Idee / Brainstorm', icon: 'lightbulb', desc: 'Schnell Gedanken sammeln.', tags: ['idee'], html:
      `<h1>{{title}}</h1><div class="callout" data-type="tip"><div class="callout-title">Die Idee</div><p><br></p></div><h2>Warum ist sie cool?</h2><ul><li><br></li></ul><h2>Nächste Schritte</h2><ul class="checklist"><li data-checked="false"><br></li></ul>` },
  ];
  N.userTemplates = () => N.all().filter(n => n.folder === 'Vorlagen' || n.folder.startsWith('Vorlagen/'));

  // ---------- Statistik / Aktivität ----------
  SN.stats = {
    store: null,
    async load() { this.store = new SN.Store('stats', { days: {}, totals: {} }); await this.store.load(); },
    day(k = SN.todayKey()) { const d = this.store.value.days; return d[k] = d[k] || { words: 0, notes: 0, tasks: 0, focus: 0, anime: 0 }; },
    bump(field, n = 1) {
      if (!this.store) return;
      const d = this.day(); d[field] = (d[field] || 0) + n;
      const t = this.store.value.totals; t[field] = (t[field] || 0) + n;
      this.store.save();
      SN.emit('stats');
    },
    streak() {
      let s = 0; const d = new Date();
      const has = (k) => { const x = this.store.value.days[k]; return x && (x.words > 0 || x.notes > 0 || x.tasks > 0 || x.focus > 0); };
      if (!has(SN.dateKey(d))) d.setDate(d.getDate() - 1);
      while (has(SN.dateKey(d))) { s++; d.setDate(d.getDate() - 1); }
      return s;
    },
    xp() {
      const t = this.store?.value.totals || {};
      return Math.round((t.words || 0) / 5 + (t.notes || 0) * 15 + (t.tasks || 0) * 20 + (t.focus || 0) * 2 + (t.anime || 0) * 40);
    },
    level() {
      const xp = this.xp();
      const lvl = Math.floor(Math.sqrt(xp / 60)) + 1;
      const cur = 60 * (lvl - 1) ** 2, next = 60 * lvl ** 2;
      const titles = ['Novize', 'Lehrling', 'Schreiberling', 'Träumer', 'Chronist', 'Zeitweber', 'Sternenleser', 'Spirit-Beschwörer', 'Seelenpoet', 'Uhrwerk-Meister', 'Hüter der Zeit', 'Legende der Zeit'];
      return { lvl, xp, cur, next, pct: (xp - cur) / (next - cur), title: titles[Math.min(titles.length - 1, lvl - 1)] + (lvl > titles.length ? ' ' + '✦'.repeat(Math.min(3, lvl - titles.length)) : '') };
    },
  };
})();
