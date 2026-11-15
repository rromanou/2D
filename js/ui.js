(() => {
'use strict';
const RG = window.RG, U = RG.U, D = RG.Data, Sp = RG.Sp;
const UI = RG.UI = {};
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
UI.esc = esc;
let el = {};
let modal = null;
let dlg = null; // dialogue en cours

UI.init = () => {
  el = { modal: $('modal'), dialog: $('dialog'), prompt: $('prompt'), toasts: $('toasts'), money: $('h-money'), time: $('h-time'), job: $('h-job'),
         hunger: $('b-hunger'), thirst: $('b-thirst'), hp: $('b-hp'), stam: $('b-stam'), sleep: $('b-sleep'), fun: $('b-fun'), stars: $('h-stars'), equip: $('h-equip'), title: $('title'), banner: $('banner') };
  el.modal.addEventListener('click', e => {
    if (e.target === el.modal && modal && !modal.locked) { UI.closeModal(); return; }
    const b = e.target.closest('[data-a]');
    if (!b || !modal) return;
    U.sfx('click');
    const a = b.dataset.a;
    if (a === 'close') { if (!modal.locked) UI.closeModal(); return; }
    if (modal.onAction) modal.onAction(a, b, modal);
  });
  el.dialog.addEventListener('click', e => {
    const b = e.target.closest('[data-c]');
    if (b && dlg) { const ch = dlg.choices[+b.dataset.c]; UI.closeDialog(); if (ch && ch.fn) ch.fn(); return; }
    UI.dialogAdvance();
  });
};

/* ---------- toasts / invite / HUD ---------- */
UI.toast = (msg, kind) => {
  const d = document.createElement('div');
  d.className = 'toast ' + (kind || '');
  d.textContent = msg;
  el.toasts.appendChild(d);
  while (el.toasts.children.length > 5) el.toasts.removeChild(el.toasts.firstChild);
  setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 500); }, 3600);
};
UI.banner = (msg, sub) => { el.banner.innerHTML = '<b>' + esc(msg) + '</b>' + (sub ? '<span>' + esc(sub) + '</span>' : ''); el.banner.classList.add('on'); clearTimeout(UI._bt); UI._bt = setTimeout(() => el.banner.classList.remove('on'), 2600); };
UI.setPrompt = t => { if (UI._pt === t) return; UI._pt = t; el.prompt.textContent = t || ''; el.prompt.style.display = t ? 'block' : 'none'; };
UI.hud = S => {
  el.money.textContent = U.money(S.money);
  const h = Math.floor(S.time / 60) % 24, m = Math.floor(S.time % 60);
  el.time.textContent = 'Jour ' + S.day + ' - ' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  el.hunger.style.width = Math.max(0, S.hunger) + '%'; el.thirst.style.width = Math.max(0, S.thirst) + '%';
  el.hp.style.width = Math.max(0, S.hp) + '%'; el.stam.style.width = Math.max(0, S.stamina) + '%';
  if (el.sleep) { el.sleep.style.width = Math.max(0, S.sleep == null ? 100 : S.sleep) + '%'; el.fun.style.width = Math.max(0, S.fun == null ? 100 : S.fun) + '%'; el.sleep.parentNode.parentNode.classList.toggle('low', S.sleep < 20); el.fun.parentNode.parentNode.classList.toggle('low', S.fun < 15); }
  el.hunger.parentNode.classList.toggle('low', S.hunger < 20); el.thirst.parentNode.classList.toggle('low', S.thirst < 20);
  const j = S.job ? D.JOBS[S.job.id] : null;
  el.job.textContent = j ? j.n + ' (niv. ' + (1 + Math.floor(((S.jobxp && S.jobxp[S.job.id]) || 0) / 8)) + ')' : 'Sans emploi';
  let st = ''; for (let i = 0; i < 5; i++) st += '<i class="' + (i < S.wanted ? 'on' : '') + '"></i>';
  el.stars.innerHTML = st; el.stars.style.visibility = S.wanted > 0 ? 'visible' : 'hidden';
  let eq = ''; if (S.equip.weapon) { const it = D.ITEMS[S.equip.weapon]; eq = it.n; if (it.k === 'weapon' && it.w !== 'knife') eq += ' (' + (S.inv.balles || 0) + ')'; }
  if (S.equip.mask) eq += (eq ? ' + ' : '') + 'Cagoule';
  el.equip.innerHTML = (S.equip.weapon ? RG.Icons.img(S.equip.weapon, 'ic') + ' ' : '') + esc(eq); el.equip.style.display = eq ? 'block' : 'none';
  UI.hotbar(S);
};

