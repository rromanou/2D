(() => {
'use strict';
const RG = window.RG, U = RG.U, W = RG.World, D = RG.Data, E = RG.Ent, UI = RG.UI, Sp = RG.Sp, T = RG.T;
const Game = RG.Game = {};
const S = RG.S = {};
const P = RG.P = { x: 0, y: 0, dir: 'down', anim: 0, moving: false, dirx: 0, diry: 1, run: false };
const C = RG.core = { cur: null, pets: [], bullets: [], floaters: [], parts: [], mode: 'title', mini: null, fishing: null, chop: null, target: null, now: 0, cutTrees: [], treeIdx: new Map(), wantedT: 0, reinT: 0, doorCd: 0, saveT: 0, hudT: 0, miniT: 0, fade: { a: 0, dir: 0, cb: null } };
const SAVE_KEY = 'petitvillage_save_v1';
const canvas = document.getElementById('game'), ctx = canvas.getContext('2d');
const WALK = [0, 1, 0, 2];

/* ------------------------------------------------------------------ */
/*  État                                                               */
/* ------------------------------------------------------------------ */
function freshState() {
  for (const k in S) delete S[k];
  Object.assign(S, { name: 'Roko', ap: Sp.defaultAp(), money: 100, bank: 0, hunger: 85, thirst: 85, hp: 100, stamina: 100, inv: { pomme: 2, eau: 1 }, equip: { weapon: null, mask: false },
    owned: {}, stash: {}, job: null, jobxp: {}, quests: {}, met: {}, wanted: 0, pets: [], abs: 8 * 60, time: 8 * 60, day: 1, cd: {}, parcel: null, jail: null, stats: { crimes: 0, fish: 0 } });
}
Game.save = (toast) => {
  if (C.mode !== 'play') return;
  try {
    const data = { S, P: { x: P.x, y: P.y, dir: P.dir }, map: C.cur.name };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    if (toast) UI.toast('Partie sauvegardée.', 'ok');
  } catch (e) { if (toast) UI.toast('Sauvegarde impossible.', 'err'); }
};
function readSave() { try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
Game.reset = () => { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} location.reload(); };

/* ------------------------------------------------------------------ */
/*  Carte / transitions                                                */
/* ------------------------------------------------------------------ */
function buildTreeIdx(m) { C.treeIdx = new Map(); for (const t of m.trees) C.treeIdx.set(t.ty * m.w + t.tx, t); }
function placePets() {
  C.pets.forEach((p, i) => { p.x = P.x - 10 - i * 8; p.y = P.y + 2; });
}
function syncPets() {
  C.pets = S.pets.map(r => E.makePet(r, P.x - 8, P.y + 2));
}
Game.setMap = (name, x, y, dir) => {
  const prev = C.cur;
  if (prev && prev.name === 'casino' && name !== 'casino') RG.Casino.leave();
  C.cur = W.get(name); P.x = x; P.y = y; if (dir) P.dir = dir;
  C.bullets = []; C.target = null; C.fishing = null; C.chop = null; C.doorCd = 0.6;
  if (C.cur.outdoor) buildTreeIdx(C.cur);
  placePets();
  E.Nav.map = null;
  if (C.cur.name !== 'world') UI.banner(C.cur.title); else if (prev && prev.name !== 'world') UI.banner('Village');
  Game.event('visit', name);
  if (Game.lifeEnter) Game.lifeEnter(name);
};
Game.go = (name, x, y, dir) => {
  if (C.fade.dir !== 0) return;
  C.fade = { a: 0, dir: 1, cb: () => Game.setMap(name, x, y, dir) };
  U.sfx('door');
};

/* ------------------------------------------------------------------ */
/*  Nouvelle partie / chargement                                       */
/* ------------------------------------------------------------------ */
function startAt(mapName, x, y, dir) {
  if (RG.Life) RG.Life.init();
  UI.hideTitle(); C.mode = 'play';
  syncPets();
  Game.setMap(mapName, x, y, dir);
  C.fade = { a: 1, dir: -1, cb: null };
}
Game.newGame = () => {
  freshState();
  UI.hideTitle();
  UI.avatar({ locked: true, title: 'Crée ton personnage', onDone: () => {
    const f = E.freeTile(W.get('world'), 62, 51);
    startAt('world', f.x * T + 8, f.y * T + 10, 'down');
    UI.say('Lucie', ['Bienvenue au village ! Je te laisse découvrir les lieux.', 'Parle-moi (touche E) si tu as besoin d\'un guide. Tu peux aussi appuyer sur Échap pour voir les commandes.'], [], () => {});
    Game.save();
  } });
};
Game.continue = () => {
  const d = readSave();
  if (!d) { Game.newGame(); return; }
  freshState(); Object.assign(S, d.S);
  S.inv = S.inv || {}; S.equip = S.equip || { weapon: null, mask: false }; S.owned = S.owned || {}; S.stash = S.stash || {}; S.quests = S.quests || {}; S.cd = S.cd || {}; S.met = S.met || {}; S.jobxp = S.jobxp || {}; S.pets = S.pets || [];
  S.jail = null;
  const mp = W.get(d.map) ? d.map : 'world';
  const m = W.get(mp);
  let x = d.P.x, y = d.P.y;
  if (mp === 'world' || !m) { const f = E.freeTile(W.get('world'), Math.floor(x / T), Math.floor(y / T)); x = f.x * T + 8; y = f.y * T + 10; }
  startAt(mp, x, y, d.P.dir || 'down');
};

/* ------------------------------------------------------------------ */
/*  Entrées                                                            */
/* ------------------------------------------------------------------ */
const keys = { left: false, right: false, up: false, down: false, run: false };
const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', KeyZ: 'up', KeyQ: 'left', ArrowDown: 'down', KeyS: 'down', ShiftLeft: 'run', ShiftRight: 'run' };
const ptr = { on: false, x: 0, y: 0 };
function typing(e) { const t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA'); }
addEventListener('keydown', e => {
  if (typing(e)) return;
  if (C.mode !== 'play') return;
  const k = KEYMAP[e.code];
  if (k) { keys[k] = true; e.preventDefault(); return; }
  if (e.repeat && e.code !== 'KeyE') return;
  switch (e.code) {
    case 'KeyE': case 'Space': case 'Enter':
      e.preventDefault();
      if (UI.dialogOpen()) UI.dialogAdvance();
      else if (C.mini) Game.miniAction();
      else if (UI.isModal()) return;
      else if (C.fishing) Game.fishAction();
      else if (C.fade.dir === 0) Game.interact();
      break;
    case 'Digit1': case 'Digit2': case 'Digit3': case 'Digit4': case 'Digit5': case 'Digit6': case 'Digit7': case 'Digit8': case 'Digit9':
    case 'Numpad1': case 'Numpad2': case 'Numpad3': case 'Numpad4': case 'Numpad5': case 'Numpad6': case 'Numpad7': case 'Numpad8': case 'Numpad9': {
      const n = parseInt(e.code.slice(-1), 10) - 1;
      if (UI.dialogOpen()) UI.dialogChoice(n); else if (!UI.isModal() && !C.mini) UI.hotbarSlot(n);
      break; }
    case 'KeyF': if (!UI.isModal() && !UI.dialogOpen()) Game.useWeapon(); break;
    case 'KeyI': if (UI.isModal()) { const m = UI.currentModal(); if (m && m.cls === 'inv') UI.closeModal(); } else if (!UI.dialogOpen()) UI.inventory(); break;
    case 'KeyJ': if (UI.isModal()) { const m = UI.currentModal(); if (m && m.cls === 'quests') UI.closeModal(); } else if (!UI.dialogOpen()) UI.quests(); break;
    case 'KeyR': if (UI.isModal()) { const m = UI.currentModal(); if (m && m.cls === 'rel') UI.closeModal(); } else if (!UI.dialogOpen()) RG.Life.friends(); break;
    case 'KeyB': if (C.cur && C.cur.name === 'home' && !UI.isModal() && !UI.dialogOpen() && !C.place) RG.Life.build(); break;
    case 'KeyM': document.getElementById('mini').classList.toggle('big'); break;
    case 'Escape':
      if (C.place) { RG.Life.cancelPlace(); break; }
      if (C.mini) { Game.miniCancel(); break; }
      if (C.fishing) { C.fishing = null; break; }
      if (UI.dialogOpen()) UI.closeDialog();
      else if (UI.isModal()) { const m = UI.currentModal(); if (m && !m.locked) UI.closeModal(); }
      else UI.pause();
      break;
  }
});
addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) { keys[k] = false; if (!typing(e)) e.preventDefault(); } });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
canvas.addEventListener('pointerdown', e => { if (C.place) { RG.Life.placeMove(Math.floor((e.clientX / scale + camX) / T), Math.floor((e.clientY / scale + camY) / T)); RG.Life.placeClick(); return; } ptr.on = true; ptr.x = e.clientX; ptr.y = e.clientY; });
addEventListener('pointermove', e => { if (C.place) RG.Life.placeMove(Math.floor((e.clientX / scale + camX) / T), Math.floor((e.clientY / scale + camY) / T)); if (ptr.on) { ptr.x = e.clientX; ptr.y = e.clientY; } });
addEventListener('pointerup', () => { ptr.on = false; });
addEventListener('pointercancel', () => { ptr.on = false; });

