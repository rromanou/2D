(() => {
'use strict';

/* ------------------------------------------------------------------ */
/*  Constantes et utilitaires                                          */
/* ------------------------------------------------------------------ */
const T = 16;            // taille d'une tuile (px)
const MW = 64, MH = 48;  // taille de la carte (tuiles)
const G = 0, P = 1, W = 2, S = 3; // herbe, chemin, eau, sable

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hud = document.getElementById('hud');

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hash(x, y, s) {
  s = s || 0;
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const rand = mulberry32(20261113);

function mk(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
function R(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }
function circle(c, cx, cy, r, col) {
  c.fillStyle = col;
  for (let y = -r; y <= r; y++) {
    const w = Math.floor(Math.sqrt(r * r - y * y));
    c.fillRect(cx - w, cy + y, 2 * w + 1, 1);
  }
}

/* Contour 1px autour des pixels opaques */
function outline(cv, col) {
  const c = cv.getContext('2d');
  const w = cv.width, h = cv.height;
  const id = c.getImageData(0, 0, w, h);
  const d = id.data;
  const out = new Uint8ClampedArray(d);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (d[i + 3] !== 0) continue;
      const n = (x > 0 && d[i - 4 + 3] > 0) || (x < w - 1 && d[i + 4 + 3] > 0) ||
                (y > 0 && d[i - w * 4 + 3] > 0) || (y < h - 1 && d[i + w * 4 + 3] > 0);
      if (n) { out[i] = col[0]; out[i + 1] = col[1]; out[i + 2] = col[2]; out[i + 3] = 255; }
    }
  }
  c.putImageData(new ImageData(out, w, h), 0, 0);
}
function finish(raw, col, flip) {
  const cv = mk(raw.width + 2, raw.height + 2);
  const c = cv.getContext('2d');
  if (flip) {
    c.save();
    c.translate(raw.width + 1, 1);
    c.scale(-1, 1);
    c.drawImage(raw, 0, 0);
    c.restore();
  } else {
    c.drawImage(raw, 1, 1);
  }
  outline(cv, col);
  return cv;
}

/* ------------------------------------------------------------------ */
/*  Génération de la carte                                             */
/* ------------------------------------------------------------------ */
const tiles = Array.from({ length: MH }, () => new Array(MW).fill(G));
const blocked = Array.from({ length: MH }, () => new Array(MW).fill(false));
const tAt = (x, y) => (x < 0 || y < 0 || x >= MW || y >= MH) ? -1 : tiles[y][x];

// Chemins en croix (2 tuiles de large)
for (let x = 0; x < MW; x++) { tiles[24][x] = P; tiles[25][x] = P; }
for (let y = 0; y < MH; y++) { tiles[y][20] = P; tiles[y][21] = P; }

// Maisons (empreinte 5x3 tuiles, toit au-dessus)
const houses = [
  { x: 24, y: 16, roof: 'red' },
  { x: 8,  y: 17, roof: 'blue' }
];
for (const h of houses) {
  for (let y = h.y + 3; y <= 23; y++) tiles[y][h.x + 2] = P;
  for (let y = h.y; y < h.y + 3; y++)
    for (let x = h.x; x < h.x + 5; x++) blocked[y][x] = true;
}

// Étang + sable
const pond = { cx: 46, cy: 14, rx: 8, ry: 5.5 };
for (let y = 0; y < MH; y++) {
  for (let x = 0; x < MW; x++) {
    const d = Math.pow((x - pond.cx) / pond.rx, 2) + Math.pow((y - pond.cy) / pond.ry, 2);
    if (d < 1) { tiles[y][x] = W; blocked[y][x] = true; }
    else if (d < 1.45 && tiles[y][x] === G) tiles[y][x] = S;
  }
}

function nearType(x, y, r, type) {
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++)
      if (tAt(x + dx, y + dy) === type) return true;
  return false;
}
const inHouseZone = (x, y) =>
  houses.some(h => x >= h.x - 1 && x <= h.x + 5 && y >= h.y - 1 && y <= h.y + 3);

// Arbres
const SPAWN_TX = 22, SPAWN_TY = 23;
const trees = [];
for (let ty = 0; ty < MH; ty++) {
  for (let tx = 0; tx < MW; tx++) {
    const ring1 = tx === 0 || ty === 0 || tx === MW - 1 || ty === MH - 1;
    const tp = tiles[ty][tx];
    let place = false;
    if (ring1) {
      place = tp !== W;
    } else if (tp === G && !blocked[ty][tx] && !inHouseZone(tx, ty)) {
      if (Math.hypot(tx - SPAWN_TX, ty - SPAWN_TY) < 5) place = false;
      else if (nearType(tx, ty, 1, P) || nearType(tx, ty, 1, S) || nearType(tx, ty, 1, W)) place = false;
      else if (tx < 3 || ty < 3 || tx >= MW - 3 || ty >= MH - 3) place = hash(tx, ty, 3) < 0.75;
      else {
        const n = hash(tx >> 2, ty >> 2, 7);
        place = hash(tx, ty, 5) < (n > 0.62 ? 0.4 : 0.025);
      }
    }
    if (place) {
      const v = hash(tx, ty, 9);
      trees.push({ tx, ty, v: v < 0.5 ? 0 : v < 0.78 ? 1 : 2 });
      blocked[ty][tx] = true;
    }
  }
}
// Bordure infranchissable
for (let x = 0; x < MW; x++) { blocked[0][x] = true; blocked[MH - 1][x] = true; }
for (let y = 0; y < MH; y++) { blocked[y][0] = true; blocked[y][MW - 1] = true; }

/* ------------------------------------------------------------------ */
/*  Rendu du sol (pré-calculé une fois)                                */
/* ------------------------------------------------------------------ */
const bg = mk(MW * T, MH * T);
(function renderGround() {
  const b = bg.getContext('2d');
  const edge = (x, y, d, col) => {
    if (d === 0) R(b, x, y, T, 1, col);
    else if (d === 1) R(b, x, y + T - 1, T, 1, col);
    else if (d === 2) R(b, x, y, 1, T, col);
    else R(b, x + T - 1, y, 1, T, col);
  };
  const D = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  const flowerCols = ['#ffffff', '#f48fb1', '#ffd54f', '#ba9cf0', '#ff8a65'];

  for (let ty = 0; ty < MH; ty++) {
    for (let tx = 0; tx < MW; tx++) {
      const x = tx * T, y = ty * T, tp = tiles[ty][tx];
      if (tp === G) {
        R(b, x, y, T, T, ((tx + ty) & 1) ? '#88c76d' : '#84c36a');
        for (let i = 0; i < 5; i++) {
          const sx = Math.floor(hash(tx, ty, i * 2) * 14);
          const sy = Math.floor(hash(tx, ty, i * 2 + 1) * 16);
          R(b, x + sx, y + sy, 2, 1, (i & 1) ? '#7bb961' : '#93cf76');
        }
      } else if (tp === P) {
        R(b, x, y, T, T, '#dcc08e');
        for (let i = 0; i < 5; i++) {
          const sx = Math.floor(hash(tx, ty, i * 3 + 50) * 14);
          const sy = Math.floor(hash(tx, ty, i * 3 + 51) * 15);
          R(b, x + sx, y + sy, 2, 1, '#cfae7a');
        }
        for (let d = 0; d < 4; d++) {
          const n = tAt(tx + D[d][0], ty + D[d][1]);
          if (n !== P && n !== -1) edge(x, y, d, '#c4a26e');
        }
      } else if (tp === S) {
        R(b, x, y, T, T, '#ecdcab');
        for (let i = 0; i < 4; i++) {
          const sx = Math.floor(hash(tx, ty, i + 70) * 14);
          const sy = Math.floor(hash(tx, ty, i + 80) * 15);
          R(b, x + sx, y + sy, 2, 1, '#e0cd96');
        }
        for (let d = 0; d < 4; d++) {
          if (tAt(tx + D[d][0], ty + D[d][1]) === W) edge(x, y, d, '#d6c28c');
        }
      } else if (tp === W) {
        R(b, x, y, T, T, '#5cb4d8');
        for (let i = 0; i < 2; i++) {
          const sy = Math.floor(hash(tx, ty, i + 90) * 14) + 1;
          R(b, x, y + sy, T, 1, '#54a9ce');
        }
        for (let d = 0; d < 4; d++) {
          const n = tAt(tx + D[d][0], ty + D[d][1]);
          if (n !== W && n !== -1) edge(x, y, d, '#a6dff0');
        }
      }
    }
  }

  // Décor : touffes et fleurs
  for (let ty = 0; ty < MH; ty++) {
    for (let tx = 0; tx < MW; tx++) {
      if (tiles[ty][tx] !== G || blocked[ty][tx]) continue;
      const x = tx * T, y = ty * T;
      if (hash(tx, ty, 100) < 0.16) {
        const ox = 3 + Math.floor(hash(tx, ty, 101) * 10);
        const oy = 3 + Math.floor(hash(tx, ty, 102) * 9);
        R(b, x + ox - 1, y + oy + 1, 1, 2, '#5f9f4f');
        R(b, x + ox, y + oy, 1, 3, '#5f9f4f');
        R(b, x + ox + 1, y + oy + 1, 1, 2, '#5f9f4f');
      }
      if (hash(tx, ty, 110) < 0.07) {
        const ox = 3 + Math.floor(hash(tx, ty, 111) * 10);
        const oy = 3 + Math.floor(hash(tx, ty, 112) * 10);
        const col = flowerCols[Math.floor(hash(tx, ty, 113) * flowerCols.length)];
        R(b, x + ox, y + oy - 1, 1, 1, col);
        R(b, x + ox, y + oy + 1, 1, 1, col);
        R(b, x + ox - 1, y + oy, 1, 1, col);
        R(b, x + ox + 1, y + oy, 1, 1, col);
        R(b, x + ox, y + oy, 1, 1, '#ffd54f');
      }
    }
  }

  // Ombres des arbres
  b.fillStyle = 'rgba(0,0,0,0.20)';
  for (const t of trees) {
    const cx = t.tx * T + 8, by = t.ty * T + 15;
    b.fillRect(cx - 8, by - 3, 16, 1);
    b.fillRect(cx - 10, by - 2, 20, 2);
    b.fillRect(cx - 8, by, 16, 1);
  }
  // Ombres des maisons
  for (const h of houses) {
    b.fillRect(h.x * T + 2, (h.y + 3) * T - 2, 5 * T + 6, 6);
  }
})();

/* ------------------------------------------------------------------ */
/*  Sprites                                                            */
/* ------------------------------------------------------------------ */
const OUTLINE = [58, 38, 28];

/* Arbres */
const TREE_PAL = [
  ['#2f7d3f', '#3f9a4d', '#62b866'],
  ['#3a8a62', '#4aa878', '#72c79a'],
  ['#b8531f', '#e07a2b', '#f2a54a']
];
function makeTree(v) {
  const raw = mk(32, 40);
  const c = raw.getContext('2d');
  const [dk, md, lt] = TREE_PAL[v];
  // tronc
  R(c, 13, 28, 6, 10, '#8a5a3a');
  R(c, 16, 28, 3, 10, '#74482e');
  R(c, 12, 36, 8, 2, '#74482e');
  // feuillage
  const lobes = [[16, 13, 11], [9, 19, 8], [23, 19, 8], [16, 21, 10]];
  for (const l of lobes) circle(c, l[0], l[1], l[2], dk);
  for (const l of lobes) circle(c, l[0] - 1, l[1] - 2, l[2] - 2, md);
  for (const l of lobes) if (l[2] - 5 > 1) circle(c, l[0] - 3, l[1] - 4, l[2] - 5, lt);
  for (let i = 0; i < 16; i++) {
    const x = 5 + Math.floor(rand() * 22), y = 4 + Math.floor(rand() * 24);
    if (Math.hypot(x - 16, y - 17) < 10) R(c, x, y, 2, 1, i & 1 ? dk : lt);
  }
  return finish(raw, OUTLINE);
}
const treeSprites = [0, 1, 2].map(makeTree);

/* Maisons */
function makeHouse(kind) {
  const raw = mk(80, 80);
  const c = raw.getContext('2d');
  const rc = kind === 'red'
    ? ['#c8503f', '#b3453a', '#8f3a30']
    : ['#4b78c8', '#4168b2', '#33528c'];
  // murs
  R(c, 4, 32, 72, 46, '#f3e4c2');
  for (let y = 36; y < 78; y += 8) R(c, 4, y, 72, 1, '#e4d0a6');
  R(c, 70, 32, 6, 46, '#e0cca2');
  R(c, 4, 78, 72, 2, '#9a9486');
  // toit
  for (let y = 0; y < 32; y++) {
    const inset = Math.floor((31 - y) * 12 / 31);
    R(c, inset, y, 80 - 2 * inset, 1, ((y >> 2) & 1) ? rc[0] : rc[1]);
  }
  for (let y = 0; y < 32; y += 4) {
    const inset = Math.floor((31 - y) * 12 / 31);
    for (let x = ((y >> 2) & 1) * 4; x < 80; x += 8) {
      if (x > inset + 1 && x < 80 - inset - 2) R(c, x, y, 1, 4, rc[2]);
    }
  }
  R(c, 0, 28, 80, 4, rc[2]);
  // cheminée
  R(c, 62, 3, 8, 12, '#a45a4a');
  R(c, 61, 0, 10, 3, '#8a4a3c');
  R(c, 64, 7, 2, 1, '#b87060');
  R(c, 67, 10, 2, 1, '#b87060');
  // ombre sous l'avant-toit
  R(c, 4, 32, 72, 2, '#c9b48a');
  // porte
  R(c, 30, 50, 20, 28, '#fff7e6');
  R(c, 32, 52, 16, 26, '#8b5a3c');
  R(c, 34, 54, 5, 9, '#7a4b30');
  R(c, 41, 54, 5, 9, '#7a4b30');
  R(c, 34, 65, 5, 10, '#7a4b30');
  R(c, 41, 65, 5, 10, '#7a4b30');
  R(c, 44, 66, 2, 2, '#f4d06f');
  R(c, 28, 76, 24, 2, '#b8b2a2');
  // fenêtres
  for (const wx of [10, 58]) {
    R(c, wx - 1, 48, 14, 16, '#fff7e6');
    R(c, wx, 49, 12, 14, '#9fd8f0');
    R(c, wx + 5, 49, 2, 14, '#fff7e6');
    R(c, wx, 55, 12, 2, '#fff7e6');
    R(c, wx + 1, 50, 3, 4, '#cfeefa');
    R(c, wx - 2, 63, 16, 3, '#8b5a3c');
    R(c, wx, 61, 2, 2, '#f48fb1');
    R(c, wx + 4, 61, 2, 2, '#fff176');
    R(c, wx + 8, 61, 2, 2, '#f48fb1');
    R(c, wx + 2, 62, 2, 1, '#5f9f4f');
    R(c, wx + 6, 62, 2, 1, '#5f9f4f');
  }
  return finish(raw, OUTLINE);
}
const houseSprites = { red: makeHouse('red'), blue: makeHouse('blue') };

/* Personnage */
function leg(c, x, lift) {
  R(c, x, 17, 3, 5 - lift, '#4a5d8f');
  R(c, x, 22 - lift, 3, 2, '#4a3426');
}
function drawRaw(c, dir, f) {
  const skin = '#f7cfa5', hair = '#6a4126', hairL = '#8a5a35';
  const shirt = '#e4694f', shirtS = '#c9553d';
  const eye = '#2b1b14', blush = '#f2a08a', mouth = '#b5594a';
  const lift1 = f === 1 ? 1 : 0, lift2 = f === 2 ? 1 : 0;
  const arm1 = f === 1 ? -1 : f === 2 ? 1 : 0, arm2 = -arm1;

  if (dir === 'down' || dir === 'up') {
    leg(c, 5, lift1); leg(c, 8, lift2);
    R(c, 4, 11, 8, 7, shirt);
    R(c, 4, 16, 8, 2, shirtS);
    R(c, 2, 12 + arm1, 2, 5, shirt); R(c, 2, 17 + arm1, 2, 2, skin);
    R(c, 12, 12 + arm2, 2, 5, shirt); R(c, 12, 17 + arm2, 2, 2, skin);
    R(c, 3, 0, 10, 11, skin);
    if (dir === 'down') {
      R(c, 3, 0, 10, 4, hair);
      R(c, 3, 4, 2, 3, hair); R(c, 11, 4, 2, 3, hair);
      R(c, 5, 4, 2, 1, hair); R(c, 9, 4, 2, 1, hair);
      R(c, 5, 1, 5, 1, hairL);
      R(c, 5, 6, 1, 2, eye); R(c, 10, 6, 1, 2, eye);
      R(c, 4, 8, 2, 1, blush); R(c, 10, 8, 2, 1, blush);
      R(c, 7, 9, 2, 1, mouth);
    } else {
      R(c, 3, 0, 10, 10, hair);
      R(c, 5, 1, 5, 1, hairL);
    }
  } else {
    const A = f === 1 ? [4, 0] : f === 2 ? [6, 1] : [5, 0];
    const B = f === 1 ? [9, 1] : f === 2 ? [7, 0] : [8, 0];
    leg(c, A[0], A[1]); leg(c, B[0], B[1]);
    R(c, 5, 11, 6, 7, shirt);
    R(c, 5, 16, 6, 2, shirtS);
    const ax = f === 1 ? -1 : f === 2 ? 1 : 0;
    R(c, 6 + ax, 12, 3, 5, shirtS);
    R(c, 6 + ax, 17, 3, 2, skin);
    R(c, 3, 0, 10, 11, skin);
    R(c, 3, 0, 10, 4, hair);
    R(c, 8, 4, 5, 6, hair);
    R(c, 3, 4, 3, 1, hair);
    R(c, 5, 1, 5, 1, hairL);
    R(c, 5, 6, 1, 2, eye);
    R(c, 4, 8, 2, 1, blush);
    R(c, 5, 9, 1, 1, mouth);
  }
  // coins arrondis de la tête
  c.clearRect(3, 0, 1, 1); c.clearRect(12, 0, 1, 1);
  c.clearRect(3, 10, 1, 1); c.clearRect(12, 10, 1, 1);
}
function makePlayer(dir, f) {
  const raw = mk(16, 24);
  const c = raw.getContext('2d');
  drawRaw(c, dir === 'right' ? 'left' : dir, f);
  return finish(raw, OUTLINE, dir === 'right');
}
const playerSprites = {};
for (const d of ['down', 'up', 'left', 'right'])
  playerSprites[d] = [0, 1, 2].map(f => makePlayer(d, f));
const WALK_SEQ = [0, 1, 0, 2];

/* ------------------------------------------------------------------ */
/*  Entrées                                                            */
/* ------------------------------------------------------------------ */
const keys = { left: false, right: false, up: false, down: false, run: false };
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ShiftLeft: 'run', ShiftRight: 'run'
};
function setKey(e, v) {
  const k = KEYMAP[e.code];
  if (!k) return;
  keys[k] = v;
  if (e.preventDefault) e.preventDefault();
  if (v && hud) hud.classList.add('hide');
}
addEventListener('keydown', e => setKey(e, true));
addEventListener('keyup', e => setKey(e, false));
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

