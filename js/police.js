(() => {
'use strict';
/* ================================================================== */
/*  Métier de policier : service, armurerie, radio, appels, arrestations */
/* ================================================================== */
const RG = window.RG, U = RG.U, UI = RG.UI, D = RG.Data, E = RG.Ent, W = RG.World, T = RG.T, G = RG.Game, C = RG.core, S = RG.S, L = RG.Life, P = RG.P, Cars = RG.Cars;
const esc = UI.esc, money = U.money;
const Pol = RG.Police = {};
const pick = a => a[Math.floor(Math.random() * a.length)];
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const KMH = Cars.KMH;

const CH = {
  vitesse: { n: 'Excès de vitesse', f: 180 }, permis: { n: 'Conduite sans permis valide', f: 400 }, alcool: { n: 'Conduite en état d\'ébriété', f: 500 },
  illegal: { n: 'Possession d\'objets illégaux', f: 250 }, equip: { n: 'Équipement défectueux', f: 80 }, cambr: { n: 'Cambriolage', f: 600 },
  vol: { n: 'Vol', f: 200 }, voies: { n: 'Voies de fait', f: 300 }, meurtre: { n: 'Meurtre', f: 1500 }, arme: { n: 'Possession d\'arme', f: 450 },
  fuite: { n: 'Fuite', f: 250 }, resist: { n: 'Résistance à l\'arrestation', f: 200 }
};
const st = { call: null, pending: null, nextCall: 25, nextStreet: 70, esc: [], earned: 0, payAcc: 0, still: 0, lx: 0, ly: 0, sampT: 0, backupCd: 0, pullT: new Map(), tick: 0, sig: '', radT: 0, chase: null, allies: [] };
Pol.st = st;
const inDuty = () => !!S.duty;

/* ---------------- service, uniforme, armurerie ---------------- */
const DUTY_ITEMS = ['taser', 'matraque', 'pistolet_s'];
function patrolEnts() { const o = []; Object.keys(W.maps).forEach(n => (W.maps[n].ents || []).forEach(e => { if (e.kind === 'car' && e.patrol) o.push({ e, m: W.maps[n] }); })); return o; }
function spawnPatrol() {
  const w = W.get('world'), d = w.doorsById && w.doorsById.police; if (!d) return;
  w.ents.push(E.make('car', { patrol: true, police: true, x: (d.x + 4) * T + 8, y: 45 * T + 6, ang: 0, color: '#1b2a52', len: 25, spd: 0, hp: 220, vx: 0, vy: 0 }));
}
Pol.startDuty = () => {
  if (S.duty) { UI.toast('Tu es déjà en service.'); return; }
  if (!S.job || S.job.id !== 'policier') { UI.say('Dubois', ['Il faut d\'abord être engagé comme policier : passe au Centre d\'emploi.']); return; }
  if (S.jail) return;
  if (S.wanted > 0) { UI.toast('Tu es recherché : impossible de prendre le service.', 'err'); return; }
  S.apCiv = S.ap; S.ap = Object.assign({}, S.ap, { shirt: '#2f4a8c', pants: '#1b2a52', hat: 6 });
  S.duty = true; st.earned = 0; st.payAcc = 0; st.still = 0; st.nextCall = 20; st.nextStreet = 60; st.call = null; st.pending = null;
  if (!patrolEnts().length) spawnPatrol();
  U.sfx('win'); UI.banner('En service', '120 $ la minute - passe à l\'armurerie, puis prends la radio');
};
Pol.endDuty = reason => {
  if (!S.duty) return;
  if (P.car && P.car.police) Cars.forceExit();
  for (const e of st.esc) { e.sus = null; e.follow = false; e.hidden = false; e.flee = 6; }
  st.esc = [];
  for (const id of DUTY_ITEMS) { if (S.inv[id]) delete S.inv[id]; if (S.equip.weapon === id) S.equip.weapon = null; }
  if (S.dutyAmmo) { S.inv.balles = Math.max(0, (S.inv.balles | 0) - S.dutyAmmo); S.dutyAmmo = 0; }
  if (S.apCiv) { S.ap = S.apCiv; S.apCiv = null; }
  S.duty = false; st.call = null; st.pending = null;
  Object.keys(W.maps).forEach(n => { const m = W.maps[n]; if (m.ents) m.ents = m.ents.filter(e => !e.patrol && !e.ally && !(e.kind === 'cop' && e.ally)); });
  UI.banner('Service terminé', 'Gagné : ' + money(st.earned));
  if (reason) UI.toast(reason, 'err');
  hideRadio();
};
Pol.armory = () => {
  if (!S.duty) { UI.say('Armurier', ['Il faut être en service pour sortir du matériel.']); return; }
  UI.modal({ title: 'Armurerie', cls: 'rel',
    render: () => '<p class="muted">Matériel de service. Il est rendu à la fin du service.</p><div class="list">' + [['taser', 'Taser', 'Paralyse un suspect quelques secondes (F).'], ['matraque', 'Matraque', 'Coups plus francs (F).'], ['pistolet_s', 'Pistolet de service', 'Tirs sur suspects armés, pneus (F). Tout tir injustifié coûte cher.']].map(x => '<div class="row"><div class="rn"><b>' + x[1] + '</b><small>' + x[2] + '</small></div><button data-a="g" data-i="' + x[0] + '">' + (S.inv[x[0]] ? 'Équiper' : 'Prendre') + '</button></div>').join('') + '<div class="row"><div class="rn"><b>Munitions (+6)</b><small>Pour le pistolet de service.</small></div><button data-a="am">Prendre</button></div></div>',
    onAction: (a, b, m) => {
      if (a === 'g') { const id = b.dataset.i; S.inv[id] = 1; S.equip.weapon = id; U.sfx('click'); UI.toast(D.ITEMS[id].n + ' équipé.', 'ok'); UI.hotbarDirty && UI.hotbarDirty(); m.refresh(); }
      else if (a === 'am') { S.inv.balles = (S.inv.balles | 0) + 6; S.dutyAmmo = (S.dutyAmmo | 0) + 6; U.sfx('click'); UI.toast('+6 balles.'); }
    } });
};
const oldLZ = G.lifeZone;
G.lifeZone = z => {
  if (z.action === 'duty') { if (S.duty) UI.say('Dubois', ['Tu veux terminer ton service ?'], [{ label: 'Oui', fn: () => Pol.endDuty() }, { label: 'Non' }]); else Pol.startDuty(); return; }
  if (z.action === 'armory') { Pol.armory(); return; }
  oldLZ(z);
};
const oldSwitch = L.switchTo;
L.switchTo = r => { if (S.duty) { UI.toast('Termine ton service avant de changer de personnage.', 'err'); return; } oldSwitch(r); };

/* ---------------- radio ---------------- */
let radio = null;
function hideRadio() { if (radio) radio.style.display = 'none'; }
function mkRadio() {
  radio = document.createElement('div'); radio.id = 'radio';
  radio.style.cssText = 'position:absolute;left:8px;bottom:8px;width:176px;max-height:22px;overflow:hidden;background:#15151c;color:#dfe8ff;border:3px solid #2f4a8c;box-shadow:0 0 0 2px #0d1530;padding:3px 8px;font-family:Pixel,monospace;font-size:13px;z-index:7;display:none;text-align:left;line-height:1.35;pointer-events:auto;transition:width .12s,max-height .12s';
  if (!document.getElementById('radioCss')) { const st2 = document.createElement('style'); st2.id = 'radioCss'; st2.textContent = '#radio:hover{width:350px!important;max-height:420px!important;overflow:visible!important;padding:7px 10px!important;text-align:center!important}#radio .rfull{display:none}#radio:hover .rfull{display:block}#radio:hover .rmin{display:none}#radio.alert{border-color:#ffd84a}'; document.head.appendChild(st2); }
  document.getElementById('ui').appendChild(radio);
  radio.addEventListener('click', ev => { const b = ev.target.closest('button'); if (!b) return; const a = b.dataset.r; if (a === 'ok') Pol.accept(); else if (a === 'no') { st.pending = null; st.nextCall = 20; } else if (a === 'bk') Pol.backup(); else if (a === 'cancel') Pol.cancelCall(); else if (a === 'sir') Cars.toggle('siren'); else if (a === 'pull') Pol.orderPull(); ev.stopPropagation(); });
}
const btn = (r, t, c) => '<button data-r="' + r + '" style="font:inherit;margin:4px 4px 0;padding:3px 10px;border:2px solid #000;background:' + (c || '#cfd8ee') + ';cursor:pointer">' + t + '</button>';
function distTxt(x, y) { return Math.round(Math.hypot(x - P.x, y - P.y) / 8) + ' m'; }
function radarLine() {
  const m = C.cur; if (!m || !m.outdoor) return '';
  const fx = P.car ? Math.cos(P.car.ang) : ({ left: -1, right: 1 }[P.dir] || 0), fy = P.car ? Math.sin(P.car.ang) : ({ up: -1, down: 1 }[P.dir] || 0);
  let best = null, bd = 230;
  for (const e of m.ents) { if (e.kind !== 'car' || e.patrol || e.owner || e.ally || e.cop) continue; const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy), al = (dx * fx + dy * fy) / (d || 1), lat = Math.abs(dx * fy - dy * fx); if (d < bd && al > 0.6 && lat < 26) { bd = d; best = e; } }
  if (!best) return '';
  const kmh = Math.round(Math.hypot(best.vx || 0, best.vy || 0) / KMH), lim = Cars.limitHere();
  return '<div style="color:' + (kmh > lim + 10 ? '#ff6a5a' : '#8dff8d') + '">Radar : ' + kmh + ' km/h (limite ' + lim + ')</div>';
}
function drawRadio() {
  if (!radio) mkRadio();
  if (!S.duty || C.mode !== 'play' || UI.isModal() || UI.dialogOpen()) { radio.style.display = 'none'; return; }
  let h = '<div style="color:#8fb0ff">RADIO - EN SERVICE - 120 $/min - gagné ' + money(st.earned) + '</div>';
  const mini = st.pending ? 'RADIO : APPEL !' : st.call ? 'RADIO : mission' : 'RADIO : en service';
  if (st.still > 35) h += '<div style="color:#ff8a4a">Bouge ! Fin de service dans ' + Math.max(0, Math.ceil(60 - st.still)) + ' s</div>';
  if (st.pending) h += '<div style="color:#ffe08a;margin-top:3px">APPEL : ' + esc(st.pending.text) + ' (' + distTxt(st.pending.x, st.pending.y) + ')</div>' + btn('ok', 'Accepter', '#9fe8a0') + btn('no', 'Refuser', '#f0a0a0');
  else if (st.call) h += '<div style="color:#ffe08a;margin-top:3px">MISSION : ' + esc(st.call.text) + (st.call.x != null && C.cur.name === 'world' ? ' - zone jaune à ' + distTxt(st.call.x, st.call.y) : '') + (st.call.left != null ? ' - restant : ' + st.call.left : '') + '</div>' + btn('bk', 'Renforts', '#cfd8ee') + btn('cancel', 'Abandonner', '#f0a0a0');
  else h += '<div style="opacity:.7">Aucun appel. Patrouille, la radio sonnera.</div>';
  if (P.car && P.car.police) h += '<div>' + btn('sir', 'Sirène : ' + (P.car.siren ? 'ON' : 'OFF'), P.car.siren ? '#ffb0a0' : '#cfd8ee') + btn('pull', 'Intercepter [V]', '#ffe08a') + '</div>';
  h += radarLine();
  h += '<div style="opacity:.7;font-size:11px">Criminalité : ' + Math.round((S.crimeF || 1) * 100) + ' %</div>';
  h += '<div style="opacity:.6;font-size:11px;margin-top:2px">C menotter - E contrôler - K sirène (en voiture) - F arme</div>';
  radio.classList.toggle('alert', !!st.pending);
  h = '<div class="rmin" style="color:' + (st.pending ? '#ffe08a' : '#8fb0ff') + '">' + mini + '</div><div class="rfull">' + h + '</div>';
  if (h !== st.sig) { st.sig = h; radio.innerHTML = h; }
  radio.style.display = 'block';
}

/* ---------------- suspects ---------------- */
function freeTile(m, cx, cy, minR, maxR) {
  for (let k = 0; k < 120; k++) {
    const a = Math.random() * 6.283, r = (minR + Math.random() * (maxR - minR)) * T, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r, tx = Math.floor(x / T), ty = Math.floor(y / T);
    if (tx < 5 || ty < 5 || tx >= m.w - 5 || ty >= m.h - 12) continue;
    const g = m.ground[ty * m.w + tx];
    if ((g === 0 || g === 4) && !W.hit(m, x, y, 6, 5)) return { x, y };
  }
  return null;
}
function spawnSuspect(m, x, y, crimes, mode, call, extra) {
  const e = E.spawnWander(m, Math.floor(x / T), Math.floor(y / T), 4, Math.random);
  e.x = x; e.y = y; e.home = { x, y, r: 4 * T }; e.name = 'Suspect'; e.ap = E.apFor('Sus' + Math.random()); e.female = Math.random() < 0.5; e.money = ri(20, 300); e.hp = 60; e.indoor = false; e.flee = 0;
  e.sus = Object.assign({ crimes: crimes.slice(), mode, call, cuffed: false, items: [] }, extra || {});
  if (e.sus.crimes.includes('arme')) e.sus.items = ['Pistolet', 'Balles'];
  else if (Math.random() < 0.22) { e.sus.crimes.push('illegal'); e.sus.items = [pick(['Cagoule', 'Crochets', 'Pied-de-biche'])]; }
  if (mode === 'flee' && !e.sus.crimes.includes('fuite')) e.sus.crimes.push('fuite');
  if (mode === 'calm') { e.wait = true; }
  return e;
}
const CALLS = {
  vol: { text: 'Vol à l\'étalage signalé', crimes: ['vol'], modes: ['flee', 'flee', 'calm'] },
  bagarre: { text: 'Bagarre en cours', crimes: ['voies'], modes: ['fight', 'fight', 'flee'] },
  arme: { text: 'Individu armé dans la rue', crimes: ['arme'], modes: ['armed', 'armed', 'flee'] },
  cambr: { text: 'Cambriolage en cours', crimes: ['cambr'], modes: ['flee', 'flee', 'calm'] },
  meurtre: { text: 'Coups de feu - homme à terre', crimes: ['meurtre', 'arme'], modes: ['armed', 'flee'] }
};
function makeFootCall(near) {
  const w = W.get('world'), ref = C.cur === w ? { x: P.x, y: P.y } : (() => { const d = w.doorsById.police; return { x: d.x * T, y: (d.y + 3) * T }; })();
  const key = pick(Object.keys(CALLS)), c = CALLS[key];
  const loc = near ? freeTile(w, ref.x, ref.y, 9, 14) : freeTile(w, ref.x, ref.y, 18, 44);
  if (!loc) return null;
  return { type: key, text: c.text, x: loc.x, y: loc.y, r: 100, crimes: c.crimes, modes: c.modes };
}
function launchFoot(call) {
  const w = W.get('world'); st.call = { id: Math.random(), type: call.type, text: call.text, x: call.x, y: call.y, r: call.r, left: 1, t0: C.now, witness: call.witness };
  const mode = pick(call.modes), e = spawnSuspect(w, call.x, call.y, call.crimes, mode, st.call.id);
  if (call.type === 'meurtre' || call.type === 'bagarre') { // victime à terre
    const vp = freeTile(w, call.x, call.y, 1, 2.2) || { x: call.x + 14, y: call.y };
    const v = E.spawnWander(w, Math.floor(vp.x / T), Math.floor(vp.y / T), 2, Math.random); v.x = vp.x; v.y = vp.y; v.stun = 60; v.victim = true; v.name = 'Victime';
  }
  if (mode === 'fight') e.fight = false;
}
function newCall() {
  const inPatrol = !!(P.car && P.car.police);
  if (inPatrol && Math.random() < 0.45) return { type: 'poursuite', text: 'Véhicule en fuite sur l\'autoroute', x: P.x, y: P.y };
  return makeFootCall(false);
}
Pol.accept = () => {
  const c = st.pending; if (!c) return;
  if (c.type === 'poursuite') {
    if (!(P.car && P.car.police)) { UI.toast('Monte dans ta voiture de patrouille pour cette poursuite.', 'err'); return; }
    st.pending = null; st.call = { id: Math.random(), type: 'poursuite', text: c.text, left: 1, t0: C.now };
    st.chase = { id: st.call.id, wait: true };
    UI.toast('Tu es placé derrière le véhicule. Sirène : K.', 'ok');
    G.go('autoroute', 8 * T, 9 * T + 12, 'right'); return;
  }
  st.pending = null; launchFoot(c);
  UI.toast('Appel accepté : zone jaune sur la carte.', 'ok'); U.sfx('click');
};
Pol.cancelCall = () => {
  if (!st.call) return;
  UI.say('Radio', ['Abandonner la mission en cours ?'], [{ label: 'Oui', fn: () => endCall(false, 'Mission abandonnée.') }, { label: 'Non' }]);
};
function endCall(ok, msg) {
  const c = st.call; if (!c) return; st.call = null; st.chase = null; st.nextCall = (30 + Math.random() * 30) / (S.crimeF || 1);
  Object.keys(W.maps).forEach(n => (W.maps[n].ents || []).forEach(e => { if (e.sus && e.sus.call === c.id && !e.sus.cuffed) { e.sus = null; e.fight = false; e.wait = false; e.flee = 8; if (e.victim) e.victim = false; } }));
  if (ok) { const b = 60; S.money += b; st.earned += b; UI.banner('Appel clos', 'Prime de mission : ' + money(b)); }
  else if (msg) UI.toast(msg, 'err');
}
function oneDone() { if (!st.call) return; st.call.left = Math.max(0, (st.call.left || 1) - 1); if (st.call.left <= 0) endCall(true); }

/* ---------------- contrôles et accusations ---------------- */
function genCtl(e) {
  const spd = Math.round((e.base0 || e.base || 0) / KMH), lim = Cars.limitHere(), crimes = [], r = Math.random();
  if (e.sus) { e.sus.crimes.forEach(c => crimes.push(c)); }
  else if (spd > lim + 10) crimes.push('vitesse');
  const ctl = { spd, lim, lic: 'ok', bac: +(Math.random() * 0.04).toFixed(2), items: [], lightsBad: false, car: true, known: {} };
  if (e.sus) { if (crimes.includes('permis')) ctl.lic = 'none'; } else if (r < 0.1) { ctl.lic = 'none'; crimes.push('permis'); } else if (r < 0.18) { ctl.lic = 'exp'; crimes.push('permis'); }
  if (!e.sus && Math.random() < 0.1) { ctl.bac = +(0.09 + Math.random() * 0.1).toFixed(2); crimes.push('alcool'); }
  if (!e.sus && Math.random() < 0.1) { ctl.items = [pick(['Pistolet', 'Balles', 'Pied-de-biche'])]; crimes.push('illegal'); }
  const df = e.def || {}; ctl.def = df; ctl.lightsBad = !!(df.hl || df.tl);
  if (!e.sus && (df.smoke || df.tint || df.hl || df.tl)) crimes.push('equip');
  ctl.drv = { ap: E.apFor('Drv' + Math.random()), female: Math.random() < 0.5 };
  ctl.crimes = crimes; return ctl;
}
function pull(e) {
  if (e.pulled) return;
  e.base0 = e.base; e.base = 0; e.pulled = true; e.pullAt = 0; e.pullT0 = C.now; e.ctl = genCtl(e);
  UI.toast('Le véhicule se range : va le contrôler (E).', 'ok'); U.sfx('click');
}
function release(e) { e.pulled = false; if (e.base0) e.base = e.base0; e.ctl = null; if (e.sus) e.sus = null; }
Pol.control = t => {
  const car = t.kind === 'car', ctl = car ? t.ctl : (t.ctl = t.ctl || { car: false, items: t.sus.items.slice(), crimes: t.sus.crimes, known: {} });
  if (!ctl) return;
  const log = (ctl.log = ctl.log || []);
  const finish = () => { if (car) release(t); };
  const open = () => UI.modal({ title: car ? 'Contrôle routier' : 'Contrôle : ' + t.name, cls: 'rel',
    render: () => '<div class="list">' + (log.length ? log.map(l => '<p class="muted">' + esc(l) + '</p>').join('') : '<p class="muted">Que veux-tu vérifier ?</p>') + '</div><div class="brow">' +
      (car ? '<button data-a="lic">Demander le permis</button><button data-a="rad">Vitesse relevée</button><button data-a="alc">Alcootest</button><button data-a="fl">Feux, vitres, fumée</button><button data-a="s">Fouiller le véhicule</button>' : '<button data-a="s">Fouiller</button>') +
      '<button data-a="ch" class="go">Porter des accusations</button><button data-a="rel">Laisser partir</button></div>',
    onAction: (a, b, m) => {
      const add = s => { log.push(s); m.refresh(); };
      if (a === 'lic') add(ctl.lic === 'ok' ? 'Permis valide.' : ctl.lic === 'exp' ? 'Permis expiré !' : 'Aucun permis !');
      else if (a === 'rad') add('Vitesse relevée : ' + ctl.spd + ' km/h (limite ' + ctl.lim + ').');
      else if (a === 'alc') add('Alcootest : ' + ctl.bac.toFixed(2) + ' g/l' + (ctl.bac >= 0.08 ? ' - positif.' : ' - négatif.'));
      else if (a === 'fl') { const d = defTxt(ctl.def || {}); add(d.length ? 'Défauts constatés : ' + d.join(', ') + '.' : 'Feux, vitres et moteur en état.'); }
      else if (a === 's') add(ctl.items && ctl.items.length ? 'Trouvé : ' + ctl.items.join(', ') + '.' : 'Rien d\'illégal.');
      else if (a === 'ch') { UI.closeModal(); charges(t, ctl); }
      else if (a === 'rel') { UI.closeModal(); if (car) { finish(); } else { t.sus = null; t.wait = false; t.flee = 0; t.fight = false; oneDone(); } UI.toast('Tu laisses partir ' + (car ? 'le conducteur' : t.name) + '.'); }
    } });
  open();
};
const controlMenu = Pol.control;
const defTxt = df => [df.smoke && 'fumée sortant du moteur', df.tint && 'vitres beaucoup trop teintées', df.hl && 'phare avant brisé', df.tl && 'feu arrière brisé'].filter(Boolean);
function drawView(cv, t) {
  if (!cv) return; const g = cv.getContext('2d'), w = cv.width, h = cv.height, ctl = t.ctl, df = ctl.def || {};
  g.imageSmoothingEnabled = false;
  g.fillStyle = t.color || '#888'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, h - 26, w, 26); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(0, 0, w, 6);
  g.fillStyle = '#15151c'; g.fillRect(28, 12, w - 56, h - 50); g.fillStyle = '#3a4658'; g.fillRect(32, 16, w - 64, h - 58);
  g.fillStyle = '#4c5a70'; g.fillRect(32, 16, w - 64, 18);
  const spr = RG.Sp.char(ctl.drv.ap, 'down', 0), sc = 5, bw = 18 * sc;
  g.drawImage(spr, 0, 0, 18, 24, Math.round(w / 2 - bw / 2), 22, bw, 24 * sc);
  g.fillStyle = '#1b1b22'; g.beginPath(); g.ellipse(w / 2, h - 38, 46, 12, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#3a3a44'; g.beginPath(); g.ellipse(w / 2, h - 38, 36, 7, 0, 0, Math.PI * 2); g.fill();
  if (df.tint) { g.fillStyle = 'rgba(8,10,16,0.9)'; g.fillRect(32, 16, w - 64, h - 58); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(40, 22, 60, 6); }
  if (df.smoke) { for (let i = 0; i < 7; i++) { g.fillStyle = 'rgba(170,170,170,' + (0.25 + 0.1 * (i % 3)) + ')'; g.fillRect(50 + i * 34 + Math.round(Math.sin(C.now * 3 + i) * 6), h - 70 - (i % 3) * 14, 26, 18); } }
  g.fillStyle = df.hl ? '#3a3a40' : '#fff6c0'; g.fillRect(6, h - 22, 16, 10); if (df.hl) { g.strokeStyle = '#111'; g.beginPath(); g.moveTo(6, h - 22); g.lineTo(22, h - 12); g.stroke(); }
  g.fillStyle = df.tl ? '#2a2a2e' : '#ff3030'; g.fillRect(w - 22, h - 22, 16, 10);
}
const REASONS = [['routine', 'Contrôle de routine'], ['vitesse', 'Excès de vitesse'], ['equip', 'Équipement défectueux (fumée, vitres, phares)'], ['alcool', 'Soupçon de conduite en état d\'ébriété'], ['suspect', 'Véhicule suspect / recherché']];
function justify(t) {
  const ctl = t.ctl; let said = 'Le conducteur baisse sa vitre : « Y a un problème, agent ? »';
  UI.modal({ title: 'Contrôle routier', cls: 'rel',
    render: () => '<canvas id="dview" width="320" height="150" style="width:100%;max-width:520px;image-rendering:pixelated;border:3px solid #000;display:block;margin:0 auto 6px"></canvas><p class="muted">' + esc(said) + '</p><p class="muted">Justifie l\'arrêt :</p><div class="brow">' + REASONS.map(r => '<button data-a="r" data-k="' + r[0] + '">' + r[1] + '</button>').join('') + '</div>',
    after: el => drawView(el.querySelector('#dview'), t),
    onAction: (a, b, m) => {
      if (a !== 'r') return; const k = b.dataset.k, cr = ctl.crimes || [];
      const ok = k === 'routine' || (k === 'vitesse' && cr.includes('vitesse')) || (k === 'equip' && cr.includes('equip')) || (k === 'alcool' && cr.includes('alcool')) || (k === 'suspect' && !!t.sus);
      if (!ok) {
        const pen = 100 + 80 * (S.falseStops | 0); S.falseStops = (S.falseStops | 0) + 1; S.money = Math.max(0, S.money - pen);
        UI.closeModal(); UI.toast('Arrêt injustifié : plainte du conducteur, amende de ' + money(pen) + '.', 'err'); U.sfx('err'); release(t); return;
      }
      ctl.justified = k; ctl.log = ctl.log || []; ctl.log.push('Motif : ' + REASONS.find(r => r[0] === k)[1] + '.');
      if (k === 'equip') { const d = defTxt(ctl.def || {}); ctl.log.push('Défaut constaté : ' + (d.join(', ') || 'rien de visible') + '.'); }
      UI.closeModal(); controlMenu(t);
    } });
}
Pol.control = t => {
  if (t.kind !== 'car') return controlMenu(t);
  if (!t.ctl) return;
  const a = (t.ang || 0) + Math.PI / 2, side = Math.sin(a) >= 0 ? 1 : -1;
  P.x = t.x + Math.cos(a) * 24 * side; P.y = t.y + Math.sin(a) * 24 * side; P.dir = Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? (Math.cos(a) * side > 0 ? 'left' : 'right') : (Math.sin(a) * side > 0 ? 'up' : 'down');
  if (t.ctl.justified) return controlMenu(t);
  justify(t);
};
function charges(t, ctl) {
  const car = t.kind === 'car', sel = new Set(), truth = ctl.crimes || [];
  const keys = Object.keys(CH).filter(k => car ? !['cambr', 'vol', 'voies', 'meurtre', 'arme'].includes(k) || truth.includes(k) : true);
  UI.modal({ title: 'Chefs d\'accusation', cls: 'rel',
    render: () => '<p class="muted">Coche seulement ce que tu peux prouver. Les fausses accusations te coûtent une amende de plus en plus lourde.</p><div class="brow">' + keys.map(k => '<button data-a="t" data-k="' + k + '"' + (sel.has(k) ? ' class="go"' : '') + '>' + CH[k].n + (sel.has(k) ? ' : oui' : '') + '</button>').join('') + '</div><div class="brow"><button data-a="fine">Verbaliser (amende)</button><button data-a="arr" class="go">Arrêter</button><button data-a="x">Annuler</button></div>',
    onAction: (a, b, m) => {
      if (a === 't') { const k = b.dataset.k; sel.has(k) ? sel.delete(k) : sel.add(k); m.refresh(); return; }
      if (a === 'x') { UI.closeModal(); return; }
      if (!sel.size) { UI.toast('Sélectionne au moins un chef d\'accusation.', 'err'); return; }
      const good = [...sel].filter(k => truth.includes(k)), bad = [...sel].filter(k => !truth.includes(k)), missed = truth.filter(k => !sel.has(k));
      let reward = Math.round(good.reduce((s, k) => s + CH[k].f, 0) * 0.4), pen = 0;
      bad.forEach(() => { pen += 150 + 100 * (S.falseCh | 0); S.falseCh = (S.falseCh | 0) + 1; });
      if (pen) { S.money = Math.max(0, S.money - pen); UI.toast('Fausses accusations : amende de ' + money(pen) + ' pour toi.', 'err'); U.sfx('err'); }
      if (missed.length) UI.toast('Tu as oublié : ' + missed.map(k => CH[k].n).join(', ') + '.');
      enforce(0.05 * good.length);
      if (a === 'fine') {
        UI.closeModal(); S.money += reward; st.earned += reward; if (reward) UI.toast('Amende dressée : prime ' + money(reward) + '.', 'ok');
        if (car) release(t); else { t.sus = null; t.wait = false; t.flee = 0; t.fight = false; }
        oneDone(); return;
      }
      if (a === 'arr') {
        UI.closeModal();
        if (!car && !t.sus.cuffed && !cuffOk(t)) { return; }
        const e = car ? driverOf(t) : t;
        e.sus = e.sus || { crimes: truth.slice(), call: t.sus && t.sus.call, mode: 'calm', items: [] };
        e.sus.charges = { reward, n: good.length }; cuffNow(e);
        if (car) { t.pulled = false; t.base = 0; t.vx = 0; t.removeT = C.now + 40; t.sus = null; }
        if (C.cur.name === 'police') jailProcess();
      }
    } });
}
function driverOf(car) {
  const m = C.cur, a = (car.ang || 0) + Math.PI / 2, x = car.x + Math.cos(a) * 20, y = car.y + Math.sin(a) * 20;
  const e = E.spawnWander(m, Math.floor(x / T), Math.floor(y / T), 3, Math.random); e.x = x; e.y = y; e.name = 'Conducteur'; e.ap = E.apFor('Cond' + Math.random()); e.hp = 60; e.indoor = false;
  e.sus = { crimes: (car.ctl && car.ctl.crimes || []).slice(), call: car.sus && car.sus.call, mode: 'calm', items: [] }; e.sus.driver = true; return e;
}
function cuffOk(e) {
  const s = e.sus; if (!s) return false;
  if ((s.mode === 'fight' || s.mode === 'armed') && !(e.stun > 0) && !s.calm) { UI.toast(e.name + ' se débat ! Tase-le (F) ou frappe-le d\'abord.', 'err'); return false; }
  return true;
}
function cuffNow(e) {
  const s = e.sus; if (s.cuffed) return;
  s.cuffed = true; s.mode = 'calm'; e.stun = 0; e.fight = false; e.flee = 0; e.wait = false; e.talk = 0; e.follow = true; e.victim = false;
  if (!st.esc.includes(e)) st.esc.push(e);
  G.floater(e.x, e.y - 30, 'Menotté', '#9fc0ff'); U.sfx('click');
  UI.toast(e.name + ' est menotté. Amène-le au commissariat (à pied ou en voiture, 2 places).', 'ok');
}
Pol.cuffKey = () => {
  if (!S.duty || P.car || C.mode !== 'play') return;
  let best = null, bd = 34;
  for (const e of C.cur.ents) if (e.kind === 'npc' && e.sus && !e.sus.cuffed) { const d = Math.hypot(e.x - P.x, e.y - P.y); if (d < bd) { bd = d; best = e; } }
  if (!best) { UI.toast('Personne à menotter ici.'); return; }
  if (!cuffOk(best)) return;
  if (!best.sus.charges) { cuffNow(best); UI.toast('Porte les accusations (E sur lui) avant l\'écrou.'); }
};
Game_policeTalk();
function Game_policeTalk() {
  G.policeTalk = e => {
    if (S.duty && e.victim) { UI.toast('La victime est inconsciente : une ambulance va arriver.'); return true; }
    if (!S.duty || !e.sus) return false;
    e.kind = 'npc'; Pol.control(e); return true;
  };
}

/* ---------------- jail ---------------- */
function enforce(n) { S.crimeF = Math.max(0.4, (S.crimeF == null ? 1 : S.crimeF) - n); }
function jailProcess() {
  const done = st.esc.filter(e => e.sus && e.sus.charges);
  if (!done.length) { if (st.esc.length) UI.toast('Porte d\'abord les accusations (E sur le suspect).', 'err'); return; }
  const pm = W.get('police'), j = pm.jail || { x: 11, y: 3 }; let total = 0;
  done.forEach((e, i) => {
    total += e.sus.charges.reward + 60;
    Object.keys(W.maps).forEach(n => { const m = W.maps[n]; if (m.ents) m.ents = m.ents.filter(x => x !== e); });
    e.x = (j.x + (i % 2)) * T + 8; e.y = (j.y + Math.floor(i / 2) % 2) * T + 12; e.wait = true; e.follow = false; e.hidden = false; e.indoor = true; e.name = 'Détenu'; e.jailT = 40; e.home = { x: e.x, y: e.y, r: 8 };
    const cid = e.sus.call; e.sus = null; pm.ents.push(e);
    if (st.call && cid === st.call.id) oneDone();
  });
  st.esc = st.esc.filter(e => !done.includes(e)); enforce(0.07 * done.length);
  S.money += total; st.earned += total; S.stats.arrests = (S.stats.arrests | 0) + done.length;
  UI.say('Dubois', ['Bon travail, agent !', done.length + ' inculpé' + (done.length > 1 ? 's' : '') + ' écroué' + (done.length > 1 ? 's' : '') + '. Prime : ' + money(total) + '.']);
  U.sfx('win');
}
const oldEnter = L.enter;
L.enter = name => { oldEnter(name); if (S.duty && name === 'police') setTimeout(jailProcess, 400); };
G.lifeEnter = L.enter;
Pol.afterExit = c => {
  const m = C.cur; let i = 0;
  for (const e of (c.pass || [])) { e.hidden = false; e.x = P.x + 14 + (i++) * 12; e.y = P.y + 8; if (!m.ents.includes(e)) m.ents.push(e); }
  c.pass = [];
};
const oldEP = Cars.enterPolice;
Cars.enterPolice = e => {
  oldEP(e); if (!(P.car && P.car.police)) return;
  let n = 0; for (const s of st.esc) if (n < 2 && Math.hypot(s.x - P.x, s.y - P.y) < 80) { s.hidden = true; P.car.pass.push(s); n++; }
  if (n) UI.toast(n + ' suspect' + (n > 1 ? 's' : '') + ' à l\'arrière.', 'ok');
};

/* ---------------- renforts ---------------- */
Pol.backup = () => {
  if (st.backupCd > 0) { UI.toast('Renforts déjà demandés. Patience (' + Math.ceil(st.backupCd) + ' s).', 'err'); return; }
  UI.say('Radio', ['Quels renforts ?'], [{ label: 'Voiture de patrouille', fn: () => callBackup('car') }, { label: '2 agents à pied', fn: () => callBackup('foot') }, { label: 'Annuler' }]);
};
function callBackup(kind) {
  st.backupCd = 60; UI.toast('Renforts en route...', 'ok');
  setTimeout(() => {
    const m = C.cur; if (!m || !m.outdoor || !S.duty) return;
    const loc = freeTile(m, P.x, P.y, 6, 9) || { x: P.x + 60, y: P.y };
    if (kind === 'car') { const e = E.make('car', { ally: true, police: true, siren: true, x: loc.x, y: loc.y, ang: Math.random() * 6.28, color: '#1b2a52', len: 24, spd: 0, hp: 150, vx: 0, vy: 0 }); m.ents.push(e); st.allies.push({ e, m, t: 55 }); }
    else for (let i = 0; i < 2; i++) { const f = freeTile(m, loc.x, loc.y, 1, 2.5) || loc, c = E.spawnCop(m, Math.floor(f.x / T), Math.floor(f.y / T), true); c.ally = true; st.allies.push({ e: c, m, t: 55 }); }
    UI.toast('Les renforts sont arrivés.', 'ok'); U.sfx('alarm');
  }, 5500);
}

/* ---------------- armes de service ---------------- */
const fineCop = (n, why) => { S.money = Math.max(0, S.money - n); UI.toast(why + ' : amende de ' + money(n) + '.', 'err'); U.sfx('err'); };
const oldPunch = G.punch;
G.punch = () => {
  if (S.duty) { let b = null, bd = 26; for (const e of C.cur.ents) { if (e.kind !== 'npc' || e.partner || e.kid || e.mainChar || e.dying != null) continue; const d = Math.hypot(e.x - P.x, e.y - P.y); if (d < bd) { bd = d; b = e; } } if (b && !b.sus && !b.victim) fineCop(120, 'Violence injustifiée'); }
  oldPunch();
};
const oldUse = G.useWeapon;
let tasCd = 0;
G.useWeapon = () => {
  const wid = S.equip.weapon;
  if (!S.duty || !wid || !D.ITEMS[wid] || !D.ITEMS[wid].duty) return oldUse();
  const dv = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[P.dir] || [0, 1];
  if (wid === 'matraque') { G.punch(); return; }
  if (wid === 'taser') {
    if (tasCd > 0) return; tasCd = 1.6; U.sfx('shot'); P.punchT = 0.28;
    let best = null, bd = 80;
    for (const e of C.cur.ents) { if (e.kind !== 'npc' || e.dying != null || e.partner || e.kid || e.mainChar || e.victim) continue; const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy); if (d < bd && (dx * dv[0] + dy * dv[1]) / (d || 1) > 0.5) { bd = d; best = e; } }
    if (!best) { UI.toast('Rien dans la ligne de mire.'); return; }
    G.floater(best.x, best.y - 30, 'Taser !', '#6ad8ff');
    if (best.sus) { best.stun = 7; best.fight = false; best.flee = 0; best.sus.calm = true; } else { best.stun = 4; fineCop(300, 'Taser sur un civil'); }
    return;
  }
  if (wid === 'pistolet_s') {
    if (!(S.inv.balles > 0)) { UI.toast('Plus de balles ! Retourne à l\'armurerie.', 'err'); U.sfx('err'); return; }
    S.inv.balles--; if (S.dutyAmmo > 0) S.dutyAmmo--;
    C.bullets.push({ x: P.x + dv[0] * 8, y: P.y - 10 + dv[1] * 6, vx: dv[0] * 260, vy: dv[1] * 260, t: 0, life: 0.6 }); U.sfx('shot'); return;
  }
};
const oldHit = G.onShotHit;
G.onShotHit = e => {
  if (!S.duty) return oldHit(e);
  if (e.kind === 'npc') {
    G.floater(e.x, e.y - 26, 'Touché', '#ff9a9a');
    if (e.sus) { e.hp -= 30; e.stun = Math.max(e.stun || 0, 6); e.fight = false; e.flee = 0; e.sus.calm = true; if (e.hp <= 0) { e.hp = 22; } }
    else fineCop(800, 'Tir injustifié sur un civil');
    return;
  }
  if (e.kind === 'cop') { fineCop(1000, 'Tir sur un collègue'); return; }
  oldHit(e);
};

