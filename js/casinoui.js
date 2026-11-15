(() => {
'use strict';
const RG = window.RG, U = RG.U, UI = RG.UI, Sp = RG.Sp, C = RG.Casino;
const CU = RG.CasinoUI = {};
const W = 320, H = 200;
let cv, g, kind, raf, last, t, hot, mouse, scale;
let parts = [], prevKey = '';
const X = () => C.x;
const money = U.money;

/* ---------------- primitives ---------------- */
function rect(x, y, w, h, col) { g.fillStyle = col; g.fillRect(x, y, w, h); }
function panel(x, y, w, h, fill, edge) { rect(x + 1, y, w - 2, h, edge); rect(x, y + 1, w, h - 2, edge); rect(x + 1, y + 1, w - 2, h - 2, fill); }
function txt(s, x, y, col, al, sh, size) {
  g.font = (size || 10) + 'px Pixel'; g.textBaseline = 'top'; s = String(s);
  const w = g.measureText(s).width; if (al === 'c') x -= w / 2; else if (al === 'r') x -= w;
  x = Math.round(x); y = Math.round(y);
  if (sh !== false) { g.fillStyle = '#000'; g.fillText(s, x + 1, y + 1); }
  g.fillStyle = col || '#fff'; g.fillText(s, x, y);
  return w;
}
function tw(s) { g.font = '10px Pixel'; return g.measureText(String(s)).width; }
function wrap(s, maxW) { const out = []; let line = ''; for (const w of String(s).split(' ')) { const tt = line ? line + ' ' + w : w; if (tw(tt) > maxW && line) { out.push(line); line = w; } else line = tt; } if (line) out.push(line); return out; }
function pcircle(cx, cy, r, col) { g.fillStyle = col; for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y + 0.5)); g.fillRect(cx - w, cy + y, 2 * w + 1, 1); } }
const CHCOL = { 5: '#d8403a', 10: '#4b78c8', 25: '#4fb04f', 50: '#e8943b', 100: '#2a2a30', 500: '#a040c0', 1000: '#e8c030' };
function chipCol(v) { const ks = Object.keys(CHCOL).map(Number); let c = CHCOL[5]; for (const k of ks) if (v >= k) c = CHCOL[k]; return c; }
function chip(cx, cy, v, r) {
  r = r || 6; const col = chipCol(v);
  pcircle(cx, cy, r, '#1a1010'); pcircle(cx, cy, r - 1, col);
  g.fillStyle = '#fff'; g.fillRect(cx - 1, cy - r + 1, 2, 2); g.fillRect(cx - 1, cy + r - 2, 2, 2); g.fillRect(cx - r + 1, cy - 1, 2, 2); g.fillRect(cx + r - 2, cy - 1, 2, 2);
  pcircle(cx, cy, r - 3, 'rgba(0,0,0,.25)'); pcircle(cx, cy, r - 4, col);
}
function chipStack(cx, y, total) {
  const vals = [500, 100, 25, 10, 5]; let n = 0, rem = total;
  const list = []; for (const v of vals) { while (rem >= v && list.length < 8) { list.push(v); rem -= v; } }
  if (rem > 0 && list.length < 8) list.push(5);
  list.reverse().forEach((v, i) => { chip(cx, y - i * 3, v, 6); });
}
function btn(label, x, y, w, h, fn, o) {
  o = o || {}; if (!w) w = Math.ceil(tw(label)) + 10; if (!h) h = 14;
  const over = mouse.x >= x && mouse.x < x + w && mouse.y >= y && mouse.y < y + h && !o.off;
  const dn = over && mouse.down;
  const base = o.off ? '#9a8a70' : o.col || '#e6cf9a', hi = o.off ? '#9a8a70' : (over ? '#fff1c4' : base);
  panel(x, y + (dn ? 1 : 0), w, h, hi, '#4a2e1a');
  if (o.sel) { rect(x + 2, y + h - 3, w - 4, 1, '#c8503f'); }
  txt(label, x + w / 2, y + 2 + (dn ? 1 : 0), o.off ? '#6a5a40' : '#2b1b14', 'c', false);
  if (!o.off) hot.push({ x, y, w, h, fn });
  return w;
}
function hotArea(x, y, w, h, fn) { hot.push({ x, y, w, h, fn }); }
function hover(x, y, w, h) { return mouse.x >= x && mouse.x < x + w && mouse.y >= y && mouse.y < y + h; }
function bg(felt) {
  rect(0, 0, W, H, '#2a0f1a');
  for (let y = 0; y < H; y += 8) for (let x = ((y / 8) % 2) * 8; x < W; x += 16) rect(x, y, 8, 8, '#32121f');
  panel(2, 2, W - 4, H - 4, felt, '#4a2e1a');
  rect(4, 4, W - 8, 1, 'rgba(255,255,255,.12)');
}
function header(title) {
  rect(4, 4, W - 8, 12, 'rgba(0,0,0,.45)');
  txt(title, 8, 6, '#ffe36a');
  txt('Argent : ' + money(RG.S.money), W - 8, 6, '#9aff9a', 'r');
}
const sfx = n => U.sfx(n);

