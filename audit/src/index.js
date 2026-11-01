// Audit web gratuit Veelution : Worker (formulaire, file d'attente, revue avant envoi).
import template from "./template.html";
import { validateUrl, token, sha256, safeEqual, frDate, esc, slug, b64text, cleanDashes } from "./util.js";
import { fetchPage, parseFacts, checkLinks, checkContact, pagespeed } from "./collect.js";
import { renderMobile } from "./browser.js";
import { judge, writeReport, writePromptMd } from "./ai.js";
import { buildCategories, scoreAll } from "./score.js";
import { renderReport, clientData, assertNoLeak, unmatchedNumbers, measuredBlob } from "./report.js";
import { sendMail, clientEmail } from "./mail.js";

const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const PRIVATE = { "x-robots-tag": "noindex, nofollow", "referrer-policy": "no-referrer", "cache-control": "private, no-store" };

export default {
  async fetch(request, env) {
    const u = new URL(request.url), p = u.pathname;
    try {
      if (request.method === "POST" && p === "/api/audit") return await createAudit(request, env);
      if (p === "/api/config") {
        return json({
          turnstileSiteKey: env.TURNSTILE_SITEKEY || "",
          auto: env.AUTO_SEND === "true",
          delayText: env.DELAY_TEXT || "Vous le recevrez par courriel dès que nous l'aurons validé.",
        });
      }
      let m;
      if ((m = p.match(/^\/r\/([a-f0-9]{32,})$/))) return await clientReport(env, m[1]);
      if ((m = p.match(/^\/admin\/([a-f0-9-]{36})(?:\/(client|interne|prompt|send))?$/))) return await admin(request, env, m[1], m[2], u);
      return env.ASSETS.fetch(request);
    } catch (e) {
      console.error(e);
      return json({ ok: false, error: "Erreur interne. Réessayez dans un moment." }, 500);
    }
  },

  async queue(batch, env) {
    for (const msg of batch.messages) {
      await processAudit(env, msg.body.id);
      msg.ack();
    }
  },
};

// ---------------------------------------------------------------- demande

async function createAudit(request, env) {
  let b;
  try { b = await request.json(); } catch { return json({ ok: false, error: "Requête invalide." }, 400); }
  if (b.website2) return json({ ok: true, auto: false }); // champ piège : on fait semblant que tout va bien

  const v = validateUrl(b.url);
  if (v.error) return json({ ok: false, error: v.error }, 400);
  const name = String(b.name || "").trim().slice(0, 100);
  const business = String(b.business || "").trim().slice(0, 120);
  const email = String(b.email || "").trim().toLowerCase().slice(0, 200);
  if (!name || !business) return json({ ok: false, error: "Votre prénom et le nom de l'entreprise sont requis." }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ ok: false, error: "Ce courriel ne semble pas valide." }, 400);
  if (b.owner !== true || b.consent !== true) return json({ ok: false, error: "Veuillez cocher les deux cases obligatoires." }, 400);

  const ip = request.headers.get("CF-Connecting-IP") || "";
  if (env.TURNSTILE_SECRET) {
    const fd = new FormData();
    fd.append("secret", env.TURNSTILE_SECRET);
    fd.append("response", String(b.turnstile || ""));
    fd.append("remoteip", ip);
    const t = await (await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: fd })).json();
    if (!t.success) return json({ ok: false, error: "La vérification anti-robot a échoué. Rechargez la page." }, 400);
  }

  const ipHash = await sha256((env.IP_SALT || "v") + ip);
  const now = Date.now();
  const dup = await env.DB.prepare("SELECT id FROM audits WHERE domain=? AND status!='failed' AND created_at>?").bind(v.domain, now - 30 * 864e5).first();
  if (dup) return json({ ok: false, error: "Un audit a déjà été demandé pour ce site dans les 30 derniers jours. Écrivez-nous et nous le retrouverons." }, 409);
  const recent = await env.DB.prepare("SELECT COUNT(*) AS c FROM audits WHERE ip_hash=? AND created_at>?").bind(ipHash, now - 864e5).first();
  if (recent.c >= 3) return json({ ok: false, error: "Trop de demandes pour aujourd'hui. Réessayez demain." }, 429);

  const id = crypto.randomUUID();
  await env.DB.prepare(
    "INSERT INTO audits (id,created_at,status,url,domain,name,email,business,followup,ip_hash,client_token,admin_token) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)"
  ).bind(id, now, "queued", v.url, v.domain, name, email, business, b.followup === true ? 1 : 0, ipHash, token(24), token(24)).run();
  await env.AUDIT_QUEUE.send({ id });
  return json({ ok: true, auto: env.AUTO_SEND === "true" });
}

