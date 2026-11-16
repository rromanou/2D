(() => {
'use strict';
const RG = window.RG, U = RG.U, Sp = RG.Sp, T = RG.T, R = U.R;
const World = RG.World = { maps: {} };
const G = 0, RD = 1, WA = 2, SA = 3, PV = 4, PIER = 6, DIRT = 7;
RG.TILE = { G, RD, WA, SA, PV, PIER, DIRT };

function mkMap(name, w, h, outdoor) {
  return { name, w, h, outdoor, ground: new Uint8Array(w * h), solid: new Uint8Array(w * h), statics: [], doors: [], zones: [], npcs: [], animals: [],
           lights: [], houses: [], trees: [], bg: null, title: name, ret: null };
}
World.get = n => World.maps[n];
World.solidAt = (m, x, y) => {
  const tx = Math.floor(x / T), ty = Math.floor(y / T);
  if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) return 1;
  return m.solid[ty * m.w + tx];
};
World.hit = (m, x, y, hw, hh) => World.solidAt(m, x - hw, y - 1) || World.solidAt(m, x + hw, y - 1) || World.solidAt(m, x - hw, y - hh) || World.solidAt(m, x + hw, y - hh);
World.groundAt = (m, x, y) => {
  const tx = Math.floor(x / T), ty = Math.floor(y / T);
  if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) return -1;
  return m.ground[ty * m.w + tx];
};
const gi = (m, x, y) => y * m.w + x;
function rectFill(m, x, y, w, h, g) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < m.w && j < m.h) m.ground[gi(m, i, j)] = g; }
function rectSolid(m, x, y, w, h, v) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < m.w && j < m.h) m.solid[gi(m, i, j)] = v === undefined ? 1 : v; }

