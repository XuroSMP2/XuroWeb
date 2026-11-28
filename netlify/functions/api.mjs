// XuroSMP API: Events + Changelog + Banner + Discord-Sync (Netlify Blobs) und Admin-Login.
// Nötig in Netlify (Site configuration -> Environment variables): ADMIN_PASSWORD (und optional ADMIN_SECRET)
import { getStore } from "@netlify/blobs";
import * as D from "../lib/discord.mjs";
import { createHmac, createHash, timingSafeEqual, randomUUID } from "node:crypto";

export const config = { path: ["/api/login", "/api/banner", "/api/events", "/api/events/*", "/api/changelog", "/api/changelog/*", "/api/discord-admin/*"] };

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

function cleanLog(b) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(b.date)) ? b.date : new Date().toISOString().slice(0, 10);
  if (!str(b.title, 150)) return null;
  const sections = (Array.isArray(b.sections) ? b.sections : []).slice(0, 8)
    .map((x) => ({ title: str(x?.title, 100), items: (Array.isArray(x?.items) ? x.items : []).map((i) => str(i, 500)).filter(Boolean).slice(0, 40) }))
    .filter((x) => x.title && x.items.length);
  if (!sections.length && !str(b.intro, 1200)) return null;
  return { heading: str(b.heading, 60) || "Ingame Changelog", version: str(b.version, 30), title: str(b.title, 150), date, intro: str(b.intro, 1200), sections };
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

  if (path.startsWith("/api/changelog")) {
    const cid = path.slice(15).replace(/^\//, "");
    const logs = (await store.get("changelog", { type: "json" })) ?? [];
    if (req.method === "GET") return out(logs.sort((a, b) => b.date.localeCompare(a.date) || (b.created || 0) - (a.created || 0)).map(({ msgs, ...c }) => c));
    const d = needAuth(); if (d) return d;
    const b = await body();
    if (req.method === "POST" && !cid) {
      const c = cleanLog(b); if (!c) return out({ error: "Titel und mindestens ein Punkt sind Pflicht." }, 400);
      const e = { id: randomUUID(), created: Date.now(), ...c }; let warnings = [];
      if (b.announce) { const r = await D.announceChangelog(e, b.ping !== false); e.msgs = r.msgs; warnings = r.warn; }
      logs.push(e); await store.setJSON("changelog", logs); return out({ ...e, warnings }, 201);
    }
    const i = logs.findIndex((x) => x.id === cid);
    if (i < 0) return out({ error: "Eintrag nicht gefunden." }, 404);
    if (req.method === "PUT") {
      const c = cleanLog(b); if (!c) return out({ error: "Titel und mindestens ein Punkt sind Pflicht." }, 400);
      const e = { ...logs[i], ...c }; let warnings = [];
      if (b.announce) { const r = await D.announceChangelog(e, b.ping !== false); e.msgs = r.msgs || e.msgs; warnings = r.warn; }
      logs[i] = e; await store.setJSON("changelog", logs); return out({ ...e, warnings });
    }
    if (req.method === "DELETE") { await D.removeChangelogMessage(logs[i]); logs.splice(i, 1); await store.setJSON("changelog", logs); return out({ ok: true }); }
    return out({ error: "Methode nicht erlaubt." }, 405);
  }

  if (path.startsWith("/api/discord-admin/")) {
    const d = needAuth(); if (d) return d;
    const act = path.slice(19);
    if (act === "status") return out({ token: D.configured(), app: !!D.env("DISCORD_APP_ID"), publicKey: !!D.env("DISCORD_PUBLIC_KEY"), events: !!D.env("DISCORD_EVENTS_CHANNEL_ID"), changelog: !!(D.env("DISCORD_CHANGELOG_CHANNEL_ID") || D.env("DISCORD_EVENTS_CHANNEL_ID")), news: !!(D.env("DISCORD_NEWS_CHANNEL_ID") || D.env("DISCORD_EVENTS_CHANNEL_ID")), role: !!D.env("DISCORD_PING_ROLE_ID") });
    if (req.method !== "POST") return out({ error: "POST erwartet." }, 405);
    try {
      if (act === "register") return out({ ok: true, count: await D.registerCommands() });
      if (act === "test") {
        const c = D.channel("EVENTS"); if (!c) return out({ error: "DISCORD_EVENTS_CHANNEL_ID fehlt." }, 400);
        await D.post(c, "", { title: "✅ Verbindung steht", description: "Der XuroSMP-Bot kann hier schreiben.", color: D.COLOR.ok });
        return out({ ok: true });
      }
      if (act === "sync") {
        const evs = (await store.get("events", { type: "json" })) ?? []; const warnings = []; let n = 0;
        for (const e of evs) { if (+new Date(e.end || +new Date(e.start) + 2 * 3600e3) < Date.now()) continue; n++; warnings.push(...(await D.syncEvent(store, e, { announce: false }))); }
        return out({ ok: true, count: n, warnings });
      }
    } catch (x) { return out({ error: x.message }, 502); }
    return out({ error: "Unbekannte Aktion." }, 404);
  }

  const id = path.startsWith("/api/events/") ? path.slice(12) : "";
  const list = (await store.get("events", { type: "json" })) ?? [];
  if (req.method === "GET" && !id) return out(list);
  const d = needAuth(); if (d) return d;

  if (req.method === "POST" && !id) {
    const e = clean(await body()); if (!e) return out({ error: "Titel und gültiges Startdatum sind Pflicht." }, 400);
    const ev = { id: randomUUID(), ...e }; list.push(ev);
    await store.setJSON("events", list);
    return out({ ...ev, warnings: await D.syncEvent(store, ev).catch((x) => [x.message]) }, 201);
  }
  const i = list.findIndex((x) => x.id === id);
  if (i < 0) return out({ error: "Event nicht gefunden." }, 404);
  if (req.method === "PUT") {
    const e = clean(await body()); if (!e) return out({ error: "Titel und gültiges Startdatum sind Pflicht." }, 400);
    list[i] = { id, ...e }; await store.setJSON("events", list);
    return out({ ...list[i], warnings: await D.syncEvent(store, list[i], { announce: true }).catch((x) => [x.message]) });
  }
  if (req.method === "DELETE") { list.splice(i, 1); await store.setJSON("events", list); return out({ ok: true, warnings: await D.removeEvent(store, id).catch((x) => [x.message]) }); }
  return out({ error: "Methode nicht erlaubt." }, 405);
};