/* ---------------- boucle ---------------- */
function suspects() { const o = []; Object.keys(W.maps).forEach(n => (W.maps[n].ents || []).forEach(e => { if (e.sus) o.push(e); })); return o; }
function ensureEsc() {
  for (const e of st.esc) {
    if (e.hidden) { e.x = P.x; e.y = P.y; if (!C.cur.ents.includes(e)) C.cur.ents.push(e); continue; }
    if (!C.cur.ents.includes(e)) { Object.keys(W.maps).forEach(n => { const m = W.maps[n]; if (m.ents) m.ents = m.ents.filter(x => x !== e); }); e.x = P.x - 14; e.y = P.y + 6; C.cur.ents.push(e); }
  }
}
function suspectAI(dt) {
  const m = C.cur;
  for (const e of m.ents) {
    if (e.kind !== 'npc' || !e.sus || e.sus.cuffed || e.stun > 0 || e.dying != null) continue;
    const s = e.sus, d = Math.hypot(P.x - e.x, P.y - e.y);
    if (s.calm) { e.fight = false; e.flee = 0; e.wait = true; continue; }
    const ally = st.allies.some(a => a.m === m && Math.hypot(a.e.x - e.x, a.e.y - e.y) < 230);
    if (ally && !s.calm && s.mode !== 'calm' && !s.driver) { s.calm = true; s.mode = 'calm'; e.fight = false; e.flee = 0; e.wait = true; G.floater(e.x, e.y - 30, 'Je me rends !', '#fff'); continue; }
    if (s.mode === 'flee') { e.flee = d < 170 ? Math.max(e.flee || 0, 2) : 0; }
    else if (s.mode === 'fight') { e.fight = d < 230; e.wait = false; }
    else if (s.mode === 'armed') {
      e.fight = false; e.wait = false; s.shotT = (s.shotT || 1.5) - dt;
      const dx = P.x - e.x, dy = P.y - e.y, l = d || 1, sp = 36 * dt;
      if (d > 85) { if (!E.move(e, m, dx / l * sp, dy / l * sp)) E.move(e, m, dx / l * sp, 0); e.anim += dt * 8; } else if (d < 55) { E.move(e, m, -dx / l * sp, -dy / l * sp); } else e.anim = 0;
      e.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
      if (d < 130 && s.shotT <= 0) { s.shotT = 1.8; U.sfx('shot'); if (Math.random() < 0.6) { S.hp = Math.max(1, S.hp - 6); G.floater(P.x, P.y - 28, '-6', '#ff6a5a'); } else G.floater(P.x, P.y - 28, 'Raté', '#ddd'); }
    }
  }
}
function chaseLogic(dt) {
  const m = C.cur;
  if (st.chase && st.chase.wait && C.cur.name === 'autoroute' && C.fade.dir === 0) {
    st.chase.wait = false;
    const crimes = ['vitesse', 'fuite']; if (Math.random() < 0.4) crimes.push('permis');
    const car = E.make('car', { ai: true, x: P.x + 170, y: 9 * T + 12, ang: 0, dir: 1, lane: 9, color: pick(['#c8403a', '#e8c030', '#2b2b33', '#8a63c9']), len: 22, vx: 125 * KMH, vy: 0, base: 125 * KMH, v: 125 * KMH, hp: 100, crash: false });
    car.sus = { crimes, call: st.chase.id, chase: true, mode: 'car' }; car.ctl = null; st.chase.car = car; st.chase.t = 0; st.chase.near = 0; m.ents.push(car);
    if (P.car) { P.car.ang = 0; P.car.vx = 120 * KMH; P.car.vy = 0; }
    return;
  }
  const ch = st.chase; if (!ch || ch.wait || !ch.car) return;
  const car = ch.car; ch.t += dt;
  if (car.pulled) { return; }
  const d = Math.hypot(car.x - P.x, car.y - P.y);
  if (P.car && P.car.siren && d < 95) ch.near += dt; else ch.near = Math.max(0, ch.near - dt);
  if (ch.near > 4) { pull(car); car.ctl.crimes = car.sus.crimes.slice(); car.ctl.lic = car.sus.crimes.includes('permis') ? 'none' : 'ok'; car.ctl.spd = 125; car.ctl.lim = 110; UI.toast('Le fuyard se range !', 'ok'); }
  for (let i = C.bullets.length - 1; i >= 0; i--) { const b = C.bullets[i]; if (Math.hypot(b.x - car.x, b.y - car.y) < 15) { C.bullets.splice(i, 1); pull(car); car.ctl.crimes = car.sus.crimes.slice(); car.ctl.spd = 125; car.ctl.lim = 110; UI.toast('Pneus touchés : le véhicule s\'arrête.', 'ok'); break; } }
  if (ch.t > 140 || d > 1400) { car.sus = null; st.chase = null; endCall(false, 'Le suspect t\'a échappé.'); }
}
Pol.orderPull = () => {
  if (!S.duty || !(P.car && P.car.police)) { UI.toast('Il faut être en voiture de patrouille en service.', 'err'); return; }
  if (!P.car.siren) P.car.siren = true;
  const m = C.cur, fx = Math.cos(P.car.ang), fy = Math.sin(P.car.ang); let best = null, bd = 200;
  for (const e of m.ents) {
    if (e.kind !== 'car' || !e.ai || e.cop || e.pulled || e.pullAt || e.crash || e.patrol || e.ally || e.sus) continue;
    const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy);
    if (d < bd && (dx * fx + dy * fy) / (d || 1) > 0.65 && Math.abs(dx * fy - dy * fx) < 46) { bd = d; best = e; }
  }
  if (!best) { UI.toast('Aucun véhicule devant toi. Place-toi derrière lui.', 'err'); return; }
  best.pullAt = C.now + 1.6; G.floater(best.x, best.y - 24, 'Rangez-vous !', '#ffe08a'); U.sfx('alarm');
};
function startFlight(e, crimes) {
  const cr = crimes.slice(); if (!cr.includes('fuite')) cr.push('fuite'); if (!cr.includes('vitesse')) cr.push('vitesse');
  e.sus = { crimes: cr, call: null, chase: true, mode: 'car' }; e.pullAt = 0; e.base = (120 + ri(0, 25)) * KMH; e.v = e.base; e.ctl = null;
  st.call = { id: Math.random(), type: 'poursuite', text: 'Refus d\'obtempérer', left: 1, t0: C.now }; e.sus.call = st.call.id;
  st.chase = { id: st.call.id, car: e, t: 0, near: 0, wait: false };
  UI.toast('Le conducteur refuse de s\'arrêter ! Poursuite !', 'err'); U.sfx('alarm');
}
function decide(e) {
  const f = S.crimeF || 1, c = genCtl(e), crimes = c.crimes;
  const refuse = !st.chase && Math.random() < 0.06 + (crimes.length ? 0.28 : 0) + 0.05 * (f - 1);
  if (refuse) startFlight(e, crimes); else pull(e);
}
function pullOvers(dt) {
  const m = C.cur;
  for (const e of m.ents) if (e.pullAt && !e.pulled && C.now >= e.pullAt) { e.pullAt = 0; decide(e); }
  for (let i = C.bullets.length - 1; i >= 0; i--) { const b = C.bullets[i]; for (const e of m.ents) if (e.kind === 'car' && e.ai && !e.sus && !e.cop && !e.patrol && Math.hypot(b.x - e.x, b.y - e.y) < 14) { C.bullets.splice(i, 1); fineCop(500, 'Tir sur un véhicule civil'); break; } }
}
function cleanup(dt) {
  const pm = W.get('police'); if (pm) pm.ents = pm.ents.filter(e => { if (e.jailT != null) { e.jailT -= dt; return e.jailT > 0; } return true; });
  Object.keys(W.maps).forEach(n => { const m = W.maps[n]; if (!m.ents) return; m.ents = m.ents.filter(e => !(e.removeT && C.now > e.removeT) && !(e.pulled && C.now - e.pullT0 > 150 && (release(e), false))); });
  st.allies = st.allies.filter(a => { a.t -= dt; if (a.t <= 0) { a.m.ents = a.m.ents.filter(x => x !== a.e); return false; } return true; });
}
const oldUpd = L.update;
L.update = dt => {
  oldUpd(dt);
  if (C.mode !== 'play') return;
  if (tasCd > 0) tasCd -= dt; if (st.backupCd > 0) st.backupCd -= dt;
  S.crimeF = Math.min(2.2, (S.crimeF == null ? 1 : S.crimeF) + dt * 0.0004);
  if (!S.duty) { if (radio) radio.style.display = 'none'; return; }
  if (S.jail) return;
  S.wanted = 0;
  // paie et immobilité
  const busy = UI.isModal() || UI.dialogOpen();
  st.payAcc += 2 * dt; if (st.payAcc >= 1) { const n = Math.floor(st.payAcc); st.payAcc -= n; S.money += n; st.earned += n; }
  if ((st.sampT += dt) > 0.5) { st.sampT = 0; if (Math.hypot(P.x - st.lx, P.y - st.ly) > 4 || busy) st.still = 0; else st.still += 0.5; st.lx = P.x; st.ly = P.y; if (st.still >= 60) { st.still = 0; Pol.endDuty('Service coupé : tu es resté immobile plus d\'une minute.'); return; } }
  // appels
  if (!st.pending && !st.call && (st.nextCall -= dt) <= 0) { const c = newCall(); if (c) { st.pending = c; st.pendingT = 25; U.sfx('alarm'); } else st.nextCall = 10; }
  if (st.pending && (st.pendingT -= dt) <= 0) { st.pending = null; st.nextCall = 25; UI.toast('Appel sans réponse.'); }
  if (!st.call && !st.pending && (st.nextStreet -= dt) <= 0 && C.cur.name === 'world' && !P.car) { st.nextStreet = (90 + Math.random() * 60) / (S.crimeF || 1); const c = makeFootCall(true); if (c) { c.witness = true; c.text = 'Crime observé : ' + c.text.toLowerCase(); c.r = 80; launchFoot(c); UI.toast('Tu es témoin d\'un crime !', 'err'); U.sfx('alarm'); } }
  if (st.call && st.call.type !== 'poursuite' && C.now - st.call.t0 > 300 && !st.esc.length) endCall(false, 'Appel expiré.');
  ensureEsc(); suspectAI(dt); chaseLogic(dt); pullOvers(dt); cleanup(dt);
  if (P.car && P.car.police) for (const e of P.car.pass || []) { e.x = P.x; e.y = P.y; }
  if ((st.tick += dt) > 3) { st.tick = 0; if (!P.car && !patrolEnts().length) spawnPatrol(); }
  if ((st.radT += dt) > 0.2) { st.radT = 0; drawRadio(); }
};

