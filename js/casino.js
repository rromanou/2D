(() => {
'use strict';
const RG = window.RG, U = RG.U, UI = RG.UI, D = RG.Data, E = RG.Ent, Sp = RG.Sp, T = RG.T;
const C = RG.Casino = {};
const $ = id => document.getElementById(id);
const G = () => RG.Game;
const money = U.money;
const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const CHIPS = [5, 10, 25, 100, 500];
const BOTNAMES = ['Roger', 'Colette', 'Fernand', 'Gisèle', 'Maurice', 'Pauline', 'Étienne', 'Josée', 'Lucien', 'Denise', 'Armand', 'Berthe'];

/* ================================================================== */
/*  ROULETTE                                                           */
/* ================================================================== */
const rl = { phase: 'bet', t: 18, result: null, hist: [], bets: [], bots: [], log: [], spinT: 0, chip: 10, wheel: 0, ver: 0, dirty: true };
function rlColor(n) { return n === 0 ? 'g' : RED.has(n) ? 'r' : 'b'; }
function rlWin(k, n) {
  if (k.startsWith('n:')) return +k.slice(2) === n ? 36 : 0;
  if (n === 0) return 0;
  switch (k) {
    case 'red': return RED.has(n) ? 2 : 0; case 'black': return !RED.has(n) ? 2 : 0;
    case 'even': return n % 2 === 0 ? 2 : 0; case 'odd': return n % 2 === 1 ? 2 : 0;
    case 'low': return n <= 18 ? 2 : 0; case 'high': return n >= 19 ? 2 : 0;
    case 'd1': return n <= 12 ? 3 : 0; case 'd2': return n >= 13 && n <= 24 ? 3 : 0; case 'd3': return n >= 25 ? 3 : 0;
  }
  return 0;
}
const KLAB = { red: 'Rouge', black: 'Noir', even: 'Pair', odd: 'Impair', low: '1-18', high: '19-36', d1: '1-12', d2: '13-24', d3: '25-36' };
const klab = k => k.startsWith('n:') ? 'le ' + k.slice(2) : KLAB[k];
function rlNewRound() {
  rl.phase = 'bet'; rl.t = 18; rl.result = null; rl.bets = [];
  const keys = ['red', 'black', 'even', 'odd', 'low', 'high', 'd1', 'd2', 'd3'];
  rl.bots.forEach(b => { b.bets = []; const n = 1 + Math.floor(Math.random() * 2); for (let i = 0; i < n; i++) b.bets.push({ k: Math.random() < 0.3 ? 'n:' + Math.floor(Math.random() * 37) : U.pick(keys), a: U.pick([10, 20, 25, 50, 100]) }); });
  rl.dirty = true;
}
function rlResolve() {
  const n = rl.result; rl.hist.unshift(n); rl.hist = rl.hist.slice(0, 10);
  let back = 0, bet = 0;
  for (const b of rl.bets) { bet += b.a; back += b.a * rlWin(b.k, n); }
  rl.log = [];
  rl.bots.forEach(b => { let w = 0, s = 0; for (const x of b.bets) { s += x.a; w += x.a * rlWin(x.k, n); } if (w > s) rl.log.push(b.name + ' gagne ' + money(w - s)); else if (s) rl.log.push(b.name + ' perd ' + money(s)); });
  rl.log = rl.log.slice(0, 4);
  if (bet) {
    if (back > 0) { G().gain(back); U.sfx(back > bet ? 'win' : 'coin'); UI.toast('Roulette : ' + n + ' - tu récupères ' + money(back) + (back > bet ? ' (gain net ' + money(back - bet) + ')' : ''), back > bet ? 'ok' : ''); if (back > bet) G().casinoWin(); }
    else { U.sfx('lose'); UI.toast('Roulette : ' + n + ' - tu perds ' + money(bet), 'err'); }
  }
  rl.phase = 'show'; rl.t = 5; rl.dirty = true;
}
function rlUpdate(dt) {
  if (rl.phase === 'bet') { rl.t -= dt; if (rl.t <= 0) { rl.phase = 'spin'; rl.spinT = 0; rl.result = Math.floor(Math.random() * 37); U.sfx('spin'); rl.dirty = true; } }
  else if (rl.phase === 'spin') { rl.spinT += dt; if (rl.spinT >= 5) rlResolve(); }
  else { rl.t -= dt; if (rl.t <= 0) rlNewRound(); }
  rl.wheel += dt * (rl.phase === 'spin' ? Math.max(0.3, 3 - rl.spinT * 0.55) : 0.25);
}
function rlDraw() {
  const cv = $('rl-w'); if (!cv) return;
  const c = cv.getContext('2d'), W = cv.width, cx = W / 2, cy = W / 2, R = W / 2 - 4;
  c.clearRect(0, 0, W, W);
  c.fillStyle = '#5a3a22'; c.beginPath(); c.arc(cx, cy, R + 3, 0, 6.2832); c.fill();
  for (let i = 0; i < 37; i++) {
    const a0 = rl.wheel + i / 37 * 6.2832, a1 = rl.wheel + (i + 1) / 37 * 6.2832, n = WHEEL[i];
    c.fillStyle = n === 0 ? '#2a8a4a' : RED.has(n) ? '#c8403a' : '#222';
    c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, R, a0, a1); c.closePath(); c.fill();
  }
  c.fillStyle = '#d9b25a'; c.beginPath(); c.arc(cx, cy, R * 0.55, 0, 6.2832); c.fill();
  c.fillStyle = '#8a5a3a'; c.beginPath(); c.arc(cx, cy, R * 0.4, 0, 6.2832); c.fill();
  // bille
  let ba, br;
  if (rl.phase === 'spin') {
    const k = Math.min(1, rl.spinT / 5), idx = WHEEL.indexOf(rl.result), target = rl.wheel + (idx + 0.5) / 37 * 6.2832;
    ba = k < 0.75 ? -rl.spinT * 6 : target + (1 - (k - 0.75) / 0.25) * 2.2 * (1 - Math.min(1, (k - 0.75) / 0.25));
    br = R * (0.92 - 0.12 * Math.min(1, k / 0.75));
    if (k >= 0.75) { const q = (k - 0.75) / 0.25; ba = target + (1 - q) * 2.5; br = R * 0.8; }
  } else if (rl.result !== null) { const idx = WHEEL.indexOf(rl.result); ba = rl.wheel + (idx + 0.5) / 37 * 6.2832; br = R * 0.8; }
  if (ba !== undefined) { c.fillStyle = '#fff'; c.beginPath(); c.arc(cx + Math.cos(ba) * br, cy + Math.sin(ba) * br, 4, 0, 6.2832); c.fill(); }
  if (rl.result !== null && rl.phase !== 'spin') { c.fillStyle = '#fff7e6'; c.font = 'bold 26px Trebuchet MS, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(rl.result), cx, cy); }
}
function rlHtml() {
  const S = RG.S, sum = {};
  rl.bets.forEach(b => { sum[b.k] = (sum[b.k] || 0) + b.a; });
  const cell = (k, lab, cls) => '<button class="rc ' + (cls || '') + '" data-a="bet" data-k="' + k + '">' + lab + (sum[k] ? '<i>' + sum[k] + '</i>' : '') + '</button>';
  let nums = '';
  for (let r = 0; r < 3; r++) for (let c = 0; c < 12; c++) { const n = 3 - r + c * 3; nums += cell('n:' + n, n, rlColor(n)); }
  const total = rl.bets.reduce((a, b) => a + b.a, 0);
  return '<div class="rl"><div class="rlt"><canvas id="rl-w" width="150" height="150"></canvas><div class="rli"><div id="rl-ph" class="big"></div>' +
    '<div class="hist">' + (rl.hist.length ? rl.hist.map(n => '<b class="' + rlColor(n) + '">' + n + '</b>').join('') : '<span class="muted">Aucun tirage</span>') + '</div>' +
    '<div class="muted">Joueurs à la table :</div>' + rl.bots.map(b => '<div class="bot">' + U.money(0).slice(0, 0) + UI.esc(b.name) + ' : ' + (b.bets && b.bets.length ? b.bets.map(x => x.a + ' sur ' + klab(x.k)).join(', ') : '...') + '</div>').join('') +
    (rl.log.length ? '<div class="logs">' + rl.log.map(UI.esc).join('<br>') + '</div>' : '') + '</div></div>' +
    '<div class="board">' + cell('n:0', '0', 'g z') + nums + '</div>' +
    '<div class="outs">' + cell('d1', '1-12') + cell('d2', '13-24') + cell('d3', '25-36') + cell('low', '1-18') + cell('even', 'Pair') + cell('red', 'Rouge', 'r') + cell('black', 'Noir', 'b') + cell('odd', 'Impair') + cell('high', '19-36') + '</div>' +
    '<div class="chips">' + CHIPS.map(v => '<button class="chip' + (rl.chip === v ? ' sel' : '') + '" data-a="chip" data-v="' + v + '">' + v + '</button>').join('') + '<span class="money">Mise : <b>' + money(total) + '</b> &nbsp; Argent : <b>' + money(S.money) + '</b></span>' +
    '<button data-a="undo">Annuler</button><button data-a="clear">Effacer</button></div></div>';
}
function openRoulette() {
  UI.modal({ kind: 'rl', title: 'Roulette', cls: 'casino', render: rlHtml, after: () => { rl.dirty = false; rlDraw(); rlTimer(); },
    onAction: (a, b, m) => {
      if (a === 'chip') rl.chip = +b.dataset.v;
      else if (a === 'bet') { if (rl.phase !== 'bet') { UI.toast('Les mises sont closes.', 'err'); return; } if (!G().spend(rl.chip)) return; rl.bets.push({ k: b.dataset.k, a: rl.chip }); U.sfx('coin'); }
      else if (a === 'undo') { if (rl.phase === 'bet' && rl.bets.length) { G().gain(rl.bets.pop().a); } }
      else if (a === 'clear') { if (rl.phase === 'bet') { rl.bets.forEach(x => G().gain(x.a)); rl.bets = []; } }
      m.refresh();
    } });
}
function rlTimer() {
  const e = $('rl-ph'); if (!e) return;
  e.textContent = rl.phase === 'bet' ? 'Faites vos jeux : ' + Math.ceil(rl.t) + ' s' : rl.phase === 'spin' ? 'Rien ne va plus...' : 'Numéro ' + rl.result + ' (' + (rl.result === 0 ? 'vert' : RED.has(rl.result) ? 'rouge' : 'noir') + ')';
}

/* ================================================================== */
/*  BLACKJACK                                                          */
/* ================================================================== */
const SUITS = ['♠', '♥', '♦', '♣'];
const rk = r => r === 14 ? 'A' : r === 13 ? 'K' : r === 12 ? 'Q' : r === 11 ? 'J' : String(r);
const cardH = (c, hidden) => hidden ? '<span class="card back"></span>' : '<span class="card' + (c.s === 1 || c.s === 2 ? ' red' : '') + '">' + rk(c.r) + SUITS[c.s] + '</span>';
function newDeck() { const d = []; for (let s = 0; s < 4; s++) for (let r = 2; r <= 14; r++) d.push({ r, s }); return U.shuffle(d); }
const bj = { phase: 'bet', bet: 0, deck: [], p: [], d: [], msg: 'Place ta mise.', dbl: false };
function bjVal(h) { let v = 0, a = 0; for (const c of h) { if (c.r === 14) { a++; v += 11; } else v += Math.min(10, c.r); } while (v > 21 && a > 0) { v -= 10; a--; } return v; }
function bjDraw() { if (bj.deck.length < 12) bj.deck = newDeck(); return bj.deck.pop(); }
function bjDeal() {
  if (bj.bet <= 0) { UI.toast('Mise d\'abord.', 'err'); return; }
  bj.deck = bj.deck.length < 20 ? newDeck() : bj.deck; bj.p = [bjDraw(), bjDraw()]; bj.d = [bjDraw(), bjDraw()]; bj.phase = 'play'; bj.dbl = false; bj.msg = 'À toi de jouer.'; U.sfx('card');
  if (bjVal(bj.p) === 21) bjEnd();
}
function bjEnd() {
  while (bjVal(bj.d) < 17 && bjVal(bj.p) <= 21) bj.d.push(bjDraw());
  const pv = bjVal(bj.p), dv = bjVal(bj.d), nat = bj.p.length === 2 && pv === 21;
  let back = 0, msg;
  if (pv > 21) msg = 'Tu dépasses 21. Perdu.';
  else if (nat && !(bj.d.length === 2 && dv === 21)) { back = Math.floor(bj.bet * 2.5); msg = 'Blackjack ! Tu gagnes ' + money(back - bj.bet) + '.'; }
  else if (dv > 21) { back = bj.bet * 2; msg = 'La banque dépasse 21. Tu gagnes ' + money(bj.bet) + '.'; }
  else if (pv > dv) { back = bj.bet * 2; msg = 'Tu gagnes ' + money(bj.bet) + '.'; }
  else if (pv === dv) { back = bj.bet; msg = 'Égalité, mise rendue.'; }
  else msg = 'La banque l\'emporte.';
  if (back > bj.bet) { G().gain(back); G().casinoWin(); U.sfx('win'); } else if (back === bj.bet) G().gain(back); else U.sfx('lose');
  bj.phase = 'done'; bj.msg = msg;
}
function bjHtml() {
  const S = RG.S, hide = bj.phase === 'play';
  const hand = (h, hid) => h.map((c, i) => cardH(c, hid && i === 1)).join('');
  let h = '<div class="bj"><div class="felt"><div class="lab">Banque ' + (bj.d.length ? '(' + (hide ? '?' : bjVal(bj.d)) + ')' : '') + '</div><div class="cards">' + hand(bj.d, hide) + '</div>' +
    '<div class="lab">Toi ' + (bj.p.length ? '(' + bjVal(bj.p) + ')' : '') + '</div><div class="cards">' + hand(bj.p, false) + '</div><div class="msg">' + UI.esc(bj.msg) + '</div></div>';
  h += '<div class="money">Mise : <b>' + money(bj.bet) + '</b> &nbsp; Argent : <b>' + money(S.money) + '</b></div>';
  if (bj.phase === 'bet' || bj.phase === 'done') {
    h += '<div class="chips">' + CHIPS.map(v => '<button class="chip" data-a="addbet" data-v="' + v + '">+' + v + '</button>').join('') + '<button data-a="clearbet">Effacer</button></div><div class="brow"><button class="go" data-a="deal">Distribuer</button></div>';
  } else h += '<div class="brow"><button data-a="hit">Tirer</button><button data-a="stand">Rester</button>' + (bj.p.length === 2 && S.money >= bj.bet ? '<button data-a="double">Doubler</button>' : '') + '</div>';
  return h + '</div>';
}
function openBlackjack() {
  if (bj.phase === 'done') { bj.phase = 'bet'; bj.p = []; bj.d = []; bj.msg = 'Place ta mise.'; }
  UI.modal({ kind: 'bj', title: 'Blackjack', cls: 'casino', render: bjHtml,
    onAction: (a, b, m) => {
      if (a === 'addbet') { if (bj.phase === 'done') { bj.phase = 'bet'; bj.p = []; bj.d = []; bj.bet = 0; bj.msg = 'Place ta mise.'; } if (G().spend(+b.dataset.v)) { bj.bet += +b.dataset.v; U.sfx('coin'); } }
      else if (a === 'clearbet') { if (bj.phase !== 'play') { G().gain(bj.bet); bj.bet = 0; } }
      else if (a === 'deal') { if (bj.phase === 'done') { bj.phase = 'bet'; bj.p = []; bj.d = []; bj.bet = 0; bj.msg = 'Place ta mise.'; m.refresh(); return; } bjDeal(); }
      else if (a === 'hit') { bj.p.push(bjDraw()); U.sfx('card'); if (bjVal(bj.p) >= 21) bjEnd(); }
      else if (a === 'stand') bjEnd();
      else if (a === 'double') { if (G().spend(bj.bet)) { bj.bet *= 2; bj.p.push(bjDraw()); bjEnd(); } }
      if (bj.phase === 'done') { /* la mise sera reprise au prochain tour */ }
      m.refresh();
    } });
}
function bjDoneReset() { if (bj.phase === 'done') bj.bet = bj.bet; }

/* ================================================================== */
/*  MACHINES A SOUS                                                    */
/* ================================================================== */
const SYM_MULT = [6, 10, 15, 27, 50, 120];
const SYM_W = [22, 20, 18, 16, 14, 10];
const slot = { bet: 10, spin: 0, reels: [0, 1, 2], final: null, msg: 'Tente ta chance.', acc: 0 };
function symPick() { let r = Math.random() * 100, i = 0; for (; i < 6; i++) { r -= SYM_W[i]; if (r < 0) break; } return Math.min(i, 5); }
function drawSym(cv, id) {
  const c = cv.getContext('2d'), s = cv.width; c.clearRect(0, 0, s, s); c.fillStyle = '#fff7e6'; c.fillRect(0, 0, s, s);
  const m = s / 2;
  c.lineWidth = 3;
  if (id === 0) { c.strokeStyle = '#3f7a2f'; c.beginPath(); c.moveTo(m - 8, m + 6); c.quadraticCurveTo(m - 2, m - 14, m + 6, m - 16); c.moveTo(m + 8, m + 6); c.quadraticCurveTo(m + 6, m - 10, m + 6, m - 16); c.stroke(); c.fillStyle = '#c8302f'; c.beginPath(); c.arc(m - 8, m + 8, 8, 0, 6.3); c.arc(m + 9, m + 8, 8, 0, 6.3); c.fill(); }
  else if (id === 1) { c.fillStyle = '#f2d03a'; c.beginPath(); c.ellipse(m, m, 16, 11, -0.4, 0, 6.3); c.fill(); c.fillStyle = '#c9a820'; c.fillRect(m + 12, m - 12, 4, 4); }
  else if (id === 2) { c.fillStyle = '#e8b830'; c.beginPath(); c.moveTo(m - 14, m + 10); c.quadraticCurveTo(m - 14, m - 14, m, m - 14); c.quadraticCurveTo(m + 14, m - 14, m + 14, m + 10); c.closePath(); c.fill(); c.fillStyle = '#8a6a20'; c.beginPath(); c.arc(m, m + 13, 4, 0, 6.3); c.fill(); }
  else if (id === 3) { c.fillStyle = '#f4d03a'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -1.5708 + i * 0.6283, r = i % 2 ? 7 : 17; c.lineTo(m + Math.cos(a) * r, m + 1 + Math.sin(a) * r); } c.closePath(); c.fill(); c.strokeStyle = '#a88a10'; c.lineWidth = 1; c.stroke(); }
  else if (id === 4) { c.fillStyle = '#3fc8e8'; c.beginPath(); c.moveTo(m, m - 16); c.lineTo(m + 14, m - 3); c.lineTo(m, m + 16); c.lineTo(m - 14, m - 3); c.closePath(); c.fill(); c.fillStyle = '#9fe8f8'; c.beginPath(); c.moveTo(m, m - 16); c.lineTo(m - 6, m - 3); c.lineTo(m + 6, m - 3); c.closePath(); c.fill(); }
  else { c.fillStyle = '#d8302f'; c.font = 'bold 34px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('7', m, m + 2); }
}
function slotHtml() {
  const S = RG.S;
  return '<div class="slot"><div class="reels">' + [0, 1, 2].map(i => '<canvas id="sr' + i + '" width="52" height="52"></canvas>').join('') + '</div><div class="msg">' + UI.esc(slot.msg) + '</div>' +
    '<div class="money">Argent : <b>' + money(S.money) + '</b></div><div class="chips">' + [5, 10, 25, 50, 100].map(v => '<button class="chip' + (slot.bet === v ? ' sel' : '') + '" data-a="sbet" data-v="' + v + '">' + v + '</button>').join('') + '</div>' +
    '<div class="brow"><button class="go" data-a="spin"' + (slot.spin > 0 ? ' disabled' : '') + '>Tourner (' + money(slot.bet) + ')</button></div>' +
    '<p class="muted">Trois symboles identiques : cerise x6, citron x10, cloche x15, étoile x27, diamant x50, sept x120. Deux cerises : x2.</p></div>';
}
function slotDraw() { for (let i = 0; i < 3; i++) { const c = $('sr' + i); if (c) drawSym(c, slot.reels[i]); } }
function openSlot() {
  UI.modal({ kind: 'slot', title: 'Machine à sous', cls: 'casino', render: slotHtml, after: slotDraw,
    onAction: (a, b, m) => {
      if (a === 'sbet') slot.bet = +b.dataset.v;
      else if (a === 'spin' && slot.spin <= 0) { if (!G().spend(slot.bet)) return; slot.spin = 1.4; slot.final = [symPick(), symPick(), symPick()]; slot.msg = '...'; slot.paid = slot.bet; U.sfx('spin'); }
      m.refresh();
    } });
}
function slotUpdate(dt) {
  if (slot.spin <= 0) return;
  slot.spin -= dt; slot.acc += dt;
  const el = 1.4 - slot.spin;
  if (slot.acc > 0.07) { slot.acc = 0; for (let i = 0; i < 3; i++) if (el < 0.6 + i * 0.3) slot.reels[i] = Math.floor(Math.random() * 6); }
  for (let i = 0; i < 3; i++) if (el >= 0.6 + i * 0.3) slot.reels[i] = slot.final[i];
  if (slot.spin <= 0) {
    slot.spin = 0; const f = slot.final; let mult = 0;
    if (f[0] === f[1] && f[1] === f[2]) mult = SYM_MULT[f[0]]; else if (f.filter(x => x === 0).length === 2) mult = 2;
    const win = slot.paid * mult;
    if (win > 0) { G().gain(win); slot.msg = 'Gagné ! ' + money(win) + ' (x' + mult + ')'; U.sfx('win'); if (win > slot.paid) G().casinoWin(); } else { slot.msg = 'Perdu...'; U.sfx('lose'); }
    const m = UI.currentModal(); if (m && m.kind === 'slot') m.refresh();
  } else slotDraw();
}

/* ================================================================== */
/*  POKER (Texas Hold'em)                                              */
/* ================================================================== */
const BB = 10, SB = 5;
const P = { seats: [], deck: [], board: [], phase: 'wait', dealer: 0, toAct: -1, cur: 0, raises: 0, timer: 3, msg: 'En attente...', log: [], ver: 0, pendingSit: 0, leaving: false, runout: false, betSize: 20, humanStart: 0 };
function mkSeat(name) { return { name, bot: true, human: false, stack: 600 + Math.floor(Math.random() * 900), hand: [], folded: false, bet: 0, total: 0, allin: false, acted: false, inHand: false, aggr: (Math.random() - 0.5) * 0.18 }; }
P.pot = () => P.seats.reduce((a, s) => a + s.total, 0);
const nextIdx = (i, pred) => { for (let k = 1; k <= 5; k++) { const j = (i + k) % 5; if (pred(P.seats[j])) return j; } return -1; };
const canAct = s => s.inHand && !s.folded && !s.allin;
function plog(t) { P.log.unshift(t); P.log = P.log.slice(0, 7); P.ver++; }
function eval5(cs) {
  const rs = cs.map(c => c.r).sort((a, b) => b - a), flush = cs.every(c => c.s === cs[0].s), uniq = [...new Set(rs)];
  let straight = false, top = 0;
  if (uniq.length === 5) { if (rs[0] - rs[4] === 4) { straight = true; top = rs[0]; } else if (rs[0] === 14 && rs[1] === 5 && rs[4] === 2) { straight = true; top = 5; } }
  const cnt = {}; rs.forEach(r => cnt[r] = (cnt[r] || 0) + 1);
  const g = Object.keys(cnt).map(r => ({ r: +r, c: cnt[r] })).sort((a, b) => b.c - a.c || b.r - a.r);
  let cat, tb;
  if (straight && flush) { cat = 8; tb = [top]; } else if (g[0].c === 4) { cat = 7; tb = [g[0].r, g[1].r]; } else if (g[0].c === 3 && g[1].c === 2) { cat = 6; tb = [g[0].r, g[1].r]; }
  else if (flush) { cat = 5; tb = rs; } else if (straight) { cat = 4; tb = [top]; } else if (g[0].c === 3) { cat = 3; tb = g.map(x => x.r); }
  else if (g[0].c === 2 && g[1].c === 2) { cat = 2; tb = g.map(x => x.r); } else if (g[0].c === 2) { cat = 1; tb = g.map(x => x.r); } else { cat = 0; tb = rs; }
  let v = 0; for (let i = 0; i < 5; i++) v = v * 15 + (tb[i] || 0);
  return cat * 759375 + v;
}
function best7(cs) {
  let best = -1;
  const n = cs.length;
  for (let a = 0; a < n - 4; a++) for (let b = a + 1; b < n - 3; b++) for (let c = b + 1; c < n - 2; c++) for (let d = c + 1; d < n - 1; d++) for (let e = d + 1; e < n; e++) {
    const v = eval5([cs[a], cs[b], cs[c], cs[d], cs[e]]); if (v > best) best = v;
  }
  return best;
}
const HNAMES = ['Carte haute', 'Paire', 'Double paire', 'Brelan', 'Quinte', 'Couleur', 'Full', 'Carré', 'Quinte flush'];
const hname = sc => HNAMES[Math.floor(sc / 759375)];

function pokerInit() {
  P.seats = BOTNAMES.slice().sort(() => Math.random() - 0.5).slice(0, 5).map(mkSeat);
  P.phase = 'wait'; P.timer = 3; P.board = []; P.log = []; P.ver++;
}
function post(s, a) { a = Math.min(a, s.stack); s.stack -= a; s.bet += a; s.total += a; if (s.stack === 0) s.allin = true; }
function startHand() {
  if (P.pendingSit) { const old = P.seats[0]; P.seats[0] = Object.assign(mkSeat(RG.S.name), { bot: false, human: true, stack: P.pendingSit, name: RG.S.name }); P.pendingSit = 0; P.humanStart = P.seats[0].stack; if (old) plog(old.name + ' laisse sa place.'); }
  P.seats.forEach(s => { if (s.bot && s.stack < 3 * BB) s.stack += 500 + Math.floor(Math.random() * 600); });
  const hs = P.seats[0];
  if (hs.human && hs.stack < BB) { UI.toast('Tu n\'as plus de jetons : tu quittes la table.', 'err'); P.seats[0] = mkSeat(U.pick(BOTNAMES)); }
  P.seats.forEach(s => { s.inHand = s.stack >= BB; s.folded = false; s.bet = 0; s.total = 0; s.allin = false; s.acted = false; s.hand = []; s.revealed = false; });
  const ps = P.seats.filter(s => s.inHand);
  if (ps.length < 2) { P.phase = 'wait'; P.timer = 3; return; }
  P.deck = newDeck(); P.board = []; P.cur = BB; P.raises = 0; P.betSize = 20; P.result = null;
  P.dealer = nextIdx(P.dealer, s => s.inHand);
  const sb = nextIdx(P.dealer, s => s.inHand), bb = nextIdx(sb, s => s.inHand);
  post(P.seats[sb], SB); post(P.seats[bb], BB);
  P.seats.forEach(s => { if (s.inHand) s.hand = [P.deck.pop(), P.deck.pop()]; });
  P.phase = 'pre'; P.msg = 'Nouvelle main.';
  if (P.seats[0].human && P.seats[0].inHand) { U.sfx('card'); plog('Nouvelle main : tu as ' + P.seats[0].hand.map(c => rk(c.r) + SUITS[c.s]).join(' ')); } else plog('Nouvelle main.');
  P.toAct = nextIdx(bb, canAct);
  if (P.toAct < 0) { P.runout = true; P.timer = 1; return; }
  P.timer = 1.2;
}
function award(i, amt) { P.seats[i].stack += amt; }
function finishSingle(w) {
  const pot = P.pot(); award(w, pot); P.result = { text: P.seats[w].name + ' remporte ' + money(pot) + ' (tous les autres se couchent).', win: [w] };
  endHand();
}
function showdown() {
  P.phase = 'show';
  const live = P.seats.map((s, i) => ({ s, i })).filter(x => x.s.inHand && !x.s.folded);
  live.forEach(x => { x.s.revealed = true; x.sc = best7(x.s.hand.concat(P.board)); });
  const levels = [...new Set(P.seats.filter(s => s.total > 0).map(s => s.total))].sort((a, b) => a - b);
  let prev = 0; const winners = new Set(); let txt = '';
  for (const lv of levels) {
    let pot = 0; P.seats.forEach(s => { pot += Math.max(0, Math.min(s.total, lv) - prev); });
    let elig = live.filter(x => x.s.total >= lv); if (!elig.length) { prev = lv; continue; }
    const top = Math.max(...elig.map(x => x.sc)), win = elig.filter(x => x.sc === top);
    const share = Math.floor(pot / win.length);
    win.forEach((x, k) => { award(x.i, share + (k === 0 ? pot - share * win.length : 0)); winners.add(x.i); });
    if (!txt) txt = win.map(x => x.s.name).join(' et ') + ' gagne' + (win.length > 1 ? 'nt' : '') + ' avec ' + hname(top).toLowerCase() + ' (' + money(pot) + ')';
    prev = lv;
  }
  P.result = { text: txt, win: [...winners] };
  endHand();
}
function endHand() {
  P.phase = 'show'; P.timer = 5.5; P.toAct = -1; plog(P.result.text); P.msg = P.result.text;
  const h = P.seats[0];
  if (h.human && h.inHand) {
    const won = P.result.win.includes(0);
    if (won && h.stack > h.humanBefore) { G().casinoWin(); U.sfx('win'); }
  }
}
function nextPhase() {
  P.seats.forEach(s => { s.bet = 0; s.acted = false; }); P.cur = 0; P.raises = 0;
  if (P.phase === 'pre') { P.board.push(P.deck.pop(), P.deck.pop(), P.deck.pop()); P.phase = 'flop'; }
  else if (P.phase === 'flop') { P.board.push(P.deck.pop()); P.phase = 'turn'; P.betSize = 40; }
  else if (P.phase === 'turn') { P.board.push(P.deck.pop()); P.phase = 'river'; }
  else if (P.phase === 'river') { showdown(); return; }
  U.sfx('card'); P.ver++;
  const can = P.seats.filter(canAct);
  if (can.length < 2) { P.runout = true; P.timer = 1.3; return; }
  P.toAct = nextIdx(P.dealer, canAct); P.timer = 1;
}
function afterAction() {
  const alive = P.seats.filter(s => s.inHand && !s.folded);
  if (alive.length === 1) { finishSingle(P.seats.indexOf(alive[0])); return; }
  const need = alive.filter(s => !s.allin);
  if (need.every(s => s.acted && s.bet === P.cur)) { nextPhase(); return; }
  P.toAct = nextIdx(P.toAct, canAct); P.timer = 0.9 + Math.random() * 0.8; P.ver++;
}
function act(i, type) {
  const s = P.seats[i], need = P.cur - s.bet;
  const before = P.cur;
  if (type === 'fold') { s.folded = true; plog(s.name + ' se couche.'); }
  else if (type === 'check' || (type === 'call' && need <= 0)) { s.acted = true; plog(s.name + ' checke.'); }
  else if (type === 'call') { post(s, need); s.acted = true; plog(s.name + ' suit' + (s.allin ? ' (tapis)' : '') + ' ' + money(Math.min(need, s.bet)) + '.'); }
  else if (type === 'raise' || type === 'allin') {
    const target = type === 'allin' ? s.bet + s.stack : Math.min(P.cur + P.betSize, s.bet + s.stack);
    post(s, target - s.bet);
    if (s.bet > P.cur) { P.cur = s.bet; P.raises++; P.seats.forEach((o, j) => { if (j !== i && canAct(o)) o.acted = false; }); plog(s.name + (s.allin ? ' fait tapis' : ' relance à ' + s.bet) + '.'); }
    else plog(s.name + ' suit' + (s.allin ? ' (tapis)' : '') + '.');
    s.acted = true;
  }
  P.ver++;
  afterAction();
}
function strength(s) {
  const c = s.hand;
  if (!P.board.length) {
    const hi = Math.max(c[0].r, c[1].r), lo = Math.min(c[0].r, c[1].r);
    let v = (hi + lo) / 28 * 0.6; if (c[0].r === c[1].r) v = 0.55 + c[0].r / 40; if (c[0].s === c[1].s) v += 0.05; if (hi - lo <= 2 && hi !== lo) v += 0.04; return Math.min(1, v);
  }
  const all = c.concat(P.board), sc = best7(all), cat = Math.floor(sc / 759375);
  let v = [0.18, 0.46, 0.68, 0.78, 0.86, 0.9, 0.95, 0.99, 1][cat];
  if (P.board.length < 5) { const cnt = [0, 0, 0, 0]; all.forEach(x => cnt[x.s]++); if (Math.max(...cnt) === 4) v += 0.14; }
  return v;
}
function botDecide(s) {
  const toCall = P.cur - s.bet, st = strength(s) + (Math.random() - 0.5) * 0.2 + s.aggr;
  if (toCall <= 0) return (st > 0.66 && P.raises < 3 && s.stack > P.betSize && Math.random() < 0.65) ? 'raise' : 'check';
  const odds = toCall / (P.pot() + toCall);
  if (st < 0.3 && Math.random() > 0.12) return toCall <= BB && Math.random() < 0.5 ? 'call' : 'fold';
  if (st > 0.78 && P.raises < 3 && s.stack > toCall + P.betSize && Math.random() < 0.45) return 'raise';
  if (st > odds + 0.12 || toCall <= BB) return 'call';
  return Math.random() < 0.15 ? 'call' : 'fold';
}
function pokerUpdate(dt) {
  P.timer -= dt;
  if (P.timer > 0) return;
  if (P.phase === 'wait') { startHand(); P.ver++; return; }
  if (P.phase === 'show') {
    const h = P.seats[0];
    if (h.human && P.leaving) { G().gain(h.stack); UI.toast('Tu quittes la table avec ' + money(h.stack) + '.', 'ok'); P.seats[0] = mkSeat(U.pick(BOTNAMES.filter(n => !P.seats.some(s => s.name === n)))); P.leaving = false; }
    P.phase = 'wait'; P.timer = 0.3; P.ver++; return;
  }
  if (P.runout) { P.runout = false; nextPhase(); return; }
  if (P.toAct < 0) return;
  const s = P.seats[P.toAct];
  if (s.human) {
    if (P.leaving) { act(P.toAct, 'fold'); return; }
    if (P.timer < -25) act(P.toAct, P.cur - s.bet > 0 ? 'fold' : 'check');
    return;
  }
  const d = botDecide(s); act(P.toAct, d);
}
function pokerHtml() {
  const S = RG.S, h = P.seats[0], me = h.human;
  const seatHtml = (s, i) => {
    const show = s.revealed || (s.human && s.inHand);
    let cards = '';
    if (s.inHand && s.hand.length) cards = s.hand.map(c => cardH(c, !show)).join('');
    const tags = (P.dealer === i && P.phase !== 'wait' ? '<em>D</em>' : '') + (s.folded && s.inHand ? '<em class="f">Couché</em>' : '') + (s.allin && s.inHand && !s.folded ? '<em class="a">Tapis</em>' : '') + (P.toAct === i && P.phase !== 'show' ? '<em class="t">Tour</em>' : '');
    const bet = s.bet > 0 ? '<div class="sb">' + s.bet + '</div>' : '';
    return '<div class="seat s' + i + (s.human ? ' me' : '') + (s.folded ? ' fold' : '') + '"><div class="sn">' + UI.esc(s.name) + tags + '</div><div class="ss">' + money(s.stack) + '</div><div class="sc">' + cards + '</div>' + bet + '</div>';
  };
  let h2 = '<div class="pk"><div class="pk-table"><div class="pk-center"><div class="cards">' + [0, 1, 2, 3, 4].map(i => P.board[i] ? cardH(P.board[i]) : '<span class="card empty"></span>').join('') + '</div><div class="pot">Pot : <b>' + money(P.pot()) + '</b></div><div class="pk-msg">' + UI.esc(P.msg) + '</div></div>' + P.seats.map(seatHtml).join('') + '</div>';
  const myTurn = me && P.toAct === 0 && P.phase !== 'show' && P.phase !== 'wait';
  h2 += '<div class="pk-actions">';
  if (!me) {
    h2 += '<span class="muted">Tu observes la table.</span>' + [200, 500, 1000].map(v => '<button data-a="sit" data-v="' + v + '"' + (S.money < v ? ' disabled' : '') + '>S\'asseoir (' + v + ' $)</button>').join('') + (P.pendingSit ? '<span class="muted"> Place réservée : tu joueras la prochaine main.</span>' : '');
  } else {
    const need = P.cur - h.bet;
    if (myTurn) {
      h2 += '<button data-a="fold">Se coucher</button>' + (need <= 0 ? '<button data-a="check" class="go">Checker</button>' : '<button data-a="call" class="go">Suivre (' + Math.min(need, h.stack) + ')</button>') +
        (P.raises < 3 && h.stack > need + P.betSize ? '<button data-a="raise">Relancer (+' + P.betSize + ')</button>' : '') + '<button data-a="allin">Tapis (' + h.stack + ')</button>';
    } else h2 += '<span class="muted">' + (P.phase === 'show' ? 'Fin de main...' : 'En attente de ton tour...') + '</span>';
    h2 += '<button data-a="leave" class="warn">' + (P.leaving ? 'Tu pars après cette main' : 'Quitter la table') + '</button>';
  }
  h2 += '</div><div class="pk-log">' + P.log.map(UI.esc).join('<br>') + '</div></div>';
  return h2;
}
function openPoker() {
  let ver = -1;
  UI.modal({ kind: 'poker', title: 'Poker Texas Hold\'em - blinds 5/10', cls: 'casino wide', render: () => { ver = P.ver; return pokerHtml(); }, onAction: (a, b, m) => {
    const h = P.seats[0];
    if (a === 'sit') { if (!G().spend(+b.dataset.v)) return; P.pendingSit = (P.pendingSit || 0) + (+b.dataset.v); if (P.phase === 'wait' || P.phase === 'show') { /* prend effet à la prochaine main */ } }
    else if (a === 'fold' || a === 'check' || a === 'call' || a === 'raise' || a === 'allin') { if (h.human && P.toAct === 0 && P.phase !== 'show') { h.humanBefore = h.humanBefore || 0; act(0, a); } }
    else if (a === 'leave') { if (P.phase === 'show' || P.phase === 'wait' || !h.inHand || h.folded) { G().gain(h.stack); UI.toast('Tu quittes la table avec ' + money(h.stack) + '.', 'ok'); P.seats[0] = mkSeat(U.pick(BOTNAMES.filter(n => !P.seats.some(s => s.name === n)))); P.leaving = false; P.ver++; } else { P.leaving = true; } }
    m.refresh();
  } });
}
// mémorise le stack avant la main pour détecter un vrai gain
const _startHand = startHand;
startHand = function () { _startHand(); const h = P.seats[0]; if (h.human) h.humanBefore = h.stack + h.total; };

/* ================================================================== */
/*  Interface publique                                                 */
/* ================================================================== */

/* ---------- API pour l'interface canvas (casinoui.js) ---------- */
C.x = { rlWin, rl, bj, slot, P, WHEEL, RED, CHIPS, SYM_MULT, SYM_W, rlColor, klab, bjVal, rk, hname, BB, mkSeat };
C.rlDo = (a, v) => {
  if (a === 'chip') rl.chip = v;
  else if (a === 'bet') { if (rl.phase !== 'bet') { UI.toast('Les mises sont closes.', 'err'); return false; } if (!G().spend(rl.chip)) return false; rl.bets.push({ k: v, a: rl.chip }); U.sfx('coin'); return true; }
  else if (a === 'undo') { if (rl.phase === 'bet' && rl.bets.length) G().gain(rl.bets.pop().a); }
  else if (a === 'clear') { if (rl.phase === 'bet') { rl.bets.forEach(x => G().gain(x.a)); rl.bets = []; } }
};
function bjReset() { bj.phase = 'bet'; bj.p = []; bj.d = []; bj.bet = 0; bj.msg = 'Place ta mise.'; }
C.bjDo = (a, v) => {
  if (a === 'addbet') { if (bj.phase === 'done') bjReset(); if (bj.phase !== 'bet') return; if (G().spend(v)) { bj.bet += v; U.sfx('coin'); } }
  else if (a === 'clearbet') { if (bj.phase === 'bet') { G().gain(bj.bet); bj.bet = 0; } }
  else if (a === 'deal') { if (bj.phase === 'done') { bjReset(); return; } if (bj.phase === 'bet') bjDeal(); }
  else if (a === 'hit') { if (bj.phase !== 'play') return; bj.p.push(bjDraw()); U.sfx('card'); if (bjVal(bj.p) >= 21) bjEnd(); }
  else if (a === 'stand') { if (bj.phase === 'play') bjEnd(); }
  else if (a === 'double') { if (bj.phase === 'play' && bj.p.length === 2 && G().spend(bj.bet)) { bj.bet *= 2; bj.p.push(bjDraw()); bjEnd(); } }
};
C.slotDo = (a, v) => {
  if (a === 'sbet') { if (slot.spin <= 0) slot.bet = v; }
  else if (a === 'spin' && slot.spin <= 0) { if (!G().spend(slot.bet)) return; slot.spin = 1.4; slot.final = [symPick(), symPick(), symPick()]; slot.msg = '...'; slot.paid = slot.bet; slot.t0 = performance.now(); U.sfx('spin'); }
};
C.pokerDo = (a, v) => {
  const h = P.seats[0];
  if (a === 'sit') { if (h.human) return; if (!G().spend(v)) return; P.pendingSit = (P.pendingSit || 0) + v; }
  else if (['fold', 'check', 'call', 'raise', 'allin'].includes(a)) { if (h.human && P.toAct === 0 && P.phase !== 'show') act(0, a); }
  else if (a === 'leave') {
    if (!h.human) return;
    if (P.phase === 'show' || P.phase === 'wait' || !h.inHand || h.folded) { G().gain(h.stack); UI.toast('Tu quittes la table avec ' + money(h.stack) + '.', 'ok'); P.seats[0] = mkSeat(U.pick(BOTNAMES.filter(n => !P.seats.some(s => s.name === n)))); P.leaving = false; P.ver++; }
    else P.leaving = true;
  }
};

C.init = map => {
  rl.bots = []; rl.phase = 'bet'; rl.t = 12; rl.bets = []; rl.hist = []; rl.log = [];
  pokerInit();
  const used = new Set();
  const name = () => { let n; do { n = U.pick(BOTNAMES); } while (used.has(n)); used.add(n); return n; };
  const seats = map.seats;
  C.pokerEnts = [];
  seats.rl.forEach(sp => { const e = E.make('deco', { name: name(), ap: Sp.randomAp(), x: sp[0] * T + 8, y: sp[1] * T + 12, dir: sp[2], spd: 0 }); map.ents.push(e); rl.bots.push({ name: e.name, bets: [] }); });
  seats.bj.forEach(sp => { const e = E.make('deco', { name: name(), ap: Sp.randomAp(), x: sp[0] * T + 8, y: sp[1] * T + 12, dir: sp[2], spd: 0 }); map.ents.push(e); });
  seats.poker.forEach((sp, i) => { const e = E.make('deco', { name: P.seats[i].name, ap: Sp.randomAp(), x: sp[0] * T + 8, y: sp[1] * T + 12, dir: sp[2], spd: 0, seat: i }); map.ents.push(e); C.pokerEnts.push(e); });
  rlNewRound(); rl.t = 12;
};
C.update = dt => {
  rlUpdate(dt); slotUpdate(dt); pokerUpdate(dt);
  const m = UI.currentModal();
  if (C.pokerEnts) C.pokerEnts.forEach((e, i) => { e.name = P.seats[i].name; if (i === 0) e.hidden = false; e.ap = e.ap; e.folded = P.seats[i].folded; });
  if (m && m.kind === 'rl') { if (rl.dirty) { m.refresh(); } rlDraw(); rlTimer(); }
  else if (m && m.kind === 'poker' && m.refresh && P.ver !== (m._v || -1)) { m._v = P.ver; m.refresh(); }
};
C.open = a => {
  if (RG.CasinoUI) { RG.CasinoUI.open(a); return; }
  if (a === 'roulette') openRoulette(); else if (a === 'blackjack') openBlackjack(); else if (a === 'slot') openSlot(); else if (a === 'poker') openPoker();
};
C.leave = () => {
  // rembourse ce qui n'est pas résolu
  if (rl.phase === 'bet' || rl.phase === 'spin') { rl.bets.forEach(b => G().gain(b.a)); rl.bets = []; }
  if (bj.phase === 'play') { G().gain(bj.bet); bj.phase = 'bet'; bj.bet = 0; bj.p = []; bj.d = []; }
  else if (bj.phase === 'done') { bj.bet = 0; bj.phase = 'bet'; bj.p = []; bj.d = []; }
  else if (bj.phase === 'bet' && bj.bet) { G().gain(bj.bet); bj.bet = 0; }
  const h = P.seats[0];
  if (P.pendingSit) { G().gain(P.pendingSit); P.pendingSit = 0; }
  if (h && h.human) { G().gain(h.stack); P.seats[0] = mkSeat(U.pick(BOTNAMES.filter(n => !P.seats.some(s => s.name === n)))); P.leaving = false; P.phase = 'wait'; P.timer = 1; }
  P.ver++;
};
C.drawWorld = (ctx, camX, camY) => {
  // cartes communes + pot sur la table de poker
  const cx = 20.5 * T - camX, cy = 8 * T - camY;
  for (let i = 0; i < 5; i++) {
    const c = P.board[i]; const x = Math.round(cx - 17 + i * 7), y = Math.round(cy - 4);
    ctx.fillStyle = c ? '#fffaf0' : 'rgba(0,0,0,0.25)'; ctx.fillRect(x, y, 6, 8);
    if (c) { ctx.fillStyle = (c.s === 1 || c.s === 2) ? '#c8302f' : '#222'; ctx.fillRect(x + 2, y + 2, 2, 4); }
  }
  if (P.pot() > 0) U.drawText(ctx, String(P.pot()), Math.round(cx - U.textW(String(P.pot())) / 2), Math.round(cy + 5), '#ffe36a', '#000');
  // roulette : dernier numéro
  if (rl.result !== null && rl.phase !== 'spin') U.drawText(ctx, String(rl.result), Math.round(4.5 * T - camX - 2), Math.round(8 * T - camY - 2), '#fff', '#000');
};
})();