// ---------------------------------------------------------------- traitement

const setStatus = (env, id, status, extra = {}) =>
  env.DB.prepare("UPDATE audits SET status=?, score=COALESCE(?,score), flags=COALESCE(?,flags), error=COALESCE(?,error) WHERE id=?")
    .bind(status, extra.score ?? null, extra.flags ? JSON.stringify(extra.flags) : null, extra.error ?? null, id).run();

async function processAudit(env, id) {
  const row = await env.DB.prepare("SELECT * FROM audits WHERE id=?").bind(id).first();
  if (!row || row.status !== "queued") return;
  await setStatus(env, id, "running");
  try {
    const date = frDate();
    const flags = [];
    const page = await fetchPage(row.url);
    const facts = parseFacts(page.html, page.finalUrl);
    facts.tech.cacheControl = page.headers["cache-control"] || null;

    const [psi, links, contact, dom] = await Promise.all([
      pagespeed(page.finalUrl, env.PSI_API_KEY).catch((e) => { flags.push("PageSpeed indisponible : " + e.message); return null; }),
      checkLinks([...facts.navLinks, ...facts.footerLinks]).catch(() => null),
      facts.contactUrl ? checkContact(facts.contactUrl) : Promise.resolve(null),
      renderMobile(env, page.finalUrl),
    ]);
    if (!dom) flags.push("Capture cellulaire impossible : bouton d'action et affichage mobile non vérifiés.");
    if (psi?.cached) flags.push("Les passages PageSpeed ont le même horodatage : résultat probablement en cache, la médiane vaut un seul passage.");
    if (psi && psi.passes.length > 3) flags.push(`Écart de ${psi.spread} points entre les passages (${psi.passes.join(", ")}) : site instable, ${psi.passes.length} passages utilisés.`);

    let j = null;
    try { j = await judge(env, facts, dom); } catch (e) { flags.push("Jugement par Claude indisponible : " + e.message); }

    const categories = buildCategories({ facts, psi, links, contact, dom, judge: j, page });
    const { scores, finale } = scoreAll(categories);
    const origin = new URL(page.finalUrl).origin;

    const report = await writeReport(env, { business: row.business, url: origin, judge: j, finale, categories, scores, facts, psi });

    // Garde-fou : chaque chiffre du texte client doit se retrouver dans les mesures.
    const blob = measuredBlob({ categories, scores, finale, psi, facts, links });
    const orphans = unmatchedNumbers(report, blob);
    if (orphans.length) flags.push("Chiffre(s) du texte client introuvable(s) dans les mesures : " + orphans.join(", "));

    const lead = `Demande reçue de ${row.name} (${row.email}) pour ${row.business}, ${origin}. Suivi par courriel ${row.followup ? "accepté" : "non accepté"}.`;
    report.interne.contexte.unshift(lead);
    report.interne.a_verifier.push(...flags);
    report.interne.a_verifier.push("Les liens de réseaux et la fiche Google d'entreprise ne sont pas vérifiés par l'outil : à confirmer à la main.");

    const data = cleanDashes({
      entreprise: row.business,
      url: origin,
      date,
      mode: "interne",
      ...(psi ? { mesure: { outil: "PageSpeed Insights (Google)", date, passes_mobile: psi.passes } } : {}),
      capture: dom?.capture || "",
      categories,
      bonnes_nouvelles: report.bonnes_nouvelles,
      constats: report.constats,
      plan: report.plan,
      comparaison: [],
      croissance: report.croissance,
      appel: {
        titre: "On en jase 15 minutes?",
        texte: "On vous explique ces constats de vive voix et vous dites ce qui compte le plus pour vous. Aucune obligation.",
        bouton: env.CALL_BUTTON || "Appeler Pierre-Luc",
        lien: env.CALL_LINK || "tel:+15813727527",
      },
      interne: report.interne,
    });

    const htmlInterne = renderReport(template, data);
    const htmlClient = renderReport(template, clientData(data));
    assertNoLeak(htmlClient, data.interne);
    const md = await writePromptMd(env, { business: row.business, url: origin, facts, psi, links, report, cacheControl: page.headers["cache-control"] });

    await Promise.all([
      env.REPORTS.put(`${id}/client.html`, htmlClient, { httpMetadata: { contentType: "text/html; charset=utf-8" } }),
      env.REPORTS.put(`${id}/interne.html`, htmlInterne, { httpMetadata: { contentType: "text/html; charset=utf-8" } }),
      env.REPORTS.put(`${id}/prompt.md`, md, { httpMetadata: { contentType: "text/markdown; charset=utf-8" } }),
      env.REPORTS.put(`${id}/data.json`, JSON.stringify({ ...data, capture: undefined }), { httpMetadata: { contentType: "application/json" } }),
    ]);
    await setStatus(env, id, "review", { score: finale, flags });

    const adminLink = `${env.PUBLIC_BASE_URL}/admin/${id}?k=${row.admin_token}`;
    const nom = slug(row.business);
    await sendMail(env, {
      to: env.ADMIN_EMAIL,
      subject: `Audit à revoir : ${row.business} (${finale ?? "n/d"}/100)`,
      text: `${lead}\n\nNote : ${finale ?? "n/d"}/100.\n${flags.length ? "À regarder avant l'envoi :\n- " + flags.join("\n- ") : "Aucun drapeau automatique."}\n\nRevue et envoi au client :\n${adminLink}\n\nEn pièces jointes : le rapport client, le rapport interne et le bon de travail pour Claude Code.`,
      attachments: [
        { filename: `audit-${nom}-client.html`, content: b64text(htmlClient) },
        { filename: `audit-${nom}-interne.html`, content: b64text(htmlInterne) },
        { filename: `audit-${nom}-prompt.md`, content: b64text(md) },
      ],
    });
    await webhook(env, "audit_ready", { id, business: row.business, email: row.email, url: origin, score: finale, followup: !!row.followup, flags });

    if (env.AUTO_SEND === "true" && flags.length === 0) await sendToClient(env, { ...row, score: finale });
  } catch (e) {
    console.error("processAudit", e);
    await setStatus(env, id, "failed", { error: String(e.message || e).slice(0, 300) });
    try {
      await sendMail(env, { to: env.ADMIN_EMAIL, subject: `Audit échoué : ${row.business}`, text: `${row.url}\n${row.name} (${row.email})\n\nErreur : ${e.message}\n\nLa demande est enregistrée. Tu peux faire l'audit à la main avec le skill.` });
    } catch {}
  }
}

