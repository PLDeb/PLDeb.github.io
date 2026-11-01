// Rendu des rapports à partir du gabarit du skill. Le client ne reçoit jamais le bloc interne.

export function renderReport(template, data) {
  const json = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  return template.replace("__AUDIT_JSON__", () => json);
}

export const EMPTY_INTERNE = () => ({ contexte: [], trouvailles: [], upsells: [], script: [], a_verifier: [] });

export function clientData(full) {
  const c = JSON.parse(JSON.stringify(full));
  c.mode = "client";
  c.interne = EMPTY_INTERNE();
  return c;
}

// Filet de sécurité : aucune phrase interne ne doit se retrouver dans la ligne `const AUDIT` du fichier client.
export function assertNoLeak(clientHtml, interne) {
  const line = clientHtml.split("\n").find((l) => l.includes("const AUDIT")) || "";
  const strings = Object.values(interne || {}).flat().filter((s) => typeof s === "string" && s.length >= 15);
  for (const s of strings) {
    const needle = JSON.stringify(s).slice(1, -1).replace(/</g, "\\u003c");
    if (line.includes(needle)) throw new Error("Fuite détectée : une note interne se retrouve dans le fichier client.");
  }
  if (/"mode":"interne"/.test(line)) throw new Error("Le fichier client est en mode interne.");
}

// Ce qui a vraiment été mesuré : seul ce texte peut justifier un chiffre dans le rapport client.
export function measuredBlob({ categories, scores, finale, psi, facts, links }) {
  const parts = [finale, ...scores];
  for (const c of categories) for (const k of c.criteres) {
    if (k.points !== null) parts.push(k.points);
    if (k.note) parts.push(k.note);
  }
  if (psi) {
    parts.push(...psi.passes, psi.median, psi.seo, psi.a11y);
    for (const ms of [psi.lcp, psi.fcp, psi.tbt]) if (ms != null) parts.push(Math.round(ms), (ms / 1000).toFixed(1));
  }
  parts.push(facts.title.length, facts.description.length, facts.imgs.total, facts.imgs.sansAlt, links?.tested, links?.broken?.length);
  return parts.filter((x) => x !== undefined && x !== null).join(" ");
}

// Chiffres du texte destiné au client qui ne se retrouvent dans aucune mesure (arrondis permis : 12,3 s peut s'écrire 12 s).
export function unmatchedNumbers(report, measured) {
  const texts = [
    ...(report.bonnes_nouvelles || []),
    ...(report.constats || []).flatMap((c) => [c.titre, c.constat, c.pourquoi, c.travail]),
    ...(report.plan || []).flatMap((p) => [p.etape, p.cible]),
    ...((report.croissance && report.croissance.paragraphes) || []),
  ].filter(Boolean);
  const norm = (s) => s.replace(",", ".").replace(/\.0+$/, "");
  const known = new Set();
  for (const m of measured.match(/\d+(?:[.,]\d+)?/g) || []) {
    const n = norm(m);
    known.add(n);
    if (n.includes(".")) { known.add(String(Math.floor(Number(n)))); known.add(String(Math.round(Number(n)))); }
  }
  const free = new Set(["15", "100", "2.5", "90"]); // durée de l'appel, échelle, cibles standard de la grille
  const out = [];
  for (const t of texts) {
    for (const m of t.match(/\d+(?:[.,]\d+)?/g) || []) {
      const n = norm(m);
      if (!known.has(n) && !free.has(n) && !out.includes(m)) out.push(m);
    }
  }
  return out;
}