/* ---------- fenêtres ---------- */
UI.isModal = () => !!modal;
UI.closeModal = () => {
  if (!modal) return;
  const m = modal; modal = null;
  el.modal.classList.remove('on'); el.modal.innerHTML = '';
  if (m.onClose) m.onClose();
};
UI.modal = o => {
  if (modal) { const m = modal; modal = null; if (m.onClose) m.onClose(); }
  modal = o;
  const draw = () => {
    if (o.raw) { el.modal.innerHTML = o.render(); if (o.after) o.after(el.modal); return; }
    el.modal.innerHTML = '<div class="panel ' + (o.cls || '') + '"><div class="ph"><span>' + esc(o.title || '') + '</span>' + (o.locked ? '' : '<button class="x" data-a="close">Fermer</button>') + '</div><div class="pb">' + o.render() + '</div></div>';
    if (o.after) o.after(el.modal);
  };
  o.refresh = draw;
  el.modal.classList.add('on');
  draw();
  return o;
};
UI.currentModal = () => modal;

/* ---------- dialogue ---------- */
UI.dialogOpen = () => !!dlg;
UI.say = (name, lines, choices, onEnd) => {
  dlg = { name, lines: lines.slice(), i: 0, choices: choices || [], onEnd, shown: 0, full: false };
  el.dialog.classList.add('on');
  UI.drawDialog();
};
UI.drawDialog = () => {
  if (!dlg) return;
  const cur = dlg.lines[dlg.i];
  const who = (typeof cur === 'object' && cur.w) ? cur.w : dlg.name;
  const txt = typeof cur === 'object' ? cur.t : cur;
  dlg.txt = txt; dlg.shown = 0; dlg.full = false;
  el.dialog.innerHTML = '<div class="dn">' + esc(who) + '</div><div class="dt" id="dt"></div><div class="dc" id="dc"></div><div class="dh" id="dh">E / Espace</div>';
};
UI.dialogAdvance = () => {
  if (!dlg) return;
  if (!dlg.full) { dlg.shown = dlg.txt.length; UI.dialogUpdate(0); return; }
  if (dlg.i < dlg.lines.length - 1) { dlg.i++; UI.drawDialog(); return; }
  if (dlg.choices.length) return; // il faut choisir
  const d = dlg; UI.closeDialog(); if (d.onEnd) d.onEnd();
};
UI.dialogChoice = n => { if (dlg && dlg.full && dlg.i === dlg.lines.length - 1 && dlg.choices[n]) { const ch = dlg.choices[n]; UI.closeDialog(); if (ch.fn) ch.fn(); } };
UI.closeDialog = () => { dlg = null; el.dialog.classList.remove('on'); el.dialog.innerHTML = ''; };
UI.dialogUpdate = dt => {
  if (!dlg || dlg.full) return;
  dlg.shown = Math.min(dlg.txt.length, dlg.shown + dt * 55);
  const t = $('dt'); if (t) t.textContent = dlg.txt.slice(0, Math.floor(dlg.shown));
  if (Math.floor(dlg.shown * 0.5) % 2 === 0 && dt > 0 && Math.random() < 0.3) U.sfx('talk');
  if (dlg.shown >= dlg.txt.length) {
    dlg.full = true;
    const last = dlg.i === dlg.lines.length - 1;
    const dc = $('dc'), dh = $('dh');
    if (last && dlg.choices.length) {
      dc.innerHTML = dlg.choices.map((c, i) => '<button data-c="' + i + '">' + (i + 1) + '. ' + esc(c.label) + '</button>').join('');
      if (dh) dh.style.display = 'none';
    }
  }
};

