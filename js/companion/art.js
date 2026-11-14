/* Spirit Notes – Begleiterin: eigene, original gezeichnete Chibi-Mädchen (SVG) + Zimmer */
(() => {
  const A = SN.compArt = {};
  const LINE = '#4a2832', SKIN = '#ffe7da', SKIN_SH = '#f6c7b2', MOUTH = '#b8364f';
  // Pfad an der Mittelachse (x = 150) spiegeln – nur absolute M/L/Q/C/Z
  const mirror = (d) => d.replace(/([MLQCZ])([^MLQCZ]*)/g, (_, c, args) => {
    const n = args.trim().split(/[\s,]+/).filter(Boolean).map(Number);
    return c + ' ' + n.map((v, i) => i % 2 === 0 ? +(300 - v).toFixed(1) : v).join(' ') + ' ';
  });
  const P = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" stroke="${LINE}" ${/stroke-width/.test(extra) ? '' : 'stroke-width="2.2"'} stroke-linejoin="round" ${extra}/>`;
  const S = (d, w = 2.4, col = LINE, extra = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  const both = (d, fill, extra) => P(d, fill, extra) + P(mirror(d), fill, extra);

  // ------------------------------------------------------------------ Mädchen (alle frei erfunden)
  A.GIRLS = {
    hana: { name: 'Hana', type: 'Sanft & lieb', desc: 'Ein warmherziges Blumenmädchen, das sich über jede Kleinigkeit freut und dich immer aufmuntert.', hair: '#f6a9c6', hairDark: '#d9789f', eyes: '#38a873', eyesDark: '#1d6b48', back: 'wavy', bangs: 'soft', locks: 'long', acc: 'flower', outfit: 'casual', dress: '#fff1f6', dressDark: '#f3c6d8', accent: '#ec4f8c', likes: 'parfait', dislikes: 'curry', gift: 'flowers' },
    akane: { name: 'Akane', type: 'Tsundere', desc: 'Frech, stolz und schnell rot im Gesicht – aber insgeheim freut sie sich riesig, dass du da bist.', hair: '#f0743e', hairDark: '#c4502a', eyes: '#e8a42a', eyesDark: '#9a5d0e', back: 'bob', tail: 'side', bangs: 'swept', locks: 'short', acc: 'ribbon', outfit: 'school', dress: '#ffffff', dressDark: '#dfe3ea', accent: '#d7263d', likes: 'taiyaki', dislikes: 'natto', gift: 'plush' },
    sora: { name: 'Sora', type: 'Energiebündel', desc: 'Laut, fröhlich und immer in Bewegung. Mit ihr wird es nie langweilig!', hair: '#58b6ff', hairDark: '#2f84d1', eyes: '#ff9f1c', eyesDark: '#b8640a', back: 'bob', bangs: 'spiky', locks: 'short', ahoge: true, acc: 'star', outfit: 'hoodie', dress: '#ffd84d', dressDark: '#e9b924', accent: '#ff7a45', likes: 'ramen', dislikes: 'salad', gift: 'game' },
    yuki: { name: 'Yuki', type: 'Kühl & ruhig', desc: 'Sagt nicht viel und wirkt kühl – doch wer sie kennt, merkt, wie sanft sie eigentlich ist.', hair: '#e6edf7', hairDark: '#a9b9d1', eyes: '#4fb0e6', eyesDark: '#1f6f9e', back: 'long', bangs: 'straight', locks: 'long', acc: 'snow', outfit: 'casual', dress: '#dbe9fb', dressDark: '#a9c3e6', accent: '#2f4c8a', likes: 'mochi', dislikes: 'spicy', gift: 'book' },
    mira: { name: 'Mira', type: 'Dramatische Gothic-Prinzessin', desc: 'Nennt sich „Herrscherin der Mitternacht“, liebt große Auftritte – und heimlich Kuscheltiere.', hair: '#7553c2', hairDark: '#4c3290', eyes: '#e6418c', eyesDark: '#9a1a55', back: 'long', buns: true, bangs: 'blunt', locks: 'hime', acc: 'bat', outfit: 'gothic', dress: '#2a2233', dressDark: '#16111d', accent: '#a46be0', likes: 'choco', dislikes: 'garlic', gift: 'candle' },
  };

  // ------------------------------------------------------------------ Haare hinten
  const BACK = {
    long: 'M 74 150 C 60 232 64 300 82 356 Q 150 376 218 356 C 236 300 240 232 226 150 C 222 92 190 60 150 60 C 110 60 78 92 74 150 Z',
    wavy: 'M 74 150 C 58 220 70 262 62 300 C 76 312 70 336 86 352 C 110 362 124 350 150 360 C 176 350 190 362 214 352 C 230 336 224 312 238 300 C 230 262 242 220 226 150 C 222 92 190 60 150 60 C 110 60 78 92 74 150 Z',
    bob: 'M 70 150 C 62 198 70 236 90 252 Q 150 266 210 252 C 230 236 238 198 230 150 C 224 92 192 60 150 60 C 108 60 76 92 70 150 Z',
  };
  const TAIL_SIDE = 'M 206 104 C 258 104 276 168 266 230 C 260 276 244 312 222 334 C 230 296 236 252 226 210 C 220 180 210 160 196 140 Z';
  // ------------------------------------------------------------------ Pony / Seitensträhnen
  const TOP = 'M 76 160 C 68 96 104 62 150 62 C 196 62 232 96 224 160';
  const BANGS = {
    soft: TOP + ' Q 218 134 204 118 Q 204 142 192 154 Q 188 128 174 112 Q 168 138 152 150 Q 150 124 138 110 Q 130 138 114 150 Q 114 126 104 116 Q 90 130 86 156 Z',
    straight: TOP + ' L 216 154 L 210 122 L 198 148 L 188 116 L 176 146 L 164 114 L 150 146 L 136 114 L 124 146 L 112 116 L 102 148 L 90 122 L 84 156 Z',
    spiky: TOP + ' L 214 148 L 206 112 L 192 140 L 182 106 L 166 138 L 152 102 L 138 138 L 122 108 L 110 142 L 98 114 L 86 154 Z',
    swept: TOP + ' Q 216 132 202 114 Q 196 136 184 146 Q 182 122 168 110 Q 146 134 112 154 Q 128 132 134 112 Q 114 128 98 150 Q 98 130 104 116 Q 90 128 86 156 Z',
    blunt: TOP + ' L 218 156 L 216 134 Q 150 138 84 134 L 82 156 Z',
  };
  const LOCKS = {
    long: 'M 80 132 C 70 186 72 236 84 272 L 100 262 C 92 222 92 182 98 140 Z',
    short: 'M 80 136 C 72 176 76 212 90 236 L 102 226 C 94 196 94 168 98 142 Z',
    hime: 'M 80 136 C 78 180 79 212 82 232 Q 93 237 104 232 C 101 200 100 170 102 140 Z',
  };

  // ------------------------------------------------------------------ Kleidung
  function body(g, outfit) {
    const O = OUTFITS[outfit] || OUTFITS.casual;
    const c = O.colors ? O.colors(g) : { top: g.dress, dark: g.dressDark, acc: g.accent };
    let s = '';
    // Beine & Schuhe
    const legC = O.legs || '#ffffff';
    s += P('M 128 330 L 128 380 Q 136 386 144 380 L 144 330 Z', legC) + P(mirror('M 128 330 L 128 380 Q 136 386 144 380 L 144 330 Z'), legC);
    s += P('M 122 384 Q 122 374 136 374 Q 148 374 148 386 Q 136 392 122 384 Z', O.shoes || '#5b3a46') + P(mirror('M 122 384 Q 122 374 136 374 Q 148 374 148 386 Q 136 392 122 384 Z'), O.shoes || '#5b3a46');
    // Arme (hinter dem Oberkörper)
    const armC = O.arms === 'skin' ? SKIN : c.top;
    s += P('M 112 252 C 98 262 92 290 96 318 Q 104 322 112 318 C 112 296 116 276 124 262 Z', armC) + P(mirror('M 112 252 C 98 262 92 290 96 318 Q 104 322 112 318 C 112 296 116 276 124 262 Z'), armC);
    // Hals
    s += `<rect x="139" y="226" width="22" height="28" rx="6" fill="${SKIN}" stroke="${LINE}" stroke-width="2"/><path d="M 140 236 Q 150 244 160 236 L 160 230 L 140 230 Z" fill="${SKIN_SH}"/>`;
    s += O.draw(g, c);
    s += `<circle cx="103" cy="322" r="8" fill="${SKIN}" stroke="${LINE}" stroke-width="2"/><circle cx="197" cy="322" r="8" fill="${SKIN}" stroke="${LINE}" stroke-width="2"/>`;
    return s;
  }
  const skirt = (fill, len = 336) => P(`M 116 286 C 106 304 98 322 94 ${len} Q 150 ${len + 12} 206 ${len} C 202 322 194 304 184 286 Z`, fill);
  const torso = (fill) => P('M 116 250 Q 150 240 184 250 C 190 262 190 278 184 292 Q 150 298 116 292 C 110 278 110 262 116 250 Z', fill);
  const OUTFITS = {
    casual: { name: 'Lieblingskleid', draw: (g, c) => skirt(c.top) + S('M 120 300 Q 116 318 112 332 M 150 300 L 150 344 M 180 300 Q 184 318 188 332', 1.6, c.dark) + torso(c.top) +
      P('M 136 248 Q 128 262 118 258 Q 122 248 138 244 Z', '#ffffff') + P(mirror('M 136 248 Q 128 262 118 258 Q 122 248 138 244 Z'), '#ffffff') +
      P('M 150 262 L 138 254 L 138 270 Z', c.acc) + P('M 150 262 L 162 254 L 162 270 Z', c.acc) + `<circle cx="150" cy="262" r="4" fill="${c.acc}" stroke="${LINE}" stroke-width="1.6"/>` + S('M 118 290 Q 150 296 182 290', 3, c.acc) },
    school: { name: 'Schuluniform', legs: '#2b2f45', shoes: '#3a2a22', colors: (g) => ({ top: '#ffffff', dark: '#dfe3ea', acc: g.accent || '#d7263d' }), draw: (g, c) =>
      skirt('#2f3a66') + S('M 112 300 L 104 334 M 128 300 L 124 342 M 150 300 L 150 346 M 172 300 L 176 342 M 188 300 L 196 334', 1.6, '#1d2648') + torso('#ffffff') +
      P('M 120 248 Q 150 242 180 248 L 162 276 L 150 286 L 138 276 Z', '#2f3a66') + S('M 126 252 L 150 280 L 174 252', 1.8, '#ffffff') +
      P('M 150 270 L 136 262 L 138 280 Z', c.acc) + P('M 150 270 L 164 262 L 162 280 Z', c.acc) + P('M 146 272 L 140 296 L 150 290 L 160 296 L 154 272 Z', c.acc) },
    hoodie: { name: 'Kuschel-Hoodie', legs: '#ffffff', shoes: '#ff7a45', draw: (g, c) =>
      P('M 112 254 Q 150 236 188 254 C 198 278 200 300 196 322 Q 150 334 104 322 C 100 300 102 278 112 254 Z', c.top) +
      P('M 124 250 Q 150 262 176 250 Q 168 240 150 240 Q 132 240 124 250 Z', c.dark) + S('M 140 258 L 138 284 M 160 258 L 162 284', 2, '#ffffff') +
      `<circle cx="138" cy="286" r="2.5" fill="#fff"/><circle cx="162" cy="286" r="2.5" fill="#fff"/>` + P('M 124 296 L 176 296 L 172 314 L 128 314 Z', c.dark) },
    gothic: { name: 'Gothic-Kleid', legs: '#1b1622', shoes: '#120d18', colors: (g) => ({ top: '#2a2233', dark: '#16111d', acc: g.accent && g.accent !== '#ec4f8c' ? g.accent : '#a46be0' }), draw: (g, c) =>
      P('M 116 286 C 104 304 96 322 90 338 L 96 344 L 104 338 L 112 346 L 122 340 L 132 348 L 142 342 L 150 350 L 158 342 L 168 348 L 178 340 L 188 346 L 196 338 L 204 344 L 210 338 C 204 322 196 304 184 286 Z', '#f4eef8') +
      skirt(c.top, 334) + S('M 124 300 L 116 332 M 150 300 L 150 342 M 176 300 L 184 332', 1.6, '#4a3b5c') + torso(c.top) +
      S('M 140 256 L 160 266 M 160 256 L 140 266 M 140 268 L 160 278 M 160 268 L 140 278', 1.8, c.acc) +
      P('M 150 252 L 134 244 L 136 260 Z', c.acc) + P('M 150 252 L 166 244 L 164 260 Z', c.acc) + `<circle cx="150" cy="252" r="4" fill="${c.acc}" stroke="${LINE}" stroke-width="1.6"/>` },
    pajama: { name: 'Pyjama', legs: '#bfd7ff', shoes: '#f9a8d4', colors: () => ({ top: '#bfd7ff', dark: '#93b5ea', acc: '#f9a8d4' }), draw: (g, c) =>
      P('M 112 254 Q 150 240 188 254 C 196 278 196 300 192 316 Q 150 324 108 316 C 104 300 104 278 112 254 Z', c.top) +
      S('M 150 250 L 150 318', 1.6, c.dark) + [262, 280, 298].map(y => `<circle cx="150" cy="${y}" r="2.6" fill="#fff" stroke="${LINE}" stroke-width="1.2"/>`).join('') +
      [[124, 270], [176, 292], [128, 304], [172, 262], [138, 290], [164, 278]].map(([x, y]) => `<text x="${x}" y="${y}" font-size="9" fill="#fff" text-anchor="middle">★</text>`).join('') },
    yukata: { name: 'Sommer-Yukata', legs: SKIN, shoes: '#8b5a2b', colors: (g) => ({ top: '#26355e', dark: '#17213f', acc: g.accent }), draw: (g, c) =>
      P('M 114 252 Q 150 240 186 252 C 194 290 200 330 202 366 Q 150 376 98 366 C 100 330 106 290 114 252 Z', c.top) +
      P('M 136 246 L 162 296 L 150 300 L 128 250 Z', '#ffffff') + P('M 164 246 L 150 278 L 144 268 L 156 244 Z', '#ffffff') +
      [[122, 320], [178, 334], [140, 350], [170, 306], [118, 352], [184, 280]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#f9a8d4" stroke="#fff" stroke-width="1.4"/>`).join('') +
      P('M 112 290 Q 150 298 188 290 L 190 310 Q 150 318 110 310 Z', c.acc) + P('M 168 300 L 196 292 L 192 316 Z', c.acc) },
    summer: { name: 'Sommerkleid', arms: 'skin', legs: SKIN, shoes: '#c08457', colors: (g) => ({ top: '#ffffff', dark: '#e6e9f0', acc: '#38bdf8' }), draw: (g, c) =>
      skirt('#ffffff', 340) + S('M 120 302 Q 114 320 110 336 M 150 300 L 150 348 M 180 302 Q 186 320 190 336', 1.4, '#cfd6e2') +
      P('M 120 258 Q 150 252 180 258 C 186 270 186 282 182 292 Q 150 298 118 292 C 114 282 114 270 120 258 Z', '#ffffff') +
      S('M 124 258 L 128 244 M 176 258 L 172 244', 2.4, LINE) + S('M 118 290 Q 150 298 182 290', 4, c.acc) + P('M 150 292 L 140 304 L 150 300 L 160 304 Z', c.acc) },
  };
  A.OUTFITS = Object.fromEntries(Object.entries(OUTFITS).map(([k, v]) => [k, v.name]));

  // ------------------------------------------------------------------ Gesicht
  const EYE = { L: 117, R: 183, y: 172 };
  function eye(cx, side, kind, g) {
    const y = EYE.y, out = side === 'L' ? -1 : 1; // äußere Seite
    const lash = `M ${cx - 17} ${y - 10} Q ${cx} ${y - 25} ${cx + 17} ${y - 11}`;
    const flick = side === 'L' ? `M ${cx - 16} ${y - 10} L ${cx - 22} ${y - 13}` : `M ${cx + 16} ${y - 10} L ${cx + 22} ${y - 13}`;
    const grad = `url(#iris-${g.id})`;
    const open = (rx = 12.5, ry = 17, pupil = 1, hearts = false) =>
      `<ellipse cx="${cx}" cy="${y + 1}" rx="16" ry="19" fill="#fff"/>` +
      (hearts ? `<path d="M ${cx} ${y + 12} C ${cx - 18} ${y} ${cx - 10} ${y - 14} ${cx} ${y - 5} C ${cx + 10} ${y - 14} ${cx + 18} ${y} ${cx} ${y + 12} Z" fill="#ff4d8d" stroke="${LINE}" stroke-width="1.4"/>` :
        `<ellipse cx="${cx}" cy="${y + 2}" rx="${rx}" ry="${ry}" fill="${grad}"/><ellipse cx="${cx}" cy="${y + 4}" rx="${6 * pupil}" ry="${9 * pupil}" fill="${g.eyesDark}"/>` +
        `<circle cx="${cx - 5}" cy="${y - 6}" r="4.6" fill="#fff"/><circle cx="${cx + 5}" cy="${y + 8}" r="2.1" fill="#fff" opacity=".9"/>`) +
      S(lash, 4.6) + S(flick, 3) + S(`M ${cx - 11} ${y + 19} Q ${cx} ${y + 22} ${cx + 11} ${y + 19}`, 1.4, LINE, 'opacity=".55"');
    switch (kind) {
      case 'happy': return S(`M ${cx - 14} ${y + 4} Q ${cx} ${y - 14} ${cx + 14} ${y + 4}`, 4.2) + S(side === 'L' ? `M ${cx - 13} ${y + 2} L ${cx - 19} ${y - 1}` : `M ${cx + 13} ${y + 2} L ${cx + 19} ${y - 1}`, 2.6);
      case 'closed': return S(`M ${cx - 14} ${y} Q ${cx} ${y + 11} ${cx + 14} ${y}`, 4) + S(side === 'L' ? `M ${cx - 13} ${y + 2} L ${cx - 19} ${y + 5}` : `M ${cx + 13} ${y + 2} L ${cx + 19} ${y + 5}`, 2.4);
      case 'half': return open() + `<path d="M ${cx - 20} ${y - 30} L ${cx + 20} ${y - 30} L ${cx + 20} ${y - 2} Q ${cx} ${y - 6} ${cx - 20} ${y - 2} Z" fill="${SKIN}"/>` + S(`M ${cx - 17} ${y - 2} Q ${cx} ${y - 7} ${cx + 17} ${y - 2}`, 4.4);
      case 'wide': return open(10.5, 15, .65);
      case 'heart': return open(12.5, 17, 1, true);
      case 'angry': return open(12.5, 16, .9) + `<path d="M ${cx - 20} ${y - 30} L ${cx + 20} ${y - 30} L ${cx + 20} ${y - 14 + (side === 'L' ? 8 : 0)} L ${cx - 20} ${y - 14 + (side === 'L' ? 0 : 8)} Z" fill="${SKIN}"/>` + S(side === 'L' ? `M ${cx - 17} ${y - 13} L ${cx + 17} ${y - 5}` : `M ${cx - 17} ${y - 5} L ${cx + 17} ${y - 13}`, 4.4);
      case 'teary': return open() + `<ellipse cx="${cx}" cy="${y + 13}" rx="12" ry="4" fill="#9bd7ff" opacity=".8"/>` + `<path d="M ${cx + out * 8} ${y + 18} Q ${cx + out * 12} ${y + 30} ${cx + out * 8} ${y + 34} Q ${cx + out * 4} ${y + 30} ${cx + out * 8} ${y + 18} Z" fill="#7cc8ff" stroke="#3b9ad9" stroke-width="1"/>`;
      case 'star': return open() + `<path d="M ${cx} ${y - 6} L ${cx + 3} ${y + 1} L ${cx + 10} ${y + 2} L ${cx + 4} ${y + 6} L ${cx + 6} ${y + 13} L ${cx} ${y + 9} L ${cx - 6} ${y + 13} L ${cx - 4} ${y + 6} L ${cx - 10} ${y + 2} L ${cx - 3} ${y + 1} Z" fill="#fff" opacity=".95"/>`;
      default: return open();
    }
  }
  function brows(kind, g) {
    const c = g.hairDark, y = EYE.y;
    const B = { normal: [-30, -34, -31], sad: [-30, -34, -38], angry: [-38, -33, -26], up: [-37, -41, -38], flat: [-31, -31, -31] }[kind] || [-30, -34, -31];
    const l = `M ${EYE.L - 12} ${y + B[0]} Q ${EYE.L} ${y + B[1]} ${EYE.L + 12} ${y + B[2]}`;
    const r = `M ${EYE.R + 12} ${y + B[0]} Q ${EYE.R} ${y + B[1]} ${EYE.R - 12} ${y + B[2]}`;
    return S(l, 3, c) + S(r, 3, c);
  }
  function mouth(kind) {
    switch (kind) {
      case 'grin': return `<path d="M 139 202 Q 150 205 161 202 Q 159 218 150 219 Q 141 218 139 202 Z" fill="${MOUTH}" stroke="${LINE}" stroke-width="2"/><path d="M 143 213 Q 150 208 157 213 Q 154 218 150 218 Q 146 218 143 213 Z" fill="#ff8da1"/>`;
      case 'open': return `<ellipse cx="150" cy="208" rx="5.5" ry="7" fill="${MOUTH}" stroke="${LINE}" stroke-width="2"/>`;
      case 'eat': return `<ellipse cx="150" cy="207" rx="7" ry="5" fill="${MOUTH}" stroke="${LINE}" stroke-width="2"/>`;
      case 'frown': return S('M 142 210 Q 150 202 158 210', 2.4);
      case 'pout': return S('M 143 207 Q 146.5 203 150 207 Q 153.5 203 157 207', 2.2);
      case 'cat': return S('M 139 204 Q 144.5 211 150 205 Q 155.5 211 161 204', 2.3);
      case 'flat': return S('M 144 206 L 156 206', 2.4);
      case 'smug': return S('M 141 206 Q 152 211 160 201', 2.4);
      case 'shout': return `<path d="M 140 202 L 160 202 L 156 216 Q 150 219 144 216 Z" fill="${MOUTH}" stroke="${LINE}" stroke-width="2"/>`;
      case 'wavy': return S('M 140 207 Q 143 203 146 207 Q 149 211 152 207 Q 155 203 158 207 Q 160 209 161 207', 2);
      case 'tiny': return S('M 147 206 Q 150 208 153 206', 2.2);
      default: return S('M 142 204 Q 150 212 158 204', 2.4);
    }
  }
  // Gesichtsausdrücke: [Augen, Brauen, Mund, Röte]
  A.EXPR = {
    neutral: ['open', 'normal', 'smile', 0], happy: ['open', 'up', 'grin', 1], joy: ['happy', 'up', 'grin', 1], love: ['heart', 'up', 'grin', 2],
    content: ['closed', 'normal', 'cat', 1], sad: ['open', 'sad', 'frown', 0], cry: ['teary', 'sad', 'wavy', 1], angry: ['angry', 'angry', 'shout', 1],
    pout: ['open', 'angry', 'pout', 2], surprised: ['wide', 'up', 'open', 0], sleepy: ['half', 'flat', 'tiny', 0], sleep: ['closed', 'flat', 'tiny', 0],
    smug: ['half', 'normal', 'smug', 1], shy: ['open', 'sad', 'wavy', 2], eat: ['happy', 'up', 'eat', 1], wink: ['wink', 'up', 'grin', 1], excited: ['star', 'up', 'grin', 1], hungry: ['open', 'sad', 'open', 0],
  };

  // ------------------------------------------------------------------ Accessoires
  const ACC = {
    flower: { name: 'Blüten-Spange', draw: (g) => flower(206, 104, 13, '#ffffff', '#f7c948') },
    ribbon: { name: 'Haarschleife', draw: (g) => P('M 208 108 L 186 92 Q 182 110 192 124 Z', g.accent) + P('M 208 108 L 232 94 Q 238 114 226 126 Z', g.accent) + P('M 204 112 L 196 138 L 206 132 Z', g.accent) + P('M 212 112 L 222 138 L 214 132 Z', g.accent) + `<circle cx="208" cy="110" r="6" fill="${g.accent}" stroke="${LINE}" stroke-width="2"/>` },
    star: { name: 'Stern-Spange', draw: () => star(98, 112, 12, '#ffe066') },
    snow: { name: 'Schneeflocken-Pin', draw: () => S('M 204 98 L 204 126 M 192 105 L 216 119 M 192 119 L 216 105 M 200 100 L 204 104 L 208 100 M 200 124 L 204 120 L 208 124', 2.6, '#7fc4f0') + `<circle cx="204" cy="112" r="3" fill="#fff" stroke="#7fc4f0" stroke-width="1.6"/>` },
    bat: { name: 'Fledermaus-Spange', draw: () => P('M 204 100 Q 196 88 182 92 Q 188 98 186 104 Q 194 102 198 108 Q 202 104 204 108 Q 206 104 210 108 Q 214 102 222 104 Q 220 98 226 92 Q 212 88 204 100 Z', '#2b2235') + `<circle cx="201" cy="101" r="1.2" fill="#e6418c"/><circle cx="207" cy="101" r="1.2" fill="#e6418c"/>` },
    cat: { name: 'Katzenohren', top: true, draw: (g) => P('M 92 94 L 98 46 L 134 72 Z', g.hair) + P('M 100 84 L 102 60 L 122 74 Z', '#ffb3c7', 'stroke-width="1.4"') + P(mirror('M 92 94 L 98 46 L 134 72 Z'), g.hair) + P(mirror('M 100 84 L 102 60 L 122 74 Z'), '#ffb3c7', 'stroke-width="1.4"') },
    glasses: { name: 'Runde Brille', face: true, draw: () => `<circle cx="118" cy="172" r="21" fill="rgba(200,230,255,.18)" stroke="#5a3a44" stroke-width="3"/><circle cx="182" cy="172" r="21" fill="rgba(200,230,255,.18)" stroke="#5a3a44" stroke-width="3"/>` + S('M 139 170 Q 150 164 161 170', 3, '#5a3a44') + S('M 97 168 L 82 162 M 203 168 L 218 162', 3, '#5a3a44') },
    phones: { name: 'Kopfhörer', top: true, draw: (g) => S('M 78 150 C 70 70 230 70 222 150', 7, '#3b3f58') + S('M 78 150 C 70 70 230 70 222 150', 3, '#8b93c9') + P('M 66 136 Q 60 160 70 178 L 86 174 L 86 138 Z', '#3b3f58') + P(mirror('M 66 136 Q 60 160 70 178 L 86 174 L 86 138 Z'), '#3b3f58') + `<circle cx="74" cy="157" r="5" fill="${g.accent}"/><circle cx="226" cy="157" r="5" fill="${g.accent}"/>` },
    crown: { name: 'Blumenkranz', top: true, draw: () => [[96, 92], [116, 78], [138, 70], [162, 70], [184, 78], [204, 92]].map(([x, y], i) => flower(x, y, 9, ['#ff9ec4', '#fff', '#ffd166', '#b9f3c8', '#fff', '#ff9ec4'][i], '#ffd166')).join('') + S('M 90 98 Q 150 54 210 98', 2, '#4caf50', 'opacity=".7"') },
    tiara: { name: 'Krönchen', top: true, draw: () => P('M 122 80 L 128 56 L 140 72 L 150 50 L 160 72 L 172 56 L 178 80 Q 150 74 122 80 Z', '#ffd54a') + `<circle cx="150" cy="66" r="4" fill="#ff4d8d" stroke="${LINE}" stroke-width="1.4"/>` },
    witch: { name: 'Hexenhut', top: true, draw: (g) => P('M 66 104 Q 150 70 234 104 Q 206 112 150 106 Q 94 112 66 104 Z', '#2e2442') + P('M 104 98 Q 128 30 196 8 Q 176 40 196 96 Q 150 88 104 98 Z', '#2e2442') + S('M 106 96 Q 150 84 194 94', 6, g.accent) + star(160, 72, 7, '#ffe066') },
    straw: { name: 'Strohhut', top: true, draw: () => `<ellipse cx="150" cy="94" rx="96" ry="22" fill="#f1d28a" stroke="${LINE}" stroke-width="2.2"/>` + P('M 104 92 Q 104 44 150 42 Q 196 44 196 92 Q 150 100 104 92 Z', '#f1d28a') + S('M 104 84 Q 150 94 196 84', 6, '#e85d75') },
  };
  A.ACC = Object.fromEntries(Object.entries(ACC).map(([k, v]) => [k, v.name]));
  function flower(x, y, r, petal, mid) { let s = ''; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - Math.PI / 2; s += `<circle cx="${(x + Math.cos(a) * r * .55).toFixed(1)}" cy="${(y + Math.sin(a) * r * .55).toFixed(1)}" r="${(r * .48).toFixed(1)}" fill="${petal}" stroke="${LINE}" stroke-width="1.5"/>`; } return s + `<circle cx="${x}" cy="${y}" r="${(r * .32).toFixed(1)}" fill="${mid}" stroke="${LINE}" stroke-width="1.4"/>`; }
  function star(x, y, r, fill) { let d = ''; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * .45 : r; d += (i ? 'L ' : 'M ') + (x + Math.cos(a) * rr).toFixed(1) + ' ' + (y + Math.sin(a) * rr).toFixed(1) + ' '; } return P(d + 'Z', fill); }

  // ------------------------------------------------------------------ Zusammensetzen
  A.girl = (id, o = {}) => {
    const g = { id, ...A.GIRLS[id] };
    if (o.color) Object.assign(g, o.color);
    const ex = A.EXPR[o.expr] || A.EXPR.neutral;
    const outfit = o.outfit || g.outfit;
    const accs = [g.acc, ...(o.acc || [])].filter(Boolean);
    const hairFill = `url(#hair-${id})`;
    let s = `<defs><linearGradient id="hair-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${g.hair}"/><stop offset="1" stop-color="${g.hairDark}"/></linearGradient>` +
      `<linearGradient id="iris-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${g.eyesDark}"/><stop offset=".55" stop-color="${g.eyes}"/><stop offset="1" stop-color="#ffffff" stop-opacity=".9"/></linearGradient></defs>`;
    // Hinten: Haare, Dutts, Seitenzopf
    s += `<g class="cg-back">`;
    if (g.buns) s += `<circle cx="96" cy="84" r="25" fill="${hairFill}" stroke="${LINE}" stroke-width="2.2"/><circle cx="204" cy="84" r="25" fill="${hairFill}" stroke="${LINE}" stroke-width="2.2"/>`;
    s += P(BACK[g.back] || BACK.long, hairFill);
    if (g.tail === 'side') s += P(TAIL_SIDE, hairFill) + S('M 230 150 C 244 190 246 240 236 290', 2, 'rgba(255,255,255,.35)');
    s += `</g>`;
    // Körper
    s += `<g class="cg-body">${body(g, outfit)}</g>`;
    // Kopf
    s += `<g class="cg-head">`;
    s += P('M 80 146 C 80 208 108 240 150 242 C 192 240 220 208 220 146 C 220 100 190 74 150 74 C 110 74 80 100 80 146 Z', SKIN);
    const [eK, bK, mK, blush] = ex;
    s += `<g class="cg-face">`;
    if (blush) s += `<ellipse cx="104" cy="198" rx="14" ry="7" fill="#ff8fa6" opacity="${blush > 1 ? .62 : .38}"/><ellipse cx="196" cy="198" rx="14" ry="7" fill="#ff8fa6" opacity="${blush > 1 ? .62 : .38}"/>` + (blush > 1 ? S('M 96 196 L 100 190 M 104 197 L 108 191 M 112 198 L 116 192 M 184 196 L 188 190 M 192 197 L 196 191 M 200 198 L 204 192', 1.6, '#e0607e') : '');
    const big = (cx, inner) => `<g class="cg-eye"><g transform="translate(${cx} ${EYE.y}) scale(1.13) translate(${-cx} ${-EYE.y})">${inner}</g></g>`;
    s += big(EYE.L, eK === 'wink' ? eye(EYE.L, 'L', 'open', g) : eye(EYE.L, 'L', eK, g)) + big(EYE.R, eK === 'wink' ? eye(EYE.R, 'R', 'closed', g) : eye(EYE.R, 'R', eK, g));
    s += brows(bK, g) + S('M 149 190 L 151 192', 2, '#d9917a') + mouth(mK);
    s += `</g>`;
    // Haare vorne
    s += both(LOCKS[g.locks] || LOCKS.long, hairFill);
    s += P(BANGS[g.bangs] || BANGS.soft, hairFill);
    if (g.ahoge) s += P('M 150 64 C 138 34 170 24 176 42 C 164 36 158 46 156 64 Z', hairFill);
    s += S('M 104 100 Q 150 84 196 100', 5, 'rgba(255,255,255,.42)', 'stroke-dasharray="18 10"');
    for (const a of accs) if (ACC[a] && !ACC[a].face) s += `<g class="cg-acc">${ACC[a].draw(g)}</g>`;
    for (const a of accs) if (ACC[a] && ACC[a].face) s += `<g class="cg-acc">${ACC[a].draw(g)}</g>`;
    s += `</g>`;
    return `<svg class="cg-svg" viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
  };
  // Nur der Kopf (für Toasts, Home-Karte, Auswahl)
  A.face = (id, expr = 'happy', o = {}) => A.girl(id, { ...o, expr }).replace('viewBox="0 0 300 400"', 'viewBox="58 40 184 200"');

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