/* ------------------------------------------------------------------ */
/*  Définition des intérieurs                                          */
/* ------------------------------------------------------------------ */
const INT = {
  super: { title: 'Supermarché', w: 16, h: 11, floor: 'tile', wall: '#dfe9d8',
    props: [{ k: 'shelf', x: 2, y: 2, w: 3 }, { k: 'shelf', x: 6, y: 2, w: 3 }, { k: 'shelf', x: 10, y: 2, w: 3 }, { k: 'shelf', x: 3, y: 5, w: 3 }, { k: 'shelf', x: 8, y: 5, w: 3 }, { k: 'shelf', x: 12, y: 5, w: 2 },
      { k: 'counter', x: 10, y: 8, w: 4 }, { k: 'register', x: 12, y: 8, w: 1 }, { k: 'plant', x: 14, y: 2 }, { k: 'poster', x: 1, y: 0, o: { col: '#e8a93b' } }, { k: 'poster', x: 14, y: 0, o: { col: '#4b78c8' } }],
    npcs: [{ id: 'marcel', x: 11, y: 7, dir: 'down' }],
    zones: [{ x: 12, y: 9, w: 2, h: 1, action: 'cashier', label: 'Travailler à la caisse' }], wander: 2 },
  cafe: { title: 'Café Chez Mimi', w: 12, h: 9, floor: 'wood', wall: '#f0d8c4',
    props: [{ k: 'counter', x: 7, y: 3, w: 4, o: { top: '#f4e4cc' } }, { k: 'table', x: 2, y: 4, w: 2, h: 1, o: { cloth: '#f48fb1' } }, { k: 'chair', x: 1, y: 4 }, { k: 'chair', x: 4, y: 4 },
      { k: 'table', x: 2, y: 6, w: 2, h: 1, o: { cloth: '#fff7e6' } }, { k: 'chair', x: 1, y: 6 }, { k: 'chair', x: 4, y: 6 }, { k: 'plant', x: 10, y: 2 }, { k: 'rug', x: 6, y: 5, w: 4, h: 2, o: { col: '#c8503f' }, flat: 1 }],
    npcs: [{ id: 'mimi', x: 8, y: 2, dir: 'down' }], wander: 2 },
  studio: { title: 'Atelier Style', w: 12, h: 9, floor: 'wood', wall: '#e6dcee',
    props: [{ k: 'mirror', x: 2, y: 0 }, { k: 'mirror', x: 4, y: 0 }, { k: 'counter', x: 7, y: 4, w: 3, o: { top: '#d9c8ee', front: '#6a4a8a' } }, { k: 'shelf', x: 6, y: 2, w: 3 }, { k: 'plant', x: 10, y: 2 }, { k: 'rug', x: 2, y: 4, w: 3, h: 2, o: { col: '#8a63c9' }, flat: 1 }],
    npcs: [{ id: 'lea', x: 8, y: 3, dir: 'down' }],
    zones: [{ x: 2, y: 2, w: 3, h: 2, action: 'mirror', label: 'Se regarder dans le miroir' }] },
  pet: { title: 'Animalerie', w: 12, h: 9, floor: 'wood', wall: '#dcecd0',
    props: [{ k: 'counter', x: 7, y: 4, w: 3, o: { top: '#e8d8b0' } }, { k: 'crate', x: 1, y: 2 }, { k: 'crate', x: 2, y: 2 }, { k: 'crate', x: 4, y: 2 }, { k: 'shelf', x: 6, y: 2, w: 3 }, { k: 'plant', x: 10, y: 2 }, { k: 'rug', x: 2, y: 5, w: 3, h: 2, o: { col: '#6fbf5a' }, flat: 1 }],
    npcs: [{ id: 'zelie', x: 8, y: 3, dir: 'down' }], animals: [{ type: 'chien', v: 1, x: 3, y: 5 }, { type: 'chat', v: 0, x: 4, y: 6 }, { type: 'lapin', v: 0, x: 2, y: 6 }] },
  hardware: { title: 'Quincaillerie', w: 12, h: 9, floor: 'wood', wall: '#e8dcc0',
    props: [{ k: 'counter', x: 7, y: 4, w: 3 }, { k: 'shelf', x: 1, y: 2, w: 3 }, { k: 'shelf', x: 5, y: 2, w: 2 }, { k: 'crate', x: 2, y: 5 }, { k: 'crate', x: 3, y: 5 }, { k: 'barrel', x: 10, y: 6 }, { k: 'plant', x: 10, y: 2 }],
    npcs: [{ id: 'gerard', x: 8, y: 3, dir: 'down' }] },
  bank: { title: 'Banque', w: 14, h: 10, floor: 'tile', wall: '#e4e0d2',
    props: [{ k: 'counter', x: 4, y: 4, w: 6, o: { top: '#d8d4c4', front: '#4a5a6f' } }, { k: 'chest', x: 10, y: 2 }, { k: 'chest', x: 11, y: 2 }, { k: 'chest', x: 12, y: 2 }, { k: 'plant', x: 1, y: 2 }, { k: 'plant', x: 12, y: 7 },
      { k: 'rug', x: 4, y: 6, w: 6, h: 2, o: { col: '#4a5a6f' }, flat: 1 }],
    npcs: [{ id: 'helene', x: 7, y: 3, dir: 'down' }] },
  jobs: { title: 'Centre d\'emploi', w: 12, h: 9, floor: 'carpet', floorC: '#6f8fc2', wall: '#e8ecf4',
    props: [{ k: 'board', x: 1, y: 0, w: 3 }, { k: 'board', x: 5, y: 0, w: 3 }, { k: 'counter', x: 7, y: 4, w: 3 }, { k: 'desk', x: 2, y: 4, w: 2 }, { k: 'chair', x: 2, y: 5 }, { k: 'plant', x: 10, y: 2 }],
    npcs: [{ id: 'armand', x: 8, y: 3, dir: 'down' }] },
  post: { title: 'Bureau de poste', w: 12, h: 9, floor: 'tile', wall: '#e4ecf6',
    props: [{ k: 'counter', x: 7, y: 4, w: 3, o: { top: '#e8ecf4', front: '#2f4a8c' } }, { k: 'crate', x: 1, y: 2 }, { k: 'crate', x: 2, y: 2 }, { k: 'crate', x: 1, y: 3 }, { k: 'shelf', x: 4, y: 2, w: 2 }, { k: 'plant', x: 10, y: 2 }],
    npcs: [{ id: 'rejean', x: 8, y: 3, dir: 'down' }] },
  police: { title: 'Commissariat', w: 14, h: 10, floor: 'tile', wall: '#d6dcea',
    props: [{ k: 'counter', x: 3, y: 4, w: 4, o: { top: '#c8d0e0', front: '#2f4a8c' } }, { k: 'bars', x: 10, y: 5, w: 3, h: 1 }, { k: 'bars', x: 9, y: 2, w: 1, h: 4 }, { k: 'rug', x: 10, y: 2, w: 3, h: 3, o: { col: '#6a6a75' }, flat: 1 },
      { k: 'desk', x: 2, y: 7, w: 2 }, { k: 'plant', x: 1, y: 2 }, { k: 'crate', x: 11, y: 7 }, { k: 'board', x: 3, y: 0, w: 3 }],
    npcs: [{ id: 'dubois', x: 4, y: 3, dir: 'down' }],
    zones: [{ x: 3, y: 5, w: 4, h: 1, action: 'bail', label: 'Payer une amende / caution' }], jail: { x: 11, y: 3 } },
  town: { title: 'Mairie', w: 14, h: 10, floor: 'carpet', floorC: '#a8505a', wall: '#f0e6cc',
    props: [{ k: 'counter', x: 5, y: 4, w: 4, o: { top: '#c9a06a', front: '#6a4128' } }, { k: 'rug', x: 4, y: 6, w: 6, h: 2, o: { col: '#2f4a8c' }, flat: 1 }, { k: 'plant', x: 1, y: 2 }, { k: 'plant', x: 12, y: 2 },
      { k: 'poster', x: 2, y: 0, o: { col: '#2f4a8c' } }, { k: 'poster', x: 11, y: 0, o: { col: '#c8503f' } }, { k: 'sofa', x: 1, y: 6, w: 2 }, { k: 'sofa', x: 11, y: 6, w: 2 }],
    npcs: [{ id: 'maire', x: 6, y: 3, dir: 'down' }] },
  home: { title: 'Chez moi', w: 10, h: 8, floor: 'wood', wall: '#f0e0d0', props: [], zones: [], npcs: [] },
  cine: { title: 'Cinéma', w: 12, h: 9, floor: 'carpet', floorC: '#4a2a5a', wall: '#2b1b3a',
    props: [{ k: 'screen', x: 2, y: 0, w: 8 }, { k: 'sofa', x: 2, y: 4, w: 3, o: { col: '#c8403a' } }, { k: 'sofa', x: 5, y: 4, w: 3, o: { col: '#c8403a' } }, { k: 'sofa', x: 2, y: 6, w: 3, o: { col: '#c8403a' } }, { k: 'sofa', x: 5, y: 6, w: 3, o: { col: '#c8403a' } },
      { k: 'counter', x: 9, y: 3, w: 2, o: { top: '#3b2a24', front: '#241814' } }, { k: 'popcorn', x: 9, y: 3 }, { k: 'plant', x: 10, y: 6 }],
    npcs: [{ id: 'clara', x: 9, y: 2, dir: 'down' }],
    zones: [{ x: 2, y: 5, w: 6, h: 1, action: 'cinema', label: 'Voir un film (12 $)' }] },
  resto: { title: 'Restaurant', w: 14, h: 10, floor: 'wood', wall: '#f0d8c4',
    props: [{ k: 'table', x: 2, y: 5, w: 2, h: 1, o: { cloth: '#f48fb1' } }, { k: 'chair', x: 1, y: 5 }, { k: 'chair', x: 4, y: 5 }, { k: 'table', x: 2, y: 7, w: 2, h: 1, o: { cloth: '#fff7e6' } }, { k: 'chair', x: 1, y: 7 }, { k: 'chair', x: 4, y: 7 },
      { k: 'table', x: 7, y: 5, w: 2, h: 1, o: { cloth: '#fff7e6' } }, { k: 'chair', x: 6, y: 5 }, { k: 'chair', x: 9, y: 5 }, { k: 'table', x: 7, y: 7, w: 2, h: 1, o: { cloth: '#f48fb1' } }, { k: 'chair', x: 6, y: 7 }, { k: 'chair', x: 9, y: 7 },
      { k: 'counter', x: 9, y: 3, w: 4, o: { top: '#f4e4cc' } }, { k: 'oven', x: 2, y: 2, w: 3 }, { k: 'plant', x: 12, y: 7 }],
    npcs: [{ id: 'bruno', x: 10, y: 2, dir: 'down' }], zones: [{ x: 5, y: 3, w: 3, h: 1, action: 'serve', label: 'Servir les clients (serveur)' }], wander: 2 },
  biblio: { title: 'Bibliothèque', w: 12, h: 9, floor: 'wood', wall: '#e8dcc0',
    props: [{ k: 'bookshelf', x: 1, y: 2, w: 3 }, { k: 'bookshelf', x: 5, y: 2, w: 3 }, { k: 'bookshelf', x: 9, y: 2, w: 2 }, { k: 'table', x: 3, y: 5, w: 3, h: 1, o: { cloth: '#e8dcc0' } }, { k: 'chair', x: 2, y: 5 }, { k: 'chair', x: 6, y: 5 },
      { k: 'desk', x: 8, y: 5, w: 3 }, { k: 'plant', x: 1, y: 6 }, { k: 'rug', x: 3, y: 6, w: 4, h: 1, o: { col: '#6a4a8a' }, flat: 1 }],
    npcs: [{ id: 'odile', x: 9, y: 4, dir: 'down' }],
    zones: [{ x: 1, y: 3, w: 10, h: 1, action: 'read', label: 'Lire un livre' }, { x: 2, y: 7, w: 4, h: 1, action: 'shelve', label: 'Ranger les livres (bibliothécaire)' }] },
  gym: { title: 'Salle de sport', w: 14, h: 10, floor: 'tile', wall: '#d8dce8',
    props: [{ k: 'treadmill', x: 2, y: 3 }, { k: 'treadmill', x: 4, y: 3 }, { k: 'treadmill', x: 6, y: 3 }, { k: 'weights', x: 9, y: 3 }, { k: 'weights', x: 11, y: 3 }, { k: 'rug', x: 2, y: 6, w: 5, h: 2, o: { col: '#4a5a6f' }, flat: 1 }, { k: 'plant', x: 12, y: 7 }, { k: 'poster', x: 8, y: 0, o: { col: '#e8a93b' } }],
    npcs: [{ id: 'hector', x: 10, y: 6, dir: 'down' }],
    zones: [{ x: 2, y: 4, w: 5, h: 1, action: 'gym', label: 'Courir sur le tapis (5 $)' }, { x: 9, y: 4, w: 4, h: 1, action: 'gym', label: 'Soulever des poids (5 $)' }], wander: 2 },
  furn: { title: 'Meubles & Cie', w: 16, h: 10, floor: 'wood', wall: '#e8dcc0',
    props: [{ k: 'sofa', x: 2, y: 3, w: 2, o: { col: '#8a63c9' } }, { k: 'bed', x: 5, y: 3, w: 2, h: 2 }, { k: 'tvset', x: 9, y: 3, w: 2 }, { k: 'bookshelf', x: 12, y: 3, w: 2 }, { k: 'piano', x: 2, y: 6, w: 2 }, { k: 'fridge', x: 6, y: 6 }, { k: 'stove', x: 7, y: 6 }, { k: 'wardrobe', x: 4, y: 6 },
      { k: 'counter', x: 11, y: 6, w: 4 }, { k: 'plant', x: 14, y: 8 }, { k: 'rug', x: 8, y: 7, w: 3, h: 2, o: { col: '#c8503f' }, flat: 1 }],
    npcs: [{ id: 'fanny', x: 12, y: 5, dir: 'down' }], wander: 1 },
  gifts: { title: 'Boutique cadeaux', w: 10, h: 8, floor: 'carpet', floorC: '#d8a0b8', wall: '#f8e6ee',
    props: [{ k: 'counter', x: 5, y: 3, w: 3, o: { top: '#f8e6ee', front: '#a8506a' } }, { k: 'plant', x: 1, y: 2 }, { k: 'plant', x: 2, y: 2 }, { k: 'plant', x: 1, y: 3 }, { k: 'shelf', x: 1, y: 5, w: 2 }, { k: 'plant', x: 8, y: 6 }],
    npcs: [{ id: 'gisele', x: 6, y: 2, dir: 'down' }] },
  clinic: { title: 'Clinique', w: 12, h: 9, floor: 'tile', wall: '#e4f0f0',
    props: [{ k: 'bed', x: 2, y: 3, w: 2, h: 2, o: { col: '#e8f0f0' } }, { k: 'counter', x: 7, y: 4, w: 3, o: { top: '#e8f0f0', front: '#4a7a9a' } }, { k: 'plant', x: 10, y: 2 }, { k: 'chair', x: 3, y: 6 }],
    npcs: [{ id: 'docteur', x: 8, y: 3, dir: 'down' }] },
  arcade: { title: 'Arcade', w: 12, h: 9, floor: 'dark', wall: '#2b2540',
    props: [{ k: 'arcade', x: 2, y: 2, o: { col: '#4b78c8' } }, { k: 'arcade', x: 3, y: 2, o: { col: '#c8503f' } }, { k: 'arcade', x: 4, y: 2, o: { col: '#6fbf5a' } }, { k: 'arcade', x: 6, y: 2, o: { col: '#e8a93b' } }, { k: 'arcade', x: 7, y: 2, o: { col: '#8a63c9' } },
      { k: 'neon', x: 9, y: 0, w: 3, o: { col: '#4fd8ff' } }, { k: 'neon', x: 2, y: 0, w: 4, o: { col: '#ff4fa0' } }, { k: 'counter', x: 8, y: 5, w: 3, o: { top: '#3b3b44', front: '#22222a' } }, { k: 'rug', x: 2, y: 5, w: 4, h: 2, o: { col: '#3a2a5a' }, flat: 1 }],
    npcs: [{ id: 'alex', x: 9, y: 4, dir: 'down' }],
    zones: [{ x: 2, y: 3, w: 6, h: 1, action: 'arcade', label: 'Jouer à l\'arcade (2 $)' }], wander: 2 },
  bar: { title: 'Bar', w: 14, h: 9, floor: 'wood', wall: '#4a3238',
    props: [{ k: 'counter', x: 7, y: 3, w: 6, o: { top: '#6a4128', front: '#3b2418' } }, { k: 'stool', x: 7, y: 4 }, { k: 'stool', x: 9, y: 4 }, { k: 'stool', x: 11, y: 4 }, { k: 'table', x: 9, y: 6, w: 2, h: 1, o: { cloth: '#6a4128' } }, { k: 'chair', x: 8, y: 6 }, { k: 'chair', x: 11, y: 6 },
      { k: 'rug', x: 2, y: 4, w: 5, h: 3, o: { col: '#8a2a5a' }, flat: 1 }, { k: 'neon', x: 2, y: 0, w: 3, o: { col: '#ffd54f' } }, { k: 'plant', x: 12, y: 7 }],
    npcs: [{ id: 'mario', x: 9, y: 2, dir: 'down' }],
    zones: [{ x: 2, y: 4, w: 5, h: 3, action: 'dance', label: 'Danser' }, { x: 8, y: 2, w: 4, h: 1, action: 'tend', label: 'Préparer des cocktails (barman)' }], wander: 3 },
  bijou: { title: 'Bijouterie', w: 10, h: 8, floor: 'tile', wall: '#f0e4ec',
    props: [{ k: 'counter', x: 2, y: 3, w: 6, o: { top: '#f8f0f4', front: '#a8506a' } }, { k: 'plant', x: 8, y: 6 }, { k: 'rug', x: 3, y: 5, w: 4, h: 2, o: { col: '#8a2a5a' }, flat: 1 }],
    npcs: [{ id: 'bijoutier', x: 5, y: 2, dir: 'down' }], wander: 1 },
  tribunal: { title: 'Tribunal des familles', w: 12, h: 9, floor: 'wood', wall: '#d8d0c0',
    props: [{ k: 'desk', x: 4, y: 3, w: 4 }, { k: 'bookshelf', x: 1, y: 2, w: 2 }, { k: 'bookshelf', x: 9, y: 2, w: 2 }, { k: 'chair', x: 5, y: 5 }, { k: 'chair', x: 7, y: 5 }, { k: 'plant', x: 10, y: 6 }],
    npcs: [{ id: 'juge', x: 5, y: 2, dir: 'down' }], wander: 2 },
  pizz: { title: 'Pizzeria', w: 12, h: 9, floor: 'tile', wall: '#f4d8c0',
    props: [{ k: 'counter', x: 6, y: 3, w: 5, o: { top: '#f4e4cc', front: '#c8503f' } }, { k: 'oven', x: 1, y: 2, w: 3 }, { k: 'table', x: 2, y: 5, w: 2, h: 1, o: { cloth: '#c8503f' } }, { k: 'chair', x: 1, y: 5 }, { k: 'chair', x: 4, y: 5 }, { k: 'table', x: 7, y: 6, w: 2, h: 1, o: { cloth: '#fff7e6' } }, { k: 'plant', x: 10, y: 6 }],
    npcs: [{ id: 'pizzaiolo', x: 8, y: 2, dir: 'down' }], wander: 2 },
  bakery: { title: 'Boulangerie', w: 10, h: 8, floor: 'tile', wall: '#f6e4cc',
    props: [{ k: 'counter', x: 5, y: 3, w: 4, o: { top: '#f4e4cc', front: '#c8a070' } }, { k: 'oven', x: 1, y: 2, w: 3 }, { k: 'table', x: 2, y: 5, w: 2, h: 1, o: { cloth: '#f48fb1' } }, { k: 'chair', x: 1, y: 5 }, { k: 'chair', x: 4, y: 5 }, { k: 'plant', x: 8, y: 6 }],
    npcs: [{ id: 'boulanger', x: 6, y: 2, dir: 'down' }] },
  black: { title: 'Marché noir', w: 12, h: 9, floor: 'dark', wall: '#3a3440',
    props: [{ k: 'counter', x: 7, y: 4, w: 3, o: { top: '#4a4455', front: '#2b2530' } }, { k: 'crate', x: 1, y: 2 }, { k: 'crate', x: 2, y: 2 }, { k: 'crate', x: 1, y: 3 }, { k: 'barrel', x: 10, y: 6 }, { k: 'barrel', x: 10, y: 7 }, { k: 'crate', x: 4, y: 2 }, { k: 'poster', x: 6, y: 0, o: { col: '#c8503f' } }],
    npcs: [{ id: 'vipere', x: 8, y: 3, dir: 'down' }] },
  casino: { title: 'Casino', w: 28, h: 18, floor: 'carpet', floorC: '#6a2442', wall: '#2b1b3a', big: true,
    props: [
      { k: 'slot', x: 3, y: 2, o: { col: '#c8503f' } }, { k: 'slot', x: 4, y: 2, o: { col: '#4b78c8' } }, { k: 'slot', x: 5, y: 2, o: { col: '#6fbf5a' } }, { k: 'slot', x: 6, y: 2, o: { col: '#e8a93b' } }, { k: 'slot', x: 7, y: 2, o: { col: '#8a63c9' } },
      { k: 'counter', x: 21, y: 3, w: 5, o: { top: '#3b2a24', front: '#241814' } },
      { k: 'roulette', x: 3, y: 7, w: 4, h: 3 }, { k: 'bjtable', x: 10, y: 7, w: 4, h: 3 }, { k: 'pokertable', x: 18, y: 7, w: 5, h: 3 },
      { k: 'neon', x: 10, y: 0, w: 4, o: { col: '#ff4fa0' } }, { k: 'neon', x: 15, y: 0, w: 4, o: { col: '#4fd8ff' } }, { k: 'neon', x: 3, y: 0, w: 5, o: { col: '#ffd54f' } },
      { k: 'plant', x: 1, y: 2 }, { k: 'plant', x: 26, y: 2 }, { k: 'plant', x: 1, y: 15 }, { k: 'plant', x: 26, y: 15 },
      { k: 'rug', x: 11, y: 12, w: 6, h: 3, o: { col: '#2b1b3a' }, flat: 1 }, { k: 'rug', x: 2, y: 6, w: 6, h: 5, o: { col: '#4a1a30' }, flat: 1, over: 1 },
      { k: 'rug', x: 9, y: 6, w: 6, h: 5, o: { col: '#4a1a30' }, flat: 1, over: 1 }, { k: 'rug', x: 16, y: 5, w: 9, h: 7, o: { col: '#4a1a30' }, flat: 1, over: 1 }],
    npcs: [{ id: 'victor', x: 4, y: 6, dir: 'down' }, { id: 'sophie', x: 11, y: 6, dir: 'down' }, { id: 'leon', x: 23, y: 2, dir: 'down' }, { id: 'videur', x: 12, y: 15, dir: 'down' }],
    zones: [{ x: 2, y: 6, w: 6, h: 5, action: 'roulette', label: 'Jouer à la roulette' }, { x: 9, y: 6, w: 6, h: 5, action: 'blackjack', label: 'Jouer au blackjack' },
      { x: 16, y: 5, w: 9, h: 7, action: 'poker', label: 'Table de poker' },
      { x: 3, y: 3, w: 1, h: 1, action: 'slot', label: 'Machine à sous' }, { x: 4, y: 3, w: 1, h: 1, action: 'slot', label: 'Machine à sous' }, { x: 5, y: 3, w: 1, h: 1, action: 'slot', label: 'Machine à sous' },
      { x: 6, y: 3, w: 1, h: 1, action: 'slot', label: 'Machine à sous' }, { x: 7, y: 3, w: 1, h: 1, action: 'slot', label: 'Machine à sous' }],
    seats: { rl: [[2, 8, 'right'], [7, 8, 'left'], [4, 10, 'up'], [6, 10, 'up']], bj: [[10, 10, 'up'], [13, 10, 'up']],
      poker: [[19, 6, 'down'], [21, 6, 'down'], [17, 8, 'right'], [23, 8, 'left'], [20, 10, 'up']] },
    wander: 3 }
};
World.INT = INT;

