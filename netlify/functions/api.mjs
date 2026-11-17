// XuroSMP API: Events + Banner (Netlify Blobs) und Admin-Login.
// Nötig in Netlify (Site configuration -> Environment variables): ADMIN_PASSWORD (und optional ADMIN_SECRET)
import { getStore } from "@netlify/blobs";
import { createHmac, createHash, timingSafeEqual, randomUUID } from "node:crypto";

export const config = { path: ["/api/login", "/api/banner", "/api/events", "/api/events/*"] };

const HDR = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const out = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: HDR });
const secret = () => process.env.ADMIN_SECRET || "xs:" + (process.env.ADMIN_PASSWORD || "");
const mac = (s) => createHmac("sha256", secret()).update(s).digest("base64url");
const token = () => { const p = Buffer.from(String(Date.now() + 12 * 3600e3)).toString("base64url"); return p + "." + mac(p); };
const same = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };
const authed = (req) => {
  const t = (req.headers.get("authorization") || "").replace(/^Bearer /, "");
  const [p, m] = t.split(".");
  return !!(p && m && same(m, mac(p)) && Number(Buffer.from(p, "base64url").toString()) > Date.now());
};
const str = (v, n) => String(v ?? "").trim().slice(0, n);
const TYPES = ["pvp", "bauen", "community", "gewinnspiel", "sonstiges"];
const fails = new Map();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function clean(b) {
  const start = new Date(b.start), end = b.end ? new Date(b.end) : null;
  if (!str(b.title, 100) || isNaN(start)) return null;
  return {
    title: str(b.title, 100),
    type: TYPES.includes(b.type) ? b.type : "sonstiges",
    start: start.toISOString(),
    end: end && !isNaN(end) ? end.toISOString() : "",
    location: str(b.location, 100),
    prize: str(b.prize, 150),
    description: str(b.description, 1500),
    pinned: !!b.pinned,
  };
}

export default async (req) => {
  const path = new URL(req.url).pathname.replace(/\/+$/, "");
  const store = getStore("xurosmp");
  const body = async () => { try { return await req.json(); } catch { return {}; } };
  const needAuth = () => (authed(req) ? null : out({ error: "Nicht eingeloggt." }, 401));
  if (req.method !== "GET" && !process.env.ADMIN_PASSWORD) return out({ error: "ADMIN_PASSWORD ist in Netlify nicht gesetzt." }, 503);

  if (path === "/api/login") {
    if (req.method !== "POST") return out({ error: "POST erwartet." }, 405);
    const ip = req.headers.get("x-nf-client-connection-ip") || "?";
    const f = (fails.get(ip) || []).filter((t) => Date.now() - t < 600e3);
    if (f.length >= 5) return out({ error: "Zu viele Versuche. Bitte in 10 Minuten erneut versuchen." }, 429);
    const pw = str((await body()).password, 200);
    const h = (s) => createHash("sha256").update(s).digest();
    if (!same(h(pw), h(process.env.ADMIN_PASSWORD))) {
      f.push(Date.now()); fails.set(ip, f); await sleep(700);
      return out({ error: "Falsches Passwort." }, 401);
    }
    fails.delete(ip);
    return out({ token: token() });
  }

  if (path === "/api/banner") {
    if (req.method === "GET") return out((await store.get("banner", { type: "json" })) ?? { text: "", on: false });
    if (req.method === "PUT") {
      const d = needAuth(); if (d) return d;
      const b = await body(); const v = { text: str(b.text, 200), on: !!b.on };
      await store.setJSON("banner", v); return out(v);
    }
    return out({ error: "Methode nicht erlaubt." }, 405);
  }

  const id = path.startsWith("/api/events/") ? path.slice(12) : "";
  const list = (await store.get("events", { type: "json" })) ?? [];
  if (req.method === "GET" && !id) return out(list);
  const d = needAuth(); if (d) return d;

  if (req.method === "POST" && !id) {
    const e = clean(await body()); if (!e) return out({ error: "Titel und gültiges Startdatum sind Pflicht." }, 400);
    const ev = { id: randomUUID(), ...e }; list.push(ev);
    await store.setJSON("events", list); return out(ev, 201);
  }
  const i = list.findIndex((x) => x.id === id);
  if (i < 0) return out({ error: "Event nicht gefunden." }, 404);
  if (req.method === "PUT") {
    const e = clean(await body()); if (!e) return out({ error: "Titel und gültiges Startdatum sind Pflicht." }, 400);
    list[i] = { id, ...e }; await store.setJSON("events", list); return out(list[i]);
  }
  if (req.method === "DELETE") { list.splice(i, 1); await store.setJSON("events", list); return out({ ok: true }); }
  return out({ error: "Methode nicht erlaubt." }, 405);
};
