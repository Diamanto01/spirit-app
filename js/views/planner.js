/* Spirit Notes – Planer: Kalender, Board, Liste, Chronos-Fokus (Pomodoro), Erinnerungen */
(() => {
  const V = SN.views.planner = {};
  const h = SN.h, $ = SN.$;
  let store;
  const ui = { tab: localStorage.getItem('sn-pl-tab') || 'calendar', month: new Date(), selDay: SN.todayKey() };
  const PRIO = [{ l: 'Keine', c: 'var(--faint)' }, { l: 'Niedrig', c: '#38bdf8' }, { l: 'Mittel', c: '#facc15' }, { l: 'Hoch', c: '#f43f5e' }];
  const STATUS = { todo: 'Zu erledigen', doing: 'In Arbeit', done: 'Erledigt' };

  V.init = async () => {
    store = SN.data.planner = new SN.Store('planner', { tasks: [], focusLog: [] });
    await store.load();
    setInterval(checkReminders, 30000);
    setTimeout(checkReminders, 4000);
    setTimeout(() => {
      const n = V.tasks().filter(t => t.status !== 'done' && t.due && t.due <= SN.todayKey()).length;
      if (n) SN.toast(`${SN.plural(n, 'Aufgabe ist', 'Aufgaben sind')} heute fällig`, 'info', 4000);
    }, 2500);
  };
  V.tasks = () => store ? store.value.tasks : [];
  const save = () => { store.save(); SN.emit('planner'); };

  // ======================================================================
  //  Rendern
  // ======================================================================
  V.render = () => {
    const root = $('#view-planner');
    root.innerHTML = '';
    const col = h('div.view-col');
    const seg = h('div.seg', ...[['calendar', 'calendar', 'Kalender'], ['board', 'kanban', 'Board'], ['list', 'list-check', 'Liste'], ['focus', 'timer', 'Fokus']].map(([k, i, l]) =>
      h('button' + (ui.tab === k ? '.on' : ''), { html: SN.icon(i, 14) + l, onclick: () => V.tab(k) })));
    col.append(h('div.view-head', h('div', h('h2.view-title', { html: 'Planer <span class="jp">予定</span>' }), h('div.view-sub', 'Termine, Aufgaben & Fokus-Zeit – alles an einem Ort.')), h('div.spacer'), seg,
      h('button.btn.primary', { html: SN.icon('plus', 16) + '<span>Aufgabe</span>', onclick: () => V.quickAdd({ due: ui.tab === 'calendar' ? ui.selDay : '' }) })), h('div.deco-line'));
    const body = h('div.pl-body');
    col.append(body);
    root.append(col);
    if (ui.tab === 'calendar') renderCalendar(body);
    else if (ui.tab === 'board') renderBoard(body);
    else if (ui.tab === 'list') renderList(body);
    else renderFocus(body);
  };
  V.tab = (t) => { ui.tab = t; localStorage.setItem('sn-pl-tab', t); V.render(); };

  // ---------- Schnell-Eingabe mit natürlicher Sprache ----------
  V.parseQuick = (text) => {
    let t = ' ' + text + ' ';
    const out = { title: '', due: '', time: '', prio: 0, tags: [] };
    const d = new Date(); d.setHours(0, 0, 0, 0);
    const take = (re, fn) => { t = t.replace(re, (...m) => { fn(...m); return ' '; }); };
    take(/\s#([\p{L}\d_-]+)/gu, (_, tg) => out.tags.push(tg.toLowerCase()));
    take(/\s(!!!|!hoch|!wichtig)\s/i, () => out.prio = 3);
    take(/\s(!!|!mittel)\s/i, () => out.prio = 2);
    take(/\s(!|!niedrig)\s/i, () => out.prio = 1);
    take(/\s(?:um\s)?(\d{1,2})[:.](\d{2})(?:\s?uhr)?\s/i, (_, hh, mm) => out.time = `${SN.pad(hh)}:${mm}`);
    take(/\s(?:um\s)?(\d{1,2})\s?uhr\s/i, (_, hh) => out.time = `${SN.pad(hh)}:00`);
    take(/\s(heute)\s/i, () => out.due = SN.dateKey(d));
    take(/\s(übermorgen)\s/i, () => { const x = new Date(d); x.setDate(x.getDate() + 2); out.due = SN.dateKey(x); });
    take(/\s(morgen)\s/i, () => { const x = new Date(d); x.setDate(x.getDate() + 1); out.due = SN.dateKey(x); });
    take(/\s(?:am\s|nächsten\s|kommenden\s)?(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)\s/i, (_, wd) => {
      const idx = ['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag'].indexOf(wd.toLowerCase());
      const x = new Date(d); let add = (idx - x.getDay() + 7) % 7; if (add === 0) add = 7; x.setDate(x.getDate() + add); out.due = SN.dateKey(x);
    });
    take(/\s(?:am\s)?(\d{1,2})\.(\d{1,2})\.(\d{2,4})?\s/, (_, dd, mm, yy) => { const y = yy ? (yy.length === 2 ? 2000 + +yy : +yy) : d.getFullYear(); let x = new Date(y, mm - 1, dd); if (!yy && x < d) x = new Date(y + 1, mm - 1, dd); out.due = SN.dateKey(x); });
    take(/\s(in\s(\d+)\stag(?:en)?)\s/i, (_, __, n) => { const x = new Date(d); x.setDate(x.getDate() + Number(n)); out.due = SN.dateKey(x); });
    out.title = t.replace(/\s+/g, ' ').trim();
    if (out.time && !out.due) out.due = SN.dateKey(d);
    return out;
  };
  function quickInput(defaults = {}) {
    const inp = h('input.input.quick-add', { placeholder: 'Schnell hinzufügen: „Mathe lernen morgen 15 Uhr !hoch #schule“ – Enter', spellcheck: 'true' });
    const hint = h('div.qa-hint');
    inp.addEventListener('input', () => {
      const p = V.parseQuick(inp.value);
      hint.innerHTML = inp.value.trim() ? [p.due ? `${SN.icon('calendar', 12)} ${SN.fmtDate(SN.parseKey(p.due))}` : '', p.time ? `${SN.icon('clock', 12)} ${p.time}` : '', p.prio ? `<span style="color:${PRIO[p.prio].c}">● ${PRIO[p.prio].l}</span>` : '', ...p.tags.map(t => '#' + t)].filter(Boolean).join(' &nbsp; ') : '';
    });
    inp.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || !inp.value.trim()) return;
      const p = V.parseQuick(inp.value);
      if (!p.title) return;
      addTask({ ...defaults, ...p, due: p.due || defaults.due || '', remind: !!p.time });
      inp.value = ''; hint.innerHTML = '';
      SN.toast('Aufgabe hinzugefügt', 'ok', 1500); SN.sound('pop');
      V.render();
      setTimeout(() => { const q = $('#view-planner .quick-add'); q && q.focus(); }, 20);
    });
    return h('div.qa-wrap', SN.ico('plus', 16), inp, hint);
  }

  function addTask(p) {
    const t = { id: SN.uid(), title: p.title || 'Neue Aufgabe', desc: p.desc || '', due: p.due || '', time: p.time || '', prio: p.prio || 0, status: p.status || 'todo', tags: p.tags || [], color: p.color || '', note: p.note || '', repeat: p.repeat || 'none', remind: !!p.remind, notified: false, created: new Date().toISOString(), doneAt: null, subtasks: p.subtasks || [] };
    store.value.tasks.push(t); save(); return t;
  }
  V.setDone = (t, done) => {
    t.status = done ? 'done' : 'todo'; t.doneAt = done ? new Date().toISOString() : null;
    if (done) {
      SN.sound('done'); SN.stats.bump('tasks', 1);
      if (t.repeat && t.repeat !== 'none' && t.due) {
        const d = SN.parseKey(t.due);
        if (t.repeat === 'daily') d.setDate(d.getDate() + 1); else if (t.repeat === 'weekly') d.setDate(d.getDate() + 7); else if (t.repeat === 'monthly') d.setMonth(d.getMonth() + 1);
        addTask({ ...t, due: SN.dateKey(d), status: 'todo', subtasks: t.subtasks.map(s => ({ ...s, done: false })) });
        SN.toast('Nächste Wiederholung angelegt: ' + SN.fmtDate(d), 'info');
      }
    }
    save();
  };

  function dueLabel(t) {
    if (!t.due) return '';
    const diff = SN.daysBetween(SN.todayKey(), t.due);
    const base = diff === 0 ? 'Heute' : diff === 1 ? 'Morgen' : diff === -1 ? 'Gestern' : diff < 0 ? `vor ${-diff} T.` : diff < 7 ? SN.DAYS[SN.parseKey(t.due).getDay()] : SN.fmtDate(SN.parseKey(t.due));
    return base + (t.time ? ', ' + t.time : '');
  }
  V.taskRow = (t, { compact } = {}) => {
    const overdue = t.status !== 'done' && t.due && t.due < SN.todayKey();
    const subs = t.subtasks || [];
    const row = h('div.task-row' + (t.status === 'done' ? '.done' : '') + (overdue ? '.overdue' : ''), { style: { '--pc': PRIO[t.prio || 0].c } },
      h('button.task-check', { title: 'Erledigt', onclick: (e) => { e.stopPropagation(); V.setDone(t, t.status !== 'done'); SN.app.refresh(); } }, h('span', { html: SN.icon('check', 12) })),
      h('div.task-main', { onclick: () => V.edit(t) },
        h('div.task-title', t.title),
        h('div.task-meta',
          t.due ? h('span' + (overdue ? '.late' : ''), { html: SN.icon('calendar', 11) + ' ' + dueLabel(t) }) : null,
          t.repeat && t.repeat !== 'none' ? h('span', { html: SN.icon('reset', 11) }) : null,
          t.remind && t.time ? h('span', { html: SN.icon('bell', 11) }) : null,
          subs.length ? h('span', { html: SN.icon('list-check', 11) + ` ${subs.filter(s => s.done).length}/${subs.length}` }) : null,
          t.note ? h('span.link', { html: SN.icon('file', 11) + ' ' + SN.esc(SN.noteName(t.note)), onclick: (e) => { e.stopPropagation(); SN.editor.open(t.note); } }) : null,
          ...(compact ? [] : (t.tags || []).map(x => h('span.chip.tag', x))))),
      t.prio ? h('span.prio-dot', { title: 'Priorität: ' + PRIO[t.prio].l }) : null);
    row.draggable = true;
    row.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/sn-task', t.id));
    row.addEventListener('contextmenu', (e) => taskMenu(e, t));
    return row;
  };
  function taskMenu(e, t) {
    SN.ctxMenu(e, [
      { label: 'Bearbeiten', icon: 'edit', onClick: () => V.edit(t) },
      { label: t.status === 'done' ? 'Als offen markieren' : 'Erledigt', icon: 'check', onClick: () => { V.setDone(t, t.status !== 'done'); SN.app.refresh(); } },
      { label: 'Auf heute', icon: 'sun', onClick: () => { t.due = SN.todayKey(); save(); SN.app.refresh(); } },
      { label: 'Auf morgen', icon: 'arrow-r', onClick: () => { const d = new Date(); d.setDate(d.getDate() + 1); t.due = SN.dateKey(d); save(); SN.app.refresh(); } },
      { label: 'Im Fokus-Timer starten', icon: 'timer', onClick: () => { SN.focus.task = t.id; V.tab('focus'); SN.app.show('planner'); } },
      { sep: true },
      { label: 'Löschen', icon: 'trash', danger: true, onClick: () => { store.value.tasks = store.value.tasks.filter(x => x !== t); save(); SN.app.refresh(); } },
    ]);
  }

  // ---------- Kalender ----------
  function renderCalendar(body) {
    const m = ui.month, y = m.getFullYear(), mo = m.getMonth();
    const first = new Date(y, mo, 1);
    const start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7));
    const tasks = V.tasks();
    const byDay = new Map();
    tasks.forEach(t => { if (t.due) { if (!byDay.has(t.due)) byDay.set(t.due, []); byDay.get(t.due).push(t); } });
    const diaries = new Set(SN.notes.all().filter(n => n.folder === 'Tagebuch').map(n => n.name));
    const wrap = h('div.cal-wrap');
    const cal = h('div.card.cal');
    cal.append(h('div.cal-head',
      h('button.icon-btn', { html: SN.icon('chev-l'), onclick: () => { ui.month = new Date(y, mo - 1, 1); V.render(); } }),
      h('div.cal-title', { html: `${SN.MONTHS[mo]} <span>${y}</span>` }),
      h('button.icon-btn', { html: SN.icon('chev-r'), onclick: () => { ui.month = new Date(y, mo + 1, 1); V.render(); } }),
      h('button.btn.small', { style: { marginLeft: '10px' }, onclick: () => { ui.month = new Date(); ui.selDay = SN.todayKey(); V.render(); } }, 'Heute'),
      h('span.faint', { style: { marginLeft: 'auto', fontSize: '11.5px' } }, 'Doppelklick = neue Aufgabe · Aufgaben per Drag & Drop verschieben')));
    const grid = h('div.cal-grid');
    ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].forEach(d => grid.append(h('div.cal-dow', d)));
    const today = SN.todayKey();
    for (let i = 0; i < 42; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const k = SN.dateKey(d);
      const list = (byDay.get(k) || []).sort((a, b) => (a.status === 'done') - (b.status === 'done') || (a.time || '99').localeCompare(b.time || '99'));
      const cell = h('div.cal-cell' + (d.getMonth() !== mo ? '.out' : '') + (k === today ? '.today' : '') + (k === ui.selDay ? '.sel' : ''),
        h('div.cal-num', d.getDate(), diaries.has(k) ? h('span.cal-diary', { title: 'Tagesnotiz vorhanden', html: SN.icon('sun', 11) }) : null),
        ...list.slice(0, 3).map(t => { const c = h('div.cal-task' + (t.status === 'done' ? '.done' : ''), { draggable: 'true', style: { '--pc': PRIO[t.prio || 0].c }, onclick: (e) => { e.stopPropagation(); V.edit(t); } }, t.time ? h('b', t.time + ' ') : null, t.title); c.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/sn-task', t.id)); return c; }),
        list.length > 3 ? h('div.cal-more', `+${list.length - 3} weitere`) : null);
      cell.onclick = () => { ui.selDay = k; V.render(); };
      cell.ondblclick = () => V.quickAdd({ due: k });
      cell.addEventListener('dragover', (e) => { if (e.dataTransfer.types.includes('text/sn-task')) { e.preventDefault(); cell.classList.add('drop'); } });
      cell.addEventListener('dragleave', () => cell.classList.remove('drop'));
      cell.addEventListener('drop', (e) => { e.preventDefault(); const t = tasks.find(x => x.id === e.dataTransfer.getData('text/sn-task')); if (t) { t.due = k; t.notified = false; save(); V.render(); } });
      grid.append(cell);
    }
    cal.append(grid);
    // Tages-Agenda
    const sd = SN.parseKey(ui.selDay);
    const agenda = h('div.card.ornate.agenda',
      h('div.agenda-date', h('b', sd.getDate()), h('div', h('div', SN.DAYS[sd.getDay()]), h('small', `${SN.MONTHS[sd.getMonth()]} ${sd.getFullYear()}`)), h('span.jp', SN.DAYS_JP[sd.getDay()])),
      quickInput({ due: ui.selDay }));
    const dl = (byDay.get(ui.selDay) || []);
    if (!dl.length) agenda.append(h('div.empty-hint', 'Keine Aufgaben an diesem Tag.'));
    dl.forEach(t => agenda.append(V.taskRow(t, { compact: true })));
    const diaryName = ui.selDay;
    agenda.append(h('button.btn.small', { style: { marginTop: '12px', width: '100%', justifyContent: 'center' }, html: SN.icon('sun', 14) + `<span>${diaries.has(diaryName) ? 'Tagesnotiz öffnen' : 'Tagesnotiz schreiben'}</span>`, onclick: () => SN.app.dailyNote(sd) }));
    wrap.append(cal, agenda);
    body.append(wrap);
  }

  // ---------- Board ----------
  function renderBoard(body) {
    body.append(quickInput({}));
    const board = h('div.board.task-board');
    for (const [k, label] of Object.entries(STATUS)) {
      const list = V.tasks().filter(t => t.status === k).sort((a, b) => (b.prio || 0) - (a.prio || 0) || (a.due || '9').localeCompare(b.due || '9'));
      const col = h('div.board-col.st-' + k, h('div.board-head', h('i.st-dot'), h('b', label), h('span.faint', list.length)));
      const items = h('div.board-items');
      list.forEach(t => items.append(V.taskRow(t)));
      col.addEventListener('dragover', (e) => { if (e.dataTransfer.types.includes('text/sn-task')) { e.preventDefault(); col.classList.add('drop'); } });
      col.addEventListener('dragleave', () => col.classList.remove('drop'));
      col.addEventListener('drop', (e) => { e.preventDefault(); col.classList.remove('drop'); const t = V.tasks().find(x => x.id === e.dataTransfer.getData('text/sn-task')); if (t && t.status !== k) { if (k === 'done') V.setDone(t, true); else { t.status = k; t.doneAt = null; save(); } V.render(); } });
      col.append(items);
      board.append(col);
    }
    body.append(board);
  }

  // ---------- Liste ----------
  function renderList(body) {
    body.append(quickInput({}));
    const today = SN.todayKey();
    const tm = new Date(); tm.setDate(tm.getDate() + 1); const tomorrow = SN.dateKey(tm);
    const wk = new Date(); wk.setDate(wk.getDate() + 7); const week = SN.dateKey(wk);
    const open = V.tasks().filter(t => t.status !== 'done');
    const groups = [
      ['Überfällig', open.filter(t => t.due && t.due < today), 'alert'],
      ['Heute', open.filter(t => t.due === today), 'sun'],
      ['Morgen', open.filter(t => t.due === tomorrow), 'arrow-r'],
      ['Nächste 7 Tage', open.filter(t => t.due > tomorrow && t.due <= week), 'calendar'],
      ['Später', open.filter(t => t.due > week), 'clock'],
      ['Ohne Datum', open.filter(t => !t.due), 'inbox'],
    ];
    const cols = h('div.list-cols');
    const left = h('div');
    for (const [label, list, icon] of groups) {
      if (!list.length) continue;
      list.sort((a, b) => (a.due + (a.time || '')).localeCompare(b.due + (b.time || '')) || (b.prio || 0) - (a.prio || 0));
      left.append(h('div.list-group', h('div.rp-h', SN.ico(icon, 13), label, h('span.n', list.length)), ...list.map(t => V.taskRow(t))));
    }
    if (!open.length) left.append(h('div.empty-hint', { html: `${SN.icon('sparkles', 26)}<br>Alles erledigt! Zeit für eine Folge Anime.` }));
    const done = V.tasks().filter(t => t.status === 'done').sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || ''));
    if (done.length) {
      const det = h('details.list-done', h('summary', `Erledigt (${done.length})`), ...done.slice(0, 50).map(t => V.taskRow(t)));
      left.append(det);
      if (done.length > 0) det.append(h('button.btn.small.danger', { style: { marginTop: '8px' }, onclick: () => { store.value.tasks = V.tasks().filter(t => t.status !== 'done'); save(); V.render(); } }, 'Erledigte aufräumen'));
    }
    const right = h('div.card.ornate', h('div.card-title', { html: `${SN.icon('feather', 16)} Aus deinen Notizen` }));
    const nt = SN.notes.all().flatMap(n => n.tasks.filter(t => !t.done).map(t => ({ ...t, path: n.path })));
    if (!nt.length) right.append(h('div.empty-hint', 'Checklisten-Punkte aus Notizen erscheinen hier automatisch.'));
    nt.slice(0, 40).forEach(t => right.append(h('div.mini-task', { onclick: () => SN.editor.open(t.path) }, h('span.box'), h('span.t', t.text), h('span.faint', SN.noteName(t.path)))));
    cols.append(left, right);
    body.append(cols);
  }

  // ---------- Bearbeiten ----------
  V.quickAdd = (pre = {}) => V.edit(null, pre);
  V.edit = (task, pre = {}) => {
    const isNew = !task;
    const t = task ? structuredClone(task) : { title: pre.title || '', desc: '', due: pre.due ?? SN.todayKey(), time: '', prio: 0, status: 'todo', tags: [], color: '', note: pre.note || '', repeat: 'none', remind: false, subtasks: [] };
    const title = h('input.input.big', { value: t.title, placeholder: 'Was ist zu tun?', autofocus: true });
    const desc = h('textarea.input', { placeholder: 'Details, Notizen …', rows: 3 }, t.desc || '');
    const due = h('input.input', { type: 'date', value: t.due || '' });
    const time = h('input.input', { type: 'time', value: t.time || '' });
    const status = h('select.select', ...Object.entries(STATUS).map(([k, l]) => h('option', { value: k, selected: t.status === k ? true : null }, l)));
    const repeat = h('select.select', ...[['none', 'Nie'], ['daily', 'Täglich'], ['weekly', 'Wöchentlich'], ['monthly', 'Monatlich']].map(([k, l]) => h('option', { value: k, selected: t.repeat === k ? true : null }, l)));
    const remind = h('input', { type: 'checkbox', checked: t.remind ? true : null });
    const tags = h('input.input', { value: (t.tags || []).join(', '), placeholder: 'schule, projekt …' });
    const noteSel = h('input.input', { value: t.note ? SN.noteName(t.note) : '', placeholder: 'Notiz verknüpfen (optional)', list: 'sn-note-list' });
    const dl = h('datalist#sn-note-list', ...SN.notes.all().map(n => h('option', { value: n.name })));
    let prio = t.prio || 0;
    const prioSeg = h('div.seg', ...PRIO.map((p, i) => h('button' + (prio === i ? '.on' : ''), { html: `<span style="color:${p.c}">●</span> ${p.l}`, onclick: (e) => { prio = i; prioSeg.querySelectorAll('button').forEach((b, j) => b.classList.toggle('on', j === i)); } })));
    const subs = (t.subtasks || []).map(s => ({ ...s }));
    const subList = h('div.sub-list');
    const drawSubs = () => {
      subList.innerHTML = '';
      subs.forEach((s, i) => subList.append(h('div.sub-row', h('input', { type: 'checkbox', checked: s.done ? true : null, onchange: (e) => s.done = e.target.checked }),
        h('input.input.sm', { value: s.text, oninput: (e) => s.text = e.target.value }), h('button.icon-btn', { html: SN.icon('x', 14), onclick: () => { subs.splice(i, 1); drawSubs(); } }))));
      const add = h('input.input.sm', { placeholder: '+ Teilaufgabe (Enter)', 'data-own-enter': '1' });
      add.addEventListener('keydown', (e) => { if (e.key === 'Enter' && add.value.trim()) { e.preventDefault(); e.stopPropagation(); subs.push({ id: SN.uid(), text: add.value.trim(), done: false }); drawSubs(); subList.querySelector('input.input.sm:last-of-type')?.focus(); setTimeout(() => subList.lastChild.querySelector('input')?.focus(), 0); } });
      subList.append(h('div.sub-row', add));
    };
    drawSubs();
    const body = h('div.task-form', title, desc,
      h('div.grid3', h('label.field', 'Datum', due), h('label.field', 'Uhrzeit', time), h('label.field', 'Status', status)),
      h('label.field', 'Priorität', prioSeg),
      h('div.grid2', h('label.field', 'Wiederholen', repeat), h('label.field', 'Tags (mit Komma)', tags)),
      h('label.field', 'Verknüpfte Notiz', noteSel, dl),
      h('label.switch-row', h('span', { html: `${SN.icon('bell', 14)} Erinnerung zur Uhrzeit (Windows-Benachrichtigung)` }), remind, h('i.switch')),
      h('label.field', 'Teilaufgaben', subList));
    const m = SN.modal({ title: SN.icon(isNew ? 'plus' : 'edit', 20) + (isNew ? ' Neue Aufgabe' : ' Aufgabe bearbeiten'), body, width: 600,
      buttons: [
        ...(isNew ? [] : [{ label: 'Löschen', danger: true, left: true, icon: 'trash', onClick: (c) => { store.value.tasks = store.value.tasks.filter(x => x.id !== task.id); save(); c(); SN.app.refresh(); } }]),
        { label: 'Abbrechen' },
        { label: 'Speichern', primary: true, icon: 'check', onClick: (c) => {
          const data = { title: title.value.trim() || 'Neue Aufgabe', desc: desc.value, due: due.value, time: time.value, prio, status: status.value, repeat: repeat.value, remind: remind.checked,
            tags: tags.value.split(',').map(s => s.trim().replace(/^#/, '').toLowerCase()).filter(Boolean), note: SN.notes.resolve(noteSel.value.trim()) || '', subtasks: subs.filter(s => s.text.trim()) };
          if (isNew) { const nt = addTask(data); if (data.status === 'done') V.setDone(nt, true); }
          else { const wasDone = task.status === 'done'; if (task.due !== data.due || task.time !== data.time) task.notified = false; Object.assign(task, data); if (!wasDone && data.status === 'done') V.setDone(task, true); else save(); }
          c(); SN.app.refresh();
        } }] });
    return m;
  };

  // ---------- Erinnerungen ----------
  function checkReminders() {
    if (!store) return;
    const now = new Date();
    let changed = false;
    for (const t of V.tasks()) {
      if (!t.remind || t.notified || t.status === 'done' || !t.due || !t.time) continue;
      const [hh, mm] = t.time.split(':').map(Number);
      const at = SN.parseKey(t.due); at.setHours(hh, mm, 0, 0);
      if (at <= now && now - at < 6 * 3600 * 1000) {
        t.notified = true; changed = true;
        SN.sound('chime');
        SN.toast('⏰ ' + t.title, 'warn', 8000);
        if (SN.isElectron) window.spirit.notify('Spirit Notes – Erinnerung', `${t.title} (${t.time})`);
        else if (window.Notification && Notification.permission === 'granted') new Notification('Spirit Notes', { body: t.title });
      }
    }
    if (changed) save();
  }

  // ======================================================================
  //  Chronos-Fokus (Pomodoro) – läuft auch weiter, wenn du die Ansicht wechselst
  // ======================================================================
  const F = SN.focus = { mode: 'focus', running: false, left: 0, total: 0, round: 0, task: null, timer: null };
  F.len = (m) => 60 * (m === 'focus' ? SN.settings.focusLen : m === 'break' ? SN.settings.breakLen : SN.settings.longBreakLen);
  F.reset = (mode = F.mode) => { clearInterval(F.timer); F.running = false; F.mode = mode; F.total = F.left = F.len(mode); F.update(); };
  F.start = () => {
    if (F.running) return;
    if (!F.left) F.reset();
    F.running = true; F.endAt = Date.now() + F.left * 1000;
    clearInterval(F.timer);
    F.timer = setInterval(() => { F.left = Math.max(0, Math.round((F.endAt - Date.now()) / 1000)); if (F.left <= 0) F.finish(); F.update(); }, 250);
    F.update();
  };
  F.pause = () => { clearInterval(F.timer); F.running = false; F.update(); };
  F.finish = () => {
    clearInterval(F.timer); F.running = false;
    SN.sound('chime');
    if (F.mode === 'focus') {
      const mins = Math.round(F.total / 60);
      SN.stats.bump('focus', mins);
      store.value.focusLog.push({ at: new Date().toISOString(), mins, task: F.task });
      store.value.focusLog = store.value.focusLog.slice(-500);
      save();
      F.round++;
      const next = F.round % 4 === 0 ? 'long' : 'break';
      SN.toast(`Fokus geschafft! ${mins} Minuten ✦ Zeit für eine Pause.`, 'ok', 5000);
      if (SN.isElectron) window.spirit.notify('Chronos-Fokus', `${mins} Minuten geschafft – Pause!`);
      F.reset(next);
    } else {
      SN.toast('Pause vorbei – weiter geht’s!', 'info', 4000);
      if (SN.isElectron) window.spirit.notify('Chronos-Fokus', 'Pause vorbei – weiter geht’s!');
      F.reset('focus');
    }
  };
  F.update = () => {
    const tb = $('#tb-timer');
    const mm = SN.pad(Math.floor(F.left / 60)), ss = SN.pad(F.left % 60);
    if (tb) {
      const show = F.running || (F.left && F.left !== F.total);
      tb.classList.toggle('hidden', !show);
      tb.classList.toggle('break', F.mode !== 'focus');
      tb.innerHTML = `<span class="dot"></span>${F.mode === 'focus' ? 'Fokus' : 'Pause'} ${mm}:${ss}`;
    }
    const big = $('#focus-time'); if (big) big.textContent = `${mm}:${ss}`;
    const arc = $('#focus-arc'); if (arc) { const c = 2 * Math.PI * 130; arc.setAttribute('stroke-dashoffset', c * (1 - (F.total ? F.left / F.total : 1))); }
    const hand = $('#focus-hand'); if (hand) hand.setAttribute('transform', `rotate(${360 * (1 - (F.total ? F.left / F.total : 1))} 150 150)`);
    const btn = $('#focus-play'); if (btn) btn.innerHTML = SN.icon(F.running ? 'pause' : 'play', 22);
    const lab = $('#focus-mode'); if (lab) lab.textContent = { focus: 'Fokus', break: 'Kurze Pause', long: 'Lange Pause' }[F.mode];
    document.title = F.running ? `${mm}:${ss} · Spirit Notes` : 'Spirit Notes';
  };

  function renderFocus(body) {
    if (!F.total) F.reset('focus');
    const c = 2 * Math.PI * 130;
    let ticks = '';
    for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, big = i % 5 === 0; ticks += `<line x1="${150 + Math.sin(a) * 146}" y1="${150 - Math.cos(a) * 146}" x2="${150 + Math.sin(a) * (big ? 138 : 142)}" y2="${150 - Math.cos(a) * (big ? 138 : 142)}" stroke="${big ? 'var(--accent2)' : 'var(--faint)'}" stroke-width="${big ? 2 : 1}"/>`; }
    const clock = h('div.focus-clock', { html: `<svg viewBox="0 0 300 300"><defs><linearGradient id="fg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--accent2)"/></linearGradient></defs>
      <circle cx="150" cy="150" r="148" fill="var(--bg2)" stroke="var(--line2)"/>${ticks}
      <circle cx="150" cy="150" r="130" fill="none" stroke="var(--line)" stroke-width="10"/>
      <circle id="focus-arc" cx="150" cy="150" r="130" fill="none" stroke="url(#fg)" stroke-width="10" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="0" transform="rotate(-90 150 150)" style="filter:drop-shadow(0 0 8px var(--glow))"/>
      <g id="focus-hand"><line x1="150" y1="150" x2="150" y2="34" stroke="var(--accent2)" stroke-width="2" stroke-linecap="round"/><circle cx="150" cy="30" r="5" fill="var(--accent)"/></g>
      <circle cx="150" cy="150" r="96" fill="var(--bg)" stroke="var(--line)"/></svg>` },
      h('div.focus-center', h('div#focus-mode.focus-mode', 'Fokus'), h('div#focus-time.focus-time', '25:00'), h('div.focus-round', ...[0, 1, 2, 3].map(i => h('i' + (i < F.round % 4 ? '.on' : ''))))));
    const controls = h('div.focus-controls',
      h('button.icon-btn.big', { title: 'Zurücksetzen', html: SN.icon('reset', 20), onclick: () => F.reset() }),
      h('button#focus-play.focus-play', { onclick: () => F.running ? F.pause() : F.start() }),
      h('button.icon-btn.big', { title: 'Überspringen', html: SN.icon('skip', 20), onclick: () => F.finish() }));
    const modes = h('div.seg', ...[['focus', 'Fokus'], ['break', 'Kurze Pause'], ['long', 'Lange Pause']].map(([k, l]) => h('button' + (F.mode === k ? '.on' : ''), { onclick: () => { F.reset(k); V.render(); } }, l)));
    const open = V.tasks().filter(t => t.status !== 'done');
    const taskSel = h('select.select', { onchange: (e) => F.task = e.target.value || null }, h('option', { value: '' }, '— Woran arbeitest du? —'), ...open.map(t => h('option', { value: t.id, selected: F.task === t.id ? true : null }, t.title)));
    const lens = h('div.grid3',
      h('label.field', 'Fokus (Min.)', h('input.input', { type: 'number', min: 1, max: 180, value: SN.settings.focusLen, onchange: (e) => { SN.saveSettings({ focusLen: +e.target.value || 25 }); if (!F.running) F.reset(); } })),
      h('label.field', 'Pause', h('input.input', { type: 'number', min: 1, max: 60, value: SN.settings.breakLen, onchange: (e) => { SN.saveSettings({ breakLen: +e.target.value || 5 }); if (!F.running) F.reset(); } })),
      h('label.field', 'Lange Pause', h('input.input', { type: 'number', min: 1, max: 90, value: SN.settings.longBreakLen, onchange: (e) => { SN.saveSettings({ longBreakLen: +e.target.value || 15 }); if (!F.running) F.reset(); } })));
    // Wochen-Diagramm
    const days = [];
    for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = SN.dateKey(d); days.push({ k, d, m: SN.stats.store.value.days[k]?.focus || 0 }); }
    const max = Math.max(30, ...days.map(x => x.m));
    const chart = h('div.week-chart', ...days.map(x => h('div.wc-col', { title: `${x.m} Min.` }, h('span.wc-v', x.m || ''), h('div.wc-bar', h('i', { style: { height: (x.m / max * 100) + '%' } })), h('span.wc-l', SN.DAYS_SHORT[x.d.getDay()]))));
    const todayMin = days[6].m;
    body.append(h('div.focus-wrap',
      h('div.card.ornate.focus-main', h('div.card-title', { html: `${SN.icon('timer', 16)} Chronos-Fokus <span class="jp">集中</span>` }), modes, clock, controls, taskSel),
      h('div.focus-side',
        h('div.card', h('div.card-title', { html: `${SN.icon('chart', 16)} Deine Woche` }), chart, h('div.faint', { style: { fontSize: '12px', marginTop: '8px' } }, `Heute: ${todayMin} Minuten · Gesamt: ${SN.fmtNum(SN.stats.store.value.totals.focus || 0)} Minuten`)),
        h('div.card', h('div.card-title', { html: `${SN.icon('settings', 16)} Einstellungen` }), lens,
          h('p.faint', { style: { fontSize: '12px', margin: '10px 0 0' } }, 'Nach 4 Fokus-Runden gibt es eine lange Pause. Der Timer läuft weiter, auch wenn du in eine andere Ansicht wechselst – du siehst ihn oben in der Titelleiste.')))));
    F.update();
  }
})();
