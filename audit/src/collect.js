// Collecte : page d'accueil, liens, contact, PageSpeed. Tout ce qui est mesurable sans jugement.
import { parse } from "node-html-parser";
import { mediane } from "./util.js";

const UA = "Mozilla/5.0 (compatible; VeelutionAuditBot/1.0; +https://veelution.com)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();

export async function fetchPage(url) {
  const r = await fetch(url, {
    headers: { "user-agent": UA, accept: "text/html,*/*", "accept-language": "fr-CA,fr;q=0.9,en;q=0.5" },
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });
  if (r.status >= 400) throw new Error(`Le site répond ${r.status}`);
  if (!(r.headers.get("content-type") || "").includes("html")) throw new Error("Le lien ne mène pas à une page web");
  const html = (await r.text()).slice(0, 1_500_000);
  return { finalUrl: r.url, status: r.status, html, headers: Object.fromEntries(r.headers) };
}

const SOCIAL = {
  Facebook: /facebook\.com|fb\.com/i,
  Instagram: /instagram\.com/i,
  TikTok: /tiktok\.com/i,
  YouTube: /youtube\.com|youtu\.be/i,
  LinkedIn: /linkedin\.com/i,
  X: /(^|\.)x\.com|twitter\.com/i,
};

const within = (el, names) => {
  for (let p = el.parentNode; p; p = p.parentNode) {
    if (names.includes(String(p.tagName || "").toLowerCase())) return true;
  }
  return false;
};