/* ------------------------------------------------------------------ */
/*  Affichage                                                          */
/* ------------------------------------------------------------------ */
let VW = 320, VH = 180, scale = 3, camX = 0, camY = 0;
const lightCv = document.createElement('canvas'), lctx = lightCv.getContext('2d');
const glowCache = {};
function glow(r, col, a) {
  const k = r + col + a; if (glowCache[k]) return glowCache[k];
  const cv = U.mk(r * 2, r * 2), c = cv.getContext('2d');
  const g = c.createRadialGradient(r, r, 0, r, r, r); g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0));
  c.fillStyle = g; c.fillRect(0, 0, r * 2, r * 2); return (glowCache[k] = cv);
}
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  scale = Math.max(2, Math.floor(Math.min(h / 190, w / 270)));
  VW = Math.ceil(w / scale); VH = Math.ceil(h / scale);
  canvas.width = VW; canvas.height = VH; lightCv.width = VW; lightCv.height = VH;
  canvas.style.width = (VW * scale) + 'px'; canvas.style.height = (VH * scale) + 'px';
  ctx.imageSmoothingEnabled = false;
}
addEventListener('resize', resize);
Game.view = () => ({ VW, VH, scale, camX, camY });

function darkness(h) {
  if (h >= 7.5 && h < 18) return 0;
  if (h >= 18 && h < 21) return (h - 18) / 3 * 0.62;
  if (h >= 21 || h < 4.5) return 0.62;
  if (h >= 4.5 && h < 7.5) return (7.5 - h) / 3 * 0.62;
  return 0;
}