/* ---------------- confettis / pièces ---------------- */
function burst(x, y, n, cols) { for (let i = 0; i < n; i++) parts.push({ x, y, vx: (Math.random() - 0.5) * 140, vy: -60 - Math.random() * 120, c: cols[i % cols.length], life: 1.6 + Math.random() }); }
function drawParts(dt) {
  parts = parts.filter(p => (p.life -= dt) > 0 && p.y < H + 6);
  for (const p of parts) { p.vy += 260 * dt; p.x += p.vx * dt; p.y += p.vy * dt; rect(Math.round(p.x), Math.round(p.y), 2, 2, p.c); }
}
const WINCOL = ['#ffe36a', '#ff6a5a', '#6aff9a', '#6ac8ff', '#fff'];

/* ---------------- cartes ---------------- */
const SUIT = [
  ['...#...', '..###..', '.#####.', '#######', '#######', '...#...', '..###..'],
  ['.##.##.', '#######', '#######', '#######', '.#####.', '..###..', '...#...'],
  ['...#...', '..###..', '.#####.', '#######', '.#####.', '..###..', '...#...'],
  ['..###..', '..###..', '#.###.#', '#######', '#######', '..###..', '..###..']
];
function suit(x, y, s, col, k) { k = k || 1; g.fillStyle = col; const m = SUIT[s]; for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) if (m[j][i] === '#') g.fillRect(x + i * k, y + j * k, k, k); }
const cst = new WeakMap();
function cardFace(x, y, c, big) {
  const w = big ? 22 : 14, h = big ? 30 : 19, red = c.s === 1 || c.s === 2, col = red ? '#c8302f' : '#222';
  panel(x, y, w, h, '#fffaf0', '#2a1a10');
  txt(X().rk(c.r), x + 2, y + 1, col, 'l', false);
  if (big) suit(x + 4, y + 14, c.s, col, 2); else suit(x + 4, y + 11, c.s, col, 1);
}
function cardBack(x, y, big) {
  const w = big ? 22 : 14, h = big ? 30 : 19;
  panel(x, y, w, h, '#fffaf0', '#2a1a10'); rect(x + 2, y + 2, w - 4, h - 4, '#3a5ea8');
  for (let j = 0; j < h - 4; j += 2) for (let i = (j / 2) % 2; i < w - 4; i += 2) rect(x + 2 + i, y + 2 + j, 1, 1, '#6a8ad8');
}
// carte animée : vole depuis (fx,fy) vers (tx,ty), se retourne quand hidden passe à false
function card(c, tx, ty, hidden, big, fx, fy) {
  let st = cst.get(c); if (!st) { st = { t0: t, hid: hidden, flip: -9 }; cst.set(c, st); sfx('card'); }
  if (st.hid && !hidden) st.flip = t; st.hid = hidden;
  const p = Math.min(1, (t - st.t0) / 0.38), e = 1 - Math.pow(1 - p, 3);
  const x = Math.round(fx + (tx - fx) * e), y = Math.round(fy + (ty - fy) * e - Math.sin(p * Math.PI) * 6);
  if (p < 1) { cardBack(x, y, big); return; }
  const q = (t - st.flip) / 0.3;
  if (q >= 0 && q < 1) {
    const w = big ? 22 : 14, h = big ? 30 : 19, sx = Math.max(0.08, Math.abs(Math.cos(q * Math.PI)));
    g.save(); g.translate(x + w / 2, y); g.scale(sx, 1); g.translate(-w / 2, 0);
    if (q < 0.5) cardBack(0, 0, big); else cardFace(0, 0, c, big);
    g.restore(); return;
  }
  if (hidden) cardBack(x, y, big); else cardFace(x, y, c, big);
}
function shoe(x, y) { for (let i = 0; i < 4; i++) cardBack(x + i, y - i, true); }

/* ---------------- sprites ---------------- */
function sprite(ap, dir, x, y, alpha, bob) {
  const im = Sp.char(ap, dir, 0, false); g.globalAlpha = alpha == null ? 1 : alpha;
  g.drawImage(im, Math.round(x - im.width / 2), Math.round(y - im.height + 1 + (bob || 0))); g.globalAlpha = 1;
}
const DEALER_AP = (() => { const a = Sp.defaultAp(); a.shirt = '#222a33'; a.pants = '#222a33'; a.hair = 2; a.hairC = '#2a1a14'; return a; })();

