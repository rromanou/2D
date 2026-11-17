(() => {
'use strict';
const RG = window.RG, U = RG.U, UI = RG.UI, D = RG.Data, E = RG.Ent, W = RG.World, Sp = RG.Sp, T = RG.T, G = RG.Game, C = RG.core, S = RG.S, L = RG.Life, P = RG.P;
const esc = UI.esc, money = U.money, X = L.X;
const pick = a => a[Math.floor(Math.random() * a.length)];
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const NEEDS = ['hunger', 'thirst', 'sleep', 'fun', 'bladder', 'hyg', 'hp', 'stamina'];

/* ================================================================== */
/*  Mini-jeux génériques                                               */
/* ================================================================== */
let mg = null;
const mgClose = () => { if (mg && mg.timer) clearInterval(mg.timer); mg = null; };
// Jeu 1 : quiz (une question à choix)
const QUIZ = [
  ['Capitale du Canada ?', 'Ottawa', ['Toronto', 'Montréal', 'Québec']], ['Combien de côtés a un hexagone ?', '6', ['5', '7', '8']], ['Quelle planète est la plus proche du Soleil ?', 'Mercure', ['Vénus', 'Mars', 'Terre']],
  ['Le plus grand océan ?', 'Pacifique', ['Atlantique', 'Indien', 'Arctique']], ['7 x 8 ?', '56', ['54', '48', '64']], ['Quel animal est le roi de la jungle (dit-on) ?', 'Le lion', ['Le tigre', 'L\'ours', 'Le loup']],
  ['Combien de jours dans une semaine ?', '7', ['5', '6', '8']], ['Quel métal est liquide à température ambiante ?', 'Mercure', ['Fer', 'Cuivre', 'Or']], ['Auteur des « Misérables » ?', 'Victor Hugo', ['Zola', 'Molière', 'Balzac']],
  ['Quelle langue parle-t-on au Québec ?', 'Français', ['Espagnol', 'Italien', 'Allemand']], ['Un triangle a combien d\'angles ?', '3', ['2', '4', '5']], ['Quel gaz respire-t-on ?', 'Oxygène', ['Hélium', 'Azote pur', 'Hydrogène']]
];
const ANA = ['MAISON', 'FROMAGE', 'JARDIN', 'CHATEAU', 'BATEAU', 'MONTAGNE', 'POISSON', 'LUMIERE', 'FENETRE', 'VILLAGE', 'SOLEIL', 'RIVIERE'];
function gameQuiz(o) {
  const qs = shuffle(o.qs || QUIZ).slice(0, o.n || 3); let i = 0, ok = 0, note = '';
  UI.modal({ title: o.title, cls: 'mini', locked: true, kind: 'mg',
    render: () => {
      if (i >= qs.length) return '<p>' + ok + ' bonne(s) réponse(s) sur ' + qs.length + '.</p><div class="brow"><button class="go" data-a="end">Terminer</button></div>';
      const q = qs[i], opts = q._o || (q._o = shuffle([q[1]].concat(q[2])));
      return '<p>' + esc(q[0]) + '</p><div class="brow">' + opts.map(x => '<button data-a="ans" data-v="' + esc(x) + '">' + esc(x) + '</button>').join('') + '</div><div class="muted">Question ' + (i + 1) + ' / ' + qs.length + (note ? ' - ' + note : '') + '</div>';
    },
    onAction: (a, b, m) => { if (a === 'ans') { if (b.dataset.v === qs[i][1]) { ok++; note = 'Bien !'; U.sfx('coin'); } else { note = 'Raté...'; U.sfx('err'); } i++; m.refresh(); } else if (a === 'end') { UI.closeModal(); o.done(ok, qs.length); } },
    onClose: () => {} });
}
function gameAnagram(o) {
  let ok = 0, r = 0; const rounds = 3; let cur = null, note = '';
  const nxt = () => { const w = pick(ANA), sc = shuffle(w.split('')).join(''); const others = shuffle(ANA.filter(x => x !== w)).slice(0, 3); cur = { w, sc: sc === w ? w.split('').reverse().join('') : sc, opts: shuffle([w].concat(others)) }; };
  nxt();
  UI.modal({ title: o.title, cls: 'mini', locked: true, kind: 'mg',
    render: () => r >= rounds ? '<p>' + ok + ' / ' + rounds + ' mots trouvés.</p><div class="brow"><button class="go" data-a="end">Terminer</button></div>' :
      '<p>Quel mot se cache dans <b>' + cur.sc + '</b> ?</div></p><div class="brow">' + cur.opts.map(x => '<button data-a="ans" data-v="' + x + '">' + x + '</button>').join('') + '</div><div class="muted">' + (r + 1) + ' / ' + rounds + (note ? ' - ' + note : '') + '</div>',
    onAction: (a, b, m) => { if (a === 'ans') { if (b.dataset.v === cur.w) { ok++; note = 'Bien !'; U.sfx('coin'); } else { note = 'Raté...'; U.sfx('err'); } r++; nxt(); m.refresh(); } else if (a === 'end') { UI.closeModal(); o.done(ok, rounds); } } });
}
// Jeu 2 : réflexes (cliquer sur la case allumée)
function gameReflex(o) {
  const rounds = 8; let r = 0, ok = 0, lit = -1, t = 0;
  const step = m => { lit = Math.floor(Math.random() * 6); t = 0; if (m) m.refresh(); };
  UI.modal({ title: o.title, cls: 'mini', locked: true, kind: 'mg',
    render: () => r >= rounds ? '<p>' + ok + ' / ' + rounds + ' touches.</p><div class="brow"><button class="go" data-a="end">Terminer</button></div>' :
      '<p>Clique sur la case allumée avant qu\'elle ne change !</p><div class="brow">' + [0, 1, 2, 3, 4, 5].map(i => '<button data-a="c" data-i="' + i + '" style="width:64px;height:48px;' + (i === lit ? 'background:#ffd54f' : '') + '">' + (i === lit ? 'OK' : '') + '</button>').join('') + '</div><div class="muted">' + (r + 1) + ' / ' + rounds + ' - Réussis : ' + ok + '</div>',
    onAction: (a, b, m) => { if (a === 'c') { if (+b.dataset.i === lit) { ok++; U.sfx('coin'); } else U.sfx('err'); r++; if (r < rounds) step(); m.refresh(); } else if (a === 'end') { mgClose(); UI.closeModal(); o.done(ok, rounds); } } });
  step();
  mg = { timer: setInterval(() => { const m = UI.currentModal(); if (!m || m.kind !== 'mg' || r >= rounds) return; t += 0.1; if (t > 1.3) { r++; if (r < rounds) step(m); else m.refresh(); } }, 100) };
}
// Jeu 3 : mémoire (Simon)
function gameSimon(o) {
  const cols = ['#c8503f', '#4b78c8', '#4fb04f', '#e8c030'], len = o.len || 4; let seq = [], pos = 0, show = -1, phase = 'show', lvl = 1;
  const play = m => { seq.push(Math.floor(Math.random() * 4)); let k = 0; phase = 'show'; pos = 0; mg.timer && clearInterval(mg.timer); mg.timer = setInterval(() => { if (k < seq.length * 2) { show = k % 2 === 0 ? seq[k >> 1] : -1; if (show >= 0) U.sfx('click'); } else { show = -1; phase = 'input'; clearInterval(mg.timer); mg.timer = null; } k++; const md = UI.currentModal(); if (md && md.refresh) md.refresh(); }, 420); };
  mg = {};
  UI.modal({ title: o.title, cls: 'mini', locked: true, kind: 'mg',
    render: () => (phase === 'end' ? '<p>Niveau atteint : ' + (lvl - 1) + ' / ' + len + '</p><div class="brow"><button class="go" data-a="end">Terminer</button></div>' :
      '<p>' + (phase === 'show' ? 'Regarde la séquence...' : 'Répète la séquence.') + '</p><div class="brow">' + cols.map((c, i) => '<button data-a="s" data-i="' + i + '" style="width:64px;height:48px;background:' + c + ';opacity:' + (show === i ? 1 : 0.45) + '"></button>').join('') + '</div><div class="muted">Niveau ' + lvl + ' / ' + len + '</div>'),
    onAction: (a, b, m) => {
      if (a === 's' && phase === 'input') { const i = +b.dataset.i; U.sfx('click'); if (i === seq[pos]) { pos++; if (pos >= seq.length) { if (seq.length >= len) { lvl = len + 1; phase = 'end'; } else { lvl++; play(m); } } } else { phase = 'end'; U.sfx('err'); } m.refresh(); }
      else if (a === 'end') { mgClose(); UI.closeModal(); o.done(lvl - 1, len); } },
    onClose: () => mgClose() });
  play();
}
// Jeu 4 : ordre (cliquer dans le bon ordre)
function gameOrder(o) {
  const right = o.steps, sh = shuffle(right); let k = 0, errs = 0;
  UI.modal({ title: o.title, cls: 'mini', locked: true, kind: 'mg',
    render: () => k >= right.length ? '<p>Terminé' + (errs ? ' avec ' + errs + ' erreur(s)' : ' sans erreur') + '.</p><div class="brow"><button class="go" data-a="end">Terminer</button></div>' :
      '<p>' + esc(o.text) + '</p><div class="brow">' + sh.map(s => '<button data-a="o" data-v="' + esc(s) + '"' + (right.indexOf(s) < k ? ' disabled' : '') + '>' + esc(s) + '</button>').join('') + '</div><div class="muted">Étape ' + (k + 1) + ' / ' + right.length + '</div>',
    onAction: (a, b, m) => { if (a === 'o') { if (b.dataset.v === right[k]) { k++; U.sfx('coin'); } else { errs++; U.sfx('err'); } m.refresh(); } else if (a === 'end') { UI.closeModal(); o.done(Math.max(0, right.length - errs), right.length); } } });
}
// Jeu 5 : Snake (arcade)
function gameSnake(o) {
  let cv, ctx, snake, dir, food, score, alive, timer, nd;
  const N = 14, Z = 18;
  const reset = () => { snake = [{ x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 }]; dir = { x: 1, y: 0 }; nd = dir; score = 0; alive = true; spawn(); };
  const spawn = () => { do { food = { x: ri(0, N - 1), y: ri(0, N - 1) }; } while (snake.some(s => s.x === food.x && s.y === food.y)); };
  const draw = () => { if (!ctx) return; ctx.fillStyle = '#15151c'; ctx.fillRect(0, 0, N * Z, N * Z); ctx.fillStyle = '#e8503f'; ctx.fillRect(food.x * Z + 2, food.y * Z + 2, Z - 4, Z - 4); snake.forEach((s, i) => { ctx.fillStyle = i ? '#4fb04f' : '#8dff8d'; ctx.fillRect(s.x * Z + 1, s.y * Z + 1, Z - 2, Z - 2); }); };
  const tick = () => {
    if (!alive) return; dir = nd; const h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (h.x < 0 || h.y < 0 || h.x >= N || h.y >= N || snake.some(s => s.x === h.x && s.y === h.y)) { alive = false; U.sfx('err'); clearInterval(timer); const m = UI.currentModal(); if (m) m.refresh(); return; }
    snake.unshift(h); if (h.x === food.x && h.y === food.y) { score++; U.sfx('coin'); spawn(); } else snake.pop(); draw();
  };
  const key = e => { const mp = { ArrowLeft: [-1, 0], KeyA: [-1, 0], KeyQ: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0], ArrowUp: [0, -1], KeyW: [0, -1], KeyZ: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1] }[e.code]; if (mp && !(mp[0] === -dir.x && mp[1] === -dir.y)) { nd = { x: mp[0], y: mp[1] }; e.preventDefault(); e.stopPropagation(); } };
  reset();
  UI.modal({ title: o.title, cls: 'mini', locked: true, kind: 'mg',
    render: () => '<p>Mange les pommes (flèches ou ZQSD). Score : <b>' + score + '</b></p><canvas id="snk" width="' + N * Z + '" height="' + N * Z + '" style="width:' + N * Z + 'px;height:' + N * Z + 'px;border:3px solid #4a3426"></canvas><div class="brow">' + (alive ? '<button data-a="stop">Arrêter</button>' : '<button class="go" data-a="end">Terminer</button>') + '</div>',
    after: () => { cv = document.getElementById('snk'); ctx = cv && cv.getContext('2d'); draw(); },
    onAction: (a) => { if (a === 'stop') { alive = false; clearInterval(timer); } if (a === 'end' || a === 'stop') { removeEventListener('keydown', key, true); UI.closeModal(); o.done(score, 10); } },
    onClose: () => { clearInterval(timer); removeEventListener('keydown', key, true); } });
  addEventListener('keydown', key, true);
  timer = setInterval(tick, 130);
}
L.games = { quiz: gameQuiz, anagram: gameAnagram, reflex: gameReflex, simon: gameSimon, order: gameOrder, snake: gameSnake };

