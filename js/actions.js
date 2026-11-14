(() => {
'use strict';
const RG = window.RG, U = RG.U, W = RG.World, D = RG.Data, E = RG.Ent, UI = RG.UI, Sp = RG.Sp, T = RG.T, S = RG.S, P = RG.P, C = RG.core, Game = RG.Game;
const money = U.money, ri = U.ri, pick = U.pick;
const DV = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };

/* ------------------------------------------------------------------ */
/*  Argent / objets                                                    */
/* ------------------------------------------------------------------ */
Game.spend = n => { if (S.money < n) { UI.toast('Pas assez d\'argent.', 'err'); U.sfx('err'); return false; } S.money -= n; return true; };
Game.gain = n => { S.money += n; };
Game.casinoWin = () => { Game.event('win'); };
function addItem(id, n) { S.inv[id] = (S.inv[id] || 0) + n; }
Game.addItem = addItem;
Game.buy = (id, qty, shopId, cb) => {
  const it = D.ITEMS[id], cost = it.p * qty;
  if (S.money < cost) { UI.toast('Pas assez d\'argent.', 'err'); U.sfx('err'); return; }
  if (it.k === 'pet') {
    if (S.pets.length >= 3) { UI.toast('Tu as déjà trois compagnons.', 'err'); return; }
    const names = { chien: ['Rex', 'Biscuit', 'Nala'], chat: ['Minou', 'Tigre', 'Pixel'], lapin: ['Noisette', 'Flocon', 'Pompon'], poule: ['Cocotte', 'Plume', 'Poulette'] }[it.pet];
    UI.ask('Nom de ton ' + it.n.toLowerCase(), pick(names), name => {
      if (S.money < cost) return;
      S.money -= cost;
      const rec = { type: it.pet, v: Math.floor(Math.random() * Sp.animalVariants(it.pet)), name };
      S.pets.push(rec); C.pets.push(E.makePet(rec, P.x - 8, P.y + 2));
      U.sfx('buy'); UI.toast(name + ' te suit désormais !', 'ok');
      Game.event('buy', id); Game.event('buy', shopId); Game.event('pet');
      UI.shop(shopId);
    });
    return;
  }
  S.money -= cost;
  if (it.k === 'cosm') { S.owned[id] = true; UI.toast(it.n + ' acheté. Ouvre un miroir pour le porter.', 'ok'); }
  else addItem(id, qty);
  U.sfx('buy');
  Game.event('buy', id); Game.event('buy', shopId);
  if (cb) cb();
};
Game.useItem = id => {
  const it = D.ITEMS[id]; if (!(S.inv[id] > 0)) return;
  if (it.k !== 'food' && it.k !== 'drink') return;
  S.inv[id]--;
  S.hunger = Math.min(100, S.hunger + (it.h || 0)); S.thirst = Math.min(100, S.thirst + (it.t || 0));
  if (it.hp) S.hp = Math.min(100, S.hp + it.hp);
  if (it.st) S.stamina = Math.min(100, S.stamina + it.st);
  U.sfx('eat'); UI.toast(it.k === 'food' ? 'Miam : ' + it.n + '.' : 'Glou : ' + it.n + '.', 'ok');
  Game.event('eat');
};
Game.equipWeapon = id => { S.equip.weapon = S.equip.weapon === id ? null : id; };
Game.toggleMask = () => { if (S.inv.cagoule > 0) S.equip.mask = !S.equip.mask; };
Game.deposit = n => { if (n === 'all') n = Math.floor(S.money); n = Math.min(n, Math.floor(S.money)); if (n <= 0) { UI.toast('Rien à déposer.', 'err'); return; } S.money -= n; S.bank += n; U.sfx('cash'); Game.event('deposit', n); };
Game.withdraw = n => { if (n === 'all') n = S.bank; n = Math.min(n, S.bank); if (n <= 0) { UI.toast('Rien à retirer.', 'err'); return; } S.bank -= n; S.money += n; U.sfx('cash'); };
Game.setJob = id => {
  if (!id) { S.job = null; UI.toast('Tu as démissionné.', ''); return; }
  S.job = { id }; const j = D.JOBS[id];
  UI.toast('Nouvel emploi : ' + j.n + '.' + (j.need && !(S.inv[j.need] > 0) ? ' Il te faut : ' + D.ITEMS[j.need].n + '.' : ''), 'ok');
  Game.event('job');
};
Game.saveAvatar = (ap, name, cb) => { S.ap = ap; S.name = name; UI.toast('Apparence enregistrée.', 'ok'); if (cb) cb(); };
Game.openMirror = () => UI.avatar({ onDone: () => Game.event('style') });
Game.stashMove = (id, dir, qty) => {
  const from = dir === 'put' ? S.inv : S.stash, to = dir === 'put' ? S.stash : S.inv;
  const n = Math.min(qty, from[id] || 0); if (n <= 0) return;
  from[id] -= n; to[id] = (to[id] || 0) + n;
  if (dir === 'put' && S.equip.weapon === id && !(S.inv[id] > 0)) S.equip.weapon = null;
  if (dir === 'put' && id === 'cagoule' && !(S.inv[id] > 0)) S.equip.mask = false;
};

/* ------------------------------------------------------------------ */
/*  Quêtes                                                             */
/* ------------------------------------------------------------------ */
const questAvail = q => !S.quests[q.id] && (!q.req || (S.quests[q.req] && S.quests[q.req].done));
function qComplete(q) {
  S.quests[q.id].done = true;
  const r = q.reward || {};
  if (r.money) Game.gain(r.money);
  if (r.item) for (const k in r.item) addItem(k, r.item[k]);
  if (r.own) S.owned[r.own] = true;
  UI.banner('Quête terminée', q.title + (r.money ? ' (+' + money(r.money) + ')' : '')); U.sfx('win');
}
function qSync(q) {
  const st = S.quests[q.id]; let g = 0;
  while (st && !st.done && g++ < 6) {
    const s = q.steps[st.step]; if (!s) break;
    let ok = false;
    if (s.t === 'job' && S.job) ok = true; else if (s.t === 'pet' && S.pets.length) ok = true; else if (s.t === 'buy' && D.ITEMS[s.a] && S.inv[s.a] > 0) ok = true;
    if (!ok) break;
    st.step++; st.p = 0;
    if (st.step >= q.steps.length) { qComplete(q); break; }
  }
}
Game.event = (t, a, n) => {
  const done = [];
  for (const q of D.QUESTS) {
    const st = S.quests[q.id]; if (!st || st.done) continue;
    const s = q.steps[st.step]; if (!s || s.t !== t) continue;
    if (s.a !== undefined && s.a !== a) continue;
    if (s.take) { if (!(S.inv[s.take] > 0)) continue; S.inv[s.take]--; }
    st.p += (n || 1);
    const need = s.n || 1;
    if (st.p >= need) {
      st.step++; st.p = 0;
      if (st.step >= q.steps.length) { qComplete(q); done.push(q); }
      else UI.toast('Quête : ' + q.steps[st.step].txt, 'quest');
    } else if (need <= 12) UI.toast(q.title + ' : ' + st.p + '/' + need, 'quest');
  }
  return done;
};
Game.questMark = e => {
  const id = e.id2; if (!id) return null;
  let mark = null;
  for (const q of D.QUESTS) {
    if (q.giver === id && questAvail(q)) return { c: '!', col: '#ffe36a' };
    const st = S.quests[q.id];
    if (st && !st.done) { const s = q.steps[st.step]; if (s && s.t === 'talk' && s.a === id && (!s.take || S.inv[s.take] > 0)) mark = { c: '?', col: '#6fe0ff' }; }
  }
  return mark;
};
function offerQuest(e, q) {
  UI.say(e.name, q.offer, [{ label: 'Accepter', fn: () => {
    S.quests[q.id] = { step: 0, p: 0, done: false };
    if (q.start) for (const k in q.start) addItem(k, q.start[k]);
    UI.banner('Nouvelle quête', q.title); U.sfx('win'); qSync(q);
  } }, { label: 'Plus tard' }]);
}

/* ------------------------------------------------------------------ */
/*  Ciblage et interaction                                             */
/* ------------------------------------------------------------------ */
function facePoint() { const v = DV[P.dir] || [0, 1]; return { x: P.x + v[0] * 12, y: P.y + v[1] * 10 - 2 }; }
function hasTools() { return S.inv.pied > 0 || S.inv.crochets > 0; }
function labelFor(c) {
  switch (c.t) {
    case 'ent': { const e = c.e;
      if (e.kind === 'static') return 'Parler à ' + e.name;
      if (e.kind === 'npc') return e.stun > 0 ? 'Aider ' + e.name : 'Parler à ' + e.name + (S.equip.weapon ? '  [F] Braquer' : '');
      if (e.kind === 'cop') return 'Parler à l\'agent';
      return e.special ? 'Caresser ' + e.name : 'Caresser'; }
    case 'pet': return 'Caresser ' + c.e.name;
    case 'zone': { const z = c.z; if (z.action === 'house') { const h = C.cur.houses[z.data.hid]; if (S.parcel && S.parcel.hid === h.id) return 'Livrer le colis (maison n° ' + h.num + ')'; return hasTools() ? 'Cambrioler (maison n° ' + h.num + ')' : 'Frapper à la porte (n° ' + h.num + ')'; } return z.label; }
    case 'fish': return 'Pêcher';
    case 'tree': return 'Couper l\'arbre';
  }
  return '';
}
Game.updateTarget = () => {
  const m = C.cur; let best = null;
  const consider = c => { if (!best || c.d < best.d) best = c; };
  for (const e of m.ents) {
    if (e.kind === 'deco' || e.hidden) continue;
    const d = Math.hypot(P.x - e.x, P.y - e.y), reach = e.kind === 'static' ? 34 : e.kind === 'animal' ? 22 : 26;
    if (d < reach) consider({ t: 'ent', e, d });
  }
  for (const p of C.pets) { const d = Math.hypot(P.x - p.x, P.y - p.y); if (d < 22) consider({ t: 'pet', e: p, d }); }
  for (const z of m.zones) if (P.x >= z.x && P.x <= z.x + z.w && P.y >= z.y && P.y <= z.y + z.h) consider({ t: 'zone', z, d: 30 });
  if (m.outdoor && !C.fishing) {
    const f = facePoint();
    if (W.groundAt(m, f.x, f.y) === 2 && S.inv.canne > 0) consider({ t: 'fish', d: 36, fx: f.x, fy: f.y });
    const tr = C.treeIdx.get(Math.floor(f.y / T) * m.w + Math.floor(f.x / T));
    if (tr && tr.wood && !tr.cut) consider({ t: 'tree', tree: tr, d: 36 });
  }
  C.target = best;
  if (C.fishing) UI.setPrompt(C.fishing.phase === 'bite' ? '[E] Ferrer maintenant !' : 'Patiente... ([E] pour annuler)');
  else UI.setPrompt(best ? '[E] ' + labelFor(best) : null);
};
Game.interact = () => {
  const c = C.target; if (!c) return;
  switch (c.t) {
    case 'ent': { const e = c.e; if (e.kind === 'static') staticTalk(e); else if (e.kind === 'npc') npcTalk(e); else if (e.kind === 'cop') copTalk(e); else caress(e); break; }
    case 'pet': caress(c.e); break;
    case 'zone': zoneAction(c.z); break;
    case 'fish': startFishing(c); break;
    case 'tree': startChop(c.tree); break;
  }
};
function caress(e) {
  Game.hearts(e.x, e.y); U.sfx('coin');
  if (e.special === 'moustache' && !S.met.moustache) { S.met.moustache = 1; UI.toast('Tu as retrouvé Moustache ! Va prévenir Zoé.', 'ok'); Game.event('find'); }
  else UI.toast(e.name ? e.name + ' adore ça !' : 'L\'animal se laisse caresser.');
}

/* ------------------------------------------------------------------ */
/*  Dialogues                                                          */
/* ------------------------------------------------------------------ */
function staticTalk(e) {
  const def = e.def, id = e.id2;
  e.talk = 3; E.faceTo(e, P.x, P.y);
  const done = Game.event('talk', id);
  const lines = [];
  done.forEach(q => q.done.forEach(l => lines.push(l)));
  if (!lines.length) { if (!S.met[id]) { S.met[id] = 1; def.intro.forEach(l => lines.push(l)); } else lines.push(pick(def.lines)); }
  const ch = [];
  for (const mn of (def.menu || [])) {
    if (mn.startsWith('shop:')) ch.push({ label: mn === 'shop:cafe' ? 'Commander' : mn === 'shop:pet' ? 'Voir les animaux' : mn === 'shop:black' ? 'Voir la marchandise' : mn === 'shop:studio' ? 'Voir les accessoires' : 'Acheter', fn: () => UI.shop(mn.slice(5)) });
    else if (mn === 'bank') ch.push({ label: 'Mon compte', fn: () => UI.bank() });
    else if (mn === 'jobs') ch.push({ label: 'Voir les emplois', fn: () => UI.jobs() });
    else if (mn === 'mirror') ch.push({ label: 'Utiliser le miroir', fn: () => Game.openMirror() });
    else if (mn === 'parcel') ch.push({ label: 'Prendre un colis', fn: () => takeParcel(e) });
    else if (mn === 'fence') ch.push({ label: 'Revendre le butin', fn: () => fence(e) });
    else if (mn === 'quest') { const q = D.QUESTS.find(q => q.giver === id && questAvail(q)); if (q) ch.push({ label: 'Quête : ' + q.title, fn: () => offerQuest(e, q) }); }
  }
  if (def.robbable && S.equip.weapon) ch.push({ label: 'Braquer (' + D.ITEMS[S.equip.weapon].n + ')', fn: () => robStore(e) });
  if (ch.length) ch.push({ label: 'Au revoir' });
  UI.say(def.name, lines, ch);
}
function npcTalk(e) {
  if (e.stun > 0) { e.stun = 0; UI.toast(e.name + ' se relève, groggy.'); return; }
  e.talk = 3.5; E.faceTo(e, P.x, P.y);
  const first = !e.talked;
  if (first) { e.talked = true; Game.event('bot'); }
  const pool = [], hr = S.time / 60;
  if (S.wanted > 0) pool.push(...D.CTX.wanted);
  if (hr >= 21 || hr < 5) pool.push(...D.CTX.night);
  if (S.hunger < 30) pool.push(...D.CTX.hungry);
  if (S.thirst < 30) pool.push(...D.CTX.thirsty);
  if (S.pets.length) pool.push(...D.CTX.pet);
  let line = (pool.length && Math.random() < 0.45) ? pick(pool) : (Math.random() < 0.65 ? pick(D.TYPES[e.ptype]) : pick(D.GENERIC));
  const lines = [];
  if (first) lines.push('Salut, moi c\'est ' + e.name + '.');
  lines.push(line);
  const ch = S.equip.weapon ? [{ label: 'Braquer', fn: () => robCivilian(e) }, { label: 'Au revoir' }] : [];
  UI.say(e.name, lines, ch);
}
function copTalk(e) {
  e.talk = 3; E.faceTo(e, P.x, P.y);
  if (S.equip.weapon) { UI.say('Agent', ['Une arme ? Vous êtes en état d\'arrestation !'], [], () => { addWanted(2); }); return; }
  UI.say('Agent', [pick(D.COPLINES)]);
}

/* ------------------------------------------------------------------ */
/*  Zones                                                              */
/* ------------------------------------------------------------------ */
function zoneAction(z) {
  switch (z.action) {
    case 'cashier': startCashier(); break;
    case 'mirror': Game.openMirror(); break;
    case 'sleep': UI.say('Lit', ['Dormir jusqu\'au matin ? Tu récupéreras ta santé et ton endurance.'], [{ label: 'Dormir', fn: sleep }, { label: 'Pas maintenant' }]); break;
    case 'stash': UI.stash(); break;
    case 'roulette': case 'blackjack': case 'poker': case 'slot': RG.Casino.open(z.action); break;
    case 'house': houseAction(z); break;
  }
}
function sleep() {
  C.fade = { a: 0, dir: 1, cb: () => {
    const day = Math.floor(S.abs / 1440), hr = S.abs % 1440;
    S.abs = (hr < 7 * 60 ? day : day + 1) * 1440 + 7 * 60;
    S.time = S.abs % 1440; S.day = 1 + Math.floor(S.abs / 1440);
    S.hp = 100; S.stamina = 100; S.hunger = Math.max(15, S.hunger - 15); S.thirst = Math.max(15, S.thirst - 15);
    S.wanted = Math.max(0, S.wanted - 2);
    Game.save(); UI.toast('Bonne nuit ! Il est 7 h du matin.', 'ok');
  } };
}

/* ------------------------------------------------------------------ */
/*  Emplois                                                            */
/* ------------------------------------------------------------------ */
function jobLevel(id) { return 1 + Math.floor(((S.jobxp[id]) || 0) / 8); }
function payJob(base) {
  const id = S.job.id, lv0 = jobLevel(id);
  S.jobxp[id] = (S.jobxp[id] || 0) + 1;
  const mult = Math.min(2, 1 + 0.08 * (lv0 - 1));
  const pay = Math.round(base * mult);
  Game.gain(pay); Game.floater(P.x, P.y, '+' + pay + ' $', '#8dff8d'); U.sfx('cash');
  if (jobLevel(id) > lv0) UI.toast('Promotion ! Niveau ' + jobLevel(id) + ' : ton salaire augmente.', 'ok');
  Game.event('work');
  return pay;
}
function openMini(o) {
  C.mini = Object.assign({ hits: 0, pos: 0, dir: 1, lives: 3, need: 3, speed: 1.2, width: 0.3 }, o);
  newZone();
  UI.modal({ kind: 'mini', title: o.title, cls: 'mini', locked: true, render: miniHtml, onAction: (a) => { if (a === 'hit') Game.miniAction(); else if (a === 'cancel') Game.miniCancel(); } });
}
function newZone() { const m = C.mini; const a = 0.1 + Math.random() * (0.8 - m.width); m.zone = [a, a + m.width]; }
function miniHtml() {
  const m = C.mini;
  return '<p>' + UI.esc(m.text) + '</p><div class="tbar"><div class="tz" style="left:' + (m.zone[0] * 100) + '%;width:' + ((m.zone[1] - m.zone[0]) * 100) + '%"></div><div class="tc" id="tc" style="left:' + (m.pos * 100) + '%"></div></div>' +
    '<div class="muted">Réussis : ' + m.hits + ' / ' + m.need + ' - Essais restants : ' + m.lives + '</div><div class="brow"><button data-a="hit" class="go">Valider (E)</button><button data-a="cancel">Abandonner</button></div>';
}
Game.updateMini = dt => {
  const m = C.mini; if (!m) return;
  m.pos += m.dir * m.speed * dt;
  if (m.pos >= 1) { m.pos = 1; m.dir = -1; } else if (m.pos <= 0) { m.pos = 0; m.dir = 1; }
  const tc = document.getElementById('tc'); if (tc) tc.style.left = (m.pos * 100) + '%';
};
function miniEnd(win) {
  const m = C.mini; C.mini = null;
  const mod = UI.currentModal(); if (mod) mod.locked = false;
  UI.closeModal();
  if (win) m.onWin && m.onWin(); else m.onFail && m.onFail();
}
Game.miniAction = () => {
  const m = C.mini; if (!m) return;
  if (m.pos >= m.zone[0] && m.pos <= m.zone[1]) {
    m.hits++; U.sfx('coin');
    if (m.hits >= m.need) { miniEnd(true); return; }
    newZone();
  } else { m.lives--; U.sfx('err'); if (m.lives <= 0) { miniEnd(false); return; } }
  const mod = UI.currentModal(); if (mod && mod.refresh) mod.refresh();
};
Game.miniCancel = () => { const m = C.mini; if (!m) return; C.mini = null; const mod = UI.currentModal(); if (mod) mod.locked = false; UI.closeModal(); if (m.onCancel) m.onCancel(); };

function startCashier() {
  if (!S.job || S.job.id !== 'caissier') { UI.toast('Il faut être caissier : passe au Centre d\'emploi.', 'err'); return; }
  openMini({ title: 'Caisse', text: 'Un client attend : scanne ses articles quand le curseur est dans la zone verte.', need: 5, speed: 1.0 + jobLevel('caissier') * 0.05, width: 0.3,
    onWin: () => { const p = payJob(ri(22, 34)); UI.toast('Client servi : +' + money(p), 'ok'); }, onFail: () => UI.toast('Le client est parti énervé...', 'err') });
}
// pêche
function startFishing(c) {
  C.fishing = { phase: 'wait', t: 1.5 + Math.random() * 3.5, x: c.fx, y: c.fy };
}
Game.updateFishing = dt => {
  const f = C.fishing; f.t -= dt;
  if (f.t > 0) return;
  if (f.phase === 'wait') { f.phase = 'bite'; f.t = 0.9; U.sfx('coin'); }
  else { UI.toast('Le poisson s\'est échappé...', 'err'); C.fishing = null; }
};
Game.fishAction = () => {
  const f = C.fishing; if (!f) return;
  if (f.phase === 'wait') { UI.toast('Trop tôt ! Le poisson a eu peur.', 'err'); C.fishing = null; return; }
  C.fishing = null; S.stats.fish = (S.stats.fish || 0) + 1;
  if (S.job && S.job.id === 'pecheur') { const p = payJob(ri(14, 38)); UI.toast('Belle prise ! Vendue ' + money(p) + '.', 'ok'); }
  else { addItem('poisson', 1); UI.toast('Tu as attrapé un poisson !', 'ok'); }
  U.sfx('win'); Game.event('fish');
};
// bûcheron
function startChop(tree) {
  if (!(S.inv.hache > 0) || !S.job || S.job.id !== 'bucheron') { UI.toast('Il faut un emploi de bûcheron et une hache.', 'err'); return; }
  tree.hp--; C.chop = { tree, t: 0.4 }; U.sfx('click');
  for (let i = 0; i < 3; i++) C.parts.push({ x: tree.tx * T + 8, y: tree.ty * T, vy: -10 - Math.random() * 8, t: 0, life: 0.4, k: 'chip' });
  if (tree.hp <= 0) {
    tree.cut = true; tree.regrow = C.now + 150; C.cutTrees.push(tree); C.cur.solid[tree.ty * C.cur.w + tree.tx] = 0;
    const p = payJob(ri(20, 32)); UI.toast('Arbre abattu : +' + money(p), 'ok'); Game.event('chop');
  }
}
// livraison
function takeParcel(e) {
  if (!S.job || S.job.id !== 'livreur') { UI.say(e.name, ['Il faut être livreur pour ça. Passe d\'abord au Centre d\'emploi.']); return; }
  if (S.parcel) { UI.say(e.name, ['Tu as déjà un colis à livrer ! Maison n° ' + C.cur.houses[S.parcel.hid] + '...']); return; }
  const w = W.get('world'), cand = w.houses.filter(h => !h.home && !h.odette);
  const h = pick(cand), d0 = w.doorsById.post, dist = Math.hypot(h.front.x - d0.x * T, h.front.y - d0.y * T);
  S.parcel = { hid: h.id, t: 40 + dist / 20, pay: ri(55, 90) + Math.round(dist / 45), late: false };
  addItem('colis', 1);
  UI.say(e.name, ['Voici un colis pour la maison n° ' + h.num + '. Elle est marquée en jaune sur ta carte et dans la rue.', 'Dépêche-toi : tu as ' + Math.round(S.parcel.t) + ' secondes pour toucher le plein salaire.']);
}
Game.updateParcel = dt => {
  if (!S.parcel) return;
  S.parcel.t -= dt;
  if (S.parcel.t < 0 && !S.parcel.late) { S.parcel.late = true; UI.toast('En retard ! Le salaire sera réduit de moitié.', 'err'); }
};
function deliver(h) {
  const full = S.parcel.pay, pay0 = S.parcel.late ? Math.round(full / 2) : full;
  S.inv.colis = 0; S.parcel = null;
  const p = payJob(pay0);
  UI.toast('Colis livré : +' + money(p), 'ok'); Game.event('deliver');
}

/* ------------------------------------------------------------------ */
/*  Crimes                                                             */
/* ------------------------------------------------------------------ */
function witnesses(excl, r) {
  let n = 0;
  for (const e of C.cur.ents) {
    if (e === excl || e.stun > 0) continue;
    const d = Math.hypot(e.x - P.x, e.y - P.y);
    if ((e.kind === 'npc' && d < r) || (e.kind === 'cop' && d < r * 2) || (e.kind === 'static' && !C.cur.outdoor && d < r * 0.7)) n++;
  }
  return n;
}
function addWanted(n) {
  if (n <= 0) return;
  if (S.equip.mask && n >= 2) n--;
  const before = S.wanted;
  S.wanted = Math.min(5, S.wanted + n); C.wantedT = 0;
  if (S.wanted > before) { UI.toast('Recherché ! ' + '*'.repeat(S.wanted), 'err'); if (before === 0) U.sfx('alarm'); }
}
Game.addWanted = addWanted;
function scare(r, secs) { for (const e of C.cur.ents) if (e.kind === 'npc' && Math.hypot(e.x - P.x, e.y - P.y) < r) e.flee = Math.max(e.flee, secs); }
function crimeDone() { S.stats.crimes = (S.stats.crimes || 0) + 1; Game.event('crime'); }
Game.useWeapon = () => {
  const wid = S.equip.weapon;
  if (!wid) { UI.toast('Aucune arme équipée. Ouvre ton sac (I).', 'err'); return; }
  const it = D.ITEMS[wid];
  let v = null, bd = 34;
  for (const e of C.cur.ents) { if (e.kind !== 'npc' || e.stun > 0) continue; const d = Math.hypot(e.x - P.x, e.y - P.y); if (d < bd) { bd = d; v = e; } }
  if (v) { robCivilian(v); return; }
  if (it.w === 'knife') { UI.toast('Personne à menacer ici.'); return; }
  shoot(it);
};
function robCivilian(v) {
  if (!S.equip.weapon) return;
  const it = D.ITEMS[S.equip.weapon], lvl = D.WEAPON_LV[it.w];
  UI.closeDialog();
  v.flee = 10; v.talk = 0; scare(110, 6);
  if (v.robbedT && v.robbedT > C.now) { UI.toast(v.name + ' n\'a plus rien sur lui.'); return; }
  const loot = Math.round(v.money * (0.35 + 0.3 * (lvl - 1)) + ri(0, 15));
  v.robbedT = C.now + 120; v.money = Math.round(v.money * 0.2);
  UI.toast(v.name + ' : « ' + pick(D.FLEE) + ' »');
  if (loot > 0) { Game.gain(loot); Game.floater(P.x, P.y, '+' + loot + ' $', '#8dff8d'); U.sfx('cash'); }
  const w = witnesses(v, 120);
  if (w > 0) addWanted(lvl >= 3 ? 2 : 1); else if (Math.random() < 0.25) addWanted(1);
  crimeDone();
}
function shoot(it) {
  if (!(S.inv.balles > 0)) { UI.toast('Plus de balles ! (marché noir)', 'err'); U.sfx('err'); return; }
  S.inv.balles--;
  const dv = DV[P.dir] || [0, 1], n = it.w === 'shotgun' ? 3 : 1;
  for (let i = 0; i < n; i++) {
    const sp = (i - (n - 1) / 2) * 0.18, vx = dv[0] * Math.cos(sp) - dv[1] * Math.sin(sp), vy = dv[0] * Math.sin(sp) + dv[1] * Math.cos(sp);
    C.bullets.push({ x: P.x + dv[0] * 8, y: P.y - 10 + dv[1] * 6, vx: vx * 260, vy: vy * 260, t: 0, life: it.w === 'shotgun' ? 0.35 : 0.6 });
  }
  U.sfx('shot'); scare(150, 6);
  if (C.now - (C.lastShot || -9) > 3) { C.lastShot = C.now; if (witnesses(null, 160) > 0) addWanted(1); }
}
Game.onShotHit = e => {
  if (e.kind === 'npc') { e.stun = 8; e.flee = 0; scare(120, 6); if (witnesses(e, 140) > 0 || Math.random() < 0.4) addWanted(1); crimeDone(); Game.floater(e.x, e.y, 'Touché', '#ff9a9a'); }
  else if (e.kind === 'cop') { e.stun = 6; addWanted(2); for (const c of C.cur.ents) if (c.kind === 'cop') c.chase = true; crimeDone(); Game.floater(e.x, e.y, 'Touché', '#ff9a9a'); }
  else if (e.kind === 'animal') { e.state = 'idle'; e.t = 2; }
};
function robStore(e) {
  const rb = e.def.robbable, it = D.ITEMS[S.equip.weapon], lvl = D.WEAPON_LV[it.w], name = e.def.name;
  if (lvl < rb.need) { UI.say(name, ['Tu rigoles ? Avec ça ? Sors de mon commerce !']); return; }
  const key = 'rob_' + e.id2;
  if ((S.cd[key] || 0) > S.abs) { UI.say(name, ['La caisse est déjà vide, il ne reste rien !']); return; }
  S.cd[key] = S.abs + rb.cd;
  const chance = lvl === 1 ? 0.6 : lvl === 2 ? 0.85 : 0.95;
  U.sfx('alarm');
  if (Math.random() < chance) {
    const loot = ri(rb.min, rb.max);
    UI.say(name, ['Prenez tout ! Ne me faites pas de mal !'], [], () => { Game.gain(loot); Game.floater(P.x, P.y, '+' + loot + ' $', '#8dff8d'); UI.toast('Braquage réussi : ' + money(loot) + ' de ' + rb.name + '. Fuis !', 'ok'); });
    addWanted(rb.heat + (lvl >= 3 ? 1 : 0)); crimeDone();
  } else {
    UI.say(name, ['Non ! J\'ai appuyé sur l\'alarme ! La police arrive !']);
    addWanted(rb.heat); crimeDone();
  }
}
function fence(e) {
  let tot = 0, any = false;
  for (const id in S.inv) { const it = D.ITEMS[id]; if (it.k === 'loot' && S.inv[id] > 0) { any = true; tot += Math.round(it.sell * S.inv[id] * (0.55 + Math.random() * 0.1)); S.inv[id] = 0; } }
  if (!any) { UI.say(e.name, ['Tu n\'as rien à me vendre. Reviens quand tu auras de la marchandise.']); return; }
  Game.gain(tot); U.sfx('cash');
  UI.say(e.name, ['Voyons... Je t\'en donne ' + money(tot) + '. Pas de discussion.']);
}
// cambriolage
const HOUSE_LINES = ['Personne ne répond.', 'Une voix : « On n\'achète rien ! »', 'Quelqu\'un regarde par la fenêtre puis tire les rideaux.', 'Un chien aboie derrière la porte.'];
function houseAction(z) {
  const h = C.cur.houses[z.data.hid];
  if (S.parcel && S.parcel.hid === h.id) { deliver(h); return; }
  if (!hasTools()) { UI.say('Maison n° ' + h.num, [pick(HOUSE_LINES)]); return; }
  if ((S.cd['h' + h.id] || 0) > S.abs) { UI.toast('Cette maison a déjà été visitée récemment.', 'err'); return; }
  const ch = [];
  if (S.inv.crochets > 0) ch.push({ label: 'Crocheter (discret)', fn: () => burgle(h, 'crochets') });
  if (S.inv.pied > 0) ch.push({ label: 'Forcer la porte (bruyant)', fn: () => burgle(h, 'pied') });
  ch.push({ label: 'Laisser tomber' });
  UI.say('Maison n° ' + h.num, ['Les volets sont fermés. Personne en vue...'], ch);
}
function burgle(h, tool) {
  S.cd['h' + h.id] = S.abs + 600;
  const quiet = tool === 'crochets';
  if (Math.random() < (quiet ? 0.08 : 0.3)) { U.sfx('alarm'); addWanted(1); }
  openMini({ title: 'Cambriolage', text: quiet ? 'Crochète la serrure : valide quand le curseur est dans la zone.' : 'Force la porte : valide quand le curseur est dans la zone.', need: 3, width: quiet ? 0.26 : 0.38, speed: quiet ? 1.25 : 1.7,
    onWin: () => {
      if (Math.random() < 0.15) { UI.toast('Un habitant rentre ! Fuis !', 'err'); addWanted(2); crimeDone(); return; }
      const loot = ri(40, 220), items = [], pool = ['montre', 'montre', 'argent', 'bijoux', 'bijoux', 'tele', 'ordi', 'tableau'];
      for (let i = 0; i < ri(1, 2); i++) { const id = pick(pool); addItem(id, 1); items.push(D.ITEMS[id].n); }
      Game.gain(loot); U.sfx('cash'); UI.toast('Cambriolage : +' + money(loot) + ' et ' + items.join(', ') + '.', 'ok');
      if (witnesses(null, 120) > 0) addWanted(1);
      crimeDone();
    },
    onFail: () => { UI.toast('Raté ! Du bruit a attiré l\'attention.', 'err'); addWanted(1); } });
}

/* ------------------------------------------------------------------ */
/*  Police                                                             */
/* ------------------------------------------------------------------ */
Game.updatePolice = dt => {
  const m = C.cur;
  E.Nav.age += 0;
  if (S.wanted > 0 && m.outdoor) {
    if (E.Nav.map !== m || E.Nav.age > 0.4) E.Nav.build(m, Math.floor(P.x / T), Math.floor(P.y / T), 70);
  }
  if (S.wanted <= 0) return;
  if (!m.outdoor) C.wantedT += dt * 2;
  else {
    const near = m.ents.some(e => e.kind === 'cop' && e.stun <= 0 && Math.hypot(e.x - P.x, e.y - P.y) < 170);
    if (near) C.wantedT = 0; else C.wantedT += dt;
  }
  if (C.wantedT >= 14) {
    C.wantedT = 0; S.wanted--;
    if (S.wanted === 0) { UI.toast('Tu as semé la police.', 'ok'); for (const e of m.ents) if (e.kind === 'cop') e.chase = false; }
  }
  if (!m.outdoor) return;
  if (S.wanted >= 2) {
    C.reinT -= dt;
    const act = m.ents.filter(e => e.kind === 'cop').length;
    if (C.reinT <= 0 && act < Math.min(10, 4 + S.wanted * 1.5)) {
      C.reinT = 3;
      for (let k = 0; k < 8; k++) {
        const a = Math.random() * 6.283, tx = Math.floor((P.x + Math.cos(a) * 300) / T), ty = Math.floor((P.y + Math.sin(a) * 300) / T);
        if (tx < 3 || ty < 3 || tx > m.w - 4 || ty > m.h - 4) continue;
        const f = E.freeTile(m, tx, ty); const c = E.spawnCop(m, f.x, f.y, false); c.chase = true; break;
      }
    }
  }
  for (const e of m.ents) if (e.kind === 'cop' && e.stun <= 0 && Math.hypot(e.x - P.x, e.y - P.y) < 12) { arrest(); return; }
};
function arrest() {
  const lv = S.wanted;
  const fine = Math.floor(S.money * (0.15 + 0.05 * lv)); S.money -= fine;
  const seized = [];
  for (const id in S.inv) if (D.ITEMS[id].ill && S.inv[id] > 0) { seized.push(D.ITEMS[id].n); delete S.inv[id]; }
  S.equip.weapon = null; S.equip.mask = false; S.wanted = 0;
  if (S.parcel) { S.parcel = null; S.inv.colis = 0; }
  const t = 10 + lv * 5;
  S.jail = { t, bail: Math.max(60, Math.round(t * 12)), fine };
  U.sfx('alarm');
  UI.toast('Arrêté ! Amende : ' + money(fine) + (seized.length ? '. Confisqué : ' + seized.join(', ') : '') + '.', 'err');
  for (const e of C.cur.ents) if (e.kind === 'cop') e.chase = false;
  const j = W.get('police').jail;
  Game.go('police', j.x, j.y, 'down');
}
Game.updateJail = dt => {
  if (C.fade.dir !== 0) return;
  if (C.cur.name !== 'police') return;
  S.jail.t -= dt;
  UI.jail(Math.max(0, S.jail.t), S.jail.bail, S.jail.fine);
  if (S.jail.t <= 0) Game.release();
};
Game.release = () => {
  if (!S.jail) return;
  S.jail = null; UI.jailEnd();
  const d = W.get('world').doorsById.police;
  Game.go('world', d.x * T + 8, (d.y + 1) * T + 10, 'down');
  UI.toast('Tu es libre. Reste du bon côté de la loi.', 'ok');
};
Game.payBail = () => {
  if (!S.jail) return;
  if (S.money < S.jail.bail) { UI.toast('Pas assez d\'argent pour la caution.', 'err'); return; }
  S.money -= S.jail.bail; Game.release();
};
Game.faint = () => {
  S.hp = 40; S.hunger = Math.max(S.hunger, 45); S.thirst = Math.max(S.thirst, 45);
  const lost = Math.floor(S.money * 0.1); S.money -= lost;
  UI.toast('Tu t\'évanouis... Des passants te ramènent chez toi (' + money(lost) + ' de frais).', 'err');
  const w = W.get('world'), home = w.houses.find(h => h.home);
  Game.go('world', home.front.x, home.front.y, 'down');
};
})();