/* ------------------------------------------------------------------ */
/*  Construction d'un intérieur                                        */
/* ------------------------------------------------------------------ */
function floorTile(c, kind, fc, tx, ty) {
  const x = tx * T, y = ty * T;
  if (kind === 'wood') {
    R(c, x, y, T, T, '#c9a06a');
    for (let k = 0; k < 4; k++) R(c, x, y + k * 4 + 3, T, 1, '#b58e5a');
    R(c, x + Math.floor(U.hash(tx, ty, 1) * 14), y, 1, 4, '#b58e5a'); R(c, x + Math.floor(U.hash(tx, ty, 2) * 14), y + 8, 1, 4, '#b58e5a');
  } else if (kind === 'tile') {
    R(c, x, y, T, T, ((tx + ty) & 1) ? '#e8e4d8' : '#d9d4c4'); R(c, x, y, T, 1, '#cfcab8'); R(c, x, y, 1, T, '#cfcab8');
  } else if (kind === 'carpet') {
    const col = fc || '#a8505a'; R(c, x, y, T, T, col);
    R(c, x + 3, y + 3, 2, 2, U.shade(col, 18)); R(c, x + 11, y + 3, 2, 2, U.shade(col, 18)); R(c, x + 7, y + 7, 2, 2, U.shade(col, 18)); R(c, x + 3, y + 11, 2, 2, U.shade(col, 18)); R(c, x + 11, y + 11, 2, 2, U.shade(col, 18));
    if (((tx + ty) & 1)) R(c, x, y, T, T, 'rgba(0,0,0,0.12)');
  } else {
    R(c, x, y, T, T, '#3b3844'); R(c, x + Math.floor(U.hash(tx, ty, 3) * 12), y + Math.floor(U.hash(tx, ty, 4) * 12), 3, 1, '#2f2c37'); R(c, x, y, T, 1, '#34313d');
  }
}
function buildInterior(name, def) {
  const m = mkMap(name, def.w, def.h, false);
  m.title = def.title; m.def = def;
  const bg = U.mk(def.w * T, def.h * T), c = bg.getContext('2d');
  for (let ty = 0; ty < def.h; ty++) for (let tx = 0; tx < def.w; tx++) {
    const wall = ty < 2 || tx === 0 || tx === def.w - 1 || ty === def.h - 1;
    if (wall) {
      m.solid[gi(m, tx, ty)] = 1;
      const wc = def.wall || '#e8dcc8';
      R(c, tx * T, ty * T, T, T, ty < 2 ? wc : U.shade(wc, -26));
      if (ty < 2 && tx > 0 && tx < def.w - 1) {
        R(c, tx * T, ty * T + (ty === 1 ? 12 : 0), T, ty === 1 ? 4 : 1, U.shade(wc, -34));
        if (ty === 0) R(c, tx * T, ty * T + 8, T, 1, U.shade(wc, -12));
      }
      if (ty === def.h - 1) R(c, tx * T, ty * T, T, 3, U.shade(wc, -48));
    } else floorTile(c, def.floor, def.floorC, tx, ty);
  }
  // porte de sortie
  const dx = Math.floor(def.w / 2), dy = def.h - 1;
  m.solid[gi(m, dx, dy)] = 0;
  R(c, dx * T, dy * T, T, T, '#5a3a22'); R(c, dx * T + 2, dy * T + 2, 12, 12, '#8b5a3c'); R(c, dx * T + 10, dy * T + 8, 2, 2, '#f4d06f');
  R(c, dx * T - 1, (dy - 1) * T + 10, 18, 6, 'rgba(60,40,24,0.55)');
  m.doors.push({ x: dx, y: dy, exit: true });
  m.spawn = { x: dx * T + 8, y: (dy - 1) * T + 12 };
  // décor : tapis d'abord
  for (const p of def.props) if (p.flat) Sp.propRot(c, p.k, p.x, p.y, p.w0 || p.w || 1, p.h0 || p.h || 1, p.o, p.r);
  for (const p of def.props) {
    if (p.flat) continue;
    Sp.propRot(c, p.k, p.x, p.y, p.w0 || p.w || 1, p.h0 || p.h || 1, p.o, p.r);
    if (p.k === 'mirror' || p.k === 'poster' || p.k === 'board' || p.k === 'neon' || p.k === 'tv' || p.k === 'screen') continue;
    const w = p.w || 1, h = p.k === 'plant' || p.k === 'chest' || p.k === 'crate' || p.k === 'barrel' ? 1 : (p.h || 1);
    rectSolid(m, p.x, p.y, w, h, 1);
  }
  for (const z of def.zones || []) m.zones.push({ x: z.x * T, y: z.y * T, w: z.w * T, h: z.h * T, action: z.action, label: z.label, data: z.data || {} });
  for (const n of def.npcs || []) m.npcs.push(Object.assign({ static: true }, n));
  for (const a of def.animals || []) m.animals.push(a);
  m.bg = bg;
  if (def.jail) m.jail = { x: def.jail.x * T + 8, y: def.jail.y * T + 12 };
  if (def.seats) m.seats = def.seats;
  m.wanderCount = def.wander || 0;
  return m;
}