/* ================================================================== */
/*  Caissier : rendre la monnaie                                       */
/* ================================================================== */
G.cashierGame = () => {
  let n = 0, ok = 0, c = null, note = '';
  const newC = () => { const tot = ri(7, 38) + ri(0, 3) * 0.5, pay = [10, 20, 50].find(b => b >= tot + 1) || 50, ch = Math.round((pay - tot) * 2) / 2; const wr = new Set([ch]); while (wr.size < 4) { const d = pick([-3, -2, -1, -0.5, 0.5, 1, 2, 3, 5]); const v = ch + d; if (v > 0) wr.add(Math.round(v * 2) / 2); } c = { tot, pay, ch, opts: shuffle([...wr]) }; };
  newC();
  UI.modal({ title: 'Caisse', cls: 'mini cash', locked: true, kind: 'mg',
    render: () => n >= 5 ? '<p>' + ok + ' / 5 clients servis correctement.</p><div class="brow"><button class="go" data-a="end">Terminer</button></div>' :
      '<p>Client ' + (n + 1) + ' / 5</p><div class="big">Total : ' + c.tot.toFixed(2) + ' $<br>Payé : ' + c.pay.toFixed(2) + ' $</div><p>Combien rendre ?</p><div class="brow">' + c.opts.map(v => '<button data-a="a" data-v="' + v + '">' + v.toFixed(2) + ' $</button>').join('') + '</div><div class="muted">' + note + '</div>',
    onAction: (a, b, m) => { if (a === 'a') { if (+b.dataset.v === c.ch) { ok++; note = 'Juste !'; U.sfx('coin'); } else { note = 'Erreur de monnaie (' + c.ch.toFixed(2) + ' $).'; U.sfx('err'); } n++; if (n < 5) newC(); m.refresh(); } else if (a === 'end') { UI.closeModal(); if (ok >= 3) { for (let i = 0; i < ok; i++) G.payJob(ri(22, 34)); UI.toast(ok + ' clients servis.', 'ok'); } else UI.toast('Trop d\'erreurs : pas de paie.', 'err'); } } });
};

/* ================================================================== */
/*  Emplois supplémentaires + zones                                    */
/* ================================================================== */
const JOBZ = {
  serve: { job: 'serveur', go: () => gameOrder({ title: 'Service', text: 'Clique les étapes dans l\'ordre du service.', steps: ['Prendre la commande', 'Apporter l\'entrée', 'Servir le plat', 'Encaisser'], done: (ok, n) => { if (ok >= n - 1) UI.toast('Service réussi : ' + money(G.payJob(ri(26, 40))), 'ok'); else UI.toast('Clients mécontents.', 'err'); } }) },
  shelve: { job: 'biblio', go: () => { const bk = shuffle(['Zadig', 'Candide', 'Germinal', 'Madame Bovary', 'Notre-Dame de Paris']).slice(0, 4).sort((a, b) => a.localeCompare(b, 'fr')); gameOrder({ title: 'Rangement', text: 'Range les livres par ordre alphabétique.', steps: bk, done: (ok, n) => { if (ok >= n - 1) UI.toast('Rayon rangé : ' + money(G.payJob(ri(24, 36))), 'ok'); else UI.toast('Le rayon est en désordre.', 'err'); } }); } },
  tend: { job: 'barman', go: () => gameSimon({ title: 'Cocktail', len: 4, done: (lv, n) => { if (lv >= 3) UI.toast('Cocktail réussi : ' + money(G.payJob(ri(28, 46))), 'ok'); else UI.toast('Le client grimace.', 'err'); } }) }
};
const prevLZ = G.lifeZone;
G.lifeZone = z => {
  const j = JOBZ[z.action];
  if (j) { if (!S.job || S.job.id !== j.job) { UI.toast('Il faut être ' + D.JOBS[j.job].n.toLowerCase() + ' : passe au Centre d\'emploi.', 'err'); return; } j.go(); return; }
  if (z.action === 'gym') {
    const w = /poids/.test(z.label || '');
    if (S.hunger < 15) { UI.toast('Tu es trop affamé pour t\'entraîner.', 'err'); return; }
    if (S.money < 5) { UI.toast('Pas assez d\'argent.', 'err'); return; }
    S.money -= 5; S.hyg = Math.max(0, (S.hyg == null ? 100 : S.hyg) - 12);
    if (w) { S.muscle = Math.min(100, (S.muscle || 0) + 3); L.pass(45, { fun: 8, stamina: 25, fit: 1 }, 'Séance de musculation : muscles ' + Math.round(S.muscle) + ' / 100.'); G.event('muscle'); }
    else { S.fit = Math.min(60, (S.fit || 0) + 2); L.pass(45, { fun: 10, stamina: 40 }, 'Course : endurance ' + Math.round(S.fit) + ' / 60.'); }
    return;
  }
  if (z.action === 'arcade') {
    if (S.money < 2) { UI.toast('Pas assez d\'argent.', 'err'); return; }
    UI.say('Arcade', ['Quelle borne ?'], [
      { label: 'Snake (2 $)', fn: () => { S.money -= 2; gameSnake({ title: 'Snake', done: sc => { S.fun = Math.min(100, S.fun + 8 + sc); const p = sc >= 8 ? 15 + sc : 0; if (p) { G.gain(p); UI.toast('Score ' + sc + ' : ' + money(p) + ' de lots !', 'ok'); } else UI.toast('Score : ' + sc, 'ok'); } }); } },
      { label: 'Réflexes (2 $)', fn: () => { S.money -= 2; gameReflex({ title: 'Réflexes', done: ok => { S.fun = Math.min(100, S.fun + 4 + ok * 2); if (ok >= 7) { G.gain(20); UI.toast('Parfait ! 20 $ de lots.', 'ok'); } else UI.toast(ok + ' / 8', 'ok'); } }); } },
      { label: 'Mémoire (2 $)', fn: () => { S.money -= 2; gameSimon({ title: 'Mémoire', len: 6, done: lv => { S.fun = Math.min(100, S.fun + 4 + lv * 3); if (lv >= 6) { G.gain(25); UI.toast('Bravo ! 25 $ de lots.', 'ok'); } else UI.toast('Niveau ' + lv, 'ok'); } }); } },
      { label: 'Partir' }]);
    return;
  }
  prevLZ && prevLZ(z);
};

