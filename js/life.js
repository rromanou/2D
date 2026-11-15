(() => {
'use strict';
const RG = window.RG, U = RG.U, UI = RG.UI, D = RG.Data, E = RG.Ent, W = RG.World, Sp = RG.Sp, T = RG.T, G = RG.Game, C = RG.core, S = RG.S, Ic = RG.Icons;
const L = RG.Life = {};
const money = U.money, esc = UI.esc;
const pick = a => a[Math.floor(Math.random() * a.length)];

/* ------------------------------------------------------------------ */
/*  Initialisation / besoins                                           */
/* ------------------------------------------------------------------ */
L.init = () => {
  if (S.sleep == null) S.sleep = 90;
  if (S.fun == null) S.fun = 70;
  S.rel = S.rel || {}; S.kids = S.kids || []; S.furnInv = S.furnInv || {}; S.fit = S.fit || 0; S.know = S.know || 0;
  if (!S.furn) S.furn = JSON.parse(JSON.stringify(D.DEFAULT_FURN));
  if (!S.home) S.home = { size: 0, wall: D.WALLS[0], floor: 0 };
  S.guest = null; S.fridgeT = S.fridgeT || 0;
  W.rebuildHome();
};
L.needs = dt => {
  S.sleep = Math.max(0, S.sleep - 0.15 * dt);
  S.fun = Math.max(0, S.fun - 0.07 * dt);
  const warn = (k, v, msg) => { if (S[k] < v && !C['w' + k]) { C['w' + k] = 1; UI.toast(msg, 'err'); } else if (S[k] > v + 5) C['w' + k] = 0; };
  warn('sleep', 20, 'Tu es épuisé : va dormir dans un lit.');
  warn('fun', 15, 'Tu t\'ennuies : fais une activité qui te plaît.');
  if (S.sleep <= 0) { UI.toast('Tu t\'endors de fatigue...', 'err'); S.sleep = 45; G.faint(); }
};
L.speedMul = () => (S.sleep < 15 ? 0.82 : 1) * (S.fun < 8 ? 0.93 : 1);
L.staminaCost = () => 1 - Math.min(0.5, (S.fit || 0) / 100);

// fait passer du temps (avec fondu) et applique des effets
L.pass = (min, eff, msg) => {
  if (C.fade.dir !== 0) return;
  C.fade = { a: 0, dir: 1, cb: () => {
    S.abs += min; S.time = S.abs % 1440; S.day = 1 + Math.floor(S.abs / 1440);
    S.hunger = Math.max(0, S.hunger - 0.0275 * min); S.thirst = Math.max(0, S.thirst - 0.04 * min);
    S.sleep = Math.max(0, S.sleep - 0.075 * min); S.fun = Math.max(0, S.fun - 0.035 * min);
    eff = eff || {};
    if (eff.fun) S.fun = U.clamp(S.fun + eff.fun, 0, 100);
    if (eff.sleep) S.sleep = U.clamp(S.sleep + eff.sleep, 0, 100);
    if (eff.stamina) S.stamina = U.clamp(S.stamina + eff.stamina, 0, 100);
    if (eff.hp) S.hp = U.clamp(S.hp + eff.hp, 0, 100);
    if (eff.fit) S.fit = Math.min(60, (S.fit || 0) + eff.fit);
    if (eff.know) S.know = (S.know || 0) + eff.know;
    if (msg) UI.toast(msg, 'ok');
  } };
};
const pay = n => { if (S.money < n) { UI.toast('Pas assez d\'argent.', 'err'); U.sfx('err'); return false; } S.money -= n; return true; };

/* ------------------------------------------------------------------ */
/*  Sommeil                                                            */
/* ------------------------------------------------------------------ */
L.sleepDialog = () => {
  UI.say('Lit', [S.sleep > 80 ? 'Tu n\'as pas vraiment sommeil, mais tu peux quand même te coucher.' : 'Dormir jusqu\'au matin ? Tu récupéreras santé, endurance et sommeil.'], [{ label: 'Dormir', fn: () => L.sleep() }, { label: 'Pas maintenant' }]);
};
L.sleep = after => {
  C.fade = { a: 0, dir: 1, cb: () => {
    const day = Math.floor(S.abs / 1440), hr = S.abs % 1440;
    S.abs = (hr < 7 * 60 ? day : day + 1) * 1440 + 7 * 60;
    S.time = S.abs % 1440; S.day = 1 + Math.floor(S.abs / 1440);
    S.hp = 100; S.stamina = 100; S.sleep = 100; S.fun = Math.max(S.fun, 45);
    S.hunger = Math.max(15, S.hunger - 15); S.thirst = Math.max(15, S.thirst - 15);
    S.wanted = Math.max(0, S.wanted - 2);
    G.save(); UI.toast('Bonne nuit ! Il est 7 h du matin.', 'ok');
    if (after) after();
  } };
};

/* ------------------------------------------------------------------ */
/*  Activités                                                          */
/* ------------------------------------------------------------------ */
L.zone = z => {
  switch (z.action) {
    case 'cinema': if (pay(12)) { const f = ['« Les Aventuriers du Lac »', '« La Nuit des Lanternes »', '« Un Été au Village »', '« Le Casse du Siècle »']; L.pass(120, { fun: 55 }, 'Tu as adoré le film ' + pick(f) + '.'); } break;
    case 'gym': if (S.hunger < 15) { UI.toast('Tu es trop affamé pour t\'entraîner.', 'err'); break; } if (pay(5)) { L.pass(45, { fun: 10, fit: 2, stamina: 40 }, 'Bonne séance ! Tu te sens plus endurant.'); S.hunger = Math.max(0, S.hunger - 6); S.thirst = Math.max(0, S.thirst - 10); } break;
    case 'read': L.pass(60, { fun: 24, know: 1 }, 'Un bon livre, ça fait du bien.'); break;
    case 'arcade': if (pay(2)) { const win = Math.random() < 0.22, prize = 6 + Math.floor(Math.random() * 15); L.pass(20, { fun: 17 }, win ? 'Meilleur score ! Tu gagnes ' + money(prize) + ' de tickets.' : 'Partie terminée. Presque !'); if (win) G.gain(prize); } break;
    case 'dance': L.pass(40, { fun: 30, stamina: -15 }, 'Quelle soirée ! Tu as dansé jusqu\'à plus soif.'); S.thirst = Math.max(0, S.thirst - 12); break;
    case 'rest': L.pass(20, { fun: 6, stamina: 40 }, 'Tu te reposes un moment sur le banc.'); break;
    case 'furn': L.furnAction(z.data.fn, z.data.idx); break;
  }
};
L.furnAction = fn => {
  switch (fn) {
    case 'sleep': L.sleepDialog(); break;
    case 'sofa': UI.say('Canapé', ['Qu\'est-ce qui te ferait plaisir ?'], [{ label: 'Se détendre (30 min)', fn: () => L.pass(30, { fun: 12, sleep: 4 }, 'Tu te sens plus détendu.') }, { label: 'Sieste (2 h)', fn: () => L.pass(120, { sleep: 38, fun: 4 }, 'Une bonne sieste !') }, { label: 'Non' }]); break;
    case 'tv': L.pass(60, { fun: 30 }, 'Tu as regardé une bonne émission.'); break;
    case 'console': L.pass(90, { fun: 46 }, 'Quelle partie de jeu vidéo !'); break;
    case 'piano': L.pass(60, { fun: 36 }, 'Tu joues une mélodie, très inspirée.'); break;
    case 'read': L.pass(60, { fun: 24, know: 1 }, 'Tu as lu un bon livre.'); break;
    case 'gym': L.pass(30, { fun: 6, fit: 1, stamina: 30 }, 'Un peu d\'exercice à la maison.'); break;
    case 'mirror': G.openMirror(); break;
    case 'stash': UI.stash(); break;
    case 'fridge':
      if (S.abs >= (S.fridgeT || 0)) { S.hunger = Math.min(100, S.hunger + 22); S.thirst = Math.min(100, S.thirst + 15); S.fridgeT = S.abs + 240; U.sfx('eat'); UI.toast('Tu te sers une collation dans le frigo.', 'ok'); G.event('eat'); }
      else UI.toast('Le frigo est presque vide : reviens plus tard.', 'err');
      break;
    case 'cook': {
      const foods = Object.keys(S.inv).filter(k => S.inv[k] > 0 && D.ITEMS[k].k === 'food' && k !== 'platmaison');
      let n = 0; foods.forEach(k => { n += S.inv[k]; });
      if (n < 2) { UI.toast('Il te faut au moins 2 aliments dans ton sac pour cuisiner.', 'err'); break; }
      let need = 2; for (const k of foods) { while (need > 0 && S.inv[k] > 0) { S.inv[k]--; need--; } }
      S.inv.platmaison = (S.inv.platmaison || 0) + 1; UI.hotbarDirty && UI.hotbarDirty();
      L.pass(25, { fun: 4 }, 'Plat maison prêt ! Il est dans ton sac.'); break;
    }
  }
};
G.lifeZone = L.zone;
G.heal = () => { if (S.hp >= 99) { UI.toast('Tu es en pleine forme !'); return; } if (pay(30)) { S.hp = 100; U.sfx('win'); UI.toast('Soigné : santé restaurée.', 'ok'); } };

/* ------------------------------------------------------------------ */
/*  Relations                                                          */
/* ------------------------------------------------------------------ */
const LV = ['Inconnu', 'Connaissance', 'Ami', 'Bon ami', 'Meilleur ami'];
const LVP = [0, 8, 30, 70, 120, 200];
const keyOf = e => e.kind === 'static' ? e.id2 : e.name;
const rel = e => { const k = keyOf(e); return S.rel[k] || (S.rel[k] = { n: e.name, p: 0, d: -1, c: 0, fd: -1, lover: 0, married: 0 }); };
const level = p => p >= 120 ? 4 : p >= 70 ? 3 : p >= 30 ? 2 : p >= 8 ? 1 : 0;
const statusLabel = r => r.married ? 'Marié(e)' : r.lover ? 'En couple' : LV[level(r.p)];
L.gain = (e, amt) => {
  const r = rel(e); if (r.d !== S.day) { r.d = S.day; r.c = 0; }
  r.c++; const mult = r.c <= 4 ? 1 : r.c <= 7 ? 0.4 : 0.1;
  const old = level(r.p), g = Math.round(amt * mult * 10) / 10;
  r.p = U.clamp(r.p + g, 0, 200);
  if (g > 0) G.floater(e.x, e.y - 28, '+' + (g % 1 ? g.toFixed(1) : g), '#ff9ac8'); else if (g < 0) G.floater(e.x, e.y - 28, String(g), '#ff7a7a');
  if (level(r.p) > old) { UI.toast('Tu es maintenant "' + LV[level(r.p)] + '" avec ' + e.name + ' !', 'quest'); U.sfx('win'); }
  return g;
};
G.relBump = (e, amt) => { if (!e || e.kind === 'cop' || e.kind === 'animal') return; const r = rel(e); r.p = Math.max(0, r.p + amt); if (r.lover && amt <= -20) { r.lover = 0; r.married = 0; } };
G.relChoices = (e, ch) => {
  if (e.kind === 'cop') return;
  const i = ch.findIndex(c => c.label === 'Au revoir'); if (i >= 0) ch.splice(i, 1);
  ch.push({ label: 'Discuter', fn: () => L.panel(e) });
  ch.push({ label: 'Au revoir' });
};

let pst = null; // état du panneau de relation
L.panel = e => {
  pst = { e, msg: pick(['Que veux-tu faire ?', 'Je t\'écoute.', 'Alors, quoi de neuf ?']), gift: false };
  e.talk = 6; E.faceTo(e, RG.P.x, RG.P.y);
  const portrait = () => { const cv = document.getElementById('rl-port'); if (!cv) return; const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, 90, 160); const ap = e.ap || (e.def && e.def.ap); if (ap) g.drawImage(Sp.char(ap, 'down', 0, false), 0, 0, 90, 160); };
  UI.modal({
    title: 'Relation : ' + e.name, cls: 'rel',
    render: () => {
      const r = rel(e), lv = level(r.p), nx = LVP[Math.min(5, lv + 1)], pr = lv >= 4 ? 1 : (r.p - LVP[lv]) / (nx - LVP[lv]);
      const guest = e.guest && S.guest;
      let h = '<div class="av"><div class="avl"><canvas id="rl-port" width="90" height="160" style="width:90px;height:160px"></canvas></div><div class="avr">' +
        '<h3 class="rn2">' + esc(e.name) + (e.role ? ' <span class="tag">' + esc(e.role) + '</span>' : '') + '</h3>' +
        '<div class="rbar"><div style="width:' + Math.round(pr * 100) + '%"></div></div>' +
        '<div class="muted">' + esc(statusLabel(r)) + ' - ' + Math.floor(r.p) + ' pts' + (r.lover ? ' - amoureux' : '') + '</div>' +
        '<div class="rmsg">' + esc(pst.msg) + '</div>';
      if (pst.gift) {
        const items = Object.keys(S.inv).filter(k => S.inv[k] > 0 && D.ITEMS[k] && (D.ITEMS[k].g || D.ITEMS[k].k === 'food' || D.ITEMS[k].k === 'drink'));
        h += '<h4>Offrir quoi ?</h4><div class="brow">' + (items.length ? items.map(k => '<button data-a="give" data-i="' + k + '">' + Ic.img(k, 'ic') + ' x' + S.inv[k] + '</button>').join('') : '<span class="muted">Tu n\'as rien à offrir (cadeaux à la boutique).</span>') + '</div><div class="brow"><button data-a="back">Retour</button></div>';
      } else {
        h += '<div class="brow">' +
          '<button data-a="chat">Bavarder</button>' +
          (lv >= 1 ? '<button data-a="perso">Question perso</button>' : '') +
          '<button data-a="joke">Blague</button>' +
          '<button data-a="giftmenu">Offrir un cadeau</button>' +
          (lv >= 2 ? '<button data-a="time">Passer du temps (1 h)</button>' : '') +
          (lv >= 3 && !r.lover ? '<button data-a="flirt">Draguer</button>' : '') +
          (r.lover ? '<button data-a="kiss">Câlin</button>' : '') +
          (r.lover && !guest ? '<button data-a="invite">Inviter chez moi</button>' : '') +
          (r.lover && !r.married && S.inv.bague > 0 && r.p >= 150 ? '<button data-a="propose" class="go">Demander en mariage</button>' : '') +
          (guest ? '<button data-a="night" class="go">Passer la nuit ensemble</button><button data-a="leave">Raccompagner</button>' : '') +
          '</div>';
      }
      return h + '</div></div>';
    },
    after: portrait,
    onAction: (a, b, m) => {
      const r = rel(e);
      const say = t => { pst.msg = t; };
      switch (a) {
        case 'chat': L.gain(e, 3); say(pick(D.SOCIAL.chat)); G.event('bot'); break;
        case 'perso': L.gain(e, 4); say(pick(D.SOCIAL.perso)); break;
        case 'joke': if (Math.random() < 0.6) { L.gain(e, 5); say(e.name + ' éclate de rire : « ' + pick(D.SOCIAL.joke) + ' »'); } else { L.gain(e, -1); say(e.name + ' fait une petite grimace. La blague n\'a pas pris.'); } break;
        case 'giftmenu': pst.gift = true; break;
        case 'back': pst.gift = false; break;
        case 'give': {
          const k = b.dataset.i, it = D.ITEMS[k]; if (!(S.inv[k] > 0)) break;
          S.inv[k]--; UI.hotbarDirty && UI.hotbarDirty();
          const g = it.g || (it.k === 'food' || it.k === 'drink' ? 2 : 1);
          L.gain(e, g); say(g >= 8 ? e.name + ' est ravi(e) ! « Merci, c\'est adorable ! »' : e.name + ' te remercie : « C\'est gentil. »'); U.sfx('win'); pst.gift = false; break;
        }
        case 'time': UI.closeModal(); L.gain(e, 6); S.fun = Math.min(100, S.fun + 8); L.pass(60, { fun: 14 }, 'Vous avez passé un bon moment avec ' + e.name + '.'); return;
        case 'flirt': {
          const chance = U.clamp((r.p - 90) / 90 + 0.25, 0.1, 0.9);
          if (r.fd === S.day) { say('« Laisse-moi un peu de temps... on en reparle demain. »'); break; }
          r.fd = S.day;
          if (Math.random() < chance) { r.lover = 1; UI.banner('Vous sortez ensemble !', e.name); U.sfx('win'); say('« Oui... moi aussi, j\'ai des sentiments pour toi. »'); }
          else { L.gain(e, -3); say(pick(D.SOCIAL.lovefail)); }
          break;
        }
        case 'kiss': L.gain(e, 4); say(e.name + ' te serre dans ses bras. « Je suis bien avec toi. »'); G.floater(e.x, e.y - 34, '<3', '#ff6aa0'); break;
        case 'invite': {
          UI.closeModal();
          S.guest = { name: e.name, ap: e.ap, key: keyOf(e), female: e.female };
          const hm = W.get('home'); G.go('home', hm.spawn.x, hm.spawn.y, 'up');
          return;
        }
        case 'leave': UI.closeModal(); L.removeGuest(); UI.toast(e.name + ' repart chez soi.'); return;
        case 'propose':
          if (r.p >= 150) { S.inv.bague--; r.married = 1; r.lover = 1; UI.closeModal(); UI.banner('Vous êtes mariés !', e.name); U.sfx('win'); UI.hotbarDirty && UI.hotbarDirty(); return; }
          break;
        case 'night': UI.closeModal(); L.night(e); return;
      }
      m.refresh();
    }
  });
};

/* invités, nuit, grossesse, enfants */
L.removeGuest = () => { S.guest = null; const m = W.get('home'); if (m) m.ents = m.ents.filter(x => !x.guest); };
L.night = e => {
  const r = rel(e);
  UI.say(e.name, ['La soirée est douce... vous restez longtemps à discuter, à rire, à vous rapprocher.', 'Puis la nuit tombe sur la maison.'], [], () => {
    L.gain(e, 10);
    L.sleep(() => {
      L.removeGuest();
      const kids = S.kids.length + (S.preg ? 1 : 0);
      const chance = r.married ? 0.7 : 0.5;
      if (!S.preg && kids < 4 && Math.random() < chance) {
        S.preg = { key: keyOf(e), name: e.name, due: S.abs + 1440 * 2 };
        UI.say(e.name, ['J\'ai une grande nouvelle... nous allons avoir un bébé !', 'Il devrait arriver dans quelques jours.'], [], () => { UI.banner('Un bébé est en route !', e.name); });
      } else UI.toast(e.name + ' est reparti(e) ce matin. Quelle belle nuit.', 'ok');
    });
  });
};
L.birth = () => {
  const p = S.preg; S.preg = null;
  UI.say('Naissance', ['Le bébé est né, en pleine santé ! ' + p.name + ' est aux anges.'], [], () => {
    UI.ask('Prénom du bébé', 'Bébé', nm => {
      S.kids.push({ name: nm, born: S.abs, parent: p.name, boy: Math.random() < 0.5, seed: Math.floor(Math.random() * 1e6) });
      UI.banner('Bienvenue, ' + nm + ' !', 'Il vous attend à la maison');
      L.enter('home', true); G.save();
    });
  });
};
const kidAge = k => Math.floor((S.abs - k.born) / 1440);
const kidAp = k => { const a = Sp.randomAp(U.rng(k.seed)); a.hat = 0; a.glasses = 0; a.hair = k.boy ? 0 : 3; a.shirt = k.boy ? '#4b78c8' : '#f48fb1'; return a; };
L.enter = (name, quiet) => {
  if (name !== 'home') { if (S.guest) L.removeGuest(); return; }
  const m = W.get('home'); if (!m) return;
  m.ents = m.ents.filter(x => !x.kid && !x.guest);
  const rnd = Math.random;
  const spot = () => { for (let k = 0; k < 60; k++) { const tx = 2 + Math.floor(rnd() * (m.w - 4)), ty = 3 + Math.floor(rnd() * (m.h - 5)); if (!m.solid[ty * m.w + tx]) return { x: tx, y: ty }; } return { x: 4, y: 4 }; };
  S.kids.forEach(k => {
    const s = spot(), e = E.spawnWander(m, s.x, s.y, 3, rnd);
    e.name = k.name; e.ap = kidAp(k); e.kid = true; e.baby = kidAge(k) < 3; e.kidRef = k; e.indoor = true; e.spd = e.baby ? 0 : 14; e.ptype = e.ptype;
  });
  if (S.guest) { const s = spot(), e = E.spawnWander(m, s.x, s.y, 3, rnd); e.name = S.guest.name; e.ap = S.guest.ap; e.female = S.guest.female; e.guest = true; e.indoor = true; e.spd = 10; }
};
G.lifeEnter = L.enter;
G.kidTalk = e => {
  const k = e.kidRef, age = kidAge(k);
  e.talk = 4;
  UI.say(k.name, [e.baby ? (k.name + ' gazouille en te tendant les bras.') : pick(['Papa ! Maman ! On joue ?', 'J\'ai fait un dessin pour toi !', 'Regarde ce que je sais faire !', 'J\'ai faim...'])], [
    { label: 'Jouer (30 min)', fn: () => L.pass(30, { fun: 18 }, 'Vous avez bien joué avec ' + k.name + '.') },
    { label: 'Câliner', fn: () => { S.fun = Math.min(100, S.fun + 5); G.floater(e.x, e.y - 28, '<3', '#ff6aa0'); U.sfx('win'); } },
    { label: 'Nourrir', fn: () => { const f = Object.keys(S.inv).find(i => S.inv[i] > 0 && D.ITEMS[i].k === 'food'); if (!f) { UI.toast('Tu n\'as rien à donner à manger.', 'err'); return; } S.inv[f]--; UI.hotbarDirty && UI.hotbarDirty(); UI.toast(k.name + ' mange avec appétit.', 'ok'); } },
    { label: 'Au revoir' }]);
};

/* liste des relations */
L.friends = () => {
  UI.modal({
    title: 'Mes relations', cls: 'rel',
    render: () => {
      const arr = Object.keys(S.rel).map(k => S.rel[k]).filter(r => r.p >= 1 || r.lover).sort((a, b) => b.p - a.p);
      let h = '';
      if (S.preg) h += '<div class="q"><b>Un bébé est attendu avec ' + esc(S.preg.name) + '.</b></div>';
      if (S.kids.length) h += '<h4>Enfants</h4><div class="list">' + S.kids.map(k => '<div class="row"><div class="rn"><b>' + esc(k.name) + '</b><small>' + (kidAge(k) < 3 ? 'Bébé' : 'Enfant') + ' de ' + esc(k.parent) + ' - ' + kidAge(k) + ' jours</small></div></div>').join('') + '</div>';
      h += '<h4>Amis et connaissances</h4>';
      if (!arr.length) return h + '<p class="muted">Tu ne connais encore personne. Va sur la place du village et parle aux gens (E), puis choisis « Discuter ».</p>';
      h += '<div class="list">' + arr.map(r => '<div class="row"><div class="rn"><b>' + esc(r.n) + '</b><small>' + esc(statusLabel(r)) + '</small></div><div class="rbar sm"><div style="width:' + Math.round(Math.min(1, r.p / 200) * 100) + '%"></div></div></div>').join('') + '</div>';
      return h;
    }
  });
};

/* ------------------------------------------------------------------ */
/*  Meubles : boutique, aménagement, placement                         */
/* ------------------------------------------------------------------ */
const fcache = {};
L.furnIcon = id => {
  if (fcache[id]) return fcache[id];
  const F = D.FURN[id], cv = U.mk(F.w * 16, F.h * 16), c = cv.getContext('2d');
  Sp.prop(c, F.k, 0, 0, F.w, F.h, F.o);
  return (fcache[id] = cv);
};
L.furnImg = id => { const F = D.FURN[id], cv = L.furnIcon(id); return '<img class="fi" src="' + cv.toDataURL() + '" style="width:' + (cv.width * 2) + 'px;height:' + (cv.height * 2) + 'px" alt="">'; };
G.furnShop = () => {
  UI.modal({
    title: 'Meubles & Cie', cls: 'wide',
    render: () => {
      let h = '<div class="money">Argent : <b>' + money(S.money) + '</b></div><p class="muted">Les meubles achetés vont dans ton stock. Chez toi, ouvre « Aménager » pour les poser.</p><div class="list">';
      for (const id of Object.keys(D.FURN)) {
        const F = D.FURN[id];
        h += '<div class="row">' + L.furnImg(id) + '<div class="rn"><b>' + esc(F.n) + '</b>' + (S.furnInv[id] ? ' <span class="tag">stock : ' + S.furnInv[id] + '</span>' : '') + '<small>' + esc(F.d) + '</small></div><div class="rp">' + money(F.p) + '</div><button data-a="buy" data-i="' + id + '">Acheter</button></div>';
      }
      return h + '</div>';
    },
    onAction: (a, b, m) => { if (a === 'buy') { const F = D.FURN[b.dataset.i]; if (pay(F.p)) { S.furnInv[b.dataset.i] = (S.furnInv[b.dataset.i] || 0) + 1; U.sfx('buy'); UI.toast(F.n + ' acheté (en stock).', 'ok'); m.refresh(); } } }
  });
};

const size = () => D.HOME_SIZES[S.home.size || 0];
function fits(id, x, y, ignore) {
  const F = D.FURN[id], sz = size(), dx = Math.floor(sz.w / 2);
  if (x < 1 || y < 2 || x + F.w > sz.w - 1 || y + F.h > sz.h - 1) return false;
  if (F.fn && y + F.h > sz.h - 2) return false;
  if (!F.flat) {
    for (let j = 0; j < F.h; j++) for (let i = 0; i < F.w; i++) { const tx = x + i, ty = y + j; if (tx === dx && ty >= sz.h - 3) return false; }
  }
  for (let k = 0; k < S.furn.length; k++) {
    if (k === ignore) continue; const f = S.furn[k], O = D.FURN[f.id]; if (!O) continue;
    if (F.flat !== O.flat && (F.flat || O.flat)) continue; // tapis sous les meubles
    if (x < f.x + O.w && x + F.w > f.x && y < f.y + O.h && y + F.h > f.y) return false;
  }
  return true;
}
L.rebuild = () => { W.rebuildHome(); L.enter('home', true); };
L.build = () => {
  let tab = 'inv';
  const tabs = [['inv', 'Stock'], ['placed', 'Posés'], ['deco', 'Décor'], ['size', 'Agrandir']];
  UI.modal({
    title: 'Aménager ma maison', cls: 'wide build',
    render: () => {
      let h = '<div class="brow">' + tabs.map(t => '<button data-a="tab" data-i="' + t[0] + '"' + (tab === t[0] ? ' class="go"' : '') + '>' + t[1] + '</button>').join('') + '</div><div class="money">Argent : <b>' + money(S.money) + '</b></div>';
      if (tab === 'inv') {
        const ids = Object.keys(S.furnInv).filter(k => S.furnInv[k] > 0);
        h += ids.length ? '<div class="list">' + ids.map(id => '<div class="row">' + L.furnImg(id) + '<div class="rn"><b>' + esc(D.FURN[id].n) + '</b> x' + S.furnInv[id] + '</div><button class="go" data-a="place" data-i="' + id + '">Placer</button></div>').join('') + '</div>' : '<p class="muted">Ton stock est vide. Achète des meubles chez Meubles & Cie (rue du nord).</p>';
      } else if (tab === 'placed') {
        h += S.furn.length ? '<div class="list">' + S.furn.map((f, i) => '<div class="row">' + L.furnImg(f.id) + '<div class="rn"><b>' + esc(D.FURN[f.id].n) + '</b></div><button data-a="store" data-i="' + i + '">Ranger</button></div>').join('') + '</div>' : '<p class="muted">Rien n\'est posé.</p>';
      } else if (tab === 'deco') {
        h += '<h4>Murs (50 $)</h4><div class="sw">' + D.WALLS.map(c => '<button class="c' + (S.home.wall === c ? ' sel' : '') + '" style="background:' + c + '" data-a="wall" data-v="' + c + '"></button>').join('') + '</div>' +
          '<h4>Sol (80 $)</h4><div class="brow">' + D.FLOORS.map((f, i) => '<button data-a="floor" data-i="' + i + '"' + (S.home.floor === i ? ' class="go"' : '') + '>' + f.n + '</button>').join('') + '</div>';
      } else {
        h += '<div class="list">' + D.HOME_SIZES.map(z => '<div class="row"><div class="rn"><b>' + z.n + '</b><small>' + z.w + ' x ' + z.h + ' cases</small></div><div class="rp">' + (z.p ? money(z.p) : '-') + '</div>' + (z.id === (S.home.size || 0) ? '<span class="tag">Actuelle</span>' : z.id > (S.home.size || 0) ? '<button data-a="size" data-i="' + z.id + '">Acheter</button>' : '') + '</div>').join('') + '</div>';
      }
      return h;
    },
    onAction: (a, b, m) => {
      if (a === 'tab') tab = b.dataset.i;
      else if (a === 'place') { UI.closeModal(); L.startPlace(b.dataset.i); return; }
      else if (a === 'store') { const f = S.furn.splice(+b.dataset.i, 1)[0]; S.furnInv[f.id] = (S.furnInv[f.id] || 0) + 1; L.rebuild(); }
      else if (a === 'wall') { if (S.home.wall !== b.dataset.v && pay(50)) { S.home.wall = b.dataset.v; L.rebuild(); } }
      else if (a === 'floor') { const i = +b.dataset.i; if (S.home.floor !== i && pay(80)) { S.home.floor = i; L.rebuild(); } }
      else if (a === 'size') {
        const z = D.HOME_SIZES[+b.dataset.i];
        if (pay(z.p)) { S.home.size = z.id; for (let i = S.furn.length - 1; i >= 0; i--) { const f = S.furn[i], g = S.furn.splice(i, 1)[0]; if (fits(g.id, g.x, g.y, -1)) S.furn.splice(i, 0, g); else S.furnInv[g.id] = (S.furnInv[g.id] || 0) + 1; } U.sfx('buy'); UI.toast('Ta maison est maintenant : ' + z.n + ' !', 'ok'); L.rebuild(); }
      }
      m.refresh();
    }
  });
};
G.openBuild = L.build;
L.startPlace = id => { C.place = { id, tx: Math.floor(RG.P.x / T), ty: Math.floor(RG.P.y / T) - 1, ok: false }; L.placeMove(C.place.tx, C.place.ty); };
L.placeMove = (tx, ty) => { const p = C.place; if (!p) return; p.tx = tx; p.ty = ty; p.ok = fits(p.id, tx, ty, -1); };
L.placeClick = () => {
  const p = C.place; if (!p) return;
  if (!p.ok) { UI.toast('Impossible de poser ici.', 'err'); U.sfx('err'); return; }
  S.furn.push({ id: p.id, x: p.tx, y: p.ty }); S.furnInv[p.id]--; U.sfx('buy');
  const id = p.id; if (!(S.furnInv[id] > 0)) C.place = null;
  L.rebuild();
  if (C.place) L.placeMove(p.tx, p.ty); else L.build();
};
L.cancelPlace = () => { C.place = null; UI.setPrompt(null); L.build(); };
L.drawGhost = (ctx, camX, camY) => {
  const p = C.place; if (!p) return;
  const F = D.FURN[p.id], x = p.tx * T - camX, y = p.ty * T - camY;
  ctx.globalAlpha = 0.65; ctx.drawImage(L.furnIcon(p.id), x, y); ctx.globalAlpha = 1;
  ctx.fillStyle = p.ok ? 'rgba(80,220,100,0.35)' : 'rgba(230,70,60,0.4)'; ctx.fillRect(x, y, F.w * T, F.h * T);
  ctx.strokeStyle = p.ok ? '#6fff8a' : '#ff6a5a'; ctx.strokeRect(x + 0.5, y + 0.5, F.w * T - 1, F.h * T - 1);
};

/* enveloppes autour des fonctions du jeu */
const oldTarget = G.updateTarget, oldInteract = G.interact;
G.updateTarget = () => { if (C.place) { C.target = null; UI.setPrompt('Clic : poser ' + D.FURN[C.place.id].n + '  -  Échap : annuler'); return; } oldTarget(); };
G.interact = () => { if (C.place) { L.placeClick(); return; } oldInteract(); };

/* mise à jour continue */
L.update = dt => {
  const b = document.getElementById('btn-build'); if (b) b.style.display = (C.cur && C.cur.name === 'home' && !C.place) ? '' : 'none';
  if (S.guest && C.cur && C.cur.name !== 'home' && C.fade.dir === 0) L.removeGuest();
  if (S.preg && S.abs >= S.preg.due && C.mode === 'play' && !UI.isModal() && !UI.dialogOpen() && C.fade.dir === 0 && !S.jail) L.birth();
};
})();