/* =============================== ROULETTE =============================== */
const WR = 55, WS = 112;
let wimg, wang, wrad, wcol;
function wheelInit() {
  wimg = U.mk(WS, WS); wang = new Float32Array(WS * WS); wrad = new Float32Array(WS * WS);
  for (let j = 0; j < WS; j++) for (let i = 0; i < WS; i++) { const dx = i - WS / 2 + 0.5, dy = j - WS / 2 + 0.5; wang[j * WS + i] = Math.atan2(dy, dx); wrad[j * WS + i] = Math.sqrt(dx * dx + dy * dy); }
  const hx = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  wcol = { r: hx('#c8403a'), b: hx('#26262c'), g: hx('#2a8a4a'), gold: hx('#d9b25a'), gold2: hx('#b8923a'), wood: hx('#6a4a2a'), wood2: hx('#3a261a'), hub: hx('#8a5a3a'), pin: hx('#ffe9a0') };
}
function drawWheel(px, py) {
  const x = X(), ctx = wimg.getContext('2d'), id = ctx.createImageData(WS, WS), d = id.data, TAU = 6.2832, rot = x.rl.wheel;
  for (let k = 0; k < WS * WS; k++) {
    const r = wrad[k]; if (r > WR) continue;
    let c;
    if (r >= WR - 1) c = wcol.wood2; else if (r >= WR - 4) c = wcol.wood;
    else if (r >= WR * 0.6) {
      let a = (wang[k] - rot) % TAU; if (a < 0) a += TAU;
      const f = a / TAU * 37, idx = Math.floor(f), fr = f - idx, n = x.WHEEL[idx % 37];
      if (fr < 0.09) c = wcol.gold; else { const col = wcol[x.rlColor(n)]; c = r < WR * 0.66 ? col.map(v => v * 0.75) : col; }
    } else if (r >= WR * 0.4) c = (Math.abs(r - WR * 0.5) < 0.6) ? wcol.gold2 : wcol.gold;
    else {
      c = wcol.hub; const a = wang[k] - rot, sa = Math.abs(Math.sin(a * 2)); if (sa < 0.12 && r > 3) c = wcol.gold; if (r < 3) c = wcol.pin;
    }
    const o = k * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
  }
  ctx.putImageData(id, 0, 0); g.drawImage(wimg, px, py);
  // bille
  const rl = x.rl, cx = px + WS / 2, cy = py + WS / 2; let ba, br;
  const idx = rl.result === null ? -1 : x.WHEEL.indexOf(rl.result), target = rl.wheel + (idx + 0.5) / 37 * TAU;
  if (rl.phase === 'spin') { const k = Math.min(1, rl.spinT / 5); if (k < 0.75) { ba = -rl.spinT * 6; br = WR * (0.9 - 0.1 * (k / 0.75)); } else { const q = (k - 0.75) / 0.25; ba = target + (1 - q) * 2.5; br = WR * (0.8 - 0.1 * q); } }
  else if (idx >= 0) { ba = target; br = WR * 0.72; }
  if (ba !== undefined) { const bx = Math.round(cx + Math.cos(ba) * br), by = Math.round(cy + Math.sin(ba) * br); rect(bx - 1, by, 3, 3, '#222'); rect(bx - 1, by - 1, 3, 3, '#fff'); }
}
function sceneRoulette(dt) {
  const x = X(), rl = x.rl, S = RG.S;
  bg('#1b5e36'); header('ROULETTE');
  drawWheel(6, 20);
  if (rl.result !== null && rl.phase !== 'spin') { const col = rl.result === 0 ? '#2a8a4a' : x.RED.has(rl.result) ? '#c8403a' : '#26262c'; panel(6 + WS / 2 - 13, 20 + WS / 2 - 8, 26, 16, col, '#ffe9a0'); txt(rl.result, 6 + WS / 2, 20 + WS / 2 - 5, '#fff', 'c', false); }
  // phase
  const lab = rl.phase === 'bet' ? 'Mises ' + Math.ceil(rl.t) + 's' : rl.phase === 'spin' ? 'Rien ne va plus...' : 'Numero ' + rl.result;
  panel(6, 136, WS, 12, '#2a1a10', '#000'); const pr = rl.phase === 'bet' ? rl.t / 18 : rl.phase === 'spin' ? 1 - rl.spinT / 5 : rl.t / 5;
  rect(8, 138, Math.max(0, Math.round((WS - 4) * pr)), 8, rl.phase === 'bet' ? '#4fb04f' : rl.phase === 'spin' ? '#c8503f' : '#e8a93b');
  txt(lab, 6 + WS / 2, 138, '#fff', 'c');
  // historique
  txt('Derniers :', 6, 152, '#cfe8d0');
  rl.hist.slice(0, 7).forEach((n, i) => { const col = n === 0 ? '#2a8a4a' : x.RED.has(n) ? '#c8403a' : '#26262c'; panel(6 + i * 16, 163, 15, 13, col, '#000'); txt(n, 6 + i * 16 + 7.5, 164, '#fff', 'c', false); });
  // plateau
  const sum = {}; rl.bets.forEach(b => { sum[b.k] = (sum[b.k] || 0) + b.a; });
  let tip = '';
  const cell = (k, label, cx, cy, w, h, col) => {
    const ov = hover(cx, cy, w, h); panel(cx, cy, w, h, ov ? '#fff1c4' : col, '#e8e0c0');
    txt(label, cx + w / 2, cy + (h - 9) / 2, ov ? '#222' : '#fff', 'c', false);
    if (sum[k]) { chip(cx + w - 4, cy + h - 4, sum[k], 3); }
    if (ov) tip = k;
    hotArea(cx, cy, w, h, () => { if (X().rl.phase === 'bet') { if (C.rlDo('bet', k)) { sparkle(cx + w / 2, cy + h / 2); } } else UI.toast('Les mises sont closes.', 'err'); });
  };
  const BX = 140, BY = 20;
  cell('n:0', '0', BX - 14, BY, 14, 39, '#2a8a4a');
  for (let n = 1; n <= 36; n++) { const c = Math.floor((n - 1) / 3), r = 2 - ((n - 1) % 3); cell('n:' + n, n, BX + c * 14, BY + r * 13, 14, 13, x.RED.has(n) ? '#c8403a' : '#26262c'); }
  [['d1', '1-12'], ['d2', '13-24'], ['d3', '25-36']].forEach((a, i) => cell(a[0], a[1], BX + i * 56, BY + 41, 56, 12, '#1b5e36'));
  [['low', '1-18', '#1b5e36'], ['even', 'Pair', '#1b5e36'], ['red', 'Rouge', '#c8403a'], ['black', 'Noir', '#26262c'], ['odd', 'Impair', '#1b5e36'], ['high', '19-36', '#1b5e36']].forEach((a, i) => cell(a[0], a[1], BX + (i % 3) * 56, BY + 54 + Math.floor(i / 3) * 12, 56, 12, a[2]));
  // joueurs
  panel(126, 98, 190, 38, 'rgba(0,0,0,.35)', '#0c2a18');
  rl.bots.slice(0, 3).forEach((b, i) => {
    const s = b.bets && b.bets.length ? b.bets.map(q => q.a + ' ' + x.klab(q.k)).join(', ') : '...';
    txt(b.name + ' : ' + s, 130, 100 + i * 11, '#fff', 'l', true);
  });
  // résultat
  const tot = rl.bets.reduce((a, b) => a + b.a, 0);
  txt('Mise : ' + money(tot), 126, 138, '#ffe36a');
  if (tip) txt(tip.startsWith('n:') ? 'Plein ' + tip.slice(2) + ' (x36)' : x.klab(tip), 316, 138, '#cfe8d0', 'r');
  // jetons
  [5, 10, 25, 100, 500].forEach((v, i) => {
    const cx = 138 + i * 34, sel = rl.chip === v, cy = 160 - (sel ? 3 : 0);
    if (sel) pcircle(cx, cy, 9, '#ffe36a');
    chip(cx, cy, v, 8); txt(v, cx, 171, sel ? '#ffe36a' : '#cfe8d0', 'c');
    hotArea(cx - 9, 149, 18, 28, () => { C.rlDo('chip', v); sfx('click'); });
  });
  btn('Annuler', 126, 181, 0, 14, () => C.rlDo('undo'), { off: rl.phase !== 'bet' || !rl.bets.length });
  btn('Effacer', 180, 181, 0, 14, () => C.rlDo('clear'), { off: rl.phase !== 'bet' || !rl.bets.length });
  btn('Quitter', 268, 181, 0, 14, () => UI.closeModal(), { col: '#f0a090' });
  // effets de résultat
  if (rl.phase === 'show' && prevKey !== 'rls' + rl.hist.length) {
    prevKey = 'rls' + rl.hist.length;
    let back = 0; rl.bets.forEach(b => { back += b.a * x.rlWin(b.k, rl.result); });
    rl.showBack = back; rl.showBet = tot; if (back > tot) burst(62, 76, 40, WINCOL);
  }
  if (rl.phase === 'show' && rl.showBet) { const net = rl.showBack - rl.showBet; const pulse = Math.floor(t * 4) % 2 ? 1 : 0; txt(net > 0 ? 'GAGNE ' + money(net) + ' !' : net === 0 ? 'Mise rendue' : 'Perdu ' + money(-net), 62, 22 + pulse, net > 0 ? '#ffe36a' : '#ff9a9a', 'c'); }
  if (rl.phase === 'bet') prevKey = '';
}
function sparkle(x, y) { burst(x, y, 6, ['#ffe36a', '#fff']); }