/* ---------- boutique ---------- */
UI.shop = (id, opt) => {
  opt = opt || {};
  const sh = D.SHOPS[id];
  UI.modal({
    title: sh.title, cls: 'shop',
    render: () => {
      const S = RG.S;
      let h = '<div class="money">Argent : <b>' + U.money(S.money) + '</b></div><div class="list">';
      for (const iid of sh.items) {
        const it = D.ITEMS[iid];
        const owned = it.k === 'cosm' && S.owned[iid];
        let eff = '';
        if (it.h) eff += 'Faim +' + it.h + ' '; if (it.t) eff += 'Soif +' + it.t + ' '; if (it.hp) eff += 'Santé +' + it.hp + ' '; if (it.st) eff += 'Énergie +' + it.st;
        h += '<div class="row">' + RG.Icons.img(iid) + '<div class="rn"><b>' + esc(it.n) + '</b><small>' + esc(it.d || '') + ' ' + eff + '</small></div><div class="rp">' + U.money(it.p) + '</div>';
        if (owned) h += '<span class="tag">Possédé</span>';
        else {
          h += '<button data-a="buy" data-i="' + iid + '" data-n="1">Acheter</button>';
          if (it.k === 'food' || it.k === 'drink' || it.k === 'ammo') h += '<button data-a="buy" data-i="' + iid + '" data-n="5">x5</button>';
        }
        h += '</div>';
      }
      return h + '</div>';
    },
    onAction: (a, b, m) => { if (a === 'buy') { RG.Game.buy(b.dataset.i, +b.dataset.n, id, () => m.refresh()); } }
  });
};

/* ---------- inventaire ---------- */
const ORDER = { weapon: 0, mask: 1, food: 2, drink: 3, ammo: 4, tool: 5, misc: 6, loot: 7 };
UI.bagItems = () => {
  const S = RG.S;
  return Object.keys(S.inv).filter(k => S.inv[k] > 0 && D.ITEMS[k]).sort((x, y) => (ORDER[D.ITEMS[x].k] ?? 9) - (ORDER[D.ITEMS[y].k] ?? 9));
};
UI.itemAction = id => {
  const S = RG.S, it = D.ITEMS[id];
  if (it.k === 'food') return { a: 'use', l: 'Manger' };
  if (it.k === 'drink') return { a: 'use', l: 'Boire' };
  if (it.k === 'weapon') return { a: 'eq', l: S.equip.weapon === id ? 'Ranger' : 'Équiper' };
  if (it.k === 'mask') return { a: 'mask', l: S.equip.mask ? 'Retirer' : 'Mettre' };
  return null;
};
UI.useSlot = id => {
  const act = UI.itemAction(id); if (!act) { const it = D.ITEMS[id]; UI.toast(it.n + ' : rien à faire ici.'); return; }
  if (act.a === 'use') RG.Game.useItem(id);
  else if (act.a === 'eq') { RG.Game.equipWeapon(id); U.sfx('click'); }
  else RG.Game.toggleMask();
  UI.hotbarDirty();
};
let selItem = null;
UI.inventory = () => {
  UI.modal({
    title: 'Mon sac', cls: 'inv',
    render: () => {
      const S = RG.S, ids = UI.bagItems();
      if (!ids.includes(selItem)) selItem = ids[0] || null;
      let h = '<div class="money">Argent : <b>' + U.money(S.money) + '</b> &nbsp; En banque : <b>' + U.money(S.bank) + '</b></div>';
      if (!ids.length) return h + '<p class="muted">Ton sac est vide.</p>';
      h += '<div class="bag"><div class="grid">';
      for (const id of ids) {
        const eq = S.equip.weapon === id || (D.ITEMS[id].k === 'mask' && S.equip.mask);
        h += '<div class="cell' + (id === selItem ? ' sel' : '') + (eq ? ' eq' : '') + '" data-a="sel" data-i="' + id + '">' + RG.Icons.img(id, '') + '<span class="n">' + S.inv[id] + '</span></div>';
      }
      h += '</div><div class="info">';
      if (selItem) {
        const it = D.ITEMS[selItem], act = UI.itemAction(selItem);
        let eff = '';
        if (it.h) eff += 'Faim +' + it.h + '<br>'; if (it.t) eff += 'Soif +' + it.t + '<br>'; if (it.hp) eff += 'Santé +' + it.hp + '<br>'; if (it.st) eff += 'Énergie +' + it.st + '<br>';
        h += RG.Icons.img(selItem, '') + '<h3>' + esc(it.n) + ' x' + S.inv[selItem] + '</h3><div class="muted">' + esc(it.d || '') + (it.ill ? '<br>[illégal]' : '') + '</div><div class="muted">' + eff + '</div>';
        if (it.k === 'weapon' && it.w !== 'knife') h += '<div class="muted">Balles : ' + (S.inv.balles || 0) + '</div>';
        if (act) h += '<div class="brow"><button class="go" data-a="' + act.a + '" data-i="' + selItem + '">' + act.l + '</button>' + (act.a === 'use' && S.inv[selItem] > 1 ? '<button data-a="use" data-i="' + selItem + '" data-x="1">x2</button>' : '') + '</div>';
        if (it.k === 'weapon') h += '<div class="muted">Équipé : appuie sur F près de quelqu\'un pour le menacer.</div>';
        if (it.p && it.sell == null && !it.ill && it.k !== 'misc') { /* pas de revente */ }
      }
      return h + '</div></div><p class="muted">Raccourcis : touches 1 à 9 ou barre d\'objets en bas de l\'écran.</p>';
    },
    onAction: (a, b, m) => {
      if (a === 'sel') { selItem = b.dataset.i; U.sfx('click'); }
      else if (a === 'use') { RG.Game.useItem(b.dataset.i); if (b.dataset.x) RG.Game.useItem(b.dataset.i); }
      else if (a === 'eq') RG.Game.equipWeapon(b.dataset.i);
      else if (a === 'mask') RG.Game.toggleMask();
      UI.hotbarDirty(); m.refresh();
    }
  });
};