/* ================================================================== */
/*  Meubles : mini-jeux, toilettes, douche, bain                       */
/* ================================================================== */
const funGain = (n, msg) => () => { L.pass(25, { fun: 10 + n * 6 }, msg); };
const oldFA = L.furnAction;
L.furnAction = (fn, idx) => {
  switch (fn) {
    case 'tv': return gameQuiz({ title: 'Jeu télévisé', done: (ok, n) => { L.pass(30, { fun: 8 + ok * 8 }, 'Quiz télé : ' + ok + ' / ' + n + '.'); } });
    case 'console': return gameReflex({ title: 'Console', done: ok => { L.pass(30, { fun: 6 + ok * 4 }, 'Partie terminée : ' + ok + ' / 8.'); } });
    case 'sofa': return gameSimon({ title: 'Jeu de mémoire', len: 4, done: lv => { L.pass(25, { fun: 6 + lv * 4, sleep: 4 }, 'Niveau ' + lv + ' atteint, bien détendu.'); } });
    case 'piano': return gameSimon({ title: 'Piano', len: 5, done: lv => { L.pass(30, { fun: 8 + lv * 4 }, 'Belle mélodie : niveau ' + lv + '.'); } });
    case 'read': return gameAnagram({ title: 'Lecture & mots', done: ok => { L.pass(40, { fun: 8 + ok * 6, know: ok }, ok + ' / 3 mots trouvés.'); } });
    case 'cook': return (() => {
      const foods = Object.keys(S.inv).filter(k => S.inv[k] > 0 && D.ITEMS[k].k === 'food' && k !== 'platmaison'); let n = 0; foods.forEach(k => { n += S.inv[k]; });
      if (n < 2) { UI.toast('Il te faut au moins 2 aliments dans ton sac pour cuisiner.', 'err'); return; }
      gameOrder({ title: 'Cuisine', text: 'Prépare le plat dans le bon ordre.', steps: ['Laver', 'Couper', 'Cuire', 'Assaisonner', 'Servir'], done: (ok, tot) => {
        let need = 2; for (const k of foods) { while (need > 0 && S.inv[k] > 0) { S.inv[k]--; need--; } }
        UI.hotbarDirty && UI.hotbarDirty();
        if (ok >= tot - 1) { S.inv.platmaison = (S.inv.platmaison || 0) + 1; L.pass(25, { fun: 4 }, 'Plat maison réussi ! Il est dans ton sac.'); } else L.pass(25, { fun: 0 }, 'Le plat est raté... les ingrédients sont perdus.'); } });
    })();
    case 'door': return L.doorConfig(idx);
    case 'wc': if ((S.bladder == null ? 100 : S.bladder) > 85) { UI.toast('Tu n\'en as pas vraiment besoin.'); return; } S.bladder = 100; U.sfx('click'); return L.pass(5, {}, 'Ahh, ça soulage.');
    case 'shower': if (S.hyg > 90) { UI.toast('Tu es déjà propre.'); return; } S.hyg = 100; return L.pass(12, { fun: 3 }, 'Douche chaude : tu es tout propre.');
    case 'bath': S.hyg = 100; return L.pass(35, { fun: 20, stamina: 10 }, 'Bain relaxant : propre et détendu.');
  }
  return oldFA(fn, idx);
};

/* ================================================================== */
/*  Besoins supplémentaires (vessie, hygiène)                          */
/* ================================================================== */
const oldNeeds = L.needs;
L.needs = dt => {
  oldNeeds(dt);
  if (S.bladder == null) S.bladder = 90; if (S.hyg == null) S.hyg = 90;
  S.bladder = Math.max(0, S.bladder - 0.1 * dt); S.hyg = Math.max(0, S.hyg - 0.035 * dt);
  const warn = (k, v, msg) => { if (S[k] < v && !C['w' + k]) { C['w' + k] = 1; UI.toast(msg, 'err'); } else if (S[k] > v + 5) C['w' + k] = 0; };
  warn('bladder', 20, 'Envie pressante : va aux toilettes !'); warn('hyg', 18, 'Tu sens mauvais : prends une douche.');
  if (S.bladder <= 0) { S.bladder = 55; S.hyg = Math.max(0, S.hyg - 30); S.fun = Math.max(0, S.fun - 15); UI.toast('Oups... accident. Quelle honte !', 'err'); }
  famTick(dt);
};

