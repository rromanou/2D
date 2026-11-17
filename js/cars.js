(() => {
'use strict';
const RG = window.RG, U = RG.U, UI = RG.UI, D = RG.Data, E = RG.Ent, W = RG.World, T = RG.T, G = RG.Game, C = RG.core, S = RG.S, L = RG.Life, P = RG.P;
const esc = UI.esc, money = U.money;
const Cars = RG.Cars = {};
const pick = a => a[Math.floor(Math.random() * a.length)];
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const KMH = 1.6; // px/s par km/h
const MODELS = {
  citadine: { n: 'Citadine', price: 1800, kmh: 95, acc: 120, grip: 8, turn: 2.6, hp: 100, len: 20 },
  berline: { n: 'Berline', price: 5200, kmh: 130, acc: 150, grip: 9, turn: 2.4, hp: 140, len: 24 },
  suv: { n: 'SUV', price: 9000, kmh: 125, acc: 140, grip: 10, turn: 2.2, hp: 200, len: 25 },
  sport: { n: 'Sportive', price: 14000, kmh: 190, acc: 230, grip: 6.5, turn: 2.7, hp: 110, len: 23 },
  patrouille: { n: 'Patrouille', price: 0, kmh: 185, acc: 210, grip: 9, turn: 2.6, hp: 220, len: 25 }
};
const COLORS = ['#c8403a', '#3a6fc8', '#4fa05a', '#e8c030', '#f2f2f2', '#2b2b33', '#8a63c9', '#e87a2a'];
const WINGS = ['Aucun', 'Petit aileron', 'Grand aileron'];
const spec = c => {
  const m = MODELS[c.model], u = c.up || {};
  const e = u.engine | 0, s = u.susp | 0, t = u.tires | 0, w = u.wing | 0, dr = c.drift ? 1 : 0;
  return { kmh: m.kmh * (1 + 0.08 * e), acc: m.acc * (1 + 0.12 * e), grip: (m.grip + 0.5 * s + 0.6 * t + 0.4 * w) * (dr ? 0.5 : 1), turn: (m.turn + 0.15 * s + 0.1 * w) * (dr ? 1.15 : 1), hp: m.hp };
};

/* ================================================================== */
/*  Carte de l'autoroute                                               */
/* ================================================================== */
const HW = 240, HH = 18, HAX = [40, 120, 200];
function buildHighway() {
  if (W.maps.autoroute) return;
  const m = { name: 'autoroute', w: HW, h: HH, outdoor: true, ground: new Uint8Array(HW * HH), solid: new Uint8Array(HW * HH), statics: [], doors: [], zones: [], npcs: [], animals: [], lights: [], houses: [], trees: [], bg: null, title: 'Autoroute', ret: null, ents: [], hw: true };
  const bg = U.mk(HW * T, HH * T), c = bg.getContext('2d'), R = U.R;
  for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) {
    const px = x * T, py = y * T;
    let col = (x + y) % 2 ? '#79b560' : '#7bb961';
    if (y >= 4 && y <= 10) { col = '#585c66'; if ((x * 7 + y * 3) % 11 === 0) col = '#50545e'; }
    if (y === 3 || y === 11) col = '#9a9ea8';
    if (y === 7) col = '#8a8f98';
    R(c, px, py, T, T, col);
    if (y >= 4 && y <= 10) m.ground[y * HW + x] = 1; else m.ground[y * HW + x] = 0;
    if (y === 3 || y === 11) { m.solid[y * HW + x] = 1; R(c, px, py + 5, T, 2, '#c8ccd4'); R(c, px, py + 9, T, 2, '#6a6e78'); if (x % 4 === 0) R(c, px + 6, py + 3, 2, 10, '#4a4e58'); }
    if (y === 7) { m.solid[y * HW + x] = 1; R(c, px, py + 3, T, 10, '#a8adb6'); R(c, px, py + 3, T, 2, '#d8dce4'); R(c, px, py + 11, T, 2, '#767b84'); }
  }
  for (let x = 0; x < HW; x++) { R(c, x * T, 4 * T + 13, T, 2, '#e8e8e8'); R(c, x * T, 10 * T + 1, T, 2, '#e8e8e8'); if (x % 2 === 0) { R(c, x * T + 2, 5 * T + 15, 10, 1, '#e8e8e8'); R(c, x * T + 2, 8 * T + 15, 10, 1, '#e8e8e8'); } }
  for (let k = 12; k < HW - 8; k += 40) { // panneaux de limitation
    R(c, k * T + 7, 2 * T + 2, 2, 14, '#6a6e78'); R(c, k * T + 1, 1 * T, 14, 14, '#fff'); R(c, k * T + 2, 1 * T + 1, 12, 12, '#d83a2a'); R(c, k * T + 3, 1 * T + 2, 10, 10, '#fff');
    U.drawText(c, '110', k * T + 3, 1 * T + 4, '#111', null);
  }
  c.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = 0; x < HW; x += 3) c.fillRect(x * T, 11 * T + 14, T * 2, 2);
  for (const ax of HAX) for (let k = 0; k < 2; k++) { m.solid[11 * HW + ax + k] = 0; R(c, (ax + k) * T, 11 * T, T, T, '#6b6f78'); R(c, (ax + k) * T, 11 * T, T, 2, '#e8d77a'); }
  for (const ax of HAX) { R(c, (ax - 1) * T, 12 * T + 2, T * 4, 10, '#1b5a8a'); U.drawText(c, 'VILLAGE', (ax - 1) * T + 6, 12 * T + 4, '#fff', null); }
  m.bg = bg; m.doorsById = {}; m.farm = null; m.lake = null;
  m.mini = W.makeMini(m); W.maps.autoroute = m;
}

