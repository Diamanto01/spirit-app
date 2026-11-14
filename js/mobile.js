/* Spirit Notes – iPhone-/Handy-Oberfläche: Navigation unten, Notizliste ↔ Editor, Long-Press-Menüs, Installation */
(() => {
  const M = SN.mobile = { active: false, stack: [] };
  const h = SN.h, $ = SN.$;
  M.detect = () => !SN.isElectron && (matchMedia('(max-width: 820px)').matches || (/iPhone|iPod|Android.+Mobile/.test(navigator.userAgent)));
  M.standalone = () => navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;

  M.init = () => {
    M.active = M.detect();
    document.body.classList.toggle('mobile', M.active);
    if (!M.active) return;
    document.body.classList.toggle('standalone', M.standalone());
    buildNav();
    buildEditorHead();
    longPress();
    keyboard();
    SN.on('editor:active', (p) => {
      $('#view-notes').classList.toggle('m-edit', !!p);
      if (p && M.stack[M.stack.length - 1] !== p) M.stack.push(p);
      if (M.stack.length > 30) M.stack.shift();
      updateHead();
    });
    SN.on('note:renamed', () => setTimeout(updateHead, 0));
    document.addEventListener('input', (e) => { if (e.target.classList && e.target.classList.contains('ed-title')) { const el = $('#m-edhead .m-title'); if (el) el.textContent = e.target.value; } });
    // Rechte Leiste als Overlay schließen, wenn man daneben tippt
    document.addEventListener('click', (e) => { const rp = $('#rightpanel'); if (document.body.classList.contains('m-rp') && !rp.contains(e.target) && !e.target.closest('.m-rp-btn')) document.body.classList.remove('m-rp'); }, true);
  };

  // ---------- Navigation unten ----------
  const MAIN = [['home', 'home', 'Home'], ['notes', 'feather', 'Notizen'], ['planner', 'calendar', 'Planer'], ['companion', 'heart', 'Freundin'], ['anime', 'tv', 'Anime']];
  const MORE = [['rewards', 'trophy', 'Belohnungen'], ['overview', 'table', 'Übersicht / Datenbank'], ['graph', 'graph', 'Graph'], ['gallery', 'image', 'Galerie'], ['settings', 'settings', 'Einstellungen']];
  function buildNav() {
    const nav = h('nav#mnav');
    for (const [v, i, l] of MAIN) nav.append(h('button.mn', { data: { view: v }, onclick: () => {
      if (v === 'notes' && SN.app.view === 'notes' && $('#view-notes').classList.contains('m-edit')) { M.back(true); return; }
      SN.app.show(v);
    } }, h('span.ico', { html: SN.icon(i, 22) }), h('small', l)));
    nav.append(h('button.mn', { data: { view: 'more' }, onclick: (e) => M.moreSheet() }, h('span.ico', { html: SN.icon('menu', 22) }), h('small', 'Mehr')));
    $('#app').append(nav);
    SN.on('view', (v) => SN.$$('#mnav .mn').forEach(b => b.classList.toggle('on', b.dataset.view === v || (b.dataset.view === 'more' && MORE.some(m => m[0] === v)))));
  }
  M.moreSheet = () => {
    const list = h('div.sheet-list');
    let m;
    const item = (icon, label, fn) => list.append(h('button.sheet-item', { onclick: () => { m.close(); fn(); } }, h('span.ico', { html: SN.icon(icon, 20) }), h('span', label), h('span.ico.chev', { html: SN.icon('chev-r', 16) })));
    for (const [v, i, l] of MORE) item(i, l, () => SN.app.show(v));
    item('search', 'Suchen', () => SN.palette.search());
    item('sun', 'Tagesnotiz', () => SN.app.dailyNote());
    if (SN.sync.cfg) item('refresh', 'Jetzt synchronisieren', () => SN.sync.run({ silent: false }));
    m = SN.modal({ title: SN.icon('sparkles', 18) + ' Mehr', body: list, width: 480, cls: 'sheet' });
  };

  // ---------- Editor-Kopf mit Zurück ----------
  function buildEditorHead() {
    const head = h('div#m-edhead',
      h('button.icon-btn', { title: 'Zurück', html: SN.icon('arrow-l', 22), onclick: () => M.back() }),
      h('div.m-title'),
      h('button.icon-btn', { title: 'Suchen', html: SN.icon('search', 20), onclick: () => SN.editor.find() }),
      h('button.icon-btn', { title: 'Zeitreise', html: SN.icon('history', 20), onclick: () => SN.editor.history() }),
      h('button.icon-btn.m-rp-btn', { title: 'Gliederung & Links', html: SN.icon('info', 20), onclick: () => { document.body.classList.toggle('m-rp'); SN.editor.renderRight(); } }));
    $('#editor-area').prepend(head);
    // Sidebar-Kopf: Suche & Sync
    const sbHead = $('.sb-head');
    sbHead.querySelector('.sb-title').innerHTML = 'Notizen <span class="jp">ノート</span>';
  }
  function updateHead() {
    const t = SN.editor.active;
    const el = $('#m-edhead .m-title'); if (el) el.textContent = t ? SN.noteName(t.path) : '';
  }
  M.back = (toList) => {
    if (!toList && M.stack.length > 1) {
      M.stack.pop();
      const prev = M.stack.pop();
      if (prev && SN.notes.get(prev)) { SN.editor.open(prev); return; }
    }
    M.stack = [];
    document.body.classList.remove('m-rp');
    $('#view-notes').classList.remove('m-edit');
    if (SN.editor.active) SN.editor.save(SN.editor.active);
    document.activeElement && document.activeElement.blur && document.activeElement.blur();
  };

  // ---------- Langes Drücken = Rechtsklick-Menü ----------
  function longPress() {
    let t = null, sx = 0, sy = 0, fired = false;
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      const target = e.target;
      if (target.closest('.ed-content, input, textarea, .graph-canvas')) return;
      const p = e.touches[0]; sx = p.clientX; sy = p.clientY; fired = false;
      clearTimeout(t);
      t = setTimeout(() => {
        fired = true;
        if (navigator.vibrate) navigator.vibrate(10);
        target.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: sx, clientY: sy }));
      }, 520);
    }, { passive: true });
    document.addEventListener('touchmove', (e) => { const p = e.touches[0]; if (Math.hypot(p.clientX - sx, p.clientY - sy) > 10) clearTimeout(t); }, { passive: true });
    document.addEventListener('touchend', (e) => { clearTimeout(t); if (fired) { e.preventDefault(); fired = false; } });
    document.addEventListener('contextmenu', (e) => { if (!e.isTrusted) return; if (!e.target.closest('.ed-content, input, textarea')) e.preventDefault(); });
  }

  // ---------- Tastatur (iOS) ----------
  function keyboard() {
    const vv = window.visualViewport; if (!vv) return;
    const upd = () => {
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty('--kb', kb + 'px');
      document.body.classList.toggle('kb-open', kb > 120);
    };
    vv.addEventListener('resize', upd); vv.addEventListener('scroll', upd); upd();
  }

  // ---------- Installation (Safari → Home-Bildschirm) ----------
  M.installHint = (withCode) => {
    if (M.standalone() || SN.isElectron) return;
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const body = h('div.install',
      h('div.install-icon', { html: `<img src="icons/icon-180.png" alt="">` }),
      h('p', 'Damit Spirit Notes wie eine echte App funktioniert (eigenes Icon, Vollbild, offline):'),
      h('ol', { html: isIOS
        ? `<li>Tippe unten in Safari auf <b>Teilen</b> ${SN.icon('share-ios', 16)}</li><li>Wähle <b>„Zum Home-Bildschirm“</b> → <b>Hinzufügen</b></li><li>Öffne <b>Spirit Notes</b> vom Home-Bildschirm</li>`
        : `<li>Öffne das Browser-Menü</li><li>Wähle <b>„Zum Startbildschirm hinzufügen“</b> / <b>„App installieren“</b></li>` }),
      withCode ? h('p.faint', { style: { fontSize: '12px' } }, 'Falls die App nach dem Öffnen nach einem Einrichtungscode fragt: hier kopieren und dort einfügen.') : null,
      withCode ? h('button.btn', { html: SN.icon('copy', 15) + '<span>Einrichtungscode kopieren</span>', onclick: async () => { try { await navigator.clipboard.writeText(SN.sync.code()); SN.toast('Code kopiert ✦', 'ok'); } catch { SN.toast('Kopieren nicht möglich', 'warn'); } } }) : null);
    SN.modal({ title: SN.icon('smartphone', 20) + ' Als App installieren', body, width: 440, cls: 'sheet', buttons: [{ label: 'Später', value: null }, { label: 'Verstanden', primary: true }] });
  };

  // ---------- Willkommen auf dem Handy ----------
  M.welcome = () => new Promise((resolve) => {
    const w = $('#welcome');
    w.classList.remove('hidden'); w.innerHTML = '';
    const code = h('textarea.input', { rows: 3, placeholder: 'Einrichtungscode vom PC hier einfügen …', spellcheck: 'false', style: { fontSize: '12px' } });
    const step2 = h('div.m-connect.hidden', code,
      h('button.btn.primary', { html: SN.icon('cloud', 18) + '<span>Verbinden</span>', onclick: async (e) => {
        try { const cfg = SN.sync.parseCode(code.value); await SN.fs.useDefault(); await SN.sync.saveCfg({ ...cfg, device: SN.sync.device() }); w.classList.add('hidden'); resolve('sync'); }
        catch (err) { SN.toast('Code ungültig: ' + err.message, 'err', 6000); }
      } }),
      h('p.faint', { style: { fontSize: '12px', margin: 0 } }, 'Den Code findest du am PC unter Einstellungen → Synchronisation → „iPhone verbinden“. Einfacher: dort den QR-Code mit der Kamera scannen.'));
    w.append(h('div.card.ornate.welcome-box',
      h('div.welcome-logo', { html: SN.themes.logoSVG(84) }),
      h('div.welcome-jp', '精 霊 ノ ー ト'),
      h('h1.welcome-title', { html: 'Spirit <b>Notes</b>' }),
      h('p.welcome-text', 'Deine Notizen, Pläne und Anime – jetzt auch auf dem Handy. Verbinde die App mit deinem PC, dann ist überall alles gleich.'),
      h('div.welcome-actions',
        h('button.btn.primary', { html: SN.icon('cloud', 18) + '<span>Mit meinem PC verbinden</span>', onclick: () => { step2.classList.remove('hidden'); setTimeout(() => code.focus(), 50); } }),
        step2,
        h('button.btn', { html: SN.icon('sparkles', 18) + '<span>Ohne Sync starten</span>', onclick: async () => { await SN.fs.useDefault(); w.classList.add('hidden'); resolve('local'); } }))));
    SN.hydrateIcons(w);
  });
})();