/* ---------- barre d'objets ---------- */
let hbSig = '', hbEl = null, hbMap = [];
UI.hotbarDirty = () => { hbSig = ''; };
UI.hotbarSlot = n => { const id = hbMap[n]; if (id) UI.useSlot(id); };
UI.hotbar = S => {
  if (!hbEl) {
    hbEl = $('hotbar');
    hbEl.addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (b) { U.sfx('click'); UI.hotbarSlot(+b.dataset.s); } });
  }
  const ids = UI.bagItems().filter(i => ['weapon', 'mask', 'food', 'drink'].includes(D.ITEMS[i].k)).slice(0, 9);
  const sig = ids.map(i => i + S.inv[i] + (S.equip.weapon === i ? 'E' : '') + (D.ITEMS[i].k === 'mask' && S.equip.mask ? 'E' : '')).join(',');
  if (sig === hbSig) return;
  hbSig = sig; hbMap = ids;
  hbEl.innerHTML = ids.map((id, n) => {
    const eq = S.equip.weapon === id || (D.ITEMS[id].k === 'mask' && S.equip.mask);
    return '<div class="slot' + (eq ? ' eq' : '') + '" data-s="' + n + '" title="' + esc(D.ITEMS[id].n) + '"><span class="k">' + (n + 1) + '</span>' + RG.Icons.img(id, '') + '<span class="n">' + S.inv[id] + '</span></div>';
  }).join('');
};

/* ---------- quêtes ---------- */
UI.quests = () => {
  UI.modal({
    title: 'Journal de quêtes', cls: 'quests',
    render: () => {
      const S = RG.S; let h = '', n = 0;
      for (const q of D.QUESTS) {
        const st = S.quests[q.id]; if (!st || st.done) continue; n++;
        h += '<div class="q"><b>' + esc(q.title) + '</b>';
        q.steps.forEach((s, i) => {
          const cls = i < st.step ? 'ok' : i === st.step ? 'cur' : 'todo';
          const prog = (i === st.step && s.n > 1) ? ' (' + Math.min(st.p, s.n) + '/' + s.n + ')' : '';
          h += '<div class="qs ' + cls + '">' + esc(s.txt) + prog + '</div>';
        });
        h += '</div>';
      }
      if (!n) h += '<p class="muted">Aucune quête en cours. Parle aux habitants (le signe ! au-dessus de leur tête indique une quête).</p>';
      const dn = D.QUESTS.filter(q => S.quests[q.id] && S.quests[q.id].done);
      if (dn.length) h += '<h4>Terminées</h4><div class="muted">' + dn.map(q => esc(q.title)).join(' - ') + '</div>';
      return h;
    }
  });
};