/* ================================================================== */
/*  Dessin des voitures                                                */
/* ================================================================== */
function shade(col, k) { return U.shade ? U.shade(col, k) : col; }
function drawCarShape(ctx, x, y, ang, o) {
  const len = o.len || 24, wd = 12, hl = len / 2, hw = wd / 2;
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(ang);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-hl + 1, -hw + 2, len, wd);
  ctx.fillStyle = '#1b1b22'; ctx.fillRect(-hl + 2, -hw - 1, 5, 2); ctx.fillRect(-hl + 2, hw - 1, 5, 2); ctx.fillRect(hl - 7, -hw - 1, 5, 2); ctx.fillRect(hl - 7, hw - 1, 5, 2);
  ctx.fillStyle = shade(o.color, -30); ctx.fillRect(-hl, -hw, len, wd);
  ctx.fillStyle = o.color; ctx.fillRect(-hl + 1, -hw + 1, len - 2, wd - 2);
  ctx.fillStyle = shade(o.color, 25); ctx.fillRect(-hl + 2, -hw + 1, len - 4, 2);
  if (o.police) { ctx.fillStyle = '#f2f2f2'; ctx.fillRect(-hl + 5, -hw + 1, 7, wd - 2); }
  ctx.fillStyle = o.tint ? '#161c26' : '#9ad8f0'; ctx.fillRect(hl - 9, -hw + 2, 5, wd - 4); ctx.fillStyle = o.tint ? '#10151d' : '#6fb0cc'; ctx.fillRect(-hl + 5, -hw + 2, 4, wd - 4);
  ctx.fillStyle = '#2b3a48'; ctx.fillRect(-2, -hw + 2, 6, wd - 4);
  if (o.wing) { ctx.fillStyle = '#1b1b22'; ctx.fillRect(-hl - 1, -hw - 1, 2, wd + 2); if (o.wing > 1) ctx.fillRect(-hl - 3, -hw - 2, 3, wd + 4); }
  const lights = o.lights || o.ai;
  ctx.fillStyle = lights ? '#fff8c0' : '#d8d4a8'; ctx.fillRect(hl - 1, -hw + 1, 2, 3); if (o.hl) { ctx.fillStyle = '#3a3a40'; } ctx.fillRect(hl - 1, hw - 4, 2, 3);
  ctx.fillStyle = o.brake ? '#ff3030' : '#8a1f1f'; ctx.fillRect(-hl, -hw + 1, 1, 3); if (o.tl) ctx.fillStyle = '#2a2a2e'; ctx.fillRect(-hl, hw - 4, 1, 3);
  const blink = Math.floor(C.now * 3) % 2 === 0;
  if (o.haz && blink) { ctx.fillStyle = '#ffa020'; ctx.fillRect(hl - 2, -hw, 3, 2); ctx.fillRect(hl - 2, hw - 2, 3, 2); ctx.fillRect(-hl, -hw, 3, 2); ctx.fillRect(-hl, hw - 2, 3, 2); }
  if (o.siren) { const t = Math.floor(C.now * 6) % 2; ctx.fillStyle = t ? '#ff2a2a' : '#2a5aff'; ctx.fillRect(-1, -hw + 3, 3, 3); ctx.fillStyle = t ? '#2a5aff' : '#ff2a2a'; ctx.fillRect(-1, hw - 6, 3, 3); }
  if (o.smoke) { ctx.fillStyle = 'rgba(200,200,200,0.6)'; ctx.fillRect(hl - 4 + Math.round(Math.sin(C.now * 5) * 2), -3 + Math.round(Math.cos(C.now * 4) * 2), 5, 5); ctx.fillStyle = 'rgba(90,90,90,0.6)'; ctx.fillRect(hl - 9, -2 + Math.round(Math.sin(C.now * 6)), 4, 4); }
  ctx.restore();
}
Cars.drawCar = (ctx, e, camX, camY) => drawCarShape(ctx, e.x - camX, e.y - 5 - camY, e.ang, { color: e.color, len: e.len, ai: e.ai && C.cur && C.cur.hw || (S.time / 60 > 19 || S.time / 60 < 6), haz: e.haz || e.crash || e.pulled, brake: e.brake, siren: (e.cop || e.ally) && e.siren, police: e.cop || e.police || e.ally, smoke: e.crash || e.smoke || (e.def && e.def.smoke), tint: e.def && e.def.tint, hl: e.def && e.def.hl, tl: e.def && e.def.tl, wing: e.wing });
Cars.drawPlayer = (ctx, camX, camY) => { const c = P.car; drawCarShape(ctx, P.x - camX, P.y - 5 - camY, c.ang, { color: c.color, len: c.len, lights: c.lights, haz: c.haz, brake: c.braking, wing: c.wing, smoke: c.hp <= 15, siren: c.siren, police: c.police }); };

