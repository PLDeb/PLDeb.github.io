// Petits outils partagés. Aucun import propre aux Workers : testable dans Node.

const enc = new TextEncoder();

export function bytesToB64(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
export const b64text = (str) => bytesToB64(enc.encode(str));

export function token(bytes = 24) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256(s) {
  const d = await crypto.subtle.digest("SHA-256", enc.encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function mediane(a) {
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

export const frDate = (d = new Date()) =>
  d.toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Toronto" });

export const slug = (s) =>
  String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "client";

// Aucun tiret cadratin ni demi-cadratin dans ce qu'on produit.
export function cleanDashes(v) {
  if (typeof v === "string") return v.replace(/\s*[—–]\s*/g, ", ");
  if (Array.isArray(v)) return v.map(cleanDashes);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, cleanDashes(x)]));
  return v;
}

// Valide l'adresse soumise. On ne retient que l'accueil (origine) d'un site public.
export function validateUrl(input) {
  let s = String(input || "").trim();
  const bad = { error: "Cette adresse ne semble pas valide. Exemple : monentreprise.com" };
  if (!s || s.length > 300) return bad;
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  let u;
  try {
    u = new URL(s);
  } catch {
    return bad;
  }
  if (!["http:", "https:"].includes(u.protocol)) return bad;
  if (u.username || u.password) return bad;
  const h = u.hostname.toLowerCase();
  if (!h.includes(".") || h.includes(":") || h.startsWith("[")) return bad;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) return bad;
  if (!/^[a-z0-9.-]+$/.test(h) || !/\.[a-z][a-z0-9-]+$/.test(h)) return bad;
  if (/(^|\.)(localhost|local|internal|lan|home|corp|test|invalid|example)$/.test(h)) return bad;
  if (u.port && !["80", "443"].includes(u.port)) return bad;
  return { url: `${u.protocol}//${h}/`, domain: h.replace(/^www\./, "") };
}