/* ------------------------------------------------------------------ */
/*  Carte extérieure                                                   */
/* ------------------------------------------------------------------ */
const MW = 128, MH = 96;
const MAIN_B = [
  { id: 'pet',      bx: 4,  w: 6,  o: { kind: 'shop', text: 'ANIMALERIE', signBg: '#3f7a4a', awn: ['#6fbf5a', '#fff7e6'], wall: '#f3e4c2' } },
  { id: 'hardware', bx: 12, w: 6,  o: { kind: 'shop', text: 'QUINCAILLERIE', signBg: '#8a5a3a', awn: ['#e8a93b', '#fff7e6'], wall: '#e8dcc0' } },
  { id: 'studio',   bx: 20, w: 6,  o: { kind: 'shop', text: 'ATELIER STYLE', signBg: '#8a63c9', awn: ['#d65fa3', '#fff7e6'], wall: '#efe4f6' } },
  { id: 'super',    bx: 34, w: 9,  o: { kind: 'shop', text: 'SUPERMARCHE', signBg: '#2f7d3f', awn: ['#4fb04f', '#fff7e6'], wall: '#e4efdc' } },
  { id: 'bank',     bx: 45, w: 7,  o: { kind: 'shop', text: 'BANQUE', signBg: '#2f4a6f', extra: 'columns', awn: ['#4a5a6f', '#d8d4c4'], wall: '#e8e4d8', roof: '#8d8d98' } },
  { id: 'jobs',     bx: 54, w: 6,  o: { kind: 'shop', text: 'EMPLOI', signBg: '#e8a93b', signFg: '#2b2b33', awn: ['#4b78c8', '#fff7e6'], wall: '#e8ecf4' } },
  { id: 'post',     bx: 66, w: 6,  o: { kind: 'shop', text: 'POSTE', signBg: '#2f4a8c', awn: ['#e8c93a', '#2f4a8c'], wall: '#e4ecf6' } },
  { id: 'police',   bx: 74, w: 9,  o: { kind: 'shop', text: 'POLICE', signBg: '#1b2a52', extra: 'bars', awn: ['#2f4a8c', '#d6dcea'], wall: '#d6dcea', roof: '#4a5a7a' } },
  { id: 'town',     bx: 85, w: 8,  o: { kind: 'shop', text: 'MAIRIE', signBg: '#6a2442', extra: 'columns', awn: ['#a8505a', '#f0e6cc'], wall: '#f0e6cc', roof: '#8a5a3a' } },
  { id: 'casino',   bx: 98, w: 14, o: { kind: 'shop', text: 'CASINO', signBg: '#2b1b3a', signFg: '#ffd54f', extra: 'lights', awn: ['#c8403a', '#ffd54f'], wall: '#4a2a5a', roof: '#2b1b3a' } },
  { id: 'cafe',     bx: 114, w: 6, o: { kind: 'shop', text: 'CAFE', signBg: '#a8505a', awn: ['#f48fb1', '#fff7e6'], wall: '#f6e4d8' } }
];