/* =============================== BLACKJACK =============================== */
function sceneBJ(dt) {
  const x = X(), bj = x.bj, S = RG.S;
  bg('#1b5e36'); header('BLACKJACK');
  // table : arc
  sprite(DEALER_AP, 'down', 160, 38, 1);
  shoe(268, 36);
  txt('Le croupier tire a 17', 160, 148, 'rgba(255,255,255,.35)', 'c', false);
  const hide = bj.phase === 'play';
  const row = (hand, y, hid) => { const n = hand.length, x0 = Math.round(160 - (n * 26 - 4) / 2); hand.forEach((c, i) => card(c, x0 + i * 26, y, hid && i === 1, true, 268, 33)); };
  row(bj.d, 48, hide); row(bj.p, 100, false);
  if (bj.d.length) txt('Banque ' + (hide ? '?' : x.bjVal(bj.d)), 160, 80, '#fff', 'c');
  if (bj.p.length) txt('Toi ' + x.bjVal(bj.p), 160, 134, '#ffe36a', 'c');
  // mise
  if (bj.bet > 0) { chipStack(52, 126, bj.bet); txt(money(bj.bet), 52, 132, '#ffe36a', 'c'); } else txt('Mise : 0', 52, 120, '#cfe8d0', 'c');
  // message
  const lines = wrap(bj.msg, 150); lines.forEach((l, i) => txt(l, 160, 86 + i * 10 - (lines.length - 1) * 0, '#fff', 'c'));
  // actions
  if (bj.phase === 'bet' || bj.phase === 'done') {
    [5, 10, 25, 100, 500].forEach((v, i) => { const cx = 40 + i * 30, cy = 166; chip(cx, cy, v, 8); txt(v, cx, 176, '#cfe8d0', 'c'); hotArea(cx - 9, 156, 18, 30, () => C.bjDo('addbet', v)); });
    btn('Effacer', 190, 160, 0, 14, () => C.bjDo('clearbet'), { off: bj.phase !== 'bet' || bj.bet === 0 });
    btn(bj.phase === 'done' ? 'Nouvelle main' : 'Distribuer', 190, 178, 0, 14, () => C.bjDo('deal'), { col: '#a8e08a', off: bj.phase === 'bet' && bj.bet <= 0 });
  } else {
    btn('Tirer', 90, 164, 50, 16, () => C.bjDo('hit'), { col: '#a8e08a' });
    btn('Rester', 146, 164, 50, 16, () => C.bjDo('stand'));
    btn('Doubler', 202, 164, 50, 16, () => C.bjDo('double'), { off: !(bj.p.length === 2 && S.money >= bj.bet) });
  }
  btn('Quitter', 268, 181, 0, 14, () => UI.closeModal(), { col: '#f0a090' });
  if (bj.phase === 'done' && prevKey !== 'bj' + bj.msg + bj.p.length + bj.d.length) { prevKey = 'bj' + bj.msg + bj.p.length + bj.d.length; if (/^(Tu gagnes|Blackjack|La banque d)/.test(bj.msg)) burst(160, 100, 40, WINCOL); }
  if (bj.phase !== 'done') prevKey = '';
}

