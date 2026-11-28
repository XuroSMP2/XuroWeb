// Läuft alle 5 Minuten (Netlify Scheduled Function): Event-Erinnerungen + täglicher Advents-Post in Discord.
import { getStore } from "@netlify/blobs";
import { configured, channel, post, pingMention, eventEmbed, COLOR, site } from "../lib/discord.mjs";
import { DOORS, adventState } from "../lib/advent.mjs";

export const config = { schedule: "*/5 * * * *" };

export default async () => {
  if (!configured()) return;
  const store = getStore("xurosmp");
  const flags = (await store.get("tickflags", { type: "json" })) ?? {};
  let dirty = false;
  const events = (await store.get("events", { type: "json" })) ?? [];
  const evChan = channel("EVENTS");

  if (evChan) for (const e of events) {
    const min = (+new Date(e.start) - Date.now()) / 6e4, f = (flags["e" + e.id] ||= {});
    try {
      if (min > 0 && min <= 60 && !f.h) { f.h = 1; dirty = true; await post(evChan, pingMention() + `**${e.title}** startet in einer Stunde!`, eventEmbed(e)); }
      else if (min <= 0 && min > -15 && !f.s) { f.s = 1; dirty = true; await post(evChan, pingMention() + `**${e.title}** startet jetzt! IP: \`${process.env.SERVER_IP || "xurosmp.daronlo.com"}\``); }
    } catch (x) { console.error("Reminder:", x.message); }
  }

  const a = adventState(), nc = channel("NEWS");
  if (a.phase === "run" && nc) {
    const k = `a${a.t.y}-${a.day}`;
    if (!flags[k]) {
      flags[k] = 1; dirty = true;
      try {
        await post(nc, pingMention() + `🎄 **Türchen ${a.day} ist offen!**`, {
          title: `Adventskalender – Türchen ${a.day}`, url: site() + "/advent", color: COLOR.xmas,
          description: "Heute ist dein Türchen dran. Öffne es im Spiel mit `/advent` – nur heute möglich, verpasste Türchen gehen leer aus!\n\n**Heute drin:**\n" + DOORS[a.day].map((x) => "• " + x).join("\n"),
        });
      } catch (x) { console.error("Advent:", x.message); }
    }
  }

  // alte Flags (ältere als 60 Tage bzw. gelöschte Events) entfernen
  const ids = new Set(events.map((e) => "e" + e.id));
  for (const k of Object.keys(flags)) if (k[0] === "e" && !ids.has(k)) { delete flags[k]; dirty = true; }
  if (dirty) await store.setJSON("tickflags", flags);
};
