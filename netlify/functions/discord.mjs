// Discord-Slash-Befehle (Interactions-Endpoint). In Discord eintragen unter
// Developer Portal -> General Information -> "Interactions Endpoint URL": https://DEINE-SEITE.netlify.app/api/discord
import { getStore } from "@netlify/blobs";
import { createPublicKey, verify } from "node:crypto";
import { env, site, COLOR, eventEmbed, changelogMessages } from "../lib/discord.mjs";
import { DOORS, PERFECT, adventState } from "../lib/advent.mjs";

export const config = { path: "/api/discord" };

const IP = () => env("SERVER_IP", "xurosmp.daronlo.com");
const SPKI = Buffer.from("302a300506032b6570032100", "hex");

function valid(raw, sig, ts) {
  try {
    const pk = env("DISCORD_PUBLIC_KEY");
    if (!pk || !sig || !ts) return false;
    const key = createPublicKey({ key: Buffer.concat([SPKI, Buffer.from(pk, "hex")]), format: "der", type: "spki" });
    return verify(null, Buffer.from(ts + raw), key, Buffer.from(sig, "hex"));
  } catch { return false; }
}

const reply = (embed, extra = {}) => Response.json({ type: 4, data: { embeds: [embed], allowed_mentions: { parse: [] }, ...extra } });
const text = (content, flags) => Response.json({ type: 4, data: { content, flags, allowed_mentions: { parse: [] } } });
const num = (n) => Number(n || 0).toLocaleString("de-DE");
const opt = (i, name) => i.data.options?.find((o) => o.name === name)?.value;

async function snapshot(store) { try { return await store.get("stats-snapshot", { type: "json" }); } catch { return null; } }

const WIKI = { waehrung: "Währungen", shop: "Shop & Verkaufen", crates: "Crates & Keys", clans: "Clans", raenge: "Ränge", kits: "Kits", weihnachten: "Weihnachten & Adventskalender", regeln: "Server-Regeln" };