/* =============================== MACHINE A SOUS =============================== */
const SYMR = [
  ['......ggg...', '.....g..g...', '....g...g...', '...g....g...', '...g.....g..', '..g......g..', '.rrr....rrr.', 'rrwrr..rrwrr', 'rwrrR..rwrrR', 'rrrrR..rrrrR', '.rRR....rRR.', '............'],
  ['......gg....', '.....gg.....', '...yyyyyy...', '..yyyyyyyy..', '.yywyyyyyyy.', 'yyywyyyyyyyY', 'yyyyyyyyyyYY', 'yyyyyyyyyyYY', '.yyyyyyyyYY.', '..yyyyyYYY..', '...YYYYYY...', '............'],
  ['.....oo.....', '....oooo....', '...oowooo...', '..ooowoooO..', '..oooooooO..', '..oooooooO..', '.ooooooooOO.', '.ooooooooOO.', 'oooooooooOOO', 'OOOOOOOOOOOO', '....kkkk....', '....kkkk....'],
  ['.....yy.....', '.....yy.....', '....yyyy....', 'yyyyyyyyyyyy', '.yyyywyyyyy.', '..yyyyyyyy..', '...yyyyyy...', '..yyyyyyyy..', '..yyy..yyy..', '.yyy....yyy.', '.yy......yy.', '............'],
  ['............', '..bbbbbbbb..', '.bwbbbbbbbB.', 'bwbbbbbbbbbB', 'bbbbbbbbbbbB', '.bbbbbbbbbB.', '..bbbbbbbB..', '...bbbbbB...', '....bbbB....', '.....bB.....', '............', '............'],
  ['............', '.rrrrrrrrrr.', '.rwrrrrrrrR.', '.........rR.', '........rR..', '.......rR...', '......rR....', '.....rR.....', '.....rR.....', '....rR......', '....rR......', '............']
];
const SYMC = { g: '#3f7a2f', r: '#d8302f', R: '#8a1a1a', w: '#ffffff', y: '#f2d03a', Y: '#c9a820', o: '#e8b830', O: '#8a6a20', k: '#222222', b: '#3fc8e8', B: '#1a8aa8' };
const symCache = [];
function symImg(id) {
  if (symCache[id]) return symCache[id];
  const cv2 = U.mk(14, 14), c = cv2.getContext('2d');
  SYMR[id].forEach((row, j) => { for (let i = 0; i < 12; i++) { const ch = row[i]; if (ch !== '.') { c.fillStyle = SYMC[ch]; c.fillRect(i + 1, j + 1, 1, 1); } } });
  U.outline(cv2, U.OUT); return (symCache[id] = cv2);
}
function drawSym(id, x, y, k) { g.drawImage(symImg(id), Math.round(x), Math.round(y), 14 * (k || 2), 14 * (k || 2)); }
function sceneSlot(dt) {
  const x = X(), s = x.slot, S = RG.S;
  bg('#241020'); header('MACHINE A SOUS');
  const win = s.msg.startsWith('Gagn');
  const spinning = s.spin > 0, el = 1.4 - s.spin;
  // corps
  panel(66, 20, 188, 150, '#a8302a', '#e8c030'); panel(70, 24, 180, 142, '#c8403a', '#6a1a14');
  for (let i = 0; i < 22; i++) { const on = (Math.floor(t * (spinning ? 12 : win ? 8 : 3)) + i) % 2 === 0; rect(72 + i * 8, 26, 3, 3, on ? '#ffe36a' : '#8a5a10'); rect(72 + i * 8, 161, 3, 3, on ? '#ffe36a' : '#8a5a10'); }
  txt('JACKPOT', 160, 33, '#ffe36a', 'c');
  panel(80, 46, 160, 62, '#111', '#e8c030');
  for (let i = 0; i < 3; i++) {
    const rx = 84 + i * 52, ry = 50, rw = 48, rh = 54;
    rect(rx, ry, rw, rh, '#fffaf0'); rect(rx, ry, rw, 6, '#d8ccb0'); rect(rx, ry + rh - 6, rw, 6, '#d8ccb0');
    g.save(); g.beginPath(); g.rect(rx, ry, rw, rh); g.clip();
    const stopAt = 0.6 + i * 0.3, run = spinning && el < stopAt;
    if (run) { const sc = (t * 520) % 30, base = Math.floor(t * 520 / 30); for (let j = 0; j < 4; j++) drawSym(((base - j + i * 2) % 6 + 6) % 6, rx + 10, ry + rh / 2 - 14 + (j - 1) * 30 + sc, 2); rect(rx, ry, rw, rh, 'rgba(255,255,255,.18)'); }
    else { const q = spinning ? el - stopAt : 9, dy = q < 0.45 ? Math.round(Math.sin(q * 22) * Math.max(0, 5 - q * 12)) : 0; drawSym(s.reels[i], rx + 10, ry + rh / 2 - 14 + dy, 2); }
    g.restore();
    rect(rx, ry, rw, 1, '#000'); rect(rx, ry + rh - 1, rw, 1, '#000');
    if (win && !spinning && Math.floor(t * 6) % 2) { rect(rx, ry, rw, 2, '#ffe36a'); rect(rx, ry + rh - 2, rw, 2, '#ffe36a'); }
  }
  rect(80, 76, 160, 1, '#ff3030'); rect(76, 74, 4, 5, '#ff3030'); rect(240, 74, 4, 5, '#ff3030');
  txt(s.msg, 160, 112, win ? '#ffe36a' : '#fff', 'c');
  // mises
  [5, 10, 25, 50, 100].forEach((v, i) => btn(String(v), 82 + i * 32, 124, 28, 14, () => C.slotDo('sbet', v), { sel: s.bet === v, off: spinning, col: s.bet === v ? '#ffe9a0' : null }));
  btn('TOURNER  ' + money(s.bet), 100, 140, 120, 14, () => C.slotDo('spin'), { off: spinning, col: '#a8e08a' });
  // levier
  const pulled = spinning && el < 0.35; panel(270, 90, 8, 40, '#6a707c', '#222'); rect(272, 92, 2, 36, '#a8aeb8');
  const ly = pulled ? 110 : 70; rect(272, ly + 6, 4, 90 - ly + 6 > 0 ? 90 - ly : 4, '#a8aeb8'); pcircle(274, ly, 7, '#1a1010'); pcircle(274, ly, 6, '#d8403a'); rect(271, ly - 3, 2, 2, '#fff');
  hotArea(264, 56, 20, 70, () => C.slotDo('spin'));
  // table des gains
  panel(4, 20, 58, 134, 'rgba(0,0,0,.5)', '#4a2e1a'); txt('GAINS', 33, 23, '#ffe36a', 'c');
  const mult = x.SYM_MULT; for (let i = 0; i < 6; i++) { drawSym(i, 8, 34 + i * 19, 1); txt('x' + mult[i], 58, 38 + i * 19, '#fff', 'r'); }
  btn('Quitter', 268, 181, 0, 14, () => UI.closeModal(), { col: '#f0a090' });
  // pièces
  if (win && !spinning && prevKey !== 'sl' + s.msg + s.reels.join('')) { prevKey = 'sl' + s.msg + s.reels.join(''); burst(160, 90, 50, ['#ffe36a', '#e8c030', '#fff3a0']); }
  if (spinning) prevKey = '';
}

