// Tests locaux : validation d'URL, extraction HTML, grille, garde-fous, rendu des rapports.
// Aucun appel réseau. Lancer : npm test
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { validateUrl, cleanDashes } from "../src/util.js";
import { parseFacts } from "../src/collect.js";
import { buildCategories, scoreAll } from "../src/score.js";
import { renderReport, clientData, assertNoLeak, unmatchedNumbers, measuredBlob } from "../src/report.js";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "out");
mkdirSync(out, { recursive: true });
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? "OK   " : "ECHEC") + " " + msg); if (!cond) fails++; };

// ---- 1. Validation d'URL (SSRF et formats)
const bad = ["localhost", "http://127.0.0.1", "http://192.168.1.5/admin", "http://[::1]/", "https://user:pw@site.com", "ftp://site.com", "site", "http://site.com:8080", "http://2130706433/", "http://0x7f.1/", "javascript:alert(1)", "http://intranet.local", "a b.com"];
for (const b of bad) ok(validateUrl(b).error, "refuse " + b);
const good = validateUrl("WWW.Exemple.com/page?x=1");
ok(good.url === "https://www.exemple.com/" && good.domain === "exemple.com", "accepte et normalise WWW.Exemple.com → " + good.url);

// ---- 2. Extraction HTML
const facts = parseFacts(readFileSync(join(here, "fixture-site.html"), "utf8"), "https://ldtsupply.com/");
ok(facts.title === "LDTGiveaway - Accueil", "titre lu");
ok(facts.platform === "Shopify", "plateforme Shopify");
ok(facts.tracking.includes("Google Analytics / Tag Manager") && facts.tracking.includes("pixel Meta"), "suivi détecté");
ok(facts.ldjson === 1, "données structurées comptées");
ok(facts.newsletter === true, "infolettre détectée");
ok(facts.imgs.total === 3 && facts.imgs.sansAlt === 1, `images : 3 comptées (pixel exclu), 1 sans alt (${facts.imgs.total}/${facts.imgs.sansAlt})`);
ok(facts.contactUrl === "https://ldtsupply.com/pages/contact", "page contact trouvée");
ok(Object.keys(facts.social).sort().join() === "Facebook,Instagram", "réseaux trouvés");
ok(facts.copyrightYear === 2023, "année de droit d'auteur");
ok(facts.mail.length === 1 && facts.mail[0].where === "footer", "courriel dans le pied de page");
ok(facts.navLinks.length === 3 && facts.footerLinks.length === 1, "liens de menu et de pied de page séparés");

// ---- 3. Grille avec des mesures simulées (cas LDT)
const psi = { passes: [52, 57, 61], median: 57, seo: 100, a11y: 95, lcp: 12300, spread: 9, cached: false, failing: [] };
const dom = { capture: "", dom: { scrollWidth: 390, distinctButtons: 0, buttons: [], heroText: "LDT est de retour !" } };
const judge = { titre_bon_nom: false, description_a_jour: false, region_mentionnee: false, quoi: false, pour_qui: false, ou: false, variantes_nom: ["LDT Supply", "LDTGiveaway"], infos_perimees: ["Concours Nissan 370z"], photos: "reelles", preuves: false };
const cats = buildCategories({ facts, psi, links: { tested: 4, broken: [] }, contact: { ok: true, form: false, link: true }, dom, judge, page: { finalUrl: "https://ldtsupply.com/" }, year: 2026 });
const { scores, finale } = scoreAll(cats);
console.log("   scores :", cats.map((c, i) => `${c.nom} ${scores[i] ?? "n/d"}`).join(" | "), "| finale", finale);
ok(cats.length === 5 && cats.map((c) => c.nom).join() === "Vitesse et sécurité,Visibilité Google,Clarté,Cohérence et contenu à jour,Prêt à grandir", "5 catégories, bons noms, bon ordre");
ok(cats.every((c) => c.criteres.reduce((a, x) => a + x.max, 0) === 100), "chaque catégorie compte 100 points");
ok(cats[0].criteres[0].points === 23, "vitesse : 57 × 0,4 = 23");
ok(cats[0].criteres[2].points === 0, "LCP 12,3 s = 0 point");
ok(cats[1].criteres[0].points === 7, "titre mal nommé = 7");
ok(cats[3].criteres[0].points === 15 && cats[3].criteres[1].points === 0, "un nom différent = 15, info périmée (concours + © 2023) = 0");
ok(scores[4] === 100, "Prêt à grandir = 100 (présence des outils)");
ok(scores.every((s) => s !== null), "aucune catégorie « À compléter » avec ces mesures");

// critères non vérifiables : retirés du calcul, jamais devinés
const sansMesures = buildCategories({ facts, psi: null, links: null, contact: null, dom: null, judge: null, page: { finalUrl: "https://ldtsupply.com/" } });
const s2 = scoreAll(sansMesures);
ok(s2.scores[0] === null, "sans PageSpeed ni liens : Vitesse « À compléter » (moins de 60 % vérifié)");
ok(sansMesures[2].criteres[1].points === null && sansMesures[2].criteres[4].points === null, "sans capture : bouton et mobile = null");