const handlers = {
  async events(store) {
    const list = ((await store.get("events", { type: "json" })) ?? [])
      .filter((e) => +new Date(e.end || +new Date(e.start) + 2 * 3600e3) > Date.now()).sort((a, b) => new Date(a.start) - new Date(b.start)).slice(0, 4);
    if (!list.length) return reply({ title: "📅 Events", description: "Gerade ist nichts geplant. Schau bald wieder vorbei!", color: COLOR.main, url: site() + "/events" });
    return Response.json({ type: 4, data: { embeds: list.map(eventEmbed), allowed_mentions: { parse: [] } } });
  },
  async changelog(store) {
    const c = ((await store.get("changelog", { type: "json" })) ?? []).sort((a, b) => b.date.localeCompare(a.date))[0];
    return c ? text(changelogMessages(c, false)[0]) : reply({ title: "📝 Changelog", description: "Noch keine Einträge.", color: COLOR.main, url: site() + "/changelog" });
  },
  async status(store) {
    const s = await snapshot(store);
    if (s?.status && Date.now() - s.receivedAt < 15 * 60e3) {
      const names = (s.online || []).map((p) => p.name || p).slice(0, 20).join(", ");
      return reply({ title: "🟢 XuroSMP ist online", color: COLOR.ok, fields: [
        { name: "Spieler", value: `${s.status.online ?? 0}/${s.status.max ?? "?"}`, inline: true }, { name: "IP", value: `\`${IP()}\``, inline: true },
        ...(names ? [{ name: "Gerade online", value: names }] : []),
      ] });
    }
    try {
      const r = await fetch(`https://api.mcstatus.io/v2/status/java/${IP()}`, { signal: AbortSignal.timeout(2200) });
      const d = await r.json();
      if (d.online) return reply({ title: "🟢 XuroSMP ist online", color: COLOR.ok, fields: [{ name: "Spieler", value: `${d.players?.online ?? 0}/${d.players?.max ?? "?"}`, inline: true }, { name: "Version", value: d.version?.name_clean || "?", inline: true }, { name: "IP", value: `\`${IP()}\``, inline: true }] });
      return reply({ title: "🔴 XuroSMP ist gerade offline", color: COLOR.bad, description: "Wir sind gleich wieder da." });
    } catch { return reply({ title: "❔ Status unbekannt", color: COLOR.warn, description: `IP: \`${IP()}\`` }); }
  },
  async ip() { return reply({ title: "🌐 Server-IP", description: `\`\`\`${IP()}\`\`\`Java und Bedrock (Bedrock-Namen beginnen mit \`.\`)`, color: COLOR.main }); },
  async advent() {
    const a = adventState();
    if (a.phase === "before") return reply({ title: "🎄 Adventskalender", color: COLOR.xmas, description: `Startet in **${a.days} ${a.days === 1 ? "Tag" : "Tagen"}** am 1. Dezember. Jeden Tag ein Türchen, **nur am jeweiligen Tag** abholbar (\`/advent\` im Spiel).`, url: site() + "/advent" });
    if (a.phase === "end") return reply({ title: "🎄 Adventskalender", color: COLOR.xmas, description: "Für dieses Jahr vorbei. Frohes Fest!", url: site() + "/advent" });
    return reply({ title: `🎄 Türchen ${a.day} ist offen!`, color: COLOR.xmas, url: site() + "/advent",
      description: "Öffne es im Spiel mit `/advent`. **Nur heute** möglich – verpasste Türchen gehen leer aus.",
      fields: [{ name: "Heute drin", value: DOORS[a.day].map((x) => "• " + x).join("\n") }, { name: "Treue-Bonus (alle 24 Türchen)", value: PERFECT.map((x) => "• " + x).join("\n") }] });
  },
  async regeln() {
    return reply({ title: "📜 Regeln", color: COLOR.main, url: site() + "/wiki#regeln", description:
      "• **Griefen ist erlaubt**, aber kein Spawnkilling und kein Combat-Logging\n• Keine Cheats, X-Ray, Autoclicker oder Exploits\n• Respektvoller Umgang, keine Beleidigungen\n• Keine Werbung, kein Spam\n\nAlle Regeln: " + site() + "/wiki#regeln" });
  },
  async wiki(store, i) {
    const t = opt(i, "thema");
    return reply({ title: "📖 XuroSMP Wiki", color: COLOR.main, url: site() + "/wiki" + (t ? "#" + t : ""), description: t ? `**${WIKI[t] || t}**\n${site()}/wiki#${t}` : `Alles zum Server: ${site()}/wiki` });
  },
  async top(store, i) {
    const k = opt(i, "kategorie"), s = await snapshot(store);
    const rows = (s?.top?.[k] || []).slice(0, 10);
    if (!rows.length) return reply({ title: "🏆 Bestenliste", color: COLOR.warn, description: "Noch keine Serverdaten empfangen." });
    const fmt = (p) => (k === "playtime" ? `${Math.floor((p.value ?? p[k] ?? 0) / 3600)} Std` : num(p.value ?? p[k] ?? 0));
    const medal = ["🥇", "🥈", "🥉"];
    return reply({ title: "🏆 Top 10 – " + { money: "Geld", kills: "Kills", crystals: "Stars", gems: "Gems", playtime: "Spielzeit", deaths: "Tode" }[k], color: COLOR.main, url: site() + "/stats",
      description: rows.map((p, n) => `${medal[n] || `**${n + 1}.**`} ${p.name} – ${fmt(p)}`).join("\n") });
  },
  async spieler(store, i) {
    const n = String(opt(i, "name") || "").toLowerCase().replace(/^\./, ""), s = await snapshot(store);
    const p = s?.players?.find((x) => String(x.name).toLowerCase().replace(/^\./, "") === n);
    if (!p) return text("Diesen Spieler kenne ich nicht (oder der Server hat noch keine Daten gesendet).", 64);
    const f = [["Geld", p.money, "$"], ["Kills", p.kills], ["Tode", p.deaths], ["Stars", p.crystals], ["Gems", p.gems]].filter((x) => x[1] !== undefined)
      .map(([name, v, pre]) => ({ name, value: (pre || "") + num(v), inline: true }));
    if (p.playtime !== undefined) f.push({ name: "Spielzeit", value: Math.floor(p.playtime / 3600) + " Std", inline: true });
    return reply({ title: "👤 " + p.name, color: COLOR.main, fields: f, url: site() + "/stats" });
  },
};

export default async (req) => {
  if (req.method !== "POST") return new Response("POST erwartet", { status: 405 });
  const raw = await req.text();
  if (!valid(raw, req.headers.get("x-signature-ed25519"), req.headers.get("x-signature-timestamp"))) return new Response("invalid request signature", { status: 401 });
  const i = JSON.parse(raw);
  if (i.type === 1) return Response.json({ type: 1 });
  if (i.type === 2) {
    const h = handlers[i.data?.name];
    if (!h) return text("Diesen Befehl kenne ich nicht.", 64);
    try { return await h(getStore("xurosmp"), i); } catch (e) { return text("Da ist etwas schiefgelaufen. Versuch es gleich noch einmal.", 64); }
  }
  return new Response("ok");
};