/* ================================================================== */
/*  Conduite                                                           */
/* ================================================================== */
const limitHere = () => C.cur && C.cur.hw ? 110 : C.cur && C.cur.name === 'world' ? 50 : 30;
const licOk = () => !!(S.lic && S.lic.pass && S.abs < S.lic.exp);
let speedo = null, spT = 0, speedTimer = 0, lastHit = 0;
function hud() {
  if (!speedo) { speedo = document.createElement('div'); speedo.style.cssText = 'position:absolute;right:12px;bottom:12px;background:#15151c;color:#fff;border:3px solid #4a3426;box-shadow:0 0 0 2px #2b1b14;padding:6px 10px;font-family:Pixel,monospace;font-size:14px;z-index:6;display:none;text-align:right;line-height:1.3'; document.getElementById('ui').appendChild(speedo); }
  if (!P.car) { speedo.style.display = 'none'; return; }
  const kmh = Math.round(Math.hypot(P.car.vx, P.car.vy) / KMH), lim = limitHere(), over = kmh > lim + 5;
  speedo.style.display = 'block';
  speedo.innerHTML = '<b style="font-size:24px;color:' + (over ? '#ff5a4a' : '#8dff8d') + '">' + kmh + '</b> km/h<br>Limite ' + lim + (P.car.hp < 35 ? '<br><span style="color:#ff8a4a">Voiture endommagée</span>' : '') + '<br><span style="color:#9aa">H flashers - L phares - E sortir</span>';
}
Cars.toggle = k => { if (!P.car) return; P.car[k] = !P.car[k]; U.sfx('click'); };
Cars.enter = e => {
  if (!S.car) return;
  if (!licOk()) UI.toast(S.lic && S.lic.pass ? 'Ton permis a expiré ! Conduire sans permis = prison longue.' : 'Tu n\'as pas de permis ! Si la police te voit, c\'est la prison.', 'err');
  const sp = spec(S.car);
  P.car = { model: S.car.model, color: S.car.color, wing: (S.car.up || {}).wing | 0, len: MODELS[S.car.model].len, ang: e.ang || 0, vx: 0, vy: 0, hp: S.car.hp == null ? sp.hp : S.car.hp, lights: S.time / 60 > 19 || S.time / 60 < 6, haz: false };
  P.x = e.x; P.y = e.y; C.cur.ents = C.cur.ents.filter(x => x !== e);
  C.pets = []; P.run = false; P.moving = false; U.sfx('door');
  UI.toast('Au volant : flèches/ZQSD, Maj = frein à main (drift).', 'ok');
};
Cars.enterPolice = e => {
  if (!licOk()) { UI.toast('Il faut un permis valide pour conduire la voiture de patrouille.', 'err'); return; }
  P.car = { model: 'patrouille', police: true, color: '#1b2a52', wing: 0, len: 25, ang: e.ang || 0, vx: 0, vy: 0, hp: e.hp || 220, lights: S.time / 60 > 19 || S.time / 60 < 6, haz: false, siren: false, pass: [] };
  P.x = e.x; P.y = e.y; C.cur.ents = C.cur.ents.filter(x => x !== e); C.pets = []; P.run = false; P.moving = false; U.sfx('door');
  UI.toast('Patrouille : K = sirène, H = flashers, L = phares.', 'ok');
};
Cars.exit = () => {
  const c = P.car; if (!c) return;
  if (Math.hypot(c.vx, c.vy) / KMH > 12) { UI.toast('Arrête-toi d\'abord pour sortir.', 'err'); return; }
  if (c.police) parkPolice(c); else { S.car.hp = c.hp; S.car.map = C.cur.name; S.car.x = P.x; S.car.y = P.y; S.car.ang = c.ang; placeParked(C.cur); }
  P.car = null; P.x += Math.cos(c.ang + Math.PI / 2) * 18; P.y += Math.sin(c.ang + Math.PI / 2) * 18;
  if (W.hit(C.cur, P.x, P.y, 5, 4)) { P.x = c.police ? P.x - Math.cos(c.ang + Math.PI / 2) * 30 : S.car.x; P.y = c.police ? P.y - Math.sin(c.ang + Math.PI / 2) * 30 : S.car.y + 14; }
  if (c.police && RG.Police && RG.Police.afterExit) RG.Police.afterExit(c);
  if (G.syncPets) { G.syncPets(); G.placePets && G.placePets(); }
  U.sfx('door');
};
function parkPolice(c) {
  C.cur.ents.push(E.make('car', { patrol: true, police: true, x: P.x, y: P.y, ang: c.ang, color: '#1b2a52', len: 25, spd: 0, hp: c.hp, vx: 0, vy: 0 }));
}
function placeParked(m) {
  if (!S.car || !m) return;
  m.ents = m.ents.filter(e => !e.owner);
  if (S.car.map !== m.name || P.car) return;
  m.ents.push(E.make('car', { owner: true, x: S.car.x, y: S.car.y, ang: S.car.ang || 0, color: S.car.color, len: MODELS[S.car.model].len, wing: (S.car.up || {}).wing | 0, spd: 0, hp: S.car.hp }));
}
G.carInteract = e => { if (e.patrol) { if (S.duty) Cars.enterPolice(e); else UI.toast('Voiture réservée aux policiers en service.', 'err'); } else if (e.pulled && S.duty && RG.Police) RG.Police.control(e); else if (e.owner) Cars.enter(e); else UI.toast('Ce n\'est pas ta voiture.'); };
const oldInteract = G.interact;
G.interact = () => { if (P.car) { Cars.exit(); return; } oldInteract(); };
Cars.drive = (dt, keys) => {
  const c = P.car, m = C.cur, sp = spec(c.police ? { model: 'patrouille' } : (S.car || { model: c.model }));
  const up = keys.up, down = keys.down, hb = keys.run;
  let steer = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  const maxV = (c.hp <= 15 ? 35 : sp.kmh) * KMH, fx = Math.cos(c.ang), fy = Math.sin(c.ang);
  let sf = c.vx * fx + c.vy * fy, sl = -c.vx * fy + c.vy * fx;
  c.braking = false;
  if (up) sf = Math.min(maxV, sf + sp.acc * dt * (sf < 0 ? 2.5 : 1));
  else if (down) { if (sf > 6) { sf -= sp.acc * 1.8 * dt; c.braking = true; } else sf = Math.max(-maxV * 0.35, sf - sp.acc * 0.6 * dt); }
  else sf *= Math.max(0, 1 - 0.7 * dt);
  if (hb) { sf *= Math.max(0, 1 - 1.2 * dt); c.braking = true; }
  const tr = sp.turn * Math.min(1, Math.abs(sf) / 50) * (1 / (1 + Math.abs(sf) / 170)) * (sf < 0 ? -1 : 1);
  c.ang += steer * tr * dt * (hb ? 1.6 : 1);
  const gr = hb ? 1.4 : sp.grip; sl *= Math.exp(-gr * dt);
  const nfx = Math.cos(c.ang), nfy = Math.sin(c.ang);
  c.vx = nfx * sf - nfy * sl; c.vy = nfy * sf + nfx * sl;
  const hw = 7, hh = 9; let hit = false;
  const nx = P.x + c.vx * dt, ny = P.y + c.vy * dt;
  if (!W.hit(m, nx, P.y, hw, hh)) P.x = nx; else { hit = true; c.vx *= -0.25; c.vy *= 0.6; }
  if (!W.hit(m, P.x, ny, hw, hh)) P.y = ny; else { hit = true; c.vy *= -0.25; c.vx *= 0.6; }
  const spd = Math.hypot(c.vx, c.vy);
  if (hit && spd > 20 && C.now - lastHit > 0.3) { lastHit = C.now; const imp = spd / KMH; U.sfx('err'); if (imp > 25) { c.hp = Math.max(0, c.hp - (imp - 20) * 0.35); G.floater(P.x, P.y - 10, 'Choc !', '#ffb060'); if (imp > 70) { S.hp = Math.max(0, S.hp - (imp - 70) * 0.25); } } }
  P.dir = Math.abs(Math.cos(c.ang)) > Math.abs(Math.sin(c.ang)) ? (Math.cos(c.ang) > 0 ? 'right' : 'left') : (Math.sin(c.ang) > 0 ? 'down' : 'up');
  P.dirx = nfx; P.diry = nfy; P.moving = false; P.anim = 0;
  collide(c, dt);
  highwayLinks(c);
};
function collide(c, dt) {
  const m = C.cur, spd = Math.hypot(c.vx, c.vy), kmh = spd / KMH;
  for (const e of m.ents) {
    if (e.kind === 'npc' && e.dying == null && !e.wait && Math.hypot(e.x - P.x, e.y - P.y) < 11 && kmh > 18 && !(e.stun > 0)) {
      e.hp = (e.hp == null ? 40 : e.hp) - (25 + kmh * 0.6); e.stun = 8; G.crimeDone && G.crimeDone(); G.addWanted(2); G.floater(e.x, e.y - 20, 'Renversé !', '#ff8a8a');
      if (e.hp <= 0) G.killNpc(e); c.vx *= 0.6; c.vy *= 0.6; U.sfx('err');
    }
    if (e.kind === 'car' && !e.owner) {
      const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy);
      if (d < 15) {
        const rel = Math.hypot(c.vx - (e.vx || 0), c.vy - (e.vy || 0)) / KMH;
        const nx = dx / (d || 1), ny = dy / (d || 1);
        P.x -= nx * (15 - d) * 0.5; P.y -= ny * (15 - d) * 0.5; e.x += nx * (15 - d) * 0.5; e.y += ny * (15 - d) * 0.5;
        c.vx = c.vx * 0.5 - nx * 20; c.vy = c.vy * 0.5 - ny * 20;
        if (C.now - lastHit > 0.4) {
          lastHit = C.now; U.sfx('err');
          if (rel > 15) { c.hp = Math.max(0, c.hp - rel * 0.3); if (!e.cop) { e.crash = true; e.crashT = 25; e.vx = e.vy = 0; if (!e.cop) { G.addWanted(1); G.crimeDone && G.crimeDone(); UI.toast('Accident ! Délit de fuite ?', 'err'); } } else { e.hp = (e.hp || 100) - rel * 0.5; } if (rel > 60) S.hp = Math.max(0, S.hp - (rel - 60) * 0.3); G.floater(P.x, P.y - 10, 'Collision !', '#ffb060'); }
        }
      }
    }
  }
}
function highwayLinks(c) {
  const m = C.cur; if (C.fade.dir !== 0) return;
  const keep = () => { const v = { vx: c.vx, vy: c.vy }; return v; };
  if (m.name === 'world') {
    const ty = Math.floor((P.y - 1) / T);
    if (P.x > (m.w - 3) * T && (ty === 46 || ty === 47)) { c.ang = 0; c.vx = Math.abs(c.vx) + 20; c.vy = 0; G.go('autoroute', 4 * T, 8.5 * T + 6, 'right'); }
    else if (P.x < 3 * T && (ty === 46 || ty === 47)) { c.ang = Math.PI; c.vx = -Math.abs(c.vx) - 20; c.vy = 0; G.go('autoroute', (HW - 5) * T, 5.5 * T + 6, 'left'); }
  } else if (m.hw) {
    if (P.x < 2 * T) { c.ang = Math.PI; c.vx = -Math.abs(c.vx); c.vy = 0; G.go('world', (W.get('world').w - 4) * T, 46 * T + 8, 'left'); }
    else if (P.x > (HW - 2) * T) { c.ang = 0; c.vx = Math.abs(c.vx); c.vy = 0; G.go('world', 4 * T, 47 * T + 8, 'right'); }
  }
}

