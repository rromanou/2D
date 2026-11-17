(() => {
'use strict';
const RG = window.RG;
const D = RG.Data = {};

/* ------------------------------------------------------------------ */
/*  Objets                                                             */
/* ------------------------------------------------------------------ */
D.ITEMS = {
  pomme:    { n: 'Pomme',            k: 'food',   p: 2,   h: 8,  t: 3,  d: 'Croquante et sucrée.' },
  pain:     { n: 'Baguette',         k: 'food',   p: 3,   h: 15, t: 0,  d: 'Fraîche du matin.' },
  croissant:{ n: 'Croissant',        k: 'food',   p: 3,   h: 14, t: 0,  d: 'Beurré à souhait.' },
  sandwich: { n: 'Sandwich',         k: 'food',   p: 6,   h: 30, t: 0,  d: 'Jambon-fromage.' },
  pizza:    { n: 'Pointe de pizza',  k: 'food',   p: 10,  h: 45, t: 0,  d: 'Garnie et fumante.' },
  salade:   { n: 'Salade',           k: 'food',   p: 8,   h: 25, t: 5,  hp: 6, d: 'Bonne pour la santé.' },
  poulet:   { n: 'Poulet rôti',      k: 'food',   p: 12,  h: 55, t: 0,  d: 'Un vrai repas.' },
  poisson:  { n: 'Poisson',          k: 'food',   p: 0,   h: 28, t: 0,  d: 'Pêché au lac.' },
  eau:      { n: 'Bouteille d\'eau', k: 'drink',  p: 2,   h: 0,  t: 32, d: 'Fraîche.' },
  jus:      { n: 'Jus d\'orange',    k: 'drink',  p: 4,   h: 3,  t: 36, d: 'Pressé.' },
  soda:     { n: 'Soda',             k: 'drink',  p: 3,   h: 2,  t: 26, d: 'Pétillant.' },
  lait:     { n: 'Lait',             k: 'drink',  p: 3,   h: 6,  t: 26, d: 'Bien froid.' },
  cafe:     { n: 'Café',             k: 'drink',  p: 3,   h: 0,  t: 14, st: 40, d: 'Redonne de l\'énergie.' },
  telephone:{ n: 'Téléphone', k: 'tool', p: 120, d: 'Permet d\'appeler ta voiture sur la route la plus proche.' },
  canne:    { n: 'Canne à pêche',    k: 'tool',   p: 45,  d: 'Pour pêcher au bord de l\'eau.' },
  hache:    { n: 'Hache',            k: 'tool',   p: 60,  d: 'Pour couper du bois en forêt.' },
  lettre:   { n: 'Lettre',           k: 'misc',   p: 0,   d: 'Une lettre cachetée.' },
  colis:    { n: 'Colis',            k: 'misc',   p: 0,   d: 'Un colis à livrer.' },
  taser:    { n: 'Taser', k: 'weapon', p: 0, w: 'taser', d: 'Équipement de service : paralyse un suspect.', duty: 1 },
  matraque: { n: 'Matraque', k: 'weapon', p: 0, w: 'baton', d: 'Équipement de service.', duty: 1 },
  pistolet_s: { n: 'Pistolet de service', k: 'weapon', p: 0, w: 'gun', d: 'Arme de service. Utilise des balles.', duty: 1 },
  couteau:  { n: 'Couteau',          k: 'weapon', p: 120, w: 'knife', d: 'Menace à bout portant.', ill: 1 },
  pistolet: { n: 'Pistolet',         k: 'weapon', p: 900, w: 'gun',   d: 'Nécessite des balles pour tirer.', ill: 1 },
  fusil:    { n: 'Fusil à pompe',    k: 'weapon', p: 2400, w: 'shotgun', d: 'Trois projectiles par tir.', ill: 1 },
  balles:   { n: 'Balles',           k: 'ammo',   p: 12,  d: 'Munitions pour pistolet et fusil.', ill: 1 },
  cagoule:  { n: 'Cagoule',          k: 'mask',   p: 70,  d: 'Cache ton visage : moins de recherches.', ill: 1 },
  pied:     { n: 'Pied-de-biche',    k: 'tool',   p: 90,  d: 'Force les portes, mais c\'est bruyant.', ill: 1 },
  crochets: { n: 'Crochets',         k: 'tool',   p: 80,  d: 'Crochetage discret.', ill: 1 },
  montre:   { n: 'Montre en or',     k: 'loot',   p: 0, sell: 90,  d: 'Volée.', ill: 1 },
  bijoux:   { n: 'Bijoux',           k: 'loot',   p: 0, sell: 160, d: 'Volés.', ill: 1 },
  argent:   { n: 'Argenterie',       k: 'loot',   p: 0, sell: 120, d: 'Volée.', ill: 1 },
  tele:     { n: 'Télévision',       k: 'loot',   p: 0, sell: 260, d: 'Volée.', ill: 1 },
  ordi:     { n: 'Ordinateur',       k: 'loot',   p: 0, sell: 330, d: 'Volé.', ill: 1 },
  tableau:  { n: 'Tableau',          k: 'loot',   p: 0, sell: 420, d: 'Volé.', ill: 1 },
  hat_1:    { n: 'Casquette',        k: 'cosm', p: 40,  slot: 'hat', v: 1 },
  hat_2:    { n: 'Bonnet',           k: 'cosm', p: 35,  slot: 'hat', v: 2 },
  hat_3:    { n: 'Chapeau de paille',k: 'cosm', p: 60,  slot: 'hat', v: 3 },
  hat_4:    { n: 'Haut-de-forme',    k: 'cosm', p: 150, slot: 'hat', v: 4 },
  hat_5:    { n: 'Couronne',         k: 'cosm', p: 500, slot: 'hat', v: 5 },
  gl_1:     { n: 'Lunettes rondes',  k: 'cosm', p: 30,  slot: 'glasses', v: 1 },
  gl_2:     { n: 'Lunettes de soleil', k: 'cosm', p: 45, slot: 'glasses', v: 2 },
  pet_chien: { n: 'Chien',   k: 'pet', p: 300, pet: 'chien' },
  pet_chat:  { n: 'Chat',    k: 'pet', p: 250, pet: 'chat' },
  pet_lapin: { n: 'Lapin',   k: 'pet', p: 150, pet: 'lapin' },
  pet_poule: { n: 'Poule',   k: 'pet', p: 80,  pet: 'poule' }
};
D.WEAPON_LV = { knife: 1, gun: 2, shotgun: 3 };

/* ------------------------------------------------------------------ */
/*  Boutiques                                                          */
/* ------------------------------------------------------------------ */
D.SHOPS = {
  super:    { title: 'Supermarché',        items: ['telephone', 'pomme', 'pain', 'sandwich', 'pizza', 'salade', 'poulet', 'eau', 'jus', 'soda', 'lait', 'cafe'] },
  cafe:     { title: 'Café Chez Mimi',     items: ['cafe', 'croissant', 'sandwich', 'pizza', 'jus', 'lait'] },
  hardware: { title: 'Quincaillerie',      items: ['canne', 'hache'] },
  black:    { title: 'Marché noir',        items: ['couteau', 'pistolet', 'fusil', 'balles', 'cagoule', 'pied', 'crochets'] },
  studio:   { title: 'Atelier Style',      items: ['hat_1', 'hat_2', 'hat_3', 'hat_4', 'hat_5', 'gl_1', 'gl_2'] },
  pizz:     { title: 'Pizzeria',           items: ['burger', 'gateau', 'biere', 'cafe', 'lait'] },
  pet:      { title: 'Animalerie',         items: ['pet_chien', 'pet_chat', 'pet_lapin', 'pet_poule'] }
};

/* ------------------------------------------------------------------ */
/*  Emplois                                                            */
/* ------------------------------------------------------------------ */
D.JOBS = {
  caissier: { n: 'Caissier', place: 'Supermarché', pay: [22, 34], d: 'Passe les articles des clients à la caisse du supermarché (poste de caisse, au fond à droite).' },
  livreur:  { n: 'Livreur', place: 'Bureau de poste', pay: [55, 90], d: 'Prends un colis au bureau de poste puis livre-le à la bonne adresse avant la fin du temps imparti.' },
  pecheur:  { n: 'Pêcheur', place: 'Lac', pay: [14, 38], need: 'canne', d: 'Pêche au bord de l\'eau avec ta canne : chaque prise est vendue sur place.' },
  serveur:  { n: 'Serveur', place: 'Restaurant', pay: [26, 40], d: 'Prends les commandes et sers les clients au restaurant (zone de service près des tables).' },
  biblio:   { n: 'Bibliothécaire', place: 'Bibliothèque', pay: [24, 36], d: 'Range les livres par ordre alphabétique à la bibliothèque.' },
  barman:   { n: 'Barman', place: 'Bar', pay: [28, 46], d: 'Prépare des cocktails au comptoir du bar.' },
  policier: { n: 'Policier', place: 'Commissariat', pay: [120, 120], duty: 1, d: 'Prends ton service au commissariat : 120 $ la minute. Uniforme, armurerie, voiture de patrouille, radio et arrestations. Un permis valide est requis. Service coupé après une minute d\'immobilité.' },
  bucheron: { n: 'Bûcheron', place: 'Forêt', pay: [20, 32], need: 'hache', d: 'Coupe les arbres de la forêt avec ta hache : chaque bûche est payée.' }
};

/* ------------------------------------------------------------------ */
/*  Quêtes                                                             */
/* ------------------------------------------------------------------ */
D.QUESTS = [
  { id: 'bienvenue', giver: 'maire', title: 'Bienvenue au village', req: null,
    offer: ['Ah, un nouveau visage ! Je suis la maire, Pierrette Tremblay.', 'Fais-moi plaisir : va saluer Marcel, l\'épicier du supermarché, sur la rue principale. Reviens me voir ensuite.'],
    steps: [{ t: 'talk', a: 'marcel', txt: 'Va saluer Marcel au supermarché (rue principale).' }, { t: 'talk', a: 'maire', txt: 'Retourne voir la maire à la mairie.' }],
    done: ['Marcel m\'a dit que tu étais poli. Voici de quoi démarrer !'], reward: { money: 60 } },
  { id: 'faim', giver: 'marcel', title: 'Un estomac qui gargouille', req: 'bienvenue',
    offer: ['Tu as l\'air affamé ! Ici on mange pour rester en forme.', 'Achète quelque chose à manger ou à boire, consomme-le depuis ton sac (touche I), puis reviens me voir.'],
    steps: [{ t: 'buy', a: 'super', txt: 'Achète de la nourriture au supermarché.' }, { t: 'eat', n: 1, txt: 'Mange ou bois depuis ton sac (touche I).' }, { t: 'talk', a: 'marcel', txt: 'Reviens voir Marcel.' }],
    done: ['Voilà qui est mieux ! Un client qui mange est un client heureux.'], reward: { money: 30, item: { pomme: 3 } } },
  { id: 'style', giver: 'lea', title: 'Un nouveau look', req: null,
    offer: ['Bienvenue à l\'Atelier Style ! Le miroir est à ta disposition.', 'Change ton apparence au miroir et valide, puis reviens me montrer.'],
    steps: [{ t: 'style', txt: 'Change ton apparence au miroir de l\'Atelier Style.' }, { t: 'talk', a: 'lea', txt: 'Retourne voir Léa.' }],
    done: ['Magnifique ! Tiens, des lunettes pour compléter le tout.'], reward: { money: 40, own: 'gl_1' } },
  { id: 'emploi', giver: 'armand', title: 'Au boulot !', req: 'bienvenue',
    offer: ['Bonjour ! Ici on aide les gens à trouver un emploi.', 'Choisis un métier, fais trois tâches, puis reviens me voir.'],
    steps: [{ t: 'job', txt: 'Prends un emploi au Centre d\'emploi.' }, { t: 'work', n: 3, txt: 'Effectue des tâches de ton emploi.' }, { t: 'talk', a: 'armand', txt: 'Reviens voir Armand.' }],
    done: ['Du bon travail ! Avec de l\'expérience, ton salaire augmentera.'], reward: { money: 120 } },
  { id: 'peche', giver: 'gustave', title: 'Poissons du lac', req: null,
    offer: ['Chut... tu fais fuir les poissons. Tu veux apprendre à pêcher ?', 'Il te faut une canne à pêche, vendue à la quincaillerie. Attrape trois poissons depuis la rive ou le ponton.'],
    steps: [{ t: 'buy', a: 'canne', txt: 'Achète une canne à pêche à la quincaillerie.' }, { t: 'fish', n: 3, txt: 'Attrape des poissons (face à l\'eau, touche E).' }, { t: 'talk', a: 'gustave', txt: 'Retourne voir Gustave.' }],
    done: ['Pas mal du tout pour un débutant ! Prends ça.'], reward: { money: 90 } },
  { id: 'lettre', giver: 'rejean', title: 'Courrier urgent', req: null,
    offer: ['J\'ai une lettre pour Odette, mais mon dos me fait souffrir.', 'Elle habite une maison au nord de la rue principale, près de l\'extrémité est. Tu peux la lui apporter ?'],
    start: { lettre: 1 },
    steps: [{ t: 'talk', a: 'odette', take: 'lettre', txt: 'Apporte la lettre à Odette (maisons au nord-est).' }, { t: 'talk', a: 'rejean', txt: 'Retourne voir Réjean.' }],
    done: ['Merci beaucoup ! Je ne sais pas ce que je ferais sans toi.'], reward: { money: 70 } },
  { id: 'chat', giver: 'zoe', title: 'Moustache s\'est enfui', req: null,
    offer: ['Snif... mon chat Moustache a disparu ! Il est roux avec une tache blanche.', 'Il aime se cacher dans le parc, près de la place. Tu peux le retrouver ?'],
    steps: [{ t: 'find', txt: 'Retrouve Moustache dans le parc (touche E sur lui).' }, { t: 'talk', a: 'zoe', txt: 'Rapporte la bonne nouvelle à Zoé.' }],
    done: ['Moustache est rentré ! Merci, merci, merci !'], reward: { money: 90 } },
  { id: 'ami', giver: 'zelie', title: 'Un ami fidèle', req: null,
    offer: ['Les animaux ont besoin d\'amour. Et toi, tu as de la place ?', 'Adopte un compagnon : il te suivra partout.'],
    steps: [{ t: 'pet', txt: 'Adopte un animal à l\'animalerie.' }, { t: 'talk', a: 'zelie', txt: 'Reviens voir Zélie.' }],
    done: ['Il est adorable ! Prends soin de lui.'], reward: { money: 40 } },
  { id: 'epargne', giver: 'helene', title: 'Premier dépôt', req: null,
    offer: ['Un compte en banque, c\'est la sécurité : l\'argent déposé n\'est jamais confisqué.', 'Dépose au moins 100 $ puis reviens me voir.'],
    steps: [{ t: 'deposit', n: 100, txt: 'Dépose 100 $ à la banque.' }, { t: 'talk', a: 'helene', txt: 'Reviens voir Hélène.' }],
    done: ['Excellent réflexe. Voici un petit bonus de bienvenue.'], reward: { money: 50 } },
  { id: 'chance', giver: 'victor', title: 'La chance du débutant', req: null,
    offer: ['La roulette n\'attend que toi, mon ami.', 'Gagne une partie à n\'importe quel jeu du casino, puis reviens me le dire.'],
    steps: [{ t: 'win', txt: 'Gagne une partie au casino.' }, { t: 'talk', a: 'victor', txt: 'Reviens voir Victor.' }],
    done: ['Je l\'avais bien dit ! Voilà une petite prime de la maison.'], reward: { money: 150 } },
  { id: 'bois', giver: 'gaston', title: 'Du bois pour l\'hiver', req: null,
    offer: ['L\'hiver arrive vite et il me manque du bois de chauffage.', 'Prends un emploi de bûcheron, achète une hache à la quincaillerie, puis coupe cinq arbres en forêt.'],
    steps: [{ t: 'chop', n: 5, txt: 'Coupe 5 arbres en forêt (emploi bûcheron + hache).' }, { t: 'talk', a: 'gaston', txt: 'Retourne voir Gaston.' }],
    done: ['Ça va nous chauffer tout l\'hiver. Tu as bien mérité ta paie.'], reward: { money: 110 } },
  { id: 'ronde', giver: 'dubois', title: 'Tournée de proximité', req: 'bienvenue',
    offer: ['Je cherche quelqu\'un de confiance pour prendre le pouls du quartier.', 'Va discuter avec quatre habitants dans les rues, puis reviens me voir.'],
    steps: [{ t: 'bot', n: 4, txt: 'Discute avec 4 habitants du village.' }, { t: 'talk', a: 'dubois', txt: 'Retourne voir le brigadier Dubois.' }],
    done: ['Bon travail. Reste du bon côté de la loi, d\'accord ?'], reward: { money: 80 } },
  { id: 'ombre', giver: 'vipere', title: 'Premier coup', req: 'bienvenue',
    offer: ['Tu as trouvé mon commerce. Pas mal. Je ne travaille qu\'avec ceux qui ont des tripes.', 'Équipe-toi d\'une arme, puis braque quelqu\'un : un passant, un commerce... Reviens avec la preuve de ta valeur.'],
    steps: [{ t: 'crime', n: 1, txt: 'Commets un braquage ou un cambriolage.' }, { t: 'talk', a: 'vipere', txt: 'Retourne voir la Vipère au marché noir.' }],
    done: ['Pas mal. Voilà ta part. Et ferme-la sur mon adresse.'], reward: { money: 300 } }
];

/* ------------------------------------------------------------------ */
/*  PNJ fixes (dialogues définis)                                      */
/* ------------------------------------------------------------------ */
const A = (skin, hairC, hair, shirt, pants, hat, glasses, hatC) => ({ skin, hairC, hair, shirt, pants, hat: hat || 0, glasses: glasses || 0, hatC });
D.NPCS = {
  lucie: { name: 'Lucie', role: 'Guide', ap: A('#f7cfa5', '#c94b32', 3, '#3fa9a0', '#4a5d8f'),
    intro: ['Bienvenue au village ! Je m\'appelle Lucie, je guide les nouveaux arrivants.', 'ZQSD ou les flèches pour marcher, Maj pour courir, E pour parler et agir, I pour ton sac, J pour tes quêtes, M pour la carte.', 'Mange et bois au supermarché, trouve un emploi au Centre d\'emploi, et passe voir la maire pour tes premières quêtes.', 'Et méfie-toi : la police veille, et il paraît qu\'un marché noir se cache dans la forêt, au nord-ouest...'],
    lines: ['Besoin d\'un conseil ? Le supermarché est sur la rue principale, à l\'ouest de la place.', 'Le casino est tout au bout de la rue principale, à l\'est. N\'y laisse pas toutes tes économies !', 'La banque protège ton argent : même la police ne peut pas le confisquer là-bas.', 'Tu veux changer de look ? L\'Atelier Style t\'attend à l\'ouest.'] },
  maire: { name: 'Pierrette', role: 'Maire', ap: A('#fde0c5', '#ebe4cf', 3, '#8a63c9', '#3b3b44', 0, 1),
    intro: ['Bonjour, je suis Pierrette, la maire de ce village.'], lines: ['Notre village est petit, mais les gens y sont accueillants.', 'J\'ai toujours besoin de bras pour aider la communauté.', 'La criminalité me préoccupe. Les braqueurs finissent toujours en cellule.'], menu: ['quest'] },
  marcel: { name: 'Marcel', role: 'Épicier', ap: A('#e5ae7e', '#ebe4cf', 4, '#f2f2ee', '#7a5a3a', 0, 0),
    intro: ['Bienvenue au supermarché ! Tout est frais, tout est bon marché.'], lines: ['Un sandwich, une boisson et on repart du bon pied !', 'Fais attention à ta faim et à ta soif, sinon tu vas t\'évanouir.', 'Je garde ma caisse bien fermée... et j\'ai un bouton d\'alarme !'],
    menu: ['shop:super', 'quest'], robbable: { min: 120, max: 380, heat: 2, need: 1, cd: 420, name: 'le supermarché' } },
  lea: { name: 'Léa', role: 'Styliste', ap: A('#c98e5f', '#2b1b14', 3, '#d65fa3', '#2f4f6f', 0, 2),
    intro: ['Bienvenue à l\'Atelier Style ! Coiffure, vêtements, accessoires...'], lines: ['Le miroir est gratuit pour les couleurs et les coiffures.', 'Les chapeaux et lunettes, eux, sont payants. Il faut bien vivre !'], menu: ['mirror', 'shop:studio', 'quest'] },
  zelie: { name: 'Zélie', role: 'Animalière', ap: A('#fde0c5', '#a8642a', 1, '#6fbf5a', '#5f7f4f', 0, 0),
    intro: ['Bienvenue à l\'animalerie ! Ici, chaque compagnon cherche une famille.'], lines: ['Un chien, c\'est de la joie. Un chat, c\'est du caractère.', 'Les animaux adoptés te suivent partout. Caresse-les avec E !'], menu: ['shop:pet', 'quest'] },
  gerard: { name: 'Gérard', role: 'Quincaillier', ap: A('#e5ae7e', '#6a4126', 0, '#e8a93b', '#4a5d8f', 0, 0),
    intro: ['Quincaillerie Gérard, pour tout ce qui sert à bricoler... et à travailler !'], lines: ['La canne à pêche, c\'est pour le lac au nord-est.', 'Une hache solide, ça change la vie d\'un bûcheron.'], menu: ['shop:hardware'],
    robbable: { min: 80, max: 260, heat: 2, need: 1, cd: 420, name: 'la quincaillerie' } },
  helene: { name: 'Hélène', role: 'Banquière', ap: A('#f7cfa5', '#2b1b14', 3, '#3b3b44', '#3b3b44', 0, 1),
    intro: ['Bienvenue à la banque. Que puis-je faire pour vous ?'], lines: ['L\'argent en banque est à l\'abri des voleurs et de la police.', 'Un dépôt régulier, c\'est la clé de la tranquillité.'], menu: ['bank', 'quest'],
    robbable: { min: 900, max: 2600, heat: 4, need: 2, cd: 900, name: 'la banque' } },
  armand: { name: 'Armand', role: 'Conseiller d\'emploi', ap: A('#c98e5f', '#2b1b14', 0, '#4b78c8', '#3b3b44', 0, 1),
    intro: ['Bonjour ! Je suis Armand. On vous aide ici à trouver du travail.'], lines: ['Plus vous travaillez, plus votre salaire augmente.', 'On ne peut avoir qu\'un seul emploi à la fois, mais on peut changer quand on veut.'], menu: ['jobs', 'quest'] },
  rejean: { name: 'Réjean', role: 'Postier', ap: A('#f7cfa5', '#6a4126', 0, '#4b78c8', '#2f4f6f', 1, 0, '#2f4a8c'),
    intro: ['Bureau de poste ! Courrier, colis, tout y passe.'], lines: ['Les livreurs sont payés selon la distance et la rapidité.', 'Si tu veux livrer des colis, passe d\'abord au Centre d\'emploi.'], menu: ['parcel', 'quest'] },
  dubois: { name: 'Dubois', role: 'Brigadier', ap: A('#e5ae7e', '#2b1b14', 0, '#2f4a8c', '#1b2a52', 6, 0),
    intro: ['Commissariat de police. Je suis le brigadier Dubois.'], lines: ['Ici, on retrouve toujours ceux qui enfreignent la loi.', 'Si tu te fais arrêter, tu peux payer ta caution pour sortir plus vite.', 'Cacher ses objets illégaux au coffre de sa maison, c\'est malin... mais je n\'ai rien dit.'], menu: ['quest'] },
  victor: { name: 'Victor', role: 'Croupier', ap: A('#fde0c5', '#2b1b14', 0, '#f2f2ee', '#15151c', 0, 0),
    intro: ['Bienvenue au casino ! Faites vos jeux, la maison offre le premier verre... non, je rigole.'], lines: ['Rouge ou noir ? La roulette adore l\'audace.', 'Les machines à sous, c\'est du hasard pur. Le poker, c\'est de la tête.', 'Rien ne va plus... ah, quel suspense.'], menu: ['quest'] },
  sophie: { name: 'Sophie', role: 'Donneuse', ap: A('#c98e5f', '#6a4126', 1, '#f2f2ee', '#15151c', 0, 0),
    intro: ['Blackjack ! Approchez-vous, la table est ouverte.'], lines: ['Le croupier tire jusqu\'à 17. Pas de pitié.', 'Un blackjack paie trois pour deux.'] },
  leon: { name: 'Léon', role: 'Barman', ap: A('#e5ae7e', '#2b1b14', 0, '#8b4a5a', '#15151c', 4, 0),
    intro: ['Qu\'est-ce que je vous sers ?'], lines: ['Un jus et on repart à l\'attaque !', 'Les gros joueurs viennent ici pour se remonter le moral.', 'Si tu perds tout, la rue est juste derrière.'], menu: ['shop:cafe'] },
  videur: { name: 'Videur', role: 'Sécurité', ap: A('#9a6a42', '#15151c', 4, '#15151c', '#15151c', 0, 2),
    intro: ['Pas de problème, circulez.'], lines: ['Pas d\'armes dans le casino. Je dis ça, je dis rien.', 'Les caméras te regardent.', 'Tu veux jouer ? Fais-toi plaisir.'] },
  mimi: { name: 'Mimi', role: 'Cafetière', ap: A('#fde0c5', '#d65fa3', 3, '#f2f2ee', '#8b4a5a', 0, 0),
    intro: ['Bienvenue Chez Mimi ! Un café, un croissant ?'], lines: ['Les potins du village passent tous par mon comptoir.', 'On dit qu\'un marché noir existe, dans la forêt au nord-ouest. Mais chut.', 'Mon café réveille un mort.'], menu: ['shop:cafe'],
    robbable: { min: 60, max: 180, heat: 2, need: 1, cd: 420, name: 'le café' } },
  vipere: { name: 'La Vipère', role: 'Receleur', ap: A('#c98e5f', '#15151c', 0, '#3b3b44', '#15151c', 2, 2),
    intro: ['Tiens, un nouveau. Tu ne devrais pas être ici... mais tu y es.', 'Armes, outils, cagoules, tout est à vendre. Et je rachète le butin, évidemment.'], lines: ['Les cambriolages rapportent gros si tu sais où revendre.', 'Ne te fais pas pincer avec ça sur toi : la police confisque tout.', 'Le coffre de ta maison est un bon endroit pour cacher la marchandise.'], menu: ['shop:black', 'fence', 'quest'] },
  guetteur: { name: 'Guetteur', role: 'Inconnu', ap: A('#e5ae7e', '#15151c', 4, '#3b3b44', '#2b2b33', 2, 2),
    intro: ['Hé. Tu t\'es perdu ?'], lines: ['Pas de flics par ici. Mais ne traîne pas.', 'Va voir la Vipère, dans l\'entrepôt, si tu as les moyens.', 'Tu n\'as rien vu, rien entendu.'] },
  zoe: { name: 'Zoé', role: 'Fillette', ap: A('#f7cfa5', '#6a4126', 3, '#d65fa3', '#4b78c8'),
    intro: ['Bonjour... tu n\'as pas vu mon chat ?'], lines: ['Moustache est roux, avec une petite tache blanche.', 'Il aime se cacher dans les buissons du parc.'], menu: ['quest'] },
  gustave: { name: 'Gustave', role: 'Vieux pêcheur', ap: A('#e5ae7e', '#ebe4cf', 0, '#8a5a3a', '#4f6f4f', 3, 0),
    intro: ['Chut... les poissons mordent mieux au calme.'], lines: ['Le ponton est la meilleure place, mais il faut être patient.', 'Avec une canne, tout le monde peut pêcher. Même toi.', 'On dit que le plus gros poisson du lac a mon âge.'], menu: ['quest'] },
  odette: { name: 'Odette', role: 'Habitante', ap: A('#fde0c5', '#ebe4cf', 3, '#e8a93b', '#7a5a3a', 0, 1),
    intro: ['Oh, quelqu\'un à ma porte ?'], lines: ['Je guette toujours le facteur. J\'attends des nouvelles de ma sœur.', 'Les jeunes d\'aujourd\'hui, toujours pressés.'] },
  gaston: { name: 'Gaston', role: 'Fermier', ap: A('#e5ae7e', '#a8642a', 0, '#4b78c8', '#7a5a3a', 3, 0),
    intro: ['Salut ! Bienvenue à la ferme.'], lines: ['Mes vaches donnent le meilleur lait du comté.', 'Les poules, elles, n\'en font qu\'à leur tête.', 'Rien ne vaut le grand air.'], menu: ['quest'] },
  odd: { name: 'Passant', role: '', ap: A('#e5ae7e', '#6a4126', 0, '#3b3b44', '#3b3b44'), intro: ['...'], lines: ['...'] }
};

/* ------------------------------------------------------------------ */
/*  Bots qui se promènent                                              */
/* ------------------------------------------------------------------ */
D.FIRST = ['Alice', 'Bastien', 'Camille', 'Dominique', 'Élodie', 'Félix', 'Gabrielle', 'Hugo', 'Isabelle', 'Jules', 'Karine', 'Louis', 'Mélanie', 'Nicolas', 'Océane', 'Philippe', 'Rosalie', 'Samuel', 'Thérèse', 'Vincent', 'Xavier', 'Yvette', 'Zacharie', 'Amélie', 'Benoît', 'Cécile', 'Damien', 'Émilie', 'Francis', 'Geneviève', 'Henri', 'Jade', 'Kevin', 'Léa', 'Maxime', 'Noémie', 'Olivier', 'Pascale', 'Rémi', 'Sandrine', 'Audrey', 'Bruno', 'Chloé', 'Delphine', 'Étienne', 'Fabien', 'Gaëtan', 'Hélène', 'Ismaël', 'Julien', 'Kim', 'Laurent', 'Manon', 'Nadia', 'Octave', 'Patrick', 'Quentin', 'Roxane', 'Sylvain', 'Tania', 'Ulysse', 'Valérie', 'William', 'Yann', 'Zoé', 'Adrien', 'Béatrice', 'Cédric', 'Estelle', 'Gilles', 'Inès', 'Lucas', 'Mathis', 'Ophélie', 'Raphaël', 'Solange', 'Théo', 'Ursule', 'Yves'];
D.GENERIC = [
  'Quelle belle journée au village !', 'Le supermarché fait des rabais sur les sandwichs, paraît-il.', 'Tu as déjà essayé le casino ? Moi, j\'y ai laissé ma chemise.',
  'Le ciel est dégagé, parfait pour une balade.', 'J\'ai entendu dire que le lac regorge de poissons.', 'Ce village est tranquille... trop, parfois.',
  'Tu savais que la banque protège ton argent des voleurs ?', 'Je cherche un bon café, tu connais un endroit ?', 'Mon chat a encore ramené une souris, hier.',
  'Il paraît qu\'il y a des quêtes à faire pour la maire.', 'Chez Mimi, les croissants sont divins.', 'Les prix augmentent partout, c\'est incroyable.',
  'Je vais faire un tour au parc, ça fait du bien.', 'Si tu cherches du travail, va au Centre d\'emploi.', 'Pas facile de joindre les deux bouts ces temps-ci.'
];
D.TYPES = {
  gentil:    ['Bonjour ! Tu es nouveau ici ? Bienvenue !', 'N\'hésite pas si tu as besoin d\'aide.', 'Prends soin de toi, mange bien !', 'Les gens sont adorables dans ce village.'],
  grincheux: ['Qu\'est-ce que tu veux ? Je suis occupé.', 'Tout le monde court, personne ne sourit.', 'De mon temps, il y avait moins de monde.', 'Pff, encore un touriste...'],
  curieux:   ['Tu as vu la police, tout à l\'heure ? Ils sont nerveux.', 'On raconte qu\'un marché noir cacherait des armes dans la forêt.', 'J\'aimerais bien savoir ce qui se passe dans l\'entrepôt, au nord-ouest.', 'Paraît que le casino truque ses machines.'],
  joueur:    ['Un petit tour à la roulette, ça te dit ?', 'J\'ai gagné gros hier... puis j\'ai tout reperdu.', 'Au poker, il faut savoir bluffer.', 'Les machines à sous, c\'est ma passion et mon malheur.'],
  sportif:   ['Je fais le tour du village tous les matins.', 'Courir, ça vide la tête !', 'Pas de repos pour les braves.', 'Tu as de bonnes jambes ? On fait la course ?'],
  ancien:    ['Dans ma jeunesse, tout ça n\'existait pas.', 'Le monde change si vite...', 'J\'ai tout vu dans ce village.', 'Écoute les anciens, petit.']
};
D.CTX = {
  wanted: ['Les sirènes... C\'est toi qu\'ils cherchent ?', 'Cours ! La police est juste derrière !', 'Je n\'ai rien vu, moi !'],
  night: ['Il se fait tard, tu ne devrais pas rentrer ?', 'La nuit, le village change de visage...', 'Les rues sont dangereuses la nuit.'],
  hungry: ['Tu fais pâle figure. Mange quelque chose !', 'Ton ventre gargouille d\'ici !'],
  thirsty: ['Tu as l\'air assoiffé. Il y a de l\'eau au supermarché.'],
  pet: ['Quel adorable compagnon !', 'Oh, qu\'il est mignon ton animal !'],
  weapon: ['Range ça ! Tu me fais peur !']
};
D.FLEE = ['Au secours !', 'Non, prenez tout !', 'Je vous en prie, ne me faites pas de mal !', 'Prends mon argent !'];
D.COPLINES = ['Circulez, il n\'y a rien à voir.', 'Je garde l\'oeil ouvert, citoyen.', 'Restez à l\'écart des ennuis.', 'Ici la loi est respectée.'];

/* ------------------------------------------------------------------ */
/*  Vie sociale, maison, nouveaux commerces                            */
/* ------------------------------------------------------------------ */
Object.assign(D.ITEMS, {
  popcorn:  { n: 'Popcorn',          k: 'food',  p: 5,  h: 14, t: -3, f: 6,  d: 'Salé et croustillant.' },
  burger:   { n: 'Burger frites',    k: 'food',  p: 14, h: 60, t: 0,  f: 8,  d: 'Généreux.' },
  steak:    { n: 'Steak-purée',      k: 'food',  p: 20, h: 75, t: 4,  f: 10, hp: 5, d: 'Le plat du chef.' },
  gateau:   { n: 'Gâteau',           k: 'food',  p: 6,  h: 18, t: 0,  f: 12, d: 'Une part de bonheur.' },
  brioche:  { n: 'Brioche',          k: 'food',  p: 4,  h: 18, t: 0,  f: 4,  d: 'Moelleuse.' },
  biere:    { n: 'Bière',            k: 'drink', p: 6,  h: 0,  t: 16, f: 14, d: 'Pour se détendre.' },
  cocktail: { n: 'Cocktail',         k: 'drink', p: 10, h: 0,  t: 20, f: 20, d: 'Fruité et festif.' },
  platmaison:{ n: 'Plat maison',     k: 'food',  p: 0,  h: 65, t: 8,  f: 10, hp: 8, d: 'Cuisiné par toi.' },
  fleurs:   { n: 'Bouquet de fleurs',k: 'gift',  p: 15, g: 8,  d: 'Un cadeau qui fait toujours plaisir.' },
  chocolat: { n: 'Chocolats',        k: 'gift',  p: 10, g: 6,  d: 'Une boîte de chocolats fins.' },
  peluche:  { n: 'Peluche',          k: 'gift',  p: 30, g: 12, d: 'Toute douce.' },
  bijou:    { n: 'Collier',          k: 'gift',  p: 120, g: 24, d: 'Un joli collier.' },
  bague:    { n: 'Bague de fiançailles', k: 'ring', p: 600, g: 0, d: 'Pour demander quelqu\'un en mariage.' }
});
['pomme', 'pain', 'croissant', 'sandwich', 'salade'].forEach(i => { D.ITEMS[i].f = D.ITEMS[i].f || 1; });
Object.assign(D.SHOPS, {
  bakery: { title: 'Boulangerie', items: ['pain', 'croissant', 'brioche', 'gateau', 'cafe', 'lait'] },
  resto:  { title: 'Restaurant', items: ['burger', 'steak', 'pizza', 'salade', 'jus', 'soda', 'biere'] },
  bar:    { title: 'Bar', items: ['biere', 'cocktail', 'soda', 'eau', 'popcorn'] },
  gifts:  { title: 'Boutique cadeaux', items: ['fleurs', 'chocolat', 'peluche', 'bijou', 'bague'] },
  cine:   { title: 'Comptoir du cinéma', items: ['popcorn', 'soda', 'eau'] }
});
D.SHOPS.super.items.push('fleurs');

/* Meubles : w,h en cases, k = sprite, fn = fonction */
D.FURN = {
  bed:       { n: 'Lit',               p: 150,  w: 2, h: 2, k: 'bed', o: { col: '#6fa8dc' }, fn: 'sleep', d: 'Pour dormir et récupérer.' },
  bedlux:    { n: 'Lit double luxe',   p: 700,  w: 2, h: 2, k: 'bed', o: { col: '#c8503f' }, fn: 'sleep', d: 'Sommeil de roi.' },
  sofa:      { n: 'Canapé',            p: 120,  w: 2, h: 1, k: 'sofa', o: { col: '#8a63c9' }, fn: 'sofa', d: 'Détente et siestes.' },
  sofa2:     { n: 'Canapé vert',       p: 160,  w: 3, h: 1, k: 'sofa', o: { col: '#4f9a5a' }, fn: 'sofa', d: 'Trois places.' },
  tvset:     { n: 'Télévision',        p: 250,  w: 2, h: 1, k: 'tvset', fn: 'tv', d: 'Regarder des émissions.' },
  console:   { n: 'Console de jeux',   p: 320,  w: 1, h: 1, k: 'console', fn: 'console', d: 'Jeux vidéo : grosse détente.' },
  piano:     { n: 'Piano',             p: 900,  w: 2, h: 1, k: 'piano', fn: 'piano', d: 'Jouer de la musique.' },
  bookshelf: { n: 'Bibliothèque',      p: 90,   w: 2, h: 1, k: 'bookshelf', fn: 'read', d: 'Lire un bon livre.' },
  fridge:    { n: 'Réfrigérateur',     p: 200,  w: 1, h: 1, k: 'fridge', fn: 'fridge', d: 'Une collation à toute heure.' },
  stove:     { n: 'Cuisinière',        p: 180,  w: 1, h: 1, k: 'stove', fn: 'cook', d: 'Cuisine avec des aliments du sac.' },
  wardrobe:  { n: 'Garde-robe',        p: 110,  w: 1, h: 1, k: 'wardrobe', fn: 'mirror', d: 'Changer d\'apparence.' },
  chest:     { n: 'Coffre',            p: 70,   w: 1, h: 1, k: 'chest', fn: 'stash', d: 'À l\'abri de la police.' },
  treadmill: { n: 'Tapis de course',   p: 400,  w: 1, h: 1, k: 'treadmill', fn: 'gym', d: 'Garde la forme.' },
  crib:      { n: 'Berceau',           p: 120,  w: 1, h: 1, k: 'crib', d: 'Pour bébé.' },
  table:     { n: 'Table',             p: 60,   w: 2, h: 1, k: 'table', o: { cloth: '#fff7e6' }, d: 'Décoration.' },
  chair:     { n: 'Chaise',            p: 25,   w: 1, h: 1, k: 'chair', d: 'Décoration.' },
  desk:      { n: 'Bureau',            p: 80,   w: 2, h: 1, k: 'desk', d: 'Décoration.' },
  plant:     { n: 'Plante',            p: 20,   w: 1, h: 1, k: 'plant', d: 'Décoration.' },
  floorlamp: { n: 'Lampe',             p: 30,   w: 1, h: 1, k: 'floorlamp', d: 'Décoration.' },
  rug1:      { n: 'Tapis bleu',        p: 40,   w: 3, h: 2, k: 'rug', o: { col: '#6fa8dc' }, flat: 1, d: 'Au sol.' },
  rug2:      { n: 'Tapis rouge',       p: 40,   w: 3, h: 2, k: 'rug', o: { col: '#c8503f' }, flat: 1, d: 'Au sol.' },
  toilet:    { n: 'Toilettes',         p: 90,   w: 1, h: 1, k: 'toilet', fn: 'wc', d: 'Pour répondre à l\'appel de la nature.' },
  shower:    { n: 'Douche',            p: 220,  w: 1, h: 1, k: 'shower', fn: 'shower', d: 'Hygiène rapide.' },
  bath:      { n: 'Baignoire',         p: 380,  w: 2, h: 1, k: 'bath', fn: 'bath', d: 'Bain relaxant : hygiène et détente.' },
  wallseg:   { n: 'Mur (cloison)',     p: 15,   w: 1, h: 1, k: 'wallseg', solid: 1, d: 'Pour créer des pièces.' },
  doorseg:   { n: 'Porte intérieure',  p: 35,   w: 1, h: 1, k: 'doorseg', flat: 1, fn: 'door', d: 'Passage dans une cloison.' },
  sofa3:     { n: 'Canapé d\'angle',   p: 260,  w: 3, h: 1, k: 'sofa', o: { col: '#d8708a' }, fn: 'sofa', d: 'Trois places roses.' },
  tvbig:     { n: 'Télé géante',       p: 650,  w: 2, h: 1, k: 'tvset', fn: 'tv', d: 'Cinéma maison.' },
  rug3:      { n: 'Tapis vert',        p: 40,   w: 3, h: 2, k: 'rug', o: { col: '#4f9a5a' }, flat: 1, d: 'Au sol.' }
};
D.HOME_SIZES = [
  { id: 0, n: 'Appartement', w: 10, h: 8, p: 0 },
  { id: 1, n: 'Maison',      w: 14, h: 10, p: 3000 },
  { id: 2, n: 'Villa',       w: 18, h: 12, p: 9000 }
];
D.WALLS = ['#f0e0d0', '#dfe8d0', '#d8e8f0', '#f0d8d0', '#e6dcee', '#f4eec0', '#c8d0c0', '#3a3440'];
D.FLOORS = [{ id: 'wood', n: 'Parquet' }, { id: 'tile', n: 'Carrelage' }, { id: 'carpet', n: 'Moquette bleue', c: '#6f8fc2' }, { id: 'carpet', n: 'Moquette rouge', c: '#a8505a' }, { id: 'dark', n: 'Béton' }];
D.DEFAULT_FURN = [
  { id: 'bed', x: 1, y: 2 }, { id: 'tvset', x: 4, y: 2 }, { id: 'sofa', x: 4, y: 3 }, { id: 'chest', x: 8, y: 2 }, { id: 'wardrobe', x: 6, y: 2 }, { id: 'plant', x: 8, y: 5 }, { id: 'rug1', x: 3, y: 5 }
];

Object.assign(D.NPCS, {
  clara:   { name: 'Clara', role: 'Caissière du cinéma', ap: A('#f7cfa5', '#2b1b14', 2, '#c8403a', '#2b2b33', 0, 0),
    intro: ['Bienvenue au cinéma ! Une place coûte 12 $, et le popcorn est au comptoir.'], lines: ['Prends place dans la salle, le film va commencer.', 'Rien de tel qu\'un bon film pour se détendre.'], menu: ['shop:cine'] },
  bruno:   { name: 'Bruno', role: 'Chef cuisinier', ap: A('#e5ae7e', '#2b1b14', 0, '#f2f2ee', '#3b3b44', 4, 0, '#f2f2ee'),
    intro: ['Bienvenue chez moi ! Ici, tout est fait maison.'], lines: ['Le steak-purée, c\'est ma fierté.', 'On mange mieux quand on prend son temps.'], menu: ['shop:resto'], robbable: { min: 100, max: 300, heat: 2, need: 1, cd: 420, name: 'le restaurant' } },
  odile:   { name: 'Odile', role: 'Bibliothécaire', ap: A('#fde0c5', '#8a8a95', 3, '#8a63c9', '#4a4a55', 0, 1),
    intro: ['Chut... Bienvenue à la bibliothèque. Les livres sont à tout le monde.'], lines: ['Lire détend l\'esprit.', 'Il y a des histoires pour tous les goûts.'] },
  hector:  { name: 'Hector', role: 'Coach sportif', ap: A('#c98e5f', '#2b1b14', 5, '#e8a93b', '#2b2b33', 0, 0),
    intro: ['Salle de sport ! Chaque séance coûte 5 $, mais tu seras plus endurant.'], lines: ['Plus tu t\'entraînes, moins tu te fatigues en courant.', 'Un esprit sain dans un corps sain !'] },
  fanny:   { name: 'Fanny', role: 'Vendeuse de meubles', ap: A('#f7cfa5', '#c94b32', 1, '#3fa9a0', '#3b3b44', 0, 0),
    intro: ['Bienvenue chez Meubles & Cie ! Rends ta maison unique.'], lines: ['Tout ce que tu achètes se pose chez toi avec le mode Aménager.', 'Un piano dans le salon, ça change tout.'], menu: ['furn'] },
  gisele:  { name: 'Gisèle', role: 'Fleuriste', ap: A('#fde0c5', '#ebe4cf', 3, '#f48fb1', '#6a4a8a', 0, 0),
    intro: ['Bonjour ! Un cadeau, ça rapproche les gens.'], lines: ['Les fleurs, c\'est toujours un succès.', 'Pour une demande en mariage, prends la bague.'], menu: ['shop:gifts'] },
  docteur: { name: 'Dr Lemieux', role: 'Médecin', ap: A('#e5ae7e', '#6a4126', 0, '#f2f2ee', '#4a7a9a', 0, 1),
    intro: ['Clinique du village. Que puis-je pour vous ?'], lines: ['Mangez, buvez et dormez : la meilleure médecine.'], menu: ['heal'] },
  alex:    { name: 'Alex', role: 'Gérant de l\'arcade', ap: A('#fde0c5', '#2b1b14', 4, '#4b78c8', '#2b2b33', 0, 0),
    intro: ['Arcade ! Deux dollars la partie. Gagne des prix si tu es doué.'], lines: ['Mon record, c\'est trois mille points.', 'Jouer, c\'est la meilleure détente.'] },
  mario:   { name: 'Mario', role: 'Barman', ap: A('#e5ae7e', '#2b1b14', 0, '#8b4a5a', '#15151c', 0, 0),
    intro: ['Bienvenue au bar ! Qu\'est-ce que je te sers ?'], lines: ['Un cocktail et la soirée est lancée.', 'Il y a de la musique à la piste de danse.'], menu: ['shop:bar'] },
  bijoutier:{ name: 'Mme Vachon', role: 'Bijoutière', ap: A('#f7cfa5', '#9a9a9a', 1, '#6a2a5a', '#2b2b33', 0, 1),
    intro: ['Bienvenue à la Bijouterie. Ici, tout brille.'], lines: ['Une bague pour la personne que vous aimez ?', 'Les caméras fonctionnent très bien, vous savez.'], menu: ['shop:gifts'], robbable: { min: 700, max: 2200, heat: 3, need: 2, cd: 900, name: 'la bijouterie' } },
  moniteur: { name: 'Bernard', role: 'Moniteur d\'auto-école', ap: A('#e5ae7e', '#6a4126', 0, '#d8a82a', '#2b2b33', 0, 1),
    intro: ['Auto-école Bernard ! Pas de permis, pas de volant.'], lines: ['La prudence avant la vitesse.', 'Le permis expire chaque semaine : pensez à le renouveler !'], menu: ['x:drive'] },
  vendeur: { name: 'Sophie', role: 'Vendeuse de voitures', ap: A('#f7cfa5', '#2b1b14', 3, '#1b2a52', '#1b2a52', 0, 0),
    intro: ['Bienvenue ! Une belle voiture, ça change la vie.'], lines: ['La sportive est un bijou.', 'Reprise de votre ancienne voiture à moitié prix.'], menu: ['x:cars'] },
  mecano: { name: 'Roméo', role: 'Mécanicien', ap: A('#c98e5f', '#2b1b14', 4, '#3b6aa8', '#2b2b33', 1, 0, '#c8503f'),
    intro: ['Amène ta voiture devant le garage, je m\'en occupe.'], lines: ['Moteur, suspension, pneus, peinture, aileron : tout y passe.'], menu: ['x:garage'] },
  juge:    { name: 'Juge Fortin', role: 'Juge aux affaires familiales', ap: A('#e5ae7e', '#8a8a8a', 0, '#2b2b33', '#2b2b33', 0, 1),
    intro: ['Tribunal des familles. Mariages en difficulté, séparations : je m\'en occupe.'], lines: ['Réfléchissez bien avant de signer.', 'Les enfants restent toujours à la maison familiale.'], menu: ['divorce'] },
  pizzaiolo:{ name: 'Gino', role: 'Pizzaiolo', ap: A('#f7cfa5', '#2b1b14', 2, '#f2f2ee', '#c8503f', 1, 0),
    intro: ['Ciao ! Les meilleures pizzas du village !'], lines: ['La pâte, c\'est un art.', 'Une part ?'], menu: ['shop:pizz'], robbable: { min: 90, max: 280, heat: 2, need: 1, cd: 420, name: 'la pizzeria' } },
  boulanger:{ name: 'Rosalie', role: 'Boulangère', ap: A('#f7cfa5', '#6a4126', 1, '#f2f2ee', '#c8a070', 0, 0),
    intro: ['Bonjour ! Le pain sort du four.'], lines: ['Mes croissants partent toujours en premier.', 'Un gâteau pour une occasion spéciale ?'], menu: ['shop:bakery'] }
});
D.SOCIAL = {
  chat: ['Tu as vu le temps qu\'il fait ?', 'Cette place est vraiment agréable.', 'Je prends l\'air un peu, ça fait du bien.', 'Il paraît qu\'il y a de bonnes choses au marché.', 'Tu viens souvent ici ?'],
  perso: ['Ma famille vit loin d\'ici, elle me manque parfois.', 'J\'ai toujours rêvé de voyager.', 'Mon plat préféré ? Tout ce qui est fait avec amour.', 'Je me sens bien dans ce village.', 'J\'aime les gens sincères comme toi.'],
  joke: ['Pourquoi les plongeurs plongent-ils toujours en arrière ? Parce que sinon ils tombent dans le bateau !', 'Je voulais te raconter une blague sur la boulangerie... mais elle est pas assez cuite.', 'Qu\'est-ce qui est jaune et qui attend ? Jonathan.'],
  lovefail: ['Désolé... je te vois plutôt comme un ami.', 'C\'est gentil, mais je ne suis pas prêt(e) pour ça.', 'Hmm... laisse-moi un peu de temps.']
};
})();
