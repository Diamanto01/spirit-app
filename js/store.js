/* Spirit Notes – Speicher: Vault (Dateien), Einstellungen, Daten-Stores */
(() => {
  const E = window.spirit; // nur in der EXE vorhanden
  SN.isElectron = !!(E && E.isElectron);

  // ---------- Browser-Fallback (IndexedDB) – damit das Programm auch im Browser läuft ----------
  function idb() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('spirit-notes-vault', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('files', { keyPath: 'path' });
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
  }
  let dbp;
  const tx = async (mode, fn) => { dbp = dbp || idb(); const db = await dbp; return new Promise((res, rej) => { const t = db.transaction('files', mode); const s = t.objectStore('files'); let out; Promise.resolve(fn(s, v => out = v)).catch(rej); t.oncomplete = () => res(out); t.onerror = () => rej(t.error); }); };
  const req = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const blobUrls = new Map();

  const WebVault = {
    async info() { return { path: localStorage.getItem('sn-web-vault') ? 'Browser-Speicher' : null, exists: !!localStorage.getItem('sn-web-vault') }; },
    async useDefault() { localStorage.setItem('sn-web-vault', '1'); return 'Browser-Speicher'; },
    async choose() { return this.useDefault(); },
    async list() {
      const all = await tx('readonly', (s, out) => req(s.getAll()).then(out));
      const dirs = new Set();
      const out = [];
      for (const f of all) {
        if (f.path.startsWith('.spirit/trash') || f.path.startsWith('.spirit/history')) continue;
        const parts = f.path.split('/'); parts.pop();
        let acc = ''; for (const p of parts) { acc = acc ? acc + '/' + p : p; dirs.add(acc); }
        if (f.isDir) dirs.add(f.path);
        else out.push({ path: f.path, isDir: false, size: f.size || 0, mtime: f.mtime, ctime: f.ctime || f.mtime });
      }
      for (const d of dirs) out.push({ path: d, isDir: true });
      return out;
    },
    async read(p) { const f = await tx('readonly', (s, out) => req(s.get(p)).then(out)); if (!f) throw new Error('Nicht gefunden: ' + p); if (f.data == null && f.blob) return new TextDecoder('utf-8', { ignoreBOM: true }).decode(await f.blob.arrayBuffer()); return f.data; },
    async readBin(p) { const f = await tx('readonly', (s, out) => req(s.get(p)).then(out)); if (!f) throw new Error('Nicht gefunden: ' + p); return f.blob ? new Uint8Array(await f.blob.arrayBuffer()) : new TextEncoder().encode(f.data || ''); },
    async records() { const all = await tx('readonly', (s, out) => req(s.getAll()).then(out)); return all.filter(f => !f.isDir).map(f => ({ path: f.path, mtime: f.mtime || 0, size: f.size || 0 })); },
    async exists(p) { const f = await tx('readonly', (s, out) => req(s.get(p)).then(out)); return !!f; },
    async write(p, text) { const old = await tx('readonly', (s, out) => req(s.get(p)).then(out)); await tx('readwrite', s => s.put({ path: p, data: text, size: text.length, mtime: Date.now(), ctime: old?.ctime || Date.now() })); return true; },
    async writeBin(p, data) { const type = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', avif: 'image/avif', bmp: 'image/bmp' }[SN.ext(p)] || ''; const blob = new Blob([data], type ? { type } : {}); await tx('readwrite', s => s.put({ path: p, blob, size: blob.size, mtime: Date.now() })); const old = blobUrls.get(p); if (old) URL.revokeObjectURL(old); blobUrls.set(p, URL.createObjectURL(blob)); return true; },
    async mkdir(p) { await tx('readwrite', s => s.put({ path: p, isDir: true, mtime: Date.now() })); return true; },
    async rename(a, b) {
      const all = await tx('readonly', (s, out) => req(s.getAll()).then(out));
      await tx('readwrite', s => { for (const f of all) if (f.path === a || f.path.startsWith(a + '/')) { s.delete(f.path); s.put({ ...f, path: b + f.path.slice(a.length) }); } });
      for (const [k, v] of [...blobUrls]) if (k === a || k.startsWith(a + '/')) { blobUrls.delete(k); blobUrls.set(b + k.slice(a.length), v); }
      return b;
    },
    async remove(p) {
      const all = await tx('readonly', (s, out) => req(s.getAll()).then(out));
      const name = `${Date.now()}__${p.replace(/\//g, '%2F')}`;
      await tx('readwrite', s => { for (const f of all) if (f.path === p || f.path.startsWith(p + '/')) { s.delete(f.path); if (!f.isDir) s.put({ ...f, path: `.spirit/trash/${name}${f.path.slice(p.length).replace(/\//g, '%2F')}` }); } });
      return name;
    },
    async del(p) { const all = await tx('readonly', (s, out) => req(s.getAll()).then(out)); await tx('readwrite', s => { for (const f of all) if (f.path === p || f.path.startsWith(p + '/')) s.delete(f.path); }); return true; },
    async listDir(p) { const all = await tx('readonly', (s, out) => req(s.getAll()).then(out)); return all.filter(f => f.path.startsWith(p + '/')).map(f => f.path.slice(p.length + 1)).filter(n => !n.includes('/')).sort(); },
    async trashList() { const names = await this.listDir('.spirit/trash'); return names.map(n => { const [ts, ...rest] = n.split('__'); return { name: n, deletedAt: Number(ts), path: rest.join('__').replace(/%2F/g, '/') }; }).sort((a, b) => b.deletedAt - a.deletedAt); },
    async trashRestore(n) { const orig = n.split('__').slice(1).join('__').replace(/%2F/g, '/'); await this.rename('.spirit/trash/' + n, orig); return orig; },
    async trashEmpty() { return this.del('.spirit/trash'); },
    async reveal() { SN.toast('Im Browser-Modus nicht verfügbar', 'warn'); },
    async openFolder() { SN.toast('Im Browser-Modus nicht verfügbar', 'warn'); },
    onChanged() {},
    async preloadBlobs() {
      const all = await tx('readonly', (s, out) => req(s.getAll()).then(out));
      for (const f of all) if (f.blob && !blobUrls.has(f.path)) blobUrls.set(f.path, URL.createObjectURL(f.blob));
    },
  };

  const V = SN.isElectron ? E.vault : WebVault;

  SN.fs = {
    ...V,
    /** URL zum Anzeigen einer Vault-Datei (Bilder) */
    url(p) {
      if (!p) return '';
      if (/^(https?:|data:|blob:|vault:)/i.test(p)) return p;
      if (SN.isElectron) return 'vault://local/' + p.split('/').map(encodeURIComponent).join('/');
      return blobUrls.get(p) || '';
    },
    async readJSON(p, fallback) { try { return JSON.parse(await V.read(p)); } catch { return fallback; } },
    async writeJSON(p, obj) { return V.write(p, JSON.stringify(obj, null, 2)); },
    async saveImage(fileOrBuffer, dir = 'attachments', nameHint = '') {
      let buf, ext = 'png';
      if (fileOrBuffer instanceof Blob) {
        buf = await SN.readFileAsArrayBuffer(fileOrBuffer);
        ext = (fileOrBuffer.type.split('/')[1] || SN.ext(fileOrBuffer.name || '') || 'png').replace('jpeg', 'jpg').replace('svg+xml', 'svg');
      } else buf = fileOrBuffer;
      const m = String(nameHint).match(/\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i);
      if (m) { ext = m[1].toLowerCase().replace('jpeg', 'jpg'); nameHint = nameHint.slice(0, -m[0].length); }
      const base = SN.slug(nameHint).replace(/\s+/g, '-').toLowerCase().slice(0, 30);
      const p = `${dir}/${base ? base + '-' : ''}${SN.uid()}.${ext}`;
      await V.writeBin(p, new Uint8Array(buf));
      return p;
    },
    async uniqueNotePath(folder, name) {
      const clean = SN.slug(name) || 'Unbenannt';
      let p = (folder ? folder + '/' : '') + clean + '.md', i = 1;
      while (await V.exists(p)) p = (folder ? folder + '/' : '') + `${clean} ${++i}.md`;
      return p;
    },
  };

  // ---------- Einstellungen (pro Benutzer) ----------
  const DEFAULTS = {
    theme: 'crimson', particles: 'auto', particleDensity: 1, bgImage: '', bgOpacity: 0.35, bgBlur: 2,
    accent: '', uiScale: 1, editorFont: 'serif', editorSize: 17, editorWidth: 'normal', spellcheck: true,
    name: 'Kurumi', dailyGoal: 500, sounds: true, motif: true, showRightPanel: true, showSidebar: true,
    typewriter: false, focusLen: 25, breakLen: 5, longBreakLen: 15, lastView: 'home', openTabs: [], activeTab: null,
    graph: { tags: false, orphans: true, unresolved: true, repel: 1, link: 1, size: 1, labels: true },
  };
  let saveTimer;
  SN.settings = { ...DEFAULTS };
  SN.loadSettings = async () => {
    try {
      const raw = SN.isElectron ? (await E.cfg.get()).settings : JSON.parse(localStorage.getItem('sn-settings') || 'null');
      SN.settings = { ...DEFAULTS, ...(raw || {}), graph: { ...DEFAULTS.graph, ...(raw?.graph || {}) } };
    } catch { SN.settings = { ...DEFAULTS }; }
    return SN.settings;
  };
  SN.saveSettings = (patch) => {
    Object.assign(SN.settings, patch || {});
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (SN.isElectron) E.cfg.set({ settings: SN.settings }).catch(() => {});
      else try { localStorage.setItem('sn-settings', JSON.stringify(SN.settings)); } catch {}
    }, 250);
    SN.emit('settings', SN.settings, patch);
  };

  // ---------- Daten-Stores im Vault (.spirit/*.json) ----------
  SN.data = {};
  SN.Store = class {
    constructor(name, def) { this.name = name; this.path = `.spirit/${name}.json`; this.def = def; this.value = structuredClone(def); this.pending = false; this._save = SN.debounce(() => { this.pending = false; return SN.fs.writeJSON(this.path, this.value).catch(e => SN.toast('Speichern fehlgeschlagen: ' + e.message, 'err')); }, 300); }
    async load() { this.value = await SN.fs.readJSON(this.path, structuredClone(this.def)); if (this.def && !Array.isArray(this.def)) this.value = { ...structuredClone(this.def), ...this.value }; return this.value; }
    save() { this.pending = true; this._save(); SN.emit('data:' + this.name, this.value); }
    flush() { if (this.pending) return this._save.flush(); }
  };
})();