/* ================================================================== */
/*  Famille : rôles, besoins autonomes, changement de personnage       */
/* ================================================================== */
const roleKid = k => 'kid:' + k.name;
const kidByRole = r => S.kids.find(k => roleKid(k) === r);
const famRoles = () => { const r = ['main']; if (S.partner) r.push('partner'); S.kids.forEach(k => r.push(roleKid(k))); return r; };
const roleName = r => r === 'main' ? (S.main ? S.main.name : S.name) : r === 'partner' ? S.partner.name : (kidByRole(r) || {}).name;
const roleStage = r => r.startsWith('kid:') ? X.kidStage(kidByRole(r)) : 3;
const roleAp = r => r === 'main' ? (S.main ? S.main.ap : S.ap) : r === 'partner' ? S.partner.ap : X.kidAp(kidByRole(r), roleStage(r));
/* ---- profils par personnage : besoins, muscles, inventaire, emploi, animaux, argent ---- */
const PKEYS = ['muscle', 'fit', 'know', 'inv', 'equip', 'job', 'jobxp', 'pets', 'followers'];
const isHouseRole = r => r === 'main' || r === 'partner';
const married = () => !!(S.partner && S.rel[S.partner.key] && S.rel[S.partner.key].married);
const shares = r => married() && isHouseRole(r);
const fresh = r => {
  const o = {}; NEEDS.forEach(k => { o[k] = 75; });
  Object.assign(o, { muscle: 0, fit: 0, know: 0, inv: r === 'partner' ? { pomme: 1 } : {}, equip: { weapon: null, mask: false, hand: null }, job: null, jobxp: {}, pets: [], followers: [], money: r === 'partner' ? 150 : 0 });
  return o;
};
const needsOf = r => r === S.role ? S : (S.fam[r] || (S.fam[r] = fresh(r)));
G.needsOf = needsOf;
// portefeuille d'un rôle inactif (le foyer = argent du personnage principal, partagé si marié)
const walletOwner = r => shares(r) ? (S.role === 'main' || (S.role === 'partner' && married()) ? S : needsOf('main')) : needsOf(r);
const spend = (r, a) => { const w = walletOwner(r); if (w.money >= a) { w.money -= a; return true; } return false; };
const earn = (r, a) => { walletOwner(r).money += a; };
G.walletOf = r => walletOwner(r);
function famTick(dt) {
  if (!S.fam) return;
  for (const r of famRoles()) {
    if (r === S.role) continue;
    const n = needsOf(r), st = roleStage(r), name = roleName(r), w = walletOwner(r);
    n.hunger = Math.max(0, n.hunger - 0.055 * dt); n.thirst = Math.max(0, n.thirst - 0.08 * dt); n.sleep = Math.max(0, n.sleep - 0.1 * dt);
    n.fun = Math.max(0, n.fun - 0.07 * dt); n.bladder = Math.max(0, n.bladder - 0.1 * dt); n.hyg = Math.max(0, n.hyg - 0.035 * dt);
    const auto = st >= 3 ? 'all' : st === 2 ? 'most' : 'none';
    if (r === 'main') { /* le principal en attente est autonome lui aussi */ }
    const sleepingNow = S.time / 60 >= 22 || S.time / 60 < 6.5;
    if (auto !== 'none' || r === 'main') {
      if (n.sleep < 22 && sleepingNow) n.sleep = 90; if (n.sleep > 0 && n.sleep < 90 && sleepingNow) n.sleep = Math.min(100, n.sleep + 0.5 * dt);
      if (n.bladder < 22) n.bladder = 100; if (n.hyg < 22) n.hyg = 100; if (n.fun < 22) n.fun += 35;
      if (n.hunger < 30 && spend(r, 6)) n.hunger = Math.min(100, n.hunger + 45);
      if (n.thirst < 30 && spend(r, 2)) n.thirst = Math.min(100, n.thirst + 50);
    } else if (auto === 'none' || auto === 'most') { /* géré par le joueur */ }
    if (st >= 2 && r.startsWith('kid:') && n.payDay !== S.day) { n.payDay = S.day; n.money = (n.money || 0) + (st === 3 ? 40 : 8); }
    if (st >= 2 && r.startsWith('kid:') && st === 2) { /* l'ado se nourrit seul s'il a de l'argent de poche */ }
    if (n.bladder <= 0) { n.bladder = 55; n.hyg = Math.max(0, n.hyg - 30); }
    if (n.hunger <= 0 || n.thirst <= 0) n.hp = Math.max(0, n.hp - 0.5 * dt); else if (n.hp < 100) n.hp = Math.min(100, n.hp + 0.05 * dt);
    if (n.hp <= 0) {
      if (r === 'partner' && st >= 3 && w.money < 6) { UI.banner(name + ' est décédé(e)', 'Faute de moyens pour se nourrir'); S.partner = null; delete S.fam.partner; const hm = W.get('home'); if (hm) hm.ents = hm.ents.filter(e => e.role !== 'partner'); }
      else { const fee = Math.min(w.money, 150); w.money -= fee; const keep = {}; PKEYS.concat(['money']).forEach(k => { keep[k] = n[k]; }); Object.assign(n, fresh(r), keep); n.hp = 60; UI.toast(name + ' a été hospitalisé(e) (' + money(fee) + ').', 'err'); }
    }
    if (!n.warned || S.abs - n.warned > 120) { if (st <= 2 && (n.hunger < 18 || n.thirst < 18)) { n.warned = S.abs; UI.toast(name + ' a besoin qu\'on s\'occupe de ' + (n.hunger < 18 ? 'son repas' : 'sa soif') + '.', 'err'); } }
  }
}
const spotIn = (m, rnd) => { rnd = rnd || Math.random; for (let k = 0; k < 80; k++) { const tx = 2 + Math.floor(rnd() * (m.w - 4)), ty = 3 + Math.floor(rnd() * (m.h - 5)); if (!m.solid[ty * m.w + tx]) return { x: tx, y: ty }; } return { x: 4, y: 4 }; };
const free = (m, x, y, near) => { // position libre (sans collision) la plus proche
  for (let r = 0; r <= 14; r++) for (let k = 0; k < (r ? 16 : 1); k++) {
    const a = k / 16 * Math.PI * 2, px = x + Math.cos(a) * r * 6, py = y + Math.sin(a) * r * 6;
    if (px > 12 && py > 12 && px < m.w * T - 12 && py < m.h * T - 6 && !W.hit(m, px, py, 5, 4)) return { x: px, y: py };
  }
  const t = spotIn(m); return { x: t.x * T + 8, y: t.y * T + 12 };
};
const homeFront = () => { const w = W.get('world'), h = w && w.houses.find(x => x.home); return h ? { x: h.front.x, y: h.front.y } : { x: 62 * T, y: 52 * T }; };
const mkRoleEnt = (m, role, nm, ap, female, extra, at) => {
  const e = E.spawnWander(m, 0, 0, 3, Math.random);
  const s = at || (() => { const t = spotIn(m); return { x: t.x * T + 8, y: t.y * T + 12 }; })();
  e.x = s.x; e.y = s.y; e.home = { x: e.x, y: e.y, r: 3 * T }; e.name = nm; e.ap = ap; e.female = female; e.role = role; e.indoor = true; e.spd = 10; Object.assign(e, extra); return e;
};
const apMus = (ap, role) => { const mu = (needsOf(role).muscle || 0); const t = mu >= 60 ? 2 : mu >= 25 ? 1 : 0; return t ? Object.assign({}, ap, { mus: t }) : ap; };
const findRoleEnt = role => { for (const n of Object.keys(W.maps)) { const e = (W.maps[n].ents || []).find(x => x.role === role); if (e) return { e, m: W.maps[n] }; } return null; };
L.enter = (name) => {
  if (name !== 'home') { if (S.guest) L.removeGuest(); L.purgePartner(); return; }
  const m = W.get('home'); if (!m) return;
  const prev = {}; m.ents.forEach(e => { if (e.role) prev[e.role] = { x: e.x, y: e.y }; });
  if (L.posOv) { Object.assign(prev, L.posOv); L.posOv = null; }
  const away = {}; // personnages qui sont dehors en journée : on ne les reconstruit pas ici
  const outW = W.get('world'); if (outW) outW.ents.forEach(e => { if (e.role) away[e.role] = 1; });
  m.ents = m.ents.filter(x => !x.role && !x.kid && !x.guest && !x.partner && !x.mainChar && x.kind !== 'pet');
  const at = r => prev[r] ? { x: prev[r].x, y: prev[r].y } : null;
  S.kids.forEach(k => { const r = roleKid(k); if (r === S.role || away[r]) return; const st = X.kidStage(k); mkRoleEnt(m, r, k.name, apMus(X.kidAp(k, st), r), !k.boy, { kid: true, stage: st, kscale: X.KSCALE[st], baby: st === 0, kidRef: k, spd: st === 0 ? 0 : 14 }, at(r)); });
  if (S.partner && S.role !== 'partner' && !away.partner) mkRoleEnt(m, 'partner', S.partner.name, apMus(S.partner.ap, 'partner'), S.partner.female, { partner: true }, at('partner'));
  if (S.role !== 'main' && S.main) {
    const me = mkRoleEnt(m, 'main', S.main.name, apMus(S.main.ap, 'main'), !!S.main.female, { mainChar: true, wait: true, spd: 0 }, at('main') || S.mainAt);
    (needsOf('main').pets || []).forEach((rec, i) => { const p = E.makePet(rec, me.x - 12 - i * 9, me.y + 3); p.static = true; m.ents.push(p); });
  }
  if (S.guest) { const s = spotIn(m), e = E.spawnWander(m, s.x, s.y, 3, Math.random); e.name = S.guest.name; e.ap = S.guest.ap; e.female = S.guest.female; e.guest = true; e.indoor = true; e.spd = 10; }
  applyDoors(); routine(true);
};
G.lifeEnter = L.enter;
L.switchTo = role => {
  if (!C.cur || C.cur.name !== 'home') { UI.toast('Reviens à la maison pour changer de personnage.', 'err'); return; }
  if (role === S.role) return;
  if (S.wanted > 0) { UI.toast('Impossible de changer de personnage quand on est recherché.', 'err'); return; }
  if (S.jail || C.fade.dir !== 0 || C.place) return;
  const m = W.get('home'), f = findRoleEnt(role); if (!f) { UI.toast('Cette personne n\'est pas à la maison.', 'err'); return; }
  const t = f.e, old = S.role, ox = P.x, oy = P.y;
  // 1. sauvegarde du personnage actuel
  const snap = {}; NEEDS.concat(PKEYS).forEach(k => { snap[k] = S[k]; }); snap.money = S.money; snap.payDay = (S.fam[old] || {}).payDay;
  if (old === 'main') { S.main = { name: S.name, ap: S.ap, female: !!S.female }; S.mainAt = { x: ox, y: oy }; }
  S.fam[old] = snap;
  const isH = r => r === 'main' || (r === 'partner' && married());
  const nn = Object.assign(fresh(role), S.fam[role] || {});
  NEEDS.concat(PKEYS).forEach(k => { S[k] = nn[k]; });
  if (isH(old) && isH(role)) { /* argent du foyer partagé : inchangé */ }
  else if (isH(old)) { S.fam.main = S.fam.main || fresh('main'); S.fam.main.money = S.money; S.money = nn.money || 0; }
  else if (isH(role)) { S.money = (S.fam.main || fresh('main')).money; }
  else S.money = nn.money || 0;
  delete S.fam[role];
  const posOv = {}; m.ents.forEach(e => { if (e.role) posOv[e.role] = { x: e.x, y: e.y }; });
  posOv[old] = { x: ox, y: oy }; delete posOv[role];
  S.role = role; S.name = roleName(role); S.ap = roleAp(role); S.pscale = role.startsWith('kid:') ? X.KSCALE[roleStage(role)] : 1;
  P.x = t.x; P.y = t.y;
  if (t.sleeping || W.hit(m, P.x, P.y, 5, 4)) { const fp = free(m, t.x, t.y + 18); P.x = fp.x; P.y = fp.y; }
  L.posOv = posOv; L.enter('home');
  if (G.syncPets) { G.syncPets(); G.placePets && G.placePets(); }
  U.sfx('win'); UI.toast('Tu contrôles maintenant ' + S.name + '.', 'ok'); famDirty = true; UI.hotbarDirty && UI.hotbarDirty();
};
let famDirty = true, famSig = '';
function famBar() {
  const box = document.getElementById('fam'); if (!box) return;
  const here = C.cur && C.cur.name === 'home' && C.mode === 'play' && (S.partner || S.kids.length), roles = here ? famRoles() : [];
  const sig = here ? roles.map(r => r + ':' + roleName(r) + ':' + (r === S.role) + ':' + (r.startsWith('kid:') ? X.kidStage(kidByRole(r)) : '')).join('|') : '';
  if (sig === famSig && !famDirty) return; famSig = sig; famDirty = false; box.innerHTML = '';
  if (!here) return;
  roles.forEach(r => {
    const d = document.createElement('div'); d.className = 'pf' + (r === S.role ? ' on' : ''); d.title = 'Contrôler ' + roleName(r);
    const cv = document.createElement('canvas'); cv.width = 16; cv.height = 14; const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    const ap = r === S.role ? S.ap : roleAp(r); g.drawImage(Sp.char(ap, 'down', 0, false), 0, 6, 16, 14, 0, 0, 16, 14);
    d.appendChild(cv); const sm = document.createElement('small'); sm.textContent = roleName(r); d.appendChild(sm);
    d.addEventListener('click', () => L.switchTo(r)); box.appendChild(d);
  });
}
// Panneau d'un enfant / du personnage en attente
const barsHtml = (n, keys) => '<div class="kbars">' + keys.map(([k, lab]) => '<div class="kb"><label>' + lab + '</label><div class="track"><div class="fill" style="width:' + Math.round(n[k]) + '%;background:' + (n[k] < 25 ? '#d84a3a' : '#6fbf5a') + '"></div></div></div>').join('') + '</div>';
const takeItem = kind => { const ids = Object.keys(S.inv).filter(i => S.inv[i] > 0 && D.ITEMS[i] && D.ITEMS[i].k === kind); ids.sort((a, b) => (D.ITEMS[b].h || D.ITEMS[b].t || 0) - (D.ITEMS[a].h || D.ITEMS[a].t || 0)); const id = ids[0]; if (!id) return null; S.inv[id]--; UI.hotbarDirty && UI.hotbarDirty(); return D.ITEMS[id]; };
G.kidTalk = e => {
  e.talk = 6;
  if (e.mainChar || !(e.kid && (S.role === 'main' || S.role === 'partner'))) { famTalk(e); return; }
  const k = e.kidRef, role = roleKid(k);
  UI.modal({ title: k.name + ' (' + X.STAGES[X.kidStage(k)] + ')', cls: 'rel',
    render: () => {
      const st = X.kidStage(k), n = needsOf(role), need = st <= 1 ? [['hunger', 'Faim'], ['thirst', 'Soif'], ['bladder', 'Toilettes'], ['hyg', 'Hygiène'], ['sleep', 'Sommeil'], ['fun', 'Détente']] : st === 2 ? [['hunger', 'Faim'], ['thirst', 'Soif']] : [];
      let h = need.length ? barsHtml(n, need) : '<p class="muted">' + esc(k.name) + ' se débrouille tout(e) seul(e).</p>';
      h += '<div class="brow">';
      if (st <= 2) h += '<button data-a="eat">Donner à manger</button><button data-a="drink">Donner à boire</button>';
      if (st <= 1) h += '<button data-a="wc">Toilettes / couche</button><button data-a="bath">Bain</button><button data-a="nap">Coucher (1 h)</button><button data-a="play">Jouer (30 min)</button><button data-a="hug">Câliner</button>';
      if (st === 1) h += '<button data-a="hw">Devoirs (45 min)</button>';
      if (st === 2) h += '<button data-a="chat">Discuter (30 min)</button><button data-a="pocket">Argent de poche (10 $)</button>';
      if (st === 3) h += '<button data-a="chat">Discuter (30 min)</button><button data-a="help">Demander un coup de main</button>';
      h += '<button class="go" data-a="ctl">Contrôler ' + esc(k.name) + '</button></div>';
      return h;
    },
    onAction: (a, b, m) => {
      const n = needsOf(role), say = t => UI.toast(t, 'ok');
      if (a === 'ctl') { UI.closeModal(); L.switchTo(role); return; }
      if (a === 'eat') { const it = takeItem('food'); if (!it) say('Tu n\'as rien à lui donner.'); else { n.hunger = Math.min(100, n.hunger + (it.h || 25) + 10); say(k.name + ' mange.'); } }
      else if (a === 'drink') { const it = takeItem('drink'); if (!it) say('Tu n\'as rien à boire à lui donner.'); else { n.thirst = Math.min(100, n.thirst + (it.t || 25) + 10); say(k.name + ' boit.'); } }
      else if (a === 'wc') { n.bladder = 100; say(k.name + ' est soulagé(e).'); }
      else if (a === 'bath') { n.hyg = 100; n.fun = Math.min(100, n.fun + 10); UI.closeModal(); L.pass(20, {}, k.name + ' est tout propre.'); return; }
      else if (a === 'nap') { n.sleep = Math.min(100, n.sleep + 60); UI.closeModal(); L.pass(60, {}, k.name + ' a bien dormi.'); return; }
      else if (a === 'play') { n.fun = Math.min(100, n.fun + 35); UI.closeModal(); L.pass(30, { fun: 14 }, 'Vous avez bien joué avec ' + k.name + '.'); return; }
      else if (a === 'hug') { n.fun = Math.min(100, n.fun + 8); S.fun = Math.min(100, S.fun + 5); G.floater(e.x, e.y - 28, '<3', '#ff6aa0'); U.sfx('win'); }
      else if (a === 'hw') { UI.closeModal(); L.pass(45, { fun: 4, know: 3 }, 'Devoirs terminés avec ' + k.name + '.'); return; }
      else if (a === 'chat') { UI.closeModal(); L.pass(30, { fun: 12 }, 'Belle discussion avec ' + k.name + '.'); return; }
      else if (a === 'pocket') { if (S.money < 10) say('Pas assez d\'argent.'); else { S.money -= 10; n.money = (n.money || 0) + 10; say(k.name + ' te remercie (argent de poche).'); } }
      else if (a === 'help') { if (k.help === S.day) say(k.name + ' t\'a déjà aidé aujourd\'hui.'); else { const give = Math.min(50, n.money || 0); if (give <= 0) say(k.name + ' n\'a pas d\'argent de côté.'); else { k.help = S.day; n.money -= give; S.money += give; U.sfx('coin'); say(k.name + ' te donne ' + give + ' $.'); } } }
      m.refresh();
    } });
};