/* ---------- banque ---------- */
UI.bank = () => {
  UI.modal({
    title: 'Banque', cls: 'bank',
    render: () => {
      const S = RG.S;
      const row = (lab, a) => '<div class="brow"><span>' + lab + '</span>' + [50, 100, 500, 1000].map(n => '<button data-a="' + a + '" data-n="' + n + '">' + n + '</button>').join('') + '<button data-a="' + a + '" data-n="all">Tout</button></div>';
      return '<div class="money">Sur toi : <b>' + U.money(S.money) + '</b></div><div class="money">En banque : <b>' + U.money(S.bank) + '</b></div><p class="muted">L\'argent en banque ne peut être ni volé ni confisqué.</p>' + row('Déposer', 'dep') + row('Retirer', 'wd');
    },
    onAction: (a, b, m) => {
      if (a === 'dep') RG.Game.deposit(b.dataset.n === 'all' ? 'all' : +b.dataset.n);
      else if (a === 'wd') RG.Game.withdraw(b.dataset.n === 'all' ? 'all' : +b.dataset.n);
      m.refresh();
    }
  });
};

/* ---------- emplois ---------- */
UI.jobs = () => {
  UI.modal({
    title: 'Centre d\'emploi', cls: 'jobs',
    render: () => {
      const S = RG.S;
      let h = '<div class="money">Emploi actuel : <b>' + (S.job ? D.JOBS[S.job.id].n : 'aucun') + '</b></div><div class="list">';
      for (const id of Object.keys(D.JOBS)) {
        const j = D.JOBS[id];
        const xp = (S.jobxp && S.jobxp[id]) || 0, lv = 1 + Math.floor(xp / 8);
        h += '<div class="row"><div class="rn"><b>' + esc(j.n) + '</b> <span class="tag">niv. ' + lv + '</span><small>' + esc(j.d) + ' Paie : ' + j.pay[0] + ' à ' + j.pay[1] + ' $ par tâche.' + (j.need ? ' Outil requis : ' + D.ITEMS[j.need].n + '.' : '') + '</small></div>';
        h += (S.job && S.job.id === id) ? '<span class="tag">Actuel</span>' : '<button data-a="take" data-i="' + id + '">Choisir</button>';
        h += '</div>';
      }
      h += '</div>';
      if (S.job) h += '<button data-a="quit" class="warn">Démissionner</button>';
      return h;
    },
    onAction: (a, b, m) => { if (a === 'take') RG.Game.setJob(b.dataset.i); else if (a === 'quit') RG.Game.setJob(null); m.refresh(); }
  });
};

/* ---------- coffre ---------- */
UI.stash = () => {
  UI.modal({
    title: 'Coffre', cls: 'stash',
    render: () => {
      const S = RG.S;
      const col = (src, a, lab) => {
        const ids = Object.keys(src).filter(k => src[k] > 0);
        return '<div class="col"><h4>' + lab + '</h4>' + (ids.length ? ids.map(i => '<div class="row"><div class="rn">' + esc(D.ITEMS[i].n) + ' x' + src[i] + '</div><button data-a="' + a + '" data-i="' + i + '">1</button><button data-a="' + a + '" data-i="' + i + '" data-all="1">Tout</button></div>').join('') : '<p class="muted">Vide</p>') + '</div>';
      };
      return '<p class="muted">Ce que tu laisses ici est à l\'abri de la police.</p><div class="cols">' + col(S.inv, 'put', 'Sur moi') + col(S.stash, 'get', 'Dans le coffre') + '</div>';
    },
    onAction: (a, b, m) => { RG.Game.stashMove(b.dataset.i, a === 'put' ? 'put' : 'get', b.dataset.all ? 99999 : 1); m.refresh(); }
  });
};