const MAIN_B2 = [
  { id: 'cine',   bx: 3,  w: 7, o: { kind: 'shop', text: 'CINEMA', signBg: '#4a2a5a', signFg: '#ffd54f', extra: 'lights', awn: ['#c8403a', '#ffd54f'], wall: '#d8c8e8' } },
  { id: 'resto',  bx: 11, w: 7, o: { kind: 'shop', text: 'RESTAURANT', signBg: '#a8503f', awn: ['#e8a93b', '#fff7e6'], wall: '#f6e4d8' } },
  { id: 'biblio', bx: 19, w: 7, o: { kind: 'shop', text: 'BIBLIOTHEQUE', signBg: '#6a4a2a', extra: 'columns', awn: ['#8a5a3a', '#e8dcc0'], wall: '#e8dcc0' } },
  { id: 'gym',    bx: 33, w: 7, o: { kind: 'shop', text: 'GYM', signBg: '#2f4a6f', awn: ['#e8a93b', '#2b2b33'], wall: '#d8dce8' } },
  { id: 'furn',   bx: 41, w: 8, o: { kind: 'shop', text: 'MEUBLES', signBg: '#8a5a3a', awn: ['#4fb04f', '#fff7e6'], wall: '#efe4d0' } },
  { id: 'gifts',  bx: 50, w: 6, o: { kind: 'shop', text: 'CADEAUX', signBg: '#a8506a', awn: ['#f48fb1', '#fff7e6'], wall: '#f8e6ee' } },
  { id: 'clinic', bx: 57, w: 5, o: { kind: 'shop', text: 'CLINIQUE', signBg: '#3a8aa8', awn: ['#fff', '#c8403a'], wall: '#e4f0f0' } },
  { id: 'arcade', bx: 66, w: 7, o: { kind: 'shop', text: 'ARCADE', signBg: '#2b2540', signFg: '#4fd8ff', extra: 'lights', awn: ['#4b78c8', '#ffd54f'], wall: '#4a4570' } },
  { id: 'bar',    bx: 74, w: 7, o: { kind: 'shop', text: 'BAR', signBg: '#4a3238', signFg: '#ffd54f', awn: ['#8a2a5a', '#ffd54f'], wall: '#6a4a52' } },
  { id: 'bakery', bx: 82, w: 7, o: { kind: 'shop', text: 'BOULANGERIE', signBg: '#c89a4a', signFg: '#2b1b14', awn: ['#e8a93b', '#fff7e6'], wall: '#f6e4cc' } },
  { id: 'bijou', bx: 97, w: 7, o: { kind: 'shop', text: 'BIJOUTERIE', signBg: '#6a2a5a', signFg: '#ffe9a8', extra: 'lights', awn: ['#8a2a5a', '#f8f0f4'], wall: '#f0e4ec' } },
  { id: 'tribunal', bx: 105, w: 8, o: { kind: 'shop', text: 'TRIBUNAL', signBg: '#4a4a52', extra: 'columns', awn: ['#6a6a72', '#d8d0c0'], wall: '#d8d0c0' } },
  { id: 'pizz', bx: 114, w: 7, o: { kind: 'shop', text: 'PIZZERIA', signBg: '#a8302a', awn: ['#4fb04f', '#fff7e6'], wall: '#f4d8c0' } }
];
const HWALLS = ['#f3e4c2', '#e8d8b8', '#dfe8d0', '#e6dcee', '#f0d8d0', '#d8e8f0'];
const HROOFS = ['#c8503f', '#4b78c8', '#6a8f4f', '#8a63c9', '#b8803a', '#3fa9a0'];
const HDOORS = ['#8b5a3c', '#4b78c8', '#6a8f4f', '#c8503f', '#6b4429'];