/* naissance : le sexe est annoncé */
L.birth = () => {
  const p = S.preg; S.preg = null; const boy = Math.random() < 0.5;
  UI.say('Naissance', ['Le bébé est né, en pleine santé !', boy ? 'C\'est un garçon !' : 'C\'est une fille !', p.name + ' est aux anges.'], [], () => {
    UI.ask(boy ? 'Prénom du garçon' : 'Prénom de la fille', boy ? 'Léo' : 'Léa', nm => {
      nm = (nm || (boy ? 'Léo' : 'Léa')).trim() || (boy ? 'Léo' : 'Léa');
      S.kids.push({ name: nm, born: S.abs, parent: p.name, boy, seed: Math.floor(Math.random() * 1e6) });
      UI.banner('Bienvenue, ' + nm + ' !', (boy ? 'Un garçon' : 'Une fille') + ' qui vous attend à la maison');
      if (!S.partner) L.setPartner(p.key, p.name);
      G.event('birth'); famDirty = true; L.enter('home'); G.save();
    });
  });
};
L.wedding = e => {
  UI.say('Mariage', ['Devant le village réuni, vous échangez vos voeux.', e.name + ' te sourit : « Oui, pour la vie ! »', 'Les invités offrent 300 $ en cadeaux.'], [], () => {
    G.gain(300); G.event('wed'); if (!S.partner && e.kind !== 'static') { L.setPartner(X.keyOf(e), e.name); UI.toast(e.name + ' emménage avec toi.', 'ok'); famDirty = true; }
  });
};
// Divorce / séparation
const sep = (r, key) => {
  r.lover = 0; r.married = 0; r.p = Math.min(r.p, 25);
  if (S.partner && S.partner.key === key) {
    const p = S.partner; S.partner = null; delete S.fam.partner; const hm = W.get('home'); if (hm) hm.ents = hm.ents.filter(x => x.role !== 'partner');
    if (S.role === 'partner') { /* jamais : on ne contrôle plus */ }
    const pm = W.get('world'); if (pm) { const e = E.spawnWander(pm, 62, 52, 4, Math.random); e.name = p.name; e.ap = p.ap; e.female = p.female; }
  }
  famDirty = true;
};
G.divorceMenu = () => {
  const ms = Object.keys(S.rel).filter(k => S.rel[k].married || S.rel[k].lover);
  if (!ms.length) { UI.say('Juge Fortin', ['Vous n\'avez personne dont vous séparer.']); return; }
  UI.say('Juge Fortin', ['Qui souhaitez-vous quitter ? Un divorce coûte 400 $. Une simple séparation est gratuite.'], ms.slice(0, 3).map(k => ({ label: S.rel[k].n + (S.rel[k].married ? ' (divorce 400 $)' : ' (séparation)'), fn: () => {
    const r = S.rel[k]; if (r.married) { if (S.money < 400) { UI.toast('Pas assez d\'argent.', 'err'); return; } S.money -= 400; }
    sep(r, k); UI.banner(r.married === 0 ? 'Séparation prononcée' : 'Divorce prononcé', r.n); U.sfx('err');
  } })).concat([{ label: 'Annuler' }]));
};

/* ================================================================== */
/*  Panneau de relation : actions de conversation, suivre, jouer       */
/* ================================================================== */
const isFollower = e => (S.followers || []).some(f => f.name === e.name);
L.extraBtns = (e, r, lv, isP) => {
  let h = '';
  if (lv >= 1) h += '<button data-a="compl">Faire un compliment</button><button data-a="tease">Taquiner</button>';
  if (lv >= 2) h += '<button data-a="secret">Se confier</button><button data-a="advice">Demander un conseil</button>';
  if (lv >= 2 && !isP && e.kind === 'npc') h += '<button data-a="play">Jouer ensemble</button><button data-a="follow">' + (isFollower(e) ? 'Dire de rester ici' : 'Demander de me suivre') + '</button>';
  if (lv >= 3 && !isP) h += '<button data-a="loan">Emprunter 20 $</button>';
  if (r.lover && !r.married) h += '<button data-a="break" class="warn">Rompre</button>';
  return h;
};
L.extraAct = (a, b, e, say, r) => {
  const pst = L; const K = 'x_' + a;
  const once = (lim) => { r[K] = r[K] && r[K].d === S.day ? r[K] : { d: S.day, n: 0 }; r[K].n++; return r[K].n <= lim; };
  switch (a) {
    case 'compl': if (once(2)) { L.gain(e, 3); say(pick(['« Oh... merci, ça me touche vraiment ! »', '« Tu es adorable, toi. »', '« Je rougis... »'])); } else say('« Tu me l\'as déjà dit tout à l\'heure ! »'); return true;
    case 'tease': if (Math.random() < 0.6) { L.gain(e, 2); say('« Ha ha ! Tu vas voir ! » ' + e.name + ' rit.'); } else { L.gain(e, -2); say('« Pas drôle... »'); } return true;
    case 'secret': if (once(2)) { L.gain(e, 5); say(pick(['« Merci de me faire confiance. Moi aussi, j\'ai des secrets... »', '« Je ne le dirai à personne. »'])); } else say('« On en a déjà beaucoup parlé... »'); return true;
    case 'advice': { const tips = ['« Dors bien, mange bien : le reste suit. »', '« Un compte en banque, ça rassure. »', '« Le marché noir ? Évite. La prison, c\'est long. »', '« Les muscles, ça se travaille au gym. »', '« Une bonne amitié vaut de l\'or. »']; L.gain(e, 2); say(pick(tips)); return true; }
    case 'loan': if (r.loanD === S.day) say('« Pas deux fois dans la journée ! »'); else if (e.money != null && e.money < 20) say('« Désolé, je suis fauché(e)... »'); else { r.loanD = S.day; if (e.money != null) e.money -= 20; G.gain(20); L.gain(e, -1); say('« Tiens, 20 $. Rends-moi ça un jour ! »'); } return true;
    case 'follow': {
      S.followers = S.followers || [];
      if (isFollower(e)) { S.followers = S.followers.filter(f => f.name !== e.name); e.follow = false; say('« D\'accord, je reste ici. »'); }
      else if (S.followers.length >= 2) say('« Vous êtes déjà assez nombreux ! » (2 compagnons maximum)');
      else { S.followers.push({ name: e.name, ap: e.ap, female: !!e.female, key: X.keyOf(e) }); e.follow = true; e.flee = 0; say('« Avec plaisir, je te suis ! »'); G.event('follow'); }
      return true; }
    case 'play': {
      UI.closeModal();
      UI.say(e.name, ['À quoi veux-tu jouer ?'], [
        { label: 'Cartes (5 $ chacun)', fn: () => { if (S.money < 5) { UI.toast('Pas assez d\'argent.', 'err'); return; } L.gain(e, 5); G.event('play'); gameOrder({ title: 'Cartes avec ' + e.name, text: 'Pose les cartes de la plus faible à la plus forte.', steps: ['As', 'Roi', 'Dame', 'Valet', '10'].slice(0, 4).sort((x, y) => ['10', 'Valet', 'Dame', 'Roi', 'As'].indexOf(x) - ['10', 'Valet', 'Dame', 'Roi', 'As'].indexOf(y)), done: (ok, n) => { if (ok >= n - 1) { G.gain(10); L.pass(30, { fun: 16 }, 'Tu gagnes la partie : +10 $.'); } else { S.money -= 5; L.pass(30, { fun: 10 }, 'Tu perds la partie : -5 $.'); } } }); } },
        { label: 'Défi de réflexes', fn: () => { L.gain(e, 5); G.event('play'); gameReflex({ title: 'Défi avec ' + e.name, done: ok => { L.pass(20, { fun: 6 + ok * 2 }, ok >= 5 ? 'Tu bats ' + e.name + ' !' : e.name + ' gagne cette fois.'); } }); } },
        { label: 'Quiz entre amis', fn: () => { L.gain(e, 5); G.event('play'); gameQuiz({ title: 'Quiz avec ' + e.name, done: (ok, n) => { L.pass(25, { fun: 8 + ok * 6 }, ok + ' / ' + n + ' : bon moment !'); } }); } },
        { label: 'Balade (30 min)', fn: () => { L.gain(e, 6); G.event('play'); L.pass(30, { fun: 14, stamina: 10 }, 'Belle balade avec ' + e.name + '.'); } }, { label: 'Plus tard' }]);
      return true; }
    case 'break': L.gain(e, 0); sep(r, X.keyOf(e)); UI.banner('Vous avez rompu', e.name); U.sfx('err'); say('« Je... je comprends. Adieu. »'); return true;
  }
  return false;
};
/* suivre : compagnons gardés près du joueur */
function followers() {
  if (!S.followers || !S.followers.length || !C.cur || C.fade.dir !== 0) return;
  for (const f of S.followers) {
    const here = C.cur.ents.find(e => e.name === f.name && e.kind === 'npc' && !e.partner && !e.kid);
    if (here) { here.follow = true; continue; }
    Object.keys(W.maps).forEach(n => { const m = W.maps[n]; if (m !== C.cur && m.ents) m.ents = m.ents.filter(e => !(e.name === f.name && e.kind === 'npc' && !e.partner && !e.kid)); });
    const e = E.spawnWander(C.cur, Math.floor(P.x / T), Math.floor(P.y / T), 3, Math.random);
    e.name = f.name; e.ap = f.ap; e.female = f.female; e.follow = true; e.x = P.x - 10; e.y = P.y + 2; e.indoor = !C.cur.outdoor;
  }
}

