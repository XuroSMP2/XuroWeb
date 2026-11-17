// XuroSMP Stats-Proxy: holt Daten aus der SMPCore Web-API des Minecraft-Servers.
// Der API-Key bleibt hier serverseitig und gelangt nie in den Browser.
// Zwei Wege (beide nutzbar, Push hat Vorrang):
//  1) PUSH (empfohlen): Das Plugin sendet die Daten an /api/ingest (ingest.mjs), sie liegen in Netlify Blobs.
//  2) PROXY (nur mit offenem Port): SMPCORE_API_URL z. B. http://xurosmp.daronlo.com:8085 (ohne / am Ende)
// Nötig in Netlify: SMPCORE_API_KEY (derselbe Key wie web-api.api-key in der config.yml des Plugins)
import { getStore } from "@netlify/blobs";

export const config = { path: ["/api/stats/*"] };

const HDR = { "content-type": "application/json; charset=utf-8" };
const out = (d, s = 200, cache = "no-store") =>
  new Response(JSON.stringify(d), { status: s, headers: { ...HDR, "cache-control": cache } });

const METRICS = ["money", "crystals", "gems", "kills", "deaths", "playtime"];
const NAME = /^[\w.\-]{1,40}$/;
const cache = new Map(); // upstream-Pfad -> { t, status, body }
const TTL = 20_000;

// Öffentlicher Pfad -> Pfad auf dem Minecraft-Server (nur diese Routen sind erlaubt).
function route(parts, search) {
  const [a, b] = parts;
  if (a === "status" && parts.length === 1) return "/api/status";
  if (a === "online" && parts.length === 1) return "/api/players/online";
  if (a === "top" && parts.length === 2 && METRICS.includes(b)) {
    const n = Math.max(1, Math.min(100, parseInt(search.get("limit")) || 10));
    return `/api/top/${b}?limit=${n}`;
  }
  if (a === "player" && parts.length === 2 && NAME.test(b)) return `/api/player/${encodeURIComponent(b)}`;
  if (a === "clans" && parts.length === 1) return "/api/clans?limit=50";
  if (a === "clans" && parts.length === 2 && NAME.test(b)) return `/api/clans/${encodeURIComponent(b)}`;
  return null;
}

const STALE = 15 * 60_000; // Push-Daten älter als 15 Minuten gelten als veraltet (Server offline?)

// Antwort aus dem gespeicherten Push-Snapshot bauen. Gibt null zurück, wenn der Pfad unbekannt ist.
function fromSnapshot(snap, parts, search) {
  const [a, b] = parts;
  const lc = (x) => String(x || "").toLowerCase();
  if (a === "status" && parts.length === 1) return [200, snap.status];
  if (a === "online" && parts.length === 1) return [200, { online: snap.status.online, max: snap.status.max, players: snap.online }];
  if (a === "top" && parts.length === 2 && METRICS.includes(b)) {
    const n = Math.max(1, Math.min(100, parseInt(search.get("limit")) || 10));
    return [200, { metric: b, players: (snap.top[b] || []).slice(0, n) }];
  }
  if (a === "player" && parts.length === 2 && NAME.test(b)) {
    const p = snap.players.find((x) => lc(x.uuid) === lc(b) || lc(x.name) === lc(b) || lc(x.name) === "." + lc(b));
    return p ? [200, p] : [404, { error: "Spieler nicht gefunden" }];
  }
  if (a === "clans" && parts.length === 1) {
    return [200, { clans: snap.clans.slice(0, 50).map(({ members, ...c }) => c) }];
  }
  if (a === "clans" && parts.length === 2 && NAME.test(b)) {
    const c = snap.clans.find((x) => lc(x.name) === lc(b));
    return c ? [200, c] : [404, { error: "Clan nicht gefunden" }];
  }
  return null;
}

export default async (req) => {
  if (req.method !== "GET") return out({ error: "Nur GET erlaubt." }, 405);
  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/api\/stats\/?/, "").replace(/\/+$/, "").split("/").filter(Boolean);
  const upstream = route(parts, url.searchParams);
  if (!upstream) return out({ error: "Unbekannter Endpoint." }, 404);

  // 1) Push-Snapshot
  let snap = null;
  try { snap = await getStore("xurosmp").get("stats-snapshot", { type: "json" }); } catch { /* Blobs nicht verfügbar */ }
  if (snap && Date.now() - snap.receivedAt < STALE) {
    const r = fromSnapshot(snap, parts, url.searchParams);
    if (r) return out(r[1], r[0], r[0] === 200 ? "public, max-age=15" : "no-store");
  }

  // 2) Proxy zum Server (nur wenn konfiguriert)
  const base = (process.env.SMPCORE_API_URL || "").replace(/\/+$/, "");
  const key = process.env.SMPCORE_API_KEY || "";
  if (!base || !key) {
    return out({ error: snap ? "Serverdaten sind veraltet. Der Server ist eventuell offline." : "Noch keine Serverdaten empfangen." }, 503);
  }

  const hit = cache.get(upstream);
  if (hit && Date.now() - hit.t < TTL) return out(hit.body, hit.status, "public, max-age=15");

  try {
    const r = await fetch(base + upstream, { headers: { "X-API-Key": key }, signal: AbortSignal.timeout(5000) });
    const body = await r.json().catch(() => ({ error: "Ungültige Antwort vom Server." }));
    if (r.status === 401 || r.status === 429 || r.status >= 500) {
      // Interne Details nicht an Besucher weitergeben.
      return out({ error: "Serverdaten sind gerade nicht verfügbar." }, 502);
    }
    if (cache.size > 200) cache.clear();
    cache.set(upstream, { t: Date.now(), status: r.status, body });
    return out(body, r.status, r.ok ? "public, max-age=15" : "no-store");
  } catch {
    return out({ error: "Minecraft-Server nicht erreichbar." }, 502);
  }
};
