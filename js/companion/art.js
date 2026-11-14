/* Spirit Notes – Begleiterin: eigene, original gezeichnete Anime-Mädchen (SVG, Halbkörper im Visual-Novel-Stil) + Zimmer */
(() => {
  const A = SN.compArt = {};
  const W = 600, H = 1100, CX = 300;
  // ------------------------------------------------------------------ Farb-Helfer
  const hex = (c) => { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const mix = (c, t, p) => { const a = hex(c), b = hex(t); return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * p).toString(16).padStart(2, '0')).join(''); };
  const dk = (c, p) => mix(c, '#1a0a14', p), lt = (c, p) => mix(c, '#ffffff', p);
  const SKIN = '#fff1ea', SKIN2 = '#f8d5c6', SKIN3 = '#efb9a6', SKINL = '#b8786a';
  const mirror = (d) => d.replace(/([MLQCZ])([^MLQCZ]*)/g, (_, c, args) => {
    const n = args.trim().split(/[\s,]+/).filter(Boolean).map(Number);
    return c + ' ' + n.map((v, i) => i % 2 === 0 ? +(W - v).toFixed(1) : v).join(' ') + ' ';
  });
  const F = (d, fill, line, w = 2.4, extra = '') => `<path d="${d}" fill="${fill}"${line ? ` stroke="${line}" stroke-width="${w}" stroke-linejoin="round"` : ''} ${extra}/>`;
  const S = (d, col, w = 2.4, extra = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  let uid = 0;
  // Haarsträhnen-Kante: Punkte abwechselnd Spitze/Kerbe -> weiche, spitz zulaufende Strähnen
  function edge(pts) {
    let d = '';
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], dy = y1 - y0, dx = x1 - x0;
      if (dy > 0) d += ` C ${(x0 + dx * .08).toFixed(1)} ${(y0 + dy * .55).toFixed(1)} ${(x1 - dx * .32).toFixed(1)} ${(y1 - dy * .3).toFixed(1)} ${x1} ${y1}`;
      else d += ` C ${(x0 + dx * .3).toFixed(1)} ${(y0 + dy * .35).toFixed(1)} ${(x1 - dx * .06).toFixed(1)} ${(y1 - dy * .5).toFixed(1)} ${x1} ${y1}`;
    }
    return d;
  }
  const off = (pts, dx, dy) => pts.map(([x, y]) => [x + dx, y + dy]);

  // ------------------------------------------------------------------ Mädchen (alle frei erfunden)
  A.GIRLS = {
    hana: { name: 'Hana', type: 'Sanft & lieb', desc: 'Ein warmherziges Blumenmädchen, das sich über jede Kleinigkeit freut und dich immer aufmuntert.', hair: '#f8b4cf', hairDark: '#d97aa6', eyes: '#3fbf86', eyesDark: '#17694a', back: 'wavy', bangs: 'soft', locks: 'long', acc: 'flower', outfit: 'casual', dress: '#fff4f8', dressDark: '#f1c4d6', accent: '#ec4f8c', likes: 'parfait', dislikes: 'curry', gift: 'flowers' },
    akane: { name: 'Akane', type: 'Tsundere', desc: 'Frech, stolz und schnell rot im Gesicht – aber insgeheim freut sie sich riesig, dass du da bist.', hair: '#ff8a4c', hairDark: '#cf4a26', eyes: '#f2a93b', eyesDark: '#94520c', back: 'bob', tail: 'side', bangs: 'swept', locks: 'short', acc: 'ribbon', outfit: 'casual', dress: '#fff5f1', dressDark: '#f0c7bb', accent: '#d7263d', likes: 'taiyaki', dislikes: 'natto', gift: 'plush' },
    sora: { name: 'Sora', type: 'Energiebündel', desc: 'Laut, fröhlich und immer in Bewegung. Mit ihr wird es nie langweilig!', hair: '#6cc3ff', hairDark: '#2a7fd4', eyes: '#ffab2e', eyesDark: '#b05e05', back: 'short', bangs: 'spiky', locks: 'short', ahoge: true, acc: 'star', outfit: 'hoodie', dress: '#ffd84d', dressDark: '#e3ad1c', accent: '#ff7a45', likes: 'ramen', dislikes: 'salad', gift: 'game' },
    yuki: { name: 'Yuki', type: 'Kühl & ruhig', desc: 'Sagt nicht viel und wirkt kühl – doch wer sie kennt, merkt, wie sanft sie eigentlich ist.', hair: '#d9ecfb', hairDark: '#7fa6d4', eyes: '#4fb6e8', eyesDark: '#17598c', back: 'long', bangs: 'straight', locks: 'long', acc: 'snow', outfit: 'casual', dress: '#e4efff', dressDark: '#a9c2e8', accent: '#3a5aa0', likes: 'mochi', dislikes: 'spicy', gift: 'book' },
    mira: { name: 'Mira', type: 'Dramatische Gothic-Prinzessin', desc: 'Nennt sich „Herrscherin der Mitternacht“, liebt große Auftritte – und heimlich Kuscheltiere.', hair: '#8a68d6', hairDark: '#4a2f8f', eyes: '#f0569a', eyesDark: '#8e1650', back: 'long', buns: true, bangs: 'blunt', locks: 'hime', acc: 'bat', outfit: 'gothic', dress: '#2b2236', dressDark: '#15101c', accent: '#a66ce6', likes: 'choco', dislikes: 'garlic', gift: 'candle' },
  };

  // ------------------------------------------------------------------ Kopf-Geometrie
  const FACE = 'M 186 300 C 184 350 196 388 222 420 C 246 448 276 463 300 464 C 324 463 354 448 378 420 C 404 388 416 350 414 300 C 414 196 366 146 300 146 C 234 146 186 196 186 300 Z';
  const EYE = { L: 244, R: 356, y: 340 };
  const HAIRTOP = 'M 172 318 C 150 196 212 86 300 84 C 388 86 450 196 428 318';
  // Pony-Kanten (rechts -> links), Spitze/Kerbe abwechselnd
  const BANGS = {
    soft: [[428, 318], [414, 220], [402, 296], [380, 194], [362, 274], [342, 180], [326, 264], [306, 170], [286, 266], [266, 182], [248, 278], [226, 196], [208, 296], [192, 224], [172, 318]],
    straight: [[428, 318], [418, 226], [408, 280], [392, 208], [380, 270], [364, 200], [350, 266], [334, 196], [320, 264], [304, 194], [290, 266], [274, 196], [260, 268], [244, 200], [230, 270], [214, 208], [200, 280], [188, 226], [172, 318]],
    spiky: [[428, 318], [416, 214], [410, 284], [388, 188], [374, 262], [352, 174], [338, 256], [316, 162], [296, 254], [276, 168], [256, 262], [236, 180], [218, 274], [200, 202], [172, 318]],
    swept: [[428, 318], [416, 218], [396, 288], [384, 186], [352, 272], [348, 170], [302, 266], [304, 164], [252, 274], [262, 180], [214, 290], [212, 212], [172, 318]],
    blunt: [[428, 318], [424, 236], [410, 250], [392, 238], [374, 252], [356, 238], [338, 252], [320, 238], [300, 252], [280, 238], [262, 252], [244, 238], [226, 252], [208, 238], [190, 250], [176, 236], [172, 318]],
  };
  // Seitensträhnen (linke Seite; rechte wird gespiegelt)
  const LOCKS = {
    long: 'M 172 250 C 150 330 148 450 164 548 C 170 588 178 616 186 642 C 192 602 202 562 206 512 C 212 444 212 372 206 304 C 204 282 200 266 194 254 Z',
    short: 'M 172 250 C 156 322 158 396 172 454 C 178 476 186 494 196 508 C 200 478 206 446 208 412 C 212 364 212 318 204 276 Z',
    hime: 'M 168 250 C 160 330 160 420 164 496 L 174 486 L 184 500 L 194 488 L 204 500 L 210 490 C 212 420 212 340 206 262 Z',
  };
  const BACK = {
    long: 'M 176 236 C 128 330 104 600 112 1150 L 488 1150 C 496 600 472 330 424 236 C 410 146 362 96 300 96 C 238 96 190 146 176 236 Z',
    wavy: 'M 176 236 C 130 320 122 420 108 520 C 96 600 120 650 104 720 C 96 760 112 900 96 1150 L 504 1150 C 488 900 504 760 496 720 C 480 650 504 600 492 520 C 478 420 470 320 424 236 C 410 146 362 96 300 96 C 238 96 190 146 176 236 Z',
    bob: 'M 172 236 C 140 320 136 420 150 500' + edge([[150, 500], [176, 552], [196, 506], [228, 560], [252, 520], [300, 548], [348, 520], [372, 560], [404, 506], [424, 552], [450, 500]]) + ' C 464 420 460 320 428 236 C 414 146 364 96 300 96 C 236 96 186 146 172 236 Z',
    short: 'M 174 236 C 146 316 144 400 158 470' + edge([[158, 470], [186, 520], [204, 470], [232, 512], [300, 480], [368, 512], [396, 470], [414, 520], [442, 470]]) + ' C 456 400 454 316 426 236 C 412 146 364 96 300 96 C 236 96 188 146 174 236 Z',
  };
  const TAIL = 'M 412 186 C 486 150 556 214 548 330 C 542 420 520 500 506 580 C 496 640 498 700 486 760' + edge([[486, 760], [474, 702], [462, 748], [462, 684], [446, 718], [452, 640]]) + ' C 470 560 486 470 486 390 C 486 316 466 262 424 236 Z';

  // Ausdrücke: [Augen, Brauen, Mund, Röte]
  A.EXPR = {
    neutral: ['open', 'normal', 'smile', 0], happy: ['open', 'up', 'grin', 1], joy: ['happy', 'up', 'grin', 1], love: ['heart', 'up', 'grin', 2],
    content: ['closed', 'normal', 'cat', 1], sad: ['open', 'sad', 'frown', 0], cry: ['teary', 'sad', 'wavy', 1], angry: ['angry', 'angry', 'shout', 1],
    pout: ['open', 'angry', 'pout', 2], surprised: ['wide', 'up', 'open', 0], sleepy: ['half', 'flat', 'tiny', 0], sleep: ['closed', 'flat', 'tiny', 0],
    smug: ['half', 'normal', 'smug', 1], shy: ['open', 'sad', 'wavy', 2], eat: ['happy', 'up', 'eat', 1], wink: ['wink', 'up', 'grin', 1], excited: ['star', 'up', 'grin', 1], hungry: ['open', 'sad', 'open', 0],
  };
  // ================================================================== v3: gemalter Illustrations-Stil
  // Zufall mit festem Startwert -> jede Figur sieht immer gleich aus
  const rng = (seed) => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const bz = (p, t) => { const u = 1 - t; return [u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0], u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1]]; };
  const bzd = (p, t) => { const u = 1 - t; return [3 * u * u * (p[1][0] - p[0][0]) + 6 * u * t * (p[2][0] - p[1][0]) + 3 * t * t * (p[3][0] - p[2][0]), 3 * u * u * (p[1][1] - p[0][1]) + 6 * u * t * (p[2][1] - p[1][1]) + 3 * t * t * (p[3][1] - p[2][1])]; };
  const f1 = (v) => +v.toFixed(1);
  // Haarsträhne als spitz zulaufendes Band entlang einer Bézierkurve
  function ribbon(p, w0, prof = 'taper', N = 22) {
    const L = [], R = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, [x, y] = bz(p, t); let [dx, dy] = bzd(p, t); const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const w = prof === 'taper' ? w0 * (1 - Math.pow(t, 1.9)) * (t < .2 ? .3 + t * 3.5 : 1) : prof === 'wisp' ? w0 * Math.sin(Math.PI * Math.min(1, t * 1.05)) : prof === 'lash' ? w0 * (.18 + .82 * Math.sin(Math.PI * Math.min(1, .08 + t * .84))) * (t > .9 ? (1 - t) * 10 : 1) : w0 * (1 - t * .6);
      L.push([x - dy * w / 2, y + dx * w / 2]); R.push([x + dy * w / 2, y - dx * w / 2]);
    }
    const pts = L.concat(R.reverse());
    return 'M ' + pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join(' L ') + ' Z';
  }
  const centerline = (p) => `M ${p[0].join(' ')} C ${p[1].join(' ')} ${p[2].join(' ')} ${p[3].join(' ')}`;

  // ------------------------------------------------------------------ Frisuren als Strähnen-Bauplan
  // Pony: von einer Scheitel-Linie fächern Strähnen über die Stirn
  function bangsSpec(g) {
    const R = rng(hashStr(g.id) + 11);
    const S = { soft: { part: 316, n: 12, tipY: [262, 296], sweep: 1, width: [36, 46], long: [9] },
      straight: { part: 300, n: 14, tipY: [272, 290], sweep: .25, width: [30, 36], long: [] },
      spiky: { part: 292, n: 11, tipY: [252, 294], sweep: .6, width: [38, 48], long: [] },
      swept: { part: 352, n: 11, tipY: [258, 300], sweep: 1.7, width: [38, 50], long: [6] },
      blunt: { part: 300, n: 16, tipY: [270, 278], sweep: 0, width: [28, 32], long: [] } }[g.bangs] || {};
    const out = [];
    for (let i = 0; i < S.n; i++) {
      const u = i / (S.n - 1);                       // 0 = links, 1 = rechts
      const tipX = 178 + u * 244 + (R() - .5) * 8;
      const side = tipX < S.part ? -1 : 1;
      const dist = Math.abs(tipX - S.part) / 130;
      let tipY = S.tipY[0] + R() * (S.tipY[1] - S.tipY[0]);
      tipY += (1 - Math.min(1, dist)) * -6 + Math.min(1, dist) * 14;   // seitlich etwas länger
      if (S.long.includes(i)) tipY += 22;                              // einzelne lange Strähnen über den Augen
      const rootX = S.part + (tipX - S.part) * .28, rootY = 118 + Math.abs(tipX - 300) * .18;
      const sw = S.sweep * side * (14 + dist * 22);
      const p = [[rootX, rootY], [rootX + (tipX - rootX) * .25 + sw * .4, rootY + 60], [tipX - sw * .5 - side * 6, tipY - 70], [tipX + (R() - .5) * 6, tipY]];
      out.push({ p, w: S.width[0] + R() * (S.width[1] - S.width[0]), tone: R(), order: Math.abs(u - .5) });
    }
    // Außen zuerst, Mitte zuletzt -> natürliche Überlappung
    return out.sort((a, b) => b.order - a.order);
  }
  function hashStr(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return h; }
  // Seitensträhnen vor den Ohren
  function sideSpec(g, side) {
    const s = side, cx = 300, len = g.locks === 'long' ? 780 : g.locks === 'hime' ? 500 : 500;
    const x0 = cx + s * 112, list = [];
    const n = g.locks === 'hime' ? 4 : 3;
    for (let i = 0; i < n; i++) {
      const o = i * 11;
      const tipY = len - i * (g.locks === 'hime' ? 0 : 34) + (g.locks === 'short' ? -i * 6 : 0);
      list.push({ p: [[x0 - s * (8 - o * .4), 210 + i * 6], [x0 + s * (12 + o * .4), 330], [x0 + s * (6 + o * .5) - s * (g.locks === 'long' ? 12 : 0), tipY - 120], [x0 + s * (g.locks === 'hime' ? 2 + o * .8 : 10 + o * .6) - s * (g.locks === 'long' ? 18 : 0), tipY]], w: g.locks === 'hime' ? 18 : 26 - i * 4, tone: i / n });
    }
    return list;
  }
  // Lange Haare hinten: viele Strähnen über der Grundform
  function backSpec(g) {
    const R = rng(hashStr(g.id) + 97), list = [];
    const longH = { long: 1130, wavy: 1130, bob: 560, short: 500 }[g.back] || 1130;
    const n = 22;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1), side = u < .5 ? -1 : 1;
      const x0 = 190 + u * 220, spread = (u - .5) * 2;
      const endX = 300 + spread * (g.back === 'bob' || g.back === 'short' ? 150 : 190) + (R() - .5) * 20;
      const endY = longH - (g.back === 'bob' || g.back === 'short' ? Math.abs(spread) * -20 + R() * 40 : R() * 40);
      const wave = g.back === 'wavy' ? 26 : 8;
      list.push({ p: [[x0, 130 + Math.abs(spread) * 40], [x0 + spread * 120, 300], [endX + side * wave * (R() - .3), endY - 200], [endX, endY]], w: 34 + R() * 18, tone: R() });
    }
    return list;
  }

  // ------------------------------------------------------------------ Augen (v3)
  // lokale Koordinaten: dx > 0 = Außenseite
  function eye3(cx, side, kind, g) {
    const y = EYE.y, s = side === 'L' ? -1 : 1, u = g.uid + side;
    const X = (dx) => f1(cx + s * dx), Y = (dy) => f1(y + dy);
    const P = (pts) => pts.map(([a, b]) => [cx + s * a, y + b]);
    const lashC = dk(g.eyesDark, .72), lashC2 = dk(g.eyesDark, .45);
    const shape = `M ${X(-34)} ${Y(6)} C ${X(-28)} ${Y(-26)} ${X(8)} ${Y(-40)} ${X(37)} ${Y(-17)} C ${X(40)} ${Y(8)} ${X(24)} ${Y(34)} ${X(2)} ${Y(36)} C ${X(-18)} ${Y(36)} ${X(-31)} ${Y(23)} ${X(-34)} ${Y(6)} Z`;
    const clip = `<clipPath id="e3${u}"><path d="${shape}"/></clipPath>`;
    const lash = (lid = [[-34, 6], [-26, -26], [12, -42], [40, -18]], w = 11) =>
      `<path d="${ribbon(P(lid), w, 'lash', 24)}" fill="${lashC}"/>` +
      `<path d="${ribbon(P([[30, -22], [40, -24], [50, -24], [58, -19]]), 7, 'taper', 10)}" fill="${lashC}"/>` +
      `<path d="${ribbon(P([[24, -30], [30, -38], [36, -44], [42, -48]]), 4, 'taper', 8)}" fill="${lashC}"/>` +
      `<path d="${ribbon(P([[34, -24], [42, -30], [48, -34], [55, -36]]), 4, 'taper', 8)}" fill="${lashC}"/>` +
      `<path d="${ribbon(P([[-30, -6], [-31, -14], [-32, -18], [-34, -22]]), 2.6, 'taper', 6)}" fill="${lashC}" opacity=".8"/>` +
      `<path d="${ribbon(P([[-20, -26], [-6, -36], [10, -38], [26, -32]]), 3, 'wisp', 12)}" fill="${lt(g.eyesDark, .25)}" opacity=".35"/>`;
    const lower = `<path d="${ribbon(P([[37, -8], [36, 14], [24, 32], [4, 37]]), 3.2, 'taper', 14)}" fill="${lashC2}" opacity=".75"/>` +
      S(`M ${X(30)} ${Y(24)} L ${X(36)} ${Y(31)} M ${X(20)} ${Y(32)} L ${X(23)} ${Y(39)}`, lashC2, 1.6, 'opacity=".55"');
    const crease = S(`M ${X(-24)} ${Y(-36)} C ${X(-8)} ${Y(-50)} ${X(18)} ${Y(-50)} ${X(40)} ${Y(-30)}`, dk(SKIN3, .3), 1.8, 'opacity=".45"') +
      `<ellipse cx="${X(6)}" cy="${Y(-34)}" rx="40" ry="11" fill="${SKIN3}" opacity=".32" filter="url(#b4${g.uid})"/>`;
    const iris = (rx = 27, ry = 32, pr = 1, heart = false) => {
      const ix = cx + s * 1, iy = y + 7;
      let r = `<ellipse cx="${f1(ix)}" cy="${iy}" rx="${rx}" ry="${ry}" fill="url(#iR${g.uid})"/>`;
      r += `<ellipse cx="${f1(ix)}" cy="${iy}" rx="${rx}" ry="${ry}" fill="url(#iT${g.uid})"/>`;
      for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2; r += `<line x1="${f1(ix + Math.cos(a) * rx * .38)}" y1="${f1(iy + Math.sin(a) * ry * .38)}" x2="${f1(ix + Math.cos(a) * rx * .92)}" y2="${f1(iy + Math.sin(a) * ry * .92)}" stroke="${dk(g.eyesDark, .2)}" stroke-width="1.2" opacity=".28"/>`; }
      r += `<ellipse cx="${f1(ix)}" cy="${iy}" rx="${rx * .62}" ry="${ry * .62}" fill="none" stroke="${lt(g.eyes, .35)}" stroke-width="1.6" opacity=".45"/>`;
      r += `<ellipse cx="${f1(ix)}" cy="${iy + ry * .55}" rx="${rx * .68}" ry="${ry * .3}" fill="${lt(g.eyes, .55)}" opacity=".9" filter="url(#b2${g.uid})"/>`;
      if (heart) r += `<path d="M ${f1(ix)} ${iy + 20} C ${f1(ix - 28)} ${iy + 2} ${f1(ix - 16)} ${iy - 24} ${f1(ix)} ${iy - 8} C ${f1(ix + 16)} ${iy - 24} ${f1(ix + 28)} ${iy + 2} ${f1(ix)} ${iy + 20} Z" fill="#ff4f93" stroke="#fff" stroke-width="2.4"/>`;
      else r += `<ellipse cx="${f1(ix)}" cy="${iy + 2}" rx="${10 * pr}" ry="${15 * pr}" fill="${dk(g.eyesDark, .55)}" filter="url(#b1${g.uid})"/>`;
      r += `<ellipse cx="${f1(ix)}" cy="${iy}" rx="${rx}" ry="${ry}" fill="none" stroke="${dk(g.eyesDark, .35)}" stroke-width="2.4"/>`;
      // Lidschatten auf Augapfel
      r += `<path d="M ${X(-40)} ${Y(-44)} L ${X(44)} ${Y(-44)} L ${X(44)} ${Y(-6)} C ${X(20)} ${Y(-20)} ${X(-12)} ${Y(-20)} ${X(-40)} ${Y(0)} Z" fill="${dk(g.eyesDark, .6)}" opacity=".38" filter="url(#b3${g.uid})"/>`;
      // Glanzlichter
      r += `<ellipse cx="${f1(ix - 9)}" cy="${iy - 12}" rx="12" ry="12" fill="#fff" opacity=".45" filter="url(#b4${g.uid})"/>` +
        `<ellipse cx="${f1(ix - 9)}" cy="${iy - 12}" rx="8.5" ry="10.5" fill="#fff"/><ellipse cx="${f1(ix + 12)}" cy="${iy + 14}" rx="4.6" ry="4" fill="#fff" opacity=".95"/>` +
        `<circle cx="${f1(ix + 5)}" cy="${iy - 20}" r="2.2" fill="#fff" opacity=".9"/><circle cx="${f1(ix - 14)}" cy="${iy + 16}" r="1.8" fill="#fff" opacity=".7"/>`;
      return r;
    };
    const whites = `<path d="${shape}" fill="url(#eW${g.uid})"/>`;
    const open = (ir) => clip + whites + `<g clip-path="url(#e3${u})">${ir}</g>` + crease + lash() + lower;
    const arc = (pts, w) => `<path d="${ribbon(P(pts), w, 'lash', 20)}" fill="${lashC}"/>`;
    switch (kind) {
      case 'happy': return arc([[-36, 10], [-22, -14], [20, -16], [40, 4]], 8) + `<path d="${ribbon(P([[34, 2], [42, 0], [50, -2], [56, -6]]), 5, 'taper', 8)}" fill="${lashC}"/>` + S(`M ${X(-18)} ${Y(14)} C ${X(-4)} ${Y(8)} ${X(10)} ${Y(8)} ${X(22)} ${Y(14)}`, lashC2, 1.6, 'opacity=".4"');
      case 'closed': return arc([[-36, 0], [-18, 20], [18, 20], [40, 0]], 7.5) + `<path d="${ribbon(P([[34, 6], [42, 10], [48, 14], [54, 18]]), 4.5, 'taper', 8)}" fill="${lashC}"/>` + S(`M ${X(-14)} ${Y(20)} L ${X(-16)} ${Y(28)} M ${X(2)} ${Y(23)} L ${X(2)} ${Y(31)} M ${X(18)} ${Y(20)} L ${X(20)} ${Y(28)}`, lashC2, 1.6, 'opacity=".6"');
      case 'half': return clip + whites + `<g clip-path="url(#e3${u})">${iris()}<path d="M ${X(-44)} ${Y(-48)} L ${X(48)} ${Y(-48)} L ${X(48)} ${Y(-2)} C ${X(22)} ${Y(-10)} ${X(-14)} ${Y(-10)} ${X(-44)} ${Y(2)} Z" fill="${SKIN}"/></g>` + arc([[-36, 4], [-16, -8], [18, -10], [42, -4]], 8) + S(`M ${X(-26)} ${Y(-18)} C ${X(-6)} ${Y(-28)} ${X(18)} ${Y(-28)} ${X(38)} ${Y(-16)}`, dk(SKIN3, .25), 1.8, 'opacity=".5"') + lower;
      case 'wide': return open(iris(21, 26, .55));
      case 'heart': return open(iris(27, 32, 1, true));
      case 'angry': return clip + whites + `<g clip-path="url(#e3${u})">${iris(26, 30, .8)}<path d="M ${X(-44)} ${Y(-48)} L ${X(48)} ${Y(-48)} L ${X(48)} ${Y(-28)} L ${X(-44)} ${Y(-6)} Z" fill="${SKIN}"/></g>` + arc([[-38, -4], [-14, -12], [16, -20], [42, -28]], 9) + lower;
      case 'teary': return open(iris() + `<path d="M ${X(-40)} ${Y(20)} C ${X(-16)} ${Y(12)} ${X(20)} ${Y(12)} ${X(44)} ${Y(20)} L ${X(44)} ${Y(44)} L ${X(-40)} ${Y(44)} Z" fill="#c5ebff" opacity=".65"/>`) + F(`M ${X(22)} ${Y(36)} C ${X(30)} ${Y(54)} ${X(28)} ${Y(66)} ${X(22)} ${Y(70)} C ${X(14)} ${Y(66)} ${X(14)} ${Y(54)} ${X(22)} ${Y(36)} Z`, '#9ad6ff', '#5aaee6', 1.2, 'opacity=".95"');
      case 'star': return open(iris() + `<path d="M ${X(1)} ${Y(-10)} L ${X(6)} ${Y(2)} L ${X(18)} ${Y(4)} L ${X(9)} ${Y(12)} L ${X(12)} ${Y(24)} L ${X(1)} ${Y(18)} L ${X(-10)} ${Y(24)} L ${X(-7)} ${Y(12)} L ${X(-16)} ${Y(4)} L ${X(-4)} ${Y(2)} Z" fill="#fff"/>`);
      default: return open(iris());
    }
  }
  function brows3(kind, g) {
    const y = EYE.y, c = dk(g.hairDark, .3);
    const K = { normal: [[-30, -60], [-14, -70], [10, -72], [32, -64]], sad: [[-30, -70], [-14, -74], [10, -70], [32, -60]], angry: [[-30, -56], [-12, -62], [10, -70], [32, -76]], up: [[-30, -70], [-14, -80], [10, -82], [32, -74]], flat: [[-30, -64], [-12, -66], [10, -66], [32, -64]] }[kind] || [[-30, -60], [-14, -70], [10, -72], [32, -64]];
    const one = (cx, s) => `<path d="${ribbon(K.map(([a, b]) => [cx + s * a, y + b]).reverse(), 6.5, 'taper', 14)}" fill="${c}"/>`;
    return `<g opacity=".72">${one(EYE.L, -1)}${one(EYE.R, 1)}</g>`;
  }
  function mouth3(kind, g) {
    const y = 424, L = '#a34a58', IN = `url(#mI${g.uid})`;
    const open = (d, teeth = 0, tongue = true) => `<clipPath id="mc${g.uid}${kind}"><path d="${d}"/></clipPath>` + F(d, IN, L, 1.8) +
      `<g clip-path="url(#mc${g.uid}${kind})">` + (teeth ? `<path d="M ${CX - 30} ${y - 12} L ${CX + 30} ${y - 12} L ${CX + 30} ${y + teeth} C ${CX + 10} ${y + teeth + 3} ${CX - 10} ${y + teeth + 3} ${CX - 30} ${y + teeth} Z" fill="#fffafa"/><path d="M ${CX - 30} ${y + teeth} C ${CX - 10} ${y + teeth + 3} ${CX + 10} ${y + teeth + 3} ${CX + 30} ${y + teeth}" stroke="#e8c9cf" stroke-width="1.4" fill="none"/>` : '') +
      (tongue ? `<ellipse cx="${CX + 2}" cy="${y + 22}" rx="15" ry="10" fill="#f5788f" filter="url(#b1${g.uid})"/>` : '') + `</g>`;
    switch (kind) {
      case 'grin': return open(`M ${CX - 26} ${y - 6} C ${CX - 10} ${y - 1} ${CX + 10} ${y - 1} ${CX + 26} ${y - 6} C ${CX + 22} ${y + 18} ${CX + 10} ${y + 28} ${CX} ${y + 28} C ${CX - 10} ${y + 28} ${CX - 22} ${y + 18} ${CX - 26} ${y - 6} Z`, 4) + S(`M ${CX - 30} ${y - 9} L ${CX - 25} ${y - 5} M ${CX + 30} ${y - 9} L ${CX + 25} ${y - 5}`, L, 1.6, 'opacity=".6"');
      case 'open': return open(`M ${CX - 10} ${y + 2} C ${CX - 11} ${y - 10} ${CX + 11} ${y - 10} ${CX + 10} ${y + 2} C ${CX + 11} ${y + 18} ${CX - 11} ${y + 18} ${CX - 10} ${y + 2} Z`);
      case 'eat': return open(`M ${CX - 14} ${y} C ${CX - 10} ${y - 8} ${CX + 10} ${y - 8} ${CX + 14} ${y} C ${CX + 12} ${y + 12} ${CX - 12} ${y + 12} ${CX - 14} ${y} Z`);
      case 'shout': return open(`M ${CX - 22} ${y - 8} L ${CX + 22} ${y - 8} C ${CX + 18} ${y + 16} ${CX + 8} ${y + 24} ${CX} ${y + 24} C ${CX - 8} ${y + 24} ${CX - 18} ${y + 16} ${CX - 22} ${y - 8} Z`, 3);
      case 'frown': return S(`M ${CX - 15} ${y + 7} C ${CX - 7} ${y - 2} ${CX + 7} ${y - 2} ${CX + 15} ${y + 7}`, L, 2.6);
      case 'pout': return S(`M ${CX - 13} ${y + 3} C ${CX - 9} ${y - 3} ${CX - 4} ${y - 3} ${CX} ${y + 2} C ${CX + 4} ${y - 3} ${CX + 9} ${y - 3} ${CX + 13} ${y + 3}`, L, 2.4);
      case 'cat': return S(`M ${CX - 21} ${y - 3} C ${CX - 15} ${y + 8} ${CX - 4} ${y + 8} ${CX} ${y} C ${CX + 4} ${y + 8} ${CX + 15} ${y + 8} ${CX + 21} ${y - 3}`, L, 2.6);
      case 'flat': return S(`M ${CX - 11} ${y + 2} L ${CX + 11} ${y + 2}`, L, 2.6);
      case 'smug': return S(`M ${CX - 17} ${y + 1} C ${CX - 4} ${y + 9} ${CX + 10} ${y + 7} ${CX + 19} ${y - 6}`, L, 2.6) + S(`M ${CX + 17} ${y - 8} L ${CX + 21} ${y - 4}`, L, 1.6);
      case 'wavy': return S(`M ${CX - 19} ${y + 3} C ${CX - 15} ${y - 4} ${CX - 10} ${y - 4} ${CX - 6} ${y + 3} C ${CX - 2} ${y + 9} ${CX + 2} ${y + 9} ${CX + 6} ${y + 3} C ${CX + 10} ${y - 4} ${CX + 15} ${y - 4} ${CX + 19} ${y + 3}`, L, 2.3);
      case 'tiny': return S(`M ${CX - 6} ${y + 2} C ${CX - 2} ${y + 5} ${CX + 2} ${y + 5} ${CX + 6} ${y + 2}`, L, 2.4);
      default: return S(`M ${CX - 17} ${y - 2} C ${CX - 7} ${y + 9} ${CX + 7} ${y + 9} ${CX + 17} ${y - 2}`, L, 2.6) + S(`M ${CX - 20} ${y - 4} L ${CX - 16} ${y - 1} M ${CX + 20} ${y - 4} L ${CX + 16} ${y - 1}`, L, 1.4, 'opacity=".6"');
    }
  }

  // ------------------------------------------------------------------ Zusammensetzen (v3)
  A.girl = (id, o = {}) => {
    const g = { id, uid: id + (++uid), ...A.GIRLS[id] };
    const U = g.uid;
    const ex = A.EXPR[o.expr] || A.EXPR.neutral;
    const OF = OUTFITS[o.outfit || g.outfit] || OUTFITS.casual;
    const oc = OF.colors ? OF.colors(g) : { top: g.dress, dark: g.dressDark, acc: g.accent };
    const accs = [g.acc, ...(o.acc || [])].filter(Boolean);
    const H0 = g.hair, HD = g.hairDark, HL = lt(g.hair, .6), HS = dk(g.hairDark, .18), HLine = dk(g.hairDark, .45);
    const bangs = bangsSpec(g), sideL = sideSpec(g, -1), sideR = sideSpec(g, 1), back = backSpec(g);
    const CROWN = HAIRTOP + ' C 412 250 380 232 300 228 C 220 232 188 250 172 318 Z';
    const blur = (n, v) => `<filter id="b${n}${U}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="${v}"/></filter>`;
    let s = `<defs>${blur(1, 1)}${blur(2, 2.2)}${blur(3, 3.2)}${blur(4, 4.5)}${blur(8, 8)}${blur(14, 14)}
      <linearGradient id="hA${U}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lt(H0, .22)}"/><stop offset=".5" stop-color="${H0}"/><stop offset="1" stop-color="${mix(H0, HD, .6)}"/></linearGradient>
      <linearGradient id="hB${U}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${H0}"/><stop offset=".6" stop-color="${mix(H0, HD, .45)}"/><stop offset="1" stop-color="${HD}"/></linearGradient>
      <linearGradient id="hC${U}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(H0, HD, .55)}"/><stop offset=".45" stop-color="${lt(H0, .12)}"/><stop offset="1" stop-color="${mix(H0, HD, .4)}"/></linearGradient>
      <linearGradient id="hK${U}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(H0, HD, .35)}"/><stop offset="1" stop-color="${dk(HD, .12)}"/></linearGradient>
      <radialGradient id="iR${U}" cx=".5" cy=".62" r=".6"><stop offset="0" stop-color="${lt(g.eyes, .35)}"/><stop offset=".55" stop-color="${g.eyes}"/><stop offset="1" stop-color="${dk(g.eyesDark, .1)}"/></radialGradient>
      <linearGradient id="iT${U}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${dk(g.eyesDark, .45)}" stop-opacity=".95"/><stop offset=".5" stop-color="${g.eyesDark}" stop-opacity="0"/></linearGradient>
      <linearGradient id="eW${U}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8cde6"/><stop offset=".4" stop-color="#fbf8ff"/><stop offset="1" stop-color="#ffffff"/></linearGradient>
      <linearGradient id="sk${U}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff4ee"/><stop offset="1" stop-color="#ffe9df"/></linearGradient>
      <linearGradient id="mI${U}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a2032"/><stop offset="1" stop-color="#c2455e"/></linearGradient>
      <linearGradient id="cl${U}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lt(oc.top, .08)}"/><stop offset="1" stop-color="${mix(oc.top, oc.dark, .5)}"/></linearGradient>
      <linearGradient id="hb${U}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lt(H0, .12)}"/><stop offset=".45" stop-color="${H0}"/><stop offset="1" stop-color="${HD}"/></linearGradient>
      <linearGradient id="hf${U}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lt(H0, .2)}"/><stop offset=".55" stop-color="${H0}"/><stop offset="1" stop-color="${mix(H0, HD, .55)}"/></linearGradient>
      <linearGradient id="ir${U}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${dk(g.eyesDark, .2)}"/><stop offset=".45" stop-color="${g.eyes}"/><stop offset="1" stop-color="${lt(g.eyes, .55)}"/></linearGradient>
      <radialGradient id="bl${U}"><stop offset="0" stop-color="#ff8aa6" stop-opacity=".8"/><stop offset="1" stop-color="#ff8aa6" stop-opacity="0"/></radialGradient>
      <clipPath id="fc${U}"><path d="${FACE}"/></clipPath>
      <clipPath id="bk${U}"><path d="${BACK[g.back] || BACK.long}"/></clipPath>
      <clipPath id="tp${U}"><path d="${TOP}"/></clipPath>
      <clipPath id="by${U}"><path d="${BODY}"/></clipPath>
    </defs>`;
    const tone = (t) => t < .33 ? `url(#hA${U})` : t < .7 ? `url(#hC${U})` : `url(#hB${U})`;
    const strand = (st, extra = '', so = .3) => `<path d="${ribbon(st.p, st.w)}" fill="${tone(st.tone)}" stroke="${HLine}" stroke-width="1.1" stroke-opacity="${so}" ${extra}/>`;
    // Glanz auf einer Strähne (Engelsring)
    const shine = (st, t0 = .2, t1 = .34, w = .42, core = true) => { const p = st.p, a = bz(p, t0), b = bz(p, (t0 + t1) / 2), c = bz(p, t1); const q = [a, [a[0] + (b[0] - a[0]) * .6, a[1] + (b[1] - a[1]) * .6], [c[0] - (c[0] - b[0]) * .6, c[1] - (c[1] - b[1]) * .6], c]; return `<path d="${ribbon(q, st.w * w, 'wisp', 10)}" fill="${HL}" opacity=".5"/>` + (core ? `<path d="${ribbon(q, st.w * w * .28, 'wisp', 10)}" fill="#ffffff" opacity=".7"/>` : ''); };

    // ===== Haare hinten
    const HT = 'matrix(.8 0 0 .8 60 -5)';
    s += `<g class="cg-back"><g transform="${HT}">`;
    if (g.buns) for (const bx of [196, 404]) {
      s += `<circle cx="${bx}" cy="124" r="60" fill="url(#hK${U})" stroke="${HLine}" stroke-width="1.6"/>`;
      for (let k = 0; k < 7; k++) { const a0 = -2.6 + k * .55; s += S(`M ${f1(bx + Math.cos(a0) * 54)} ${f1(124 + Math.sin(a0) * 54)} C ${f1(bx + Math.cos(a0 + .5) * 30)} ${f1(124 + Math.sin(a0 + .5) * 30)} ${f1(bx)} ${f1(124)} ${f1(bx + Math.cos(a0 + 1.4) * 40)} ${f1(124 + Math.sin(a0 + 1.4) * 40)}`, HS, 1.6, 'opacity=".5"'); }
      s += `<path d="M ${bx - 44} 104 C ${bx - 24} 76 ${bx + 20} 72 ${bx + 42} 98" stroke="${HL}" stroke-width="9" fill="none" opacity=".55" filter="url(#b2${U})"/><path d="M ${bx - 36} 100 C ${bx - 18} 82 ${bx + 14} 80 ${bx + 32} 96" stroke="#fff" stroke-width="2.4" fill="none" opacity=".7"/>`;
    }
    s += F(BACK[g.back] || BACK.long, `url(#hK${U})`, HLine, 1.8);
    s += `<g clip-path="url(#bk${U})">` + back.map(st => strand(st, 'opacity=".9"', .18)).join('') +
      `<ellipse cx="300" cy="400" rx="140" ry="200" fill="${dk(HD, .35)}" opacity=".55" filter="url(#b14${U})"/>` +
      back.filter((_, i) => i % 3 === 0).map(st => shine(st, .12, .22, .3)).join('') +
      `<path d="M 150 300 C 128 420 124 600 128 830" stroke="${HL}" stroke-width="6" fill="none" opacity=".5" filter="url(#b3${U})"/></g>`;
    if (g.tail === 'side') {
      s += F(TAIL, `url(#hK${U})`, HLine, 1.8);
      const R = rng(7);
      for (let k = 0; k < 9; k++) { const o = k * 7 - 26; s += `<path d="${ribbon([[430 + o * .3, 200], [520 + o * .6, 230 + o], [500 + o * .8, 520], [470 + o * .5 + (R() - .5) * 20, 700 + R() * 50]], 22 - k)}" fill="${tone(R())}" stroke="${HLine}" stroke-width="1.2" stroke-opacity=".5"/>`; }
      s += `<path d="M 476 230 C 528 280 532 380 516 480" stroke="#fff" stroke-width="4" fill="none" opacity=".55" filter="url(#b2${U})"/>`;
    }
    s += `</g></g>`;

    // ===== Körper
    s += `<g class="cg-body">`;
    s += F(BODY, `url(#sk${U})`, SKINL, 1.8) + `<path d="${NECK_SH}" fill="${SKIN2}" filter="url(#b3${U})"/>` + `<ellipse cx="300" cy="342" rx="40" ry="16" fill="${SKIN3}" opacity=".7" filter="url(#b4${U})"/>` +
      S('M 228 418 C 250 412 272 412 290 420 M 372 418 C 350 412 328 412 310 420', SKIN3, 2.2, 'opacity=".6"') + S('M 288 350 C 291 368 294 382 296 394 M 312 350 C 309 368 306 382 304 394', SKIN3, 1.6, 'opacity=".4"');
    s += OF.draw(g, oc, U);
    s += `</g>`;

    // ===== Kopf
    s += `<g class="cg-head"><g transform="${HT}">`;
    s += F(FACE, `url(#sk${U})`, SKINL, 2);
    // gemalte Schatten im Gesicht (Pony-Schatten, Wangen, Kinn)
    s += `<g clip-path="url(#fc${U})"><g transform="translate(5 16)" filter="url(#b3${U})" opacity=".75">${bangs.map(st => `<path d="${ribbon(st.p, st.w)}" fill="${SKIN3}"/>`).join('')}<path d="${CROWN}" fill="${SKIN3}"/></g>` +
      `<path d="M 186 300 C 192 380 222 440 262 474 L 160 474 Z" fill="${SKIN2}" opacity=".9" filter="url(#b8${U})"/><path d="M 414 300 C 408 380 378 440 338 474 L 440 474 Z" fill="${SKIN2}" opacity=".9" filter="url(#b8${U})"/>` +
      `<ellipse cx="300" cy="300" rx="70" ry="44" fill="#fff" opacity=".35" filter="url(#b14${U})"/></g>`;
    const [eK, bK, mK, blush] = ex;
    s += `<g class="cg-face">`;
    s += `<ellipse cx="226" cy="402" rx="${blush ? 44 : 34}" ry="${blush ? 22 : 16}" fill="url(#bl${U})" opacity="${blush > 1 ? 1 : blush ? .85 : .45}"/><ellipse cx="374" cy="402" rx="${blush ? 44 : 34}" ry="${blush ? 22 : 16}" fill="url(#bl${U})" opacity="${blush > 1 ? 1 : blush ? .85 : .45}"/>`;
    s += S('M 204 400 L 211 388 M 218 402 L 225 390 M 232 403 L 239 391 M 361 403 L 368 391 M 375 402 L 382 390 M 389 400 L 396 388', '#ec7d98', 1.8, `opacity="${blush > 1 ? .9 : blush ? .55 : .3}"`);
    s += `<g class="cg-eye">${eye3(EYE.L, 'L', eK === 'wink' ? 'open' : eK, g)}</g><g class="cg-eye">${eye3(EYE.R, 'R', eK === 'wink' ? 'closed' : eK, g)}</g>`;
    s += `<path d="M 303 378 C 307 386 307 392 302 396" stroke="#d99a8a" stroke-width="2" fill="none" opacity=".8"/><ellipse cx="308" cy="390" rx="5" ry="7" fill="${SKIN3}" opacity=".45" filter="url(#b2${U})"/><circle cx="299" cy="380" r="1.8" fill="#fff" opacity=".9"/>`;
    s += mouth3(mK, g);
    s += `</g>`;
    // ===== Haare vorne
    s += sideL.concat(sideR).map(st => strand(st)).join('');
    s += sideL.concat(sideR).map(st => shine(st, .22, .32, .3)).join('');
    s += F(CROWN, `url(#hA${U})`, HLine, 1.6);
    // Strähnen auf dem Oberkopf, die zu den Seiten fallen
    const R3 = rng(hashStr(g.id) + 23), crownSt = [];
    for (let k = 0; k < 12; k++) { const sd = k < 6 ? -1 : 1, j = k % 6; const ex = 300 + sd * (88 + j * 8 + R3() * 6), ey = 250 + j * 14 + R3() * 10; crownSt.push({ p: [[300 + sd * (10 + j * 5), 112 + j * 3], [300 + sd * (58 + j * 10), 116 + j * 5], [ex + sd * 14, ey - 90], [ex, ey]], w: 26 + R3() * 10, tone: R3() }); }
    s += crownSt.map(st => strand(st, '', .22)).join('');
    s += bangs.map(st => strand(st)).join('');
    // feine Linien in jeder Strähne
    s += bangs.filter((_, i) => i % 2).map(st => { const p = st.p; const q = [bz(p, .1), bz(p, .4), bz(p, .7), bz(p, .9)]; return S(`M ${q[0].map(f1).join(' ')} C ${q[1].map(f1).join(' ')} ${q[2].map(f1).join(' ')} ${q[3].map(f1).join(' ')}`, HS, 1, 'opacity=".22"'); }).join('');
    // Licht von links oben, Schatten rechts unten – auf allen vorderen Haaren
    s += `<clipPath id="fh${U}"><path d="${CROWN}"/>${bangs.concat(sideL, sideR).map(st => `<path d="${ribbon(st.p, st.w)}"/>`).join('')}</clipPath>`;
    s += `<g clip-path="url(#fh${U})"><ellipse cx="430" cy="330" rx="110" ry="190" fill="${dk(HD, .3)}" opacity=".35" filter="url(#b14${U})"/><ellipse cx="300" cy="300" rx="150" ry="26" fill="${dk(HD, .25)}" opacity=".28" filter="url(#b8${U})"/><ellipse cx="200" cy="170" rx="90" ry="70" fill="#fff6ee" opacity=".22" filter="url(#b14${U})"/></g>`;
    // Engelsring + Lichtkante
    s += `<path d="M 196 184 C 240 152 360 152 404 184" stroke="${HL}" stroke-width="26" fill="none" opacity=".4" filter="url(#b8${U})"/>`;
    s += bangs.map((st, i) => shine(st, .16 + (i % 3) * .02, .36 + (i % 3) * .02, .38, i % 2 === 0)).join('');
    s += `<path d="M 178 300 C 168 220 200 120 270 96" stroke="#fff" stroke-width="3" fill="none" opacity=".55" filter="url(#b1${U})"/>`;
    // feine abstehende Härchen über Pony & Augen
    const R2 = rng(hashStr(g.id) + 5);
    for (let k = 0; k < 4; k++) { const x0 = 220 + R2() * 160, x1 = x0 + (R2() - .5) * 60; s += `<path d="${ribbon([[x0, 160], [x0 + (x1 - x0) * .3, 220], [x1 - 8, 290], [x1, 312 + R2() * 26]], 2.6 + R2() * 1.6, 'wisp', 16)}" fill="${mix(H0, HD, .35)}" opacity=".55"/>`; }
    if (g.ahoge) s += `<path d="${ribbon([[300, 96], [282, 40], [326, 18], [346, 48]], 12)}" fill="url(#hA${U})" stroke="${HLine}" stroke-width="1.4"/><path d="${ribbon([[304, 92], [292, 60], [306, 40], [324, 34]], 6, 'wisp', 10)}" fill="${HL}" opacity=".7"/>`;
    for (const a of accs) if (ACC[a] && !ACC[a].face) s += `<g class="cg-acc">${ACC[a].draw(g)}</g>`;
    s += brows3(bK, g);
    for (const a of accs) if (ACC[a] && ACC[a].face) s += `<g class="cg-acc">${ACC[a].draw(g)}</g>`;
    s += `</g></g>`;
    return `<svg class="cg-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
  };

  // ------------------------------------------------------------------ Körper & Kleidung (v4: ganzer Oberkörper bis zu den Oberschenkeln, eigenes Koordinatensystem 600 × 1100)
  const BH = 1100;
  const BODY = 'M 281 330 C 282 356 281 378 278 394 C 252 404 216 410 192 424 C 174 434 166 452 166 478 C 170 540 190 600 214 660 L 386 660 C 410 600 430 540 434 478 C 434 452 426 434 408 424 C 384 410 348 404 322 394 C 319 378 318 356 319 330 Z';
  const NECK_SH = 'M 281 336 C 290 352 310 352 319 336 L 320 372 C 308 382 292 382 280 372 Z';
  // Oberteil: Schultern, Brust, Taille (bis zur Hüfte)
  const TOP = 'M 262 398 C 274 420 326 420 338 398 C 366 404 396 412 418 426 C 432 436 438 454 436 480 C 428 502 422 524 420 552 C 416 592 394 622 388 654 L 212 654 C 206 622 184 592 180 552 C 178 524 172 502 164 480 C 162 454 168 436 182 426 C 204 412 234 404 262 398 Z';
  const SKIRT = 'M 210 648 L 390 648 C 414 720 446 820 472 930 C 474 960 474 990 470 1010 C 400 1024 200 1024 130 1010 C 126 990 126 960 128 930 C 154 820 186 720 210 648 Z';
  const LEG_L = 'M 214 960 C 210 1010 214 1060 220 1100 L 294 1100 C 296 1060 298 1010 298 960 Z';
  // Arme: Oberarm seitlich, Unterarm zur Mitte, Hände vor dem Bauch gefaltet
  const UPPER_L = 'M 182 434 C 162 452 154 500 154 556 C 154 596 158 626 164 650 L 206 648 C 202 612 200 576 202 540 C 204 506 202 472 196 446 Z';
  const FORE_L = 'M 164 638 C 178 694 220 738 278 766 L 294 734 C 254 716 222 690 206 642 Z';
  const CUFF_L = 'M 262 760 L 282 726';
  const HANDS = 'M 266 744 C 284 726 318 726 336 742 C 344 760 338 784 318 794 C 298 802 274 794 264 778 C 258 766 258 754 266 744 Z';
  const SHORT_L = 'M 182 434 C 152 448 142 486 144 524 C 162 544 194 548 210 534 C 212 500 206 466 196 446 Z';
  const fold = (d, col, op = .5) => F(d, col, null, 0, `opacity="${op}"`);
  const softSh = (d, col, op, b, U) => `<path d="${d}" fill="${col}" opacity="${op}" filter="url(#b${b}${U})"/>`;
  // Brust- & Faltenschatten (dezent), auf jedes Oberteil gelegt
  const torsoShade = (g, dark, U) => `<g clip-path="url(#tp${U})">` +
    softSh('M 196 548 C 220 574 262 578 292 566 C 286 586 230 590 196 548 Z M 404 548 C 380 574 338 578 308 566 C 314 586 370 590 404 548 Z', dark, .4, 4, U) +
    softSh('M 222 482 C 242 466 272 466 290 480 C 280 504 242 506 222 482 Z M 378 482 C 358 466 328 466 310 480 C 320 504 358 506 378 482 Z', '#ffffff', .35, 8, U) +
    S('M 300 540 C 299 556 299 568 300 578', dark, 2, 'opacity=".35"') +
    S('M 206 560 C 228 590 266 598 292 588 M 394 560 C 372 590 334 598 308 588', dark, 2, 'opacity=".35"') +
    softSh('M 156 470 L 196 470 C 200 560 212 620 214 660 L 150 660 Z', dark, .35, 14, U) + softSh('M 444 470 L 404 470 C 400 560 388 620 386 660 L 450 660 Z', dark, .45, 14, U) +
    `</g>`;
  function arms(g, o, sleeve, U, kind = 'long') {
    const ln = o.line || dk(sleeve, .45);
    let s = '';
    if (kind === 'short' || kind === 'none') {
      s += F(UPPER_L, `url(#sk${U})`, SKINL, 1.8) + F(mirror(UPPER_L), `url(#sk${U})`, SKINL, 1.8);
      s += F(FORE_L, `url(#sk${U})`, SKINL, 1.8) + F(mirror(FORE_L), `url(#sk${U})`, SKINL, 1.8);
      s += S('M 168 644 C 178 650 192 652 206 648', SKIN3, 2, 'opacity=".6"') + S(mirror('M 168 644 C 178 650 192 652 206 648'), SKIN3, 2, 'opacity=".6"');
      if (kind === 'short') s += F(SHORT_L, sleeve, ln, 2) + F(mirror(SHORT_L), sleeve, ln, 2) + S('M 146 518 C 164 538 194 542 210 528', o.cuff || dk(sleeve, .2), 5) + S(mirror('M 146 518 C 164 538 194 542 210 528'), o.cuff || dk(sleeve, .2), 5);
    } else {
      s += F(UPPER_L, sleeve, ln, 2) + F(mirror(UPPER_L), sleeve, ln, 2);
      s += F(FORE_L, sleeve, ln, 2) + F(mirror(FORE_L), sleeve, ln, 2);
      s += S('M 150 600 C 162 620 176 632 196 640', dk(sleeve, .25), 2, 'opacity=".5"') + S(mirror('M 150 600 C 162 620 176 632 196 640'), dk(sleeve, .25), 2, 'opacity=".5"');
      s += S('M 168 520 C 172 560 176 600 184 630', dk(sleeve, .2), 1.6, 'opacity=".4"') + S(mirror('M 168 520 C 172 560 176 600 184 630'), dk(sleeve, .2), 1.6, 'opacity=".4"');
      if (o.cuff) s += S(CUFF_L, o.cuff, 9) + S(mirror(CUFF_L), o.cuff, 9);
    }
    // Hände (gefaltet)
    s += F(HANDS, `url(#sk${U})`, SKINL, 1.8) +
      S('M 284 740 C 290 756 290 772 286 788 M 300 738 C 306 756 306 772 302 790 M 316 742 C 320 758 320 772 316 786', SKINL, 1.4, 'opacity=".6"') +
      S('M 270 760 C 278 754 286 754 292 760', SKINL, 1.4, 'opacity=".5"') + `<ellipse cx="292" cy="752" rx="10" ry="5" fill="#fff" opacity=".45" filter="url(#b2${U})"/>`;
    return s;
  }
  const skirtFolds = (col, n = 6) => { let s = ''; for (let i = 0; i < n; i++) { const t = (i + .5) / n, x0 = 216 + t * 168, x1 = 136 + t * 328; s += S(`M ${f1(x0)} 662 C ${f1(x0 + (x1 - x0) * .3)} 760 ${f1(x1 - (x1 - x0) * .2)} 900 ${f1(x1)} 1008`, col, 1.8, 'opacity=".45"'); } return s; };
  const legs = (col, U) => F(LEG_L, col, dk(col === SKIN ? SKIN3 : col, .3), 1.6) + F(mirror(LEG_L), col, dk(col === SKIN ? SKIN3 : col, .3), 1.6) + softSh('M 214 960 L 298 960 L 298 1000 L 214 1000 Z M 302 960 L 386 960 L 386 1000 L 302 1000 Z', '#2a1020', .35, 8, U);
  const OUTFITS = {
    casual: { name: 'Lieblingskleid', draw: (g, o, U) => {
      const ln = dk(o.dark, .45);
      return legs(SKIN, U) + F(SKIRT, `url(#cl${U})`, ln) + skirtFolds(o.dark) + F('M 130 1004 C 200 1018 400 1018 470 1004', 'none', o.acc, 0) + S('M 132 1000 C 200 1014 400 1014 468 1000', o.acc, 5) +
        F(TOP, `url(#cl${U})`, ln) + torsoShade(g, o.dark, U) +
        F('M 300 418 C 280 424 254 428 236 420 C 238 446 272 456 300 440 Z', '#ffffff', ln, 1.8) + F(mirror('M 300 418 C 280 424 254 428 236 420 C 238 446 272 456 300 440 Z'), '#ffffff', ln, 1.8) +
        bow(300, 456, o.acc, .8) + [512, 560, 608].map(y => `<circle cx="300" cy="${y}" r="5" fill="${lt(o.acc, .3)}" stroke="${dk(o.acc, .3)}" stroke-width="1.6"/>`).join('') +
        F('M 208 640 C 260 652 340 652 392 640 L 394 662 C 340 674 260 674 206 662 Z', o.acc, dk(o.acc, .35), 1.8) + bow(352, 654, o.acc, .7) +
        arms(g, { cuff: o.acc }, o.top, U, 'short');
    } },
    school: { name: 'Matrosen-Look', colors: (g) => ({ top: '#ffffff', dark: '#d6dcea', acc: g.accent || '#d7263d' }), draw: (g, o, U) => {
      const navy = '#2c3866', ln = '#5a6684';
      return legs('#2b2f45', U) + F(SKIRT, navy, dk(navy, .4)) + skirtFolds('#121a3a', 8) +
        F(TOP, `url(#cl${U})`, ln) + torsoShade(g, o.dark, U) +
        F('M 262 398 L 300 520 L 338 398 C 368 404 404 416 430 432 L 300 548 L 170 432 C 196 416 232 404 262 398 Z', navy, dk(navy, .4), 1.8) +
        S('M 186 436 L 300 532 L 414 436', '#ffffff', 3) + S('M 202 434 L 300 516 L 398 434', '#ffffff', 2) + F('M 284 420 L 300 488 L 316 420 Z', '#ffffff', ln, 1.4) +
        bow(300, 528, o.acc, .9) + F('M 292 536 L 278 600 L 296 588 L 300 610 L 304 588 L 322 600 L 308 536 Z', o.acc, dk(o.acc, .4), 1.8) +
        arms(g, { cuff: navy }, '#ffffff', U, 'long');
    } },
    hoodie: { name: 'Kuschel-Hoodie', draw: (g, o, U) => {
      const ln = dk(o.dark, .45);
      return legs('#2a2a3a', U) + F('M 200 760 L 400 760 C 412 820 420 880 424 940 C 360 952 240 952 176 940 C 180 880 188 820 200 760 Z', '#3a4a7a', '#22305a', 1.8) +
        F('M 262 398 C 274 420 326 420 338 398 C 368 404 398 414 422 430 C 440 444 448 468 446 500 C 442 580 438 680 444 790 C 380 808 220 808 156 790 C 162 680 158 580 154 500 C 152 468 160 444 178 430 C 202 414 232 404 262 398 Z', `url(#cl${U})`, ln) + torsoShade(g, o.dark, U) +
        `<path fill-rule="evenodd" d="M 232 418 C 238 392 266 382 300 382 C 334 382 362 392 368 418 C 350 436 250 436 232 418 Z M 276 404 C 284 396 316 396 324 404 C 318 416 282 416 276 404 Z" fill="${mix(o.top, o.dark, .55)}" stroke="${ln}" stroke-width="1.6"/>` +
        S('M 286 430 C 284 470 282 500 280 530 M 314 430 C 316 470 318 500 320 530', '#ffffff', 3.6) + `<rect x="274" y="526" width="11" height="16" rx="4" fill="${o.acc}"/><rect x="315" y="526" width="11" height="16" rx="4" fill="${o.acc}"/>` +
        F('M 226 660 C 270 650 330 650 374 660 L 384 744 C 330 754 270 754 216 744 Z', dk(o.top, .06), ln, 1.6) + star(370, 500, 16, o.acc) +
        arms(g, { cuff: dk(o.top, .12) }, o.top, U, 'long');
    } },
    gothic: { name: 'Gothic-Kleid', colors: (g) => ({ top: '#2b2236', dark: '#120d18', acc: g.accent && g.accent !== '#ec4f8c' ? g.accent : '#a66ce6' }), draw: (g, o, U) => {
      const ln = '#5a4a70';
      const lace = (y0, x0, x1, n, dy = 14) => { let d = `M ${x0} ${y0}`; const st = (x1 - x0) / n; for (let i = 0; i < n; i++) d += ` Q ${f1(x0 + st * (i + .5))} ${y0 + dy} ${f1(x0 + st * (i + 1))} ${y0}`; return F(d + ' Z', '#f6f0fb', '#cfc3dc', 1.4); };
      return legs('#1b1622', U) + lace(1002, 128, 472, 18, 18) + F(SKIRT, o.top, ln) + skirtFolds('#000', 8) +
        F(TOP, `url(#cl${U})`, ln) + torsoShade(g, '#000', U) +
        F('M 256 470 L 344 470 L 340 654 L 260 654 Z', '#3a2f49', ln, 1.6) + [490, 526, 562, 598].map(y => S(`M 272 ${y} L 328 ${y + 28} M 328 ${y} L 272 ${y + 28}`, o.acc, 2.2)).join('') +
        lace(404, 238, 362, 9, 12) + bow(300, 430, o.acc, .75) +
        arms(g, { cuff: '#f6f0fb', line: ln }, o.top, U, 'long') + F('M 182 432 C 150 446 140 486 144 520 C 166 534 198 534 212 522 C 212 490 208 460 198 444 Z', o.top, ln) + F(mirror('M 182 432 C 150 446 140 486 144 520 C 166 534 198 534 212 522 C 212 490 208 460 198 444 Z'), o.top, ln);
    } },
    pajama: { name: 'Pyjama', colors: () => ({ top: '#c7dcff', dark: '#93b3e8', acc: '#f9a8d4' }), draw: (g, o, U) => {
      const ln = dk(o.dark, .4);
      return F('M 200 720 L 400 720 C 414 820 424 940 430 1100 L 170 1100 C 176 940 186 820 200 720 Z', o.top, ln) + S('M 300 760 L 300 1100', ln, 1.6, 'opacity=".5"') +
        F('M 262 398 C 274 420 326 420 338 398 C 368 404 398 414 422 430 C 440 444 446 468 444 500 C 440 580 434 680 438 770 C 380 784 220 784 162 770 C 166 680 160 580 156 500 C 154 468 160 444 178 430 C 202 414 232 404 262 398 Z', `url(#cl${U})`, ln) + torsoShade(g, o.dark, U) +
        F('M 262 398 L 236 410 L 260 462 L 300 432 Z', lt(o.top, .45), ln, 1.6) + F(mirror('M 262 398 L 236 410 L 260 462 L 300 432 Z'), lt(o.top, .45), ln, 1.6) +
        S('M 300 440 L 300 776', ln, 1.6) + [490, 560, 630, 700].map(y => `<circle cx="300" cy="${y}" r="5" fill="#fff" stroke="${ln}" stroke-width="1.4"/>`).join('') +
        [[220, 520], [384, 580], [236, 640], [372, 480], [206, 700], [396, 720], [340, 640], [252, 580]].map(([x, y]) => star(x, y, 9, '#fff7c2', ln, 1.1)).join('') +
        arms(g, { cuff: lt(o.top, .45) }, o.top, U, 'long');
    } },
    yukata: { name: 'Sommer-Yukata', colors: (g) => ({ top: '#2b3a68', dark: '#1a2445', acc: g.accent }), draw: (g, o, U) => {
      const ln = '#141c38';
      return F('M 200 640 L 400 640 C 414 760 426 900 436 1100 L 164 1100 C 174 900 186 760 200 640 Z', `url(#cl${U})`, ln) + S('M 330 660 C 336 800 344 940 352 1100', '#0e1530', 2, 'opacity=".6"') +
        F(TOP, `url(#cl${U})`, ln) + torsoShade(g, o.dark, U) +
        F('M 262 398 L 238 408 L 344 640 L 372 640 Z', '#ffffff', '#c9ced8', 1.4) + F('M 338 398 L 362 408 L 300 520 L 290 500 Z', '#ffffff', '#c9ced8', 1.4) +
        [[214, 500], [394, 470], [236, 580], [190, 760], [410, 820], [380, 960], [230, 940]].map(([x, y]) => flower(x, y, 15, '#ffb3cf', '#fff3b0')).join('') +
        F('M 198 610 C 260 624 340 624 402 610 L 404 676 C 340 690 260 690 196 676 Z', o.acc, dk(o.acc, .4)) + S('M 198 628 C 260 642 340 642 402 628', lt(o.acc, .4), 2.6) + bow(386, 650, lt(o.acc, .2), .9) +
        F('M 182 432 C 148 450 128 520 122 640 C 150 664 196 668 218 650 C 214 560 208 480 198 444 Z', o.top, ln) + F(mirror('M 182 432 C 148 450 128 520 122 640 C 150 664 196 668 218 650 C 214 560 208 480 198 444 Z'), o.top, ln) +
        arms(g, { cuff: o.top }, o.top, U, 'long');
    } },
    summer: { name: 'Sommerkleid', colors: () => ({ top: '#ffffff', dark: '#e1e7f2', acc: '#38bdf8' }), draw: (g, o, U) => {
      const ln = '#b9c3d6';
      return legs(SKIN, U) + F(SKIRT, `url(#cl${U})`, ln) + skirtFolds('#c9d2e2', 7) +
        S('M 228 470 L 220 414', '#9aa6bd', 3.4) + S('M 372 470 L 380 414', '#9aa6bd', 3.4) +
        F('M 186 476 C 230 462 270 468 300 472 C 330 468 370 462 414 476 C 420 520 410 560 400 600 C 396 620 392 640 388 654 L 212 654 C 208 640 204 620 200 600 C 190 560 180 520 186 476 Z', `url(#cl${U})`, ln) + torsoShade(g, o.dark, U) +
        S('M 186 476 C 230 462 270 468 300 472 C 330 468 370 462 414 476', '#ffffff', 4, 'stroke-dasharray="2 6"') +
        F('M 196 588 C 260 600 340 600 404 588 L 402 608 C 340 620 260 620 198 608 Z', o.acc, dk(o.acc, .3), 1.6) + bow(300, 598, o.acc, .7) +
        arms(g, {}, SKIN, U, 'none');
    } },
  };
  A.OUTFITS = Object.fromEntries(Object.entries(OUTFITS).map(([k, v]) => [k, v.name]));
  function bow(x, y, c, s = 1) {
    const ln = dk(c, .4);
    const L = `M ${x} ${y} C ${x - 20 * s} ${y - 26 * s} ${x - 50 * s} ${y - 22 * s} ${x - 48 * s} ${y} C ${x - 50 * s} ${y + 20 * s} ${x - 22 * s} ${y + 22 * s} ${x} ${y} Z`;
    const T = `M ${x - 6 * s} ${y + 4 * s} L ${x - 16 * s} ${y + 34 * s} L ${x - 4 * s} ${y + 28 * s} Z`;
    return F(T, c, ln) + F(mirrorAt(T, x), c, ln) + F(L, c, ln) + F(mirrorAt(L, x), c, ln) +
      `<ellipse cx="${x}" cy="${y}" rx="${9 * s}" ry="${8 * s}" fill="${lt(c, .15)}" stroke="${ln}" stroke-width="2.2"/>`;
  }
  // Pfad an beliebiger x-Achse spiegeln
  function mirrorAt(d, ax) { return d.replace(/([MLQCZ])([^MLQCZ]*)/g, (_, c, args) => { const n = args.trim().split(/[\s,]+/).filter(Boolean).map(Number); return c + ' ' + n.map((v, i) => i % 2 === 0 ? +(2 * ax - v).toFixed(1) : v).join(' ') + ' '; }); }
  function flower(x, y, r, petal, mid, ln = '#7a4a5a') { let s = ''; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - Math.PI / 2; s += `<ellipse cx="${(x + Math.cos(a) * r * .58).toFixed(1)}" cy="${(y + Math.sin(a) * r * .58).toFixed(1)}" rx="${(r * .5).toFixed(1)}" ry="${(r * .44).toFixed(1)}" transform="rotate(${(a * 180 / Math.PI + 90).toFixed(0)} ${(x + Math.cos(a) * r * .58).toFixed(1)} ${(y + Math.sin(a) * r * .58).toFixed(1)})" fill="${petal}" stroke="${ln}" stroke-width="1.6"/>`; } return s + `<circle cx="${x}" cy="${y}" r="${(r * .3).toFixed(1)}" fill="${mid}" stroke="${ln}" stroke-width="1.4"/>`; }
  function star(x, y, r, fill, ln = '#7a5a2a', w = 2) { let d = ''; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * .46 : r; d += (i ? 'L ' : 'M ') + (x + Math.cos(a) * rr).toFixed(1) + ' ' + (y + Math.sin(a) * rr).toFixed(1) + ' '; } return F(d + 'Z', fill, ln, w); }

  // ------------------------------------------------------------------ Accessoires
  const ACC = {
    flower: { name: 'Blüten-Spange', draw: (g) => F('M 398 236 C 420 236 438 250 444 266 C 424 268 406 256 398 236 Z', '#7fcf8f', '#3f8a52', 1.6) + flower(404, 214, 30, '#ffffff', '#ffd45a') + flower(436, 196, 16, lt(g.accent, .55), '#ffd45a') },
    ribbon: { name: 'Haarschleife', draw: (g) => bowBig(424, 196, g.accent) },
    star: { name: 'Stern-Spange', draw: () => star(204, 226, 24, '#ffe066') + `<circle cx="198" cy="218" r="4" fill="#fff" opacity=".8"/>` },
    snow: { name: 'Schneeflocken-Pin', draw: () => { const c = '#8fd3ff', x = 404, y = 226; let d = ''; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; const ex = x + Math.cos(a) * 22, ey = y + Math.sin(a) * 22; d += `M ${x} ${y} L ${ex.toFixed(1)} ${ey.toFixed(1)} M ${(x + Math.cos(a) * 13 + Math.cos(a + .9) * 7).toFixed(1)} ${(y + Math.sin(a) * 13 + Math.sin(a + .9) * 7).toFixed(1)} L ${(x + Math.cos(a) * 13).toFixed(1)} ${(y + Math.sin(a) * 13).toFixed(1)} L ${(x + Math.cos(a) * 13 + Math.cos(a - .9) * 7).toFixed(1)} ${(y + Math.sin(a) * 13 + Math.sin(a - .9) * 7).toFixed(1)} `; } return S(d, '#2e6f9c', 6) + S(d, c, 3.4) + `<circle cx="${x}" cy="${y}" r="5" fill="#fff" stroke="#2e6f9c" stroke-width="1.6"/>`; } },
    bat: { name: 'Fledermaus-Spange', draw: () => F('M 398 210 C 388 192 366 186 348 196 C 360 202 360 212 356 220 C 368 216 378 222 382 232 C 388 224 394 224 398 230 C 402 224 408 224 414 232 C 418 222 428 216 440 220 C 436 212 436 202 448 196 C 430 186 408 192 398 210 Z', '#2a2035', '#8a7aa6', 1.8) + `<circle cx="393" cy="212" r="2.4" fill="#ff4f93"/><circle cx="403" cy="212" r="2.4" fill="#ff4f93"/>` },
    cat: { name: 'Katzenohren', top: true, draw: (g) => { const e = 'M 184 176 C 180 120 190 74 204 58 C 230 76 258 100 272 124 Z', i = 'M 198 160 C 196 124 202 96 210 84 C 226 98 242 114 252 130 Z'; return F(e, `url(#hb${g.uid})`, dk(g.hairDark, .45)) + F(i, '#ffc2d4', '#e48aa6', 1.6) + F(mirror(e), `url(#hb${g.uid})`, dk(g.hairDark, .45)) + F(mirror(i), '#ffc2d4', '#e48aa6', 1.6); } },
    glasses: { name: 'Runde Brille', face: true, draw: () => `<circle cx="${EYE.L}" cy="${EYE.y + 2}" r="50" fill="rgba(210,235,255,.14)" stroke="#5b3b47" stroke-width="5"/><circle cx="${EYE.R}" cy="${EYE.y + 2}" r="50" fill="rgba(210,235,255,.14)" stroke="#5b3b47" stroke-width="5"/>` + S(`M ${EYE.L + 48} ${EYE.y - 6} C 290 ${EYE.y - 18} 310 ${EYE.y - 18} ${EYE.R - 48} ${EYE.y - 6}`, '#5b3b47', 5) + S(`M ${EYE.L - 34} ${EYE.y - 24} L ${EYE.L - 22} ${EYE.y - 34}`, '#fff', 4, 'opacity=".6"') + S(`M ${EYE.R - 34} ${EYE.y - 24} L ${EYE.R - 22} ${EYE.y - 34}`, '#fff', 4, 'opacity=".6"') },
    phones: { name: 'Kopfhörer', top: true, draw: (g) => S('M 166 330 C 140 150 460 150 434 330', '#3b3f58', 16) + S('M 166 330 C 140 150 460 150 434 330', '#8b93c9', 6) + F('M 150 296 C 136 330 140 372 156 396 L 188 388 L 188 300 Z', '#3b3f58', '#22253a') + F(mirror('M 150 296 C 136 330 140 372 156 396 L 188 388 L 188 300 Z'), '#3b3f58', '#22253a') + `<circle cx="166" cy="346" r="12" fill="${g.accent}"/><circle cx="434" cy="346" r="12" fill="${g.accent}"/>` },
    crown: { name: 'Blumenkranz', top: true, draw: () => S('M 186 196 C 230 130 370 130 414 196', '#5aa860', 4) + [[190, 196], [222, 160], [262, 140], [300, 134], [338, 140], [378, 160], [410, 196]].map(([x, y], i) => flower(x, y, 20, ['#ffb3cf', '#ffffff', '#ffd45a', '#c8f0d0', '#ffffff', '#ffb3cf', '#d9c2ff'][i], '#ffd45a')).join('') },
    tiara: { name: 'Krönchen', top: true, draw: () => F('M 246 144 L 252 98 L 276 126 L 300 86 L 324 126 L 348 98 L 354 144 C 320 136 280 136 246 144 Z', '#ffd84a', '#a8781a') + `<circle cx="300" cy="116" r="8" fill="#ff4f93" stroke="#a8781a" stroke-width="2"/><circle cx="268" cy="132" r="4.5" fill="#7fd4ff"/><circle cx="332" cy="132" r="4.5" fill="#7fd4ff"/>` },
    witch: { name: 'Hexenhut', top: true, draw: (g) => F('M 100 208 C 200 150 400 150 500 208 C 440 228 160 228 100 208 Z', '#2e2442', '#120c1c') + F('M 196 196 C 230 110 300 40 410 10 C 370 70 386 140 404 192 C 330 176 260 178 196 196 Z', '#2e2442', '#120c1c') + S('M 200 190 C 260 172 340 172 402 188', g.accent, 12) + star(330, 150, 14, '#ffe066') },
    straw: { name: 'Strohhut', top: true, draw: () => `<ellipse cx="300" cy="196" rx="190" ry="44" fill="#f2d48e" stroke="#a87f3a" stroke-width="2.6"/>` + F('M 206 192 C 206 100 250 82 300 82 C 350 82 394 100 394 192 C 340 204 260 204 206 192 Z', '#f2d48e', '#a87f3a', 2.6) + S('M 208 176 C 260 192 340 192 392 176', '#e85d75', 12) + S('M 120 200 C 200 230 400 230 480 200', '#c9a256', 2, 'opacity=".6"') },
  };
  function bowBig(x, y, c) {
    const ln = dk(c, .45);
    const wingL = `M ${x} ${y} C ${x - 18} ${y - 40} ${x - 66} ${y - 52} ${x - 70} ${y - 16} C ${x - 72} ${y + 12} ${x - 30} ${y + 22} ${x} ${y} Z`;
    return F(wingL, c, ln) + F(mirrorAt(wingL, x), c, ln) + S(`M ${x - 12} ${y - 6} C ${x - 30} ${y - 26} ${x - 50} ${y - 32} ${x - 58} ${y - 20}`, dk(c, .25), 2, 'opacity=".6"') + S(mirrorAt(`M ${x - 12} ${y - 6} C ${x - 30} ${y - 26} ${x - 50} ${y - 32} ${x - 58} ${y - 20}`, x), dk(c, .25), 2, 'opacity=".6"') +
      F(`M ${x - 8} ${y + 6} C ${x - 18} ${y + 30} ${x - 24} ${y + 50} ${x - 22} ${y + 70} L ${x - 4} ${y + 56} Z`, c, ln) + F(`M ${x + 8} ${y + 6} C ${x + 18} ${y + 30} ${x + 24} ${y + 50} ${x + 22} ${y + 70} L ${x + 4} ${y + 56} Z`, c, ln) +
      `<ellipse cx="${x}" cy="${y}" rx="13" ry="12" fill="${lt(c, .12)}" stroke="${ln}" stroke-width="2.4"/>`;
  }
  A.ACC = Object.fromEntries(Object.entries(ACC).map(([k, v]) => [k, v.name]));
  A.FACE_BOX = '150 46 300 326';
  A.BODY_BOX = '110 380 380 560';
  A.face = (id, expr = 'happy', o = {}) => A.girl(id, { ...o, expr }).replace(`viewBox="0 0 ${W} ${H}"`, `viewBox="${A.FACE_BOX}"`);

  // ------------------------------------------------------------------ Zimmer
  A.DECOR = { plant: 'Zimmerpflanze', plush: 'Plüsch-Hase', poster: 'Anime-Poster', lights: 'Lichterkette', rug: 'Flauschiger Teppich', clock: 'Wanduhr', lamp: 'Sternenlampe' };
  A.timeOfDay = (d = new Date()) => { const hr = d.getHours(); return hr < 6 ? 'night' : hr < 10 ? 'morning' : hr < 17 ? 'day' : hr < 21 ? 'evening' : 'night'; };
  A.room = ({ tod = 'day', decor = {}, dark = false, wall = '#3a2430' } = {}) => {
    const SKY = { morning: ['#ffb4a2', '#ffe5b4'], day: ['#7cc6ff', '#d9f1ff'], evening: ['#ff7e5f', '#7b4397'], night: ['#0b1033', '#283a73'] }[tod];
    const night = tod === 'night';
    let s = `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${SKY[0]}"/><stop offset="1" stop-color="${SKY[1]}"/></linearGradient>` +
      `<linearGradient id="wallg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${wall}"/><stop offset="1" stop-color="#25151d"/></linearGradient>` +
      `<radialGradient id="lampglow"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".55"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient></defs>`;
    s += `<rect width="800" height="500" fill="url(#wallg)"/>`;
    s += `<g opacity=".08">${Array.from({ length: 16 }, (_, i) => `<path d="M ${i * 54} 0 L ${i * 54} 360" stroke="#fff" stroke-width="12"/>`).join('')}</g>`;
    // Fenster
    s += `<rect x="300" y="60" width="200" height="170" rx="10" fill="url(#sky)" stroke="#6b4452" stroke-width="10"/>`;
    if (night) s += Array.from({ length: 14 }, (_, i) => `<circle cx="${312 + (i * 47) % 176}" cy="${72 + (i * 31) % 140}" r="${i % 3 ? 1.4 : 2.4}" fill="#fff" opacity=".9"/>`).join('') + `<circle cx="452" cy="102" r="18" fill="#fff6d6"/><circle cx="460" cy="96" r="16" fill="#283a73" opacity=".9"/>`;
    else if (tod === 'evening') s += `<circle cx="400" cy="214" r="34" fill="#ffd27a" opacity=".9"/>`;
    else s += `<circle cx="${tod === 'morning' ? 340 : 456}" cy="${tod === 'morning' ? 190 : 104}" r="22" fill="#fff3b0"/>` + `<path d="M 330 120 q 20 -18 40 0 q 18 -6 26 8 l -76 0 z" fill="#fff" opacity=".85"/>`;
    s += `<path d="M 400 60 L 400 230 M 300 145 L 500 145" stroke="#6b4452" stroke-width="7"/>`;
    s += `<path d="M 286 50 Q 300 150 292 240 L 330 240 Q 318 150 330 50 Z" fill="#c2556f" opacity=".9"/><path d="M 514 50 Q 500 150 508 240 L 470 240 Q 482 150 470 50 Z" fill="#c2556f" opacity=".9"/><rect x="276" y="44" width="248" height="10" rx="5" fill="#8a5a3b"/>`;
    // Boden
    s += `<rect y="360" width="800" height="140" fill="#5a3a2e"/><path d="M 0 360 L 800 360" stroke="#3d271f" stroke-width="6"/>` + Array.from({ length: 9 }, (_, i) => `<path d="M ${i * 100} 360 L ${i * 100 - 60} 500" stroke="#4b3026" stroke-width="3"/>`).join('');
    if (decor.rug) s += `<ellipse cx="400" cy="440" rx="230" ry="44" fill="#e7a6c1" opacity=".9"/><ellipse cx="400" cy="440" rx="200" ry="34" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="6 8" opacity=".7"/>`;
    // Bett links
    s += `<rect x="24" y="290" width="200" height="90" rx="14" fill="#8a5a3b"/><rect x="34" y="276" width="184" height="54" rx="16" fill="#f6dbe6"/><rect x="40" y="262" width="70" height="36" rx="14" fill="#ffffff"/><rect x="14" y="230" width="22" height="160" rx="8" fill="#6f4630"/>`;
    s += `<path d="M 110 282 Q 160 270 218 282 L 218 330 L 110 330 Z" fill="#e99ab7"/>`;
    if (decor.plush) s += `<g transform="translate(150 246)"><ellipse cx="0" cy="22" rx="20" ry="18" fill="#fff" stroke="#5a3a44" stroke-width="2"/><circle cx="0" cy="0" r="15" fill="#fff" stroke="#5a3a44" stroke-width="2"/><ellipse cx="-7" cy="-20" rx="5" ry="13" fill="#fff" stroke="#5a3a44" stroke-width="2"/><ellipse cx="7" cy="-20" rx="5" ry="13" fill="#fff" stroke="#5a3a44" stroke-width="2"/><circle cx="-5" cy="-1" r="2" fill="#5a3a44"/><circle cx="5" cy="-1" r="2" fill="#5a3a44"/><circle cx="0" cy="4" r="2" fill="#ff8fa6"/></g>`;
    // Regal/Schreibtisch rechts
    s += `<rect x="580" y="270" width="190" height="16" rx="5" fill="#8a5a3b"/><rect x="592" y="286" width="12" height="80" fill="#6f4630"/><rect x="746" y="286" width="12" height="80" fill="#6f4630"/>`;
    s += `<rect x="600" y="230" width="16" height="40" rx="2" fill="#e85d75"/><rect x="618" y="236" width="14" height="34" rx="2" fill="#5fa8e8"/><rect x="634" y="226" width="18" height="44" rx="2" fill="#f2c14e"/><rect x="654" y="240" width="12" height="30" rx="2" fill="#7bd389"/>`;
    s += `<rect x="610" y="150" width="150" height="10" rx="4" fill="#8a5a3b"/><circle cx="640" cy="136" r="12" fill="#ffd166"/><rect x="668" y="120" width="20" height="30" rx="4" fill="#c792ea"/><path d="M 704 150 L 716 118 L 728 150 Z" fill="#7fdbca"/>`;
    if (decor.lamp) s += `<circle cx="720" cy="230" r="${night || dark ? 90 : 0}" fill="url(#lampglow)"/><path d="M 700 270 L 740 270 L 732 252 L 708 252 Z" fill="#6b4452"/><path d="M 704 252 L 736 252 L 726 214 L 714 214 Z" fill="#ffe08a"/>` + star(720, 232, 6, '#fff7c2').replace(/stroke="[^"]+"/, 'stroke="none"');
    if (decor.plant) s += `<g transform="translate(250 300)"><path d="M -20 30 L 20 30 L 16 64 L -16 64 Z" fill="#c2703d" stroke="#5a3a2e" stroke-width="2"/><path d="M 0 30 C -30 0 -34 -26 -10 -40 C -6 -14 -2 4 0 30 Z" fill="#4caf50"/><path d="M 0 30 C 28 4 36 -20 16 -36 C 8 -10 4 6 0 30 Z" fill="#66bb6a"/><path d="M 0 30 C -4 0 0 -30 4 -50 C 10 -26 8 0 0 30 Z" fill="#81c784"/></g>`;
    if (decor.poster) s += `<g transform="translate(560 70) rotate(3)"><rect width="90" height="120" rx="4" fill="#fff"/><rect x="6" y="6" width="78" height="86" fill="#7b4397"/><circle cx="45" cy="44" r="20" fill="#ff9ec4"/><path d="M 20 92 Q 45 60 70 92 Z" fill="#ff9ec4"/><rect x="14" y="100" width="62" height="6" rx="3" fill="#e85d75"/></g>`;
    if (decor.clock) s += `<g transform="translate(150 120)"><circle r="34" fill="#f6ecd4" stroke="#8a5a3b" stroke-width="6"/>${Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return `<circle cx="${(Math.sin(a) * 26).toFixed(1)}" cy="${(-Math.cos(a) * 26).toFixed(1)}" r="1.8" fill="#5a3a44"/>`; }).join('')}<path d="M 0 0 L 0 -20" stroke="#5a3a44" stroke-width="3" stroke-linecap="round" class="clk-m"/><path d="M 0 0 L 12 0" stroke="#e11d48" stroke-width="3" stroke-linecap="round" class="clk-h"/><circle r="3" fill="#5a3a44"/></g>`;
    if (decor.lights) s += `<path d="M 0 22 Q 100 52 200 22 Q 300 52 400 22 Q 500 52 600 22 Q 700 52 800 22" stroke="#3d2a33" stroke-width="2" fill="none"/>` + Array.from({ length: 20 }, (_, i) => { const x = 20 + i * 40, y = 22 + Math.sin((x % 200) / 200 * Math.PI) * 22; return `<circle cx="${x}" cy="${y.toFixed(1)}" r="5" fill="${['#ffd166', '#ff9ec4', '#7fdbca', '#c792ea'][i % 4]}" class="fl" style="animation-delay:${(i % 5) * .3}s"/>`; }).join('');
    // Licht
    const shade = dark ? .62 : night ? .38 : tod === 'evening' ? .16 : 0;
    if (shade) s += `<rect width="800" height="500" fill="#0a0820" opacity="${shade}"/>`;
    if ((night || dark) && decor.lamp) s += `<circle cx="720" cy="230" r="160" fill="url(#lampglow)"/>`;
    return `<svg class="cr-svg" viewBox="0 0 800 500" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
  };
})();