/* ================================================================== */
/*  Portes à accès restreint, lits, routine de la famille              */
/* ================================================================== */
const allowed = (f, role) => !f || !f.allow || f.allow.includes(role);
function applyDoors() {
  const m = W.get('home'); if (!m || !m.def || !m.def.doors) return;
  for (const d of m.def.doors) { const f = S.furn[d.idx]; m.solid[d.y * m.w + d.x] = (f && !allowed(f, S.role)) ? 1 : 0; }
}
function guardDoors() {
  const m = W.get('home'); if (!m || C.cur !== m || !m.def || !m.def.doors || !m.def.doors.length) return;
  for (const e of m.ents) if (e.role) {
    let bad = false;
    for (const d of m.def.doors) { const f = S.furn[d.idx]; if (f && !allowed(f, e.role) && Math.floor(e.x / T) === d.x && Math.floor((e.y - 1) / T) === d.y) bad = true; }
    if (bad && e._lx != null) { e.x = e._lx; e.y = e._ly; e.state = 'idle'; e.t = 1; } else { e._lx = e.x; e._ly = e.y; }
  }
}
L.doorConfig = idx => {
  const f = S.furn[idx]; if (!f) return;
  UI.modal({ title: 'Accès de la porte', cls: 'rel',
    render: () => '<p class="muted">Choisis qui peut franchir cette porte (les autres seront bloqués).</p><div class="brow">' + famRoles().map(r => { const on = allowed(f, r); return '<button data-a="t" data-r="' + esc(r) + '"' + (on ? ' class="go"' : '') + '>' + esc(roleName(r)) + (on ? ' : oui' : ' : non') + '</button>'; }).join('') + '</div>',
    onAction: (a, b, m) => { if (a === 't') { const r = b.dataset.r, all = famRoles(); let al = f.allow ? f.allow.slice() : all.slice(); al = al.includes(r) ? al.filter(x => x !== r) : al.concat(r); f.allow = al.length >= all.length ? undefined : al; applyDoors(); m.refresh(); } } });
};
function bedSlots() {
  const out = [];
  S.furn.forEach((f, i) => {
    const F = D.FURN[f.id]; if (!F) return;
    const r = (f.r | 0) % 4;
    if (F.fn === 'sleep') {
      const n = f.id === 'bedlux' ? 2 : 1, cx = f.x + 1, cy = f.y + 1; // lit 2x2 : oreillers côté « haut » avant rotation
      for (let k = 0; k < n; k++) {
        const a = n === 2 ? (k ? 0.5 : -0.5) : 0, bb = 0.15;
        const o = [[a, bb], [-bb, a], [-a, -bb], [bb, -a]][r];
        out.push({ bed: i, n, x: (cx + o[0]) * T, y: (cy + o[1]) * T + (r === 0 ? 10 : 8), ang: r * Math.PI / 2, col: (F.o || {}).col });
      }
    } else if (F.k === 'crib') out.push({ bed: i, n: 1, crib: true, x: (f.x + 0.5) * T, y: (f.y + 0.5) * T + 6, ang: Math.PI / 2 });
  });
  return out;
}
function sleepPos() {
  const slots = bedSlots(), used = new Set(), res = {};
  const take = (r, pred) => { const i = slots.findIndex((s, j) => !used.has(j) && pred(s)); if (i < 0) return false; used.add(i); res[r] = slots[i]; return true; };
  const roles = famRoles(), couple = S.partner ? ['main', 'partner'] : [];
  roles.forEach(r => { const pref = S.beds && S.beds[r]; if (pref != null && roleStage(r) > 0 && slots.some(s => s.bed === pref && !s.crib)) take(r, s => s.bed === pref); else if (pref != null && roleStage(r) === 0) take(r, s => s.bed === pref); });
  if (couple.length && !couple.some(r => res[r])) {
    const bi = slots.findIndex(s => s.n === 2 && !s.crib && slots.filter(t => t.bed === s.bed).length === 2);
    if (bi >= 0) couple.forEach(r => take(r, s => s.bed === slots[bi].bed));
  }
  roles.forEach(r => { if (res[r]) return; const st = roleStage(r); if (st === 0 && take(r, s => s.crib)) return; take(r, s => !s.crib); });
  return res;
}
L.bedAssign = () => {
  UI.modal({ title: 'Qui dort où ?', cls: 'rel',
    render: () => { const beds = S.furn.map((f, i) => [f, i]).filter(x => D.FURN[x[0].id] && (D.FURN[x[0].id].fn === 'sleep' || D.FURN[x[0].id].k === 'crib')); if (!beds.length) return '<p class="muted">Aucun lit installé.</p>';
      return '<div class="list">' + famRoles().map(r => { const bi = S.beds[r]; const lab = bi != null && S.furn[bi] ? D.FURN[S.furn[bi].id].n + ' n°' + (beds.findIndex(x => x[1] === bi) + 1) : 'Automatique'; return '<div class="row"><div class="rn"><b>' + esc(roleName(r)) + '</b></div><button data-a="c" data-r="' + esc(r) + '">' + esc(lab) + '</button></div>'; }).join('') + '</div><p class="muted">Un lit simple accueille 1 personne, un lit double 2.</p>'; },
    onAction: (a, b, m) => { if (a === 'c') { const r = b.dataset.r, beds = S.furn.map((f, i) => i).filter(i => D.FURN[S.furn[i].id] && (D.FURN[S.furn[i].id].fn === 'sleep' || D.FURN[S.furn[i].id].k === 'crib')); const cur = S.beds[r], k = beds.indexOf(cur); const nx = k + 1 >= beds.length ? null : beds[k + 1]; if (nx == null) delete S.beds[r]; else S.beds[r] = nx; routine(true); m.refresh(); } } });
};
const oldSD = L.sleepDialog;
L.sleepDialog = () => {
  if (!(S.partner || S.kids.length)) return oldSD();
  UI.say('Lit', ['Dormir jusqu\'au matin ?'], [{ label: 'Dormir', fn: () => L.sleep() }, { label: 'Assigner les lits', fn: () => L.bedAssign() }, { label: 'Pas maintenant' }]);
};
E.stepGoto = (e, m, dt) => {
  const g = e.goto; g.t -= dt; const dx = g.x - e.x, dy = g.y - e.y, d = Math.hypot(dx, dy);
  if (d < 6 || g.t <= 0) { e.goto = null; if (g.cb) g.cb(e); return; }
  const sp = 46 * dt; if (!E.move(e, m, dx / d * sp, dy / d * sp)) { if (!E.move(e, m, dx / d * sp, 0)) E.move(e, m, 0, dy / d * sp); }
  e.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'); e.anim += dt * 8;
};
const relocate = (e, from, to, pos) => {
  from.ents = from.ents.filter(x => x !== e); to.ents.push(e); e.x = pos.x; e.y = pos.y; e.goto = null; e.state = 'idle'; e.t = 1;
  const out = W.get('world'); e.indoor = to !== out; e.home = { x: e.x, y: e.y, r: (to === out ? 12 : 3) * T };
  if (!e.mainChar) { e.wait = false; } e.sleeping = false;
};
function routine(force) {
  if (C.mode !== 'play' || !S.fam) return;
  const hm = W.get('home'), out = W.get('world'); if (!hm || !out) return;
  const h = (S.time / 60) % 24, away = h >= 7.5 && h < 20.5, night = h >= 22 || h < 6.5;
  const pos = sleepPos(), dx = Math.floor(hm.w / 2), hdoor = { x: dx * T + 8, y: (hm.h - 1) * T + 8 };
  for (const r of famRoles()) {
    if (r === S.role) continue;
    const f = findRoleEnt(r); if (!f) continue;
    const e = f.e, inHome = f.m === hm, canGo = r !== 'main' && roleStage(r) >= 2;
    if (canGo && away && inHome && !e.goto) {
      const go = () => relocate(e, hm, out, homeFront());
      if (!force && C.cur === hm) e.goto = { x: hdoor.x, y: hdoor.y, t: 8, cb: go }; else go();
      continue;
    }
    if (canGo && !away && !inHome && !e.goto) {
      const fr = homeFront(), go = () => relocate(e, out, hm, { x: hm.spawn.x, y: hm.spawn.y });
      if (!force && C.cur === out && Math.abs(e.x - P.x) < 220 && Math.abs(e.y - P.y) < 140) e.goto = { x: fr.x, y: fr.y, t: 14, cb: go }; else go();
      continue;
    }
    if (inHome && !e.goto) {
      if (night) { const s = pos[r]; if (!e.sleeping || force) { if (s) { e.x = s.x; e.y = s.y; e.sleepAng = s.ang; e.blanket = s.col; } else { const q = spotIn(hm), t = free(hm, q.x * T + 8, q.y * T + 12); e.x = t.x; e.y = t.y; e.sleepAng = Math.PI / 2; } e.sleeping = true; e.wait = true; e.anim = 0; e.goto = null; } }
      else if (e.sleeping) { e.sleeping = false; e.sleepAng = null; if (!e.mainChar) e.wait = false; const t = free(hm, e.x, e.y + 14, true); e.x = t.x; e.y = t.y; e.state = 'idle'; e.t = 1; }
    }
  }
}
function famTalk(e) {
  const ar = S.role, tr = e.role;
  let word = 'Proche';
  if (ar.startsWith('kid:')) word = tr === 'partner' ? (S.partner.female ? 'Maman' : 'Papa') : tr === 'main' ? 'Parent' : (e.female ? 'Soeur' : 'Frère');
  else if (ar === 'partner') word = tr === 'main' ? 'Conjoint(e)' : 'Enfant';
  const parent = tr === 'partner' || tr === 'main';
  const lines = { Maman: ['Bonjour mon chéri.', 'Tu as bien mangé ?'], Papa: ['Salut mon grand.', 'Tout va bien à l\'école ?'], Parent: ['Bonjour toi !', 'Tu as faim ?'], 'Conjoint(e)': ['Ma journée était bien. Et la tienne ?', 'Je suis heureux(se) avec toi.'], Enfant: ['Maman, Papa... on joue ?', 'J\'ai un dessin à te montrer !'] }[word] || ['Salut !', 'Ça va ?'];
  const ch = [{ label: 'Discuter (20 min)', fn: () => L.pass(20, { fun: 8 }, 'Belle discussion avec ' + e.name + '.') }, { label: 'Câliner', fn: () => { S.fun = Math.min(100, S.fun + 4); G.floater(e.x, e.y - 28, '<3', '#ff6aa0'); U.sfx('win'); } }];
  if (ar.startsWith('kid:') && parent) ch.push({ label: 'Argent de poche (10 $)', fn: () => { const me = needsOf(ar); if (me.pocketDay === S.day) { UI.toast('Tu as déjà reçu ton argent de poche aujourd\'hui.', 'err'); return; } const w = walletOwner(tr); if (w.money < 10) { UI.toast(e.name + ' n\'a pas assez d\'argent.', 'err'); return; } w.money -= 10; S.money += 10; me.pocketDay = S.day; U.sfx('coin'); UI.toast('+10 $ d\'argent de poche.', 'ok'); } });
  ch.push({ label: 'Contrôler ' + e.name, fn: () => L.switchTo(tr) }, { label: 'Au revoir' });
  UI.say(e.name + ' (' + word + ')', [pick(lines)], ch);
}