const ptr = { on: false, x: 0, y: 0 };
canvas.addEventListener('pointerdown', e => {
  ptr.on = true; ptr.x = e.clientX; ptr.y = e.clientY;
  if (hud) hud.classList.add('hide');
});
addEventListener('pointermove', e => { if (ptr.on) { ptr.x = e.clientX; ptr.y = e.clientY; } });
addEventListener('pointerup', () => { ptr.on = false; });
addEventListener('pointercancel', () => { ptr.on = false; });

/* ------------------------------------------------------------------ */
/*  État du joueur et collisions                                       */
/* ------------------------------------------------------------------ */
let px = SPAWN_TX * T + 8, py = SPAWN_TY * T + 10; // position des pieds
let facing = 'down';
let anim = 0;

function solid(x, y) {
  const tx = Math.floor(x / T), ty = Math.floor(y / T);
  if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return true;
  return blocked[ty][tx];
}
function hit(x, y) {
  const hw = 5, hh = 4;
  return solid(x - hw, y - 1) || solid(x + hw, y - 1) ||
         solid(x - hw, y - hh) || solid(x + hw, y - hh);
}
function move(dx, dy) {
  if (dx) { const nx = px + dx; if (!hit(nx, py)) px = nx; }
  if (dy) { const ny = py + dy; if (!hit(px, ny)) py = ny; }
}

