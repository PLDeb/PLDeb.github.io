// Capture et mesures sur cellulaire (Cloudflare Browser Rendering). Remplace Playwright.
import puppeteer from "@cloudflare/puppeteer";
import { bytesToB64 } from "./util.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function renderMobile(env, url) {
  let browser;
  try {
    browser = await puppeteer.launch(env.BROWSER);
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1");
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true });
    try {
      await page.goto(url, { waitUntil: "networkidle0", timeout: 25000 });
    } catch {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    }
    await sleep(1500);

    // Bannière de témoins : refuser ou fermer seulement, jamais accepter.
    await page.evaluate(() => {
      const ok = ["refuser", "tout refuser", "reject all", "refuse", "decline", "fermer", "décliner"];
      for (const b of document.querySelectorAll("button,a[role=button]")) {
        const t = (b.innerText || "").trim().toLowerCase();
        if (t && t.length < 25 && ok.includes(t)) { b.click(); return; }
      }
    });
    await sleep(800);

    const dom = await page.evaluate(() => {
      const vh = 844, vw = 390;
      const visible = (el) => {
        const r = el.getBoundingClientRect(), s = getComputedStyle(el);
        return r.width > 20 && r.height > 16 && r.top < vh && r.bottom > 0 && r.left < vw && s.visibility !== "hidden" && s.display !== "none" && s.opacity !== "0";
      };
      const alpha = (c) => {
        const m = c.match(/rgba?\(([^)]+)\)/);
        if (!m) return 0;
        const p = m[1].split(",").map(parseFloat);
        return p.length === 4 ? p[3] : 1;
      };
      const isButton = (el) => {
        const s = getComputedStyle(el), r = el.getBoundingClientRect();
        if (r.height > 110) return false;
        const solid = alpha(s.backgroundColor) > 0.5;
        const bordered = parseFloat(s.borderTopWidth) > 0 && s.borderTopStyle !== "none" && alpha(s.borderTopColor) > 0.3;
        return solid || bordered;
      };
      const skip = "header, nav, footer, form, [role=navigation], [id*=cookie i], [class*=cookie i], [class*=consent i], [id*=consent i], [class*=cmplz], [id*=didomi]";
      const buttons = [...document.querySelectorAll("a[href],button,[role=button]")]
        .filter((el) => visible(el) && !el.closest(skip) && isButton(el))
        .map((el) => ({ text: (el.innerText || el.value || "").trim().slice(0, 40), href: el.getAttribute("href") || "" }))
        .filter((b) => b.text);
      const out = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) {
        const t = n.textContent.trim();
        const p = n.parentElement;
        if (t.length < 2 || !p || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(p.tagName)) continue;
        if (visible(p)) out.push(t);
      }
      return { scrollWidth: document.documentElement.scrollWidth, buttons, heroText: out.join(" ").replace(/\s+/g, " ").slice(0, 900) };
    });
    dom.distinctButtons = new Set(dom.buttons.map((b) => b.href || b.text)).size;

    const buf = await page.screenshot({ type: "webp", quality: 70 });
    return { dom, capture: "data:image/webp;base64," + bytesToB64(buf) };
  } catch (e) {
    console.error("renderMobile", e?.message);
    return null;
  } finally {
    try { await browser?.close(); } catch {}
  }
}
