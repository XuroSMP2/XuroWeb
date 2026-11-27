// Netlify-Build: trägt die echte Seitenadresse in Vorschau-Tags ein und erzeugt sitemap.xml und robots.txt.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const site = (process.env.URL || "").replace(/\/+$/, "");
const dir = "public/";
for (const f of readdirSync(dir).filter((x) => x.endsWith(".html"))) {
  const s = readFileSync(dir + f, "utf8");
  if (s.includes("__SITE__")) writeFileSync(dir + f, s.replaceAll("__SITE__", site));
}
if (site) {
  const pages = ["", "wiki", "events", "stats", "client", "advent"];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    pages.map((p) => `  <url><loc>${site}/${p}</loc></url>`).join("\n") + `\n</urlset>\n`;
  writeFileSync(dir + "sitemap.xml", xml);
  writeFileSync(dir + "robots.txt", `User-agent: *\nDisallow: /admin\nDisallow: /api/\nSitemap: ${site}/sitemap.xml\n`);
} else {
  writeFileSync(dir + "robots.txt", `User-agent: *\nDisallow: /admin\nDisallow: /api/\n`);
}
console.log("build.mjs fertig, Adresse:", site || "(keine)");