/* =============================== POKER =============================== */
const SEATP = [
  null,
  { sx: 24, sy: 104, dir: 'right', cx: 46, cy: 86, bx: 76, by: 110, lx: 24, ly: 107 },
  { sx: 60, sy: 52, dir: 'down', cx: 71, cy: 22, bx: 104, by: 52, lx: 60, ly: 54 },
  { sx: 260, sy: 52, dir: 'down', cx: 220, cy: 22, bx: 216, by: 52, lx: 260, ly: 54 },
  { sx: 296, sy: 104, dir: 'left', cx: 240, cy: 86, bx: 244, by: 110, lx: 296, ly: 107 }
];
const pkAp = [];
function seatAp(i, s) { if (s.human) return RG.S.ap; const ents = C.pokerEnts; if (ents && ents[i] && s.name === ents[i].name && ents[i].ap) return ents[i].ap; const k = s.name; return pkAp[k] || (pkAp[k] = RG.Ent.apFor(k)); }
function scenePoker(dt) {
  const x = X(), P = x.P, S = RG.S, me = P.seats[0].human, h = P.seats[0];
  rect(0, 0, W, H, '#1a0c14'); for (let y = 0; y < H; y += 8) for (let xx = ((y / 8) % 2) * 8; xx < W; xx += 16) rect(xx, y, 8, 8, '#20101a');
  rect(0, 0, W, 14, 'rgba(0,0,0,.6)');
  const logl = P.log[0] || ''; txt(logl.length > 46 ? logl.slice(0, 46) : logl, 6, 2, '#ffe9a0'); txt(money(S.money), W - 6, 2, '#9aff9a', 'r');
  U.ellipse(g, 160, 80, 124, 54, '#2a1a10'); U.ellipse(g, 160, 80, 120, 50, '#5a3a22'); U.ellipse(g, 160, 80, 114, 45, '#1b6a3e'); U.ellipse(g, 160, 80, 108, 40, '#1f7a46');
  txt('HOLD\'EM  5/10', 160, 36, 'rgba(255,255,255,.28)', 'c', false);
  // cartes communes
  for (let i = 0; i < 5; i++) { const bx = 95 + i * 26; if (P.board[i]) card(P.board[i], bx, 62, false, true, 160, 80); else { panel(bx, 62, 22, 30, 'rgba(0,0,0,.18)', 'rgba(0,0,0,.3)'); } }
  const pot = P.pot(); if (pot > 0) { chipStack(160, 108, Math.min(pot, 400)); txt('Pot ' + money(pot), 160, 110, '#ffe36a', 'c'); }
  // joueurs
  const winners = P.phase === 'show' && P.result ? P.result.win : [];
  for (let i = 1; i < 5; i++) {
    const s = P.seats[i], p = SEATP[i], act = P.toAct === i && P.phase !== 'show' && P.phase !== 'wait', bob = act ? Math.round(Math.sin(t * 8)) : 0;
    sprite(seatAp(i, s), p.dir, p.sx, p.sy, s.folded && s.inHand ? 0.45 : 1, bob);
    const win = winners.includes(i);
    const nm = s.name, w = Math.max(tw(nm), tw(money(s.stack))) + 6, lxx = Math.round(p.lx - w / 2), ly = p.ly;
    panel(Math.max(2, Math.min(W - 2 - w, lxx)), ly, w, 22, win && Math.floor(t * 6) % 2 ? '#ffe36a' : 'rgba(20,10,20,.85)', win ? '#ffe36a' : '#000');
    const lx2 = Math.max(2, Math.min(W - 2 - w, lxx)) + w / 2; txt(nm, lx2, ly + 1, win && Math.floor(t * 6) % 2 ? '#222' : '#fff', 'c', false); txt(money(s.stack), lx2, ly + 11, '#9aff9a', 'c', false);
    if (act) { const ax = p.sx, ay = p.sy - 40 + Math.round(Math.sin(t * 8) * 2); rect(ax - 3, ay, 7, 1, '#ffe36a'); rect(ax - 2, ay + 1, 5, 1, '#ffe36a'); rect(ax - 1, ay + 2, 3, 1, '#ffe36a'); rect(ax, ay + 3, 1, 1, '#ffe36a'); }
    if (s.inHand && s.hand.length && !s.folded) s.hand.forEach((c, k) => card(c, p.cx + k * 15, p.cy, !s.revealed, false, 160, 80));
    else if (s.folded && s.inHand) txt('Couche', p.sx, p.ly + 23, '#bbb', 'c');
    if (s.allin && s.inHand && !s.folded) txt('TAPIS', p.sx, p.ly + 23, '#ff6a5a', 'c');
    if (s.bet > 0) { chip(p.bx, p.by, s.bet, 5); txt(s.bet, p.bx + 8, p.by - 4, '#fff'); }
    if (P.dealer === i && P.phase !== 'wait') { pcircle(p.bx + (i % 3 === 1 ? -12 : 12), p.by - 12, 5, '#fff'); txt('D', p.bx + (i % 3 === 1 ? -12 : 12), p.by - 17, '#222', 'c', false); }
  }
  // moi
  const act0 = P.toAct === 0 && P.phase !== 'show' && P.phase !== 'wait' && me;
  if (me) {
    panel(6, 142, 92, 24, win0() ? '#ffe36a' : 'rgba(20,10,20,.85)', '#000');
    txt(h.name, 10, 144, win0() ? '#222' : '#fff', 'l', false); txt(money(h.stack), 10, 154, win0() ? '#222' : '#9aff9a', 'l', false);
    if (h.inHand && h.hand.length) h.hand.forEach((c, k) => { if (h.folded) return; card(c, 134 + k * 26, 138, false, true, 160, 80); });
    if (h.folded && h.inHand) txt('Tu t\'es couche', 160, 150, '#bbb', 'c');
    if (h.bet > 0) { chip(188, 130, h.bet, 5); txt(h.bet, 196, 126, '#fff'); }
    if (P.dealer === 0 && P.phase !== 'wait') { pcircle(116, 128, 5, '#fff'); txt('D', 116, 123, '#222', 'c', false); }
    if (act0) { txt('A TOI !', 160, 124 + Math.round(Math.sin(t * 8)), '#ffe36a', 'c'); }
  } else {
    txt('Place libre : prends un siege', 160, 140, '#cfe8d0', 'c');
  }
  function win0() { return winners.includes(0) && Math.floor(t * 6) % 2; }
  // résultat
  if (P.phase === 'show' && P.result) { wrap(P.result.text, 260).slice(0, 2).forEach((l, i) => { const w = tw(l) + 8; panel(Math.round(160 - w / 2), 121 + i * 12, w, 12, 'rgba(20,10,20,.92)', '#ffe36a'); txt(l, 160, 123 + i * 12, '#ffe36a', 'c', false); }); }
  // boutons
  if (!me) {
    if (P.pendingSit) txt('Place reservee pour la prochaine main', 6, 170, '#ffe9a0');
    let bx = 6; [200, 500, 1000].forEach(v => { bx += btn('Siege ' + v + ' $', bx, 180, 0, 14, () => C.pokerDo('sit', v), { off: S.money < v || !!P.pendingSit }) + 4; });
  } else {
    const need = P.cur - h.bet; let bx = 6, y = 180;
    bx += btn('Coucher', bx, y, 0, 14, () => C.pokerDo('fold'), { off: !act0, col: '#f0a090' }) + 4;
    bx += btn(need <= 0 ? 'Checker' : 'Suivre ' + Math.min(need, h.stack), bx, y, 0, 14, () => C.pokerDo(need <= 0 ? 'check' : 'call'), { off: !act0, col: '#a8e08a' }) + 4;
    bx += btn('Relance +' + P.betSize, bx, y, 0, 14, () => C.pokerDo('raise'), { off: !(act0 && P.raises < 3 && h.stack > need + P.betSize) }) + 4;
    btn('Tapis', bx, y, 0, 14, () => C.pokerDo('allin'), { off: !act0 });
    btn(P.leaving ? 'Part apres' : 'Lever', 270, 166, 0, 14, () => C.pokerDo('leave'), { col: '#e6cf9a' });
  }
  btn('Quitter', 270, 181, 0, 14, () => { UI.closeModal(); }, { col: '#f0a090' });
  if (P.phase === 'show' && P.result && winners.includes(0) && prevKey !== 'pk' + P.ver) { prevKey = 'pk' + P.ver; burst(160, 120, 40, WINCOL); }
  if (P.phase !== 'show') prevKey = '';
}