function buildOutdoor() {
  const m = mkMap('world', MW, MH, true);
  m.title = 'Village';
  const rnd = U.rng(20261113);
  const placed = []; // empreintes bâties : {x,y,w,h}

  // 1. pavés
  for (const ry of [22, 44, 66]) rectFill(m, 2, ry, 124, 2, PV);
  rectFill(m, 56, 40, 14, 14, PV);
  // routes
  for (const ry of [24, 35, 46, 68]) rectFill(m, 2, ry, 124, 2, RD);
  for (const rx of [30, 62, 94]) rectFill(m, rx, 2, 2, 92, RD);
  rectFill(m, 56, 40, 14, 14, PV);
  // 2. lac, sable, ponton
  const lake = { cx: 108, cy: 9, rx: 13, ry: 5.5 };
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const d = Math.pow((x - lake.cx) / lake.rx, 2) + Math.pow((y - lake.cy) / lake.ry, 2);
    if (d < 1) { m.ground[gi(m, x, y)] = WA; m.solid[gi(m, x, y)] = 2; }
    else if (d < 1.5 && m.ground[gi(m, x, y)] === G) m.ground[gi(m, x, y)] = SA;
  }
  rectFill(m, 108, 10, 2, 8, PIER); rectSolid(m, 108, 10, 2, 8, 0);
  // 3. parc
  rectFill(m, 33, 58, 28, 2, PV); rectFill(m, 46, 50, 2, 17, PV);
  // 4. sentiers
  rectFill(m, 12, 9, 2, 15, DIRT); rectFill(m, 6, 3, 15, 7, DIRT);
  rectFill(m, 26, 70, 2, 10, DIRT);
  // 5. ferme : enclos
  const farm = { x: 6, y: 72, w: 45, h: 21 };

  // bâtiments rue principale
  const doors = {};
  for (const b of MAIN_B) {
    const by = 41, dx = b.bx + Math.floor(b.w / 2), dy = by + 2;
    m.statics.push({ kind: 'bld', img: Sp.building(b.w, b.o), x: b.bx * T - 1, y: (by - 2) * T - 1, sortY: (by + 3) * T });
    rectSolid(m, b.bx, by, b.w, 3, 1); m.solid[gi(m, dx, dy)] = 0;
    placed.push({ x: b.bx - 1, y: by - 2, w: b.w + 2, h: 6 });
    m.ground[gi(m, dx, dy + 1)] = PV;
    doors[b.id] = { x: dx, y: dy };
    m.doors.push({ x: dx, y: dy, to: b.id, id: b.id, label: INT[b.id].title });
    if (b.id === 'casino') for (let k = 0; k < 4; k++) m.lights.push({ x: (b.bx + 2 + k * 3.3) * T, y: 44 * T, r: 46, c: k % 2 ? '#ff4fa0' : '#ffd54f' });
  }
  // deuxième rue commerçante
  for (const b of MAIN_B2) {
    const by = 31, dx = b.bx + Math.floor(b.w / 2), dy = by + 2;
    m.statics.push({ kind: 'bld', img: Sp.building(b.w, b.o), x: b.bx * T - 1, y: (by - 2) * T - 1, sortY: (by + 3) * T });
    rectSolid(m, b.bx, by, b.w, 3, 1); m.solid[gi(m, dx, dy)] = 0;
    placed.push({ x: b.bx - 1, y: by - 2, w: b.w + 2, h: 6 });
    for (let x = b.bx; x < b.bx + b.w; x++) m.ground[gi(m, x, dy + 1)] = PV;
    doors[b.id] = { x: dx, y: dy };
    m.doors.push({ x: dx, y: dy, to: b.id, id: b.id, label: INT[b.id].title });
    if (b.id === 'cine' || b.id === 'arcade') for (let k = 0; k < 3; k++) m.lights.push({ x: (b.bx + 1.5 + k * 2) * T, y: 33 * T, r: 36, c: k % 2 ? '#ff4fa0' : '#4fd8ff' });
  }
  // entrepôt du marché noir
  { const bx = 10, by = 6, w = 6, dx = bx + 3, dy = by + 2;
    m.statics.push({ kind: 'bld', img: Sp.building(w, { kind: 'shop', text: 'ENTREPOT', signBg: '#2b2b33', signFg: '#c8503f', extra: 'dark', wall: '#5a5560', roof: '#3b3b44', door: '#2b2b33' }), x: bx * T - 1, y: (by - 2) * T - 1, sortY: (by + 3) * T });
    rectSolid(m, bx, by, w, 3, 1); m.solid[gi(m, dx, dy)] = 0; m.ground[gi(m, dx, dy + 1)] = DIRT;
    placed.push({ x: bx - 1, y: by - 2, w: w + 2, h: 6 });
    doors.black = { x: dx, y: dy };
    m.doors.push({ x: dx, y: dy, to: 'black', id: 'black', label: 'Entrepôt' });
    m.lights.push({ x: (dx + 0.5) * T, y: (dy + 1) * T, r: 40, c: '#c8503f' });
  }
  // maisons
  const houseSlots = [];
  for (const [row, x0s] of [[19, [3, 15, 21, 33, 39, 45, 51, 57, 65, 71, 77, 83, 89, 97, 103, 109, 115, 121]], [63, [3, 9, 15, 21, 65, 71, 77, 83, 89, 97, 103, 109, 115, 121]]]) {
    for (const x0 of x0s) houseSlots.push({ bx: x0, by: row });
  }
  let hid = 0;
  for (const s of houseSlots) {
    const w = 5, dx = s.bx + 2, dy = s.by + 2;
    const hv = Math.floor(U.hash(s.bx, s.by, 5) * 1000);
    const o = { kind: 'house', wall: HWALLS[hv % HWALLS.length], roof: HROOFS[(hv >> 3) % HROOFS.length], door: HDOORS[(hv >> 5) % HDOORS.length] };
    m.statics.push({ kind: 'bld', img: Sp.building(w, o), x: s.bx * T - 1, y: (s.by - 2) * T - 1, sortY: (s.by + 3) * T });
    rectSolid(m, s.bx, s.by, w, 3, 1);
    placed.push({ x: s.bx - 1, y: s.by - 2, w: w + 2, h: 6 });
    const isHome = (s.bx === 39 && s.by === 19);
    const house = { id: hid++, bx: s.bx, by: s.by, doorX: dx, doorY: dy, front: { x: dx * T + 8, y: (dy + 1) * T + 8 }, home: isHome, cd: 0, odette: (s.bx === 121 && s.by === 19), num: 10 + hid * 2 };
    if (isHome) { m.solid[gi(m, dx, dy)] = 0; m.doors.push({ x: dx, y: dy, to: 'home', id: 'home', label: 'Chez moi' }); doors.home = { x: dx, y: dy }; }
    m.ground[gi(m, dx, dy + 1)] = PV;
    m.houses.push(house);
    if (!isHome) m.zones.push({ x: dx * T - 6, y: (dy + 1) * T - 4, w: 28, h: 22, action: 'house', label: null, data: { hid: house.id } });
  }
  // ferme : grange + enclos
  m.statics.push({ kind: 'bld', img: Sp.building(7, { kind: 'house', wall: '#b8503f', roof: '#7a2f2a', door: '#e8dcc0' }), x: 8 * T - 1, y: 75 * T - 1, sortY: 80 * T });
  rectSolid(m, 8, 77, 7, 3, 1); placed.push({ x: 7, y: 75, w: 9, h: 6 });
  // décors statiques dessinés dans le fond plus tard : liste
  const decor = [];
  for (let x = farm.x; x < farm.x + farm.w; x++) {
    if (x < 26 || x > 27) { decor.push({ k: 'fence', x, y: farm.y }); rectSolid(m, x, farm.y, 1, 1, 1); }
    decor.push({ k: 'fence', x, y: farm.y + farm.h - 1 }); rectSolid(m, x, farm.y + farm.h - 1, 1, 1, 1);
  }
  for (let y = farm.y + 1; y < farm.y + farm.h - 1; y++) {
    decor.push({ k: 'fenceV', x: farm.x, y }); decor.push({ k: 'fenceV', x: farm.x + farm.w - 1, y });
    rectSolid(m, farm.x, y, 1, 1, 1); rectSolid(m, farm.x + farm.w - 1, y, 1, 1, 1);
  }
  for (let y = 76; y < 90; y += 1) for (let x = 30; x < 48; x++) if (y % 4 !== 3) decor.push({ k: 'crop', x, y, o: { col: ['#4fb04f', '#e8a93b', '#d65fa3', '#6fbf5a'][Math.floor((x - 30) / 5) % 4] } });
  // parc : bancs, massifs
  for (const [bx, by] of [[40, 57], [52, 57], [40, 60], [52, 60]]) { decor.push({ k: 'bench', x: bx, y: by, w: 2 }); rectSolid(m, bx, by, 2, 1, 1); }
  for (const [fx, fy] of [[35, 54], [36, 54], [57, 54], [58, 54], [35, 64], [36, 64], [57, 64], [58, 64]]) decor.push({ k: 'flower', x: fx, y: fy });
  // place publique : bancs
  for (const [bx, by] of [[58, 42], [66, 42], [58, 52], [66, 52]]) {
    decor.push({ k: 'bench', x: bx, y: by, w: 2 }); rectSolid(m, bx, by, 2, 1, 1);
    m.zones.push({ x: bx * T, y: (by + (by > 47 ? -1 : 1)) * T, w: 2 * T, h: T, action: 'rest', label: 'S\'asseoir sur le banc' });
  }
  // lampadaires
  for (const [ly, xs] of [[22, 0], [44, 0], [66, 0]]) {
    for (let x = 6; x < 124; x += 8) {
      if ((x >= 29 && x <= 32) || (x >= 61 && x <= 64) || (x >= 93 && x <= 96)) continue;
      if (ly === 44 && x >= 55 && x <= 70) continue;
      if (m.doors.some(d => Math.abs(d.x - x) <= 2 && d.y >= ly - 3 && d.y <= ly + 3) || m.houses.some(h => Math.abs(h.doorX - x) <= 2 && h.doorY >= ly - 3 && h.doorY <= ly + 3)) continue;
      decor.push({ k: 'lamp', x, y: ly }); m.solid[gi(m, x, ly)] = 1;
      m.lights.push({ x: x * T + 8, y: ly * T + 4, r: 42, c: '#ffe9a0' });
    }
  }
  // ruelle : tonneaux, bennes
  for (const [bx, by, k, w] of [[10, 11, 'barrel', 1], [16, 12, 'barrel', 1], [10, 17, 'dumpster', 2], [15, 20, 'barrel', 1], [8, 5, 'barrel', 1], [18, 6, 'barrel', 1]]) { decor.push({ k, x: bx, y: by, w }); rectSolid(m, bx, by, w, 1, 1); }
  m.lights.push({ x: 13 * T, y: 15 * T, r: 36, c: '#c8503f' });
  // fontaine
  rectSolid(m, 61, 45, 4, 4, 1);
  decor.push({ k: 'fountain', x: 61, y: 45, w: 4, h: 4 });
  m.lights.push({ x: 63 * T, y: 47 * T, r: 60, c: '#cfeefa' });

  // 6. arbres
  const noTree = new Uint8Array(MW * MH);
  const mark = (x, y) => { if (x >= 0 && y >= 0 && x < MW && y < MH) noTree[gi(m, x, y)] = 1; };
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const g = m.ground[gi(m, x, y)];
    if (g === RD || g === PV || g === SA || g === WA || g === DIRT || g === PIER || m.solid[gi(m, x, y)]) {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) mark(x + dx, y + dy);
    }
  }
  for (const p of placed) for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) mark(x, y);
  for (let y = 3; y <= 24; y++) for (let x = 8; x <= 18; x++) mark(x, y);
  for (let y = farm.y; y < farm.y + farm.h; y++) for (let x = farm.x; x < farm.x + farm.w; x++) mark(x, y);
  for (let y = 70; y <= 80; y++) for (let x = 24; x <= 29; x++) mark(x, y);
  for (let y = 52; y <= 66; y++) for (let x = 33; x <= 60; x++) noTree[gi(m, x, y)] = 2; // parc : arbres maîtrisés
  const forestZone = (x, y) => (y <= 17 && !(x >= 88 && x <= 124 && y >= 1 && y <= 17 && ((x - 108) ** 2 / 14 ** 2 + (y - 9) ** 2 / 6.5 ** 2 < 1.6))) || y >= 70 || x <= 4 || x >= 124;
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const border = x <= 1 || y <= 1 || x >= MW - 2 || y >= MH - 2;
    const nt = noTree[gi(m, x, y)];
    if (nt === 1 && !border) continue;
    let p;
    const n = U.hash(x >> 2, y >> 2, 7);
    if (border) p = 1;
    else if (nt === 2) p = (x + y) % 9 === 0 && U.hash(x, y, 3) < 0.7 ? 1 : (U.hash(x, y, 4) < 0.012 ? 1 : 0);
    else if (forestZone(x, y)) p = n > 0.5 ? 0.62 : 0.2;
    else p = n > 0.7 ? 0.2 : 0.015;
    if (nt === 2 && ((x >= 45 && x <= 48))) p = 0;
    if (U.hash(x, y, 5) >= p) continue;
    if (m.solid[gi(m, x, y)] || (m.ground[gi(m, x, y)] !== G && !border)) continue;
    if (Math.hypot(x - 62, y - 50) < 6) continue;
    const forest = forestZone(x, y) && !border && nt !== 2;
    let v = Math.floor(U.hash(x, y, 9) * 3);
    if (forest && U.hash(x, y, 11) < 0.45) v = 3;
    m.trees.push({ tx: x, ty: y, v, wood: forest, hp: 3, cut: 0 });
    m.solid[gi(m, x, y)] = 1;
  }
  // buissons dans le parc
  for (const [bx, by] of [[36, 56], [44, 62], [54, 53], [38, 65], [56, 61], [42, 54]]) {
    if (m.solid[gi(m, bx, by)]) continue;
    m.statics.push({ kind: 'bush', img: Sp.bush(by % 4), x: bx * T - 1, y: by * T + 1, sortY: (by + 1) * T }); m.solid[gi(m, bx, by)] = 1;
  }

  // 7. rendu du fond
  const bg = U.mk(MW * T, MH * T), c = bg.getContext('2d');
  const D4 = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  const gAt = (x, y) => (x < 0 || y < 0 || x >= MW || y >= MH) ? -1 : m.ground[gi(m, x, y)];
  for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
    const x = tx * T, y = ty * T, g = m.ground[gi(m, tx, ty)];
    if (g === G) {
      R(c, x, y, T, T, ((tx + ty) & 1) ? '#88c76d' : '#84c36a');
      for (let i = 0; i < 5; i++) R(c, x + Math.floor(U.hash(tx, ty, i * 2) * 14), y + Math.floor(U.hash(tx, ty, i * 2 + 1) * 16), 2, 1, (i & 1) ? '#7bb961' : '#93cf76');
    } else if (g === RD) {
      R(c, x, y, T, T, '#6b6f78');
      for (let i = 0; i < 3; i++) R(c, x + Math.floor(U.hash(tx, ty, i + 60) * 14), y + Math.floor(U.hash(tx, ty, i + 61) * 15), 2, 1, '#62666f');
      const horiz = ty === 24 || ty === 46 || ty === 68, vert = tx === 30 || tx === 62 || tx === 94;
      if (horiz && ty < MH && gAt(tx, ty + 1) === RD && (tx & 1) === 0) R(c, x, y + 15, 8, 1, '#e8d77a');
      if (vert && gAt(tx + 1, ty) === RD && (ty & 1) === 0) R(c, x + 15, y, 1, 8, '#e8d77a');
      if (gAt(tx, ty - 1) === G || gAt(tx, ty - 1) === PV) R(c, x, y, T, 1, '#8d9199');
      if (gAt(tx, ty + 1) === G || gAt(tx, ty + 1) === PV) R(c, x, y + 15, T, 1, '#8d9199');
    } else if (g === PV) {
      R(c, x, y, T, T, ((tx + ty) & 1) ? '#d6d0c4' : '#cfc9bd'); R(c, x, y, T, 1, '#bfb9ac'); R(c, x, y, 1, T, '#bfb9ac');
    } else if (g === SA) {
      R(c, x, y, T, T, '#ecdcab');
      for (let i = 0; i < 4; i++) R(c, x + Math.floor(U.hash(tx, ty, i + 70) * 14), y + Math.floor(U.hash(tx, ty, i + 80) * 15), 2, 1, '#e0cd96');
    } else if (g === WA) {
      R(c, x, y, T, T, '#5cb4d8');
      for (let i = 0; i < 2; i++) R(c, x, y + Math.floor(U.hash(tx, ty, i + 90) * 14) + 1, T, 1, '#54a9ce');
      for (let d = 0; d < 4; d++) { const n = gAt(tx + D4[d][0], ty + D4[d][1]); if (n !== WA && n !== PIER && n !== -1) { const e = d === 0 ? [x, y, T, 1] : d === 1 ? [x, y + 15, T, 1] : d === 2 ? [x, y, 1, T] : [x + 15, y, 1, T]; R(c, e[0], e[1], e[2], e[3], '#a6dff0'); } }
    } else if (g === PIER) {
      R(c, x, y, T, T, '#b58e5c'); for (let k = 0; k < 4; k++) R(c, x, y + k * 4 + 3, T, 1, '#8a6a42'); R(c, x, y, 1, T, '#6a4128'); R(c, x + 15, y, 1, T, '#6a4128');
    } else if (g === DIRT) {
      R(c, x, y, T, T, '#8a6a46');
      for (let i = 0; i < 6; i++) R(c, x + Math.floor(U.hash(tx, ty, i + 40) * 14), y + Math.floor(U.hash(tx, ty, i + 41) * 15), 2, 1, i & 1 ? '#7a5a38' : '#9a7a54');
    }
  }
  // fleurs et touffes
  const FC = ['#ffffff', '#f48fb1', '#ffd54f', '#ba9cf0', '#ff8a65'];
  for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
    if (m.ground[gi(m, tx, ty)] !== G || m.solid[gi(m, tx, ty)]) continue;
    const x = tx * T, y = ty * T;
    if (U.hash(tx, ty, 100) < 0.15) { const ox = 3 + Math.floor(U.hash(tx, ty, 101) * 10), oy = 3 + Math.floor(U.hash(tx, ty, 102) * 9); R(c, x + ox - 1, y + oy + 1, 1, 2, '#5f9f4f'); R(c, x + ox, y + oy, 1, 3, '#5f9f4f'); R(c, x + ox + 1, y + oy + 1, 1, 2, '#5f9f4f'); }
    if (U.hash(tx, ty, 110) < 0.06) {
      const ox = 3 + Math.floor(U.hash(tx, ty, 111) * 10), oy = 3 + Math.floor(U.hash(tx, ty, 112) * 10), col = FC[Math.floor(U.hash(tx, ty, 113) * FC.length)];
      R(c, x + ox, y + oy - 1, 1, 1, col); R(c, x + ox, y + oy + 1, 1, 1, col); R(c, x + ox - 1, y + oy, 1, 1, col); R(c, x + ox + 1, y + oy, 1, 1, col); R(c, x + ox, y + oy, 1, 1, '#ffd54f');
    }
  }
  for (const d of decor) Sp.prop(c, d.k, d.x, d.y, d.w || 1, d.h || 1, d.o);
  // ombres des bâtiments
  c.fillStyle = 'rgba(0,0,0,0.18)';
  for (const s of m.statics) if (s.kind === 'bld') c.fillRect(s.x + 3, s.sortY - 3, s.img.width - 4, 5);
  m.bg = bg;
  m.farm = farm; m.lake = lake; m.doorsById = doors;
  return m;
}