/* ------------------------------------------------------------------ */
/*  Caméra / affichage                                                 */
/* ------------------------------------------------------------------ */
let VW = 320, VH = 180, scale = 3, camX = 0, camY = 0;

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  scale = Math.max(2, Math.floor(Math.min(h / 200, w / 280)));
  VW = Math.ceil(w / scale);
  VH = Math.ceil(h / scale);
  canvas.width = VW;
  canvas.height = VH;
  canvas.style.width = (VW * scale) + 'px';
  canvas.style.height = (VH * scale) + 'px';
  ctx.imageSmoothingEnabled = false;
}
addEventListener('resize', resize);
resize();

function clampCam(v, min, max) {
  if (max < min) return Math.round((min + max) / 2);
  return Math.max(min, Math.min(max, Math.round(v)));
}

/* ------------------------------------------------------------------ */
/*  Boucle de jeu                                                      */
/* ------------------------------------------------------------------ */
function update(dt) {
  let ax = 0, ay = 0, run = keys.run;
  if (keys.left) ax--;
  if (keys.right) ax++;
  if (keys.up) ay--;
  if (keys.down) ay++;
  if (!ax && !ay && ptr.on) {
    const dx = ptr.x / scale + camX - px;
    const dy = ptr.y / scale + camY - (py - 8);
    const d = Math.hypot(dx, dy);
    if (d > 6) { ax = dx; ay = dy; if (d > 90) run = true; }
  }
  const len = Math.hypot(ax, ay);
  if (len > 0) {
    ax /= len; ay /= len;
    const speed = run ? 84 : 52;
    move(ax * speed * dt, ay * speed * dt);
    if (Math.abs(ax) > Math.abs(ay)) facing = ax < 0 ? 'left' : 'right';
    else if (Math.abs(ay) > Math.abs(ax)) facing = ay < 0 ? 'up' : 'down';
    else facing = ax < 0 ? 'left' : 'right';
    anim += dt * (run ? 11 : 7.5);
  } else {
    anim = 0;
  }
}