/* ================================================================== */
/*  Bots : entrées/sorties de bâtiments et vie nocturne                */
/* ================================================================== */
L.pool = L.pool || [];
const isWand = e => e.kind === 'npc' && !e.role && !e.goto && !e.follow && !e.wait && !e.kid && !e.partner && !e.mainChar && !e.guest && !e.fight && !e.sus && e.dying == null && !(e.talk > 0) && !e.stun;
const farFromP = e => Math.abs(e.x - P.x) > 200 || Math.abs(e.y - P.y) > 130;
function doorPos(name) { const o = W.get('world'), d = o.doorsById && o.doorsById[name]; return d ? { x: d.x * T + 8, y: (d.y + 1) * T + 12 } : null; }
function botFlow() {
  const out = W.get('world'); if (!out || !C.cur) return;
  const h = (S.time / 60) % 24;
  const f = h >= 7 && h < 20 ? 1 : h >= 20 && h < 23 ? 1 - 0.7 * (h - 20) / 3 : h >= 23 || h < 5 ? 0.3 : 0.3 + 0.7 * (h - 5) / 2;
  const outW = out.ents.filter(e => isWand(e));
  const inMaps = Object.keys(W.maps).filter(n => n !== 'world' && n !== 'home' && n !== 'casino');
  const indW = []; inMaps.forEach(n => W.maps[n].ents.forEach(e => { if (isWand(e)) indW.push({ e, n }); }));
  const total = outW.length + indW.length + L.pool.length, want = Math.round(f * total);
  const visible = e => C.cur === out && !farFromP(e);
  const intoBuilding = (e, n) => { out.ents = out.ents.filter(x => x !== e); const m = W.get(n); e.x = m.spawn.x; e.y = m.spawn.y; e.home = { x: e.x, y: e.y, r: 3 * T }; e.indoor = true; e.state = 'idle'; e.t = 1; e.goto = null; m.ents.push(e); };
  const sendIn = e => {
    if (visible(e)) { // il marche jusqu'à la porte la plus proche, puis entre
      let best = null; for (const n of inMaps) { const dp = doorPos(n); if (!dp) continue; const d = Math.hypot(dp.x - e.x, dp.y - e.y); if (!best || d < best.d) best = { n, dp, d }; }
      if (best && best.d < 360) { e.goto = { x: best.dp.x, y: best.dp.y - 4, t: 20, cb: () => intoBuilding(e, best.n) }; return true; }
      return false;
    }
    out.ents = out.ents.filter(x => x !== e);
    if (h >= 21 || h < 6 ? Math.random() < 0.8 : false) { L.pool.push(e); return true; }
    const n = pick(inMaps); intoBuilding(e, n); return true;
  };
  const fromBuilding = (e, n) => { W.maps[n].ents = W.maps[n].ents.filter(x => x !== e); const dp = doorPos(n) || { x: 62 * T, y: 50 * T }; e.x = dp.x; e.y = dp.y; e.home = { x: e.x, y: e.y, r: 10 * T }; e.indoor = false; e.state = 'idle'; e.t = 0.5; e.goto = null; out.ents.push(e); };
  const sendOut = (e, n) => {
    if (!n) { L.pool = L.pool.filter(x => x !== e); const d = pick(out.doors || [{ x: 62, y: 50 }]); e.x = d.x * T + 8; e.y = (d.y + 1) * T + 12; e.home = { x: e.x, y: e.y, r: 10 * T }; e.indoor = false; e.state = 'idle'; e.t = 0.5; out.ents.push(e); return; }
    const m = W.maps[n], dx = Math.floor(m.w / 2);
    if (C.cur === m) e.goto = { x: dx * T + 8, y: (m.h - 1) * T + 6, t: 15, cb: () => fromBuilding(e, n) }; else fromBuilding(e, n);
  };
  if (outW.length > want) { const c = shuffle(outW).sort((a, b) => (visible(b) ? 1 : 0) - (visible(a) ? 1 : 0))[0]; if (c) sendIn(c); }
  else if (outW.length < want) { if (L.pool.length) sendOut(pick(L.pool), null); else if (indW.length) { const c = pick(indW); sendOut(c.e, c.n); } }
  else if (Math.random() < 0.45 && indW.length) { const c = pick(indW); sendOut(c.e, c.n); const o = shuffle(outW)[0]; if (o) sendIn(o); }
}

/* ================================================================== */
/*  Combat, mort, muscles                                              */
/* ================================================================== */
const hpOf = e => (e.hp == null ? (e.hp = 40) : e.hp);
const DMG = { knife: 25, pistol: 30, rifle: 55, shotgun: 45 };
G.killNpc = (e, by) => {
  e.hp = 0; e.dying = 60; e.stun = 9999; e.fight = false; e.follow = false; e.flee = 0;
  S.stats.kills = (S.stats.kills || 0) + 1; G.floater(e.x, e.y - 20, 'Tué', '#ff5a5a'); U.sfx('err');
  G.addWanted(2); G.crimeDone(); G.event('kill', e.tag);
  if (S.followers) S.followers = S.followers.filter(f => f.name !== e.name);
  if (G.relBump) G.relBump(e, -80);
};
const oldHit = G.onShotHit;
G.onShotHit = e => {
  if (e.kind !== 'npc' || e.dying != null) { oldHit(e); return; }
  const it = D.ITEMS[S.equip.weapon], dmg = (it && DMG[it.w]) || 30;
  e.hp = hpOf(e) - dmg;
  if (e.hp <= 0) { G.killNpc(e); return; }
  oldHit(e); if (Math.random() < 0.35) { e.fight = true; e.stun = 0; e.armed = Math.random() < 0.25; }
};
G.npcAttack = e => {
  e.atkT = 0.28; const dmg = e.armed ? 11 : 5; S.hp = Math.max(0, S.hp - dmg); U.sfx('err'); G.floater(P.x, P.y - 24, '-' + dmg, '#ff7a7a');
  if (S.hp <= 0 && G.faint) { e.fight = false; G.faint(); }
};
G.npcResist = v => {
  const chance = 0.18 + (v.hp || 40) / 400 - (S.muscle || 0) / 400;
  if (Math.random() > chance) return false;
  v.fight = true; v.armed = Math.random() < 0.25; v.flee = 0; v.talk = 0;
  UI.toast(v.name + ' se défend' + (v.armed ? ' avec un couteau' : ' à coups de poing') + ' !', 'err'); G.addWanted(1);
  return true;
};
let punchCd = 0;
G.punch = () => {
  if (punchCd > 0) return; punchCd = 0.45; P.punchT = 0.28;
  let best = null, bd = 26; for (const e of C.cur.ents) { if (e.kind !== 'npc' || e.dying != null || e.partner || e.kid || e.mainChar) continue; const d = Math.hypot(e.x - P.x, e.y - P.y); if (d < bd) { bd = d; best = e; } }
  U.sfx('shot'); if (!best) { UI.toast('Poing dans le vide.'); return; }
  const dmg = 7 + (S.muscle || 0) * 0.25 + ri(0, 3); best.hp = hpOf(best) - dmg; S.stamina = Math.max(0, S.stamina - 3);
  G.floater(best.x, best.y - 26, '-' + Math.round(dmg), '#ffd36a'); best.flee = 0;
  if (!best.fight && best.hp > 0) { if (Math.random() < 0.5) best.fight = true; else best.flee = 6; }
  if (best.hp <= 0) { best.hp = 22; best.stun = 30; best.fight = false; G.floater(best.x, best.y - 34, 'K.O.', '#ff9a9a'); }
  if (G.witnesses(best, 130) > 0) G.addWanted(1); G.crimeDone(); if (G.relBump) G.relBump(best, -15);
};
const oldUse = G.useWeapon;
G.useWeapon = () => { if (!S.equip.weapon) { G.punch(); return; } oldUse(); };
// vol à la tire + relations
const oldRC = G.relChoices;
G.relChoices = (e, ch) => {
  oldRC(e, ch);
  if (e.kind === 'npc' && !e.partner && !e.mainChar && !e.kid && e.stun <= 0) ch.splice(ch.length - 1, 0, { label: 'Voler à la tire', fn: () => pickpocket(e) });
};
function pickpocket(e) {
  if (e.pp && e.pp > S.abs) { UI.toast(e.name + ' n\'a plus rien d\'intéressant.', 'err'); return; }
  e.pp = S.abs + 600; const ok = Math.random() < 0.55 + (S.muscle || 0) / 500;
  if (ok) { const loot = Math.max(1, Math.round((e.money || 20) * (0.1 + Math.random() * 0.25))); e.money = Math.max(0, (e.money || 0) - loot); G.gain(loot); G.floater(P.x, P.y - 20, '+' + loot + ' $', '#8dff8d'); UI.toast('Tu as subtilisé ' + money(loot) + '.', 'ok'); G.event('pickpocket'); G.crimeDone(); if (G.witnesses(e, 110) > 0 && Math.random() < 0.4) G.addWanted(1); }
  else { UI.toast(e.name + ' t\'a vu : « Au voleur ! »', 'err'); e.fight = Math.random() < 0.5; e.flee = e.fight ? 0 : 6; G.addWanted(1); G.crimeDone(); if (G.relBump) G.relBump(e, -25); }
}
// mort : disparition hors champ + remplacement
function dying(dt) {
  Object.keys(W.maps).forEach(n => {
    const m = W.maps[n]; if (!m.ents) return;
    for (const e of m.ents) {
      if (e.dying == null) continue; e.dying -= dt; if (e.dying > 0) continue;
      if (m === C.cur && !farFromP(e)) continue; // encore visible : il reste
      e.remove = true; if (E.used) E.used.delete(e.name);
      const out = W.get('world'), s = (() => { for (let k = 0; k < 50; k++) { const tx = 20 + Math.floor(Math.random() * 90), ty = 20 + Math.floor(Math.random() * 60); if (!out.solid[ty * out.w + tx] && out.ground[ty * out.w + tx] !== 2) return { x: tx, y: ty }; } return { x: 62, y: 52 }; })();
      const ne = E.spawnWander(out, s.x, s.y, 8, Math.random);
      if (m !== out) m.ents = m.ents.filter(x => !x.remove);
    }
  });
}

