(() => {
'use strict';
const RG = window.RG, U = RG.U;
const R = U.R;
const Sp = RG.Sp = {};

/* ------------------------------------------------------------------ */
/*  Palettes d'apparence                                               */
/* ------------------------------------------------------------------ */
Sp.pal = {
  skin: ['#fde0c5', '#f7cfa5', '#e5ae7e', '#c98e5f', '#9a6a42', '#6b4429'],
  hair: ['#2b1b14', '#6a4126', '#a8642a', '#d9b25a', '#ebe4cf', '#c94b32', '#5a6fd1', '#d65fa3'],
  shirt: ['#e4694f', '#e8a93b', '#f0d35a', '#6fbf5a', '#3fa9a0', '#4b78c8', '#8a63c9', '#d65fa3', '#f2f2ee', '#3b3b44'],
  pants: ['#4a5d8f', '#3b3b44', '#7a5a3a', '#5f7f4f', '#8b4a5a', '#c9b48a', '#2f4f6f', '#b8b2a2'],
  hairNames: ['Court', 'Long', 'Pics', 'Chignon', 'Chauve', 'Afro'],
  hatNames: ['Aucun', 'Casquette', 'Bonnet', 'Chapeau de paille', 'Haut-de-forme', 'Couronne'],
  glassNames: ['Aucune', 'Rondes', 'Soleil']
};
const HAT_COL = [null, '#c8503f', '#4b78c8', '#e0c070', '#2b2b33', '#f4d06f', '#2f4a8c'];

Sp.defaultAp = () => ({ skin: Sp.pal.skin[1], hairC: Sp.pal.hair[1], hair: 0, shirt: Sp.pal.shirt[0], pants: Sp.pal.pants[0], hat: 0, glasses: 0 });
Sp.randomAp = (r) => {
  r = r || Math.random;
  const p = Sp.pal, pk = a => a[Math.floor(r() * a.length)];
  return {
    skin: pk(p.skin), hairC: pk(p.hair), hair: Math.floor(r() * 6), shirt: pk(p.shirt), pants: pk(p.pants),
    hat: r() < 0.18 ? 1 + Math.floor(r() * 3) : 0, glasses: r() < 0.15 ? 1 + Math.floor(r() * 2) : 0
  };
};

/* ------------------------------------------------------------------ */
/*  Personnage                                                         */
/* ------------------------------------------------------------------ */
function drawChar(c, dir, f, ap, mask) {
  const oy = 6;
  const skin = ap.skin, hair = ap.hairC, hairL = U.shade(hair, 30);
  const shirt = ap.shirt, shirtS = U.shade(shirt, -30), pants = ap.pants;
  const st = ap.hair | 0;
  const eye = '#2b1b14', blush = '#f2a08a', mouth = '#b5594a';
  const l1 = f === 1 ? 1 : 0, l2 = f === 2 ? 1 : 0;
  const a1 = f === 1 ? -1 : f === 2 ? 1 : 0, a2 = -a1;
  const leg = (x, lift) => { R(c, x, oy + 17, 3, 5 - lift, pants); R(c, x, oy + 22 - lift, 3, 2, '#4a3426'); };
  const spikes = () => { R(c, 4, oy - 2, 2, 2, hair); R(c, 7, oy - 3, 2, 3, hair); R(c, 10, oy - 2, 2, 2, hair); };
  const clearCorners = () => { c.clearRect(3, oy, 1, 1); c.clearRect(12, oy, 1, 1); c.clearRect(3, oy + 10, 1, 1); c.clearRect(12, oy + 10, 1, 1); };

  if (dir === 'down' || dir === 'up') {
    leg(5, l1); leg(8, l2);
    R(c, 4, oy + 11, 8, 7, shirt); R(c, 4, oy + 16, 8, 2, shirtS);
    R(c, 2, oy + 12 + a1, 2, 5, shirt); R(c, 2, oy + 17 + a1, 2, 2, skin);
    R(c, 12, oy + 12 + a2, 2, 5, shirt); R(c, 12, oy + 17 + a2, 2, 2, skin);
    if (st === 5) { R(c, 1, oy - 3, 14, 8, hair); R(c, 1, oy + 5, 3, 5, hair); R(c, 12, oy + 5, 3, 5, hair); }
    R(c, 3, oy, 10, 11, skin);
    if (dir === 'down') {
      if (st !== 4) {
        R(c, 3, oy, 10, st === 5 ? 3 : 4, hair);
        if (st !== 5) { R(c, 3, oy + 4, 2, 3, hair); R(c, 11, oy + 4, 2, 3, hair); R(c, 5, oy + 4, 2, 1, hair); R(c, 9, oy + 4, 2, 1, hair); R(c, 5, oy + 1, 5, 1, hairL); }
        if (st === 1) { R(c, 2, oy + 3, 2, 11, hair); R(c, 12, oy + 3, 2, 11, hair); }
        if (st === 2) spikes();
        if (st === 3) { R(c, 6, oy - 3, 4, 3, hair); R(c, 7, oy - 4, 2, 1, hair); }
      }
      R(c, 5, oy + 6, 1, 2, eye); R(c, 10, oy + 6, 1, 2, eye);
      R(c, 4, oy + 8, 2, 1, blush); R(c, 10, oy + 8, 2, 1, blush);
      R(c, 7, oy + 9, 2, 1, mouth);
    } else if (st !== 4) {
      R(c, 3, oy, 10, 10, hair);
      if (st === 1) R(c, 3, oy + 10, 10, 4, hair);
      if (st === 2) spikes();
      if (st === 3) { R(c, 6, oy - 3, 4, 3, hair); R(c, 7, oy - 4, 2, 1, hair); }
      R(c, 5, oy + 1, 5, 1, hairL);
    }
    if (st !== 5) clearCorners();
    if (mask) {
      R(c, 3, oy, 10, 11, '#222228');
      if (dir === 'down') { R(c, 4, oy + 5, 8, 3, skin); R(c, 5, oy + 6, 1, 2, eye); R(c, 10, oy + 6, 1, 2, eye); }
      clearCorners();
    }
    if (ap.glasses && dir === 'down') {
      const g = ap.glasses === 2;
      R(c, 4, oy + 5, 3, 3, g ? '#15151c' : '#2b2b33'); R(c, 9, oy + 5, 3, 3, g ? '#15151c' : '#2b2b33');
      if (!g) { R(c, 5, oy + 6, 1, 1, '#bfe6f5'); R(c, 10, oy + 6, 1, 1, '#bfe6f5'); }
      R(c, 7, oy + 6, 2, 1, '#2b2b33');
    }
  } else {
    const A = f === 1 ? [4, 0] : f === 2 ? [6, 1] : [5, 0];
    const B = f === 1 ? [9, 1] : f === 2 ? [7, 0] : [8, 0];
    leg(A[0], A[1]); leg(B[0], B[1]);
    R(c, 5, oy + 11, 6, 7, shirt); R(c, 5, oy + 16, 6, 2, shirtS);
    if (st === 5) { R(c, 1, oy - 3, 14, 8, hair); R(c, 8, oy + 5, 6, 5, hair); }
    R(c, 3, oy, 10, 11, skin);
    if (st !== 4) {
      R(c, 3, oy, 10, st === 5 ? 3 : 4, hair);
      if (st !== 5) { R(c, 8, oy + 4, 5, 6, hair); R(c, 3, oy + 4, 3, 1, hair); R(c, 5, oy + 1, 5, 1, hairL); }
      if (st === 1) R(c, 8, oy + 4, 5, 10, hair);
      if (st === 2) spikes();
      if (st === 3) R(c, 10, oy - 2, 4, 4, hair);
    }
    R(c, 5, oy + 6, 1, 2, eye); R(c, 4, oy + 8, 2, 1, blush); R(c, 5, oy + 9, 1, 1, mouth);
    if (st !== 5) clearCorners();
    if (mask) {
      R(c, 3, oy, 10, 11, '#222228'); R(c, 3, oy + 5, 5, 3, skin); R(c, 5, oy + 6, 1, 2, eye); clearCorners();
    }
    if (ap.glasses) {
      const g = ap.glasses === 2, col = g ? '#15151c' : '#2b2b33';
      R(c, 4, oy + 5, 3, 3, col); R(c, 7, oy + 6, 5, 1, col);
      if (!g) R(c, 5, oy + 6, 1, 1, '#bfe6f5');
    }
    // bras par-dessus
    const ax = f === 1 ? -1 : f === 2 ? 1 : 0;
    R(c, 6 + ax, oy + 12, 3, 5, shirtS); R(c, 6 + ax, oy + 17, 3, 2, skin);
  }
  // chapeau
  const h = ap.hat | 0;
  if (h) {
    const col = ap.hatC || HAT_COL[h], dk = U.shade(col, -40), lt = U.shade(col, 40);
    if (h === 1 || h === 6) {
      R(c, 3, oy - 1, 10, 4, col); R(c, 4, oy, 4, 1, lt);
      if (h === 6) { R(c, 3, oy + 2, 10, 1, '#14203f'); R(c, 7, oy, 2, 1, '#f4d06f'); }
      if (dir === 'down') R(c, 3, oy + 3, 10, 2, h === 6 ? '#14203f' : dk);
      else if (dir === 'up') R(c, 3, oy + 3, 10, 1, dk);
      else R(c, 0, oy + 3, 6, 1, h === 6 ? '#14203f' : dk);
    } else if (h === 2) {
      R(c, 3, oy - 2, 10, 6, col); R(c, 3, oy + 3, 10, 1, lt); R(c, 7, oy - 4, 2, 2, lt);
    } else if (h === 3) {
      R(c, 0, oy + 1, 16, 2, col); R(c, 4, oy - 3, 8, 4, col); R(c, 4, oy, 8, 1, '#c8503f'); R(c, 0, oy + 2, 16, 1, dk);
    } else if (h === 4) {
      R(c, 2, oy + 1, 12, 1, col); R(c, 4, oy - 5, 8, 6, col); R(c, 4, oy - 1, 8, 1, '#c8503f'); R(c, 5, oy - 4, 1, 3, '#45454f');
    } else if (h === 5) {
      R(c, 4, oy - 1, 8, 3, col); R(c, 4, oy - 3, 2, 2, col); R(c, 7, oy - 4, 2, 3, col); R(c, 10, oy - 3, 2, 2, col); R(c, 5, oy, 2, 1, '#e0443a'); R(c, 9, oy, 2, 1, '#4b78c8');
    }
  }
}
const charCache = {};
Sp.char = (ap, dir, f, mask) => {
  const key = [ap.skin, ap.hairC, ap.hair, ap.shirt, ap.pants, ap.hat, ap.glasses, ap.hatC || '', dir, f, mask ? 1 : 0].join('|');
  if (charCache[key]) return charCache[key];
  const raw = U.mk(16, 30);
  drawChar(raw.getContext('2d'), dir === 'right' ? 'left' : dir, f, ap, mask);
  return (charCache[key] = U.finish(raw, dir === 'right'));
};

/* ------------------------------------------------------------------ */
/*  Animaux                                                            */
/* ------------------------------------------------------------------ */
Sp.animalTypes = ['chien', 'chat', 'lapin', 'poule', 'canard', 'vache'];
Sp.animalSize = { chien: [16, 13], chat: [15, 13], lapin: [12, 12], poule: [12, 12], canard: [14, 11], vache: [22, 15] };
const COLS = {
  chien: [['#c58a4f', '#8a5a2e'], ['#e8d6b0', '#b89868'], ['#4a3a32', '#2b211c'], ['#f2f0ea', '#9a9690']],
  chat: [['#e08a3c', '#b8651f'], ['#8d8d96', '#5f5f68'], ['#2c2c33', '#15151a'], ['#f4f1e8', '#c9c4b4']],
  lapin: [['#f2eee6', '#cfc8b8'], ['#b9a38a', '#8a7358'], ['#8b8b92', '#5f5f68']],
  poule: [['#f7f3ea', '#d6cfbd'], ['#c9803a', '#8f5524']],
  canard: [['#7a5a3a', '#4f7a3f'], ['#f7f3ea', '#e8c93a']],
  vache: [['#f4f1e8', '#2b2b30'], ['#b7733f', '#f4f1e8']]
};
function drawAnimal(c, type, v, f) {
  const [a, b] = COLS[type][v % COLS[type].length];
  const bob = f === 1 ? 1 : 0, l = f === 1 ? 1 : 0, l2 = f === 2 ? 1 : 0;
  switch (type) {
    case 'chien':
      R(c, 5, 4 + bob, 9, 5, a); R(c, 1, 2 + bob, 6, 5, a); R(c, 0, 4 + bob, 2, 2, b); R(c, 5, 2 + bob, 2, 4, b);
      R(c, 13, 2 + bob, 2, 3, a); R(c, 3, 3 + bob, 1, 1, '#222'); R(c, 0, 4 + bob, 1, 1, '#111');
      R(c, 5, 9, 2, 4 - l, b); R(c, 11, 9, 2, 4 - l2, b); R(c, 8, 9, 2, 4 - l2, a); R(c, 2, 7 + bob, 3, 1, '#d44');
      break;
    case 'chat':
      R(c, 5, 6 + bob, 8, 4, a); R(c, 2, 4 + bob, 5, 5, a); R(c, 2, 2 + bob, 1, 2, a); R(c, 6, 2 + bob, 1, 2, a);
      R(c, 3, 6 + bob, 1, 1, '#222'); R(c, 5, 6 + bob, 1, 1, '#222'); R(c, 4, 7 + bob, 1, 1, '#e88');
      R(c, 12, 3, 2, 6, a); R(c, 13, 2, 1, 2, b); R(c, 5, 10, 2, 3 - l, b); R(c, 10, 10, 2, 3 - l2, b); R(c, 8, 10, 2, 3 - l2, a);
      break;
    case 'lapin':
      R(c, 4, 6 + bob, 7, 5, a); R(c, 1, 5 + bob, 5, 4, a); R(c, 2, 0 + bob, 1, 5, a); R(c, 4, 1 + bob, 1, 4, a); R(c, 2, 1 + bob, 1, 2, '#e9a2a2');
      R(c, 2, 6 + bob, 1, 1, '#222'); R(c, 10, 7 + bob, 3, 3, '#fffaf0'); R(c, 4, 11, 3, 1, b); R(c, 8, 11, 3, 1 - l2 < 1 ? 1 : 1, b);
      break;
    case 'poule':
      R(c, 3, 4 + bob, 7, 6, a); R(c, 1, 2 + bob, 4, 4, a); R(c, 2, 0 + bob, 2, 2, '#d8433a'); R(c, 0, 3 + bob, 1, 2, '#f0a030'); R(c, 1, 3 + bob, 1, 1, '#222');
      R(c, 9, 3 + bob, 2, 5, b); R(c, 4, 10, 1, 2 - l, '#e0a030'); R(c, 7, 10, 1, 2 - l2, '#e0a030'); R(c, 2, 5 + bob, 1, 2, '#d8433a');
      break;
    case 'canard':
      R(c, 3, 5 + bob, 9, 4, a); R(c, 1, 2 + bob, 4, 4, b); R(c, 0, 4 + bob, 2, 1, '#f0a030'); R(c, 2, 3 + bob, 1, 1, '#111');
      R(c, 11, 4 + bob, 2, 2, a); R(c, 5, 9, 2, 2 - l, '#f0a030'); R(c, 8, 9, 2, 2 - l2, '#f0a030');
      break;
    case 'vache':
      R(c, 5, 3 + bob, 15, 8, a); R(c, 0, 2 + bob, 6, 6, a); R(c, 0, 0 + bob, 2, 2, '#e8dcc0'); R(c, 4, 0 + bob, 2, 2, '#e8dcc0');
      R(c, 1, 5 + bob, 4, 2, '#e8a8a8'); R(c, 2, 3 + bob, 1, 1, '#111');
      R(c, 7, 4 + bob, 3, 3, b); R(c, 13, 6 + bob, 4, 3, b); R(c, 17, 3 + bob, 2, 2, b);
      R(c, 20, 3 + bob, 1, 6, b); R(c, 6, 11, 2, 4 - l, '#b8b0a0'); R(c, 10, 11, 2, 4 - l2, a); R(c, 14, 11, 2, 4 - l, '#b8b0a0'); R(c, 18, 11, 2, 4 - l2, a);
      R(c, 3, 8 + bob, 4, 2, '#e8a8a8');
      break;
  }
}
const aniCache = {};
Sp.animal = (type, v, f, right) => {
  const key = type + v + f + (right ? 1 : 0);
  if (aniCache[key]) return aniCache[key];
  const sz = Sp.animalSize[type];
  const raw = U.mk(sz[0], sz[1]);
  drawAnimal(raw.getContext('2d'), type, v, f);
  return (aniCache[key] = U.finish(raw, right));
};
Sp.animalVariants = t => COLS[t].length;

/* ------------------------------------------------------------------ */
/*  Arbres, buissons                                                   */
/* ------------------------------------------------------------------ */
const TREE_PAL = [
  ['#2f7d3f', '#3f9a4d', '#62b866'], ['#3a8a62', '#4aa878', '#72c79a'], ['#b8531f', '#e07a2b', '#f2a54a']
];
const srnd = U.rng(777);
Sp.tree = (() => {
  const cache = [];
  return v => {
    if (cache[v]) return cache[v];
    const raw = U.mk(32, 40), c = raw.getContext('2d');
    if (v === 3) { // sapin
      R(c, 13, 30, 6, 8, '#74482e'); R(c, 16, 30, 3, 8, '#5f3a24');
      const lay = [[16, 2, 5], [16, 8, 8], [16, 15, 11], [16, 22, 13]];
      for (const l of lay) {
        for (let y = 0; y < 9; y++) { const w = Math.floor(l[2] * (y + 1) / 9); R(c, l[0] - w, l[1] + y, 2 * w, 1, y > 6 ? '#1f5e34' : '#2b7a45'); }
      }
      for (let i = 0; i < 14; i++) R(c, 8 + Math.floor(srnd() * 16), 6 + Math.floor(srnd() * 20), 2, 1, '#4fa066');
    } else {
      const [dk, md, lt] = TREE_PAL[v];
      R(c, 13, 28, 6, 10, '#8a5a3a'); R(c, 16, 28, 3, 10, '#74482e'); R(c, 12, 36, 8, 2, '#74482e');
      const lobes = [[16, 13, 11], [9, 19, 8], [23, 19, 8], [16, 21, 10]];
      for (const l of lobes) U.circle(c, l[0], l[1], l[2], dk);
      for (const l of lobes) U.circle(c, l[0] - 1, l[1] - 2, l[2] - 2, md);
      for (const l of lobes) if (l[2] - 5 > 1) U.circle(c, l[0] - 3, l[1] - 4, l[2] - 5, lt);
      for (let i = 0; i < 16; i++) {
        const x = 5 + Math.floor(srnd() * 22), y = 4 + Math.floor(srnd() * 24);
        if (Math.hypot(x - 16, y - 17) < 10) R(c, x, y, 2, 1, i & 1 ? dk : lt);
      }
    }
    return (cache[v] = U.finish(raw, false));
  };
})();
Sp.stump = (() => {
  let s = null;
  return () => {
    if (s) return s;
    const raw = U.mk(16, 10), c = raw.getContext('2d');
    R(c, 3, 3, 10, 6, '#8a5a3a'); R(c, 3, 3, 10, 2, '#c9a06a'); R(c, 5, 4, 6, 1, '#a8804e'); R(c, 3, 8, 10, 1, '#74482e');
    return (s = U.finish(raw, false));
  };
})();
Sp.bush = (() => {
  const cache = [];
  return v => {
    if (cache[v]) return cache[v];
    const raw = U.mk(16, 12), c = raw.getContext('2d');
    const cols = [['#3f9a4d', '#62b866'], ['#3a8a62', '#72c79a']][v % 2];
    U.ellipse(c, 8, 7, 7, 4, cols[0]); U.ellipse(c, 6, 5, 4, 3, cols[1]);
    if (v >= 2) { R(c, 4, 4, 1, 1, '#f48fb1'); R(c, 9, 6, 1, 1, '#f48fb1'); R(c, 11, 4, 1, 1, '#fff'); }
    return (cache[v] = U.finish(raw, false));
  };
})();

/* ------------------------------------------------------------------ */
/*  Bâtiments                                                          */
/* ------------------------------------------------------------------ */
function sign(c, text, cx, y, col, scale, shadow) {
  const w = U.textW(text), tmp = U.mk(w + 1, 6), t = tmp.getContext('2d');
  U.drawText(t, text, 0, 0, col, null);
  const sw = (w + 1) * scale;
  c.imageSmoothingEnabled = false;
  if (shadow) { const t2 = U.mk(w + 1, 6), tt = t2.getContext('2d'); U.drawText(tt, text, 0, 0, shadow, null); c.drawImage(t2, Math.round(cx - sw / 2) + scale, y + scale, sw, 6 * scale); }
  c.drawImage(tmp, Math.round(cx - sw / 2), y, sw, 6 * scale);
}
Sp.sign = sign;

Sp.building = (() => {
  const cache = {};
  return (w, o) => {
    const key = w + JSON.stringify(o);
    if (cache[key]) return cache[key];
    const W = w * 16, H = 80;
    const raw = U.mk(W, H), c = raw.getContext('2d');
    const dx = Math.floor(w / 2) * 16;       // x de la tuile porte
    const wall = o.wall || '#f3e4c2', wallD = U.shade(wall, -22);
    if (o.kind === 'house') {
      const rc = o.roof || '#c8503f', rc2 = U.shade(rc, -18), rc3 = U.shade(rc, -40);
      R(c, 4, 32, W - 8, 46, wall);
      for (let y = 36; y < 78; y += 8) R(c, 4, y, W - 8, 1, wallD);
      R(c, W - 10, 32, 6, 46, wallD); R(c, 4, 78, W - 8, 2, '#9a9486');
      const maxIn = Math.min(12, Math.floor(W * 0.17));
      for (let y = 0; y < 32; y++) {
        const inset = Math.floor((31 - y) * maxIn / 31);
        R(c, inset, y, W - 2 * inset, 1, ((y >> 2) & 1) ? rc : rc2);
      }
      for (let y = 0; y < 32; y += 4) {
        const inset = Math.floor((31 - y) * maxIn / 31);
        for (let x = ((y >> 2) & 1) * 4; x < W; x += 8) if (x > inset + 1 && x < W - inset - 2) R(c, x, y, 1, 4, rc3);
      }
      R(c, 0, 28, W, 4, rc3);
      const cx = W - 22; R(c, cx, 4, 8, 12, '#a45a4a'); R(c, cx - 1, 1, 10, 3, '#8a4a3c');
      R(c, 4, 32, W - 8, 2, '#c9b48a');
      // porte
      R(c, dx + 1, 50, 14, 28, '#fff7e6'); R(c, dx + 2, 52, 12, 26, o.door || '#8b5a3c');
      R(c, dx + 4, 54, 3, 8, U.shade(o.door || '#8b5a3c', -20)); R(c, dx + 9, 54, 3, 8, U.shade(o.door || '#8b5a3c', -20));
      R(c, dx + 4, 65, 3, 10, U.shade(o.door || '#8b5a3c', -20)); R(c, dx + 9, 65, 3, 10, U.shade(o.door || '#8b5a3c', -20));
      R(c, dx + 11, 66, 2, 2, '#f4d06f'); R(c, dx, 76, 16, 2, '#b8b2a2');
      for (let k = 0, n = Math.floor((w - 1) / 2); k < n; k++) {
        for (const wx of [dx - 28 - 40 * k, dx + 32 + 40 * k]) {
          if (wx < 2 || wx + 13 > W - 2) continue;
          R(c, wx - 1, 48, 14, 16, '#fff7e6'); R(c, wx, 49, 12, 14, '#9fd8f0'); R(c, wx + 5, 49, 2, 14, '#fff7e6'); R(c, wx, 55, 12, 2, '#fff7e6');
          R(c, wx + 1, 50, 3, 4, '#cfeefa'); R(c, wx - 2, 63, 16, 3, '#8b5a3c');
          R(c, wx, 61, 2, 2, '#f48fb1'); R(c, wx + 4, 61, 2, 2, '#fff176'); R(c, wx + 8, 61, 2, 2, '#f48fb1');
        }
      }
    } else {
      // commerce : toit plat + enseigne + auvent
      const rc = o.roof || '#6b6f78';
      R(c, 0, 6, W, 26, rc); R(c, 0, 6, W, 3, U.shade(rc, 30)); R(c, 0, 29, W, 3, U.shade(rc, -30));
      R(c, 2, 32, W - 4, 48, wall);
      for (let y = 38; y < 78; y += 8) R(c, 2, y, W - 4, 1, wallD);
      R(c, 2, 78, W - 4, 2, '#8a8478');
      if (o.extra === 'dark') { for (let x = 2; x < W - 2; x += 4) R(c, x, 32, 1, 48, wallD); }
      // enseigne
      const sbg = o.signBg || '#2b2b33', sfg = o.signFg || '#fff7e6';
      R(c, 4, 11, W - 8, 15, sbg); R(c, 4, 11, W - 8, 1, U.shade(sbg, 40)); R(c, 4, 25, W - 8, 1, U.shade(sbg, -30));
      if (o.text) {
        const sc = (w >= 10 && o.text.length * 4 * 2 < W - 16) ? 2 : 1;
        sign(c, o.text, W / 2, sc === 2 ? 12 : 16, sfg, sc, U.shade(sbg, -40));
      }
      if (o.extra === 'lights') { for (let x = 6; x < W - 6; x += 6) { R(c, x, 12, 2, 2, (x / 6) % 2 ? '#ffe36a' : '#ff6a6a'); R(c, x, 23, 2, 2, (x / 6) % 2 ? '#ff6a6a' : '#ffe36a'); } }
      // auvent
      const a1 = (o.awn && o.awn[0]) || '#c8503f', a2 = (o.awn && o.awn[1]) || '#fff7e6';
      if (o.extra !== 'dark') {
        for (let x = 0; x < W; x += 8) { R(c, x, 34, 8, 8, ((x / 8) & 1) ? a2 : a1); R(c, x + 1, 42, 6, 2, ((x / 8) & 1) ? a2 : a1); }
        R(c, 0, 34, W, 1, U.shade(a1, -30));
      }
      // fenêtres
      if (o.extra !== 'dark') {
        const wins = [];
        for (let x = 8; x + 20 < dx; x += 26) wins.push(x);
        for (let x = dx + 20; x + 20 < W - 6; x += 26) wins.push(x);
        for (const x of wins) {
          R(c, x - 1, 49, 22, 24, '#fff7e6'); R(c, x, 50, 20, 22, '#9fd8f0'); R(c, x + 2, 52, 5, 8, '#cfeefa');
          R(c, x, 66, 20, 6, U.shade('#9fd8f0', -25));
          if (o.extra === 'bars') for (let b = 3; b < 20; b += 4) R(c, x + b, 50, 1, 22, '#4a4a55');
          if (o.extra === 'columns') R(c, x + 9, 50, 2, 22, '#fff7e6');
        }
      } else { R(c, 8, 52, 12, 8, '#15151a'); R(c, 8, 52, 12, 1, '#555'); R(c, W - 22, 56, 14, 6, '#c8503f'); R(c, W - 21, 58, 12, 1, '#fff7e6'); }
      if (o.extra === 'columns') { for (const x of [4, W - 12]) { R(c, x, 34, 8, 44, '#e8e4d8'); R(c, x, 34, 8, 3, '#c9c4b4'); R(c, x, 75, 8, 3, '#c9c4b4'); R(c, x + 6, 37, 2, 38, '#c9c4b4'); } }
      // porte
      const dc = o.door || '#6b4429';
      R(c, dx + 1, 48, 14, 32, '#fff7e6'); R(c, dx + 2, 50, 12, 30, dc);
      R(c, dx + 3, 52, 10, 12, '#9fd8f0'); R(c, dx + 3, 52, 3, 5, '#cfeefa'); R(c, dx + 8, 66, 1, 14, U.shade(dc, -25)); R(c, dx + 10, 68, 2, 4, '#f4d06f');
      if (o.extra === 'dark') { R(c, dx + 3, 52, 10, 12, '#15151a'); R(c, dx + 3, 52, 10, 1, '#c8503f'); }
    }
    return (cache[key] = U.finish(raw, false));
  };
})();

/* ------------------------------------------------------------------ */
/*  Accessoires / décors (dessinés dans le fond de la carte)           */
/* ------------------------------------------------------------------ */
const GOODS = ['#e4694f', '#f0d35a', '#6fbf5a', '#4b78c8', '#f2f2ee', '#d65fa3', '#e8a93b', '#8a63c9'];
Sp.prop = function (c, kind, tx, ty, w, h, o) {
  o = o || {};
  const x = tx * 16, y = ty * 16, W = w * 16, H = h * 16;
  switch (kind) {
    case 'shelf': {
      R(c, x, y, W, 16, '#8a5a3a'); R(c, x, y, W, 2, '#b07a50'); R(c, x, y + 7, W, 1, '#6a4128'); R(c, x, y + 14, W, 2, '#6a4128');
      for (let i = 0; i < W / 4; i++) {
        const hh = U.hash(tx + i, ty, 4);
        R(c, x + i * 4 + 1, y + 3, 3, 4, GOODS[Math.floor(hh * GOODS.length)]);
        R(c, x + i * 4 + 1, y + 9, 3, 5, GOODS[Math.floor(U.hash(tx + i, ty, 9) * GOODS.length)]);
      }
      break;
    }
    case 'counter': {
      const top = o.top || '#e0c598', fr = o.front || '#8a5a3a';
      R(c, x, y + 2, W, 7, top); R(c, x, y + 2, W, 1, U.shade(top, 25)); R(c, x, y + 9, W, 7, fr); R(c, x, y + 9, W, 1, U.shade(fr, -30));
      for (let i = 1; i < w; i++) R(c, x + i * 16 - 1, y + 10, 1, 6, U.shade(fr, -22));
      break;
    }
    case 'register': R(c, x + 3, y, 10, 8, '#3b3b44'); R(c, x + 4, y + 1, 8, 3, '#9fd8f0'); R(c, x + 4, y + 5, 8, 2, '#8a8a95'); break;
    case 'table': {
      const cl = o.cloth || '#f2f2ee';
      R(c, x + 1, y + 2, W - 2, H - 5, cl); R(c, x + 1, y + 2, W - 2, 1, U.shade(cl, 25)); R(c, x + 1, y + H - 4, W - 2, 3, U.shade(cl, -35));
      R(c, x + 3, y + H - 1, 2, 1, '#6a4128'); R(c, x + W - 5, y + H - 1, 2, 1, '#6a4128');
      break;
    }
    case 'chair': R(c, x + 4, y + 5, 8, 6, o.col || '#a8714a'); R(c, x + 4, y + 2, 8, 3, U.shade(o.col || '#a8714a', -30)); R(c, x + 5, y + 11, 1, 3, '#6a4128'); R(c, x + 10, y + 11, 1, 3, '#6a4128'); break;
    case 'bed':
      R(c, x, y, W, H, '#8a5a3a'); R(c, x + 1, y + 6, W - 2, H - 8, o.col || '#6fa8dc'); R(c, x + 1, y + 6, W - 2, 3, U.shade(o.col || '#6fa8dc', 35));
      R(c, x + 3, y + 2, 12, 6, '#fff7e6'); R(c, x + 17, y + 2, 12, 6, '#fff7e6'); R(c, x, y, W, 2, '#6a4128'); R(c, x, y + H - 2, W, 2, '#6a4128');
      break;
    case 'mirror':
      R(c, x + 2, y + 2, 12, 28, '#d9b25a'); R(c, x + 4, y + 4, 8, 24, '#bfe6f5'); R(c, x + 5, y + 5, 2, 8, '#fff'); R(c, x + 8, y + 12, 1, 10, '#e8f6fc');
      break;
    case 'chest':
      R(c, x + 1, y + 4, 14, 11, '#8a5a3a'); R(c, x + 1, y + 4, 14, 4, '#a8714a'); R(c, x + 1, y + 8, 14, 1, '#4a2e1a'); R(c, x + 7, y + 7, 2, 3, '#f4d06f'); R(c, x + 1, y + 14, 14, 1, '#4a2e1a');
      break;
    case 'plant':
      R(c, x + 4, y + 9, 8, 6, '#c8503f'); R(c, x + 4, y + 9, 8, 1, '#e07a6a');
      U.circle(c, x + 8, y + 6, 5, '#3f9a4d'); U.circle(c, x + 6, y + 4, 3, '#62b866'); R(c, x + 10, y + 3, 2, 2, '#f48fb1');
      break;
    case 'rug': {
      const cl = o.col || '#c8503f';
      R(c, x, y, W, H, cl); R(c, x + 2, y + 2, W - 4, H - 4, U.shade(cl, 28)); R(c, x + 4, y + 4, W - 8, H - 8, cl);
      break;
    }
    case 'crate': R(c, x + 1, y + 2, 14, 13, '#a8804e'); R(c, x + 1, y + 2, 14, 2, '#c9a06a'); R(c, x + 1, y + 8, 14, 1, '#6a4128'); R(c, x + 7, y + 2, 2, 13, '#6a4128'); break;
    case 'sofa':
      R(c, x, y + 2, W, 14, o.col || '#8a63c9'); R(c, x, y + 2, W, 5, U.shade(o.col || '#8a63c9', -25)); R(c, x + 2, y + 8, W - 4, 6, U.shade(o.col || '#8a63c9', 20));
      break;
    case 'tv': R(c, x + 2, y + 2, W - 4, 14, '#2b2b33'); R(c, x + 4, y + 4, W - 8, 10, '#5cb4d8'); R(c, x + 6, y + 5, 6, 3, '#cfeefa'); break;
    case 'desk': R(c, x, y + 3, W, 8, '#a8714a'); R(c, x, y + 3, W, 1, '#c9a06a'); R(c, x, y + 11, W, 5, '#6a4128'); R(c, x + 3, y + 1, 7, 5, '#f2f2ee'); break;
    case 'slot': {
      const col = o.col || '#c8503f';
      R(c, x + 1, y, 14, 16, col); R(c, x + 1, y, 14, 2, U.shade(col, 40)); R(c, x + 3, y + 3, 10, 6, '#15151c');
      R(c, x + 4, y + 4, 2, 4, '#ffe36a'); R(c, x + 7, y + 4, 2, 4, '#ff6a6a'); R(c, x + 10, y + 4, 2, 4, '#6fd36f');
      R(c, x + 3, y + 11, 10, 3, '#f4d06f'); R(c, x + 14, y + 4, 2, 6, '#8a8a95'); R(c, x + 15, y + 3, 1, 2, '#e0443a');
      break;
    }
    case 'roulette': {
      R(c, x, y, W, H, '#5a3a22'); R(c, x + 2, y + 2, W - 4, H - 4, '#1f7a43');
      U.circle(c, x + 14, y + H / 2, 10, '#2b1b14'); U.circle(c, x + 14, y + H / 2, 8, '#8a5a3a'); U.circle(c, x + 14, y + H / 2, 5, '#d9b25a'); U.circle(c, x + 14, y + H / 2, 2, '#2b1b14');
      for (let i = 0; i < 12; i++) { R(c, x + 30 + (i % 6) * 5, y + 8 + Math.floor(i / 6) * 8, 4, 6, i % 2 ? '#c8403a' : '#222'); }
      R(c, x + 30, y + 26, 30, 3, '#fff7e6');
      break;
    }
    case 'bjtable': {
      R(c, x, y, W, H, '#5a3a22'); R(c, x + 2, y + 2, W - 4, H - 4, '#1f7a43');
      for (let i = 0; i < 4; i++) { R(c, x + 6 + i * 14, y + H - 14, 8, 10, '#18603a'); R(c, x + 6 + i * 14, y + H - 14, 8, 1, '#e8e0c8'); }
      R(c, x + 18, y + 8, 28, 2, '#e8e0c8');
      break;
    }
    case 'pokertable': {
      R(c, x + 4, y + 2, W - 8, H - 4, '#5a3a22'); R(c, x, y + 8, W, H - 16, '#5a3a22');
      R(c, x + 6, y + 5, W - 12, H - 10, '#1f7a43'); R(c, x + 3, y + 10, W - 6, H - 20, '#1f7a43');
      R(c, x + 8, y + H / 2 - 7, W - 16, 14, '#18603a');
      break;
    }
    case 'bars': { // cellule
      R(c, x, y, W, H, '#33333b');
      for (let i = 0; i < W; i += 5) R(c, x + i, y, 2, H, '#8d8d98');
      R(c, x, y, W, 2, '#6a6a75'); R(c, x, y + H - 2, W, 2, '#6a6a75');
      break;
    }
    case 'bench': R(c, x + 1, y + 4, W - 2, 4, '#a8714a'); R(c, x + 1, y + 4, W - 2, 1, '#c9a06a'); R(c, x + 1, y + 8, W - 2, 2, '#6a4128'); R(c, x + 2, y + 10, 2, 4, '#4a4a55'); R(c, x + W - 4, y + 10, 2, 4, '#4a4a55'); break;
    case 'barrel': R(c, x + 3, y + 3, 10, 12, '#6b4429'); R(c, x + 3, y + 5, 10, 1, '#444'); R(c, x + 3, y + 11, 10, 1, '#444'); R(c, x + 3, y + 3, 10, 2, '#8a5a3a'); break;
    case 'dumpster': R(c, x + 1, y + 3, W - 2, 12, '#3f6f4a'); R(c, x + 1, y + 3, W - 2, 3, '#4f8a5a'); R(c, x + 1, y + 13, W - 2, 2, '#2b4a33'); break;
    case 'lamp': R(c, x + 7, y + 4, 2, 11, '#3b3b44'); R(c, x + 5, y + 1, 6, 4, '#ffe9a0'); R(c, x + 5, y + 1, 6, 1, '#3b3b44'); R(c, x + 5, y + 14, 6, 2, '#55555f'); break;
    case 'flower': {
      R(c, x + 1, y + 6, 14, 9, '#6b4429');
      for (let i = 0; i < 6; i++) { const fx = x + 2 + (i % 3) * 5, fy = y + 6 + Math.floor(i / 3) * 4; R(c, fx, fy, 2, 2, ['#f48fb1', '#fff', '#ffd54f', '#ba9cf0'][Math.floor(U.hash(tx, ty, i) * 4)]); R(c, fx, fy + 2, 1, 2, '#3f9a4d'); }
      break;
    }
    case 'fence': R(c, x, y + 6, W, 2, '#c9a06a'); R(c, x, y + 11, W, 2, '#c9a06a'); for (let i = 0; i < W; i += 8) R(c, x + i + 2, y + 3, 3, 12, '#a8804e'); break;
    case 'fenceV': R(c, x + 6, y, 4, H, '#b58e5c'); for (let j = 0; j < H; j += 8) R(c, x + 3, y + j + 2, 10, 3, '#a8804e'); break;
    case 'crop': {
      R(c, x, y, 16, 16, '#7a5230');
      for (let i = 0; i < 3; i++) R(c, x, y + 2 + i * 5, 16, 1, '#5f3f24');
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { R(c, x + 1 + i * 4, y + 1 + j * 5, 2, 3, o.col || '#4fb04f'); R(c, x + 2 + i * 4, y + j * 5, 1, 1, '#2f7d3f'); }
      break;
    }
    case 'fountain': {
      U.circle(c, x + W / 2, y + H / 2, 28, '#b8b2a2'); U.circle(c, x + W / 2, y + H / 2, 25, '#8d8678');
      U.circle(c, x + W / 2, y + H / 2, 22, '#5cb4d8'); U.circle(c, x + W / 2, y + H / 2, 8, '#b8b2a2'); U.circle(c, x + W / 2, y + H / 2, 5, '#8d8678');
      R(c, x + W / 2 - 1, y + H / 2 - 14, 2, 14, '#bfe9f6');
      break;
    }
    case 'wallwindow': R(c, x + 2, y + 4, 12, 12, '#fff7e6'); R(c, x + 3, y + 5, 10, 10, '#9fd8f0'); R(c, x + 7, y + 5, 2, 10, '#fff7e6'); break;
    case 'poster': R(c, x + 3, y + 3, 10, 13, o.col || '#d65fa3'); R(c, x + 4, y + 4, 8, 4, '#fff7e6'); R(c, x + 5, y + 10, 6, 1, '#fff7e6'); break;
    case 'neon': R(c, x + 1, y + 4, W - 2, 8, '#15151c'); R(c, x + 2, y + 5, W - 4, 6, o.col || '#ff4fa0'); R(c, x + 3, y + 6, W - 6, 4, '#15151c'); break;
    case 'board': R(c, x + 1, y + 2, W - 2, 12, '#33333b'); R(c, x + 2, y + 3, W - 4, 10, '#2f5a3f'); for (let i = 0; i < w - 1; i++) R(c, x + 4 + i * 12, y + 5, 8, 1, '#e8e0c8'); break;
  }
};
})();
