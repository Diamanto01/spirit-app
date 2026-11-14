/* Spirit Notes – Begleiterin: eigene, original gezeichnete Anime-Mädchen (SVG, Halbkörper im Visual-Novel-Stil) + Zimmer */
(() => {
  const A = SN.compArt = {};
  const W = 600, H = 800, CX = 300;
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
    akane: { name: 'Akane', type: 'Tsundere', desc: 'Frech, stolz und schnell rot im Gesicht – aber insgeheim freut sie sich riesig, dass du da bist.', hair: '#ff8a4c', hairDark: '#cf4a26', eyes: '#f2a93b', eyesDark: '#94520c', back: 'bob', tail: 'side', bangs: 'swept', locks: 'short', acc: 'ribbon', outfit: 'school', dress: '#ffffff', dressDark: '#dde2ec', accent: '#d7263d', likes: 'taiyaki', dislikes: 'natto', gift: 'plush' },
    sora: { name: 'Sora', type: 'Energiebündel', desc: 'Laut, fröhlich und immer in Bewegung. Mit ihr wird es nie langweilig!', hair: '#6cc3ff', hairDark: '#2a7fd4', eyes: '#ffab2e', eyesDark: '#b05e05', back: 'short', bangs: 'spiky', locks: 'short', ahoge: true, acc: 'star', outfit: 'hoodie', dress: '#ffd84d', dressDark: '#e3ad1c', accent: '#ff7a45', likes: 'ramen', dislikes: 'salad', gift: 'game' },
    yuki: { name: 'Yuki', type: 'Kühl & ruhig', desc: 'Sagt nicht viel und wirkt kühl – doch wer sie kennt, merkt, wie sanft sie eigentlich ist.', hair: '#eef3fb', hairDark: '#9fb1cf', eyes: '#59b8ec', eyesDark: '#1c5f8f', back: 'long', bangs: 'straight', locks: 'long', acc: 'snow', outfit: 'casual', dress: '#e4efff', dressDark: '#a9c2e8', accent: '#3a5aa0', likes: 'mochi', dislikes: 'spicy', gift: 'book' },
    mira: { name: 'Mira', type: 'Dramatische Gothic-Prinzessin', desc: 'Nennt sich „Herrscherin der Mitternacht“, liebt große Auftritte – und heimlich Kuscheltiere.', hair: '#8a68d6', hairDark: '#4a2f8f', eyes: '#f0569a', eyesDark: '#8e1650', back: 'long', buns: true, bangs: 'blunt', locks: 'hime', acc: 'bat', outfit: 'gothic', dress: '#2b2236', dressDark: '#15101c', accent: '#a66ce6', likes: 'choco', dislikes: 'garlic', gift: 'candle' },
  };

  // ------------------------------------------------------------------ Kopf-Geometrie
  const FACE = 'M 186 300 C 184 362 204 414 242 448 C 264 468 284 478 300 479 C 316 478 336 468 358 448 C 396 414 416 362 414 300 C 414 196 366 146 300 146 C 234 146 186 196 186 300 Z';
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
    long: 'M 176 236 C 128 330 112 520 118 830 L 482 830 C 488 520 472 330 424 236 C 410 146 362 96 300 96 C 238 96 190 146 176 236 Z',
    wavy: 'M 176 236 C 130 320 122 420 108 520 C 96 600 120 650 104 720 C 96 760 110 800 100 830 L 500 830 C 490 800 504 760 496 720 C 480 650 504 600 492 520 C 478 420 470 320 424 236 C 410 146 362 96 300 96 C 238 96 190 146 176 236 Z',
    bob: 'M 172 236 C 140 320 136 420 150 500' + edge([[150, 500], [176, 552], [196, 506], [228, 560], [252, 520], [300, 548], [348, 520], [372, 560], [404, 506], [424, 552], [450, 500]]) + ' C 464 420 460 320 428 236 C 414 146 364 96 300 96 C 236 96 186 146 172 236 Z',
    short: 'M 174 236 C 146 316 144 400 158 470' + edge([[158, 470], [186, 520], [204, 470], [232, 512], [300, 480], [368, 512], [396, 470], [414, 520], [442, 470]]) + ' C 456 400 454 316 426 236 C 412 146 364 96 300 96 C 236 96 188 146 174 236 Z',
  };
  const TAIL = 'M 412 186 C 486 150 556 214 548 330 C 542 420 520 500 506 580 C 496 640 498 700 486 760' + edge([[486, 760], [474, 702], [462, 748], [462, 684], [446, 718], [452, 640]]) + ' C 470 560 486 470 486 390 C 486 316 466 262 424 236 Z';

  // ------------------------------------------------------------------ Augen
  function eye(cx, side, kind, g) {
    const y = EYE.y, s = side === 'L' ? -1 : 1, id = `${g.uid}${side}`;
    const lash = dk(g.eyesDark, .55);
    // Augenform (Mandel, oben breiter)
    const shape = `M ${cx - 36} ${y - 12} C ${cx - 26} ${y - 34} ${cx + 22} ${y - 38} ${cx + 36} ${y - 16} C ${cx + 38} ${y + 10} ${cx + 26} ${y + 36} ${cx} ${y + 38} C ${cx - 24} ${y + 36} ${cx - 38} ${y + 12} ${cx - 36} ${y - 12} Z`;
    const lashLine = side === 'L'
      ? `M ${cx - 44} ${y - 4} C ${cx - 38} ${y - 26} ${cx - 16} ${y - 40} ${cx + 8} ${y - 39} C ${cx + 22} ${y - 38} ${cx + 32} ${y - 30} ${cx + 38} ${y - 18} L ${cx + 33} ${y - 10} C ${cx + 26} ${y - 22} ${cx + 12} ${y - 28} ${cx - 2} ${y - 27} C ${cx - 20} ${y - 26} ${cx - 32} ${y - 16} ${cx - 38} ${y - 2} Z`
      : mirror(`M ${W - cx - 44} ${y - 4} C ${W - cx - 38} ${y - 26} ${W - cx - 16} ${y - 40} ${W - cx + 8} ${y - 39} C ${W - cx + 22} ${y - 38} ${W - cx + 32} ${y - 30} ${W - cx + 38} ${y - 18} L ${W - cx + 33} ${y - 10} C ${W - cx + 26} ${y - 22} ${W - cx + 12} ${y - 28} ${W - cx - 2} ${y - 27} C ${W - cx - 20} ${y - 26} ${W - cx - 32} ${y - 16} ${W - cx - 38} ${y - 2} Z`);
    const wing = side === 'L' ? `M ${cx - 36} ${y - 8} L ${cx - 54} ${y - 16} L ${cx - 46} ${y - 8} L ${cx - 56} ${y - 6} L ${cx - 40} ${y} Z` : `M ${cx + 36} ${y - 8} L ${cx + 54} ${y - 16} L ${cx + 46} ${y - 8} L ${cx + 56} ${y - 6} L ${cx + 40} ${y} Z`;
    const crease = S(`M ${cx - 28} ${y - 46} C ${cx - 10} ${y - 54} ${cx + 12} ${y - 54} ${cx + 30} ${y - 44}`, dk(SKIN3, .25), 2, 'opacity=".55"');
    const lower = S(side === 'L' ? `M ${cx - 22} ${y + 37} C ${cx - 8} ${y + 42} ${cx + 10} ${y + 42} ${cx + 22} ${y + 35}` : `M ${cx + 22} ${y + 37} C ${cx + 8} ${y + 42} ${cx - 10} ${y + 42} ${cx - 22} ${y + 35}`, lash, 2, 'opacity=".55"');
    const lowerTick = S(side === 'L' ? `M ${cx - 30} ${y + 26} L ${cx - 36} ${y + 32}` : `M ${cx + 30} ${y + 26} L ${cx + 36} ${y + 32}`, lash, 1.8, 'opacity=".5"');
    const iris = (rx = 25, ry = 32, p = 1, ox = 0) =>
      `<g clip-path="url(#ec${id})">` +
      `<ellipse cx="${cx + ox}" cy="${y + 6}" rx="${rx}" ry="${ry}" fill="url(#ir${g.uid})" stroke="${dk(g.eyesDark, .2)}" stroke-width="2.2"/>` +
      `<ellipse cx="${cx + ox}" cy="${y + 24}" rx="${rx * .62}" ry="${ry * .3}" fill="${lt(g.eyes, .45)}" opacity=".75"/>` +
      `<ellipse cx="${cx + ox}" cy="${y + 8}" rx="${10.5 * p}" ry="${15 * p}" fill="${dk(g.eyesDark, .45)}"/>` +
      `<path d="M ${cx - 40} ${y - 40} L ${cx + 40} ${y - 40} L ${cx + 40} ${y - 8} C ${cx + 20} ${y - 18} ${cx - 20} ${y - 18} ${cx - 40} ${y - 8} Z" fill="${dk(g.eyesDark, .5)}" opacity=".32"/>` +
      `<ellipse cx="${cx - 9 + ox}" cy="${y - 6}" rx="8.5" ry="11" fill="#fff"/><circle cx="${cx + 12 + ox}" cy="${y + 19}" r="4.2" fill="#fff" opacity=".95"/><circle cx="${cx + 4 + ox}" cy="${y - 13}" r="2.2" fill="#fff" opacity=".85"/>` +
      `</g>`;
    const spikes = S(side === 'L' ? `M ${cx - 30} ${y - 24} L ${cx - 40} ${y - 32} M ${cx - 20} ${y - 32} L ${cx - 27} ${y - 42} M ${cx - 36} ${y - 14} L ${cx - 48} ${y - 20}` : `M ${cx + 30} ${y - 24} L ${cx + 40} ${y - 32} M ${cx + 20} ${y - 32} L ${cx + 27} ${y - 42} M ${cx + 36} ${y - 14} L ${cx + 48} ${y - 20}`, lash, 2.6);
    const base = (inner) => `<path d="${shape}" fill="url(#ew${g.uid})"/>` + inner + F(lashLine, lash) + F(wing, lash) + spikes + lower + lowerTick + crease;
    switch (kind) {
      case 'happy': return S(side === 'L' ? `M ${cx - 34} ${y + 8} C ${cx - 22} ${y - 18} ${cx + 22} ${y - 18} ${cx + 34} ${y + 8}` : `M ${cx + 34} ${y + 8} C ${cx + 22} ${y - 18} ${cx - 22} ${y - 18} ${cx - 34} ${y + 8}`, lash, 7) + S(side === 'L' ? `M ${cx - 32} ${y + 4} L ${cx - 44} ${y - 2}` : `M ${cx + 32} ${y + 4} L ${cx + 44} ${y - 2}`, lash, 4) + S(`M ${cx - 20} ${y + 16} C ${cx - 6} ${y + 10} ${cx + 6} ${y + 10} ${cx + 20} ${y + 16}`, lash, 1.8, 'opacity=".35"');
      case 'closed': return S(side === 'L' ? `M ${cx - 34} ${y + 2} C ${cx - 20} ${y + 22} ${cx + 20} ${y + 22} ${cx + 34} ${y + 2}` : `M ${cx + 34} ${y + 2} C ${cx + 20} ${y + 22} ${cx - 20} ${y + 22} ${cx - 34} ${y + 2}`, lash, 6.5) + S(side === 'L' ? `M ${cx - 30} ${y + 8} L ${cx - 42} ${y + 14}` : `M ${cx + 30} ${y + 8} L ${cx + 42} ${y + 14}`, lash, 3.5) + S(`M ${cx - 16} ${y + 21} L ${cx - 18} ${y + 28} M ${cx} ${y + 24} L ${cx} ${y + 31} M ${cx + 16} ${y + 21} L ${cx + 18} ${y + 28}`, lash, 2, 'opacity=".6"');
      case 'half': return `<path d="${shape}" fill="url(#ew${g.uid})"/>` + iris() + `<path d="M ${cx - 44} ${y - 48} L ${cx + 44} ${y - 48} L ${cx + 44} ${y + 2} C ${cx + 20} ${y - 6} ${cx - 20} ${y - 6} ${cx - 44} ${y + 2} Z" fill="${SKIN}"/>` + S(`M ${cx - 40} ${y + 2} C ${cx - 20} ${y - 6} ${cx + 20} ${y - 6} ${cx + 40} ${y}`, lash, 6.5) + S(`M ${cx - 32} ${y - 10} C ${cx - 12} ${y - 18} ${cx + 12} ${y - 18} ${cx + 32} ${y - 10}`, dk(SKIN3, .2), 2, 'opacity=".5"') + lower;
      case 'wide': return base(iris(20, 27, .55));
      case 'heart': return base(`<g clip-path="url(#ec${id})"><ellipse cx="${cx}" cy="${y + 6}" rx="25" ry="32" fill="url(#ir${g.uid})" stroke="${dk(g.eyesDark, .2)}" stroke-width="2.2"/><path d="M ${cx} ${y + 26} C ${cx - 30} ${y + 6} ${cx - 18} ${y - 22} ${cx} ${y - 6} C ${cx + 18} ${y - 22} ${cx + 30} ${y + 6} ${cx} ${y + 26} Z" fill="#ff4f93" stroke="#fff" stroke-width="2"/><ellipse cx="${cx - 9}" cy="${y - 4}" rx="5" ry="6" fill="#fff" opacity=".9"/></g>`);
      case 'angry': return `<path d="${shape}" fill="url(#ew${g.uid})"/>` + iris(24, 30, .8) + `<path d="${side === 'L' ? `M ${cx - 46} ${y - 50} L ${cx + 46} ${y - 50} L ${cx + 46} ${y - 4} L ${cx - 46} ${y - 24} Z` : `M ${cx - 46} ${y - 50} L ${cx + 46} ${y - 50} L ${cx + 46} ${y - 24} L ${cx - 46} ${y - 4} Z`}" fill="${SKIN}"/>` + S(side === 'L' ? `M ${cx - 42} ${y - 22} L ${cx + 40} ${y - 4}` : `M ${cx - 40} ${y - 4} L ${cx + 42} ${y - 22}`, lash, 6.5) + lower;
      case 'teary': return base(iris() + `<g clip-path="url(#ec${id})"><path d="M ${cx - 40} ${y + 22} C ${cx - 20} ${y + 14} ${cx + 20} ${y + 14} ${cx + 40} ${y + 22} L ${cx + 40} ${y + 44} L ${cx - 40} ${y + 44} Z" fill="#bfe6ff" opacity=".7"/></g>`) + F(`M ${cx + s * 22} ${y + 36} C ${cx + s * 30} ${y + 54} ${cx + s * 28} ${y + 66} ${cx + s * 22} ${y + 70} C ${cx + s * 14} ${y + 66} ${cx + s * 14} ${y + 54} ${cx + s * 22} ${y + 36} Z`, '#8fd0ff', '#4aa3e0', 1.4);
      case 'star': return base(iris() + `<g clip-path="url(#ec${id})"><path d="M ${cx} ${y - 10} L ${cx + 5} ${y + 2} L ${cx + 17} ${y + 4} L ${cx + 8} ${y + 12} L ${cx + 11} ${y + 24} L ${cx} ${y + 18} L ${cx - 11} ${y + 24} L ${cx - 8} ${y + 12} L ${cx - 17} ${y + 4} L ${cx - 5} ${y + 2} Z" fill="#fff"/></g>`);
      default: return base(iris());
    }
  }
  function brows(kind, g) {
    const y = EYE.y, c = dk(g.hairDark, .25);
    const P = { normal: [-58, -66, -62], sad: [-58, -64, -74], angry: [-72, -66, -54], up: [-68, -78, -72], flat: [-62, -62, -62] }[kind] || [-58, -66, -62];
    const b = (cx, sgn) => F(`M ${cx - 26 * sgn} ${y + P[0]} C ${cx - 8 * sgn} ${y + P[1] - 3} ${cx + 8 * sgn} ${y + P[1] - 2} ${cx + 24 * sgn} ${y + P[2] - 1} C ${cx + 10 * sgn} ${y + P[1] + 3} ${cx - 8 * sgn} ${y + P[1] + 3} ${cx - 26 * sgn} ${y + P[0]} Z`, c, c, 2.6);
    return `<g opacity=".85">${b(EYE.L, -1)}${b(EYE.R, 1)}</g>`;
  }
  function mouth(kind) {
    const y = 428, L = '#9c3b4b';
    const open = (d, tongue = true) => F(d, '#c2455e', L, 2.4) + (tongue ? `<clipPath id="mt${uid}"><path d="${d}"/></clipPath><ellipse clip-path="url(#mt${uid})" cx="${CX}" cy="${y + 20}" rx="16" ry="10" fill="#ff8fa3"/>` : '');
    switch (kind) {
      case 'grin': return open(`M ${CX - 24} ${y - 4} C ${CX - 10} ${y} ${CX + 10} ${y} ${CX + 24} ${y - 4} C ${CX + 20} ${y + 22} ${CX + 8} ${y + 30} ${CX} ${y + 30} C ${CX - 8} ${y + 30} ${CX - 20} ${y + 22} ${CX - 24} ${y - 4} Z`) + S(`M ${CX - 18} ${y + 1} C ${CX - 6} ${y + 4} ${CX + 6} ${y + 4} ${CX + 18} ${y + 1}`, '#fff', 3);
      case 'open': return open(`M ${CX - 11} ${y + 2} C ${CX - 12} ${y - 10} ${CX + 12} ${y - 10} ${CX + 11} ${y + 2} C ${CX + 12} ${y + 18} ${CX - 12} ${y + 18} ${CX - 11} ${y + 2} Z`);
      case 'eat': return open(`M ${CX - 14} ${y} C ${CX - 10} ${y - 8} ${CX + 10} ${y - 8} ${CX + 14} ${y} C ${CX + 12} ${y + 12} ${CX - 12} ${y + 12} ${CX - 14} ${y} Z`);
      case 'shout': return open(`M ${CX - 22} ${y - 6} L ${CX + 22} ${y - 6} C ${CX + 18} ${y + 18} ${CX + 8} ${y + 26} ${CX} ${y + 26} C ${CX - 8} ${y + 26} ${CX - 18} ${y + 18} ${CX - 22} ${y - 6} Z`);
      case 'frown': return S(`M ${CX - 16} ${y + 8} C ${CX - 8} ${y - 2} ${CX + 8} ${y - 2} ${CX + 16} ${y + 8}`, L, 3);
      case 'pout': return S(`M ${CX - 14} ${y + 4} C ${CX - 10} ${y - 3} ${CX - 4} ${y - 3} ${CX} ${y + 3} C ${CX + 4} ${y - 3} ${CX + 10} ${y - 3} ${CX + 14} ${y + 4}`, L, 2.8);
      case 'cat': return S(`M ${CX - 22} ${y - 2} C ${CX - 16} ${y + 10} ${CX - 4} ${y + 10} ${CX} ${y + 1} C ${CX + 4} ${y + 10} ${CX + 16} ${y + 10} ${CX + 22} ${y - 2}`, L, 3);
      case 'flat': return S(`M ${CX - 12} ${y + 2} L ${CX + 12} ${y + 2}`, L, 3);
      case 'smug': return S(`M ${CX - 18} ${y + 2} C ${CX - 4} ${y + 10} ${CX + 10} ${y + 8} ${CX + 20} ${y - 6}`, L, 3);
      case 'wavy': return S(`M ${CX - 20} ${y + 4} C ${CX - 16} ${y - 4} ${CX - 10} ${y - 4} ${CX - 6} ${y + 4} C ${CX - 2} ${y + 10} ${CX + 2} ${y + 10} ${CX + 6} ${y + 4} C ${CX + 10} ${y - 4} ${CX + 16} ${y - 4} ${CX + 20} ${y + 4}`, L, 2.6);
      case 'tiny': return S(`M ${CX - 6} ${y + 2} C ${CX - 2} ${y + 5} ${CX + 2} ${y + 5} ${CX + 6} ${y + 2}`, L, 2.6);
      default: return S(`M ${CX - 18} ${y - 2} C ${CX - 8} ${y + 11} ${CX + 8} ${y + 11} ${CX + 18} ${y - 2}`, L, 3);
    }
  }
  // Ausdrücke: [Augen, Brauen, Mund, Röte]
  A.EXPR = {
    neutral: ['open', 'normal', 'smile', 0], happy: ['open', 'up', 'grin', 1], joy: ['happy', 'up', 'grin', 1], love: ['heart', 'up', 'grin', 2],
    content: ['closed', 'normal', 'cat', 1], sad: ['open', 'sad', 'frown', 0], cry: ['teary', 'sad', 'wavy', 1], angry: ['angry', 'angry', 'shout', 1],
    pout: ['open', 'angry', 'pout', 2], surprised: ['wide', 'up', 'open', 0], sleepy: ['half', 'flat', 'tiny', 0], sleep: ['closed', 'flat', 'tiny', 0],
    smug: ['half', 'normal', 'smug', 1], shy: ['open', 'sad', 'wavy', 2], eat: ['happy', 'up', 'eat', 1], wink: ['wink', 'up', 'grin', 1], excited: ['star', 'up', 'grin', 1], hungry: ['open', 'sad', 'open', 0],
  };

  // ------------------------------------------------------------------ Körper & Kleidung
  const BODY = 'M 274 450 L 274 536 C 236 546 194 558 166 586 C 140 612 128 680 118 830 L 482 830 C 472 680 460 612 434 586 C 406 558 364 546 326 536 L 326 450 Z';
  const TOP = 'M 274 540 C 238 548 198 558 172 582 C 152 600 144 640 140 680 L 132 830 L 468 830 L 460 680 C 456 640 448 600 428 582 C 402 558 362 548 326 540 C 316 554 284 554 274 540 Z';
  const SLEEVE_L = 'M 176 578 C 150 590 136 626 132 680 C 128 730 124 780 122 830 L 184 830 C 184 780 188 730 194 690 C 198 650 196 610 190 584 Z';
  const PUFF_L = 'M 182 576 C 146 584 124 622 124 670 C 142 692 176 698 200 684 C 204 640 200 604 192 580 Z';
  const ARM_L = 'M 132 660 C 126 720 122 780 120 830 L 182 830 C 182 780 186 720 194 676 Z';
  const fold = (d, col, op = .5) => F(d, col, null, 0, `opacity="${op}"`);
  const OUTFITS = {
    casual: { name: 'Lieblingskleid', draw: (g, o) => {
      const c = o.top, dark = o.dark, ln = dk(dark, .45);
      return F(ARM_L, SKIN, SKINL, 2.2) + F(mirror(ARM_L), SKIN, SKINL, 2.2) +
        F(TOP, `url(#cl${g.uid})`, ln) +
        fold('M 236 640 C 250 700 246 770 236 830 L 214 830 C 226 770 230 700 224 650 Z', dark) + fold(mirror('M 236 640 C 250 700 246 770 236 830 L 214 830 C 226 770 230 700 224 650 Z'), dark) +
        fold('M 238 700 C 270 716 330 716 362 700 C 340 724 260 724 238 700 Z', dark, .55) +
        F(PUFF_L, c, ln) + F(mirror(PUFF_L), c, ln) + S('M 136 676 C 156 690 180 692 200 684', o.acc, 5) + S(mirror('M 136 676 C 156 690 180 692 200 684'), o.acc, 5) +
        S('M 150 610 C 160 630 170 650 176 676', dark, 2, 'opacity=".7"') + S(mirror('M 150 610 C 160 630 170 650 176 676'), dark, 2, 'opacity=".7"') +
        F('M 300 556 C 280 562 250 566 228 560 C 230 590 266 604 300 588 Z', '#ffffff', ln) + F(mirror('M 300 556 C 280 562 250 566 228 560 C 230 590 266 604 300 588 Z'), '#ffffff', ln) +
        bow(300, 606, o.acc, 1) + [650, 696, 742].map(y => `<circle cx="300" cy="${y}" r="6" fill="${lt(o.acc, .3)}" stroke="${dk(o.acc, .3)}" stroke-width="1.8"/>`).join('') +
        S('M 140 790 C 220 806 380 806 460 790', o.acc, 8) + S('M 140 790 C 220 806 380 806 460 790', lt(o.acc, .4), 2, 'opacity=".7"');
    } },
    school: { name: 'Schuluniform', colors: (g) => ({ top: '#ffffff', dark: '#d8deea', acc: g.accent || '#d7263d' }), draw: (g, o) => {
      const navy = '#2c3866', ln = '#55627f';
      return F(SLEEVE_L, '#ffffff', ln) + F(mirror(SLEEVE_L), '#ffffff', ln) + F(TOP, `url(#cl${g.uid})`, ln) +
        fold('M 196 600 C 206 680 204 760 196 830 L 176 830 C 186 760 188 680 182 610 Z', o.dark) + fold(mirror('M 196 600 C 206 680 204 760 196 830 L 176 830 C 186 760 188 680 182 610 Z'), o.dark) +
        S('M 150 640 C 158 680 162 720 162 760', o.dark, 2) + S(mirror('M 150 640 C 158 680 162 720 162 760'), o.dark, 2) +
        F('M 274 540 L 300 704 L 326 540 C 364 548 404 564 434 594 L 300 724 L 166 594 C 196 564 236 548 274 540 Z', navy, dk(navy, .4)) +
        S('M 186 596 L 300 708 L 414 596', '#ffffff', 3) + S('M 202 592 L 300 690 L 398 592', '#ffffff', 2) +
        F('M 286 560 L 300 650 L 314 560 Z', '#ffffff', ln, 1.6) +
        F('M 300 690 C 270 670 236 672 228 690 C 236 712 270 712 300 696 Z', o.acc, dk(o.acc, .4)) + F(mirror('M 300 690 C 270 670 236 672 228 690 C 236 712 270 712 300 696 Z'), o.acc, dk(o.acc, .4)) +
        F('M 288 700 L 270 790 L 292 772 L 300 800 L 308 772 L 330 790 L 312 700 Z', o.acc, dk(o.acc, .4)) + `<ellipse cx="300" cy="694" rx="14" ry="12" fill="${o.acc}" stroke="${dk(o.acc, .4)}" stroke-width="2.2"/>`;
    } },
    hoodie: { name: 'Kuschel-Hoodie', draw: (g, o) => {
      const ln = dk(o.dark, .45);
      return F('M 274 544 C 230 552 184 564 158 596 C 136 626 128 690 120 830 L 480 830 C 472 690 464 626 442 596 C 416 564 370 552 326 544 C 314 560 286 560 274 544 Z', `url(#cl${g.uid})`, ln) +
        fold('M 186 600 C 200 680 196 760 186 830 L 160 830 C 172 760 174 680 170 610 Z', o.dark) + fold(mirror('M 186 600 C 200 680 196 760 186 830 L 160 830 C 172 760 174 680 170 610 Z'), o.dark) +
        S('M 196 610 C 212 700 210 770 204 830', ln, 2, 'opacity=".6"') + S(mirror('M 196 610 C 212 700 210 770 204 830'), ln, 2, 'opacity=".6"') +
        `<path fill-rule="evenodd" d="M 212 562 C 216 522 258 504 300 504 C 342 504 384 522 388 562 C 362 588 238 588 212 562 Z M 268 534 C 278 522 322 522 332 534 C 326 554 274 554 268 534 Z" fill="${o.dark}" stroke="${ln}" stroke-width="2.4"/>` + S('M 226 556 C 250 540 350 540 374 556', lt(o.top, .2), 3, 'opacity=".7"') +
        S('M 284 566 C 282 600 280 640 278 676', '#ffffff', 4) + S('M 316 566 C 318 600 320 640 322 676', '#ffffff', 4) +
        `<rect x="272" y="672" width="12" height="18" rx="4" fill="${o.acc}"/><rect x="316" y="672" width="12" height="18" rx="4" fill="${o.acc}"/>` +
        F('M 220 744 C 260 734 340 734 380 744 L 392 830 L 208 830 Z', dk(o.top, .08), ln) + S('M 236 750 C 236 780 232 810 228 830 M 364 750 C 364 780 368 810 372 830', ln, 2, 'opacity=".5"') +
        star(368, 640, 20, o.acc);
    } },
    gothic: { name: 'Gothic-Kleid', colors: (g) => ({ top: '#2b2236', dark: '#15101c', acc: g.accent && g.accent !== '#ec4f8c' ? g.accent : '#a66ce6' }), draw: (g, o) => {
      const ln = '#5a4a70';
      const lace = (y0, x0, x1, n) => { let d = `M ${x0} ${y0}`; const st = (x1 - x0) / n; for (let i = 0; i < n; i++) d += ` Q ${x0 + st * (i + .5)} ${y0 + 14} ${x0 + st * (i + 1)} ${y0}`; return F(d + ' Z', '#f6f0fb', '#cfc3dc', 1.6); };
      return F(SLEEVE_L, o.top, ln) + F(mirror(SLEEVE_L), o.top, ln) + F(PUFF_L, o.top, ln) + F(mirror(PUFF_L), o.top, ln) +
        S('M 146 616 C 160 640 170 660 176 684', '#4a3d5e', 2) + S(mirror('M 146 616 C 160 640 170 660 176 684'), '#4a3d5e', 2) +
        F(TOP, `url(#cl${g.uid})`, ln) + fold('M 236 620 C 250 700 246 770 236 830 L 214 830 C 226 770 230 700 224 630 Z', '#000', .35) + fold(mirror('M 236 620 C 250 700 246 770 236 830 L 214 830 C 226 770 230 700 224 630 Z'), '#000', .35) +
        F('M 262 600 L 338 600 L 330 830 L 270 830 Z', '#3a2f49', ln, 1.8) + [620, 660, 700, 740, 780].map(y => S(`M 276 ${y} L 324 ${y + 26} M 324 ${y} L 276 ${y + 26}`, o.acc, 2.4)).join('') +
        lace(548, 230, 370, 10) + `<path d="M 274 490 C 290 498 310 498 326 490 L 326 502 C 310 510 290 510 274 502 Z" fill="${o.acc}" stroke="${dk(o.acc, .4)}" stroke-width="2"/><path d="M 300 504 L 292 514 L 300 526 L 308 514 Z" fill="#ff4f93" stroke="#7a1d45" stroke-width="1.6"/>` + bow(300, 560, o.acc, .9);
    } },
    pajama: { name: 'Pyjama', colors: () => ({ top: '#c7dcff', dark: '#93b3e8', acc: '#f9a8d4' }), draw: (g, o) => {
      const ln = dk(o.dark, .4);
      return F(SLEEVE_L, o.top, ln) + F(mirror(SLEEVE_L), o.top, ln) + F(TOP, `url(#cl${g.uid})`, ln) +
        F('M 274 540 L 240 552 L 262 604 L 300 572 Z', lt(o.top, .4), ln) + F(mirror('M 274 540 L 240 552 L 262 604 L 300 572 Z'), lt(o.top, .4), ln) +
        S('M 300 580 L 300 830', ln, 2) + [620, 680, 740, 800].map(y => `<circle cx="300" cy="${y}" r="6" fill="#fff" stroke="${ln}" stroke-width="1.6"/>`).join('') +
        [[220, 640], [380, 700], [240, 760], [370, 620], [200, 720], [400, 780], [340, 660], [260, 690]].map(([x, y]) => star(x, y, 10, '#fff7c2', ln, 1.2)).join('');
    } },
    yukata: { name: 'Sommer-Yukata', colors: (g) => ({ top: '#2b3a68', dark: '#1a2445', acc: g.accent }), draw: (g, o) => {
      const ln = '#141c38';
      return F(SLEEVE_L, o.top, ln) + F(mirror(SLEEVE_L), o.top, ln) + F(TOP, o.top, ln) +
        F('M 274 540 L 252 548 L 352 760 L 380 760 Z', '#ffffff', '#c9ced8', 1.6) + F('M 326 540 L 348 548 L 300 650 L 290 630 Z', '#ffffff', '#c9ced8', 1.6) +
        [[200, 640], [404, 610], [230, 720], [176, 780], [410, 700], [380, 800]].map(([x, y]) => flower(x, y, 16, '#ffb3cf', '#fff3b0')).join('') +
        F('M 132 752 C 220 766 380 766 468 752 L 470 830 L 130 830 Z', o.acc, dk(o.acc, .4)) + S('M 132 770 C 220 784 380 784 468 770', lt(o.acc, .4), 3) + bow(392, 780, lt(o.acc, .2), 1);
    } },
    summer: { name: 'Sommerkleid', colors: () => ({ top: '#ffffff', dark: '#e3e8f2', acc: '#38bdf8' }), draw: (g, o) => {
      const ln = '#b9c3d6';
      return F(ARM_L, SKIN, SKINL, 2.2) + F(mirror(ARM_L), SKIN, SKINL, 2.2) +
        S('M 232 640 L 222 560', '#9aa6bd', 4) + S('M 368 640 L 378 560', '#9aa6bd', 4) +
        F('M 196 650 C 230 628 270 640 300 650 C 330 640 370 628 404 650 C 420 700 440 760 452 830 L 148 830 C 160 760 180 700 196 650 Z', `url(#cl${g.uid})`, ln) +
        S('M 196 650 C 230 628 270 640 300 650 C 330 640 370 628 404 650', '#ffffff', 5, 'stroke-dasharray="2 7"') +
        S('M 186 700 C 240 716 360 716 414 700', o.acc, 8) + bow(300, 708, o.acc, .9) + fold('M 240 730 C 250 780 248 810 244 830 L 226 830 C 232 800 234 770 228 736 Z', o.dark, .7) + fold(mirror('M 240 730 C 250 780 248 810 244 830 L 226 830 C 232 800 234 770 228 736 Z'), o.dark, .7);
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

  // ------------------------------------------------------------------ Zusammensetzen
  A.girl = (id, o = {}) => {
    const g = { id, uid: id + (++uid), ...A.GIRLS[id] };
    const ex = A.EXPR[o.expr] || A.EXPR.neutral;
    const outfitKey = o.outfit || g.outfit;
    const OF = OUTFITS[outfitKey] || OUTFITS.casual;
    const oc = OF.colors ? OF.colors(g) : { top: g.dress, dark: g.dressDark, acc: g.accent };
    const accs = [g.acc, ...(o.acc || [])].filter(Boolean);
    const hl = lt(g.hair, .55), hs = dk(g.hairDark, .12), hLine = dk(g.hairDark, .5);
    const hb = `url(#hb${g.uid})`, hf = `url(#hf${g.uid})`;
    const bangsPts = BANGS[g.bangs] || BANGS.soft;
    const bangsD = HAIRTOP + edge(bangsPts) + ' Z';
    let s = `<defs>
      <linearGradient id="hb${g.uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lt(g.hair, .12)}"/><stop offset=".45" stop-color="${g.hair}"/><stop offset="1" stop-color="${g.hairDark}"/></linearGradient>
      <linearGradient id="hf${g.uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lt(g.hair, .2)}"/><stop offset=".55" stop-color="${g.hair}"/><stop offset="1" stop-color="${mix(g.hair, g.hairDark, .55)}"/></linearGradient>
      <linearGradient id="ir${g.uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${dk(g.eyesDark, .2)}"/><stop offset=".45" stop-color="${g.eyes}"/><stop offset="1" stop-color="${lt(g.eyes, .55)}"/></linearGradient>
      <linearGradient id="ew${g.uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9dff2"/><stop offset=".35" stop-color="#ffffff"/></linearGradient>
      <linearGradient id="sk${g.uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${SKIN}"/><stop offset="1" stop-color="#ffe6dc"/></linearGradient>
      <linearGradient id="cl${g.uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lt(oc.top, .08)}"/><stop offset="1" stop-color="${mix(oc.top, oc.dark, .5)}"/></linearGradient>
      <radialGradient id="bl${g.uid}"><stop offset="0" stop-color="#ff8fab" stop-opacity=".75"/><stop offset="1" stop-color="#ff8fab" stop-opacity="0"/></radialGradient>
      <clipPath id="fc${g.uid}"><path d="${FACE}"/></clipPath>
      <clipPath id="bk${g.uid}"><path d="${BACK[g.back] || BACK.long}"/></clipPath>
      <clipPath id="bg${g.uid}"><path d="${bangsD}"/></clipPath>
      ${['L', 'R'].map(sd => { const cx = sd === 'L' ? EYE.L : EYE.R, y = EYE.y; return `<clipPath id="ec${g.uid}${sd}"><path d="M ${cx - 36} ${y - 12} C ${cx - 26} ${y - 34} ${cx + 22} ${y - 38} ${cx + 36} ${y - 16} C ${cx + 38} ${y + 10} ${cx + 26} ${y + 36} ${cx} ${y + 38} C ${cx - 24} ${y + 36} ${cx - 38} ${y + 12} ${cx - 36} ${y - 12} Z"/></clipPath>`; }).join('')}
    </defs>`;
    // ---- Hinterkopf / Haare hinten
    s += `<g class="cg-back">`;
    if (g.buns) for (const bx of [196, 404]) s += `<circle cx="${bx}" cy="126" r="58" fill="${hb}" stroke="${hLine}" stroke-width="2.4"/>` + S(`M ${bx - 40} 110 C ${bx - 20} 84 ${bx + 20} 80 ${bx + 40} 104`, hl, 6, 'opacity=".7"') + S(`M ${bx - 30} 150 C ${bx - 10} 166 ${bx + 16} 166 ${bx + 34} 146`, hs, 2.4, 'opacity=".6"');
    s += F(BACK[g.back] || BACK.long, hb, hLine);
    s += `<g clip-path="url(#bk${g.uid})"><ellipse cx="300" cy="380" rx="150" ry="210" fill="${hs}" opacity=".55"/>` +
      S('M 150 420 C 140 520 146 640 150 830', hs, 3, 'opacity=".5"') + S('M 450 420 C 460 520 454 640 450 830', hs, 3, 'opacity=".5"') +
      S('M 128 520 C 122 620 128 720 124 830', hl, 5, 'opacity=".35"') + S('M 472 520 C 478 620 472 720 476 830', hl, 5, 'opacity=".35"') + `</g>`;
    if (g.tail === 'side') s += F(TAIL, hb, hLine) + S('M 470 220 C 520 260 528 360 512 470 C 504 540 496 600 488 680', hl, 6, 'opacity=".5"') + S('M 450 250 C 488 300 494 400 484 500 C 478 560 474 620 470 690', hs, 2.6, 'opacity=".55"');
    s += `</g>`;
    // ---- Körper
    s += `<g class="cg-body">`;
    s += F(BODY, `url(#sk${g.uid})`, SKINL, 2.2);
    s += F('M 274 452 C 284 470 316 470 326 452 L 326 500 C 312 512 288 512 274 500 Z', SKIN2) + S('M 268 540 C 284 548 316 548 332 540', SKIN3, 2, 'opacity=".7"') + S('M 236 560 C 256 566 270 566 282 562 M 364 560 C 344 566 330 566 318 562', SKIN3, 2, 'opacity=".55"');
    s += OF.draw(g, oc);
    s += `</g>`;
    // ---- Kopf
    s += `<g class="cg-head">`;
    s += F(FACE, `url(#sk${g.uid})`, SKINL, 2.4);
    // Schatten des Ponys auf der Stirn
    s += `<g clip-path="url(#fc${g.uid})"><path d="${HAIRTOP}${edge(off(bangsPts, 3, 16))} Z" fill="${SKIN2}"/><path d="M 186 330 C 196 400 230 450 270 474 L 186 474 Z" fill="${SKIN2}" opacity=".5"/><path d="M 414 330 C 404 400 370 450 330 474 L 414 474 Z" fill="${SKIN2}" opacity=".5"/></g>`;
    const [eK, bK, mK, blush] = ex;
    s += `<g class="cg-face">`;
    s += `<ellipse cx="226" cy="400" rx="${blush ? 40 : 30}" ry="${blush ? 20 : 15}" fill="url(#bl${g.uid})" opacity="${blush > 1 ? 1 : blush ? .8 : .35}"/><ellipse cx="374" cy="400" rx="${blush ? 40 : 30}" ry="${blush ? 20 : 15}" fill="url(#bl${g.uid})" opacity="${blush > 1 ? 1 : blush ? .8 : .35}"/>`;
    if (blush > 1) s += S('M 204 404 L 212 390 M 220 406 L 228 392 M 236 406 L 244 392 M 356 406 L 364 392 M 372 406 L 380 392 M 388 404 L 396 390', '#e56b8a', 2.2);
    const eyeG = (cx, side, kind) => `<g class="cg-eye">${eye(cx, side, kind, g)}</g>`;
    s += eyeG(EYE.L, 'L', eK === 'wink' ? 'open' : eK) + eyeG(EYE.R, 'R', eK === 'wink' ? 'closed' : eK);
    s += S('M 298 384 C 301 388 303 391 300 394', '#d89784', 2.4) + `<circle cx="304" cy="382" r="1.8" fill="#fff" opacity=".9"/>`;
    s += mouth(mK);
    s += `</g>`;
    // ---- Haare vorne
    const locks = LOCKS[g.locks] || LOCKS.long;
    s += F(locks, hf, hLine) + F(mirror(locks), hf, hLine);
    const ll = g.locks === 'long' ? 'M 190 300 C 182 380 184 470 190 560' : 'M 190 300 C 184 360 186 420 190 470';
    s += S(ll, hs, 2.2, 'opacity=".55"') + S(mirror(ll), hs, 2.2, 'opacity=".55"');
    s += `<path d="${HAIRTOP}${edge(off(bangsPts, 9, 7).map(([x, y], i, arr) => (i === 0 || i === arr.length - 1) ? [x - 9, y - 7] : [x, y]))} Z" fill="${mix(g.hair, g.hairDark, .75)}" stroke="${hLine}" stroke-width="2"/>`;
    s += F(bangsD, hf, hLine);
    s += `<g clip-path="url(#bg${g.uid})">` +
      `<path d="M 200 168 C 250 140 350 140 400 168 L 396 186${edge([[396, 186], [384, 176], [372, 196], [360, 178], [346, 200], [332, 180], [318, 202], [304, 182], [290, 202], [276, 182], [262, 200], [248, 180], [234, 196], [220, 178], [206, 188]])} Z" fill="${hl}" opacity=".5"/>` +
      S('M 226 152 C 262 136 338 136 374 152', '#ffffff', 3, 'opacity=".45"') +
      bangsPts.filter((_, i) => i % 2 === 1).map(([x, y]) => S(`M ${300 + (x - 300) * .35} 118 C ${300 + (x - 300) * .7} 150 ${x} ${y - 70} ${x} ${y - 8}`, hs, 2.2, 'opacity=".5"')).join('') +
      `</g>`;
    if (g.ahoge) s += F('M 296 90 C 280 40 330 20 346 46 C 324 38 312 54 308 90 Z', hf, hLine);
    for (const a of accs) if (ACC[a] && !ACC[a].face) s += `<g class="cg-acc">${ACC[a].draw(g)}</g>`;
    s += brows(bK, g);
    for (const a of accs) if (ACC[a] && ACC[a].face) s += `<g class="cg-acc">${ACC[a].draw(g)}</g>`;
    s += `</g>`;
    return `<svg class="cg-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
  };
  // Nur der Kopf (für Hinweise, Home-Karte, Spiele)
  A.FACE_BOX = '120 70 360 392';
  A.BODY_BOX = '110 470 380 340';
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