export function parseFacts(html, finalUrl) {
  const base = new URL(finalUrl);
  const host = (h) => h.replace(/^www\./, "");

  // Détections sur le code brut (avant de retirer les scripts)
  const platform = /cdn\.shopify\.com|Shopify\.theme/i.test(html) ? "Shopify"
    : /wp-content|wp-includes/i.test(html) ? "WordPress"
    : /wixstatic\.com|static\.parastorage\.com/i.test(html) ? "Wix"
    : /squarespace\.com|static1\.squarespace/i.test(html) ? "Squarespace"
    : /webflow\.com|data-wf-/i.test(html) ? "Webflow" : null;
  const tracking = [];
  if (/gtag\(|googletagmanager\.com|["']G-[A-Z0-9]{6,}/.test(html)) tracking.push("Google Analytics / Tag Manager");
  if (/fbq\(|connect\.facebook\.net/.test(html)) tracking.push("pixel Meta");
  if (/analytics\.tiktok\.com|ttq\./.test(html)) tracking.push("pixel TikTok");
  if (/plausible\.io|matomo|clarity\.ms|hotjar|cloudflareinsights\.com/i.test(html)) tracking.push("autre outil de mesure");
  const ldjson = (html.match(/<script[^>]+application\/ld\+json/gi) || []).length;
  const newsletterTool = /klaviyo|mailchimp|list-manage\.com|mailerlite|sendinblue|brevo|convertkit|omnisend/i.test(html);

  const root = parse(html);
  const meta = (sel) => clean(root.querySelector(sel)?.getAttribute("content"));
  const title = clean(root.querySelector("title")?.text);
  const description = meta('meta[name="description"]');

  // Liens, avec leur emplacement
  const links = [];
  for (const a of root.querySelectorAll("a[href]")) {
    const raw = (a.getAttribute("href") || "").trim();
    if (!raw || raw.startsWith("#") || raw.startsWith("javascript:")) continue;
    let abs;
    try { abs = new URL(raw, base); } catch { continue; }
    const where = within(a, ["footer"]) ? "footer" : within(a, ["header", "nav"]) ? "nav" : "main";
    links.push({ href: abs.href, protocol: abs.protocol, host: abs.hostname, text: clean(a.text).slice(0, 60), where });
  }
  const internal = links.filter((l) => /^https?:$/.test(l.protocol) && host(l.host) === host(base.hostname));
  const strip = (l) => l.href.split("#")[0];
  const uniq = (arr) => [...new Set(arr)];
  const navLinks = uniq(internal.filter((l) => l.where === "nav").map(strip));
  const footerLinks = uniq(internal.filter((l) => l.where === "footer").map(strip));
  const contactLink = internal.find((l) => /contact|joindre|rejoindre|nous-ecrire/i.test(l.href + " " + l.text) && l.where === "nav")
    || internal.find((l) => /contact|joindre|rejoindre|nous-ecrire/i.test(l.href + " " + l.text));
  const tel = links.filter((l) => l.protocol === "tel:");
  const mail = links.filter((l) => l.protocol === "mailto:");
  const social = {};
  for (const l of links) for (const [name, rx] of Object.entries(SOCIAL)) {
    if (rx.test(l.host) && !/sharer|share\.php|intent\/tweet/i.test(l.href)) (social[name] ||= new Set()).add(l.href);
  }
  const socialOut = Object.fromEntries(Object.entries(social).map(([k, v]) => [k, [...v].slice(0, 3)]));
  const emailDomains = uniq(mail.map((m) => m.href.replace(/^mailto:/i, "").split("?")[0].split("@")[1]).filter(Boolean));

  // Formulaires et infolettre
  const forms = root.querySelectorAll("form");
  const hasEmailInput = (node) => node.querySelectorAll("input").some((i) => i.getAttribute("type") === "email" || /mail|courriel/i.test(i.getAttribute("name") || ""));
  const newsletter = newsletterTool || forms.some((f) => hasEmailInput(f) && /infolettre|newsletter|abonn|inscri|subscribe|sign up|join/i.test(f.text + " " + f.innerHTML));

  // Images
  const imgs = root.querySelectorAll("img").filter((i) => {
    const w = i.getAttribute("width"), h = i.getAttribute("height"), src = i.getAttribute("src") || "";
    return !(w === "1" || h === "1" || /pixel|facebook\.com\/tr|googleads|doubleclick/i.test(src));
  });
  const imgSample = imgs.slice(0, 12).map((i) => ({
    alt: i.getAttribute("alt") ?? null,
    file: (i.getAttribute("src") || i.getAttribute("data-src") || "").split("?")[0].split("/").pop().slice(0, 60),
  }));

  // Diagnostic technique (pour le bon de travail)
  const tech = {
    preloads: root.querySelectorAll('link[rel="preload"],link[rel="modulepreload"]').map((l) => (l.getAttribute("href") || "").slice(0, 120)).slice(0, 10),
    headScripts: root.querySelectorAll("head script[src]").length,
    headStyles: root.querySelectorAll('head link[rel="stylesheet"]').length,
    imagesSansDimensions: imgs.filter((i) => !i.getAttribute("width") || !i.getAttribute("height")).length,
    imagesLazy: imgs.filter((i) => i.getAttribute("loading") === "lazy").length,
    cacheControl: null,
  };

  root.querySelectorAll("script,style,noscript,svg").forEach((e) => e.remove());
  const bodyText = clean(root.querySelector("body")?.text);
  const footerText = clean(root.querySelector("footer")?.text).slice(0, 700);
  const years = [...bodyText.matchAll(/©\s*(?:copyright\s*)?(\d{4})(?:\s*[-–]\s*(\d{4}))?/gi)].map((m) => Number(m[2] || m[1]));

  return {
    finalUrl,
    host: host(base.hostname),
    title,
    description,
    ogTitle: meta('meta[property="og:title"]'),
    ogSiteName: meta('meta[property="og:site_name"]'),
    ogImage: meta('meta[property="og:image"]'),
    lang: root.querySelector("html")?.getAttribute("lang") || "",
    viewport: meta('meta[name="viewport"]'),
    h1: root.querySelectorAll("h1").map((h) => clean(h.text)).filter(Boolean).slice(0, 4),
    h2: root.querySelectorAll("h2").map((h) => clean(h.text)).filter(Boolean).slice(0, 8),
    imgs: { total: imgs.length, sansAlt: imgs.filter((i) => i.getAttribute("alt") === undefined).length, sample: imgSample },
    ldjson,
    platform,
    tracking,
    newsletter,
    testimonialWords: /témoignage|avis (de|des) clients|ils nous font confiance|testimonial|reviews?\b|nos clients/i.test(bodyText),
    copyrightYear: years.length ? Math.max(...years) : null,
    navLinks,
    footerLinks,
    navLabels: uniq(internal.filter((l) => l.where === "nav").map((l) => l.text).filter(Boolean)).slice(0, 12),
    contactUrl: contactLink ? strip(contactLink) : null,
    contactWhere: contactLink?.where || null,
    tel: tel.map((l) => ({ href: l.href, where: l.where })),
    mail: mail.map((l) => ({ href: l.href.slice(0, 80), where: l.where })),
    social: socialOut,
    emailDomains,
    bodyText: bodyText.slice(0, 1800),
    footerText,
    tech,
  };
}

// Liens du menu et du pied de page : brisé = 404, 410, erreur serveur ou réseau.
// 401/403/429 (anti-robot) ne comptent pas comme brisés.
export async function checkLinks(urls, limit = 12) {
  const list = [...new Set(urls)].slice(0, limit);
  const res = await Promise.all(list.map(async (u) => {
    try {
      const r = await fetch(u, { headers: { "user-agent": UA }, redirect: "follow", signal: AbortSignal.timeout(9000) });
      await r.body?.cancel();
      return { url: u, status: r.status, broken: r.status === 404 || r.status === 410 || r.status >= 500 };
    } catch {
      return { url: u, status: 0, broken: true };
    }
  }));
  return { tested: res.length, broken: res.filter((r) => r.broken) };
}

// La page contact existe-t-elle vraiment (formulaire avec courriel, ou courriel / téléphone cliquable)? On n'envoie rien.
export async function checkContact(url) {
  try {
    const p = await fetchPage(url);
    const root = parse(p.html);
    const form = root.querySelectorAll("form").some((f) => f.querySelectorAll("input,textarea").some((i) => i.getAttribute("type") === "email" || /mail|courriel/i.test(i.getAttribute("name") || "")));
    const link = /href=["'](mailto:|tel:)/i.test(p.html);
    return { url, ok: form || link, form, link };
  } catch {
    return null;
  }
}

async function psiOnce(url, key) {
  const qs = new URLSearchParams({ url, strategy: "mobile", locale: "fr" });
  for (const c of ["performance", "seo", "accessibility"]) qs.append("category", c);
  if (key) qs.set("key", key);
  const r = await fetch("https://www.googleapis.com/pagespeedonline/v5/runPagespeed?" + qs, { signal: AbortSignal.timeout(100000) });
  if (!r.ok) throw new Error("PageSpeed " + r.status);
  const j = await r.json();
  const L = j.lighthouseResult, c = L.categories;
  const sc = (k) => {
    if (c[k]?.score == null) throw new Error("PageSpeed incomplet");
    return Math.round(c[k].score * 100);
  };
  return {
    perf: sc("performance"), seo: sc("seo"), a11y: sc("accessibility"),
    lcp: L.audits["largest-contentful-paint"]?.numericValue ?? null,
    fcp: L.audits["first-contentful-paint"]?.numericValue ?? null,
    tbt: L.audits["total-blocking-time"]?.numericValue ?? null,
    cls: L.audits["cumulative-layout-shift"]?.numericValue ?? null,
    ts: j.analysisUTCTimestamp || null,
    failing: Object.values(L.audits)
      .filter((a) => a.score !== null && a.score < 0.9 && ["numeric", "binary"].includes(a.scoreDisplayMode))
      .sort((a, b) => a.score - b.score).slice(0, 12)
      .map((a) => ({ id: a.id, title: a.title, value: a.displayValue || null })),
  };
}

// 3 passages cellulaire, médiane. Écart de plus de 15 points : on va jusqu'à 5.
export async function pagespeed(url, key) {
  const runs = [];
  const target = () => {
    if (runs.length < 3) return 3;
    const s = runs.map((r) => r.perf);
    return Math.max(...s) - Math.min(...s) > 15 ? 5 : 3;
  };
  for (let attempts = 0; attempts < 7 && runs.length < target(); attempts++) {
    try { runs.push(await psiOnce(url, key)); } catch { await sleep(4000); }
    if (runs.length < target()) await sleep(2500);
  }
  if (runs.length < 3) throw new Error(`seulement ${runs.length} passage(s) PageSpeed réussi(s)`);
  const scores = runs.map((r) => r.perf);
  const sorted = [...runs].sort((a, b) => a.perf - b.perf);
  const run = sorted[Math.floor((sorted.length - 1) / 2)];
  const stamps = runs.map((r) => r.ts).filter(Boolean);
  return {
    passes: scores,
    median: mediane(scores),
    seo: run.seo, a11y: run.a11y, lcp: run.lcp, fcp: run.fcp, tbt: run.tbt, cls: run.cls,
    failing: run.failing,
    spread: Math.max(...scores) - Math.min(...scores),
    cached: new Set(stamps).size < stamps.length, // même horodatage : résultat en cache probable
  };
}
