// La grille Veelution en code. Source de vérité : le skill audit-web-veelution (étape 2).
// Si la grille change dans le skill, elle change ici aussi (et inversement).
// Un critère à `null` est retiré du calcul et listé « à vérifier ».

const fr = (n) => String(n).replace(".", ",");
const k = (nom, max, points, note) => ({ nom, max, points, ...(note ? { note } : {}) });

export function scoreCategory(cat) {
  let got = 0, max = 0, total = 0;
  for (const c of cat.criteres) {
    total += c.max;
    if (c.points !== null) { got += c.points; max += c.max; }
  }
  if (!total || max / total < 0.6) return null; // moins de 60 % vérifié : « À compléter »
  return Math.round((got / max) * 100);
}

export function scoreAll(cats) {
  const scores = cats.map(scoreCategory);
  const ok = scores.filter((s) => s !== null);
  const finale = ok.length ? Math.round(ok.reduce((a, b) => a + b, 0) / ok.length) : null;
  return { scores, finale };
}

export function buildCategories({ facts, psi, links, contact, dom, judge, page, year = new Date().getFullYear() }) {
  const J = judge || {};

  // ---------- Vitesse et sécurité ----------
  const lcp = psi?.lcp ?? null;
  const vitesse = [
    psi
      ? k("Score de vitesse Google sur cellulaire", 40, Math.round(psi.median * 0.4),
          `PageSpeed mobile : ${psi.median}/100, médiane de ${psi.passes.length} passages (${psi.passes.join(", ")})`)
      : k("Score de vitesse Google sur cellulaire", 40, null, "Mesure indisponible"),
    k("Connexion sécurisée (HTTPS)", 20, page.finalUrl.startsWith("https://") ? 20 : 0),
    lcp == null
      ? k("Plus grand élément affiché en moins de 2,5 s sur cellulaire", 20, null, "Mesure indisponible")
      : k("Plus grand élément affiché en moins de 2,5 s sur cellulaire", 20, lcp <= 2500 ? 20 : lcp <= 4000 ? 10 : 0, `Mesuré à ${fr((lcp / 1000).toFixed(1))} s`),
    links && links.tested >= 3
      ? k("Aucun lien brisé dans le menu et le pied de page", 20, links.broken.length === 0 ? 20 : links.broken.length === 1 ? 10 : 0,
          `${links.tested} liens testés, ${links.broken.length === 0 ? "tous fonctionnels" : links.broken.length + " brisé(s)"}`)
      : k("Aucun lien brisé dans le menu et le pied de page", 20, null, "Pas assez de liens à tester"),
  ];

  // ---------- Visibilité Google ----------
  const tl = facts.title.length, dl = facts.description.length;
  let titrePts = 0, titreNote = "Aucun titre de page trouvé";
  if (tl) {
    titrePts = tl >= 30 && tl <= 60 && J.titre_bon_nom === true ? 15 : 7;
    titreNote = `${tl} caractères (idéal : 30 à 60) : « ${facts.title.slice(0, 70)} »`;
  }
  let descPts = 0, descNote = "Aucune description trouvée";
  if (dl) {
    const ok1 = dl >= 70 && dl <= 160, ok2 = J.description_a_jour === true;
    descPts = ok1 && ok2 ? 15 : ok1 || ok2 ? 7 : 0;
    descNote = `${dl} caractères (idéal : 70 à 160)${J.description_a_jour === false ? ", contenu à mettre à jour" : ""}`;
  }
  const { total: nImg, sansAlt } = facts.imgs;
  const visibilite = [
    k("Titre de page clair, au bon nom", 15, titrePts, titreNote),
    k("Description Google à jour et de bonne longueur", 15, descPts, descNote),
    J.region_mentionnee == null
      ? k("Ville ou région mentionnée", 10, null, "Non déterminé")
      : k("Ville ou région mentionnée", 10, J.region_mentionnee ? 10 : 0, J.region_mentionnee ? undefined : "Aucune mention trouvée sur l'accueil"),
    nImg > 0
      ? k("Images décrites pour Google", 10, Math.round((10 * (nImg - sansAlt)) / nImg), `${nImg - sansAlt} images sur ${nImg} ont une description`)
      : k("Images décrites pour Google", 10, null, "Aucune image trouvée"),
    psi ? k("Base technique SEO (Google)", 15, Math.round((psi.seo * 15) / 100), `PageSpeed SEO : ${psi.seo}/100`) : k("Base technique SEO (Google)", 15, null, "Mesure indisponible"),
    k("Fiche d'entreprise lisible par Google (données structurées)", 10, facts.ldjson > 0 ? 10 : 0, facts.ldjson > 0 ? undefined : "Aucune trouvée sur l'accueil"),
    k("Fiche Google d'entreprise trouvée au bon nom", 15, null, "À confirmer avec vous : cette vérification se fait lors de l'appel"),
    k("Fiche Google d'entreprise complète (heures, photos, lien vers le site)", 10, null, "À confirmer avec vous : cette vérification se fait lors de l'appel"),
  ];

  // ---------- Clarté ----------
  const triple = [J.quoi, J.pour_qui, J.ou];
  const nTriple = triple.filter((x) => x === true).length;
  const compris = judge
    ? k("On comprend ce que vous faites dès l'ouverture (quoi, pour qui, où)", 25, nTriple === 3 ? 25 : nTriple === 2 ? 12 : 0,
        `${["quoi", "pour qui", "où"].filter((_, i) => triple[i] === true).join(", ") || "rien de clair"} : ${nTriple} sur 3 se comprennent dans le premier écran`)
    : k("On comprend ce que vous faites dès l'ouverture (quoi, pour qui, où)", 25, null, "Non déterminé");
  let bouton;
  if (!dom) bouton = k("Un seul bouton d'action clair dans le premier écran", 20, null, "Capture indisponible");
  else {
    const n = dom.dom.distinctButtons;
    bouton = k("Un seul bouton d'action clair dans le premier écran", 20, n === 1 ? 20 : n === 0 ? 0 : 8,
      n === 0 ? "Aucun bouton trouvé dans la zone principale" : n === 1 ? `Un bouton : « ${dom.dom.buttons[0].text} »` : `${n} boutons vers des destinations différentes`);
  }
  const header = [...facts.tel, ...facts.mail].filter((x) => x.where === "nav");
  const anyContact = [...facts.tel, ...facts.mail].length > 0 || facts.contactUrl;
  const contactVisible = header.length ? 20 : anyContact ? 10 : 0;
  const contactExiste = contact
    ? k("Un moyen de contact qui fonctionne", 10, contact.ok ? 10 : 0, contact.form ? "Formulaire avec courriel trouvé (rien n'a été envoyé)" : contact.link ? "Courriel ou téléphone cliquable trouvé" : "Rien de cliquable trouvé sur la page contact")
    : (facts.tel.length || facts.mail.length)
      ? k("Un moyen de contact qui fonctionne", 10, 10, "Courriel ou téléphone cliquable trouvé")
      : k("Un moyen de contact qui fonctionne", 10, 0, "Aucune page contact ni courriel cliquable trouvés");
  const clarte = [
    compris,
    bouton,
    k("Contact facile à trouver", 20, contactVisible, contactVisible === 20 ? "Téléphone ou courriel dans l'en-tête" : contactVisible === 10 ? "Courriel ou lien « Contact » sans être dans l'en-tête" : "Aucun contact trouvé"),
    contactExiste,
    !dom
      ? k("Adapté au cellulaire", 15, null, "Capture indisponible")
      : k("Adapté au cellulaire", 15, facts.viewport && dom.dom.scrollWidth <= 390 ? 15 : 0, facts.viewport ? (dom.dom.scrollWidth <= 390 ? undefined : "Le contenu dépasse l'écran en largeur") : "Balise d'affichage cellulaire absente"),
    psi ? k("Accessibilité (Google)", 10, Math.round((psi.a11y * 10) / 100), `PageSpeed accessibilité : ${psi.a11y}/100`) : k("Accessibilité (Google)", 10, null, "Mesure indisponible"),
  ];

  // ---------- Cohérence et contenu à jour ----------
  const noms = Array.isArray(J.variantes_nom) ? [...new Set(J.variantes_nom.filter(Boolean))] : null;
  const perimes = Array.isArray(J.infos_perimees) ? [...J.infos_perimees] : null;
  if (perimes && facts.copyrightYear && facts.copyrightYear < year - 1) perimes.push(`Droit d'auteur ${facts.copyrightYear}`);
  const ph = J.photos;
  const coherence = [
    noms && noms.length
      ? k("Même nom partout (titre, courriel, réseaux, domaine)", 25, noms.length === 1 ? 25 : noms.length === 2 ? 15 : 0, noms.length === 1 ? undefined : `Noms trouvés : ${noms.join(", ")}`)
      : k("Même nom partout (titre, courriel, réseaux, domaine)", 25, null, "Non déterminé"),
    perimes
      ? k("Aucune information périmée", 25, perimes.length === 0 ? 25 : 0, perimes.length ? perimes.join("; ") : undefined)
      : k("Aucune information périmée", 25, null, "Non déterminé"),
    k("Liens vers les bons comptes de réseaux", 15, null, "À confirmer en ouvrant chaque lien"),
    ph === "reelles" ? k("Vraies photos de l'entreprise", 20, 20)
      : ph === "aucune" ? k("Vraies photos de l'entreprise", 20, 10, "Pas de banque d'images, mais peu ou pas de vraies photos de l'entreprise")
      : ph === "banque" ? k("Vraies photos de l'entreprise", 20, 0, "Photos qui semblent venir d'une banque d'images")
      : k("Vraies photos de l'entreprise", 20, null, "À confirmer"),
    J.preuves == null
      ? k("Preuves visibles (témoignages, avis, réalisations)", 15, null, "Non déterminé")
      : k("Preuves visibles (témoignages, avis, réalisations)", 15, J.preuves ? 15 : 0, J.preuves ? undefined : "Aucun témoignage ni avis trouvé sur l'accueil"),
  ];

  // ---------- Prêt à grandir (présence des outils) ----------
  const reseaux = Object.keys(facts.social);
  const grandir = [
    k("Inscription par courriel (infolettre)", 25, facts.newsletter ? 25 : 0),
    facts.platform
      ? k("Vous pouvez modifier votre site vous-même", 25, 25, `Plateforme ${facts.platform}`)
      : k("Vous pouvez modifier votre site vous-même", 25, null, "Site sur mesure : à confirmer avec vous"),
    facts.tracking.length
      ? k("Suivi des visites installé", 25, 25, facts.tracking.join(", ") + " détecté")
      : k("Suivi des visites installé", 25, 0, "Aucun outil de mesure détecté"),
    reseaux.length
      ? k("Réseaux sociaux reliés", 25, 25, reseaux.join(", "))
      : k("Réseaux sociaux reliés", 25, 0, "Aucun lien vers vos réseaux trouvé"),
  ];

  return [
    { nom: "Vitesse et sécurité", criteres: vitesse },
    { nom: "Visibilité Google", criteres: visibilite },
    { nom: "Clarté", criteres: clarte },
    { nom: "Cohérence et contenu à jour", criteres: coherence },
    { nom: "Prêt à grandir", criteres: grandir },
  ];
}
