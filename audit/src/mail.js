// Courriels via Resend (API HTTP). Sans clé : essai à blanc, rien n'est envoyé.
import { esc } from "./util.js";

export async function sendMail(env, { to, subject, text, html, attachments }) {
  if (!env.RESEND_API_KEY) {
    console.log("COURRIEL (essai à blanc)", to, subject);
    return { dry: true };
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: "Bearer " + env.RESEND_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({ from: env.FROM_EMAIL, to: [to], reply_to: env.REPLY_TO || undefined, subject, text, html, attachments }),
  });
  if (!r.ok) throw new Error("Courriel refusé : " + r.status + " " + (await r.text()).slice(0, 160));
  return r.json();
}

// Courriel au prospect : tutoiement (courriels), lien privé, invitation à 15 minutes.
export function clientEmail(env, { prenom, business, siteUrl, link }) {
  const tel = env.CALL_PHONE || "581-372-7527";
  const text = `Bonjour ${prenom},

Merci d'avoir demandé l'audit de ${siteUrl}. Il est prêt : une note sur 100, ce qui va bien, trois points à regarder et par où commencer.

${link}

Si tu veux qu'on regarde ça ensemble, réponds à ce courriel ou appelle-moi au ${tel}. On en jase 15 minutes, sans obligation.

Pierre-Luc Deblois
Veelution, Beauce (Québec)

Tu reçois ce courriel parce que tu as demandé un audit gratuit sur le site de Veelution.`;
  const html = `<div style="font:16px/1.6 -apple-system,Segoe UI,sans-serif;color:#111719;max-width:560px">
<p>Bonjour ${esc(prenom)},</p>
<p>Merci d'avoir demandé l'audit de ${esc(siteUrl)}. Il est prêt : une note sur 100, ce qui va bien, trois points à regarder et par où commencer.</p>
<p><a href="${esc(link)}" style="display:inline-block;background:#E85D2A;color:#FFF9F0;padding:14px 24px;text-decoration:none;letter-spacing:.06em;text-transform:uppercase;font-size:13px">Voir mon audit</a></p>
<p>Si tu veux qu'on regarde ça ensemble, réponds à ce courriel ou appelle-moi au ${esc(tel)}. On en jase 15 minutes, sans obligation.</p>
<p>Pierre-Luc Deblois<br>Veelution, Beauce (Québec)</p>
<p style="color:#6C665E;font-size:13px">Tu reçois ce courriel parce que tu as demandé un audit gratuit sur le site de Veelution.</p></div>`;
  return { subject: `Ton audit web gratuit : ${business}`, text, html };
}