/* ---------------- dessin ---------------- */
Pol.drawWorld = (ctx, camX, camY) => {
  if (!S.duty) return;
  const m = C.cur;
  if (P.car && P.car.police && P.car.siren) { const f = Math.floor(C.now * 4) % 2; ctx.save(); ctx.fillStyle = f ? 'rgba(255,40,40,0.09)' : 'rgba(40,80,255,0.09)'; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.restore(); }
  if (st.call && st.call.x != null && m.name === 'world') {
    const x = st.call.x - camX, y = st.call.y - camY, r = st.call.r, p = 0.5 + 0.5 * Math.sin(C.now * 3);
    ctx.save(); ctx.fillStyle = 'rgba(255,220,0,' + (0.10 + 0.08 * p) + ')'; ctx.strokeStyle = 'rgba(255,212,0,0.9)'; ctx.setLineDash([6, 5]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
    const cw = ctx.canvas.width, ch = ctx.canvas.height;
    if (x < 0 || y < 0 || x > cw || y > ch) { const a = Math.atan2(st.call.y - P.y, st.call.x - P.x), ax = cw / 2 - camX * 0 + Math.cos(a) * (Math.min(cw, ch) / 2 - 22), ay = ch / 2 + Math.sin(a) * (Math.min(cw, ch) / 2 - 22); ctx.save(); ctx.translate(ax, ay); ctx.rotate(a); ctx.fillStyle = '#ffd400'; ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-6, -6); ctx.lineTo(-6, 6); ctx.fill(); ctx.restore(); }
  }
  for (const e of m.ents) {
    if (e.kind === 'npc' && e.sus && Math.hypot(e.x - P.x, e.y - P.y) < 320) { const s = e.sus; U.drawText(ctx, s.cuffed ? 'Menotté' : (Math.floor(C.now * 3) % 2 ? '!' : 'SUSPECT'), Math.round(e.x - camX) - (s.cuffed ? 16 : 14), Math.round(e.y - camY) - 42, s.cuffed ? '#9fc0ff' : '#ff6a5a', '#000'); }
    else if (e.kind === 'car' && e.pulled) U.drawText(ctx, 'Contrôle [E]', Math.round(e.x - camX) - 24, Math.round(e.y - camY) - 24, '#ffe08a', '#000');
  }
};
Pol.drawMini = (mctx, m) => {
  if (!S.duty) return;
  if (st.call && st.call.x != null && m.name === 'world') { const cx = st.call.x / T, cy = st.call.y / T, p = 0.5 + 0.5 * Math.sin(C.now * 3); mctx.fillStyle = 'rgba(255,220,0,' + (0.25 + 0.2 * p) + ')'; mctx.strokeStyle = '#ffd400'; mctx.beginPath(); mctx.arc(cx, cy, Math.max(4, st.call.r / T + 1), 0, Math.PI * 2); mctx.fill(); mctx.stroke(); }
  mctx.fillStyle = '#ff4a4a'; for (const e of m.ents) if (e.sus && !e.sus.cuffed || (e.kind === 'car' && e.sus)) mctx.fillRect(Math.floor(e.x / T) - 1, Math.floor(e.y / T) - 1, 2, 2);
};
const oldInit = L.init;
L.init = () => { oldInit(); S.stats = S.stats || {}; };
})();