/* ------------------------------------------------------------------ */
/*  Mise à jour                                                        */
/* ------------------------------------------------------------------ */
Game.floater = (x, y, text, col) => C.floaters.push({ x, y, t: 0, text, col: col || '#fff' });
Game.hearts = (x, y) => { for (let i = 0; i < 4; i++) C.parts.push({ x: x + (Math.random() - 0.5) * 10, y: y - 10, vy: -14 - Math.random() * 10, t: 0, life: 1.1, k: 'heart' }); };

function updateNeeds(dt, running) {
  S.abs += dt * 2; S.time = S.abs % 1440; S.day = 1 + Math.floor(S.abs / 1440);
  S.hunger -= 0.055 * dt; S.thirst -= (running ? 0.12 : 0.085) * dt;
  S.hunger = Math.max(0, S.hunger); S.thirst = Math.max(0, S.thirst);
  if (S.hunger <= 0 || S.thirst <= 0) S.hp -= 1.4 * dt;
  else if (S.hunger > 40 && S.thirst > 40 && S.hp < 100) S.hp = Math.min(100, S.hp + 0.6 * dt);
  const warn = (k, v, msg) => { if (S[k] < v && !C['w' + k]) { C['w' + k] = 1; UI.toast(msg, 'err'); } else if (S[k] > v + 5) C['w' + k] = 0; };
  if (RG.Life) RG.Life.needs(dt);
  warn('hunger', 20, 'Tu as faim : mange quelque chose.'); warn('thirst', 20, 'Tu as soif : bois quelque chose.');
  if (S.hp <= 0) Game.faint();
}
function movePlayer(dt) {
  let ax = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), ay = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
  let run = keys.run;
  if (!ax && !ay && ptr.on && !C.place) {
    const dx = ptr.x / scale + camX - P.x, dy = ptr.y / scale + camY - (P.y - 8), d = Math.hypot(dx, dy);
    if (d > 6) { ax = dx; ay = dy; if (d > 90) run = true; }
  }
  const len = Math.hypot(ax, ay);
  P.moving = len > 0;
  if (len > 0) {
    ax /= len; ay /= len;
    if (run && S.stamina > 0 && !C.exhausted) S.stamina -= 24 * dt * (RG.Life ? RG.Life.staminaCost() : 1); else { run = false; }
    if (S.stamina <= 0) C.exhausted = true;
    if (C.exhausted && S.stamina > 25) C.exhausted = false;
    const sp = (run ? 84 : 52) * (RG.Life ? RG.Life.speedMul() : 1);
    const hw = 5, hh = 4;
    if (!W.hit(C.cur, P.x + ax * sp * dt, P.y, hw, hh)) P.x += ax * sp * dt;
    if (!W.hit(C.cur, P.x, P.y + ay * sp * dt, hw, hh)) P.y += ay * sp * dt;
    if (Math.abs(ax) > Math.abs(ay)) P.dir = ax < 0 ? 'left' : 'right'; else if (Math.abs(ay) > Math.abs(ax)) P.dir = ay < 0 ? 'up' : 'down'; else P.dir = ax < 0 ? 'left' : 'right';
    P.dirx = ax; P.diry = ay; P.anim += dt * (run ? 11 : 7.5); P.run = run;
  } else { P.anim = 0; P.run = false; }
  if (!P.moving || !P.run) S.stamina = Math.min(100, S.stamina + 15 * dt);
}
function checkDoors() {
  if (C.doorCd > 0) return;
  const tx = Math.floor(P.x / T), ty = Math.floor((P.y - 1) / T);
  for (const d of C.cur.doors) {
    if (d.x !== tx || d.y !== ty) continue;
    if (d.exit) { const r = C.cur.ret; Game.go('world', r.x, r.y, 'down'); }
    else { const m = W.get(d.to); Game.go(d.to, m.spawn.x, m.spawn.y, 'up'); }
    return;
  }
}
function updateBullets(dt) {
  const m = C.cur;
  for (const b of C.bullets) {
    b.t += dt; b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.t > b.life || W.solidAt(m, b.x, b.y) === 1) { b.dead = true; continue; }
    for (const e of m.ents) {
      if (e.kind === 'static' || e.kind === 'deco' || e.stun > 0) continue;
      if (Math.abs(e.x - b.x) < 7 && Math.abs((e.y - 10) - b.y) < 12) { b.dead = true; Game.onShotHit(e); break; }
    }
  }
  C.bullets = C.bullets.filter(b => !b.dead);
}
function updateRegrow() {
  if (!C.cutTrees.length) return;
  for (const t of C.cutTrees) if (C.now > t.regrow) { t.cut = false; t.hp = 3; if (C.cur && C.cur.outdoor) C.cur.solid[t.ty * C.cur.w + t.tx] = 1; }
  C.cutTrees = C.cutTrees.filter(t => t.cut);
}
function update(dt) {
  C.now += dt;
  UI.dialogUpdate(dt);
  // fondu
  const f = C.fade;
  if (f.dir !== 0) {
    f.a += f.dir * dt * 5;
    if (f.dir > 0 && f.a >= 1) { f.a = 1; const cb = f.cb; f.cb = null; f.dir = -1; if (cb) cb(); }
    else if (f.dir < 0 && f.a <= 0) { f.a = 0; f.dir = 0; }
  }
  if (C.mode !== 'play' || !C.cur) return;
  if (C.cur.name === 'casino') RG.Casino.update(dt);
  if (RG.Life) RG.Life.update(dt);
  if (S.jail) { Game.updateJail(dt); return; }
  if (C.mini) { Game.updateMini(dt); return; }
  if (UI.isModal() || UI.dialogOpen() || f.dir !== 0) return;
  updateNeeds(dt, P.run);
  const busy = C.fishing || C.chop;
  if (!busy) movePlayer(dt); else { P.moving = false; P.anim = 0; }
  if (C.fishing) Game.updateFishing(dt);
  if (C.chop) { C.chop.t -= dt; if (C.chop.t <= 0) C.chop = null; }
  const info = { x: P.x, y: P.y, wanted: S.wanted, armed: !!S.equip.weapon, safe: false };
  E.update(C.cur, dt, info);
  E.updatePets(C.cur, C.pets, dt, P);
  updateBullets(dt);
  updateRegrow();
  Game.updatePolice(dt);
  Game.updateParcel(dt);
  checkDoors();
  if (C.doorCd > 0) C.doorCd -= dt;
  for (const q of C.floaters) q.t += dt; C.floaters = C.floaters.filter(q => q.t < 1.2);
  for (const q of C.parts) { q.t += dt; q.y += q.vy * dt; } C.parts = C.parts.filter(q => q.t < q.life);
  Game.updateTarget();
  C.saveT += dt; if (C.saveT > 30) { C.saveT = 0; Game.save(); }
}