/* ---------- saisie de nom ---------- */
UI.ask = (label, def, cb) => {
  UI.modal({
    title: label, cls: 'ask', locked: true,
    render: () => '<input id="ask-in" maxlength="14" value="' + esc(def || '') + '"><div class="brow"><button data-a="ok">Valider</button></div>',
    after: () => { const i = $('ask-in'); if (i) { i.focus(); i.select(); i.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { const v = i.value.trim() || def; UI.closeModal(); cb(v); } }); } },
    onAction: () => { const v = ($('ask-in').value || '').trim() || def; UI.closeModal(); cb(v); }
  });
};

/* ---------- éditeur d'avatar ---------- */
UI.avatar = (opt) => {
  opt = opt || {};
  const S = RG.S, P = Sp.pal;
  const ap = Object.assign({}, S.ap);
  let name = S.name, rot = 0;
  const dirs = ['down', 'left', 'up', 'right'];
  const owned = (slot, v) => v === 0 || S.owned[(slot === 'hat' ? 'hat_' : 'gl_') + v] || (opt.all);
  const sw = (key, arr) => '<div class="sw">' + arr.map(c => '<button class="c' + (ap[key] === c ? ' sel' : '') + '" style="background:' + c + '" data-a="col" data-k="' + key + '" data-v="' + c + '"></button>').join('') + '</div>';
  const sel = (key, names, lock) => '<div class="opt"><button data-a="opt" data-k="' + key + '" data-d="-1">&lt;</button><span>' + esc(names[ap[key]]) + (lock && !owned(lock, ap[key]) ? ' (verrouillé)' : '') + '</span><button data-a="opt" data-k="' + key + '" data-d="1">&gt;</button></div>';
  const m = UI.modal({
    title: opt.title || 'Personnaliser mon personnage', cls: 'avatar', locked: !!opt.locked,
    render: () => '<div class="av"><div class="avl"><canvas id="av-c" width="144" height="256"></canvas><div class="brow"><button data-a="rot">Tourner</button><button data-a="rnd">Au hasard</button></div></div>' +
      '<div class="avr"><label>Nom</label><input id="av-name" maxlength="14" value="' + esc(name) + '">' +
      '<label>Peau</label>' + sw('skin', P.skin) + '<label>Coiffure</label>' + sel('hair', P.hairNames) + '<label>Cheveux</label>' + sw('hairC', P.hair) +
      '<label>Haut</label>' + sw('shirt', P.shirt) + '<label>Pantalon</label>' + sw('pants', P.pants) +
      '<label>Chapeau</label>' + sel('hat', P.hatNames, 'hat') + '<label>Lunettes</label>' + sel('glasses', P.glassNames, 'glasses') +
      '<div class="brow"><button data-a="ok" class="go">Valider</button>' + (opt.locked ? '' : '<button data-a="close">Annuler</button>') + '</div></div></div>',
    after: () => {
      const ni = $('av-name'); if (ni) { ni.addEventListener('input', () => { name = ni.value; }); ni.addEventListener('keydown', e => e.stopPropagation()); }
      const c = $('av-c'); if (!c) return;
      const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, 144, 256);
      g.drawImage(Sp.char(ap, dirs[rot], 0, false), 0, 0, 144, 256);
    },
    onAction: (a, b, mm) => {
      const ni = $('av-name'); if (ni) name = ni.value;
      if (a === 'col') ap[b.dataset.k] = b.dataset.v;
      else if (a === 'opt') {
        const k = b.dataset.k, n = k === 'hair' ? 6 : k === 'hat' ? 6 : 3;
        ap[k] = (ap[k] + (+b.dataset.d) + n) % n;
      } else if (a === 'rot') rot = (rot + 1) % 4;
      else if (a === 'rnd') { const r = Sp.randomAp(); r.hat = owned('hat', r.hat) ? r.hat : 0; r.glasses = owned('glasses', r.glasses) ? r.glasses : 0; Object.assign(ap, r); }
      else if (a === 'ok') {
        if (!owned('hat', ap.hat)) { UI.toast('Ce chapeau est verrouillé : achète-le à l\'Atelier Style.', 'err'); return; }
        if (!owned('glasses', ap.glasses)) { UI.toast('Ces lunettes sont verrouillées : achète-les à l\'Atelier Style.', 'err'); return; }
        const nm = (name || '').trim() || 'Roko';
        modal.locked = false; UI.closeModal();
        RG.Game.saveAvatar(ap, nm, opt.onDone);
        return;
      }
      mm.refresh();
    }
  });
  return m;
};