/* ================================================================== */
/*  Circulation                                                        */
/* ================================================================== */
const carColor = () => pick(['#c8403a', '#3a6fc8', '#4fa05a', '#e8c030', '#d8d8d8', '#2b2b33', '#8a63c9', '#e87a2a', '#8a8a95']);
function speedPick() { const f = S.crimeF || 1; return Math.random() < 0.12 * f ? 130 + ri(0, 30) : pick([75, 90, 100, 105, 110, 110, 115, 125]); }
function mkTraffic(x, y, dir, vkmh, lane) {
  const f = S.crimeF || 1, rd = k => Math.random() < k * f;
  const def = { smoke: rd(0.05), tint: rd(0.07), hl: rd(0.07), tl: rd(0.05) };
  return E.make('car', { def,  ai: true, x, y, ang: dir > 0 ? 0 : Math.PI, dir, lane, color: carColor(), len: pick([20, 22, 24, 26]), vx: dir * vkmh * KMH, vy: 0, base: vkmh * KMH, v: vkmh * KMH, hp: 100, crash: false });
}
function spawnTraffic(m) {
  if (m.traffic) return; m.traffic = true;
  if (m.hw) {
    for (let i = 0; i < 34; i++) {
      const east = i % 2 === 0, row = east ? (Math.random() < 0.5 ? 8 : 9) : (Math.random() < 0.5 ? 5 : 6);
      const v = speedPick();
      m.ents.push(mkTraffic(ri(5, HW - 5) * T, row * T + 12, east ? 1 : -1, v, row));
    }
  } else if (m.name === 'world') {
    for (let i = 0; i < 18; i++) {
      const ry = pick([24, 35, 46, 68, 100, 112, 124, 136, 148]), east = Math.random() < 0.5, row = ry + (east ? 1 : 0);
      m.ents.push(mkTraffic(ri(6, m.w - 8) * T, row * T + 12, east ? 1 : -1, pick([30, 38, 45]), row));
    }
  }
}
function trafficStep(m, dt) {
  const cars = m.ents.filter(e => e.kind === 'car' && !e.owner && !e.patrol && !e.ally);
  const lim = m.hw ? 140 * KMH : 50 * KMH;
  for (const e of cars) {
    if (e.cop) continue;
    if (e.crash) { e.crashT -= dt; e.vx = e.vy = 0; if (e.crashT <= 0) { e.remove = true; m.respawn = (m.respawn || 0) + 1; } continue; }
    // freinage derrière un véhicule
    let ahead = null, ad = 1e9;
    for (const o of cars.concat(P.car ? [{ x: P.x, y: P.y, vx: P.car.vx, crash: false }] : [])) {
      if (o === e || Math.abs(o.y - e.y) > 9) continue; const d = (o.x - e.x) * e.dir; if (d > 0 && d < ad) { ad = d; ahead = o; }
    }
    if (e.sus) { ahead = null; ad = 1e9; }
    e.yielding = !!(P.car && P.car.siren && !e.sus && !e.pulled && Math.abs(e.x - P.x) < 320 && Math.abs(e.y - P.y) < 80);
    let target = e.pullAt && !e.pulled ? Math.min(e.base, 30 * KMH) : e.base;
    if (e.yielding) target = Math.min(target, 28 * KMH);
    if (ahead && ad < 58) { const av = Math.abs(ahead.vx || 0); target = ahead.crash ? 0 : Math.min(target, av); if (ad < 28) target = Math.min(target, av * 0.5); }
    e.v += Math.max(-220 * dt, Math.min(110 * dt, target - e.v)); e.brake = target < e.v - 5;
    if (ahead && ad < 20 && !ahead.crash && Math.abs((ahead.vx || 0) - e.v * e.dir) > 20 * KMH && m.hw && Math.random() < 0.02) { e.crash = true; e.crashT = 25; ahead.crash = ahead.owner ? false : true; ahead.crashT = 25; ahead.vx = 0; }
    e.vx = e.dir * Math.max(0, e.v); e.x += e.vx * dt; e.haz = false;
    if (e.x < 3 * T) { e.x = (m.w - 4) * T; } if (e.x > (m.w - 3) * T) { e.x = 4 * T; }
    // changement de voie si bloqué
    if (m.hw && ahead && ad < 36 && ahead.crash && !e.sw) { const alt = e.lane === 8 ? 9 : e.lane === 9 ? 8 : e.lane === 5 ? 6 : 5; if (!cars.some(o => o !== e && Math.abs(o.y - (alt * T + 12)) < 9 && Math.abs(o.x - e.x) < 40)) { e.lane = alt; e.sw = 3; } }
    if (e.sw) { e.sw -= dt; } let ty = e.lane * T + 12;
    if (e.pulled || e.pullAt || e.yielding) ty = m.hw ? (e.dir > 0 ? 10 * T + 8 : 4 * T + 8) : ty + (e.dir > 0 ? 6 : -6); e.y += Math.max(-30 * dt, Math.min(30 * dt, ty - e.y));
    e.ang = Math.atan2((ty - e.y) * 0.4, e.dir * 20) + (e.dir < 0 ? Math.PI : 0);
  }
  m.ents = m.ents.filter(e => !e.remove);
  const n = m.ents.filter(e => e.kind === 'car' && e.ai && !e.cop).length, want = m.hw ? 34 : 18;
  if (n < want && (m.respawn || 0) > 0) { m.respawn--; const east = Math.random() < 0.5, row = m.hw ? (east ? 8 : 5) + ri(0, 1) : pick([25, 36, 47, 69, 101, 113, 125, 137, 149]); const x = east ? 4 * T : (m.w - 5) * T; m.ents.push(mkTraffic(x, row * T + 12, east ? 1 : -1, m.hw ? speedPick() : 40, row)); }
}
// excès de vitesse -> poursuite
function violations(dt) {
  const c = P.car; if (!c || c.police) { speedTimer = 0; return; }
  const kmh = Math.hypot(c.vx, c.vy) / KMH, lim = limitHere();
  if (kmh > lim + 15) { speedTimer += dt; if (speedTimer > 4) { speedTimer = 0; const p = kmh > lim + 40 ? 0.75 : 0.4; if (Math.random() < p && S.wanted < 3) { G.addWanted(kmh > lim + 40 ? 2 : 1); UI.toast('Excès de vitesse ! ' + Math.round(kmh) + ' km/h pour ' + lim + '.', 'err'); } } } else speedTimer = Math.max(0, speedTimer - dt);
  if (!licOk()) {
    const m = C.cur; let near = false;
    for (const e of m.ents) if ((e.kind === 'cop' || e.cop) && Math.hypot(e.x - P.x, e.y - P.y) < 130) near = true;
    if (near) { S.nolic = 1; if (S.wanted < 2) { G.addWanted(2); UI.toast('Contrôle : conduite sans permis !', 'err'); } }
  }
}
// voitures de police : poursuite quand on est recherché au volant
function copCars(dt) {
  const m = C.cur; if (!m.outdoor) return;
  const cc = m.ents.filter(e => e.kind === 'car' && e.cop);
  if (P.car && S.wanted > 0) {
    const want = Math.min(4, 1 + S.wanted);
    C.copT = (C.copT || 0) - dt;
    if (cc.length < want && C.copT <= 0) { C.copT = 4; const a = Math.random() * 6.283, x = P.x + Math.cos(a) * 280, y = P.y + Math.sin(a) * 280; if (x > 3 * T && y > 3 * T && x < (m.w - 3) * T && y < (m.h - 3) * T && !W.hit(m, x, y, 7, 9)) m.ents.push(E.make('car', { cop: true, siren: true, x, y, ang: 0, color: '#2f4a8c', len: 24, vx: 0, vy: 0, hp: 100 })); }
  }
  for (const e of cc) {
    if (!P.car || S.wanted <= 0) { if ((e.idle = (e.idle || 0) + dt) > 10) e.remove = true; e.vx *= 0.9; e.vy *= 0.9; e.x += e.vx * dt; e.y += e.vy * dt; continue; }
    e.idle = 0;
    const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy), want = Math.atan2(dy, dx);
    let da = want - e.ang; while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283;
    e.ang += Math.max(-2.8 * dt, Math.min(2.8 * dt, da));
    const top = (S.wanted >= 3 ? 150 : 125) * KMH; let sp = Math.hypot(e.vx, e.vy); sp = Math.min(top, sp + 170 * dt); if (d < 30) sp = Math.min(sp, Math.hypot(P.car.vx, P.car.vy) + 40);
    e.vx = Math.cos(e.ang) * sp; e.vy = Math.sin(e.ang) * sp;
    const nx = e.x + e.vx * dt, ny = e.y + e.vy * dt;
    if (!W.hit(m, nx, e.y, 7, 9)) e.x = nx; else e.vx = 0; if (!W.hit(m, e.x, ny, 7, 9)) e.y = ny; else e.vy = 0;
    if (d < 17) {
      if (Math.hypot(P.car.vx, P.car.vy) / KMH < 22) { e.vx = e.vy = 0; if (G.arrest) { P.car.vx = P.car.vy = 0; Cars.forceExit(); G.arrest(); } return; }
      else if (C.now - lastHit > 0.5) { lastHit = C.now; P.car.hp = Math.max(0, P.car.hp - 6); P.car.vx *= 0.8; P.car.vy *= 0.8; U.sfx('err'); }
    }
  }
  m.ents = m.ents.filter(e => !e.remove);
}
Cars.forceExit = () => { const c = P.car; if (!c) return; if (c.police) { parkPolice(c); P.car = null; if (RG.Police && RG.Police.afterExit) RG.Police.afterExit(c); return; } S.car.hp = c.hp; S.car.map = C.cur.name; S.car.x = P.x; S.car.y = P.y; S.car.ang = c.ang; placeParked(C.cur); P.car = null; if (G.syncPets) G.syncPets(); };
Cars.placeParked = placeParked; Cars.KMH = KMH; Cars.limitHere = limitHere; Cars.licOk = licOk;
function dynLights() {
  const m = C.cur; if (!m || !m.outdoor) return;
  m.lights = m.lights.filter(l => !l.dyn);
  const night = S.time / 60 > 18.5 || S.time / 60 < 6.5; if (!night) return;
  if (P.car && P.car.lights) { const c = P.car; m.lights.push({ x: P.x + Math.cos(c.ang) * 40, y: P.y + Math.sin(c.ang) * 40 - 5, r: 58, c: '#ffe9a0', dyn: 1 }); }
  let n = 0; for (const e of m.ents) if (e.kind === 'car' && (e.ai || e.cop) && Math.abs(e.x - P.x) < 260 && n++ < 8) m.lights.push({ x: e.x + Math.cos(e.ang) * 30, y: e.y - 5 + Math.sin(e.ang) * 30, r: 44, c: e.cop ? '#ff4a4a' : '#ffe9a0', dyn: 1 });
}
const oldEnter = L.enter;
L.enter = name => { oldEnter(name); const m = W.get(name); if (m && m.outdoor) { if (!m.ents) m.ents = []; spawnTraffic(m); placeParked(m); } };
G.lifeEnter = L.enter;
const oldUpd = L.update;
L.update = dt => {
  oldUpd(dt);
  if (C.mode !== 'play') return;
  hud();
  const m = C.cur; if (!m || !m.outdoor || UI.isModal()) return;
  if (!P.car && C.fade.dir === 0) { // accès à pied à l'autoroute
    if (m.name === 'world' && m.hwy) { const ty = Math.floor(P.y / T), tx = Math.floor(P.x / T); const gi = m.hwy.gates.indexOf(m.hwy.gates.find(g => tx >= g && tx <= g + 1)); if (ty >= m.hwy.y0 && gi >= 0) { G.go('autoroute', HAX[gi] * T + 8, 10 * T + 2, 'up'); UI.toast('Autoroute : attention aux voitures !', 'err'); } }
    else if (m.hw) { const ty = Math.floor(P.y / T), tx = Math.floor(P.x / T); const gi = HAX.findIndex(g => tx >= g && tx <= g + 1); if (ty >= 11 && gi >= 0) { const w = W.get('world'); G.go('world', (w.hwy.gates[gi] + 1) * T, (w.hwy.y0 - 2) * T, 'up'); } }
  }
  if (m.traffic) trafficStep(m, dt);
  if (P.car) { violations(dt); copCars(dt); if (P.car && P.car.hp <= 0 && Math.hypot(P.car.vx, P.car.vy) < 8) UI.toast('Ta voiture est en panne : fais-la réparer au garage.', 'err'); }
  else if (m.ents.some(e => e.cop)) copCars(dt);
  dynLights();
};
const oldInit = L.init;
L.init = () => { oldInit(); buildHighway(); if (S.crimeF == null) S.crimeF = 1; S.lic = S.lic || { theory: false, pass: false, exp: 0 }; };