/* ------------------------------------------------------------------ */
/*  Rendu                                                              */
/* ------------------------------------------------------------------ */
const HEART = ['.#.#.', '#####', '.###.', '..#..'];
function drawHeart(x, y) { ctx.fillStyle = '#ff5a7a'; HEART.forEach((r, j) => { for (let i = 0; i < 5; i++) if (r[i] === '#') ctx.fillRect(x + i, y + j, 1, 1); }); }
function nameTag(text, x, y, col) { U.drawText(ctx, text, Math.round(x - U.textW(U.norm(text)) / 2), Math.round(y), col || '#fffbe8', '#3a261c'); }

function drawPerson(e, isPlayer) {
  const ap = isPlayer ? S.ap : e.ap;
  const fr = (isPlayer ? P.anim : e.anim) > 0 ? WALK[Math.floor(isPlayer ? P.anim : e.anim) % 4] : 0;
  const dir = isPlayer ? P.dir : e.dir;
  const spr = Sp.char(ap, dir, fr, isPlayer ? S.equip.mask : false);
  const x = Math.round(e.x), y = Math.round(e.y);
  if (e.kid) { const k = e.kscale || (e.baby ? 0.5 : 0.7); ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(x - 4 - camX, y - 1 - camY, 8, 2); ctx.drawImage(spr, Math.round(x - 9 * k - camX), Math.round(y - 31 * k - camY), Math.round(18 * k), Math.round(32 * k)); return; }
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(x - 4 - camX, y - 2 - camY, 8, 1); ctx.fillRect(x - 6 - camX, y - 1 - camY, 12, 2); ctx.fillRect(x - 4 - camX, y + 1 - camY, 8, 1);
  if (e.stun > 0) {
    ctx.save(); ctx.translate(x - camX, y - camY - 2); ctx.rotate(Math.PI / 2); ctx.drawImage(spr, -16, -9); ctx.restore();
    U.drawText(ctx, 'ZZZ', x - 5 - camX, y - 14 - camY, '#cfeefa', '#000');
  } else {
    ctx.drawImage(spr, x - 9 - camX, y - 31 - camY);
    if (isPlayer && S.equip.weapon) drawHeld(x - camX, y - camY, dir);
  }
}
function drawHeld(x, y, dir) {
  const id = S.equip.weapon, it = D.ITEMS[id]; if (!it) return;
  const ic = RG.Icons.canvas(id), hx = { down: 5, up: -5, left: -13, right: -5 }[dir] || 5;
  ctx.drawImage(ic, x + hx - 1, y - 24);
}
function drawAnimal(e) {
  const sz = Sp.animalSize[e.atype];
  const fr = e.anim > 0 ? 1 + (Math.floor(e.anim) % 2) : 0;
  const spr = Sp.animal(e.atype, e.v, fr, e.right);
  const x = Math.round(e.x), y = Math.round(e.y);
  if (e.atype === 'canard') { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x - 6 - camX, y - 1 - camY, 12, 1); }
  else { ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x - 5 - camX, y - 1 - camY, 10, 2); }
  ctx.drawImage(spr, x - Math.floor(spr.width / 2) - camX, y - (spr.height - 1) - camY - (e.atype === 'canard' ? 0 : 0));
}
function entDraw(e) {
  if (e.hidden) return;
  if (e.kind === 'animal' || e.kind === 'pet') drawAnimal(e);
  else {
    if (e.kind === 'deco' && e.folded) { /* se couche : même rendu */ }
    drawPerson(e, false);
  }
}
Game.questMark = null;
function render() {
  const m = C.cur; if (!m) return;
  const mw = m.w * T, mh = m.h * T;
  const cx = P.x - VW / 2, cy = P.y - 14 - VH / 2;
  camX = mw <= VW ? Math.round((mw - VW) / 2) : U.clamp(Math.round(cx), 0, mw - VW);
  camY = mh <= VH ? Math.round((mh - VH) / 2) : U.clamp(Math.round(cy), 0, mh - VH);
  ctx.fillStyle = '#14101a'; ctx.fillRect(0, 0, VW, VH);
  ctx.drawImage(m.bg, -camX, -camY);

  if (m.outdoor) {
    const tx0 = Math.max(0, Math.floor(camX / T)), tx1 = Math.min(m.w - 1, Math.floor((camX + VW) / T));
    const ty0 = Math.max(0, Math.floor(camY / T)), ty1 = Math.min(m.h - 1, Math.floor((camY + VH) / T));
    ctx.fillStyle = '#d8f4fb';
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      if (m.ground[ty * m.w + tx] !== 2) continue;
      for (let k = 0; k < 2; k++) {
        const ph = C.now * 1.3 + U.hash(tx, ty, k + 20) * 6.28;
        if (Math.sin(ph) > 0.55) ctx.fillRect(tx * T + 2 + Math.floor(U.hash(tx, ty, k + 30) * 10) - camX, ty * T + 3 + Math.floor(U.hash(tx, ty, k + 40) * 10) - camY, 3, 1);
      }
    }
  }
  const list = [];
  for (const s of m.statics) { if (s.x > camX + VW || s.x + s.img.width < camX || s.y > camY + VH || s.y + s.img.height < camY) continue; list.push({ y: s.sortY, d: () => ctx.drawImage(s.img, s.x - camX, s.y - camY) }); }
  if (m.outdoor) {
    for (const t of m.trees) {
      const x = t.tx * T - 9, y = t.ty * T - 24;
      if (x > camX + VW || x + 34 < camX || y > camY + VH || y + 42 < camY) continue;
      if (t.cut) list.push({ y: (t.ty + 1) * T, d: () => ctx.drawImage(Sp.stump(), t.tx * T - 1 - camX, t.ty * T + 6 - camY) });
      else list.push({ y: (t.ty + 1) * T, d: () => {
        ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(t.tx * T + 8 - 9 - camX, t.ty * T + 12 - camY, 18, 3); ctx.fillRect(t.tx * T + 8 - 7 - camX, t.ty * T + 15 - camY, 14, 2);
        ctx.drawImage(Sp.tree(t.v), x - camX, y - camY);
        if (C.chop && C.chop.tree === t) { const k = (3 - t.hp) / 3; ctx.fillStyle = '#000'; ctx.fillRect(t.tx * T - camX, t.ty * T - 27 - camY, 16, 3); ctx.fillStyle = '#e8a93b'; ctx.fillRect(t.tx * T + 1 - camX, t.ty * T - 26 - camY, Math.round(14 * k), 1); }
      } });
    }
  }
  for (const e of m.ents) { if (e.x < camX - 40 || e.x > camX + VW + 40 || e.y < camY - 20 || e.y > camY + VH + 60) continue; list.push({ y: e.y, d: () => entDraw(e), e }); }
  for (const p of C.pets) list.push({ y: p.y, d: () => drawAnimal(p), e: p });
  list.push({ y: P.y, d: () => drawPerson(P, true) });
  list.sort((a, b) => a.y - b.y);
  for (const it of list) it.d();

  if (C.place && RG.Life) RG.Life.drawGhost(ctx, camX, camY);
  // pêche : flotteur
  if (C.fishing) {
    const f = C.fishing, bx = Math.round(f.x - camX), by = Math.round(f.y - camY);
    const bob = f.phase === 'bite' ? Math.round(Math.sin(C.now * 30)) : 0;
    ctx.fillStyle = '#fff'; ctx.fillRect(bx - 1, by - 2 + bob, 3, 2); ctx.fillStyle = '#e0443a'; ctx.fillRect(bx - 1, by + bob, 3, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(bx - 4, by + 3, 9, 1);
    if (f.phase === 'bite') U.drawText(ctx, '!', bx - 1, by - 12, '#ff4040', '#000');
    ctx.fillStyle = '#d8d0b0'; ctx.fillRect(Math.round(P.x - camX), Math.round(P.y - 26 - camY), Math.max(1, Math.abs(bx - Math.round(P.x - camX))), 1);
  }
  // balles
  ctx.fillStyle = '#ffe36a';
  for (const b of C.bullets) ctx.fillRect(Math.round(b.x - camX) - 1, Math.round(b.y - camY) - 1, 3, 3);
  // marqueur de livraison
  if (S.parcel && m.outdoor) {
    const h = m.houses[S.parcel.hid];
    if (h) { const bx = h.doorX * T + 8 - camX, by = h.doorY * T - 22 - camY + Math.round(Math.sin(C.now * 4) * 2); ctx.fillStyle = '#ffd54f'; ctx.fillRect(bx - 3, by, 7, 5); ctx.fillRect(bx - 1, by + 5, 3, 2); ctx.fillRect(bx, by + 7, 1, 1); U.drawText(ctx, String(h.num), Math.round(bx - U.textW(String(h.num)) / 2), by - 7, '#fff', '#000'); }
  }
  if (m.name === 'casino') RG.Casino.drawWorld(ctx, camX, camY);

  // nuit
  if (m.outdoor) {
    const hr = (S.time || 0) / 60, dk = darkness(hr);
    if (dk > 0.01) {
      lctx.globalCompositeOperation = 'source-over'; lctx.clearRect(0, 0, VW, VH);
      lctx.fillStyle = 'rgba(10,14,48,' + dk.toFixed(3) + ')'; lctx.fillRect(0, 0, VW, VH);
      lctx.globalCompositeOperation = 'destination-out';
      const pl = glow(80, 'rgba(0,0,0,A)', 1); lctx.drawImage(pl, Math.round(P.x - camX - 80), Math.round(P.y - 14 - camY - 80));
      for (const l of m.lights) { if (l.x < camX - l.r || l.x > camX + VW + l.r || l.y < camY - l.r || l.y > camY + VH + l.r) continue; lctx.drawImage(glow(l.r, 'rgba(0,0,0,A)', 0.95), Math.round(l.x - camX - l.r), Math.round(l.y - camY - l.r)); }
      ctx.drawImage(lightCv, 0, 0);
      ctx.globalCompositeOperation = 'lighter';
      for (const l of m.lights) { if (l.x < camX - l.r || l.x > camX + VW + l.r || l.y < camY - l.r || l.y > camY + VH + l.r) continue; if (l.c !== '#ffe9a0') { ctx.globalAlpha = 0.22 * dk / 0.62; const cc = l.c; const rr = parseInt(cc.slice(1, 3), 16), gg = parseInt(cc.slice(3, 5), 16), bb = parseInt(cc.slice(5, 7), 16); ctx.drawImage(glow(l.r, 'rgba(' + rr + ',' + gg + ',' + bb + ',A)', 0.9), Math.round(l.x - camX - l.r), Math.round(l.y - camY - l.r)); ctx.globalAlpha = 1; } }
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  // étiquettes
  for (const it of list) {
    const e = it.e; if (!e || e.hidden || e.kind === 'animal' || e.kind === 'deco' && false) continue;
    const d = Math.hypot(P.x - e.x, P.y - e.y);
    if (e.kind === 'pet') { if (d < 40) nameTag(e.name, e.x - camX, e.y - 18 - camY, '#ffd0e0'); continue; }
    if (d < 52 || (e.kind === 'static' && Game.questMark && Game.questMark(e))) {
      if (d < 52) nameTag(e.name, e.x - camX, e.y - 38 - camY, e.kind === 'cop' ? '#9fc0ff' : '#fffbe8');
    }
    if (e.kind === 'static' && Game.questMark) {
      const q = Game.questMark(e);
      if (q) { const bob = Math.round(Math.sin(C.now * 5) * 1.5); U.drawText(ctx, q.c, Math.round(e.x - camX - 1), Math.round(e.y - 45 - camY + bob), q.col, '#3a261c'); }
    }
    if (e.flee > 0) U.drawText(ctx, '!', Math.round(e.x - camX - 1), Math.round(e.y - 40 - camY), '#ff4040', '#000');
    if (e.kind === 'cop' && e.chase) U.drawText(ctx, '!', Math.round(e.x - camX - 1), Math.round(e.y - 40 - camY), '#4b78ff', '#fff');
  }
  if (C.target && C.target.e && C.target.e.kind === 'animal') { /* rien */ }
  for (const q of C.floaters) U.drawText(ctx, q.text, Math.round(q.x - camX - U.textW(U.norm(q.text)) / 2), Math.round(q.y - camY - 40 - q.t * 14), q.col, '#000');
  for (const q of C.parts) if (q.k === 'heart') drawHeart(Math.round(q.x - camX), Math.round(q.y - camY));
  if (C.fade.a > 0) { ctx.fillStyle = 'rgba(10,8,16,' + C.fade.a.toFixed(2) + ')'; ctx.fillRect(0, 0, VW, VH); }
}
/* minicarte */
const mini = document.getElementById('mini'), mctx = mini.getContext('2d');
function drawMini() {
  const m = C.cur; if (!m) return;
  if (!m.outdoor) { mini.style.display = 'none'; return; }
  mini.style.display = 'block';
  mctx.imageSmoothingEnabled = false;
  mctx.drawImage(m.mini, 0, 0);
  if (S.parcel) { const h = m.houses[S.parcel.hid]; if (h) { mctx.fillStyle = '#ffd54f'; mctx.fillRect(h.doorX - 1, h.doorY - 1, 3, 3); } }
  mctx.fillStyle = '#e0443a';
  for (const e of m.ents) if (e.kind === 'cop' && (S.wanted > 0 || e.chase)) mctx.fillRect(Math.floor(e.x / T) - 1, Math.floor(e.y / T) - 1, 2, 2);
  mctx.fillStyle = '#fff'; if (Math.floor(C.now * 3) % 2) mctx.fillRect(Math.floor(P.x / T) - 1, Math.floor(P.y / T) - 1, 3, 3);
  mctx.fillStyle = '#ff2a6a'; mctx.fillRect(Math.floor(P.x / T), Math.floor(P.y / T), 1, 1);
}

/* ------------------------------------------------------------------ */
/*  Boucle                                                             */
/* ------------------------------------------------------------------ */
let last = performance.now(), errShown = false;
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
  try {
    update(dt);
    if (C.cur) {
      render();
      C.hudT -= dt; if (C.hudT <= 0 && C.mode === 'play') { C.hudT = 0.12; UI.hud(S); drawMini(); }
    }
  } catch (e) { if (!errShown) { errShown = true; console.error(e); } }
  requestAnimationFrame(frame);
}
Game.boot = () => {
  UI.init();
  const gid = id => document.getElementById(id);
  gid('btn-bag').onclick = () => { if (C.mode === 'play' && !UI.isModal() && !UI.dialogOpen()) UI.inventory(); };
  gid('btn-quest').onclick = () => { if (C.mode === 'play' && !UI.isModal() && !UI.dialogOpen()) UI.quests(); };
  gid('btn-friends').onclick = () => { if (C.mode === 'play' && !UI.isModal() && !UI.dialogOpen()) RG.Life.friends(); };
  gid('btn-build').onclick = () => { if (C.mode === 'play' && !UI.isModal() && !UI.dialogOpen()) RG.Life.build(); };
  gid('btn-menu').onclick = () => { if (C.mode === 'play' && !UI.isModal() && !UI.dialogOpen()) UI.pause(); };
  resize();
  W.build();
  for (const k of Object.keys(W.maps)) E.populate(W.maps[k]);
  RG.Casino.init(W.get('casino'));
  C.cur = W.get('world'); P.x = 62 * T; P.y = 50 * T;
  const has = !!readSave();
  freshState();
  UI.showTitle(has, { cont: Game.continue, new: Game.newGame });
  last = performance.now();
  requestAnimationFrame(frame);
};
})();