/* =============================== boucle & ouverture =============================== */
function frame(now) {
  raf = requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
  hot = [];
  g.imageSmoothingEnabled = false;
  if (kind === 'roulette') sceneRoulette(dt); else if (kind === 'blackjack') sceneBJ(dt); else if (kind === 'slot') sceneSlot(dt); else scenePoker(dt);
  drawParts(dt);
  const ov = hot.some(h => hover(h.x, h.y, h.w, h.h)); cv.style.cursor = ov ? 'pointer' : 'default';
}
function pos(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; }
function fit() { if (!cv) return; scale = Math.max(1, Math.floor(Math.min(innerWidth / W, innerHeight / H))); cv.style.width = W * scale + 'px'; cv.style.height = H * scale + 'px'; }
CU.open = k => {
  if (!wimg) wheelInit();
  kind = k; t = 0; hot = []; parts = []; prevKey = ''; mouse = { x: -9, y: -9, down: false };
  UI.modal({
    kind: 'cui', raw: true, title: '', cls: 'cui',
    render: () => '<canvas id="cui-c" width="' + W + '" height="' + H + '"></canvas>',
    after: el => {
      el.style.background = '#06030c'; cv = document.getElementById('cui-c'); g = cv.getContext('2d'); fit();
      cv.addEventListener('pointermove', e => { const p = pos(e); mouse.x = p.x; mouse.y = p.y; });
      cv.addEventListener('pointerdown', e => { const p = pos(e); mouse.x = p.x; mouse.y = p.y; mouse.down = true; });
      cv.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9; mouse.down = false; });
      addEventListener('pointerup', up);
      last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
    },
    onClose: () => { cancelAnimationFrame(raf); raf = 0; removeEventListener('pointerup', up); const m = document.getElementById('modal'); if (m) m.style.background = ''; cv = null; }
  });
};
function up(e) {
  if (!cv) return; const p = pos(e); mouse.down = false;
  for (let i = hot.length - 1; i >= 0; i--) { const h = hot[i]; if (p.x >= h.x && p.x < h.x + h.w && p.y >= h.y && p.y < h.y + h.h) { sfx('click'); h.fn(); break; } }
}
addEventListener('resize', fit);
})();
