/* Spirit Notes – Anime entdecken: Online-Suche, Infos lesen, Empfehlungen & Stöbern-Feed
   Datenquelle: AniList (GraphQL, kostenlos, ohne Login) – Ersatz: MyAnimeList (Jikan) */
(() => {
  const D = SN.discover = {};
  const h = SN.h;
  const AN = () => SN.views.anime;
  let store;
  const ui = { q: '', genre: '', gsort: 'POPULARITY_DESC', grid: null };
  let renderTok = 0, heroTimer = null;

  D.init = async () => { store = SN.data.discover = new SN.Store('discover', { hidden: {}, tr: {} }); await store.load(); };

  // ---------------------------------------------------------------- Deutsch
  const FORMAT = { TV: 'TV', TV_SHORT: 'TV-Kurz', MOVIE: 'Film', SPECIAL: 'Special', OVA: 'OVA', ONA: 'ONA', MUSIC: 'Musik', Movie: 'Film', Special: 'Special', 'TV Special': 'Special', Music: 'Musik', PV: 'Special', CM: 'Special' };
  const STATUS_DE = { FINISHED: ['Abgeschlossen', '#34d399'], RELEASING: ['Läuft gerade', '#38bdf8'], NOT_YET_RELEASED: ['Angekündigt', '#a78bfa'], CANCELLED: ['Abgesagt', '#f87171'], HIATUS: ['Pausiert', '#facc15'] };
  const SEASON_DE = { WINTER: 'Winter', SPRING: 'Frühling', SUMMER: 'Sommer', FALL: 'Herbst' };
  const SOURCE_DE = { ORIGINAL: 'Original-Story', MANGA: 'Manga', LIGHT_NOVEL: 'Light Novel', VISUAL_NOVEL: 'Visual Novel', VIDEO_GAME: 'Videospiel', NOVEL: 'Roman', WEB_NOVEL: 'Web-Novel', DOUJINSHI: 'Doujinshi', ANIME: 'Anime', LIVE_ACTION: 'Realfilm', GAME: 'Spiel', COMIC: 'Comic', MULTIMEDIA_PROJECT: 'Multimedia-Projekt', PICTURE_BOOK: 'Bilderbuch', OTHER: 'Sonstiges' };
  const REL_DE = { SEQUEL: 'Fortsetzung', PREQUEL: 'Vorgeschichte', SIDE_STORY: 'Nebengeschichte', SPIN_OFF: 'Spin-off', ALTERNATIVE: 'Andere Version', SUMMARY: 'Zusammenfassung', PARENT: 'Hauptgeschichte', ADAPTATION: 'Adaption', SOURCE: 'Vorlage', CHARACTER: 'Gleiche Figuren', COMPILATION: 'Zusammenschnitt', CONTAINS: 'Enthält', OTHER: 'Verwandt' };
  const REL_ORDER = ['PREQUEL', 'SEQUEL', 'PARENT', 'SIDE_STORY', 'SPIN_OFF', 'ALTERNATIVE', 'SUMMARY', 'COMPILATION', 'CHARACTER', 'OTHER'];
  const ROLE_DE = { MAIN: 'Hauptrolle', SUPPORTING: 'Nebenrolle', BACKGROUND: 'Statist' };
  const GENRES = [['Action', 'Action'], ['Adventure', 'Abenteuer'], ['Comedy', 'Komödie'], ['Drama', 'Drama'], ['Fantasy', 'Fantasy'], ['Romance', 'Romanze'], ['Slice of Life', 'Slice of Life'], ['Mystery', 'Mystery'], ['Supernatural', 'Übernatürlich'], ['Sci-Fi', 'Sci-Fi'], ['Psychological', 'Psycho'], ['Thriller', 'Thriller'], ['Horror', 'Horror'], ['Sports', 'Sport'], ['Music', 'Musik'], ['Mecha', 'Mecha'], ['Mahou Shoujo', 'Magical Girl']];
  const GENRE_MAP = Object.fromEntries(GENRES);
  const deGenre = (g) => GENRE_MAP[g] || (AN().GENRE_DE || {})[g] || g;
  const SORTS = [['POPULARITY_DESC', 'Beliebt'], ['SCORE_DESC', 'Beste Bewertung'], ['TRENDING_DESC', 'Gerade angesagt'], ['START_DATE_DESC', 'Neueste']];

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const cssUrl = (u) => u ? `url("${String(u).replace(/["\\\n\r]/g, c => encodeURIComponent(c))}")` : '';
  const fmtScore = (s) => s ? s.toFixed(1) : '';
  const cleanText = (html) => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(String(html).replace(/<br\s*\/?>/gi, '\n'), 'text/html');
    return (doc.body.textContent || '').replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
  };
  const SRC_RE = /\s*[([]\s*(Source|Quelle|Written by)[^)\]]*[)\]]\s*$/i;
  const short = (t) => String(t || '').replace(SRC_RE, '').replace(/\s*\n+\s*/g, ' ').trim();
  const norm = (t) => String(t || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  const seasons = () => {
    const d = new Date(), order = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];
    const i = Math.floor(d.getMonth() / 3), ni = (i + 1) % 4;
    return { season: order[i], year: d.getFullYear(), nextSeason: order[ni], nextYear: ni === 0 ? d.getFullYear() + 1 : d.getFullYear() };
  };
  const relDays = (ts) => {
    const days = Math.round((ts * 1000 - Date.now()) / 86400000);
    return days <= 0 ? 'heute' : days === 1 ? 'morgen' : `in ${days} Tagen`;
  };
  const fmtDate = (d) => d && d.year ? [d.day ? d.day + '.' : '', d.month ? new Date(2000, d.month - 1, 1).toLocaleDateString('de-DE', { month: 'short' }) : '', d.year].filter(Boolean).join(' ') : '';

  // ---------------------------------------------------------------- Netzwerk
  async function getJSON(url, opts = {}) { return AN().getJSON(url, opts); }

  const CARD = `fragment card on Media { id idMal title { romaji english native userPreferred } coverImage { large extraLarge color } bannerImage format episodes duration status season seasonYear averageScore popularity genres description(asHtml: false) studios(isMain: true) { nodes { name } } nextAiringEpisode { episode airingAt } }`;
  const LIST = (args) => `media(${args}, type: ANIME, isAdult: false) { ...card }`;
  const Q = {
    HOME: `query ($season: MediaSeason, $year: Int, $nextSeason: MediaSeason, $nextYear: Int) {
      trending: Page(perPage: 18) { ${LIST('sort: TRENDING_DESC')} }
      season: Page(perPage: 18) { ${LIST('season: $season, seasonYear: $year, sort: POPULARITY_DESC')} }
      next: Page(perPage: 18) { ${LIST('season: $nextSeason, seasonYear: $nextYear, sort: POPULARITY_DESC')} }
      top: Page(perPage: 18) { ${LIST('sort: SCORE_DESC')} }
      popular: Page(perPage: 18) { ${LIST('sort: POPULARITY_DESC')} } } ${CARD}`,
    PAGE: `query ($page: Int, $sort: [MediaSort], $search: String, $genre: String, $season: MediaSeason, $year: Int) { Page(page: $page, perPage: 24) { pageInfo { hasNextPage } media(search: $search, genre: $genre, season: $season, seasonYear: $year, sort: $sort, type: ANIME, isAdult: false) { ...card } } } ${CARD}`,
    DETAIL: `query ($id: Int, $idMal: Int) { Media(id: $id, idMal: $idMal, type: ANIME) { ...card synonyms startDate { year month day } endDate { year month day } source siteUrl trailer { id site thumbnail } tags { name rank isMediaSpoiler } rankings { rank type allTime season year } externalLinks { site url type color }
      characters(sort: [ROLE, RELEVANCE, ID], perPage: 14) { edges { role node { id name { full native } image { medium } } voiceActors(language: JAPANESE, sort: [RELEVANCE, ID]) { name { full } } } }
      relations { edges { relationType(version: 2) node { type ...card } } }
      recommendations(sort: [RATING_DESC, ID], perPage: 14) { nodes { rating mediaRecommendation { ...card } } } } } ${CARD}`,
    RECS: (seeds) => `query { ${seeds.map((s, i) => `r${i}: Media(${s.alId ? 'id: ' + (s.alId | 0) : 'idMal: ' + (s.mal | 0)}, type: ANIME) { id recommendations(sort: [RATING_DESC, ID], perPage: 12) { nodes { rating mediaRecommendation { ...card } } } }`).join(' ')} } ${CARD}`,
  };

  // AniList erlaubt ~30 Anfragen/Minute -> nacheinander, mit kleiner Pause
  let chain = Promise.resolve(), lastAt = 0;
  function gql(query, variables = {}) {
    const run = async () => {
      for (let attempt = 0; ; attempt++) {
        const wait = lastAt + 350 - Date.now(); if (wait > 0) await sleep(wait);
        lastAt = Date.now();
        try {
          const j = await getJSON('https://graphql.anilist.co', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ query, variables }) });
          if (!j || (j.errors && !j.data)) throw new Error((j && j.errors && j.errors[0] && j.errors[0].message) || 'AniList-Fehler');
          return j.data;
        } catch (e) {
          if (attempt === 0 && /429|too many/i.test(e.message || '')) { SN.toast('AniList: kurz zu viele Anfragen – einen Moment …', 'info', 4000); await sleep(15000); continue; }
          throw e;
        }
      }
    };
    const p = chain.then(run, run);
    chain = p.catch(() => {});
    return p;
  }

  // Zwischenspeicher: schnell, schont das Limit und zeigt offline die letzten Daten
  const mem = new Map(), LSK = 'sn-disc-cache';
  let disk = (() => { try { return JSON.parse(localStorage.getItem(LSK) || '{}'); } catch { return {}; } })();
  const persist = SN.debounce(() => {
    try {
      const ks = Object.keys(disk).sort((a, b) => disk[b].t - disk[a].t);
      ks.slice(36).forEach(k => delete disk[k]);
      localStorage.setItem(LSK, JSON.stringify(disk));
    } catch { try { disk = {}; localStorage.removeItem(LSK); } catch { /* egal */ } }
  }, 1000);
  async function cached(key, ttlMin, fn) {
    const hit = mem.get(key) || disk[key];
    if (hit && Date.now() - hit.t < ttlMin * 60000) return hit.v;
    try { const v = await fn(); const e = { t: Date.now(), v }; mem.set(key, e); disk[key] = e; persist(); return v; }
    catch (err) { if (hit) return hit.v; throw err; }
  }

  function fromAL(m) {
    if (!m) return null;
    return {
      key: 'al:' + m.id, id: m.id, idMal: m.idMal || null,
      title: m.title?.romaji || m.title?.english || m.title?.userPreferred || '?', titleEn: m.title?.english || '', titleJp: m.title?.native || '',
      cover: m.coverImage?.large || m.coverImage?.extraLarge || '', coverXL: m.coverImage?.extraLarge || m.coverImage?.large || '', color: m.coverImage?.color || '',
      banner: m.bannerImage || '', format: FORMAT[m.format] || m.format || '', episodes: m.episodes || 0, duration: m.duration || 0,
      status: m.status || '', season: m.season || '', year: m.seasonYear || '', score: m.averageScore ? m.averageScore / 10 : 0, popularity: m.popularity || 0,
      genres: (m.genres || []).filter(g => g !== 'Hentai'), desc: cleanText(m.description), studio: (m.studios?.nodes || []).map(s => s.name).join(', '),
      next: m.nextAiringEpisode ? { ep: m.nextAiringEpisode.episode, at: m.nextAiringEpisode.airingAt } : null,
    };
  }
  function fromJikan(d) {
    return {
      key: 'mal:' + d.mal_id, id: null, idMal: d.mal_id, title: d.title || '?', titleEn: d.title_english || '', titleJp: d.title_japanese || '',
      cover: d.images?.jpg?.image_url || '', coverXL: d.images?.jpg?.large_image_url || d.images?.jpg?.image_url || '', color: '', banner: '',
      format: FORMAT[d.type] || d.type || '', episodes: d.episodes || 0, duration: parseInt(d.duration, 10) || 0,
      status: d.airing ? 'RELEASING' : d.status === 'Not yet aired' ? 'NOT_YET_RELEASED' : 'FINISHED', season: String(d.season || '').toUpperCase(), year: d.year || d.aired?.prop?.from?.year || '',
      score: d.score || 0, popularity: d.members || 0, genres: (d.genres || []).map(g => g.name), desc: (d.synopsis || '').replace(/\[Written by MAL Rewrite\]/g, '').trim(),
      studio: (d.studios || []).map(s => s.name).join(', '), next: null,
    };
  }
  function fromDetail(m) {
    const n = fromAL(m);
    const rk = (m.rankings || []).filter(r => r.type === 'RATED' || r.type === 'POPULAR').sort((a, b) => (b.allTime - a.allTime) || a.rank - b.rank).slice(0, 2);
    const rels = (m.relations?.edges || []).filter(e => e.node && e.node.type === 'ANIME')
      .sort((a, b) => (REL_ORDER.indexOf(a.relationType) + 99) % 99 - (REL_ORDER.indexOf(b.relationType) + 99) % 99);
    return Object.assign(n, {
      full: true, synonyms: m.synonyms || [], start: m.startDate, end: m.endDate, source: SOURCE_DE[m.source] || '', site: m.siteUrl || '',
      trailer: m.trailer && m.trailer.site === 'youtube' && m.trailer.id ? m.trailer.id : '',
      tags: (m.tags || []).filter(t => !t.isMediaSpoiler && t.rank >= 60).slice(0, 10).map(t => t.name),
      rankings: rk.map(r => `#${r.rank} ${r.type === 'RATED' ? 'Bestbewertet' : 'Beliebtheit'}${r.allTime ? ' aller Zeiten' : r.season ? ` ${SEASON_DE[r.season]} ${r.year}` : r.year ? ' ' + r.year : ''}`),
      links: (m.externalLinks || []).filter(l => l.type === 'STREAMING' && /^https:\/\//.test(l.url || '')).map(l => ({ site: l.site, url: l.url, color: l.color || '' })),
      chars: (m.characters?.edges || []).filter(e => e.node).map(e => ({ name: e.node.name?.full || '', jp: e.node.name?.native || '', img: e.node.image?.medium || '', role: ROLE_DE[e.role] || '', va: e.voiceActors?.[0]?.name?.full || '' })),
      rel: rels.map(e => ({ rel: REL_DE[e.relationType] || 'Verwandt', item: fromAL(e.node) })),
      recs: (m.recommendations?.nodes || []).map(x => fromAL(x.mediaRecommendation)).filter(Boolean),
    });
  }

  const api = D.api = {
    home() {
      const s = seasons();
      return cached(`home:${s.season}${s.year}`, 180, async () => {
        try {
          const d = await gql(Q.HOME, s);
          return { src: 'AniList', rows: Object.fromEntries(Object.entries(d).map(([k, v]) => [k, (v?.media || []).map(fromAL)])) };
        } catch (e) {
          console.warn('AniList nicht erreichbar, nehme MyAnimeList', e);
          const J = async (path) => { const j = await getJSON('https://api.jikan.moe/v4/' + path); await sleep(450); return (j.data || []).map(fromJikan); };
          return { src: 'MyAnimeList', rows: { trending: await J('top/anime?filter=airing&limit=18&sfw=true'), season: await J('seasons/now?limit=18&sfw=true'), next: await J('seasons/upcoming?limit=18&sfw=true'), top: await J('top/anime?limit=18&sfw=true'), popular: await J('top/anime?filter=bypopularity&limit=18&sfw=true') } };
        }
      });
    },
    page(vars, page = 1) {
      return cached('page:' + JSON.stringify(vars) + ':' + page, vars.search ? 60 : 180, async () => {
        try {
          const d = await gql(Q.PAGE, { ...vars, page });
          return { items: (d.Page?.media || []).map(fromAL), more: !!d.Page?.pageInfo?.hasNextPage && page < 10 };
        } catch (e) {
          if (!vars.search) throw e;
          const j = await getJSON(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(vars.search)}&limit=24&sfw=true&page=${page}`);
          return { items: (j.data || []).map(fromJikan), more: !!j.pagination?.has_next_page && page < 5 };
        }
      });
    },
    detail(n) {
      const vars = n.id ? { id: n.id } : n.idMal ? { idMal: n.idMal } : null;
      if (!vars) return Promise.reject(new Error('Keine ID'));
      return cached('det:' + JSON.stringify(vars), 720, async () => {
        try { return fromDetail((await gql(Q.DETAIL, vars)).Media); }
        catch (e) {
          if (!n.idMal) throw e;
          const j = await getJSON(`https://api.jikan.moe/v4/anime/${n.idMal | 0}/full`);
          const d = j.data || {};
          return Object.assign(fromJikan(d), { full: true, source: d.source || '', site: d.url || '', trailer: d.trailer?.youtube_id || '', tags: (d.themes || []).map(t => t.name), rankings: d.rank ? [`#${d.rank} Bestbewertet`] : [], links: (d.streaming || []).filter(l => /^https:\/\//.test(l.url || '')).map(l => ({ site: l.name, url: l.url })), chars: [], rel: [], recs: [], start: null, end: null });
        }
      });
    },
    recs(seeds) {
      const key = 'recs:' + seeds.map(s => s.alId ? 'a' + s.alId : 'm' + s.mal).join(',');
      return cached(key, 360, async () => {
        const d = await gql(Q.RECS(seeds));
        return seeds.map((s, i) => (d['r' + i]?.recommendations?.nodes || []).filter(x => x.mediaRecommendation).map(x => ({ n: fromAL(x.mediaRecommendation), r: x.rating || 0 })));
      });
    },
    // Beschreibung ins Deutsche (MyMemory, kostenlos) – Ergebnis wird gespeichert & synchronisiert
    async translate(key, text) {
      const tr = store.value.tr;
      if (tr[key]) return tr[key].t;
      const srcNote = (text.match(SRC_RE) || [''])[0].trim();
      text = text.replace(SRC_RE, '');
      const chunks = [];
      for (const para of text.split(/\n{2,}/)) {
        let cur = '';
        for (const sent of para.match(/[^.!?]+[.!?]*["')\]]*\s*/g) || [para]) {
          if ((cur + sent).length > 440 && cur) { chunks.push([cur, false]); cur = ''; }
          cur += sent;
        }
        if (cur.trim()) chunks.push([cur, false]);
        if (chunks.length) chunks[chunks.length - 1][1] = true;   // Absatzende merken
      }
      let out = '';
      for (const [c, end] of chunks) {
        const j = await getJSON('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(c.trim()) + '&langpair=en|de');
        const t = cleanText(j?.responseData?.translatedText || '');
        if (!t || j.quotaFinished || /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(t) || (j.responseStatus && Number(j.responseStatus) !== 200)) throw new Error('Übersetzungs-Limit erreicht');
        out += t + (end ? '\n\n' : ' ');
      }
      out = (out.trim() + (srcNote ? '\n\n' + srcNote : '')).trim();
      tr[key] = { t: out, d: Date.now() };
      const ks = Object.keys(tr).sort((a, b) => tr[b].d - tr[a].d); ks.slice(150).forEach(k => delete tr[k]);
      store.save();
      return out;
    },
  };

  // ---------------------------------------------------------------- Liste
  D.inList = (n) => {
    const t = norm(n.title), te = norm(n.titleEn);
    return AN().list().find(a => (n.idMal && a.malId === n.idMal) || (n.id && a.alId === n.id) || (a.extId && a.extId === n.key) || (t && norm(a.title) === t) || (te && norm(a.title) === te));
  };
  const hidden = (n) => !!(store && store.value.hidden[n.key]);
  const fresh = (n) => !D.inList(n) && !hidden(n);
  D.add = (n, status = 'plan') => {
    const have = D.inList(n); if (have) return have;
    const a = AN().addFromMedia({ ...n, genres: n.genres.map(deGenre) }, status);
    SN.toast(status === 'watching' ? `„${n.title}“ – viel Spaß beim Schauen!` : `„${n.title}“ gemerkt (Geplant) ✦`, 'ok');
    refreshCards();
    return a;
  };
  D.hide = (n) => { store.value.hidden[n.key] = SN.todayKey(); store.save(); };
  function refreshCards() {
    SN.$$('.dcard[data-key]').forEach(c => {
      const n = c._n; if (!n) return;
      const a = D.inList(n);
      c.classList.toggle('have', !!a);
      const b = c.querySelector('.dc-add'); if (b) b.innerHTML = SN.icon(a ? 'check' : 'plus', 15);
      const old = c.querySelector('.dc-have'); old && old.remove();
      if (a) c.querySelector('.dc-cover').append(haveBadge(a));
    });
  }
  const haveBadge = (a) => { const st = (AN().STATUS || {})[a.status] || { l: 'In Liste', c: 'var(--accent)' }; return h('span.dc-have', { style: { background: st.c } }, st.l); };

  // ---------------------------------------------------------------- Persönliche Tipps
  function seeds() {
    const w = (a) => (a.fav ? 3 : 0) + (a.score || (a.status === 'completed' ? 6 : a.status === 'watching' ? 5.5 : 0)) + (a.tier === 'S' ? 2 : a.tier === 'A' ? 1 : 0);
    return AN().list()
      .map(a => ({ a, w: w(a), alId: a.alId || Number((/^al:(\d+)$/.exec(a.extId || '') || [])[1]) || null, mal: a.malId || null }))
      .filter(s => (s.alId || s.mal) && s.a.status !== 'dropped' && s.w >= 5)
      .sort((x, y) => y.w - x.w).slice(0, 6);
  }
  async function personal() {
    const S = seeds(); if (!S.length) return null;
    const per = await api.recs(S);
    const score = new Map();
    per.forEach((list, i) => list.forEach(({ n, r }, pos) => {
      const e = score.get(n.key) || { n, s: 0 };
      e.s += S[i].w * (Math.log(r + 2) + (12 - pos) / 6);
      score.set(n.key, e);
    }));
    const all = [...score.values()].sort((a, b) => b.s - a.s).map(e => e.n);
    return { all, because: { title: S[0].a.title, items: (per[0] || []).map(x => x.n) } };
  }

  // ---------------------------------------------------------------- Bausteine
  function card(n, { rank, onOpen } = {}) {
    const a = D.inList(n);
    const c = h('div.dcard' + (a ? '.have' : ''), { data: { key: n.key }, title: n.title + (n.titleEn && n.titleEn !== n.title ? '\n' + n.titleEn : ''), onclick: () => (onOpen || D.info)(n) },
      h('div.dc-cover', { style: { backgroundImage: cssUrl(n.cover) || null, '--c': n.color || null } },
        !n.cover ? h('div.ac-nocover', { html: SN.icon('tv', 28) }) : null,
        n.score ? h('span.dc-score', { html: `${SN.icon('star', 11)}${fmtScore(n.score)}` }) : null,
        rank ? h('span.dc-rank', '#' + rank) : null,
        a ? haveBadge(a) : null,
        h('button.dc-add', { title: 'Merken (als „Geplant“ in deine Liste)', html: SN.icon(a ? 'check' : 'plus', 15), onclick: (e) => { e.stopPropagation(); const x = D.inList(n); if (x) AN().detail(x); else D.add(n); } })),
      h('div.dc-title', n.title),
      h('div.dc-meta', [n.format, n.year, n.episodes ? n.episodes + ' Folgen' : null].filter(Boolean).join(' · ')));
    c._n = n;
    return c;
  }
  function row(title, icon, items, { more, sub, ranked } = {}) {
    if (!items || !items.length) return null;
    const track = h('div.dr-track', ...items.map((n, i) => card(n, { rank: ranked ? i + 1 : 0 })));
    const step = (dir) => track.scrollBy({ left: dir * track.clientWidth * 0.85, behavior: 'smooth' });
    return h('section.drow',
      h('div.dr-head', h('h3', { html: SN.icon(icon, 17) + `<span>${SN.esc(title)}</span>` }), sub ? h('span.dr-sub', sub) : null, h('div.spacer'),
        more ? h('button.btn.small.ghost', { html: '<span>Alle ansehen</span>' + SN.icon('chev-r', 14), onclick: () => { ui.grid = more; draw(); } }) : null),
      h('div.dr-wrap', h('button.dr-arrow.l', { html: SN.icon('chev-l', 20), onclick: () => step(-1) }), track, h('button.dr-arrow.r', { html: SN.icon('chev-r', 20), onclick: () => step(1) })));
  }
  const chips = (n, cls = '') => h('div.dchips' + cls,
    ...[n.format, n.episodes ? `${n.episodes} Folgen` : null, n.duration ? `${n.duration} Min.` : null, n.season && SEASON_DE[n.season] ? `${SEASON_DE[n.season]} ${n.year}` : n.year || null].filter(Boolean).map(t => h('span', t)),
    STATUS_DE[n.status] ? h('span.st', { style: { '--st': STATUS_DE[n.status][1] } }, STATUS_DE[n.status][0]) : null);
  const skeletonRow = () => h('section.drow.skel', h('div.dr-head', h('h3', h('i.sk', { style: { width: '180px' } }))), h('div.dr-track', ...Array.from({ length: 8 }, () => h('div.dcard', h('div.dc-cover.sk'), h('div.dc-title', h('i.sk')), h('div.dc-meta', h('i.sk', { style: { width: '60%' } }))))));
  function errorBox(e, retry) {
    return h('div.empty-hint.disc-err', { html: `${SN.icon('cloud-off', 30)}<br><b>Anime-Datenbank gerade nicht erreichbar.</b><br>Prüf deine Internetverbindung – ansonsten ist AniList kurz überlastet.<br><small class="faint">${SN.esc(String(e.message || e).replace(/^Error invoking remote method[^:]*:\s*/, ''))}</small><br>` },
      h('button.btn.small', { style: { marginTop: '10px' }, html: SN.icon('refresh', 14) + '<span>Nochmal versuchen</span>', onclick: retry }));
  }

  // ---------------------------------------------------------------- Ansicht „Entdecken“
  let mainEl = null, searchEl = null;
  D.render = (body) => {
    clearInterval(heroTimer);
    body.classList.add('disc');
    searchEl = h('input.input', { type: 'search', placeholder: 'Anime suchen – z. B. „Date A Live“, „Frieren“ …', value: ui.q, spellcheck: 'false', autocomplete: 'off', enterkeyhint: 'search' });
    const go = () => {
      const q = searchEl.value.trim(); if (q === ui.q) return;
      const was = ui.q.length >= 2; ui.q = q;
      if (q.length >= 2) { ui.genre = ''; ui.grid = null; SN.$$('.disc-genres .chip').forEach(c => c.classList.remove('on')); draw(); }
      else if (was) { SN.$$('.disc-genres .chip').forEach((c, i) => c.classList.toggle('on', i === 0)); draw(); }
    };
    searchEl.addEventListener('input', SN.debounce(go, 550));
    searchEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); go(); if (SN.mobile.active) searchEl.blur(); } });
    const genreBar = h('div.disc-genres',
      h('span.chip' + (!ui.genre ? '.on' : ''), { onclick: () => { ui.genre = ''; ui.q = ''; ui.grid = null; searchEl.value = ''; draw(); markGenres(); } }, 'Für dich'),
      ...GENRES.map(([g, l]) => h('span.chip' + (ui.genre === g ? '.on' : ''), { data: { g }, onclick: () => { ui.genre = g; ui.q = ''; ui.grid = null; searchEl.value = ''; draw(); markGenres(); } }, l)));
    const markGenres = () => genreBar.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', (c.dataset.g || '') === ui.genre && !ui.q && !ui.grid));
    body.append(
      h('div.disc-top',
        h('div.grow.ov-search', SN.ico('search', 16), searchEl),
        h('button.btn.primary', { title: 'Durch Anime scrollen – Merken oder weiter', html: SN.icon('scroll', 16) + '<span>Stöbern</span>', onclick: () => D.feed() }),
        h('button.btn', { title: 'Zufälliger Tipp, den du noch nicht kennst', html: SN.icon('dice', 16) + '<span>Überrasch mich</span>', onclick: surprise })),
      genreBar);
    mainEl = h('div.disc-main');
    body.append(mainEl);
    draw();
  };
  function draw() {
    if (!mainEl) return;
    const tok = ++renderTok;
    clearInterval(heroTimer);
    mainEl.innerHTML = '';
    if (ui.q.length >= 2) gridView({ title: `Suche: „${ui.q}“`, vars: { search: ui.q, sort: ['SEARCH_MATCH'] }, search: true }, tok);
    else if (ui.grid) gridView(ui.grid, tok);
    else if (ui.genre) gridView({ title: deGenre(ui.genre), vars: { genre: ui.genre, sort: [ui.gsort] }, sorts: true }, tok);
    else homeView(tok);
    mainEl.parentElement && (mainEl.parentElement.scrollTop = 0);
  }
  const back = () => { ui.q = ''; ui.grid = null; ui.genre = ''; if (searchEl) searchEl.value = ''; SN.$$('.disc-genres .chip').forEach((c, i) => c.classList.toggle('on', i === 0)); draw(); };

  async function homeView(tok) {
    const s = seasons();
    mainEl.append(h('div.dhero.sk'), skeletonRow(), skeletonRow());
    let home;
    try { home = await api.home(); } catch (e) { if (tok !== renderTok) return; mainEl.innerHTML = ''; mainEl.append(errorBox(e, draw)); return; }
    if (tok !== renderTok) return;
    mainEl.innerHTML = '';
    const R = home.rows;
    hero(R.trending.filter(n => n.banner || n.coverXL).slice(0, 6), tok);
    const recWrap = h('div.disc-recs');
    mainEl.append(recWrap);
    [row('Gerade angesagt', 'flame', R.trending, { more: { title: 'Gerade angesagt', vars: { sort: ['TRENDING_DESC'] } } }),
      row(`${SEASON_DE[s.season]} ${s.year}`, 'calendar', R.season, { sub: 'läuft gerade', more: { title: `${SEASON_DE[s.season]} ${s.year}`, vars: { season: s.season, year: s.year, sort: ['POPULARITY_DESC'] } } }),
      row(`Bald: ${SEASON_DE[s.nextSeason]} ${s.nextYear}`, 'clock', R.next, { sub: 'kommt demnächst', more: { title: `${SEASON_DE[s.nextSeason]} ${s.nextYear}`, vars: { season: s.nextSeason, year: s.nextYear, sort: ['POPULARITY_DESC'] } } }),
      row('Am besten bewertet', 'trophy', R.top, { ranked: true, more: { title: 'Am besten bewertet', vars: { sort: ['SCORE_DESC'] } } }),
      row('Beliebteste aller Zeiten', 'heart', R.popular, { ranked: true, more: { title: 'Beliebteste aller Zeiten', vars: { sort: ['POPULARITY_DESC'] } } }),
    ].forEach(r => r && mainEl.append(r));
    mainEl.append(h('div.disc-src', `Daten: ${home.src} · Beschreibungen auf Englisch – in den Infos kannst du sie übersetzen lassen.`));
    // Persönliche Empfehlungen nachladen
    if (!seeds().length) {
      recWrap.append(h('div.disc-tip', { html: `${SN.icon('sparkles', 18)}<div><b>Persönliche Tipps freischalten</b><br><span class="faint">Füge Anime über die Online-Suche zu deiner Liste hinzu und bewerte sie mit Sternen – dann schlage ich dir hier passende Anime vor.</span></div>` }));
      return;
    }
    recWrap.append(skeletonRow());
    try {
      const p = await personal();
      if (tok !== renderTok) return;
      recWrap.innerHTML = '';
      const forYou = p.all.filter(fresh).slice(0, 24);
      const bc = p.because.items.filter(fresh).slice(0, 18);
      if (forYou.length) recWrap.append(row('Für dich empfohlen', 'sparkles', forYou, { sub: 'passend zu deiner Liste' }));
      if (bc.length >= 4) recWrap.append(row(`Weil du „${p.because.title}“ magst`, 'heart', bc));
    } catch (e) { if (tok === renderTok) recWrap.innerHTML = ''; console.warn('Empfehlungen', e); }
  }

  function hero(items, tok) {
    if (!items.length) return;
    const el = h('div.dhero');
    let i = 0;
    const show = () => {
      const n = items[i];
      el.innerHTML = '';
      el.style.setProperty('--bg-img', cssUrl(n.banner || n.coverXL));
      el.classList.toggle('nobanner', !n.banner);
      el.append(h('div.dh-shade'),
        h('div.dh-body',
          h('div.dh-kicker', { html: `${SN.icon('flame', 13)} Angesagt #${i + 1}` }),
          h('h2.dh-title', n.title), n.titleEn && n.titleEn !== n.title ? h('div.dh-sub', n.titleEn) : null,
          h('div.dh-meta', n.score ? h('b.dh-score', { html: `${SN.icon('star', 13)} ${fmtScore(n.score)}` }) : null, chips(n), h('div.dh-genres', n.genres.slice(0, 4).map(deGenre).join(' · '))),
          h('p.dh-desc', short(n.desc)),
          h('div.dh-btns', h('button.btn.primary', { html: SN.icon('info', 15) + '<span>Infos lesen</span>', onclick: () => D.info(n) }), addButtons(n, null, true))),
        h('div.dh-cover', { style: { backgroundImage: cssUrl(n.coverXL) } }),
        h('div.dh-dots', ...items.map((_, k) => h('i' + (k === i ? '.on' : ''), { onclick: (e) => { e.stopPropagation(); i = k; show(); } }))));
    };
    show();
    heroTimer = setInterval(() => {
      if (tok !== renderTok || !document.body.contains(el)) return clearInterval(heroTimer);
      if (el.matches(':hover') || document.hidden) return;
      i = (i + 1) % items.length; show();
    }, 9000);
    mainEl.append(el);
  }

  function addButtons(n, onDone, compact) {
    const wrap = h('div.d-addbtns');
    const upd = () => {
      wrap.innerHTML = '';
      const a = D.inList(n);
      if (a) {
        const st = (AN().STATUS || {})[a.status] || { l: 'In Liste' };
        wrap.append(h('button.btn', { html: SN.icon('check', 15) + `<span>In deiner Liste · ${SN.esc(st.l)}</span>`, onclick: () => { onDone && onDone(); AN().detail(a); } }));
      } else {
        wrap.append(h('button.btn' + (compact ? '' : '.primary'), { title: 'Als „Geplant“ in deine Liste', html: SN.icon('plus', 15) + '<span>Merken</span>', onclick: () => { D.add(n, 'plan'); upd(); } }),
          compact ? null : h('button.btn', { html: SN.icon('play', 15) + '<span>Schaue ich</span>', onclick: () => { D.add(n, 'watching'); upd(); } }));
      }
    };
    upd();
    return wrap;
  }

  function gridView(cfg, tok) {
    const head = h('div.dg-head',
      h('button.btn.small', { html: SN.icon('chev-l', 14) + '<span>Zurück</span>', onclick: back }),
      h('h3', cfg.title), h('div.spacer'),
      cfg.sorts ? h('select.select', { style: { width: '180px' }, onchange: (e) => { ui.gsort = e.target.value; draw(); } }, ...SORTS.map(([v, l]) => h('option', { value: v, selected: ui.gsort === v ? true : null }, l))) : null);
    const grid = h('div.dgrid');
    const more = h('div.dg-more', { html: '<span class="spinner"></span> Lade …' });
    mainEl.append(head, grid, more);
    let page = 0, hasMore = true, busy = false;
    const load = async () => {
      if (busy || !hasMore || tok !== renderTok) return;
      busy = true;
      try {
        const r = await api.page(cfg.vars, page + 1);
        if (tok !== renderTok) return;
        page++; hasMore = r.more;
        const items = r.items;
        items.forEach(n => grid.append(card(n)));
        if (page === 1 && !items.length) grid.append(h('div.empty-hint.wide', cfg.search ? 'Nichts gefunden. Versuch den englischen oder japanischen Titel.' : 'Hier gibt es (noch) nichts.'));
      } catch (e) { hasMore = false; more.replaceWith(errorBox(e, draw)); return; }
      finally { busy = false; }
      more.style.display = hasMore ? '' : 'none';
      requestAnimationFrame(() => { if (hasMore && more.getBoundingClientRect().top < innerHeight + 500) load(); });
    };
    const io = new IntersectionObserver((es) => { if (tok !== renderTok) return io.disconnect(); if (es.some(e => e.isIntersecting)) load(); }, { rootMargin: '500px' });
    io.observe(more);
    load();
  }

  async function surprise() {
    SN.toast('Ich suche dir etwas Passendes raus …', 'info', 1800);
    let pool = [];
    try { const p = await personal(); if (p) pool = p.all.filter(fresh).slice(0, 30); } catch { /* egal */ }
    if (pool.length < 8) { try { const hm = await api.home(); pool = pool.concat(hm.rows.top, hm.rows.trending, hm.rows.popular).filter(fresh); } catch (e) { return SN.toast('Gerade keine Verbindung zur Anime-Datenbank', 'warn'); } }
    if (!pool.length) return SN.toast('Du kennst ja schon alles! 😮', 'info');
    D.info(pool[Math.floor(Math.random() * pool.length)], { surprise: true });
  }

  // ---------------------------------------------------------------- Infos (lesen)
  D.info = (n0, opts = {}) => {
    const root = h('div.ai');
    const stack = [];
    const m = SN.modal({ title: SN.icon('book', 19) + ' Anime-Info <span class="jp">情報</span>', width: 1020, cls: 'an-info-modal', body: root });
    const open = async (n, push) => {
      if (push && cur) stack.push(cur);
      cur = n;
      paint(n, true);
      m.body.scrollTop = 0;
      if (n.full) return;
      try {
        const full = await api.detail(n);
        if (cur !== n || !document.body.contains(root)) return;
        cur = full; paint(full, false);
      } catch (e) {
        if (cur !== n) return;
        paint(n, false);
        root.querySelector('.ai-main')?.append(h('div.faint.ai-note', { html: `${SN.icon('cloud-off', 14)} Mehr Details (Charaktere, Ähnliche, Streaming) konnten gerade nicht geladen werden.` }));
      }
    };
    let cur = null;
    const paint = (n, loading) => {
      root.innerHTML = '';
      const st = STATUS_DE[n.status];
      const heroEl = h('div.ai-hero' + (n.banner ? '' : '.nobanner'), { style: { '--bg-img': cssUrl(n.banner || n.coverXL || n.cover) } },
        h('div.ai-cover', { style: { backgroundImage: cssUrl(n.coverXL || n.cover) } }),
        h('div.ai-head',
          stack.length ? h('button.btn.small.ai-back', { html: SN.icon('chev-l', 14) + `<span>Zurück zu „${SN.esc(stack[stack.length - 1].title)}“</span>`, onclick: () => open(stack.pop(), false) }) : null,
          opts.surprise && !stack.length ? h('div.dh-kicker', { html: `${SN.icon('dice', 13)} Zufalls-Tipp für dich` }) : null,
          h('h2.ai-title', n.title),
          h('div.ai-alt', [n.titleEn !== n.title ? n.titleEn : '', n.titleJp].filter(Boolean).join(' · ')),
          chips(n),
          h('div.ai-scoreline',
            n.score ? h('div.ai-score', { html: `${SN.icon('star', 18)}<b>${fmtScore(n.score)}</b><small>/10</small>` }) : null,
            ...(n.rankings || []).map(r => h('span.ai-rank', { html: SN.icon('trophy', 12) + SN.esc(r) })),
            n.popularity ? h('span.ai-rank', { html: SN.icon('users', 12) + `${SN.fmtNum(n.popularity)} Fans` }) : null)));
      const actions = h('div.ai-actions', addButtons(n, () => m.close()),
        n.trailer ? h('button.btn', { html: SN.icon('play', 15) + '<span>Trailer</span>', onclick: () => SN.app.openExternal('https://www.youtube.com/watch?v=' + encodeURIComponent(n.trailer)) }) : null,
        h('div.spacer'),
        /^https:\/\//.test(n.site || '') ? h('button.btn.small.ghost', { title: 'Auf AniList öffnen', html: SN.icon('external', 14) + '<span>AniList</span>', onclick: () => SN.app.openExternal(n.site) }) : null,
        n.idMal ? h('button.btn.small.ghost', { title: 'Auf MyAnimeList öffnen', html: SN.icon('external', 14) + '<span>MAL</span>', onclick: () => SN.app.openExternal('https://myanimelist.net/anime/' + (n.idMal | 0)) }) : null);
      // Handlung
      const descBox = h('div.ai-desc');
      const trKey = n.key;
      const showDesc = (lang) => {
        descBox.innerHTML = '';
        const de = store.value.tr[trKey]?.t;
        const text = lang === 'de' && de ? de : n.desc;
        if (!text) { descBox.append(h('p.faint', 'Noch keine Beschreibung vorhanden.')); return; }
        text.split(/\n{2,}/).forEach(p => descBox.append(h('p', p)));
        const btn = lang === 'de' && de
          ? h('button.btn.small.ghost', { html: SN.icon('languages', 14) + '<span>Original (Englisch)</span>', onclick: () => showDesc('en') })
          : h('button.btn.small', { html: SN.icon('languages', 14) + '<span>Auf Deutsch übersetzen</span>', onclick: async (e) => {
            const b = e.currentTarget; b.disabled = true; b.innerHTML = '<span class="spinner"></span><span>Übersetze …</span>';
            try { await api.translate(trKey, n.desc); showDesc('de'); }
            catch (err) {
              b.disabled = false; b.innerHTML = SN.icon('languages', 14) + '<span>Auf Deutsch übersetzen</span>';
              SN.toast('Der kostenlose Übersetzer ist für heute ausgelastet – ich öffne Google Übersetzer.', 'warn', 5000);
              SN.app.openExternal('https://translate.google.com/?sl=en&tl=de&op=translate&text=' + encodeURIComponent(n.desc.slice(0, 4500)));
            }
          } });
        descBox.append(h('div.ai-desc-foot', lang === 'de' && de ? h('span.faint', 'maschinell übersetzt') : h('span.faint', 'Englisch'), btn));
      };
      showDesc(store.value.tr[trKey] ? 'de' : 'en');
      const main = h('div.ai-main', h('h4', { html: SN.icon('book', 15) + ' Handlung' }), descBox);
      if (loading) main.append(h('h4', { html: SN.icon('users', 15) + ' Charaktere' }), h('div.ai-chars', ...Array.from({ length: 6 }, () => h('div.ai-char', h('i.sk.round'), h('i.sk')))));
      if (n.chars && n.chars.length) main.append(h('h4', { html: SN.icon('users', 15) + ' Charaktere' }),
        h('div.ai-chars', ...n.chars.map(c => h('div.ai-char', { title: [c.name, c.jp, c.va ? 'Sprecher/in: ' + c.va : ''].filter(Boolean).join('\n') },
          h('div.ai-ch-img', { style: { backgroundImage: cssUrl(c.img) } }), h('b', c.name), h('small', c.role), c.va ? h('small.faint', c.va) : null))));
      const sub = (n2) => card(n2, { onOpen: (x) => open(x, true) });
      if (n.rel && n.rel.length) main.append(h('h4', { html: SN.icon('layers', 15) + ' Verwandte Anime' }),
        h('div.dr-track.ai-track', ...n.rel.map(r => { const c = sub(r.item); c.prepend(h('div.dc-rel', r.rel)); return c; })));
      const recs = (n.recs || []);
      if (recs.length) main.append(h('h4', { html: SN.icon('sparkles', 15) + ' Ähnliche Anime – was du danach schauen kannst' }), h('div.dr-track.ai-track', ...recs.map(sub)));
      // Seitenleiste
      const info = [
        ['Studio', n.studio], ['Vorlage', n.source], ['Folgen', n.episodes ? `${n.episodes}${n.duration ? ` × ${n.duration} Min.` : ''}` : (n.status === 'RELEASING' ? 'laufend' : '')],
        ['Ausstrahlung', [fmtDate(n.start), fmtDate(n.end)].filter(Boolean).join(' – ')],
        ['Nächste Folge', n.next ? `Folge ${n.next.ep} · ${new Date(n.next.at * 1000).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })} (${relDays(n.next.at)})` : ''],
        ['Andere Titel', (n.synonyms || []).slice(0, 3).join(', ')],
      ].filter(x => x[1]);
      const side = h('div.ai-side');
      if (n.links && n.links.length) side.append(h('h4', { html: SN.icon('play', 15) + ' Wo schauen?' }),
        h('div.ai-links', ...n.links.map(l => h('button.ai-link', { style: { '--lc': l.color || 'var(--accent)' }, onclick: () => SN.app.openExternal(l.url) }, h('i'), l.site, h('span', { html: SN.icon('external', 12) })))),
        h('div.faint.ai-small', 'Was verfügbar ist, hängt von deinem Land ab.'));
      side.append(h('h4', { html: SN.icon('info', 15) + ' Infos' }), h('dl.ai-dl', ...info.flatMap(([k, v]) => [h('dt', k), h('dd', v)])));
      if (n.genres.length) side.append(h('h4', { html: SN.icon('tag', 15) + ' Genres' }), h('div.ai-genres', ...n.genres.map(g => h('span.chip', { title: 'Mehr aus diesem Genre', onclick: () => { if (!GENRE_MAP[g]) return; m.close(); ui.genre = g; ui.q = ''; ui.grid = null; if (SN.app.view !== 'anime' || !SN.$('.an-body.disc')) { AN().showTab('discover'); } else { if (searchEl) searchEl.value = ''; draw(); SN.$$('.disc-genres .chip').forEach(c => c.classList.toggle('on', (c.dataset.g || '') === g)); } } }, deGenre(g)))));
      if (n.tags && n.tags.length) side.append(h('h4', { html: SN.icon('sparkles', 15) + ' Stichworte' }), h('div.ai-genres.tags', ...n.tags.map(t => h('span.chip', t))));
      root.append(heroEl, actions, h('div.ai-body', main, side));
    };
    open(n0, false);
    return m;
  };

  // ---------------------------------------------------------------- Stöbern (Feed)
  D.feed = (mode = 'mix') => {
    SN.$('.an-feed')?.remove();
    const ov = h('div.an-feed');
    const list = h('div.af-list');
    const counter = h('span.af-count');
    const seen = new Set();
    let items = [], loading = false, done = false, streams = null, pattern = [], pi = 0;
    const MODES = [['mix', 'Für dich'], ['trending', 'Angesagt'], ['top', 'Beste'], ['new', 'Neu']];
    const seg = h('div.seg.af-seg', ...MODES.map(([k, l]) => h('button' + (k === mode ? '.on' : ''), { onclick: () => { ov.remove(); document.removeEventListener('keydown', onKey, true); D.feed(k); } }, l)));
    const close = () => { ov.classList.remove('in'); document.removeEventListener('keydown', onKey, true); setTimeout(() => ov.remove(), 250); };
    ov.append(h('div.af-top', h('button.icon-btn.af-x', { title: 'Schließen', html: SN.icon('x', 20), onclick: close }), h('div.af-title', { html: 'Stöbern <span class="jp">探す</span>' }), seg, counter), list);
    document.body.append(ov);
    requestAnimationFrame(() => ov.classList.add('in'));

    const pager = (vars) => ({ buf: [], page: 0, more: true, async next() {
      while (!this.buf.length && this.more) { const r = await api.page(vars, ++this.page); this.buf.push(...r.items); this.more = r.more; }
      return this.buf.shift() || null;
    } });
    const fromArr = (arr) => ({ buf: arr.slice(), more: false, async next() { return this.buf.shift() || null; } });
    const s = seasons();
    const setup = async () => {
      if (mode === 'trending') { streams = { a: pager({ sort: ['TRENDING_DESC'] }) }; pattern = ['a']; }
      else if (mode === 'top') { streams = { a: pager({ sort: ['SCORE_DESC'] }) }; pattern = ['a']; }
      else if (mode === 'new') { streams = { a: pager({ season: s.season, year: s.year, sort: ['POPULARITY_DESC'] }), b: pager({ season: s.nextSeason, year: s.nextYear, sort: ['POPULARITY_DESC'] }) }; pattern = ['a', 'a', 'b']; }
      else {
        let p = null; try { p = await personal(); } catch { /* ohne Tipps weiter */ }
        streams = { t: pager({ sort: ['TRENDING_DESC'] }), b: pager({ sort: ['SCORE_DESC'] }) };
        if (p && p.all.length) { streams.p = fromArr(p.all); pattern = ['p', 'p', 't', 'p', 'b']; } else pattern = ['t', 'b', 't'];
      }
    };
    const loadMore = async (count = 8) => {
      if (loading || done) return;
      loading = true;
      const spin = h('div.af-loading', { html: '<span class="spinner"></span> Lade weitere Anime …' });
      list.append(spin);
      try {
        if (!streams) await setup();
        let added = 0, guard = 0;
        while (added < count && guard++ < 80) {
          const live = pattern.filter(k => streams[k].buf.length || streams[k].more);
          if (!live.length) { done = true; break; }
          let k = pattern[pi++ % pattern.length]; if (!live.includes(k)) k = live[0];
          const n = await streams[k].next();
          if (!n || seen.has(n.key)) continue;
          seen.add(n.key);
          if (!fresh(n)) continue;
          items.push(n); list.insertBefore(slide(n, items.length), spin); added++;
        }
        if (!items.length) list.insertBefore(h('div.af-empty.empty-hint', 'Gerade nichts Neues gefunden – versuch einen anderen Modus oben.'), spin);
      } catch (e) {
        list.insertBefore(errorBox(e, () => { ov.remove(); D.feed(mode); }), spin); done = true;
      } finally { spin.remove(); loading = false; updCount(); }
    };
    const updCount = () => { const i = curIndex(); counter.textContent = items.length ? `${Math.min(i + 1, items.length)} / ${items.length}${done ? '' : '+'}` : ''; };
    const curIndex = () => { const sl = [...list.querySelectorAll('.af-slide')]; const mid = list.scrollTop + list.clientHeight / 2; const i = sl.findIndex(x => x.offsetTop <= mid && x.offsetTop + x.offsetHeight > mid); return i < 0 ? 0 : i; };
    list.addEventListener('scroll', SN.debounce(() => { updCount(); const sl = list.querySelectorAll('.af-slide'); if (curIndex() >= sl.length - 3) loadMore(); }, 120));
    const goto = (dir) => { const sl = [...list.querySelectorAll('.af-slide')]; const t = sl[SN.clamp(curIndex() + dir, 0, sl.length - 1)]; t && list.scrollTo({ top: t.offsetTop, behavior: 'smooth' }); };
    const onKey = (e) => {
      if (SN.$('.modal-back') || !document.body.contains(ov)) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (['ArrowDown', 'PageDown', 'j', ' '].includes(e.key) && e.target.tagName !== 'INPUT') { e.preventDefault(); goto(1); }
      else if (['ArrowUp', 'PageUp', 'k'].includes(e.key)) { e.preventDefault(); goto(-1); }
    };
    document.addEventListener('keydown', onKey, true);

    function slide(n, idx) {
      const sl = h('section.af-slide', { style: { '--bg-img': cssUrl(n.banner || n.coverXL), '--c': n.color || null } });
      const desc = h('p.af-desc', short(n.desc) || 'Keine Beschreibung vorhanden.');
      desc.onclick = () => desc.classList.toggle('open');
      const likeBtn = h('button.af-btn.like', { html: SN.icon('heart', 22) + '<span>Merken</span>', onclick: () => { if (D.inList(n)) return; D.add(n, 'plan'); likeBtn.classList.add('on'); likeBtn.querySelector('span').textContent = 'Gemerkt'; SN.sound && SN.sound('pop'); setTimeout(() => goto(1), 450); } });
      const nopeBtn = h('button.af-btn.nope', { html: SN.icon('x', 22) + '<span>Kein Interesse</span>', onclick: () => { D.hide(n); sl.classList.add('gone'); setTimeout(() => goto(1), 120); } });
      const infoBtn = h('button.af-btn', { html: SN.icon('info', 22) + '<span>Infos</span>', onclick: () => D.info(n) });
      sl.append(h('div.af-bg'),
        h('div.af-card',
          h('div.af-cover', { style: { backgroundImage: cssUrl(n.coverXL || n.cover) }, onclick: () => D.info(n) }, n.score ? h('span.dc-score', { html: `${SN.icon('star', 12)}${fmtScore(n.score)}` }) : null),
          h('div.af-info',
            h('div.af-num', '#' + idx),
            h('h2', n.title), n.titleEn && n.titleEn !== n.title ? h('div.af-sub', n.titleEn) : null,
            chips(n),
            h('div.af-genres', ...n.genres.slice(0, 5).map(g => h('span.chip', deGenre(g)))),
            desc,
            h('div.af-btns', nopeBtn, infoBtn, likeBtn))));
      return sl;
    }
    loadMore(10);
  };
})();
