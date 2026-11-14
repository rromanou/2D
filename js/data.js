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
  canne:    { n: 'Canne à pêche',    k: 'tool',   p: 45,  d: 'Pour pêcher au bord de l\'eau.' },
  hache:    { n: 'Hache',            k: 'tool',   p: 60,  d: 'Pour couper du bois en forêt.' },
  lettre:   { n: 'Lettre',           k: 'misc',   p: 0,   d: 'Une lettre cachetée.' },
  colis:    { n: 'Colis',            k: 'misc',   p: 0,   d: 'Un colis à livrer.' },
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
  super:    { title: 'Supermarché',        items: ['pomme', 'pain', 'sandwich', 'pizza', 'salade', 'poulet', 'eau', 'jus', 'soda', 'lait', 'cafe'] },
  cafe:     { title: 'Café Chez Mimi',     items: ['cafe', 'croissant', 'sandwich', 'pizza', 'jus', 'lait'] },
  hardware: { title: 'Quincaillerie',      items: ['canne', 'hache'] },
  black:    { title: 'Marché noir',        items: ['couteau', 'pistolet', 'fusil', 'balles', 'cagoule', 'pied', 'crochets'] },
  studio:   { title: 'Atelier Style',      items: ['hat_1', 'hat_2', 'hat_3', 'hat_4', 'hat_5', 'gl_1', 'gl_2'] },
  pet:      { title: 'Animalerie',         items: ['pet_chien', 'pet_chat', 'pet_lapin', 'pet_poule'] }
};

/* ------------------------------------------------------------------ */
/*  Emplois                                                            */
/* ------------------------------------------------------------------ */
D.JOBS = {
  caissier: { n: 'Caissier', place: 'Supermarché', pay: [22, 34], d: 'Passe les articles des clients à la caisse du supermarché (poste de caisse, au fond à droite).' },
  livreur:  { n: 'Livreur', place: 'Bureau de poste', pay: [55, 90], d: 'Prends un colis au bureau de poste puis livre-le à la bonne adresse avant la fin du temps imparti.' },
  pecheur:  { n: 'Pêcheur', place: 'Lac', pay: [14, 38], need: 'canne', d: 'Pêche au bord de l\'eau avec ta canne : chaque prise est vendue sur place.' },
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
D.FIRST = ['Alice', 'Bastien', 'Camille', 'Dominique', 'Élodie', 'Félix', 'Gabrielle', 'Hugo', 'Isabelle', 'Jules', 'Karine', 'Louis', 'Mélanie', 'Nicolas', 'Océane', 'Philippe', 'Rosalie', 'Samuel', 'Thérèse', 'Vincent', 'Xavier', 'Yvette', 'Zacharie', 'Amélie', 'Benoît', 'Cécile', 'Damien', 'Émilie', 'Francis', 'Geneviève', 'Henri', 'Jade', 'Kevin', 'Léa', 'Maxime', 'Noémie', 'Olivier', 'Pascale', 'Rémi', 'Sandrine'];
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
})();