/* ---------- pause / titre ---------- */
UI.pause = () => {
  UI.modal({
    title: 'Pause', cls: 'pause',
    render: () => '<div class="menu"><button data-a="resume">Reprendre</button><button data-a="save">Sauvegarder</button><button data-a="snd">Son : ' + (U.sound ? 'activé' : 'coupé') + '</button><button data-a="help">Commandes</button><button data-a="reset" class="warn">Nouvelle partie</button></div>',
    onAction: (a, b, m) => {
      if (a === 'resume') UI.closeModal();
      else if (a === 'save') { RG.Game.save(true); }
      else if (a === 'snd') { U.sound = !U.sound; m.refresh(); }
      else if (a === 'help') UI.help();
      else if (a === 'reset') { if (confirm('Effacer la sauvegarde et recommencer ?')) RG.Game.reset(); }
    }
  });
};
UI.help = () => {
  UI.modal({
    title: 'Commandes', cls: 'help',
    render: () => '<ul class="keys"><li><b>ZQSD / Flèches</b> se déplacer</li><li><b>Maj</b> courir (utilise l\'endurance)</li><li><b>E / Espace</b> parler, utiliser, entrer en action</li><li><b>F</b> arme : menacer un passant, tirer</li><li><b>I</b> sac &nbsp; <b>J</b> quêtes &nbsp; <b>M</b> carte &nbsp; <b>Échap</b> pause</li><li>Marche vers une porte pour entrer dans un bâtiment.</li><li>Mange et bois pour rester en vie. Gagne ta vie en travaillant... ou pas.</li></ul>'
  });
};
UI.showTitle = (hasSave, handlers) => {
  el.title.classList.add('on');
  el.title.innerHTML = '<div class="tbox"><h1>Petit Village</h1><p>Un monde ouvert en pixels : travaille, joue, vole... à tes risques.</p><div class="menu">' + (hasSave ? '<button data-t="cont">Continuer</button>' : '') + '<button data-t="new">Nouvelle partie</button></div></div>';
  el.title.onclick = e => { const b = e.target.closest('[data-t]'); if (!b) return; U.sfx('click'); if (b.dataset.t === 'cont') handlers.cont(); else handlers.new(); };
};
UI.hideTitle = () => { el.title.classList.remove('on'); el.title.innerHTML = ''; };

/* ---------- détention ---------- */
UI.jail = (t, bail, fine) => {
  UI._jailT = t; UI._jailBail = bail; UI._jailFine = fine;
  if (!UI._jail) {
    UI.modal({ title: 'En détention', cls: 'jail', locked: true, render: () => '<p>Tu as été arrêté. Amende payée : <b>' + U.money(UI._jailFine || 0) + '</b>.</p><p>Temps restant : <b id="jt">' + Math.ceil(UI._jailT) + '</b> s</p><div class="brow"><button data-a="bail">Payer la caution : <span id="jb">' + U.money(UI._jailBail || 0) + '</span></button></div>', onAction: (a) => { if (a === 'bail') RG.Game.payBail(); } });
    UI._jail = true;
  }
  UI._jailT = t; UI._jailBail = bail; UI._jailFine = fine;
  const jt = $('jt'); if (jt) jt.textContent = Math.ceil(t);
  const jb = $('jb'); if (jb) jb.textContent = U.money(bail);
};
UI.jailEnd = () => { UI._jail = false; if (modal && modal.cls === 'jail') { modal.locked = false; UI.closeModal(); } };
})();
