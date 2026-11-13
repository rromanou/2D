(() => {
'use strict';
const RG = window.RG = window.RG || {};
RG.T = 16;
const U = RG.U = {};

/* ---------- aléatoire / maths ---------- */
U.rng = function (a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};
U.hash = function (x, y, s) {
  s = s || 0;
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
U.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
U.dist = (a, b, c, d) => Math.hypot(a - c, b - d);
U.pick = (arr, r) => arr[Math.floor((r ? r() : Math.random()) * arr.length)];
U.ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
U.shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
U.money = n => Math.round(n).toLocaleString('fr-CA').replace(/[  ]/g, ' ') + ' $';

/* ---------- canvas ---------- */
U.mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
U.R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
U.circle = (c, cx, cy, r, col) => {
  c.fillStyle = col;
  for (let y = -r; y <= r; y++) {
    const w = Math.floor(Math.sqrt(r * r - y * y));
    c.fillRect(cx - w, cy + y, 2 * w + 1, 1);
  }
};
U.ellipse = (c, cx, cy, rx, ry, col) => {
  c.fillStyle = col;
  for (let y = -ry; y <= ry; y++) {
    const w = Math.floor(rx * Math.sqrt(1 - (y * y) / (ry * ry + 0.0001)));
    c.fillRect(cx - w, cy + y, 2 * w + 1, 1);
  }
};
function hex2rgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
U.shade = (h, a) => {
  const f = v => Math.max(0, Math.min(255, Math.round(v + a)));
  return '#' + hex2rgb(h).map(f).map(v => v.toString(16).padStart(2, '0')).join('');
};
U.outline = (cv, col) => {
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
};
U.OUT = [58, 38, 28];
U.finish = (raw, flip, col) => {
  const cv = U.mk(raw.width + 2, raw.height + 2);
  const c = cv.getContext('2d');
  if (flip) { c.save(); c.translate(raw.width + 1, 1); c.scale(-1, 1); c.drawImage(raw, 0, 0); c.restore(); }
  else c.drawImage(raw, 1, 1);
  U.outline(cv, col || U.OUT);
  return cv;
};

/* ---------- police pixel 3x5 ---------- */
const GL = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
  K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
  P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
  Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110',
  '4': '101101111001001', '5': '111100110001110', '6': '011100111101111', '7': '111001010010010', '8': '111101111101111',
  '9': '111101111001110', '-': '000000111000000', '.': '000000000000010', '!': '010010010000010', '?': '110001010000010',
  ':': '000010000010000', '/': '001001010100100', '+': '000010111010000', "'": '010010000000000', '$': '011110010011110',
  ',': '000000000010100', '(': '001010010010001', ')': '100010010010100', '*': '101010111010101', '#': '101111101111101', '%': '101001010100101'
};
U.norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
U.textW = s => String(s).length * 4 - 1;
U.drawText = (c, s, x, y, col, sh) => {
  s = U.norm(s);
  const pass = (ox, oy, color) => {
    c.fillStyle = color;
    let px = x + ox;
    for (let i = 0; i < s.length; i++) {
      const g = GL[s[i]];
      if (g) for (let k = 0; k < 15; k++) if (g[k] === '1') c.fillRect(px + (k % 3), y + oy + ((k / 3) | 0), 1, 1);
      px += 4;
    }
  };
  if (sh) pass(1, 1, sh);
  pass(0, 0, col);
};

/* ---------- sons ---------- */
U.sound = true;
let ac = null;
function actx() {
  if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } }
  return ac;
}
function tone(f, d, type, v, delay) {
  const a = actx(); if (!a) return;
  try {
    const t = a.currentTime + (delay || 0);
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(v || 0.04, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(a.destination);
    o.start(t); o.stop(t + d + 0.02);
  } catch (e) {}
}
function noise(d, v) {
  const a = actx(); if (!a) return;
  try {
    const n = Math.floor(a.sampleRate * d);
    const b = a.createBuffer(1, n, a.sampleRate);
    const ch = b.getChannelData(0);
    for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = a.createBufferSource(); s.buffer = b;
    const g = a.createGain(); g.gain.value = v || 0.08;
    s.connect(g); g.connect(a.destination); s.start();
  } catch (e) {}
}
U.sfx = n => {
  if (!U.sound) return;
  switch (n) {
    case 'coin': tone(988, .07, 'square', .035); tone(1319, .12, 'square', .035, .07); break;
    case 'buy': tone(660, .06, 'triangle', .06); tone(880, .1, 'triangle', .06, .06); break;
    case 'err': tone(160, .18, 'sawtooth', .04); break;
    case 'click': tone(520, .04, 'square', .025); break;
    case 'door': tone(220, .08, 'triangle', .06); tone(330, .1, 'triangle', .05, .07); break;
    case 'win': [523, 659, 784, 1047].forEach((f, i) => tone(f, .14, 'square', .04, i * .09)); break;
    case 'lose': [330, 262, 196].forEach((f, i) => tone(f, .18, 'triangle', .05, i * .12)); break;
    case 'alarm': for (let i = 0; i < 4; i++) { tone(760, .14, 'square', .04, i * .3); tone(560, .14, 'square', .04, i * .3 + .15); } break;
    case 'shot': noise(.18, .12); tone(110, .12, 'sawtooth', .05); break;
    case 'talk': tone(300 + Math.random() * 120, .04, 'square', .02); break;
    case 'eat': tone(250, .05, 'triangle', .06); tone(230, .05, 'triangle', .06, .08); tone(250, .05, 'triangle', .06, .16); break;
    case 'cash': tone(1200, .05, 'square', .03); tone(1500, .08, 'square', .03, .05); break;
    case 'card': noise(.05, .05); break;
    case 'spin': for (let i = 0; i < 8; i++) tone(400 + i * 30, .05, 'square', .02, i * .06); break;
  }
};
})();