// ---- 4. Garde-fou sur les chiffres
const blob = measuredBlob({ categories: cats, scores, finale, psi, facts, links: { tested: 4, broken: [] } });
const rapport = {
  bonnes_nouvelles: ["Google donne 100/100 pour la base technique.", "Le site est sécurisé."],
  constats: [{ titre: "Sur cellulaire, la grande image prend 12,3 secondes", constat: "Médiane de 3 passages : 57/100.", pourquoi: "p", travail: "t" }],
  plan: [{ etape: "Alléger les images", cible: "Affichage sous 2,5 secondes" }],
  croissance: { paragraphes: ["Vous avez déjà 88 outils."] },
};
const orphans = unmatchedNumbers(rapport, blob);
ok(orphans.join() === "88", `chiffre inventé repéré (« 88 outils » absent des mesures) → [${orphans}]`);
ok(unmatchedNumbers({ constats: [{ titre: "x", constat: "Le plus grand élément prend 12 secondes. Médiane 57/100.", pourquoi: "", travail: "" }] }, blob).length === 0, "arrondi permis : 12,3 s peut s'écrire 12 secondes");
ok(cleanDashes("a — b – c") === "a, b, c", "tirets cadratins remplacés");

// ---- 5. Rendu et étanchéité client / interne
const template = readFileSync(join(here, "../src/template.html"), "utf8");
const interne = {
  contexte: ["Demande reçue de Cédric (cedric@exemple.com) pour LDT Supply."],
  trouvailles: ["Un des liens Facebook pointe vers une autre page."],
  upsells: ["Optimisation et retouche des photos, à soumissionner à part."],
  script: ["Ouvrir avec la bonne nouvelle : base technique à 100/100."],
  a_verifier: ["Confirmer le lien Facebook avant de le mentionner."],
};
const data = {
  entreprise: "LDT Supply", url: "https://ldtsupply.com", date: "31 octobre 2026", mode: "interne",
  mesure: { outil: "PageSpeed Insights (Google)", date: "31 octobre 2026", passes_mobile: psi.passes },
  capture: "", categories: cats,
  bonnes_nouvelles: ["Google donne 100/100 pour le SEO technique et 95/100 pour l'accessibilité.", "Le site est sécurisé (HTTPS) et aucun lien du menu ou du pied de page n'est brisé."],
  constats: [
    { categorie: "Cohérence", titre: "Votre site porte encore l'ancien nom", constat: "L'onglet affiche « LDTGiveaway - Accueil ».", pourquoi: "Un visiteur voit un concours terminé avant de voir votre merch.", travail: "Revoir titre et description de chaque page, en deux langues, sans perdre le référencement." },
    { categorie: "Vitesse", titre: "Sur cellulaire, la grande image prend 12 secondes", constat: "Le plus grand élément s'affiche à 12,3 secondes. Score retenu : 57/100.", pourquoi: "Vos visiteurs arrivent surtout de leur cellulaire.", travail: "Alléger les images et revoir l'ordre de chargement du thème." },
    { categorie: "Clarté", titre: "En arrivant, le visiteur ne sait pas quoi faire", constat: "Aucun bouton dans le premier écran.", pourquoi: "Un visiteur doit deviner où cliquer.", travail: "Restructurer l'accueil autour d'un seul bouton." },
  ],
  plan: [{ etape: "Corriger le nom et les descriptions", cible: "Un seul nom partout" }, { etape: "Alléger l'image d'accueil", cible: "Affichage sous 2,5 secondes sur cellulaire" }, { etape: "Un seul bouton vers la boutique", cible: "Un bouton dans le premier écran" }],
  comparaison: [],
  croissance: { titre: "Et si votre site travaillait pour vous?", paragraphes: ["Les outils sont là, mais cette note mesure leur présence, pas leur usage.", "Le morceau manquant : les faire travailler ensemble."] },
  appel: { titre: "On en jase 15 minutes?", texte: "Aucune obligation.", bouton: "Appeler Pierre-Luc", lien: "tel:+15813727527" },
  interne,
};
const htmlInterne = renderReport(template, data);
const htmlClient = renderReport(template, clientData(data));
writeFileSync(join(out, "interne.html"), htmlInterne);
writeFileSync(join(out, "client.html"), htmlClient);
let leakOk = true; try { assertNoLeak(htmlClient, interne); } catch { leakOk = false; }
ok(leakOk, "le fichier client ne contient aucune note interne");
let caught = false; try { assertNoLeak(renderReport(template, { ...clientData(data), interne }), interne); } catch { caught = true; }
ok(caught, "le garde-fou détecte une fuite volontaire");
const injected = renderReport(template, clientData({ ...data, entreprise: "</script><img src=x onerror=alert(1)>" }));
ok(!injected.includes("</script><img"), "un nom d'entreprise piégé ne casse pas la page");

console.log(fails ? `\n${fails} échec(s)` : "\nTous les tests passent.");
process.exit(fails ? 1 : 0);
