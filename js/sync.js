/* Spirit Notes – Synchronisation PC <-> iPhone über ein privates GitHub-Repo
   Ablauf: 3-Wege-Abgleich (letzter Stand / dieses Gerät / GitHub) pro Datei.
   - Nur hier geändert  -> hochladen      - Nur dort geändert -> herunterladen
   - Beide geändert     -> Planer/Anime/Statistik werden zusammengeführt, Notizen bekommen eine Konfliktkopie (nichts geht verloren) */
(() => {
  const S = SN.sync = { state: 'off', last: null, error: null, running: false, cfg: null, apiBase: (() => { try { return localStorage.getItem('sn-api-base') || 'https://api.github.com'; } catch { return 'https://api.github.com'; } })() };
  const h = SN.h, $ = SN.$;
  const STATE_FILE = '.spirit/sync-state.json';
  const SHARED_FILE = '.spirit/shared-settings.json';
  const SHARED_KEYS = ['theme', 'accent', 'bgImage', 'bgOpacity', 'bgBlur', 'particles', 'particleDensity', 'motif', 'name', 'dailyGoal', 'editorFont', 'editorSize', 'editorWidth', 'focusLen', 'breakLen', 'longBreakLen', 'graph', 'sounds'];
  const IGN = [/^\.spirit\/(history|trash)\//, /^\.spirit\/sync-/, /(^|\/)\.git\//, /(^|\/)\.obsidian\//, /(^|\/)node_modules\//, /(^|\/)(Thumbs\.db|desktop\.ini|\.DS_Store)$/i, /^README\.md$/, /^\.nojekyll$/];
  S.ignored = (p) => IGN.some(r => r.test(p));
  S.isText = (p) => /\.(md|markdown|txt|json|html|css|js|csv|svg)$/i.test(p) || !/\.[^./]+$/.test(SN.basename(p));
  S.device = () => S.cfg?.device || (SN.isElectron ? 'PC' : (/iPhone/.test(navigator.userAgent) ? 'iPhone' : /iPad/.test(navigator.userAgent) ? 'iPad' : 'Handy'));

  // ---------- Hilfen ----------
  const enc = new TextEncoder(), dec = new TextDecoder('utf-8', { ignoreBOM: true });
  const toB64 = (bytes) => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); };
  const fromB64 = (b64) => { const s = atob(String(b64 || '').replace(/\s/g, '')); const out = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i); return out; };
  S.gitSha = async (bytes) => {
    const head = enc.encode(`blob ${bytes.length}\0`);
    const all = new Uint8Array(head.length + bytes.length); all.set(head); all.set(bytes, head.length);
    const d = await crypto.subtle.digest('SHA-1', all);
    return [...new Uint8Array(d)].map(x => x.toString(16).padStart(2, '0')).join('');
  };
  async function pool(items, n, fn) {
    const out = []; let i = 0;
    await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } }));
    return out;
  }
  const deepEq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const b64url = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64url = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

  // ---------- Konfiguration ----------
  S.load = async () => {
    S.cfg = null;
    try {
      if (SN.isElectron) { const c = SN.settings.sync; if (c && c.owner) { const t = await window.spirit.secret.get('sync-token'); if (t) S.cfg = { ...c, token: t }; } }
      else S.cfg = JSON.parse(localStorage.getItem('sn-sync') || 'null');
    } catch { S.cfg = null; }
    if (S.cfg && (!S.cfg.token || !S.cfg.owner || !S.cfg.repo)) S.cfg = null;
    S.setState(S.cfg ? 'idle' : 'off');
    return S.cfg;
  };
  S.saveCfg = async (cfg) => {
    if (SN.isElectron) {
      await window.spirit.secret.set('sync-token', cfg ? cfg.token : '');
      SN.saveSettings({ sync: cfg ? { owner: cfg.owner, repo: cfg.repo, branch: cfg.branch || 'main', appRepo: cfg.appRepo || '', device: cfg.device || 'PC' } : null });
    } else {
      try { cfg ? localStorage.setItem('sn-sync', JSON.stringify(cfg)) : localStorage.removeItem('sn-sync'); } catch { }
    }
    S.cfg = cfg;
    S.setState(cfg ? 'idle' : 'off');
  };
  S.code = () => b64url(JSON.stringify({ o: S.cfg.owner, r: S.cfg.repo, b: S.cfg.branch || 'main', a: S.cfg.appRepo || '', t: S.cfg.token }));
  S.parseCode = (code) => {
    code = String(code || '').trim().replace(/^.*#setup=/, '').replace(/[\s"]/g, '');
    const j = JSON.parse(unb64url(code));
    if (!j.o || !j.r || !j.t) throw new Error('Code unvollständig');
    return { owner: j.o, repo: j.r, branch: j.b || 'main', appRepo: j.a || '', token: j.t };
  };
  S.appUrl = () => S.cfg && S.cfg.appRepo ? `https://${S.cfg.owner.toLowerCase()}.github.io/${S.cfg.appRepo}/` : '';

  // ---------- GitHub-API ----------
  async function api(method, path, body, cfg = S.cfg) {
    const url = S.apiBase + path;
    const headers = { Authorization: 'Bearer ' + cfg.token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    if (SN.isElectron) return window.spirit.net.api({ url, method, headers, body: body == null ? undefined : JSON.stringify(body) });
    const r = await fetch(url, { method, headers: body == null ? headers : { ...headers, 'Content-Type': 'application/json' }, body: body == null ? undefined : JSON.stringify(body), cache: 'no-store' });
    let json = null; try { json = await r.json(); } catch { }
    return { status: r.status, json };
  }
  function apiErr(res, what) {
    const m = (res.json && res.json.message) || '';
    if (res.status === 401) return new Error('Der Token ist ungültig oder abgelaufen (401). Erstell auf GitHub einen neuen.');
    if (res.status === 403) return new Error(/rate limit/i.test(m) ? 'GitHub-Limit erreicht – versuch es in ein paar Minuten nochmal.' : 'Keine Berechtigung (403). Hat der Token „Contents: Read and write“ für dieses Repo?');
    if (res.status === 404) return new Error(`Nicht gefunden (404): ${what}. Stimmen Benutzername und Repo-Name, und hat der Token Zugriff darauf?`);
    return new Error(`${what}: Fehler ${res.status}${m ? ' – ' + m : ''}`);
  }
  async function getHead(R, branch, cfg) {
    const ref = await api('GET', `${R}/git/ref/heads/${encodeURIComponent(branch)}`, null, cfg);
    if (ref.status === 200 && ref.json?.object?.sha) {
      const c = await api('GET', `${R}/git/commits/${ref.json.object.sha}`, null, cfg);
      if (c.status !== 200) throw apiErr(c, 'Commit lesen');
      return { branch, commit: ref.json.object.sha, tree: c.json.tree.sha };
    }
    if (ref.status === 401 || ref.status === 403) throw apiErr(ref, 'Repo');
    const repo = await api('GET', R, null, cfg);
    if (repo.status !== 200) throw apiErr(repo, `Repo „${R.split('/').pop()}“`);
    const def = repo.json.default_branch;
    if (def && def !== branch) {
      const r2 = await api('GET', `${R}/git/ref/heads/${encodeURIComponent(def)}`, null, cfg);
      if (r2.status === 200) { if (cfg === S.cfg) { S.cfg.branch = def; S.saveCfg(S.cfg); } return getHead(R, def, cfg); }
    }
    return null; // leeres Repo
  }
  async function initRepo(R, cfg, text = 'Spirit Notes – Datenspeicher.\nBitte nicht von Hand bearbeiten.') {
    const res = await api('PUT', `${R}/contents/.spirit/sync-info.md`, { message: 'Spirit Notes einrichten', content: toB64(enc.encode(text)) }, cfg);
    if (res.status !== 201 && res.status !== 200 && res.status !== 422) throw apiErr(res, 'Repo vorbereiten');
  }
  async function remoteTree(R, head, cfg) {
    const t = await api('GET', `${R}/git/trees/${head.tree}?recursive=1`, null, cfg);
    if (t.status !== 200) throw apiErr(t, 'Dateiliste');
    const m = new Map();
    for (const e of t.json.tree || []) if (e.type === 'blob') m.set(e.path, e.sha);
    return m;
  }
  async function getBlob(R, sha, cfg) {
    const b = await api('GET', `${R}/git/blobs/${sha}`, null, cfg);
    if (b.status !== 200) throw apiErr(b, 'Datei laden');
    return fromB64(b.json.content);
  }
  async function putBlob(R, bytes, cfg) {
    const b = await api('POST', `${R}/git/blobs`, { content: toB64(bytes), encoding: 'base64' }, cfg);
    if (b.status !== 201) throw apiErr(b, 'Datei hochladen');
    return b.json.sha;
  }
  async function commit(R, head, entries, message, cfg) {
    const t = await api('POST', `${R}/git/trees`, { base_tree: head.tree, tree: entries }, cfg);
    if (t.status !== 201) throw apiErr(t, 'Änderungen vorbereiten');
    const c = await api('POST', `${R}/git/commits`, { message, tree: t.json.sha, parents: [head.commit] }, cfg);
    if (c.status !== 201) throw apiErr(c, 'Speichern auf GitHub');
    const u = await api('PATCH', `${R}/git/refs/heads/${encodeURIComponent(head.branch)}`, { sha: c.json.sha, force: false }, cfg);
    if (u.status === 422 || u.status === 409) { const e = new Error('Gleichzeitige Änderung – nochmal'); e.retry = true; throw e; }
    if (u.status !== 200) throw apiErr(u, 'Speichern auf GitHub');
    return c.json.sha;
  }

  // ---------- Lokale Dateien (PC: echter Ordner, iPhone: App-Speicher) ----------
  const shaCache = new Map();
  const local = {
    async scan() {
      const m = new Map();
      if (SN.isElectron) { for (const f of await window.spirit.sync.scan()) if (!S.ignored(f.path)) m.set(f.path, f.sha); return m; }
      const recs = (await SN.fs.records()).filter(r => !S.ignored(r.path));
      await pool(recs, 6, async (r) => {
        const key = `${r.mtime}:${r.size}`;
        let c = shaCache.get(r.path);
        if (!c || c.key !== key) { c = { key, sha: await S.gitSha(await SN.fs.readBin(r.path)) }; shaCache.set(r.path, c); }
        m.set(r.path, c.sha);
      });
      return m;
    },
    async read(p) { return SN.isElectron ? new Uint8Array(await window.spirit.vault.readBin(p)) : SN.fs.readBin(p); },
    async write(p, bytes) {
      if (!SN.isElectron && S.isText(p)) await SN.fs.write(p, dec.decode(bytes));
      else await SN.fs.writeBin(p, bytes);
      shaCache.delete(p);
    },
    async remove(p) { try { await SN.fs.remove(p); } catch { } shaCache.delete(p); },
  };

  // ---------- Zusammenführen von Planer/Anime/Statistik ----------
  function merge3(b, l, r, counters) {
    if (deepEq(l, r)) return l;
    if (l === undefined) return deepEq(r, b) ? undefined : r;
    if (r === undefined) return deepEq(l, b) ? undefined : l;
    if (deepEq(l, b)) return r;
    if (deepEq(r, b)) return l;
    if (typeof l === 'number' && typeof r === 'number' && counters) { const bb = typeof b === 'number' ? b : 0; return bb + (l - bb) + (r - bb); }
    if (Array.isArray(l) && Array.isArray(r)) {
      const hasId = (a) => a.length && a.every(x => x && typeof x === 'object' && x.id != null);
      const bArr = Array.isArray(b) ? b : [];
      if ((hasId(l) || !l.length) && (hasId(r) || !r.length)) {
        const bm = new Map(bArr.filter(x => x && x.id != null).map(x => [x.id, x]));
        const lm = new Map(l.map(x => [x.id, x])), rm = new Map(r.map(x => [x.id, x]));
        const ids = [...new Set([...r.map(x => x.id), ...l.map(x => x.id)])];
        const out = [];
        for (const id of ids) { const v = merge3(bm.get(id), lm.get(id), rm.get(id), counters); if (v !== undefined) out.push(v); }
        return out;
      }
      const seen = new Set(); const out = [];
      for (const x of [...r, ...l]) { const k = JSON.stringify(x); if (!seen.has(k)) { seen.add(k); out.push(x); } }
      return out;
    }
    if (l && r && typeof l === 'object' && typeof r === 'object') {
      const out = {};
      for (const k of new Set([...Object.keys(r), ...Object.keys(l)])) { const v = merge3(b ? b[k] : undefined, l[k], r[k], counters); if (v !== undefined) out[k] = v; }
      return out;
    }
    return l; // beide anders geändert -> dieses Gerät gewinnt
  }
  S.merge3 = merge3;
  const conflictName = (p) => {
    const d = new Date(); const stamp = `${SN.dateKey(d)} ${SN.pad(d.getHours())}-${SN.pad(d.getMinutes())}`;
    const m = p.match(/^(.*?)(\.[^./]+)?$/);
    return `${m[1]} (Konflikt ${S.device()} ${stamp})${m[2] || ''}`;
  };

  // ---------- Ein Sync-Durchlauf ----------
  async function syncOnce() {
    const cfg = S.cfg;
    const R = `/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}`;
    let head = await getHead(R, cfg.branch || 'main', cfg);
    if (!head) { await initRepo(R, cfg); head = await getHead(R, cfg.branch || 'main', cfg); if (!head) throw new Error('Das Repo konnte nicht vorbereitet werden.'); }
    const remote = new Map([...(await remoteTree(R, head, cfg))].filter(([p]) => !S.ignored(p)));
    const loc = await local.scan();
    const state = await SN.fs.readJSON(STATE_FILE, null);
    const base = (state && state.owner === cfg.owner && state.repo === cfg.repo && state.files) || {};
    const final = {}, applied = [], entries = [], toUpload = [];
    let downloaded = 0, deletedLocal = 0, conflicts = 0;

    const paths = new Set([...remote.keys(), ...loc.keys(), ...Object.keys(base)]);
    const plan = [];
    for (const p of paths) {
      if (S.ignored(p)) continue;
      const l = loc.get(p) || null, r = remote.get(p) || null, b = base[p] || null;
      if (l === r) { if (l) final[p] = l; continue; }
      if (l === b) plan.push(r ? { op: 'down', p, r } : { op: 'delLocal', p });
      else if (r === b) plan.push(l ? { op: 'up', p } : { op: 'delRemote', p });
      else plan.push({ op: 'conflict', p, l, r, b });
    }
    // Herunterladen / lokal löschen
    await pool(plan.filter(x => x.op === 'down'), 4, async (x) => { await local.write(x.p, await getBlob(R, x.r, cfg)); final[x.p] = x.r; applied.push(x.p); downloaded++; });
    for (const x of plan.filter(x => x.op === 'delLocal')) { await local.remove(x.p); applied.push(x.p); deletedLocal++; }
    // Konflikte
    for (const x of plan.filter(x => x.op === 'conflict')) {
      if (!x.l) { await local.write(x.p, await getBlob(R, x.r, cfg)); final[x.p] = x.r; applied.push(x.p); continue; } // hier gelöscht, dort geändert -> behalten
      if (!x.r) { toUpload.push(x.p); continue; }                                                                    // dort gelöscht, hier geändert -> behalten
      conflicts++;
      if (/^\.spirit\/[^/]+\.json$/.test(x.p)) {
        const parse = (bytes) => { try { return JSON.parse(dec.decode(bytes)); } catch { return undefined; } };
        const bObj = x.b ? parse(await getBlob(R, x.b, cfg)) : undefined;
        const merged = merge3(bObj, parse(await local.read(x.p)), parse(await getBlob(R, x.r, cfg)), /stats\.json$/.test(x.p));
        await local.write(x.p, enc.encode(JSON.stringify(merged, null, 2)));
        toUpload.push(x.p); applied.push(x.p);
      } else {
        const mine = await local.read(x.p);
        const cp = conflictName(x.p);
        await local.write(cp, mine);
        await local.write(x.p, await getBlob(R, x.r, cfg));
        final[x.p] = x.r; toUpload.push(cp); applied.push(x.p, cp);
      }
    }
    for (const x of plan.filter(x => x.op === 'up')) toUpload.push(x.p);
    // Hochladen
    const ups = await pool(toUpload, 4, async (p) => { const sha = await putBlob(R, await local.read(p), cfg); return { path: p, mode: '100644', type: 'blob', sha }; });
    entries.push(...ups);
    for (const x of plan.filter(x => x.op === 'delRemote')) entries.push({ path: x.p, mode: '100644', type: 'blob', sha: null });
    let newHead = head.commit;
    if (entries.length) newHead = await commit(R, head, entries, `Sync von ${S.device()} – ${SN.fmtDate(new Date(), true)}`, cfg);
    for (const e of entries) { if (e.sha) final[e.path] = e.sha; else delete final[e.path]; }
    await SN.fs.write(STATE_FILE, JSON.stringify({ owner: cfg.owner, repo: cfg.repo, head: newHead, at: Date.now(), files: final }));
    return { applied: [...new Set(applied)], uploaded: ups.length, deletedRemote: entries.filter(e => !e.sha).length, downloaded, deletedLocal, conflicts };
  }

  // ---------- Öffentlicher Ablauf ----------
  S.setState = (st) => {
    S.state = st;
    const el = $('#tb-sync'); if (!el) return;
    el.className = 'tb-btn tb-sync st-' + st;
    el.classList.toggle('hidden', st === 'off');
    el.innerHTML = SN.icon(st === 'error' || st === 'offline' ? 'cloud-off' : st === 'syncing' ? 'refresh' : 'cloud', 18) + (st === 'ok' ? '<i class="sync-ok"></i>' : st === 'error' ? '<i class="sync-err"></i>' : '');
    el.title = st === 'syncing' ? 'Synchronisiere …' : st === 'error' ? 'Sync-Fehler: ' + (S.error || '') + '\nKlicken zum Wiederholen' : st === 'offline' ? 'Offline – wird synchronisiert, sobald Internet da ist' : S.last ? `Synchronisiert ${SN.fmtRel(S.last)} – klicken für jetzt` : 'Jetzt synchronisieren';
    SN.emit('sync:state', st);
  };
  S.run = async ({ silent = true } = {}) => {
    if (!S.cfg) return null;
    if (S.running) { S.again = true; return null; }
    if (navigator.onLine === false) { S.setState('offline'); return null; }
    S.running = true; S.setState('syncing');
    let res = null;
    try {
      await SN.editor.saveAll?.();
      await Promise.all(Object.values(SN.data).map(s => s.flush && s.flush()));
      for (let i = 0; i < 4; i++) { try { res = await syncOnce(); break; } catch (e) { if (e.retry && i < 3) { await SN.sleep(400 + i * 600); continue; } throw e; } }
      S.last = Date.now(); S.error = null; S.setState('ok');
      if (res.applied.length) await afterApply(res.applied);
      const parts = [];
      if (res.downloaded) parts.push(`${res.downloaded} geholt`);
      if (res.uploaded) parts.push(`${res.uploaded} hochgeladen`);
      if (res.deletedLocal + res.deletedRemote) parts.push(`${res.deletedLocal + res.deletedRemote} gelöscht`);
      if (res.conflicts) parts.push(`${res.conflicts} zusammengeführt`);
      if (!silent) SN.toast(parts.length ? 'Synchronisiert: ' + parts.join(', ') : 'Alles ist schon synchron ✦', 'ok');
      else if (res.downloaded || res.conflicts) SN.toast('Neues vom ' + (SN.isElectron ? 'Handy' : 'PC') + ': ' + parts.join(', '), 'info', 2500);
    } catch (e) {
      S.error = e.message || String(e);
      S.setState(navigator.onLine === false || /fetch|network|ERR_/i.test(S.error) ? 'offline' : 'error');
      if (!silent) SN.toast('Sync fehlgeschlagen: ' + S.error, 'err', 7000);
    } finally {
      S.running = false;
      if (S.again) { S.again = false; setTimeout(() => S.run(), 600); }
    }
    return res;
  };
  async function afterApply(paths) {
    for (const [name, st] of [['planner', SN.data.planner], ['anime', SN.data.anime], ['stats', SN.stats.store]]) if (st && paths.includes(`.spirit/${name}.json`)) await st.load();
    if (paths.includes(SHARED_FILE)) await applyShared();
    if (SN.fs.preloadBlobs) await SN.fs.preloadBlobs();
    await SN.notes.build();
    for (const p of paths) if (SN.editor.isOpen && SN.editor.isOpen(p)) SN.emit('note:external', p);
    SN.emit('files'); SN.emit('stats');
    SN.app.refresh && SN.app.refresh();
  }

  // ---------- Design & Name auf allen Geräten gleich ----------
  let applyingShared = false;
  const writeShared = SN.debounce(async () => {
    if (!S.cfg) return;
    const obj = {}; for (const k of SHARED_KEYS) if (SN.settings[k] !== undefined) obj[k] = SN.settings[k];
    const txt = JSON.stringify(obj, null, 2);
    const old = await SN.fs.read(SHARED_FILE).catch(() => null);
    if (old !== txt) { await SN.fs.write(SHARED_FILE, txt); S.soon(); }
  }, 800);
  async function applyShared() {
    const obj = await SN.fs.readJSON(SHARED_FILE, null); if (!obj) return;
    const patch = {}; for (const k of SHARED_KEYS) if (obj[k] !== undefined && !deepEq(obj[k], SN.settings[k])) patch[k] = obj[k];
    if (!Object.keys(patch).length) return;
    applyingShared = true; SN.saveSettings(patch); applyingShared = false;
    SN.themes.apply();
  }
  SN.on('settings', (s, patch) => { if (applyingShared || !patch || !S.cfg) return; if (Object.keys(patch).some(k => SHARED_KEYS.includes(k))) writeShared(); });

  // ---------- Automatik ----------
  S.soon = SN.debounce(() => S.run(), SN.isElectron ? 15000 : 4000);
  let timer = null, wired = false;
  S.start = () => {
    clearInterval(timer);
    if (!S.cfg) return;
    timer = setInterval(() => { if (!document.hidden) S.run(); }, SN.isElectron ? 180000 : 60000);
    if (wired) return; wired = true;
    for (const ev of ['note:updated', 'note:renamed', 'note:deleted', 'data:planner', 'data:anime', 'images']) SN.on(ev, () => { if (S.cfg && !S.running) S.soon(); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && S.cfg && (!S.last || Date.now() - S.last > 20000)) S.run(); });
    window.addEventListener('online', () => S.cfg && S.run());
    window.addEventListener('focus', () => { if (S.cfg && SN.isElectron && (!S.last || Date.now() - S.last > 60000)) S.run(); });
  };

  // ---------- Verbinden ----------
  S.connect = async (cfg) => {
    const R = `/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}`;
    const t = await api('GET', R, null, cfg);
    if (t.status !== 200) throw apiErr(t, `Repo „${cfg.repo}“`);
    if (t.json && t.json.private === false) SN.toast('Achtung: Dein Daten-Repo ist öffentlich! Stell es auf GitHub auf „Private“.', 'warn', 9000);
    if (t.json && t.json.permissions && t.json.permissions.push === false) throw new Error('Der Token darf nicht in dieses Repo schreiben. Gib ihm „Contents: Read and write“.');
    await S.saveCfg({ ...cfg, device: cfg.device || S.device() });
    S.start();
    const firstDesktop = SN.isElectron;
    const res = await S.run({ silent: false });
    if (firstDesktop) writeShared();
    return res;
  };
  S.disconnect = async () => { await S.saveCfg(null); clearInterval(timer); SN.toast('Synchronisation getrennt. Deine Daten bleiben auf diesem Gerät.', 'info'); };

  // ---------- Handy-App auf GitHub Pages veröffentlichen (nur PC) ----------
  S.publishApp = async (onStep = () => {}) => {
    if (!SN.isElectron || !S.cfg || !S.cfg.appRepo) throw new Error('Kein App-Repo eingetragen');
    const cfg = S.cfg;
    const R = `/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.appRepo)}`;
    onStep('Prüfe App-Repo …');
    const info = await api('GET', R, null, cfg);
    if (info.status !== 200) throw apiErr(info, `App-Repo „${cfg.appRepo}“`);
    if (info.json.private) throw new Error(`Das App-Repo „${cfg.appRepo}“ muss öffentlich (Public) sein, damit GitHub Pages kostenlos funktioniert. Es enthält nur das Programm, keine Daten.`);
    let head = await getHead(R, info.json.default_branch || 'main', cfg);
    if (!head) { await initRepo(R, cfg, 'Spirit Notes – Handy-App'); head = await getHead(R, info.json.default_branch || 'main', cfg); }
    onStep('Lese Programmdateien …');
    const files = await window.spirit.appBundle();
    const remote = await remoteTree(R, head, cfg);
    const want = new Map(files.map(f => [f.path, f]));
    const changed = files.filter(f => remote.get(f.path) !== f.sha);
    let n = 0;
    const entries = await pool(changed, 4, async (f) => { const sha = await putBlob(R, fromB64(f.b64), cfg); onStep(`Lade hoch … ${++n}/${changed.length}`); return { path: f.path, mode: '100644', type: 'blob', sha }; });
    for (const p of remote.keys()) if (!want.has(p) && p !== '.spirit/sync-info.md') entries.push({ path: p, mode: '100644', type: 'blob', sha: null });
    if (entries.length) { onStep('Speichere auf GitHub …'); await commit(R, head, entries, 'Spirit Notes Handy-App aktualisiert', cfg); }
    onStep('Schalte GitHub Pages ein …');
    let pages = await api('GET', `${R}/pages`, null, cfg);
    let manual = false;
    if (pages.status === 404) {
      const p = await api('POST', `${R}/pages`, { source: { branch: head.branch, path: '/' } }, cfg);
      if (p.status !== 201 && p.status !== 409) manual = true;
    } else if (pages.status !== 200) manual = true;
    return { url: S.appUrl(), uploaded: changed.length, manual, settingsUrl: `https://github.com/${cfg.owner}/${cfg.appRepo}/settings/pages` };
  };

  // ======================================================================
  //  Oberfläche
  // ======================================================================
  S.guide = () => {
    const link = (u, t) => `<a href="${u}" target="_blank" rel="noopener">${t}</a>`;
    SN.modal({ title: SN.icon('cloud', 20) + ' Sync einrichten – Anleitung <span class="jp">同期</span>', width: 720, body: `
      <div class="guide">
        <p class="muted">Einmal ca. 10 Minuten – danach läuft alles automatisch. Deine Daten liegen in <b>deinem eigenen privaten</b> GitHub-Repo.</p>
        <ol>
          <li><b>GitHub-Account</b> erstellen (kostenlos): ${link('https://github.com/signup', 'github.com/signup')}</li>
          <li><b>Daten-Repo</b> anlegen: ${link('https://github.com/new', 'github.com/new')} → Name <code>spirit-vault</code> → <b>Private</b> → „Create repository“.</li>
          <li><b>App-Repo</b> anlegen: nochmal ${link('https://github.com/new', 'github.com/new')} → Name <code>spirit-app</code> → <b>Public</b> → „Create repository“.<br><small class="faint">Öffentlich, weil GitHub dort kostenlos deine Handy-App hostet. Da liegt nur das Programm, keine Notizen.</small></li>
          <li><b>Token</b> erstellen: ${link('https://github.com/settings/personal-access-tokens/new', 'github.com/settings/personal-access-tokens/new')}
            <ul>
              <li>Name: <code>Spirit Notes</code> · Ablaufdatum: so lang wie möglich</li>
              <li>Repository access: <b>Only select repositories</b> → <code>spirit-vault</code> und <code>spirit-app</code></li>
              <li>Permissions → Repository permissions: <b>Contents → Read and write</b> und <b>Pages → Read and write</b></li>
              <li>„Generate token“ → den Token (<code>github_pat_…</code>) kopieren</li>
            </ul></li>
          <li>Hier in Spirit Notes: Benutzername, Repo-Namen und Token eintragen → <b>Verbinden</b>.</li>
          <li><b>„Handy-App veröffentlichen“</b> klicken (1–2 Minuten warten, bis GitHub sie online hat).</li>
          <li><b>„iPhone verbinden“</b> → QR-Code mit der iPhone-Kamera scannen → in Safari <b>Teilen ⬆ → „Zum Home-Bildschirm“</b>.</li>
        </ol>
        <div class="callout-mini">${SN.icon('alert', 16)} Gib den Token niemandem – wer ihn hat, kann deine Notizen lesen.</div>
      </div>`, buttons: [{ label: 'Alles klar', primary: true }] });
  };

  S.pairModal = () => {
    const url = S.appUrl() + '#setup=' + S.code();
    const box = h('div.pair');
    const qr = new window.QRCodeLib(-1, window.QRErrorCorrectLevel.M);
    qr.addData(url); qr.make();
    const n = qr.getModuleCount(), q = 4, size = n + q * 2;
    let path = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.isDark(y, x)) path += `M${x + q} ${y + q}h1v1h-1z`;
    box.append(
      h('div.qr', { html: `<svg viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#fff"/><path d="${path}" fill="#000"/></svg>` }),
      h('div.pair-steps', { html: `<ol><li>Öffne die <b>Kamera</b> auf deinem iPhone und halte sie auf den Code.</li><li>Tippe auf den gelben Link → Spirit Notes öffnet sich in <b>Safari</b>.</li><li>Tippe auf <b>Teilen ⬆</b> → <b>„Zum Home-Bildschirm“</b> → Hinzufügen.</li><li>Öffne die App vom Home-Bildschirm. Fertig – alles synchronisiert sich automatisch.</li></ol>
        <p class="faint" style="font-size:11.5px">Klappt der Scan nicht? Öffne <b>${SN.esc(S.appUrl())}</b> auf dem iPhone und füge dort den Einrichtungscode ein:</p>` },
        h('div.row', h('input.input', { value: S.code(), readonly: true, style: { fontSize: '11px' } }), h('button.btn.small', { onclick: async () => { await navigator.clipboard.writeText(S.code()); SN.toast('Code kopiert', 'ok'); } }, 'Kopieren')),
        h('div.callout-mini', { html: `${SN.icon('alert', 15)} Der Code enthält deinen Token – zeig ihn niemandem.` })));
    SN.modal({ title: SN.icon('smartphone', 20) + ' iPhone verbinden', body: box, width: 760, buttons: [{ label: 'Fertig', primary: true }] });
  };

  // Einstellungen-Karte (PC & Handy)
  S.renderSettings = () => {
    const card = h('div.card.ornate.set-card.sync-card', h('div.card-title', { html: `${SN.icon('cloud', 16)} Synchronisation – PC ↔ iPhone <span class="jp">同期</span>` }));
    if (!S.cfg) {
      card.append(h('p.muted', { style: { fontSize: '12.5px', marginTop: 0 } }, SN.isElectron
        ? 'Verbinde Spirit Notes mit einem privaten GitHub-Repo. Dann sind Notizen, Bilder, Planer, Anime-Liste, Statistik und Design auf PC und iPhone immer gleich.'
        : 'Verbinde die App mit deinem PC: Scanne am PC unter Einstellungen → Synchronisation → „iPhone verbinden“ den QR-Code – oder füg hier den Einrichtungscode ein.'));
      if (!SN.isElectron) {
        const code = h('textarea.input', { rows: 3, placeholder: 'Einrichtungscode hier einfügen …', spellcheck: 'false', style: { fontSize: '12px' } });
        card.append(code, h('div.row', { style: { margin: '8px 0 14px' } }, h('button.btn.primary', { html: SN.icon('cloud', 15) + '<span>Mit Code verbinden</span>', onclick: async () => {
          try { const cfg = S.parseCode(code.value); await S.connect(cfg); SN.views.settings.render(); } catch (e) { SN.toast('Verbinden fehlgeschlagen: ' + e.message, 'err', 7000); }
        } })), h('div.rp-h', 'Oder von Hand'));
      }
      const owner = h('input.input', { placeholder: 'GitHub-Benutzername', spellcheck: 'false', autocapitalize: 'off' });
      const repo = h('input.input', { value: 'spirit-vault', spellcheck: 'false', autocapitalize: 'off' });
      const appRepo = h('input.input', { value: 'spirit-app', spellcheck: 'false', autocapitalize: 'off' });
      const token = h('input.input', { type: 'password', placeholder: 'github_pat_…', spellcheck: 'false', autocapitalize: 'off' });
      const btn = h('button.btn.primary', { html: SN.icon('cloud', 15) + '<span>Verbinden & synchronisieren</span>' });
      btn.onclick = async () => {
        const cfg = { owner: owner.value.trim(), repo: repo.value.trim(), appRepo: appRepo.value.trim(), branch: 'main', token: token.value.trim() };
        if (!cfg.owner || !cfg.repo || !cfg.token) return SN.toast('Bitte Benutzername, Daten-Repo und Token ausfüllen', 'warn');
        btn.disabled = true; btn.querySelector('span').textContent = 'Verbinde …';
        try { await S.connect(cfg); SN.views.settings.render(); }
        catch (e) { SN.toast('Verbinden fehlgeschlagen: ' + e.message, 'err', 8000); btn.disabled = false; btn.querySelector('span').textContent = 'Verbinden & synchronisieren'; }
      };
      card.append(h('div.grid2', h('label.field', 'GitHub-Benutzername', owner), h('label.field', 'Daten-Repo (privat)', repo)),
        h('div.grid2', { style: { marginTop: '10px' } }, h('label.field', 'App-Repo (öffentlich, für die Handy-App)', appRepo), h('label.field', 'Token', token)),
        h('div.row', { style: { marginTop: '14px', flexWrap: 'wrap' } }, btn, h('button.btn', { html: SN.icon('book', 15) + '<span>Anleitung</span>', onclick: S.guide })));
      return card;
    }
    const st = h('div.sync-status');
    const drawStatus = () => { st.innerHTML = `${SN.icon(S.state === 'error' ? 'alert' : 'cloud', 18)}<div><b>${S.state === 'syncing' ? 'Synchronisiere …' : S.state === 'error' ? 'Fehler' : S.state === 'offline' ? 'Offline' : 'Verbunden'}</b><small>${SN.esc(S.cfg.owner)}/${SN.esc(S.cfg.repo)} · ${S.state === 'error' ? SN.esc(S.error || '') : S.last ? 'zuletzt ' + SN.fmtRel(S.last) : 'noch nicht synchronisiert'}</small></div>`; st.className = 'sync-status st-' + S.state; };
    drawStatus();
    const off = SN.on('sync:state', () => { if (!st.isConnected) return off(); drawStatus(); });
    const row = h('div.row', { style: { flexWrap: 'wrap', marginTop: '12px' } },
      h('button.btn.primary', { html: SN.icon('refresh', 15) + '<span>Jetzt synchronisieren</span>', onclick: () => S.run({ silent: false }) }));
    if (SN.isElectron) {
      const pub = h('button.btn', { html: SN.icon('upload', 15) + '<span>Handy-App veröffentlichen</span>' });
      pub.onclick = async () => {
        if (!S.cfg.appRepo) { const v = await SN.prompt('Name des App-Repos (öffentlich)', 'spirit-app'); if (!v) return; S.cfg.appRepo = v; await S.saveCfg(S.cfg); }
        pub.disabled = true; const lab = pub.querySelector('span');
        try {
          const r = await S.publishApp((t) => lab.textContent = t);
          lab.textContent = 'Handy-App aktualisieren';
          SN.modal({ title: SN.icon('smartphone', 20) + ' Handy-App ist online', width: 560, body: `<p>Deine App ist unter <b>${SN.esc(r.url)}</b> erreichbar${r.uploaded ? ` (${r.uploaded} Dateien hochgeladen)` : ''}. GitHub braucht beim ersten Mal 1–2 Minuten, bis die Seite da ist.</p>${r.manual ? `<div class="callout-mini">${SN.icon('alert', 15)} GitHub Pages musst du einmal selbst einschalten: Öffne <a href="${r.settingsUrl}" target="_blank">${SN.esc(r.settingsUrl)}</a> → bei <b>Branch</b> „main“ und „/ (root)“ wählen → <b>Save</b>.</div>` : ''}<p>Danach: <b>„iPhone verbinden“</b> klicken und den QR-Code scannen.</p>`, buttons: [{ label: 'iPhone verbinden', primary: true, onClick: (c) => { c(); S.pairModal(); } }, { label: 'Schließen' }] });
        } catch (e) { SN.toast('Veröffentlichen fehlgeschlagen: ' + e.message, 'err', 9000); lab.textContent = 'Handy-App veröffentlichen'; }
        pub.disabled = false;
      };
      row.append(pub, h('button.btn', { html: SN.icon('smartphone', 15) + '<span>iPhone verbinden</span>', onclick: () => { if (!S.cfg.appRepo) return SN.toast('Veröffentliche zuerst die Handy-App', 'warn'); S.pairModal(); } }));
    }
    row.append(h('button.btn.danger', { html: SN.icon('x-circle', 15) + '<span>Trennen</span>', onclick: async () => { if (await SN.confirm('Synchronisation trennen?', 'Deine Daten bleiben auf diesem Gerät und auf GitHub. Es wird nur nicht mehr abgeglichen.', { danger: true, ok: 'Trennen' })) { await S.disconnect(); SN.views.settings.render(); } } }));
    card.append(st, row,
      h('p.faint', { style: { fontSize: '11.5px', margin: '12px 0 0' } }, SN.isElectron
        ? 'Synchronisiert automatisch beim Start, alle 3 Minuten und kurz nach Änderungen. Gleichzeitige Änderungen am selben Text landen als „(Konflikt …)“-Kopie – es geht nichts verloren.'
        : 'Synchronisiert automatisch beim Öffnen, jede Minute und kurz nach Änderungen.'));
    return card;
  };

  // ---------- Handy: Einrichtung über Link (#setup=…) ----------
  S.fromUrl = () => {
    const m = location.hash.match(/#setup=([\w-]+)/);
    if (!m) return null;
    try { return S.parseCode(m[1]); } catch { return null; }
  };
})();
