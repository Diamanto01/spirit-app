/* Spirit Notes – Anime: Liste, Bewertungen, Online-Suche, Tier-Liste, Statistik */
(() => {
  const V = SN.views.anime = {};
  const h = SN.h, $ = SN.$;
  let store;
  const ui = { tab: localStorage.getItem('sn-an-tab') || 'list', status: 'all', q: '', sort: 'updated' };
  const STATUS = {
    watching: { l: 'Schaue ich', c: '#38bdf8', i: 'play' }, completed: { l: 'Abgeschlossen', c: '#34d399', i: 'check' },
    plan: { l: 'Geplant', c: '#a78bfa', i: 'clock' }, paused: { l: 'Pausiert', c: '#facc15', i: 'pause' }, dropped: { l: 'Abgebrochen', c: '#f87171', i: 'x' },
  };
  const SUBS = [['story', 'Story'], ['chars', 'Charaktere'], ['anim', 'Animation'], ['music', 'Musik'], ['fun', 'Spaß']];
  const TIERS = [['S', '#f43f5e'], ['A', '#f97316'], ['B', '#facc15'], ['C', '#34d399'], ['D', '#38bdf8'], ['F', '#a78bfa']];
  const GENRE_DE = { Action: 'Action', Adventure: 'Abenteuer', Comedy: 'Komödie', Drama: 'Drama', Fantasy: 'Fantasy', Romance: 'Romanze', 'Sci-Fi': 'Sci-Fi', 'Slice of Life': 'Slice of Life', Mystery: 'Mystery', Horror: 'Horror', Sports: 'Sport', Supernatural: 'Übernatürlich', Suspense: 'Spannung', Psychological: 'Psycho', Mecha: 'Mecha', Music: 'Musik', 'Award Winning': 'Preisgekrönt', Ecchi: 'Ecchi', Gourmet: 'Essen', 'Boys Love': 'Boys Love', 'Girls Love': 'Girls Love', Harem: 'Harem', School: 'Schule', Isekai: 'Isekai', Military: 'Militär', Historical: 'Historisch', 'Martial Arts': 'Kampfkunst', Mythology: 'Mythologie', 'Time Travel': 'Zeitreise', 'Super Power': 'Superkräfte', Vampire: 'Vampire', Idols: 'Idols' };

  V.init = async () => { store = SN.data.anime = new SN.Store('anime', { list: [] }); await store.load(); await SN.discover.init(); };
  V.STATUS = STATUS; V.GENRE_DE = GENRE_DE;
  V.showTab = (t) => { ui.tab = t; localStorage.setItem('sn-an-tab', t); if (SN.app.view !== 'anime') SN.app.show('anime'); else V.render(); };
  V.list = () => store ? store.value.list : [];
  const save = () => { store.save(); SN.emit('anime'); };
  const cover = (a) => a.cover ? SN.fs.url(a.cover) : '';
  const score = (a) => a.score || 0;
  const subAvg = (a) => { const v = SUBS.map(([k]) => a.scores?.[k]).filter(x => x > 0); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0; };

  V.render = () => {
    const root = $('#view-anime');
    root.innerHTML = '';
    const col = h('div.view-col');
    const seg = h('div.seg', ...[['discover', 'compass', 'Entdecken'], ['list', 'grid', 'Meine Liste'], ['tier', 'trophy', 'Tier-Liste'], ['stats', 'chart', 'Statistik']].map(([k, i, l]) =>
      h('button' + (ui.tab === k ? '.on' : ''), { html: SN.icon(i, 14) + l, onclick: () => { ui.tab = k; localStorage.setItem('sn-an-tab', k); V.render(); } })));
    col.append(h('div.view-head', h('div', h('h2.view-title', { html: 'Anime <span class="jp">アニメ</span>' }), h('div.view-sub', ui.tab === 'discover' ? 'Suchen, Infos lesen, stöbern – finde deinen nächsten Anime.' : 'Deine Watchlist – bewerten, ranken, festhalten.')), h('div.spacer'), seg,
      h('button.btn.primary', { html: SN.icon('plus', 16) + '<span>Anime hinzufügen</span>', onclick: () => V.add() })), h('div.deco-line'));
    const body = h('div.an-body');
    col.append(body);
    root.append(col);
    if (ui.tab === 'discover') SN.discover.render(body);
    else if (ui.tab === 'list') renderList(body);
    else if (ui.tab === 'tier') renderTier(body);
    else renderStats(body);
  };

  // ---------- Liste ----------
  function renderList(body) {
    const all = V.list();
    const search = h('input.input', { placeholder: 'Anime suchen …', value: ui.q, spellcheck: 'false' });
    search.addEventListener('input', SN.debounce(() => { ui.q = search.value; draw(); }, 100));
    const chips = h('div.an-chips',
      h('span.chip' + (ui.status === 'all' ? '.on' : ''), { onclick: () => { ui.status = 'all'; V.render(); } }, `Alle ${all.length}`),
      ...Object.entries(STATUS).map(([k, s]) => h('span.chip' + (ui.status === k ? '.on' : ''), { onclick: () => { ui.status = k; V.render(); } }, h('i.sdot', { style: { background: s.c } }), `${s.l} ${all.filter(a => a.status === k).length}`)),
      h('span.chip' + (ui.status === 'fav' ? '.on' : ''), { onclick: () => { ui.status = 'fav'; V.render(); } }, h('span', { html: SN.icon('heart', 12) }), `Favoriten ${all.filter(a => a.fav).length}`));
    const sort = h('select.select', { style: { width: '190px' }, onchange: (e) => { ui.sort = e.target.value; draw(); } },
      ...[['updated', 'Zuletzt bearbeitet'], ['score', 'Beste Bewertung'], ['title', 'Titel A–Z'], ['year', 'Jahr'], ['progress', 'Fortschritt']].map(([v, l]) => h('option', { value: v, selected: ui.sort === v ? true : null }, l)));
    body.append(h('div.ov-filters', h('div.grow.ov-search', SN.ico('search', 16), search), sort), chips);
    const grid = h('div.anime-grid');
    body.append(grid);
    const draw = () => {
      grid.innerHTML = '';
      let list = all;
      if (ui.status === 'fav') list = list.filter(a => a.fav); else if (ui.status !== 'all') list = list.filter(a => a.status === ui.status);
      const q = ui.q.toLowerCase().trim();
      if (q) list = list.filter(a => (a.title + ' ' + (a.titleJp || '') + ' ' + (a.genres || []).join(' ')).toLowerCase().includes(q));
      const key = { updated: a => a.updated || '', score: a => score(a), title: a => a.title.toLowerCase(), year: a => a.year || 0, progress: a => a.episodes ? a.watched / a.episodes : 0 }[ui.sort];
      list = [...list].sort((a, b) => { const x = key(a), y = key(b); return ui.sort === 'title' ? (x > y ? 1 : -1) : (x > y ? -1 : x < y ? 1 : 0); });
      if (!list.length) grid.append(h('div.empty-hint.an-empty', { html: `${SN.icon('tv', 34)}<br><b>Noch keine Anime hier.</b><br>Füge deinen ersten Anime hinzu – mit Online-Suche inklusive Cover!` }, h('br'), h('button.btn.primary', { style: { marginTop: '12px' }, onclick: () => V.add() }, '+ Anime hinzufügen')));
      list.forEach(a => grid.append(card(a)));
    };
    draw();
  }
  function card(a) {
    const s = STATUS[a.status] || STATUS.plan;
    const pct = a.episodes ? Math.min(1, (a.watched || 0) / a.episodes) : 0;
    const c = h('div.anime-card', { onclick: () => V.detail(a) },
      h('div.ac-cover', { style: cover(a) ? { backgroundImage: `url("${cover(a)}")` } : null },
        !cover(a) ? h('div.ac-nocover', { html: SN.icon('tv', 34) }) : null,
        h('span.ac-status', { style: { background: s.c } }, s.l),
        score(a) ? h('span.ac-score', { html: `${SN.icon('star', 12)} ${score(a).toFixed(1).replace('.0', '')}` }) : null,
        a.fav ? h('span.ac-fav', { html: SN.icon('heart', 14) }) : null,
        a.tier ? h('span.ac-tier', { style: { background: TIERS.find(t => t[0] === a.tier)?.[1] } }, a.tier) : null,
        h('div.ac-hover',
          a.status !== 'completed' ? h('button.btn.small.primary', { html: SN.icon('plus', 13) + '<span>Folge</span>', onclick: (e) => { e.stopPropagation(); V.plusEp(a); V.render(); } }) : null,
          h('button.btn.small', { html: SN.icon('edit', 13), onclick: (e) => { e.stopPropagation(); V.detail(a); } }))),
      h('div.ac-info', h('div.ac-title', { title: a.title }, a.title),
        h('div.ac-meta', `${a.type || 'TV'}${a.year ? ' · ' + a.year : ''} · ${a.watched || 0}/${a.episodes || '?'} Folgen`),
        h('div.ac-prog', h('i', { style: { width: (pct * 100) + '%', background: s.c } }))));
    c.addEventListener('contextmenu', (e) => SN.ctxMenu(e, [
      { label: '+1 Folge', icon: 'plus', onClick: () => { V.plusEp(a); V.render(); } },
      ...Object.entries(STATUS).map(([k, st]) => ({ label: 'Status: ' + st.l, icon: st.i, onClick: () => { setStatus(a, k); V.render(); } })),
      { label: a.fav ? 'Kein Favorit mehr' : 'Als Favorit', icon: 'heart', onClick: () => { a.fav = !a.fav; touch(a); V.render(); } },
      { sep: true }, { label: 'Löschen', icon: 'trash', danger: true, onClick: () => del(a) },
    ]));
    return c;
  }
  const touch = (a) => { a.updated = new Date().toISOString(); save(); };
  function setStatus(a, st) {
    const was = a.status;
    a.status = st;
    if (st === 'watching' && !a.started) a.started = SN.todayKey();
    if (st === 'completed') { if (a.episodes) a.watched = a.episodes; a.finished = a.finished || SN.todayKey(); if (was !== 'completed') { SN.stats.bump('anime', 1); SN.sound('level'); SN.toast(`„${a.title}“ abgeschlossen! Vergiss die Bewertung nicht ✦`, 'ok', 4000); } }
    touch(a);
  }
  V.plusEp = (a) => {
    a.watched = (a.watched || 0) + 1;
    if (a.status === 'plan' || a.status === 'paused') a.status = 'watching';
    if (!a.started) a.started = SN.todayKey();
    SN.sound('pop');
    if (a.episodes && a.watched >= a.episodes) { a.watched = a.episodes; setStatus(a, 'completed'); return; }
    touch(a);
  };
  async function del(a) { if (await SN.confirm('Anime löschen?', `„${SN.esc(a.title)}“ wird aus deiner Liste entfernt.`, { danger: true, ok: 'Löschen' })) { store.value.list = V.list().filter(x => x !== a); save(); V.render(); } }

  V.miniRow = (a, onChange) => {
    const pct = a.episodes ? Math.min(1, (a.watched || 0) / a.episodes) : 0;
    return h('div.anime-mini', { onclick: () => V.detail(a, onChange) },
      h('div.am-cover', { style: cover(a) ? { backgroundImage: `url("${cover(a)}")` } : null }),
      h('div.am-body', h('b', a.title), h('div.ac-prog', h('i', { style: { width: (pct * 100) + '%' } })), h('small.faint', `Folge ${a.watched || 0} von ${a.episodes || '?'}`)),
      h('button.icon-btn', { title: '+1 Folge', html: SN.icon('plus', 16), onclick: (e) => { e.stopPropagation(); V.plusEp(a); onChange && onChange(); } }));
  };

  // ---------- Hinzufügen (mit Online-Suche) ----------
  V.add = () => {
    const q = h('input.input.big', { placeholder: 'Anime-Titel eingeben, z.B. „Frieren“ …', autofocus: true, spellcheck: 'false' });
    const results = h('div.search-results', h('div.empty-hint', { html: `${SN.icon('globe', 26)}<br>Suche online (MyAnimeList, AniList & Kitsu) – Cover, Folgen, Japanischer Titel, Studio, Genres & Jahr werden automatisch übernommen.` }));
    const doSearch = async () => {
      const term = q.value.trim(); if (!term) return;
      results.innerHTML = '<div class="empty-hint"><span class="spinner"></span> Suche …</div>';
      const { list, errors, source } = await V.searchOnline(term);
      results.innerHTML = '';
      if (!list) {
        results.append(h('div.empty-hint', { html: `${SN.icon('alert', 24)}<br><b>Keine Anime-Datenbank erreichbar.</b><br>Prüf deine Internetverbindung oder ob eine Firewall/Antivirus „Spirit Notes“ blockiert.<br>Du kannst den Anime trotzdem manuell hinzufügen.<br><small class="faint">${errors.map(SN.esc).join('<br>')}</small>` }));
        return;
      }
      if (!list.length) { results.append(h('div.empty-hint', 'Nichts gefunden. Versuch einen anderen Titel (z.B. den japanischen oder englischen Namen) oder füge ihn manuell hinzu.')); return; }
      results.append(h('div.faint', { style: { fontSize: '11px', margin: '0 0 2px 2px' } }, 'Quelle: ' + source));
      for (const d of list) {
        const already = V.list().some(a => (d.malId && a.malId === d.malId) || (a.extId && a.extId === d.key));
        results.append(h('div.sr-item' + (already ? '.have' : ''), { onclick: () => { if (already) return SN.toast('Ist schon in deiner Liste', 'warn'); m.close(); fromApi(d); } },
          h('div.sr-cover', { style: d.img ? { backgroundImage: `url("${d.img}")` } : null }),
          h('div.sr-body', h('b', d.title), d.titleEn && d.titleEn !== d.title ? h('small.faint', d.titleEn) : null,
            h('div.sr-meta', [d.type, d.year, d.episodes ? d.episodes + ' Folgen' : null, d.score ? '★ ' + d.score : null].filter(Boolean).join(' · ')),
            h('div.sr-genres', ...d.genres.slice(0, 4).map(g => h('span.chip', g)))),
          already ? h('span.badge', { style: { background: 'var(--line2)' } }, 'In Liste') : h('span.ico', { html: SN.icon('plus', 18) })));
      }
    };
    q.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); doSearch(); } });
    const m = SN.modal({ title: SN.icon('tv', 20) + ' Anime hinzufügen <span class="jp">追加</span>', width: 720,
      body: h('div', h('div.row', h('div.grow', q), h('button.btn.primary', { html: SN.icon('search', 16) + '<span>Suchen</span>', onclick: doSearch })), results),
      buttons: [{ label: 'Manuell hinzufügen', icon: 'edit', left: true, onClick: (c) => { c(); const a = newAnime({ title: q.value.trim() || 'Neuer Anime' }); V.detail(a); } }, { label: 'Schließen' }] });
  };
  // ---------- Online-Datenbanken ----------
  const TYPE_DE = { TV: 'TV', TV_SHORT: 'TV', Movie: 'Film', MOVIE: 'Film', movie: 'Film', OVA: 'OVA', ova: 'OVA', ONA: 'ONA', ona: 'ONA', Special: 'Special', SPECIAL: 'Special', special: 'Special', TV_Special: 'Special', Music: 'Special', MUSIC: 'Special', music: 'Special', tv: 'TV' };
  const de = (g) => GENRE_DE[g] || g;
  const stripHtml = (t) => String(t || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
  V.getJSON = getJSON;
  async function getJSON(url, opts = {}) {
    if (SN.isElectron) return window.spirit.net.request({ url, ...opts });
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 10000);
    try { const r = await fetch(url, { method: opts.method || 'GET', headers: opts.headers, body: opts.body, signal: ctrl.signal }); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json(); } finally { clearTimeout(t); }
  }
  const SOURCES = [
    { name: 'MyAnimeList (Jikan)', run: async (term) => {
      const j = await getJSON(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(term)}&limit=12&sfw=true`);
      return (j.data || []).map(d => ({ key: 'mal:' + d.mal_id, malId: d.mal_id, title: d.title, titleEn: d.title_english, titleJp: d.title_japanese || '',
        img: d.images?.jpg?.large_image_url || d.images?.jpg?.image_url || '', type: TYPE_DE[d.type] || d.type || 'TV', year: d.year || d.aired?.prop?.from?.year || '',
        episodes: d.episodes || 0, score: d.score || 0, genres: (d.genres || []).concat(d.themes || []).map(g => de(g.name)), studio: (d.studios || []).map(s => s.name).join(', '), synopsis: d.synopsis || '' }));
    } },
    { name: 'AniList', run: async (term) => {
      const query = `query ($s: String) { Page(perPage: 12) { media(search: $s, type: ANIME, isAdult: false) { id idMal title { romaji english native } coverImage { extraLarge large } episodes seasonYear startDate { year } format genres averageScore description(asHtml: false) studios(isMain: true) { nodes { name } } } } }`;
      const j = await getJSON('https://graphql.anilist.co', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ query, variables: { s: term } }) });
      if (j.errors && !j.data) throw new Error(j.errors[0]?.message || 'Fehler');
      return (j.data?.Page?.media || []).map(d => ({ key: 'al:' + d.id, malId: d.idMal || null, title: d.title?.romaji || d.title?.english || '', titleEn: d.title?.english, titleJp: d.title?.native || '',
        img: d.coverImage?.extraLarge || d.coverImage?.large || '', type: TYPE_DE[d.format] || 'TV', year: d.seasonYear || d.startDate?.year || '',
        episodes: d.episodes || 0, score: d.averageScore ? d.averageScore / 10 : 0, genres: (d.genres || []).map(de), studio: (d.studios?.nodes || []).map(s => s.name).join(', '), synopsis: stripHtml(d.description) }));
    } },
    { name: 'Kitsu', run: async (term) => {
      const j = await getJSON(`https://kitsu.io/api/edge/anime?filter%5Btext%5D=${encodeURIComponent(term)}&page%5Blimit%5D=12`, { headers: { Accept: 'application/vnd.api+json' } });
      return (j.data || []).map(d => { const x = d.attributes || {}; return { key: 'kitsu:' + d.id, malId: null, title: x.canonicalTitle || x.titles?.en_jp || '', titleEn: x.titles?.en, titleJp: x.titles?.ja_jp || '',
        img: x.posterImage?.large || x.posterImage?.original || '', type: TYPE_DE[x.subtype] || 'TV', year: x.startDate ? Number(x.startDate.slice(0, 4)) : '',
        episodes: x.episodeCount || 0, score: x.averageRating ? Math.round(Number(x.averageRating)) / 10 : 0, genres: [], studio: '', synopsis: x.synopsis || '' }; });
    } },
  ];
  V.searchOnline = async (term) => {
    const errors = [];
    for (const s of SOURCES) {
      try { const list = await s.run(term); return { list, source: s.name, errors }; }
      catch (e) { errors.push(`${s.name}: ${String(e.message || e).replace(/^Error invoking remote method[^:]*:\s*/, '')}`); }
    }
    return { list: null, errors };
  };

  function newAnime(p) {
    const a = { id: SN.uid(), title: 'Neuer Anime', titleJp: '', cover: '', episodes: 0, watched: 0, status: 'plan', score: 0, scores: {}, genres: [], studio: '', year: '', type: 'TV', favChar: '', review: '', fav: false, tier: '', rewatch: 0, started: '', finished: '', note: '', malId: null, synopsis: '', added: new Date().toISOString(), updated: new Date().toISOString(), ...p };
    store.value.list.unshift(a); save();
    return a;
  }
  // Aus „Entdecken“ übernehmen (ohne Detail-Fenster)
  V.addFromMedia = (n, status = 'plan') => {
    const type = { 'TV-Kurz': 'TV', Musik: 'Special' }[n.format] || (['TV', 'Film', 'OVA', 'ONA', 'Special'].includes(n.format) ? n.format : 'TV');
    const img = n.coverXL || n.cover || '';
    const a = newAnime({ title: n.title, titleJp: n.titleJp || '', episodes: n.episodes || 0, year: n.year || '', type, genres: (n.genres || []).slice(0, 6), studio: n.studio || '', malId: n.idMal || null, alId: n.id || null, extId: n.key, synopsis: n.desc || '', cover: img, status });
    if (status === 'watching') a.started = SN.todayKey();
    save();
    if (img && SN.isElectron) window.spirit.net.download(img, 'attachments/anime').then(p => { a.cover = p; save(); }).catch(() => { /* URL bleibt */ });
    return a;
  };
  async function fromApi(d) {
    const img = d.img;
    const a = newAnime({ title: d.title, titleJp: d.titleJp || '', episodes: d.episodes || 0, year: d.year || '', type: d.type || 'TV', genres: d.genres.slice(0, 6), studio: d.studio || '', malId: d.malId || null, extId: d.key, synopsis: d.synopsis || '', cover: img });
    if (ui.tab !== 'list') ui.tab = 'list';
    V.render();
    SN.toast(`„${a.title}“ hinzugefügt`, 'ok');
    if (img && SN.isElectron) {
      try { a.cover = await window.spirit.net.download(img, 'attachments/anime'); save(); V.render(); } catch { /* URL bleibt */ }
    }
    V.detail(a);
  }

  // ---------- Details / Bewerten ----------
  V.detail = (a, onChange) => {
    const refresh = () => { touch(a); if (SN.app.view === 'anime') V.render(); onChange && onChange(); };
    const coverEl = h('div.ad-cover', { style: cover(a) ? { backgroundImage: `url("${cover(a)}")` } : null, title: 'Klicken, um Cover zu ändern' }, !cover(a) ? h('div.ac-nocover', { html: SN.icon('image', 30) + '<small>Cover wählen</small>' }) : null);
    coverEl.onclick = async () => {
      const [f] = await SN.pickFiles('image/*'); if (!f) return;
      a.cover = await SN.fs.saveImage(f, 'attachments/anime', a.title); coverEl.style.backgroundImage = `url("${cover(a)}")`; coverEl.innerHTML = ''; refresh();
    };
    const field = (label, el) => h('label.field', label, el);
    const inp = (key, attrs = {}) => {
      const el = h('input.input', { value: a[key] ?? '', ...attrs });
      const read = () => { a[key] = attrs.type === 'number' ? (el.value === '' ? (key === 'year' ? '' : 0) : Number(el.value) || 0) : el.value; };
      el.addEventListener('input', read);                       // sofort übernehmen (auch wenn direkt „Fertig“/Enter gedrückt wird)
      el.addEventListener('change', () => { read(); refresh(); });
      return el;
    };
    // Sterne (5 Sterne, halbe Schritte = 10 Punkte)
    const stars = h('div.stars');
    const drawStars = (v = a.score) => {
      stars.innerHTML = '';
      for (let i = 1; i <= 5; i++) {
        const fill = SN.clamp(v / 2 - (i - 1), 0, 1);
        const st = h('span.star', { html: `<svg viewBox="0 0 24 24"><defs><linearGradient id="sg${i}"><stop offset="${fill * 100}%" stop-color="var(--accent2)"/><stop offset="${fill * 100}%" stop-color="transparent"/></linearGradient></defs><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" fill="url(#sg${i})" stroke="var(--accent2)" stroke-width="1.3"/></svg>` });
        st.addEventListener('mousemove', (e) => { const half = e.offsetX < st.offsetWidth / 2; drawPreview((i - 1) * 2 + (half ? 1 : 2)); });
        st.addEventListener('click', (e) => { const half = e.offsetX < st.offsetWidth / 2; a.score = (i - 1) * 2 + (half ? 1 : 2); drawStars(); refresh(); SN.sound('pop'); });
        stars.append(st);
      }
      stars.append(h('span.score-num', a.score ? `${a.score}/10` : 'Noch nicht bewertet'));
    };
    const drawPreview = (v) => { const n = stars.querySelector('.score-num'); drawStars(v); stars.querySelector('.score-num').textContent = `${v}/10`; };
    stars.addEventListener('mouseleave', () => drawStars());
    drawStars();
    // Detail-Bewertungen + Radar
    const radar = h('div.radar');
    const drawRadar = () => { radar.innerHTML = radarSVG(a); };
    const subs = h('div.sub-scores', ...SUBS.map(([k, l]) => {
      const val = h('b', a.scores?.[k] ? a.scores[k] : '–');
      const r = h('input', { type: 'range', min: 0, max: 10, step: 1, value: a.scores?.[k] || 0 });
      r.addEventListener('input', () => { a.scores = a.scores || {}; a.scores[k] = Number(r.value); val.textContent = r.value === '0' ? '–' : r.value; drawRadar(); });
      r.addEventListener('change', refresh);
      return h('label.slider-row', h('span', l), r, val);
    }));
    drawRadar();
    // Episoden
    const epVal = h('b.ep-val', `${a.watched || 0} / ${a.episodes || '?'}`);
    const epUpd = () => { epVal.textContent = `${a.watched || 0} / ${a.episodes || '?'}`; if (typeof statusSel !== 'undefined') statusSel.value = a.status; };
    const statusSel = h('select.select', { onchange: (e) => { setStatus(a, e.target.value); epUpd(); refresh(); } }, ...Object.entries(STATUS).map(([k, s]) => h('option', { value: k, selected: a.status === k ? true : null }, s.l)));
    const ep = h('div.ep-stepper',
      h('button.icon-btn', { html: SN.icon('minus', 16), onclick: () => { a.watched = Math.max(0, (a.watched || 0) - 1); epUpd(); refresh(); } }), epVal,
      h('button.icon-btn', { html: SN.icon('plus', 16), onclick: () => { V.plusEp(a); epUpd(); refresh(); } }));
    const favBtn = h('button.btn.small' + (a.fav ? '.primary' : ''), { html: SN.icon('heart', 14) + `<span>${a.fav ? 'Favorit' : 'Favorit?'}</span>`, onclick: () => { a.fav = !a.fav; favBtn.classList.toggle('primary', a.fav); favBtn.querySelector('span').textContent = a.fav ? 'Favorit' : 'Favorit?'; refresh(); } });
    const genres = h('input.input', { value: (a.genres || []).join(', '), placeholder: 'Action, Romanze …' });
    const readGenres = () => { a.genres = genres.value.split(',').map(s => s.trim()).filter(Boolean); };
    genres.addEventListener('input', readGenres);
    genres.addEventListener('change', () => { readGenres(); refresh(); });
    const review = h('textarea.input', { rows: 4, placeholder: 'Deine Meinung, Lieblingsszene, Gedanken …' }, a.review || '');
    review.addEventListener('input', () => { a.review = review.value; });
    review.addEventListener('change', () => { a.review = review.value; refresh(); });
    const noteBtn = h('button.btn.small', { html: SN.icon('feather', 14) + `<span>${a.note && SN.notes.get(a.note) ? 'Review-Notiz öffnen' : 'Ausführliche Review-Notiz'}</span>`, onclick: async () => {
      if (!a.note || !SN.notes.get(a.note)) {
        const tpl = SN.notes.TEMPLATES.find(t => t.id === 'anime');
        let html = SN.notes.fillVars(tpl.html, a.title);
        if (cover(a)) html = `<img data-src="${SN.esc(a.cover)}" style="width:40%;float:right">` + html;
        a.note = await SN.notes.create({ folder: 'Anime', name: a.title, html, fm: { tags: ['anime', 'review'] } });
        refresh();
      }
      m.close(); SN.editor.open(a.note, { newTab: true });
    } });
    const alId = a.alId || Number((/^al:(\d+)$/.exec(a.extId || '') || [])[1]) || null;
    const infoBtn = (alId || a.malId) ? h('button.btn.small', { html: SN.icon('book', 14) + '<span>Infos & Ähnliche</span>', title: 'Handlung, Charaktere, Streaming & ähnliche Anime', onclick: () => { m.close(); SN.discover.info({ key: alId ? 'al:' + alId : 'mal:' + a.malId, id: alId, idMal: a.malId || null, title: a.title, titleEn: '', titleJp: a.titleJp || '', cover: cover(a), coverXL: cover(a), banner: '', format: a.type || '', episodes: a.episodes || 0, year: a.year || '', genres: [], desc: a.synopsis || '', score: 0 }); } }) : null;
    const body = h('div.anime-detail',
      h('div.ad-left', coverEl, h('div.row', { style: { justifyContent: 'center', gap: '6px', marginTop: '10px', flexWrap: 'wrap' } }, favBtn, noteBtn, infoBtn),
        a.synopsis ? h('details.ad-syn', h('summary', 'Handlung (Englisch)'), h('p', a.synopsis)) : null),
      h('div.ad-right',
        h('div.grid2', field('Titel', inp('title')), field('Japanischer Titel', inp('titleJp'))),
        h('div.grid3', field('Typ', (() => { const s = h('select.select', { onchange: (e) => { a.type = e.target.value; refresh(); } }, ...['TV', 'Film', 'OVA', 'ONA', 'Special'].map(t => h('option', { selected: (a.type || 'TV') === t ? true : null }, t))); return s; })()), field('Jahr', inp('year', { type: 'number' })), field('Folgen gesamt', (() => { const el = inp('episodes', { type: 'number', min: 0 }); el.addEventListener('input', epUpd); return el; })())),
        h('div.grid2', field('Status', statusSel), field('Fortschritt', ep)),
        h('label.field', 'Deine Bewertung', stars),
        h('div.ad-scores', subs, radar),
        h('div.grid2', field('Studio', inp('studio')), field('Lieblingscharakter', inp('favChar', { placeholder: 'Wer ist dein Liebling?' }))),
        h('div.grid3', field('Genres', genres), field('Angefangen', inp('started', { type: 'date' })), field('Beendet', inp('finished', { type: 'date' }))),
        field('Kurz-Review', review)));
    const m = SN.modal({ title: SN.icon('tv', 20) + ' ' + SN.esc(a.title), width: 920, body, cls: 'anime-modal',
      buttons: [{ label: 'Löschen', icon: 'trash', danger: true, left: true, onClick: (c) => { c(); del(a); } }, { label: 'Fertig', primary: true, icon: 'check' }],
      onClose: () => { a.review = review.value; refresh(); } });
  };
  function radarSVG(a) {
    const N = SUBS.length, R = 70, cx = 90, cy = 88;
    const pt = (i, r) => { const ang = -Math.PI / 2 + i / N * Math.PI * 2; return [cx + Math.cos(ang) * r, cy + Math.sin(ang) * r]; };
    let grid = '';
    for (const f of [.25, .5, .75, 1]) grid += `<polygon points="${SUBS.map((_, i) => pt(i, R * f).join(',')).join(' ')}" fill="none" stroke="var(--line)" />`;
    const axes = SUBS.map((_, i) => `<line x1="${cx}" y1="${cy}" x2="${pt(i, R)[0]}" y2="${pt(i, R)[1]}" stroke="var(--line)"/>`).join('');
    const vals = SUBS.map(([k], i) => pt(i, R * (a.scores?.[k] || 0) / 10).join(',')).join(' ');
    const labels = SUBS.map(([, l], i) => { const [x, y] = pt(i, R + 14); return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central">${l}</text>`; }).join('');
    const avg = subAvg(a);
    return `<svg viewBox="-24 -4 228 190" class="radar-svg">${grid}${axes}<polygon points="${vals}" fill="color-mix(in srgb, var(--accent) 35%, transparent)" stroke="var(--accent)" stroke-width="2" style="filter:drop-shadow(0 0 6px var(--glow))"/>${labels}</svg><div class="radar-avg"><b>${avg ? avg.toFixed(1) : '–'}</b><span>Spirit-Score</span></div>`;
  }

  // ---------- Tier-Liste ----------
  function renderTier(body) {
    body.append(h('div.faint', { style: { fontSize: '12.5px', marginBottom: '12px' } }, 'Zieh deine Anime in die Reihen. S = Meisterwerk, F = naja … Die Tier-Liste wird automatisch gespeichert.'));
    const wrap = h('div.tier-list');
    const drop = (el, tier) => {
      el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('drop'); });
      el.addEventListener('dragleave', () => el.classList.remove('drop'));
      el.addEventListener('drop', (e) => { e.preventDefault(); el.classList.remove('drop'); const a = V.list().find(x => x.id === e.dataTransfer.getData('text/sn-anime')); if (a) { a.tier = tier; touch(a); V.render(); } });
    };
    const chip = (a) => { const c = h('div.tier-item', { draggable: 'true', title: a.title, style: cover(a) ? { backgroundImage: `url("${cover(a)}")` } : null, ondblclick: () => V.detail(a) }, !cover(a) ? h('span', a.title.slice(0, 18)) : null); c.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/sn-anime', a.id)); return c; };
    for (const [t, c] of TIERS) {
      const items = h('div.tier-items');
      V.list().filter(a => a.tier === t).forEach(a => items.append(chip(a)));
      drop(items, t);
      wrap.append(h('div.tier-row', h('div.tier-label', { style: { background: `linear-gradient(135deg, ${c}, color-mix(in srgb, ${c} 50%, black))` } }, t), items));
    }
    body.append(wrap);
    const pool = h('div.tier-items.pool');
    V.list().filter(a => !a.tier).forEach(a => pool.append(chip(a)));
    drop(pool, '');
    body.append(h('div.rp-h', { style: { marginTop: '16px' } }, 'Noch nicht eingestuft'), pool);
    if (!V.list().length) body.append(h('div.empty-hint', 'Füge zuerst Anime zu deiner Liste hinzu.'));
  }

  // ---------- Statistik ----------
  function renderStats(body) {
    const list = V.list();
    if (!list.length) { body.append(h('div.empty-hint', { html: `${SN.icon('chart', 30)}<br>Sobald du Anime hinzufügst, siehst du hier deine Statistiken.` })); return; }
    const eps = list.reduce((s, a) => s + (a.watched || 0) * (a.type === 'Film' ? 4 : 1), 0);
    const rated = list.filter(a => a.score);
    const avg = rated.length ? rated.reduce((s, a) => s + a.score, 0) / rated.length : 0;
    const hours = Math.round(list.reduce((s, a) => s + (a.watched || 0) * (a.type === 'Film' ? 100 : 24), 0) / 60);
    body.append(h('div.ov-stats',
      h('div.ov-stat', SN.ico('tv', 16), h('b', list.length), h('span', 'Anime')),
      h('div.ov-stat', SN.ico('check', 16), h('b', list.filter(a => a.status === 'completed').length), h('span', 'abgeschlossen')),
      h('div.ov-stat', SN.ico('play', 16), h('b', SN.fmtNum(list.reduce((s, a) => s + (a.watched || 0), 0))), h('span', 'Folgen geschaut')),
      h('div.ov-stat', SN.ico('clock', 16), h('b', SN.fmtNum(hours)), h('span', `Stunden (≈ ${(hours / 24).toFixed(1)} Tage)`)),
      h('div.ov-stat', SN.ico('star', 16), h('b', avg ? avg.toFixed(1) : '–'), h('span', 'Ø Bewertung'))));
    void eps;
    const grid = h('div.stats-grid');
    // Status
    const stCard = h('div.card.ornate', h('div.card-title', { html: `${SN.icon('layers', 16)} Nach Status` }));
    const bar = h('div.stack-bar');
    Object.entries(STATUS).forEach(([k, s]) => { const n = list.filter(a => a.status === k).length; if (n) bar.append(h('i', { style: { flex: n, background: s.c }, title: `${s.l}: ${n}` })); });
    stCard.append(bar, h('div.legend', ...Object.entries(STATUS).map(([k, s]) => h('span', h('i', { style: { background: s.c } }), `${s.l} (${list.filter(a => a.status === k).length})`))));
    grid.append(stCard);
    // Bewertungen
    const hist = h('div.card.ornate', h('div.card-title', { html: `${SN.icon('star', 16)} Bewertungs-Verteilung` }));
    const counts = Array.from({ length: 10 }, (_, i) => list.filter(a => Math.ceil(a.score) === i + 1).length);
    const mx = Math.max(1, ...counts);
    hist.append(h('div.week-chart.hist', ...counts.map((n, i) => h('div.wc-col', h('span.wc-v', n || ''), h('div.wc-bar', h('i', { style: { height: (n / mx * 100) + '%' } })), h('span.wc-l', i + 1)))));
    grid.append(hist);
    // Genres
    const gc = {}; list.forEach(a => (a.genres || []).forEach(g => gc[g] = (gc[g] || 0) + 1));
    const gs = Object.entries(gc).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const gCard = h('div.card.ornate', h('div.card-title', { html: `${SN.icon('tag', 16)} Lieblings-Genres` }));
    if (!gs.length) gCard.append(h('div.empty-hint', 'Noch keine Genres eingetragen.'));
    gs.forEach(([g, n]) => gCard.append(h('div.hbar', h('span', g), h('div.hb', h('i', { style: { width: (n / gs[0][1] * 100) + '%' } })), h('b', n))));
    grid.append(gCard);
    // Top 5
    const top = [...rated].sort((a, b) => b.score - a.score).slice(0, 5);
    const tCard = h('div.card.ornate', h('div.card-title', { html: `${SN.icon('trophy', 16)} Deine Top 5` }));
    if (!top.length) tCard.append(h('div.empty-hint', 'Bewerte Anime, um deine Top 5 zu sehen.'));
    top.forEach((a, i) => tCard.append(h('div.top-row', { onclick: () => V.detail(a) }, h('span.top-rank', '#' + (i + 1)), h('div.am-cover', { style: cover(a) ? { backgroundImage: `url("${cover(a)}")` } : null }), h('b', a.title), h('span.ac-score.inline', { html: `${SN.icon('star', 12)} ${a.score}` }))));
    grid.append(tCard);
    body.append(grid);
  }
})();
