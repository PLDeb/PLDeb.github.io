# Audit web gratuit Veelution (v0)

Un visiteur entre l'adresse de son site. Le Worker mesure le site, Claude juge ce qui ne se mesure pas avec un outil et rédige 3 constats, le code calcule la note avec la grille Veelution. Pierre-Luc reçoit les 3 fichiers et envoie (ou non) le rapport au client.

## Parcours
1. `public/index.html` : formulaire (URL, prénom, courriel, entreprise, 2 cases obligatoires, 1 case facultative pour les suivis). Turnstile + champ piège.
2. `POST /api/audit` : valide, refuse les adresses privées, un audit par domaine par 30 jours, 3 demandes par IP par jour. Écrit dans D1 et met en file.
3. File d'attente (consommateur dans le même Worker) :
   - lit l'accueil, teste jusqu'à 12 liens, vérifie la page contact (rien n'est soumis);
   - PageSpeed mobile, 3 passages, médiane (jusqu'à 5 si écart de plus de 15 points);
   - capture cellulaire et bouton d'action avec Browser Rendering;
   - Claude juge 12 critères (nom, région, quoi/pour qui/où, périmé, photos, preuves) puis rédige;
   - `score.js` calcule la note. L'IA ne note jamais.
4. Résultat dans R2 : `client.html`, `interne.html`, `prompt.md`, `data.json`. Garde-fous : le client ne contient aucune note interne (le build échoue sinon); tout chiffre du texte client doit se retrouver dans les mesures, sinon drapeau.
5. Courriel à Pierre-Luc avec les 3 fichiers en pièces jointes et un lien vers `/admin/<id>?k=<clé>`.
6. Sur la page de revue : un bouton « Envoyer au client ». Le prospect reçoit un courriel avec son lien privé `/r/<code>`.

`AUTO_SEND=false` au départ : rien ne part chez le client sans ton clic. Passer à `true` seulement quand les audits automatiques collent aux audits manuels. Même à `true`, un audit avec un drapeau reste en revue.

## Mise en ligne
```bash
npm install
npx wrangler d1 create audit-veelution            # copier le database_id dans wrangler.jsonc
npx wrangler d1 execute audit-veelution --remote --file=schema.sql
npx wrangler r2 bucket create audit-veelution-rapports
npx wrangler queues create audit-veelution
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put PSI_API_KEY               # clé gratuite Google (API PageSpeed Insights)
npx wrangler secret put RESEND_API_KEY            # domaine veelution.com à vérifier dans Resend
npx wrangler secret put TURNSTILE_SECRET          # + TURNSTILE_SITEKEY dans wrangler.jsonc
npx wrangler secret put IP_SALT                   # texte aléatoire
npx wrangler secret put WEBHOOK_URL               # optionnel (Make.com : lead dans l'app maison, fichiers au Drive)
npx wrangler deploy
```
Puis : domaine personnalisé `audit.veelution.com` sur ce Worker. Le site principal pointe vers cette page (bouton « Audit gratuit ») ou l'option « Audit de mon site » du formulaire de contact.

## Tests
`npm test` : validation d'URL, extraction du HTML, grille, garde-fous, étanchéité client/interne. Aucun appel réseau. `npm run check` vérifie que le Worker compile.

## Ce qui n'a pas été testé en vrai
Aucun appel à Cloudflare (Browser Rendering, Queues, D1, R2), à Claude, à PageSpeed ni à Resend. Le premier vrai audit passe par ton œil : compare-le à un audit manuel du même site.

## Limites connues (v0)
- Fiche Google d'entreprise et ouverture des liens de réseaux : `null` (« à confirmer »), à faire à la main.
- Pas de PDF du rapport, pas de comparaison avec des concurrents, pas de repères numérotés sur la capture.
- PageSpeed peut renvoyer un résultat en cache : si les 3 passages ont le même horodatage, un drapeau le dit.
- Aucune purge des données : à décider (durée de conservation des demandes, Loi 25).
- Le classement dans le Drive passe par le webhook (Make.com), pas de code ici.
- La grille existe en deux endroits : le skill `audit-web-veelution` et `src/score.js`. Toute modification se fait aux deux.
- Le courriel au prospect tutoie (règle des courriels), le rapport vouvoie (règle des documents). À valider.
- Le plan Cloudflare doit couvrir Queues et Browser Rendering : à confirmer dans ton compte.
