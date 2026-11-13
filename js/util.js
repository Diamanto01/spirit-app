/* Spirit Notes – Hilfsfunktionen */
const SN = window.SN = { views: {}, state: {} };

SN.$ = (s, r = document) => r.querySelector(s);
SN.$$ = (s, r = document) => Array.from(r.querySelectorAll(s));

/** Element erzeugen: h('div.klasse#id', {attrs}, ...kinder) */
SN.h = function (sel, attrs, ...kids) {
  const m = sel.match(/^([a-z0-9-]+)?((?:[.#][\w-]+)*)$/i) || [];
  const el = document.createElement(m[1] || 'div');
  (m[2] || '').replace(/([.#])([\w-]+)/g, (_, t, n) => { if (t === '.') el.classList.add(n); else el.id = n; });
  if (attrs != null && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) { kids.unshift(attrs); attrs = null; }
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className += ' ' + v;
    else if (k === 'style' && typeof v === 'object') { for (const [sk, sv] of Object.entries(v)) { if (sv == null) continue; if (sk.startsWith('--')) el.style.setProperty(sk, sv); else el.style[sk] = sv; } }
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'data') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (const k of kids.flat(Infinity)) {
    if (k == null || k === false) continue;
    el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
  return el;
};

SN.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
SN.esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
SN.debounce = (fn, ms) => { let t; const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; d.flush = (...a) => { clearTimeout(t); return fn(...a); }; d.cancel = () => clearTimeout(t); return d; };
SN.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
SN.sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ---------- Datum ----------
SN.pad = (n) => String(n).padStart(2, '0');
SN.dateKey = (d = new Date()) => `${d.getFullYear()}-${SN.pad(d.getMonth() + 1)}-${SN.pad(d.getDate())}`;
SN.todayKey = () => SN.dateKey(new Date());
SN.parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
SN.MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
SN.DAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
SN.DAYS_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
SN.DAYS_JP = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
SN.fmtDate = (d, withTime) => {
  d = new Date(d); if (isNaN(d)) return '–';
  const s = `${d.getDate()}. ${SN.MONTHS[d.getMonth()].slice(0, 3)}. ${d.getFullYear()}`;
  return withTime ? `${s}, ${SN.pad(d.getHours())}:${SN.pad(d.getMinutes())}` : s;
};
SN.fmtTime = (d) => { d = new Date(d); return `${SN.pad(d.getHours())}:${SN.pad(d.getMinutes())}`; };
SN.fmtRel = (d) => {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (isNaN(diff)) return '–';
  if (diff < 45) return 'gerade eben';
  if (diff < 3600) return `vor ${Math.round(diff / 60)} Min.`;
  if (diff < 86400) return `vor ${Math.round(diff / 3600)} Std.`;
  if (diff < 86400 * 7) { const n = Math.round(diff / 86400); return n === 1 ? 'gestern' : `vor ${n} Tagen`; }
  return SN.fmtDate(d);
};
SN.daysBetween = (a, b) => Math.round((SN.parseKey(b) - SN.parseKey(a)) / 86400000);

// ---------- Text ----------
SN.htmlToText = (html) => { const d = document.createElement('div'); d.innerHTML = html; return d.textContent || ''; };
SN.countWords = (t) => (String(t).match(/[\p{L}\p{N}][\p{L}\p{N}'’\-]*/gu) || []).length;
SN.slug = (s) => String(s).replace(/[\\/:*?"<>|#^[\]]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120);
SN.basename = (p) => p.split('/').pop();
SN.dirname = (p) => { const i = p.lastIndexOf('/'); return i < 0 ? '' : p.slice(0, i); };
SN.noteName = (p) => SN.basename(p).replace(/\.md$/i, '');
SN.ext = (p) => (p.match(/\.([^./]+)$/) || [])[1]?.toLowerCase() || '';
SN.isImage = (p) => ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'avif'].includes(SN.ext(p));
SN.plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;
SN.fmtNum = (n) => Number(n || 0).toLocaleString('de-DE');

// ---------- Event-Bus ----------
const bus = {};
SN.on = (ev, fn) => { (bus[ev] = bus[ev] || []).push(fn); return () => bus[ev] = bus[ev].filter(f => f !== fn); };
SN.emit = (ev, ...a) => (bus[ev] || []).slice().forEach(fn => { try { fn(...a); } catch (e) { console.error(ev, e); } });

// ---------- Icons ----------
SN.icon = (name, size = 18, cls = '') => {
  const p = (SN.ICONS && SN.ICONS[name]) || SN.ICONS?.dot || '';
  return `<svg class="i ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
};
SN.hydrateIcons = (root = document) => SN.$$('.ico[data-i]', root).forEach(e => { if (!e.dataset.done) { e.innerHTML = SN.icon(e.dataset.i, Number(e.dataset.s) || 18); e.dataset.done = 1; } });
SN.ico = (name, size) => SN.h('span.ico', { html: SN.icon(name, size) });

// ---------- Toasts ----------
SN.toast = (msg, type = 'info', ms = 2600) => {
  const icons = { info: 'sparkles', ok: 'check', warn: 'alert', err: 'x-circle', level: 'trophy' };
  const t = SN.h('div.toast.' + type, { html: `${SN.icon(icons[type] || 'sparkles', 18)}<span>${SN.esc(msg)}</span>` });
  SN.$('#toast-root').append(t);
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 400); }, ms);
};

// ---------- Modal ----------
SN.modal = ({ title, sub, body, buttons = [], width = 520, cls = '', onClose, noClose } = {}) => {
  const root = SN.$('#modal-root');
  const back = SN.h('div.modal-back');
  const box = SN.h('div.modal' + (cls ? '.' + cls : ''), { style: { width: typeof width === 'number' ? width + 'px' : width } });
  const close = (val) => { back.classList.remove('in'); setTimeout(() => back.remove(), 220); document.removeEventListener('keydown', onKey, true); onClose && onClose(val); };
  const onKey = (e) => {
    if (e.key === 'Escape' && !noClose) { e.stopPropagation(); close(null); }
    if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'TEXTAREA' && !e.target.isContentEditable && !e.target.closest('[data-own-enter]')) {
      const prim = buttons.find(b => b.primary); if (prim) { e.preventDefault(); e.stopPropagation(); prim.onClick ? prim.onClick(close) : close(true); }
    }
  };
  if (title) box.append(SN.h('div.modal-head', SN.h('div.modal-title', { html: title }), sub ? SN.h('div.modal-sub', sub) : null,
    noClose ? null : SN.h('button.icon-btn.modal-x', { html: SN.icon('x'), onclick: () => close(null) })));
  const bodyEl = SN.h('div.modal-body');
  if (body instanceof Node) bodyEl.append(body); else if (body) bodyEl.innerHTML = body;
  box.append(bodyEl);
  if (buttons.length) {
    const foot = SN.h('div.modal-foot');
    for (const b of buttons) foot.append(SN.h('button.btn' + (b.primary ? '.primary' : '') + (b.danger ? '.danger' : '') + (b.left ? '.left' : ''), {
      html: (b.icon ? SN.icon(b.icon, 16) : '') + `<span>${SN.esc(b.label)}</span>`, onclick: () => b.onClick ? b.onClick(close) : close(b.value ?? true)
    }));
    box.append(foot);
  }
  back.append(box);
  back.addEventListener('mousedown', (e) => { if (e.target === back && !noClose) close(null); });
  root.append(back);
  document.addEventListener('keydown', onKey, true);
  requestAnimationFrame(() => back.classList.add('in'));
  setTimeout(() => { const f = box.querySelector(document.body.classList.contains('mobile') ? '[autofocus]' : '[autofocus], input, textarea, select'); f && f.focus(); f && f.select && f.select(); }, 60);
  return { close, el: box, body: bodyEl };
};
SN.prompt = (title, value = '', placeholder = '', sub) => new Promise(res => {
  const input = SN.h('input.input', { value, placeholder, autofocus: true, spellcheck: 'false' });
  SN.modal({ title, sub, body: input, width: 440, onClose: (v) => res(v === true ? input.value.trim() : (typeof v === 'string' ? v : null)),
    buttons: [{ label: 'Abbrechen', value: null }, { label: 'OK', primary: true, onClick: (c) => c(input.value.trim()) }] });
});
SN.confirm = (title, text, { danger, ok = 'OK' } = {}) => new Promise(res => {
  SN.modal({ title, body: `<p class="muted">${text}</p>`, width: 420, onClose: (v) => res(v === true),
    buttons: [{ label: 'Abbrechen', value: false }, { label: ok, primary: !danger, danger, value: true }] });
});

// ---------- Kontextmenü / Popups ----------
SN.closePops = () => SN.$$('#pop-root > .ctx').forEach(e => e.remove());
SN.ctxMenu = (e, items) => {
  e.preventDefault(); e.stopPropagation();
  SN.closePops();
  const m = SN.h('div.ctx');
  for (const it of items) {
    if (!it) continue;
    if (it.sep) { m.append(SN.h('div.ctx-sep')); continue; }
    if (it.header) { m.append(SN.h('div.ctx-head', it.header)); continue; }
    m.append(SN.h('button.ctx-item' + (it.danger ? '.danger' : ''), {
      html: `${SN.icon(it.icon || 'dot', 16)}<span>${SN.esc(it.label)}</span>${it.kbd ? `<kbd>${it.kbd}</kbd>` : ''}`,
      onclick: (ev) => { ev.stopPropagation(); SN.closePops(); it.onClick && it.onClick(); }
    }));
  }
  SN.$('#pop-root').append(m);
  const x = e.clientX ?? e.x, y = e.clientY ?? e.y;
  const r = m.getBoundingClientRect();
  m.style.left = Math.min(x, innerWidth - r.width - 8) + 'px';
  m.style.top = Math.min(y, innerHeight - r.height - 8) + 'px';
};
SN.menuAt = (anchor, items) => { const r = anchor.getBoundingClientRect(); SN.ctxMenu({ preventDefault() {}, stopPropagation() {}, clientX: r.left, clientY: r.bottom + 4 }, items); };
document.addEventListener('mousedown', (e) => { if (!e.target.closest('.ctx')) SN.closePops(); });
window.addEventListener('blur', () => SN.closePops());

// ---------- Farbwähler-Popup ----------
SN.colorPop = (anchor, colors, onPick, { allowNone = true } = {}) => {
  SN.closePops();
  const m = SN.h('div.ctx.color-pop');
  const grid = SN.h('div.color-grid');
  if (allowNone) grid.append(SN.h('button.swatch.none', { title: 'Keine', onclick: () => { SN.closePops(); onPick(null); } }));
  for (const c of colors) grid.append(SN.h('button.swatch', { style: { background: c }, title: c, onclick: () => { SN.closePops(); onPick(c); } }));
  m.append(grid);
  const custom = SN.h('input', { type: 'color', value: '#e11d48', oninput: (e) => onPick(e.target.value) });
  m.append(SN.h('label.color-custom', SN.ico('palette', 14), 'Eigene Farbe', custom));
  SN.$('#pop-root').append(m);
  const r = anchor.getBoundingClientRect();
  m.style.left = Math.min(r.left, innerWidth - 230) + 'px'; m.style.top = r.bottom + 6 + 'px';
};

// ---------- Sounds (WebAudio, ohne Dateien) ----------
let actx;
SN.sound = (type = 'tick') => {
  if (SN.settings && SN.settings.sounds === false) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const now = actx.currentTime;
    const notes = { done: [880, 1318.5], chime: [659.3, 880, 1174.7, 1568], level: [523.3, 659.3, 784, 1046.5, 1318.5], tick: [1200], pop: [520, 780] }[type] || [880];
    notes.forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type === 'tick' ? 'square' : 'sine'; o.frequency.value = f;
      const t = now + i * (type === 'chime' || type === 'level' ? 0.16 : 0.08);
      const vol = type === 'tick' ? 0.015 : 0.08;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + (type === 'tick' ? 0.04 : 0.9));
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 1);
    });
  } catch { /* kein Audio */ }
};

// ---------- Datei-Helfer ----------
SN.readFileAsArrayBuffer = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsArrayBuffer(file); });
SN.readFileAsDataURL = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
SN.pickFiles = (accept = 'image/*', multiple = false) => new Promise(res => {
  const i = SN.h('input', { type: 'file', accept, multiple });
  i.onchange = () => res(Array.from(i.files || []));
  i.click();
});

// Sanitizer für eingefügtes/importiertes HTML
SN.ALLOWED_TAGS = new Set(['P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'DEL', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'PRE', 'CODE', 'A', 'IMG', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TD', 'TH', 'HR', 'SPAN', 'DIV', 'SUB', 'SUP', 'MARK', 'DETAILS', 'SUMMARY', 'FONT', 'INPUT']);
SN.ALLOWED_STYLE = ['color', 'background-color', 'text-align', 'font-size', 'font-family', 'width', 'float', 'margin-left'];
SN.sanitize = (html, { keepClasses = true } = {}) => {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const walk = (node) => {
    for (const el of Array.from(node.children)) {
      if (!SN.ALLOWED_TAGS.has(el.tagName)) {
        if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'META', 'LINK', 'TITLE', 'HEAD'].includes(el.tagName)) { el.remove(); continue; }
        walk(el); el.replaceWith(...el.childNodes); continue;
      }
      for (const a of Array.from(el.attributes)) {
        const n = a.name.toLowerCase();
        if (n.startsWith('on')) el.removeAttribute(a.name);
        else if (n === 'style') {
          const keep = SN.ALLOWED_STYLE.map(p => el.style.getPropertyValue(p) ? `${p}:${el.style.getPropertyValue(p)}` : '').filter(Boolean).join(';');
          keep ? el.setAttribute('style', keep) : el.removeAttribute('style');
        }
        else if (n === 'href' || n === 'src') { if (/^\s*javascript:/i.test(a.value)) el.removeAttribute(a.name); }
        else if (n === 'class') { if (!keepClasses) el.removeAttribute('class'); }
        else if (!['colspan', 'rowspan', 'alt', 'title', 'open', 'type', 'checked', 'color', 'face', 'size', 'contenteditable', 'target'].includes(n) && !n.startsWith('data-')) el.removeAttribute(a.name);
      }
      if (el.tagName === 'INPUT' && el.type !== 'checkbox') { el.remove(); continue; }
      walk(el);
    }
  };
  walk(tpl.content);
  return tpl.innerHTML;
};
