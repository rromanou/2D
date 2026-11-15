(() => {
'use strict';
const RG = window.RG, U = RG.U, W = RG.World, D = RG.Data, Sp = RG.Sp, T = RG.T;
const E = RG.Ent = {};
let nid = 1;
E.make = (kind, o) => Object.assign({ id: nid++, kind, x: 0, y: 0, dir: 'down', anim: 0, t: 0, state: 'idle', spd: 30, stun: 0, talk: 0, flee: 0, say: null, sayT: 0, hidden: false }, o);

E.move = (e, m, dx, dy, hw, hh) => {
  hw = hw || 4; hh = hh || 4;
  let moved = false;
  if (dx && !W.hit(m, e.x + dx, e.y, hw, hh)) { e.x += dx; moved = true; }
  if (dy && !W.hit(m, e.x, e.y + dy, hw, hh)) { e.y += dy; moved = true; }
  return moved;
};
function faceVec(e, dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) e.dir = dx < 0 ? 'left' : 'right';
  else if (Math.abs(dy) > 0.001) e.dir = dy < 0 ? 'up' : 'down';
}
E.faceTo = (e, x, y) => faceVec(e, x - e.x, y - e.y);
E.freeTile = (m, tx, ty) => {
  for (let r = 0; r < 8; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const x = tx + dx, y = ty + dy;
    if (x > 1 && y > 1 && x < m.w - 2 && y < m.h - 2 && !m.solid[y * m.w + x]) return { x, y };
  }
  return { x: tx, y: ty };
};

/* ------------------------------------------------------------------ */
/*  Pathfinding (champ de distance depuis le joueur)                   */
/* ------------------------------------------------------------------ */
const Nav = E.Nav = { dist: null, map: null, tx: -9, ty: -9, age: 99 };
Nav.build = (m, tx, ty, maxR) => {
  const n = m.w * m.h;
  if (!Nav.dist || Nav.dist.length !== n) Nav.dist = new Int16Array(n);
  const d = Nav.dist; d.fill(-1);
  const q = new Int32Array(n); let h = 0, t = 0;
  tx = U.clamp(tx, 0, m.w - 1); ty = U.clamp(ty, 0, m.h - 1);
  const s = ty * m.w + tx; d[s] = 0; q[t++] = s;
  while (h < t) {
    const c = q[h++], cx = c % m.w, cy = (c / m.w) | 0, cd = d[c];
    if (cd >= maxR) continue;
    for (let k = 0; k < 4; k++) {
      const nx = cx + (k === 0 ? 1 : k === 1 ? -1 : 0), ny = cy + (k === 2 ? 1 : k === 3 ? -1 : 0);
      if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue;
      const ni = ny * m.w + nx;
      if (d[ni] !== -1 || m.solid[ni]) continue;
      d[ni] = cd + 1; q[t++] = ni;
    }
  }
  Nav.map = m; Nav.tx = tx; Nav.ty = ty; Nav.age = 0;
};
Nav.step = (m, x, y) => {
  if (Nav.map !== m || !Nav.dist) return null;
  const tx = Math.floor(x / T), ty = Math.floor(y / T);
  const d = Nav.dist, here = d[ty * m.w + tx];
  let best = null, bd = here < 0 ? 99999 : here;
  for (let k = 0; k < 4; k++) {
    const nx = tx + (k === 0 ? 1 : k === 1 ? -1 : 0), ny = ty + (k === 2 ? 1 : k === 3 ? -1 : 0);
    if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue;
    const v = d[ny * m.w + nx];
    if (v >= 0 && v < bd) { bd = v; best = { x: nx * T + 8, y: ny * T + 8 }; }
  }
  return best;
};

/* ------------------------------------------------------------------ */
/*  Création                                                           */
/* ------------------------------------------------------------------ */
E.spawnStatic = (m, id, tx, ty, dir) => {
  const def = D.NPCS[id];
  const e = E.make('static', { id2: id, name: def.name, role: def.role, ap: def.ap, def, x: tx * T + 8, y: ty * T + 12, dir: dir || 'down', spd: 0 });
  e.ap = Sp.randomAp(U.rng(E.strHash(e.name))); e.female = E.FEM.has(e.name);
  m.ents.push(e); return e;
};
E.strHash = s => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
E.FEM = new Set(['Alice', 'Camille', 'Dominique', 'Élodie', 'Gabrielle', 'Isabelle', 'Karine', 'Mélanie', 'Océane', 'Rosalie', 'Thérèse', 'Yvette', 'Amélie', 'Cécile', 'Émilie', 'Geneviève', 'Jade', 'Léa', 'Noémie', 'Pascale', 'Sandrine', 'Audrey', 'Bianca', 'Chloé', 'Delphine', 'Estelle', 'Fanny', 'Hélène', 'Inès', 'Josée', 'Laurence', 'Manon', 'Nadia', 'Ophélie', 'Pénélope', 'Roxane', 'Solange', 'Tania', 'Ursule', 'Valérie', 'Colette', 'Gisèle', 'Pauline', 'Denise', 'Berthe']);
E.apFor = name => {
  const r = U.rng(E.strHash(name)), ap = Sp.randomAp(r), f = E.FEM.has(name);
  ap.hair = f ? (r() < 0.6 ? 1 : 3) : [0, 0, 2, 4, 5][Math.floor(r() * 5)];
  if (f && ap.hat > 3) ap.hat = 0;
  return ap;
};
E.spawnWander = (m, tx, ty, r, rnd) => {
  rnd = rnd || Math.random;
  const types = Object.keys(D.TYPES);
  E.used = E.used || new Set();
  const free = D.FIRST.filter(n => !E.used.has(n)), nm = free.length ? free[Math.floor(rnd() * free.length)] : U.pick(D.FIRST, rnd);
  E.used.add(nm);
  const e = E.make('npc', { name: nm, ptype: types[Math.floor(rnd() * types.length)], ap: E.apFor(nm), female: E.FEM.has(nm), x: tx * T + 8, y: ty * T + 12,
    home: { x: tx * T + 8, y: ty * T + 12, r: r * T }, spd: 16 + rnd() * 12, t: rnd() * 3, money: 20 + Math.floor(rnd() * 80), gender: rnd() });
  m.ents.push(e); return e;
};
E.spawnCop = (m, tx, ty, patrol) => {
  const e = E.make('cop', { name: 'Agent', ap: { skin: U.pick(Sp.pal.skin), hairC: '#2b1b14', hair: 0, shirt: '#2f4a8c', pants: '#1b2a52', hat: 6, glasses: 0 },
    x: tx * T + 8, y: ty * T + 12, home: { x: tx * T + 8, y: ty * T + 12, r: 7 * T }, spd: 20, t: Math.random() * 2, chase: false, reinforce: !patrol });
  m.ents.push(e); return e;
};
E.spawnAnimal = (m, type, v, tx, ty, r, extra) => {
  const e = E.make('animal', Object.assign({ atype: type, v, x: tx * T + 8, y: ty * T + 12, home: { x: tx * T + 8, y: ty * T + 12, r: r * T }, spd: type === 'vache' ? 9 : type === 'lapin' ? 26 : 14, t: Math.random() * 3, right: Math.random() < 0.5 }, extra || {}));
  m.ents.push(e); return e;
};
E.makePet = (rec, x, y) => E.make('pet', { atype: rec.type, v: rec.v, name: rec.name, x, y, spd: 70, right: false, love: 0 });

E.populate = m => {
  m.ents = [];
  const rnd = U.rng(m.name.length * 131 + 7);
  for (const n of m.npcs) E.spawnStatic(m, n.id, n.x, n.y, n.dir);
  for (const a of m.animals) { const e = E.spawnAnimal(m, a.type, a.v || 0, a.x, a.y, 2); }
  if (!m.outdoor) {
    for (let i = 0; i < (m.wanderCount || 0); i++) {
      for (let k = 0; k < 30; k++) {
        const tx = 2 + Math.floor(rnd() * (m.w - 4)), ty = 3 + Math.floor(rnd() * (m.h - 5));
        if (!m.solid[ty * m.w + tx] && ty < m.h - 2) { const e = E.spawnWander(m, tx, ty, 3, rnd); e.indoor = true; break; }
      }
    }
    return;
  }
  // extérieur : PNJ fixes
  const free = (tx, ty) => E.freeTile(m, tx, ty);
  const put = (id, tx, ty, dir) => { const f = free(tx, ty); return E.spawnStatic(m, id, f.x, f.y, dir); };
  put('lucie', 58, 50, 'right'); put('zoe', 44, 56, 'down'); put('gustave', 111, 15, 'left'); put('gaston', 29, 74, 'left'); put('guetteur', 14, 16, 'left');
  const od = m.houses.find(h => h.odette); if (od) put('odette', od.doorX + 2, od.doorY + 1, 'down');
  // chat perdu
  { const f = free(50, 55); E.spawnAnimal(m, 'chat', 0, f.x, f.y, 3, { special: 'moustache', name: 'Moustache' }); }
  // flics en patrouille
  for (const [x, y] of [[60, 44], [66, 50], [78, 45], [40, 45], [90, 45], [60, 25]]) { const f = free(x, y); E.spawnCop(m, f.x, f.y, true); }
  // habitants
  for (let i = 0; i < 38; i++) {
    for (let k = 0; k < 40; k++) {
      const tx = 4 + Math.floor(rnd() * 120), ty = (rnd() < 0.8 ? 20 + Math.floor(rnd() * 50) : 4 + Math.floor(rnd() * 88));
      const g = m.ground[ty * m.w + tx];
      if (!m.solid[ty * m.w + tx] && (g === 0 || g === 4 || g === 3)) { E.spawnWander(m, tx, ty, 5 + Math.floor(rnd() * 6), rnd); break; }
    }
  }
  // place publique : foule
  for (let i = 0; i < 14; i++) {
    for (let k = 0; k < 40; k++) {
      const tx = 57 + Math.floor(rnd() * 12), ty = 41 + Math.floor(rnd() * 12);
      if (!m.solid[ty * m.w + tx]) { E.spawnWander(m, tx, ty, 6, rnd); break; }
    }
  }
  // animaux
  const spawnN = (type, n, x0, y0, x1, y1, r) => {
    for (let i = 0; i < n; i++) for (let k = 0; k < 40; k++) {
      const tx = x0 + Math.floor(rnd() * (x1 - x0)), ty = y0 + Math.floor(rnd() * (y1 - y0));
      if (!m.solid[ty * m.w + tx] && m.ground[ty * m.w + tx] !== 2) { E.spawnAnimal(m, type, Math.floor(rnd() * Sp.animalVariants(type)), tx, ty, r); break; }
    }
  };
  spawnN('vache', 5, 8, 80, 28, 91, 5); spawnN('poule', 5, 8, 82, 28, 91, 5); spawnN('chien', 3, 34, 20, 60, 24, 6);
  spawnN('lapin', 7, 33, 52, 60, 66, 6); spawnN('lapin', 4, 4, 28, 28, 40, 6);
  for (let i = 0; i < 5; i++) {
    for (let k = 0; k < 40; k++) {
      const tx = 96 + Math.floor(rnd() * 24), ty = 4 + Math.floor(rnd() * 9);
      if (m.ground[ty * m.w + tx] === 2) { E.spawnAnimal(m, 'canard', i % 2, tx, ty, 3); break; }
    }
  }
};

/* ------------------------------------------------------------------ */
/*  Mise à jour                                                        */
/* ------------------------------------------------------------------ */
function wander(e, m, dt) {
  e.t -= dt;
  if (e.state === 'idle') {
    if (e.t <= 0) {
      for (let k = 0; k < 6; k++) {
        const a = Math.random() * 6.283, r = Math.random() * e.home.r;
        const tx = e.home.x + Math.cos(a) * r, ty = e.home.y + Math.sin(a) * r;
        if (!W.hit(m, tx, ty, 4, 4) && (e.kind !== 'animal' || e.atype !== 'canard' || W.groundAt(m, tx, ty) === 2)) { e.tx = tx; e.ty = ty; e.state = 'walk'; e.t = 12; break; }
      }
      if (e.state !== 'walk') e.t = 1 + Math.random() * 2;
    }
    e.anim = 0;
  } else {
    const dx = e.tx - e.x, dy = e.ty - e.y, d = Math.hypot(dx, dy);
    if (d < 2 || e.t <= 0) { e.state = 'idle'; e.t = 1 + Math.random() * 4; return; }
    const sp = e.spd * dt, mx = dx / d * sp, my = dy / d * sp;
    let ok;
    if (e.kind === 'animal' && e.atype === 'canard') {
      ok = W.groundAt(m, e.x + mx, e.y + my) === 2; if (ok) { e.x += mx; e.y += my; }
    } else ok = E.move(e, m, mx, my);
    if (!ok) { e.state = 'idle'; e.t = 0.5 + Math.random() * 2; return; }
    if (e.kind === 'animal') { if (Math.abs(dx) > 0.5) e.right = dx > 0; } else faceVec(e, dx, dy);
    e.anim += dt * 6;
  }
}
E.update = (m, dt, P) => {
  for (const e of m.ents) {
    if (e.sayT > 0) { e.sayT -= dt; if (e.sayT <= 0) e.say = null; }
    if (e.stun > 0) { e.stun -= dt; continue; }
    switch (e.kind) {
      case 'static': if (e.talk > 0) e.talk -= dt; break;
      case 'npc': {
        if (e.talk > 0) { e.talk -= dt; E.faceTo(e, P.x, P.y); break; }
        const d = Math.hypot(P.x - e.x, P.y - e.y);
        if (P.armed && d < 70 && !e.indoor) e.flee = Math.max(e.flee, 3);
        if (e.flee > 0) {
          e.flee -= dt;
          let dx = e.x - P.x, dy = e.y - P.y; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
          const sp = 46 * dt;
          if (!E.move(e, m, dx * sp, dy * sp)) E.move(e, m, -dy * sp, dx * sp);
          faceVec(e, dx, dy); e.anim += dt * 10; e.state = 'idle'; e.t = 0.5;
        } else wander(e, m, dt);
        break;
      }
      case 'cop': {
        if (e.talk > 0) { e.talk -= dt; E.faceTo(e, P.x, P.y); break; }
        const d = Math.hypot(P.x - e.x, P.y - e.y);
        const hunt = P.wanted > 0 && !P.safe && (d < 260 || P.wanted >= 3 || e.chase);
        if (hunt) {
          e.chase = true;
          const sp = (P.wanted >= 4 ? 62 : P.wanted >= 2 ? 54 : 46) * dt;
          let tx = P.x, ty = P.y;
          if (d > 14) { const s = Nav.step(m, e.x, e.y); if (s && d > 22) { tx = s.x; ty = s.y; } }
          let dx = tx - e.x, dy = ty - e.y; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
          if (!E.move(e, m, dx * sp, dy * sp)) { if (!E.move(e, m, dx * sp, 0)) E.move(e, m, 0, dy * sp); }
          faceVec(e, dx, dy); e.anim += dt * 10;
        } else {
          e.chase = false;
          if (e.reinforce && d > 300) e.remove = true;
          wander(e, m, dt);
        }
        break;
      }
      case 'animal': wander(e, m, dt); break;
    }
  }
  if (m.ents.some(e => e.remove)) m.ents = m.ents.filter(e => !e.remove);
  Nav.age += dt;
};
E.updatePets = (m, pets, dt, P) => {
  pets.forEach((e, i) => {
    if (e.loveT > 0) e.loveT -= dt;
    const tx = P.x - (P.dirx || 0) * (14 + i * 10), ty = P.y - (P.diry || 0) * (14 + i * 10);
    const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy);
    if (d > 240) { e.x = P.x - 8 - i * 8; e.y = P.y; return; }
    if (d > 12) {
      const sp = Math.min(d * 3, e.spd) * dt;
      if (!E.move(e, m, dx / d * sp, dy / d * sp, 3, 3)) { if (!E.move(e, m, dx / d * sp, 0, 3, 3)) E.move(e, m, 0, dy / d * sp, 3, 3); }
      if (Math.abs(dx) > 1) e.right = dx > 0;
      e.anim += dt * 9;
    } else e.anim = 0;
  });
};
})();