/* minicarte */
World.makeMini = m => {
  const cv = U.mk(m.w, m.h), c = cv.getContext('2d');
  const col = { 0: '#7bb961', 1: '#6b6f78', 2: '#5cb4d8', 3: '#ecdcab', 4: '#cfc9bd', 6: '#b58e5c', 7: '#8a6a46' };
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { c.fillStyle = col[m.ground[gi(m, x, y)]] || '#7bb961'; c.fillRect(x, y, 1, 1); }
  c.fillStyle = '#2f7d3f';
  for (const t of m.trees) c.fillRect(t.tx, t.ty, 1, 1);
  c.fillStyle = '#8a5a3a';
  for (const s of m.statics) if (s.kind === 'bld') c.fillRect(Math.floor((s.x + 1) / T), Math.floor((s.y + 1) / T) + 2, Math.round((s.img.width - 2) / T), 3);
  return cv;
};

/* ------------------------------------------------------------------ */

World.homeDef = () => {
  const D = RG.Data, S = RG.S || {}, H = S.home || { size: 0, wall: D.WALLS[0], floor: 0 };
  const sz = D.HOME_SIZES[H.size || 0], fl = D.FLOORS[H.floor || 0] || D.FLOORS[0];
  const furn = S.furn || D.DEFAULT_FURN, props = [], zones = [], doors = [];
  const LAB = { sleep: 'Dormir', sofa: 'Se détendre sur le canapé', tv: 'Regarder la télé', console: 'Jouer à la console', piano: 'Jouer du piano', read: 'Lire un livre', fridge: 'Ouvrir le frigo', cook: 'Cuisiner', mirror: 'Changer de tenue', stash: 'Ouvrir le coffre', gym: 'Faire de l\'exercice', wc: 'Utiliser les toilettes', shower: 'Prendre une douche', bath: 'Prendre un bain', door: 'Régler les accès de la porte' };
  const FN = { bed: 'sleep', bedlux: 'sleep', tvset: 'tv' };
  const dxd = Math.floor(sz.w / 2);
  furn.forEach((f, i) => {
    const F = D.FURN[f.id]; if (!F) return;
    const rr = (f.r | 0) % 4, fw = rr & 1 ? F.h : F.w, fh = rr & 1 ? F.w : F.h;
    props.push({ k: F.k, x: f.x, y: f.y, w: fw, h: fh, w0: F.w, h0: F.h, r: rr, o: F.o, flat: F.flat });
    if (F.k === 'doorseg') doors.push({ x: f.x, y: f.y, idx: i });
    if (F.fn && f.y + fh <= sz.h - 2) zones.push({ x: f.x, y: f.y + fh, w: fw, h: 1, action: 'furn', label: LAB[F.fn], data: { fn: F.fn, idx: i } });
  });
  return { title: 'Chez moi', w: sz.w, h: sz.h, floor: fl.id, floorC: fl.c, wall: H.wall || D.WALLS[0], props, zones, npcs: [], doors };
};
World.rebuildHome = () => {
  const old = World.maps.home, m = buildInterior('home', World.homeDef());
  m.ret = old ? old.ret : null; World.maps.home = m; RG.Ent.populate(m); RG.Ent.Nav.map = null;
  if (RG.core && RG.core.cur === old) RG.core.cur = m;
  return m;
};
World.build = () => {
  World.maps = {};
  const out = buildOutdoor();
  World.maps.world = out;
  for (const k of Object.keys(INT)) {
    const m = buildInterior(k, k === 'home' ? World.homeDef() : INT[k]);
    const d = out.doorsById[k];
    m.ret = d ? { x: d.x * T + 8, y: (d.y + 1) * T + 10 } : { x: 62 * T, y: 50 * T };
    World.maps[k] = m;
  }
  out.mini = World.makeMini(out);
};
})();
