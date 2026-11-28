// Discord-Anbindung (nur Bot-Token, kein eigener Server nötig). Nötige Netlify-Variablen siehe README.
const API = "https://discord.com/api/v10";
export const env = (k, d = "") => process.env[k] || d;
export const configured = () => !!env("DISCORD_BOT_TOKEN");
export const GUILD = () => env("DISCORD_GUILD_ID", "1559822501167636531");
export const site = () => (env("URL") || env("SITE_URL") || "https://xurosmp.netlify.app").replace(/\/+$/, "");
export const COLOR = { main: 0x9659ff, ok: 0x3ddc84, warn: 0xffcc4d, bad: 0xff5c6c, xmas: 0xe03c4a };
export const TYPES = {
  pvp: ["PvP", 0xff5c6c], bauen: ["Bauen", 0x3ddc84], community: ["Community", 0x9659ff], gewinnspiel: ["Gewinnspiel", 0xffcc4d], sonstiges: ["Event", 0x9aa4b5],
};

export async function dc(method, path, body) {
  const r = await fetch(API + path, {
    method,
    headers: { authorization: "Bot " + env("DISCORD_BOT_TOKEN"), "content-type": "application/json", "user-agent": "XuroSMP-Bot (https://xurosmp.daronlo.com, 1.0)" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  if (r.status === 204) return {};
  const d = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(`Discord ${r.status}: ${d.message || r.statusText}`); e.status = r.status; throw e; }
  return d;
}

const unix = (iso) => Math.floor(new Date(iso).getTime() / 1000);
export const cut = (s, n) => (String(s || "").length > n ? String(s).slice(0, n - 1) + "…" : String(s || ""));

export function eventEmbed(ev) {
  const [label, color] = TYPES[ev.type] || TYPES.sonstiges;
  const fields = [{ name: "Start", value: `<t:${unix(ev.start)}:F>\n<t:${unix(ev.start)}:R>`, inline: true }];
  if (ev.end) fields.push({ name: "Ende", value: `<t:${unix(ev.end)}:t>`, inline: true });
  fields.push({ name: "Ort", value: cut(ev.location || "xurosmp.daronlo.com", 100), inline: true });
  if (ev.prize) fields.push({ name: "Preis", value: cut(ev.prize, 150), inline: false });
  return {
    title: cut(`📅 ${ev.title}`, 256), url: site() + "/events", color,
    description: cut(ev.description, 1500) || undefined, fields,
    footer: { text: `XuroSMP · ${label}` },
  };
}

/** Changelog als Discord-Text (Markdown) in Nachrichten à max. 1900 Zeichen, an Abschnittsgrenzen geteilt. */
export function changelogMessages(c, withPing = true) {
  const head = `# 🆕 ${c.heading || "Ingame Changelog"}\n\n` + (withPing && env("DISCORD_PING_ROLE_ID") ? `<@&${env("DISCORD_PING_ROLE_ID")}>\n` : "")
    + `# ${c.title}${c.version ? " (" + c.version + ")" : ""}` + (c.intro ? `\n${c.intro}` : "");
  const blocks = [head];
  for (const sec of c.sections || []) blocks.push(`## ${sec.title}\n` + (sec.items || []).map((x) => "* " + x).join("\n"));
  const msgs = [];
  let cur = "";
  const push = (t) => { if ((cur + "\n" + t).length > 1900 && cur) { msgs.push(cur); cur = t; } else cur = cur ? cur + "\n" + t : t; };
  for (const bl of blocks) {
    if (bl.length <= 1900) { push(bl); continue; }
    let part = "";
    for (const ln of bl.split("\n")) { if ((part + "\n" + ln).length > 1900) { push(part); part = ln; } else part = part ? part + "\n" + ln : ln; }
    if (part) push(part);
  }
  if (cur) msgs.push(cur);
  return msgs;
}

export const channel = (kind) => env("DISCORD_" + kind + "_CHANNEL_ID") || env("DISCORD_EVENTS_CHANNEL_ID");
const ping = () => (env("DISCORD_PING_ROLE_ID") ? `<@&${env("DISCORD_PING_ROLE_ID")}> ` : "");
export const pingMention = ping;
const allow = () => (env("DISCORD_PING_ROLE_ID") ? { parse: [], roles: [env("DISCORD_PING_ROLE_ID")] } : { parse: [] });

export async function post(chan, content, embed) {
  return dc("POST", `/channels/${chan}/messages`, { content: content || undefined, embeds: embed ? [embed] : [], allowed_mentions: allow() });
}

// ---------- Events synchronisieren (Discord-Event-Tab + Nachricht im Event-Kanal) ----------
const map = async (store) => (await store.get("dcmap", { type: "json" })) ?? {};

export async function syncEvent(store, ev, { announce = true } = {}) {
  const warn = [];
  if (!configured()) return warn;
  const m = await map(store);
  const e = m[ev.id] || {};
  const start = new Date(ev.start), end = ev.end ? new Date(ev.end) : new Date(+start + 2 * 3600e3);
  const body = {
    name: cut(ev.title, 100), description: cut(ev.description || `XuroSMP-Event auf ${site()}/events`, 1000),
    scheduled_start_time: start.toISOString(), scheduled_end_time: end.toISOString(),
    privacy_level: 2, entity_type: 3, entity_metadata: { location: cut(ev.location || "xurosmp.daronlo.com", 100) },
  };
  try {
    if (e.se) { try { await dc("PATCH", `/guilds/${GUILD()}/scheduled-events/${e.se}`, body); } catch (x) { if (x.status === 404) { delete e.se; } else throw x; } }
    if (!e.se && +end > Date.now()) e.se = (await dc("POST", `/guilds/${GUILD()}/scheduled-events`, +start > Date.now() ? body : { ...body, scheduled_start_time: new Date(Date.now() + 60e3).toISOString() })).id;
  } catch (x) { warn.push("Discord-Event: " + x.message); }
  const chan = channel("EVENTS");
  if (chan && announce) {
    try {
      const embed = eventEmbed(ev);
      if (e.msg) { try { await dc("PATCH", `/channels/${chan}/messages/${e.msg}`, { embeds: [embed] }); } catch (x) { if (x.status === 404) delete e.msg; else throw x; } }
      if (!e.msg) e.msg = (await post(chan, ping() + "**Neues Event!**", embed)).id;
    } catch (x) { warn.push("Event-Nachricht: " + x.message); }
  }
  m[ev.id] = e;
  await store.setJSON("dcmap", m);
  return warn;
}

export async function removeEvent(store, id) {
  const warn = [];
  if (!configured()) return warn;
  const m = await map(store), e = m[id];
  if (!e) return warn;
  try { if (e.se) await dc("DELETE", `/guilds/${GUILD()}/scheduled-events/${e.se}`); } catch (x) { if (x.status !== 404) warn.push("Discord-Event: " + x.message); }
  try { if (e.msg && channel("EVENTS")) await dc("DELETE", `/channels/${channel("EVENTS")}/messages/${e.msg}`); } catch (x) { if (x.status !== 404) warn.push("Event-Nachricht: " + x.message); }
  delete m[id];
  await store.setJSON("dcmap", m);
  return warn;
}

// ---------- Changelog ----------
export async function announceChangelog(c, ping = true) {
  const chan = channel("CHANGELOG");
  if (!configured() || !chan) return { warn: ["Kein Changelog-Kanal gesetzt (DISCORD_CHANGELOG_CHANNEL_ID)."] };
  const texts = changelogMessages(c, ping);
  const old = c.msgs || [];
  try {
    const ids = [];
    if (old.length === texts.length) {
      for (let i = 0; i < texts.length; i++) { try { await dc("PATCH", `/channels/${chan}/messages/${old[i]}`, { content: texts[i], allowed_mentions: allow() }); ids.push(old[i]); } catch (x) { if (x.status === 404) ids.push((await dc("POST", `/channels/${chan}/messages`, { content: texts[i], allowed_mentions: allow() })).id); else throw x; } }
    } else {
      await removeChangelogMessage(c);
      for (const t of texts) ids.push((await dc("POST", `/channels/${chan}/messages`, { content: t, allowed_mentions: allow() })).id);
    }
    return { msgs: ids, warn: [] };
  } catch (x) { return { warn: ["Changelog: " + x.message] }; }
}

export async function removeChangelogMessage(c) {
  for (const id of c.msgs || []) { try { await dc("DELETE", `/channels/${channel("CHANGELOG")}/messages/${id}`); } catch { /* egal */ } }
}

// ---------- Slash-Befehle ----------
export const COMMANDS = [
  { name: "events", description: "Zeigt die nächsten XuroSMP-Events" },
  { name: "changelog", description: "Zeigt das neueste Update" },
  { name: "status", description: "Ist der Server online? Wer spielt gerade?" },
  { name: "ip", description: "Die Server-IP zum Kopieren" },
  { name: "advent", description: "Adventskalender: Türchen von heute und Regeln" },
  { name: "regeln", description: "Die wichtigsten Server-Regeln" },
  { name: "wiki", description: "Link zu einem Wiki-Thema", options: [{ type: 3, name: "thema", description: "Thema", required: false, choices: [
    ["Währungen", "waehrung"], ["Shop", "shop"], ["Crates & Keys", "crates"], ["Clans", "clans"], ["Ränge", "raenge"], ["Kits", "kits"], ["Weihnachten", "weihnachten"], ["Regeln", "regeln"],
  ].map(([name, value]) => ({ name, value })) }] },
  { name: "top", description: "Bestenliste", options: [{ type: 3, name: "kategorie", description: "Welche Liste?", required: true, choices: [
    ["Geld", "money"], ["Kills", "kills"], ["Stars", "crystals"], ["Gems", "gems"], ["Spielzeit", "playtime"], ["Tode", "deaths"],
  ].map(([name, value]) => ({ name, value })) }] },
  { name: "spieler", description: "Statistiken eines Spielers", options: [{ type: 3, name: "name", description: "Minecraft-Name", required: true }] },
];

export async function registerCommands() {
  const app = env("DISCORD_APP_ID");
  if (!app) throw new Error("DISCORD_APP_ID fehlt.");
  const r = await dc("PUT", `/applications/${app}/guilds/${GUILD()}/commands`, COMMANDS);
  return r.length;
}