async function sendToClient(env, row) {
  const link = `${env.PUBLIC_BASE_URL}/r/${row.client_token}`;
  await sendMail(env, { to: row.email, ...clientEmail(env, { prenom: row.name, business: row.business, siteUrl: row.url.replace(/^https?:\/\//, "").replace(/\/$/, ""), link }) });
  await env.DB.prepare("UPDATE audits SET status='sent', sent_at=? WHERE id=?").bind(Date.now(), row.id).run();
  await webhook(env, "audit_sent", { id: row.id, business: row.business, email: row.email, followup: !!row.followup, report: link });
}

async function webhook(env, event, body) {
  if (!env.WEBHOOK_URL) return;
  try {
    await fetch(env.WEBHOOK_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ event, at: new Date().toISOString(), ...body }) });
  } catch (e) { console.error("webhook", e?.message); }
}

// ---------------------------------------------------------------- lecture

async function clientReport(env, tokenValue) {
  const row = await env.DB.prepare("SELECT id FROM audits WHERE client_token=? AND status='sent'").bind(tokenValue).first();
  const obj = row && (await env.REPORTS.get(`${row.id}/client.html`));
  if (!obj) return new Response("Rapport introuvable.", { status: 404, headers: PRIVATE });
  return new Response(obj.body, { headers: { "content-type": "text/html; charset=utf-8", ...PRIVATE } });
}

async function admin(request, env, id, action, u) {
  const row = await env.DB.prepare("SELECT * FROM audits WHERE id=?").bind(id).first();
  const k = u.searchParams.get("k") || "";
  if (!row || !safeEqual(k, row.admin_token)) return new Response("Introuvable.", { status: 404, headers: PRIVATE });

  if (action === "client" || action === "interne" || action === "prompt") {
    const file = action === "prompt" ? "prompt.md" : `${action}.html`;
    const obj = await env.REPORTS.get(`${id}/${file}`);
    if (!obj) return new Response("Fichier introuvable.", { status: 404, headers: PRIVATE });
    const type = action === "prompt" ? "text/markdown; charset=utf-8" : "text/html; charset=utf-8";
    return new Response(obj.body, { headers: { "content-type": type, ...PRIVATE } });
  }
  if (action === "send") {
    if (request.method !== "POST") return new Response("Méthode non permise.", { status: 405 });
    if (row.status !== "review") return new Response("Cet audit n'est pas en attente d'envoi.", { status: 409, headers: PRIVATE });
    await sendToClient(env, row);
    return new Response(null, { status: 303, headers: { location: `/admin/${id}?k=${k}` } });
  }

  const flags = row.flags ? JSON.parse(row.flags) : [];
  const q = `?k=${k}`;
  const page = `<!doctype html><html lang="fr-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Revue · ${esc(row.business)}</title>
<style>body{margin:0;background:#FFF7E8;color:#111719;font:16px/1.6 -apple-system,Segoe UI,sans-serif;padding:24px 16px}main{max-width:620px;margin:0 auto}h1{font:900 30px/1.1 Georgia,serif;margin:0 0 6px}.m{color:#6C665E;font-size:14px}.b{display:block;background:#fff9f0;border:1px solid rgba(17,23,25,.12);padding:14px 16px;margin:10px 0;color:#111719;text-decoration:none}.b:hover{border-color:#111719}button{background:#E85D2A;color:#fff9f0;border:0;padding:16px 28px;font:500 13px/1 sans-serif;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;margin-top:18px}li{margin:6px 0}</style></head><body><main>
<p class="m">STATUT : ${esc(row.status)}</p><h1>${esc(row.business)}</h1><p class="m">${esc(row.url)} · ${esc(row.name)} · ${esc(row.email)}<br>Suivi par courriel : ${row.followup ? "accepté" : "non accepté"}</p>
<p><b>Note : ${row.score ?? "n/d"}/100</b></p>
${flags.length ? `<p><b>À regarder avant d'envoyer :</b></p><ul>${flags.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>` : "<p>Aucun drapeau automatique.</p>"}
${row.error ? `<p><b>Erreur :</b> ${esc(row.error)}</p>` : ""}
<a class="b" href="/admin/${id}/client${q}">Rapport client</a><a class="b" href="/admin/${id}/interne${q}">Rapport interne</a><a class="b" href="/admin/${id}/prompt${q}">Bon de travail (prompt.md)</a>
${row.status === "review" ? `<form method="post" action="/admin/${id}/send${q}"><button type="submit">Envoyer au client</button></form><p class="m">Un courriel avec le lien privé du rapport part à ${esc(row.email)}.</p>` : row.status === "sent" ? `<p class="m">Envoyé le ${new Date(row.sent_at).toLocaleString("fr-CA", { timeZone: "America/Toronto" })}.</p>` : ""}
</main></body></html>`;
  return new Response(page, { headers: { "content-type": "text/html; charset=utf-8", ...PRIVATE } });
}