/* ================================================================== */
/*  Auto-école, concessionnaire, garage                                */
/* ================================================================== */
const ROADQ = [
  ['Que signifie un feu rouge ?', 'S\'arrêter', ['Accélérer', 'Klaxonner', 'Ralentir seulement']], ['Limite en village ?', '50 km/h', ['90 km/h', '30 km/h', '110 km/h']], ['Limite sur l\'autoroute ?', '110 km/h', ['50 km/h', '130 km/h', '90 km/h']],
  ['Que faire en cas d\'accident ?', 'S\'arrêter et alerter', ['S\'enfuir', 'Accélérer', 'Ne rien dire']], ['Les flashers servent à ?', 'Signaler un danger', ['Éclairer la route', 'Doubler', 'Se garer vite']], ['De nuit, on allume ?', 'Les phares', ['La radio', 'Les flashers', 'Rien']],
  ['Conduire sans permis est...', 'Un délit grave', ['Permis', 'Une simple amende', 'Autorisé le dimanche']], ['Un piéton traverse : on...', 'Freine et le laisse passer', ['Klaxonne', 'Accélère', 'Le contourne vite']]
];
const fmtLic = () => { if (!S.lic.pass) return S.lic.theory ? 'Code obtenu - examen pratique à passer' : 'Aucun permis'; const left = S.lic.exp - S.abs; return left > 0 ? 'Permis valide encore ' + Math.floor(left / 1440) + ' j ' + Math.floor((left % 1440) / 60) + ' h' : 'Permis EXPIRÉ'; };
const MENUS = {
  'x:drive': { label: 'Passer le permis', fn: () => {
    const l = S.lic;
    const ch = [];
    if (!l.theory) ch.push({ label: 'Examen du code (40 $)', fn: () => { if (S.money < 40) { UI.toast('Pas assez d\'argent.', 'err'); return; } S.money -= 40; L.games.quiz({ title: 'Code de la route', n: 4, qs: ROADQ, done: (ok, n) => { if (ok >= 3) { l.theory = true; UI.banner('Code obtenu !', ok + ' / ' + n); U.sfx('win'); } else UI.toast('Échec (' + ok + ' / ' + n + '). Réessaie.', 'err'); } }); } });
    else if (!l.pass) ch.push({ label: 'Examen pratique (80 $)', fn: () => { if (S.money < 80) { UI.toast('Pas assez d\'argent.', 'err'); return; } S.money -= 80; L.games.reflex({ title: 'Examen de conduite', done: ok => { if (ok >= 6) { l.pass = true; l.exp = S.abs + 7 * 1440; UI.banner('Permis obtenu !', 'Valable 7 jours'); U.sfx('win'); } else UI.toast('Échec (' + ok + ' / 8). Réessaie.', 'err'); } }); } });
    else ch.push({ label: 'Renouveler le permis (40 $)', fn: () => { if (S.money < 40) { UI.toast('Pas assez d\'argent.', 'err'); return; } S.money -= 40; l.exp = Math.max(S.abs, l.exp) + 7 * 1440; UI.toast('Permis renouvelé pour 7 jours.', 'ok'); U.sfx('cash'); } });
    ch.push({ label: 'Plus tard' });
    UI.say('Bernard', [fmtLic() + '.', 'Le permis expire chaque semaine : il faut le renouveler ici.'], ch);
  } },
  'x:cars': { label: 'Voir les voitures', fn: () => dealer() },
  'x:garage': { label: 'Atelier du garage', fn: () => garage() }
};
G.xMenus = MENUS;
const oldLZ0 = G.lifeZone;
G.lifeZone = z => { if (z.action && z.action.startsWith('x:') && MENUS[z.action]) { MENUS[z.action].fn(); return; } oldLZ0(z); };
function dealer() {
  let color = COLORS[0];
  UI.modal({ title: 'Concessionnaire', cls: 'wide',
    render: () => {
      let h = '<div class="money">Argent : <b>' + money(S.money) + '</b>' + (S.car ? ' - Reprise : ' + money(Math.round(MODELS[S.car.model].price * 0.5)) : '') + '</div><div class="sw">' + COLORS.map(c => '<button class="c' + (color === c ? ' sel' : '') + '" style="background:' + c + '" data-a="col" data-v="' + c + '"></button>').join('') + '</div><div class="list">';
      for (const id of Object.keys(MODELS)) { const m = MODELS[id]; h += '<div class="row"><div class="rn"><b>' + m.n + '</b><small>Vitesse max ' + m.kmh + ' km/h - Accélération ' + m.acc + ' - Adhérence ' + m.grip + ' - Solidité ' + m.hp + '</small></div><div class="rp">' + money(m.price) + '</div><button class="go" data-a="buy" data-i="' + id + '">Acheter</button></div>'; }
      return h + '</div>';
    },
    onAction: (a, b, m) => {
      if (a === 'col') color = b.dataset.v;
      else if (a === 'buy') { const mo = MODELS[b.dataset.i], trade = S.car ? Math.round(MODELS[S.car.model].price * 0.5) : 0; if (S.money + trade < mo.price) { UI.toast('Pas assez d\'argent.', 'err'); U.sfx('err'); return; }
        S.money += trade - mo.price; const f = G.walletPos || null; S.car = { model: b.dataset.i, color, up: {}, drift: false, hp: mo.hp, map: 'world', x: 62 * T, y: 81 * T + 6, ang: 0 };
        const w = W.get('world'), d = w.doorsById && w.doorsById.concession; if (d) { S.car.x = d.x * T + 16; S.car.y = 82 * T + 4; S.car.ang = 0; }
        UI.closeModal(); UI.banner('Nouvelle voiture !', mo.n + ' garée devant le concessionnaire'); U.sfx('win'); const wm = W.get('world'); placeParked(wm); return; }
      m.refresh();
    } });
}
function garage() {
  const c = S.car;
  if (!c) { UI.say('Roméo', ['Tu n\'as pas de voiture. Va voir la vendeuse du concessionnaire.']); return; }
  const wm = W.get('world'), parked = wm.ents.find(e => e.owner), g = wm.doorsById && wm.doorsById.garage;
  if (P.car || !parked || !g || Math.hypot(parked.x - g.x * T, parked.y - g.y * T) > 190) { UI.say('Roméo', ['Amène ta voiture juste devant le garage, gare-la, puis reviens me voir.']); return; }
  const UP = { engine: ['Moteur', [400, 900, 1800]], susp: ['Suspension', [300, 700, 1400]], tires: ['Pneus', [200, 500, 1100]], wing: ['Aileron', [300, 800]] };
  UI.modal({ title: 'Garage : ' + MODELS[c.model].n, cls: 'wide',
    render: () => {
      const sp = spec(c); let h = '<div class="money">Argent : <b>' + money(S.money) + '</b> - Vitesse max ' + Math.round(sp.kmh) + ' km/h - Adhérence ' + sp.grip.toFixed(1) + ' - Santé ' + Math.round(c.hp) + ' / ' + sp.hp + '</div><div class="list">';
      for (const k of Object.keys(UP)) { const lv = (c.up[k] | 0), pr = UP[k][1][lv]; h += '<div class="row"><div class="rn"><b>' + UP[k][0] + '</b> <span class="tag">niv. ' + lv + ' / ' + UP[k][1].length + '</span></div>' + (pr ? '<button class="go" data-a="up" data-i="' + k + '">' + money(pr) + '</button>' : '<span class="tag">Max</span>') + '</div>'; }
      h += '<div class="row"><div class="rn"><b>Pneus drift</b><small>Moins d\'adhérence, plus de glisse.</small></div><button data-a="drift">' + (c.drift ? 'Désactiver' : 'Activer (150 $)') + '</button></div>';
      h += '<div class="row"><div class="rn"><b>Réparation</b></div><button data-a="fix">' + money(Math.max(0, Math.round((sp.hp - c.hp) * 3))) + '</button></div></div><h4>Peinture (100 $)</h4><div class="sw">' + COLORS.map(x => '<button class="c' + (c.color === x ? ' sel' : '') + '" style="background:' + x + '" data-a="paint" data-v="' + x + '"></button>').join('') + '</div>';
      return h;
    },
    onAction: (a, b, m) => {
      const spend = n => { if (S.money < n) { UI.toast('Pas assez d\'argent.', 'err'); U.sfx('err'); return false; } S.money -= n; U.sfx('buy'); return true; };
      if (a === 'up') { const k = b.dataset.i, lv = c.up[k] | 0, pr = UP[k][1][lv]; if (pr && spend(pr)) c.up[k] = lv + 1; }
      else if (a === 'drift') { if (c.drift) c.drift = false; else if (spend(150)) c.drift = true; }
      else if (a === 'fix') { const pr = Math.max(0, Math.round((spec(c).hp - c.hp) * 3)); if (pr === 0) UI.toast('Rien à réparer.'); else if (spend(pr)) c.hp = spec(c).hp; }
      else if (a === 'paint') { if (c.color !== b.dataset.v && spend(100)) c.color = b.dataset.v; }
      placeParked(wm); m.refresh();
    } });
}
})();