/* ================================================================== */
/*  Contrats (quêtes illégales) : cibles                               */
/* ================================================================== */
const ensureTargets = () => {
  const out = W.get('world'); if (!out) return;
  for (const q of D.QUESTS) {
    const st = S.quests[q.id]; if (!st || st.done) continue; const s = q.steps[st.step];
    if (!s || s.t !== 'kill' || !s.a) continue;
    if (out.ents.some(e => e.tag === s.a)) continue;
    let sp = { x: 64, y: 54 }; for (let k = 0; k < 60; k++) { const tx = 15 + Math.floor(Math.random() * 100), ty = 15 + Math.floor(Math.random() * 70); if (!out.solid[ty * out.w + tx] && out.ground[ty * out.w + tx] !== 2) { sp = { x: tx, y: ty }; break; } }
    const e = E.spawnWander(out, sp.x, sp.y, 6, Math.random); e.name = s.name || 'Cible'; e.tag = s.a; e.hp = 60; e.target = true; e.money = 400;
  }
};
Object.assign(D.QUESTS.find(q => q.id === 'ombre') || {}, {});
D.QUESTS.push(
  { id: 'contrat1', giver: 'vipere', title: 'Contrat : Gaétan', req: 'ombre',
    offer: ['J\'ai un client qui veut que Gaétan Roy disparaisse. Il se promène dans le village.', 'Équipe-toi d\'une arme à feu, ne te fais pas prendre. Reviens quand c\'est fait.'],
    steps: [{ t: 'kill', a: 'c1', name: 'Gaétan Roy', txt: 'Élimine Gaétan Roy (il se promène dans le village).' }, { t: 'talk', a: 'vipere', txt: 'Retourne voir la Vipère.' }],
    done: ['Propre. Voilà ta part, et tu ne m\'as jamais vu.'], reward: { money: 700 } },
  { id: 'contrat2', giver: 'vipere', title: 'Contrat : Lucien', req: 'contrat1',
    offer: ['Un autre nom : Lucien Paquet. Même procédure.'],
    steps: [{ t: 'kill', a: 'c2', name: 'Lucien Paquet', txt: 'Élimine Lucien Paquet.' }, { t: 'talk', a: 'vipere', txt: 'Retourne voir la Vipère.' }],
    done: ['Excellent travail. Tu montes en grade.'], reward: { money: 1200 } },
  { id: 'poches', giver: 'vipere', title: 'Doigts de fée', req: 'ombre',
    offer: ['Les poches des gens sont pleines. Choisis « Voler à la tire » quand tu parles à quelqu\'un. Trois fois.'],
    steps: [{ t: 'pickpocket', n: 3, txt: 'Vole à la tire 3 passants.' }, { t: 'talk', a: 'vipere', txt: 'Retourne voir la Vipère.' }],
    done: ['Pas mal du tout, petit.'], reward: { money: 250 } },
  { id: 'bijoux', giver: 'vipere', title: 'Éclat de diamant', req: 'ombre',
    offer: ['La bijouterie, tout au bout de la deuxième rue commerçante. Il te faudra un gros calibre.'],
    steps: [{ t: 'rob', a: 'bijoutier', txt: 'Braque la bijouterie.' }, { t: 'talk', a: 'vipere', txt: 'Retourne voir la Vipère.' }],
    done: ['Ça brille ! Je prends ma commission.'], reward: { money: 600 } },
  { id: 'copains', giver: 'maire', title: 'Esprit de village', req: 'bienvenue',
    offer: ['Un village vit par ses habitants. Invite quelqu\'un à te suivre, puis joue avec un ami.'],
    steps: [{ t: 'follow', txt: 'Demande à quelqu\'un de te suivre (Discuter, niveau Ami).' }, { t: 'play', txt: 'Joue avec un ami (Discuter, Jouer ensemble).' }, { t: 'talk', a: 'maire', txt: 'Retourne voir la maire.' }],
    done: ['Quel beau lien ! Voici un petit coup de pouce.'], reward: { money: 150 } },
  { id: 'costaud', giver: 'hector', title: 'Corps d\'athlète', req: null,
    offer: ['Pour impressionner, il faut des muscles. Soulève des poids au gym, cinq séances.'],
    steps: [{ t: 'muscle', n: 5, txt: 'Fais 5 séances de musculation (zones « poids »).' }, { t: 'talk', a: 'hector', txt: 'Retourne voir Hector.' }],
    done: ['Voilà de belles épaules ! Continue !'], reward: { money: 120 } },
  { id: 'famille', giver: 'maire', title: 'Fonder une famille', req: 'bienvenue',
    offer: ['Le village a besoin de nouveaux visages ! Marie-toi, puis accueille un bébé.'],
    steps: [{ t: 'wed', txt: 'Marie-toi avec quelqu\'un (bague à la boutique de cadeaux).' }, { t: 'birth', txt: 'Accueille un bébé.' }, { t: 'talk', a: 'maire', txt: 'Retourne voir la maire.' }],
    done: ['Félicitations, c\'est merveilleux !'], reward: { money: 500 } }
);
['hector'].forEach(id => { const n = D.NPCS[id]; if (n) { n.menu = n.menu || []; if (!n.menu.includes('quest')) n.menu.push('quest'); } });

/* ================================================================== */
/*  Mise à jour                                                        */
/* ================================================================== */
const oldUpd = L.update; let botT = 0, tgtT = 0, rtT = 0;
L.update = dt => {
  oldUpd(dt);
  if (punchCd > 0) punchCd -= dt;
  if (S.role == null) S.role = 'main'; if (!S.fam) S.fam = {};
  if (S.equip.hand && !(S.inv[S.equip.hand] > 0)) S.equip.hand = null;
  if (P.punchT > 0) P.punchT -= dt; if (C.cur) for (const e of C.cur.ents) if (e.atkT > 0) e.atkT -= dt;
  if (C.mode !== 'play') return;
  Object.keys(W.maps).forEach(n => { const m = W.maps[n]; if (m === C.cur || !m.ents) return; for (const e of m.ents) if (e.goto) { e.goto.t -= dt; if (e.goto.t <= 0) { const g = e.goto; e.goto = null; if (g.cb) g.cb(e); } } });
  guardDoors(); if ((rtT += dt) > 2) { rtT = 0; routine(false); }
  famBar(); followers();
  dying(dt);
  if ((botT += dt) > 2.5) { botT = 0; botFlow(); }
  if ((tgtT += dt) > 2) { tgtT = 0; ensureTargets(); }
};

/* ---------- se débloquer ---------- */
const stuckHit = (m, x, y) => W.hit(m, x, y, 5, 4);
G.unstuck = (quiet) => {
  if (P.car && RG.Cars) RG.Cars.forceExit();
  try { while (UI.isModal && UI.isModal()) UI.closeModal(); UI.closeDialog && UI.closeDialog(); } catch (e) { }
  C.fade = { a: 0, dir: 0 }; C.mini = null; C.place = null; C.fishing = null; C.mode = 'play'; P.stun = 0; P.punchT = 0; P.moving = false; P.run = false;
  const m = C.cur; if (!m) return;
  if (stuckHit(m, P.x, P.y) || !quiet) { const f = free(m, P.x, P.y); if (stuckHit(m, P.x, P.y)) { P.x = f.x; P.y = f.y; } }
  const hm = W.get('home');
  if (hm) for (const e of hm.ents) if (e.role || e.kid || e.partner || e.mainChar) { if (!e.sleeping && stuckHit(hm, e.x, e.y)) { const f = free(hm, e.x, e.y); e.x = f.x; e.y = f.y; } e.goto = null; if (!e.mainChar && !e.sleeping) e.wait = false; }
  routine(true); famDirty = true;
  if (!quiet) UI.toast('Personnage débloqué.', 'ok');
};
let stkT = 0, stkN = 0;
const oldUpd2 = L.update;
L.update = dt => {
  oldUpd2(dt);
  if (C.mode !== 'play' || P.car || !C.cur) return;
  if ((stkT += dt) > 0.4) {
    stkT = 0; const m = C.cur;
    if (!m.zonesBlock && stuckHit(m, P.x, P.y)) { if (++stkN >= 2) { const f = free(m, P.x, P.y); P.x = f.x; P.y = f.y; stkN = 0; } } else stkN = 0;
    for (const e of m.ents) if ((e.role || e.guest) && !e.sleeping && !e.goto && stuckHit(m, e.x, e.y)) { const f = free(m, e.x, e.y); e.x = f.x; e.y = f.y; }
  }
};
const oldInit = L.init;
L.init = () => {
  oldInit(); S.fam = S.fam || {}; Object.keys(S.fam).forEach(r => { S.fam[r] = Object.assign(fresh(r), S.fam[r]); }); S.beds = S.beds || {}; S.role = S.role || 'main'; S.fam = S.fam || {}; S.followers = S.followers || []; S.muscle = S.muscle || 0;
  if (S.bladder == null) S.bladder = 90; if (S.hyg == null) S.hyg = 90;
  if (!S.gaveWC) { S.gaveWC = 1; S.furnInv.toilet = (S.furnInv.toilet || 0) + 1; S.furnInv.shower = (S.furnInv.shower || 0) + 1; }
  if (S.role !== 'main' && !S.main) S.role = 'main';
  famDirty = true; famSig = '';
};
})();