function render(t) {
  camX = clampCam(px - VW / 2, -16, MW * T - VW + 16);
  camY = clampCam(py - 10 - VH / 2, -24, MH * T - VH + 8);

  ctx.fillStyle = '#2f6b3a';
  ctx.fillRect(0, 0, VW, VH);
  ctx.drawImage(bg, -camX, -camY);

  // scintillement de l'eau
  const tx0 = Math.max(0, Math.floor(camX / T)), tx1 = Math.min(MW - 1, Math.floor((camX + VW) / T));
  const ty0 = Math.max(0, Math.floor(camY / T)), ty1 = Math.min(MH - 1, Math.floor((camY + VH) / T));
  ctx.fillStyle = '#d8f4fb';
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      if (tiles[ty][tx] !== W) continue;
      for (let k = 0; k < 2; k++) {
        const ph = t * 1.3 + hash(tx, ty, k + 20) * 6.28;
        if (Math.sin(ph) > 0.55) {
          const sx = tx * T + 2 + Math.floor(hash(tx, ty, k + 30) * 10);
          const sy = ty * T + 3 + Math.floor(hash(tx, ty, k + 40) * 10);
          ctx.fillRect(sx - camX, sy - camY, 3, 1);
        }
      }
    }
  }

  // objets triés par profondeur
  const list = [];
  for (const tr of trees) {
    const x = tr.tx * T - 9, y = tr.ty * T - 24;
    if (x > camX + VW || x + 34 < camX || y > camY + VH || y + 42 < camY) continue;
    list.push({ k: 0, s: tr.ty * T + 16, o: tr });
  }
  for (const h of houses) {
    const x = h.x * T - 1, y = (h.y - 2) * T - 1;
    if (x > camX + VW || x + 82 < camX || y > camY + VH || y + 82 < camY) continue;
    list.push({ k: 1, s: (h.y + 3) * T, o: h });
  }
  list.push({ k: 2, s: py, o: null });
  list.sort((a, b) => a.s - b.s);

  for (const it of list) {
    if (it.k === 0) {
      const tr = it.o;
      ctx.drawImage(treeSprites[tr.v], tr.tx * T - 9 - camX, tr.ty * T - 24 - camY);
    } else if (it.k === 1) {
      const h = it.o;
      ctx.drawImage(houseSprites[h.roof], h.x * T - 1 - camX, (h.y - 2) * T - 1 - camY);
    } else {
      const sx = Math.round(px) - camX, sy = Math.round(py) - 1 - camY;
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(sx - 4, sy - 2, 8, 1);
      ctx.fillRect(sx - 6, sy - 1, 12, 2);
      ctx.fillRect(sx - 4, sy + 1, 8, 1);
      const fr = anim > 0 ? WALK_SEQ[Math.floor(anim) % 4] : 0;
      ctx.drawImage(playerSprites[facing][fr], Math.round(px) - 9 - camX, Math.round(py) - 25 - camY);
    }
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  update(dt);
  render(now / 1000);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

})();
