/* Spirit Notes – Einstellungen */
(() => {
  const V = SN.views.settings = {};
  const h = SN.h, $ = SN.$;

  V.render = async () => {
    const root = $('#view-settings');
    root.innerHTML = '';
    const s = SN.settings;
    const col = h('div.view-col');
    col.append(h('div.view-head', h('div', h('h2.view-title', { html: 'Einstellungen <span class="jp">設定</span>' }), h('div.view-sub', 'Mach Spirit Notes zu deinem eigenen Ort.'))), h('div.deco-line'));
    const body = h('div.settings');
    const set = (patch, apply = true) => { SN.saveSettings(patch); if (apply) SN.themes.apply(); };
    const sw = (key, label, desc, onChange) => h('label.switch-row.set-row', h('div', h('b', label), desc ? h('small', desc) : null), h('input', { type: 'checkbox', checked: s[key] ? true : null, onchange: (e) => { set({ [key]: e.target.checked }); onChange && onChange(e.target.checked); } }), h('i.switch'));
    const row = (label, desc, ctrl) => h('div.set-row', h('div', h('b', label), desc ? h('small', desc) : null), ctrl);
    const sel = (key, opts, onChange) => h('select.select', { style: { width: '220px' }, onchange: (e) => { const v = isNaN(+e.target.value) || e.target.value === '' ? e.target.value : +e.target.value; set({ [key]: v }); onChange && onChange(v); } }, ...opts.map(([v, l]) => h('option', { value: v, selected: String(s[key]) === String(v) ? true : null }, l)));

    body.append(SN.sync.renderSettings());

    // ---------- Themes ----------
    const themes = h('div.theme-grid');
    for (const [id, t] of Object.entries(SN.themes.list)) {
      const v = t.vars;
      themes.append(h('div.theme-card' + (s.theme === id ? '.on' : ''), { onclick: () => { set({ theme: id, accent: '' }); V.render(); } },
        h('div.tc-prev', { style: { background: `radial-gradient(circle at 80% 120%, ${v.accent}55, transparent 60%), linear-gradient(160deg, ${v.bg2}, ${v.bg})` } },
          h('div.tc-side', { style: { background: v.panel, borderColor: v.line } }), h('div.tc-lines', h('i', { style: { background: v.accent } }), h('i', { style: { background: v.accent2 } }), h('i', { style: { background: v.muted } })),
          h('div.tc-dot', { style: { background: v.accent, boxShadow: `0 0 14px ${v.accent}` } })),
        h('div.tc-name', h('b', t.name), h('span.jp', t.jp)), h('small', t.desc)));
    }
    body.append(h('div.card.ornate.set-card', h('div.card-title', { html: `${SN.icon('palette', 16)} Design & Theme` }), themes,
      row('Eigene Akzentfarbe', 'Überschreibt die Hauptfarbe des Themes.', h('div.row', h('input', { type: 'color', value: s.accent || SN.themes.list[s.theme]?.vars.accent || '#e11d48', oninput: (e) => set({ accent: e.target.value }) }), h('button.btn.small', { onclick: () => { set({ accent: '' }); V.render(); } }, 'Zurücksetzen'))),
      row('Partikel', 'Fallende Blüten, Funken, Schnee …', sel('particles', [['auto', 'Passend zum Theme'], ['petals', 'Rosenblätter'], ['sakura', 'Sakura-Blüten'], ['sparkles', 'Sterne'], ['snow', 'Schnee'], ['embers', 'Funken'], ['off', 'Aus']])),
      row('Partikel-Menge', null, h('input', { type: 'range', min: .3, max: 2.5, step: .1, value: s.particleDensity, style: { width: '220px' }, onchange: (e) => set({ particleDensity: +e.target.value }) })),
      sw('motif', 'Hintergrund-Motiv', 'Große, langsam drehende Uhr / Siegel im Hintergrund.'),
      row('Größe der Oberfläche', null, sel('uiScale', [[0.9, 'Klein'], [1, 'Normal'], [1.1, 'Groß'], [1.2, 'Sehr groß']]))));

    // ---------- Hintergrundbild ----------
    const bgPrev = h('div.bg-prev', { style: s.bgImage ? { backgroundImage: `url("${SN.fs.url(s.bgImage)}")` } : null }, !s.bgImage ? h('span', { html: SN.icon('image', 28) + '<br>Kein Bild' }) : null);
    body.append(h('div.card.ornate.set-card', h('div.card-title', { html: `${SN.icon('image', 16)} Eigenes Hintergrundbild` }),
      h('p.muted', { style: { fontSize: '12.5px', marginTop: 0 } }, 'Setz dein Lieblings-Wallpaper als Hintergrund – z.B. deinen Lieblingscharakter. Das Bild wird in deinem Vault gespeichert.'),
      h('div.bg-set', bgPrev, h('div', { style: { flex: 1 } },
        h('div.row', { style: { marginBottom: '12px' } },
          h('button.btn.primary', { html: SN.icon('upload', 15) + '<span>Bild wählen</span>', onclick: async () => { const [f] = await SN.pickFiles('image/*'); if (!f) return; const p = await SN.fs.saveImage(f, 'attachments/backgrounds', 'hintergrund'); set({ bgImage: p }); await SN.notes.refreshFiles(); V.render(); } }),
          s.bgImage ? h('button.btn', { onclick: () => { set({ bgImage: '' }); V.render(); } }, 'Entfernen') : null),
        h('label.slider-row', h('span', 'Sichtbarkeit'), h('input', { type: 'range', min: .05, max: 1, step: .05, value: s.bgOpacity, oninput: (e) => set({ bgOpacity: +e.target.value }) })),
        h('label.slider-row', h('span', 'Unschärfe'), h('input', { type: 'range', min: 0, max: 20, step: 1, value: s.bgBlur, oninput: (e) => set({ bgBlur: +e.target.value }) }))))));

    // ---------- Editor ----------
    body.append(h('div.card.ornate.set-card', h('div.card-title', { html: `${SN.icon('feather', 16)} Schreiben` }),
      row('Schriftart im Editor', null, sel('editorFont', [['serif', 'Lora (Buch-Stil)'], ['sans', 'Poppins (Modern)'], ['head', 'Spirit Serif (Anime)'], ['mono', 'Mono (Code)']])),
      row('Schriftgröße', null, sel('editorSize', [[15, '15 px'], [16, '16 px'], [17, '17 px'], [18, '18 px'], [20, '20 px'], [22, '22 px']])),
      row('Seitenbreite', null, sel('editorWidth', [['normal', 'Normal (wie ein Buch)'], ['wide', 'Breit'], ['full', 'Volle Breite']])),
      row('Tägliches Schreibziel', 'Wörter pro Tag – siehst du unten in der Statusleiste und auf Home.', h('input.input', { type: 'number', min: 50, step: 50, value: s.dailyGoal, style: { width: '120px' }, onchange: (e) => set({ dailyGoal: +e.target.value || 500 }, false) })),
      sw('spellcheck', 'Rechtschreibprüfung', 'Deutsch & Englisch – Vorschläge per Rechtsklick.', (on) => { if (SN.isElectron) window.spirit.win.spellcheck(on); }),
      sw('typewriter', 'Schreibmaschinen-Modus', 'Die aktuelle Zeile bleibt immer in der Bildschirmmitte.')));

    // ---------- Allgemein ----------
    body.append(h('div.card.ornate.set-card', h('div.card-title', { html: `${SN.icon('sparkles', 16)} Allgemein` }),
      row('Dein Name', 'Für die Begrüßung auf Home.', h('input.input', { value: s.name, style: { width: '220px' }, onchange: (e) => set({ name: e.target.value.trim() || 'Spirit' }, false) })),
      sw('sounds', 'Sounds', 'Sanfte Töne beim Abhaken, Timer-Ende und Level-Up.'),
      row('Ansicht beim Start', null, sel('lastView', [['home', 'Home'], ['notes', 'Notizen'], ['planner', 'Planer'], ['anime', 'Anime']]))));

    // ---------- Vault ----------
    const info = await SN.fs.info();
    body.append(h('div.card.ornate.set-card', h('div.card-title', { html: `${SN.icon('folder', 16)} Vault (Speicherort)` }),
      h('p.muted', { style: { fontSize: '12.5px', marginTop: 0 } }, 'Alle Notizen sind normale .md-Dateien in diesem Ordner. Bilder liegen in „attachments“, Planer & Anime-Daten in „.spirit“. Du kannst den Ordner einfach sichern oder in OneDrive/Dropbox legen.'),
      h('div.vault-path', SN.ico('folder-open', 16), h('code', SN.isElectron ? (info.path || '–') : 'Auf diesem Gerät (App-Speicher)')),
      h('div.row', { style: { flexWrap: 'wrap', marginTop: '12px' } },
        h('button.btn', { html: SN.icon('folder-open', 15) + '<span>Ordner öffnen</span>', onclick: () => SN.fs.openFolder() }),
        SN.isElectron ? h('button.btn', { html: SN.icon('move', 15) + '<span>Anderen Vault wählen</span>', onclick: async () => { await SN.editor.saveAll(); const p = await SN.fs.choose(); if (p) location.reload(); } }) : null,
        h('button.btn', { html: SN.icon('upload', 15) + '<span>Dateien importieren</span>', onclick: () => SN.app.importFiles() }),
        h('button.btn', { html: SN.icon('trash', 15) + '<span>Papierkorb</span>', onclick: () => V.trash() }))));

    // ---------- Tastenkürzel ----------
    const keys = [['Strg N', 'Neue Notiz'], ['Strg O', 'Notiz schnell öffnen'], ['Strg P', 'Befehlspalette'], ['Strg Umschalt F', 'Überall suchen'], ['Strg D', 'Tagesnotiz'], ['Strg S', 'Speichern + Version'], ['Strg F', 'Suchen & Ersetzen'], ['Strg W', 'Tab schließen'], ['Strg Tab', 'Nächster Tab'], ['Strg 1–7', 'Ansicht wechseln'], ['Strg G', 'Graph'], ['Strg B / I / U', 'Fett / Kursiv / Unterstrichen'], ['Strg K', 'Link einfügen'], ['Strg Umschalt C', 'Checkliste'], ['Strg Umschalt H', 'Markieren'], ['Strg Alt 1–4', 'Überschrift 1–4'], ['Strg Enter', 'Checkbox abhaken'], ['F11', 'Zen-Modus'], ['/', 'Befehle im Text'], ['[[', 'Notiz verlinken'], ['# + Leertaste', 'Überschrift'], ['- + Leertaste', 'Aufzählung'], ['[] + Leertaste', 'Checkliste']];
    body.append(h('div.card.ornate.set-card', h('div.card-title', { html: `${SN.icon('command', 16)} Tastenkürzel` }), h('div.keys', ...keys.map(([k, l]) => h('div', h('kbd', k), h('span', l))))));

    const ver = SN.isElectron ? await window.spirit.version() : 'Browser';
    body.append(h('div.about', { html: `${SN.themes.logoSVG(40)}<div><b>Spirit Notes</b> <span class="faint">v${SN.esc(ver)}</span><br><small class="faint">Gemacht für Kurumi · Schreiben, Planen, Anime – im Crimson-Clock-Style. Inspiriert von Obsidian & Date A Live.</small></div>` }));
    col.append(body);
    root.append(col);
  };

  V.trash = async () => {
    const list = await SN.fs.trashList();
    const box = h('div.trash-list');
    const draw = (items) => {
      box.innerHTML = '';
      if (!items.length) box.append(h('div.empty-hint', { html: `${SN.icon('trash', 26)}<br>Der Papierkorb ist leer.` }));
      items.forEach(it => box.append(h('div.trash-row', SN.ico(SN.isImage(it.path) ? 'image' : 'file', 15), h('div.grow', h('b', SN.basename(it.path).replace(/\.md$/, '')), h('small.faint', ` ${SN.dirname(it.path) || 'Vault'} · gelöscht ${SN.fmtRel(it.deletedAt)}`)),
        h('button.btn.small', { onclick: async () => { const p = await SN.fs.trashRestore(it.name); await SN.notes.build(); SN.toast('Wiederhergestellt: ' + SN.basename(p), 'ok'); draw(await SN.fs.trashList()); } }, 'Wiederherstellen'))));
    };
    draw(list);
    SN.modal({ title: SN.icon('trash', 20) + ' Papierkorb', body: box, width: 620, buttons: [
      { label: 'Papierkorb leeren', danger: true, left: true, icon: 'trash', onClick: async (c) => { if (await SN.confirm('Endgültig löschen?', 'Alle Dateien im Papierkorb werden für immer gelöscht.', { danger: true, ok: 'Endgültig löschen' })) { await SN.fs.trashEmpty(); c(); SN.toast('Papierkorb geleert', 'ok'); } } },
      { label: 'Schließen', primary: true }] });
  };
})();
