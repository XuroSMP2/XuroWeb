# XuroSMP Website

Seiten: `/` Start · `/events` · `/stats` (Bestenlisten) · `/wiki` · `/admin` (Login, Events + Banner verwalten)

## Einrichten (Netlify, einmalig, ca. 10 Minuten)
1. Diesen Ordner als **GitHub-Repo** hochladen (alle Dateien so, wie sie im ZIP liegen).
2. Netlify: **Add new site -> Import an existing project -> GitHub** -> Repo wählen. Die Einstellungen kommen aus `netlify.toml`.
3. Netlify: **Site configuration -> Environment variables** -> `ADMIN_PASSWORD` anlegen (dein Admin-Passwort, lang und einmalig). Optional `ADMIN_SECRET` (beliebiger langer Text).
4. **Deploys -> Trigger deploy**, damit das Passwort aktiv wird.
5. `public/config.js` öffnen und den Discord-Einladungslink eintragen (optional die Discord-Server-ID).
6. `deine-domain/admin` öffnen, einloggen, Events eintragen.

Hinweis: Drag-and-Drop-Upload reicht NICHT, weil der Admin-Bereich eine Netlify Function braucht. Ohne Function bleibt die Seite nutzbar und zeigt nur `public/events.json`.

Events und Banner liegen in Netlify Blobs. Nach 5 Fehlversuchen sperrt der Login für 10 Minuten.

## Bestenlisten / Live-Daten (`/stats`)
Die Seite liest ihre Daten über `netlify/functions/stats.mjs`. Der API-Key bleibt dabei serverseitig.

**Empfohlen: Push (kein offener Port am Minecraft-Server nötig)**
1. Netlify -> Environment variables: `SMPCORE_API_KEY` = ein langer Zufallswert (min. 16 Zeichen).
2. Neu deployen.
3. Im Plugin (`plugins/SMPCore/config.yml`) unter `web-api:` den gleichen Key als `api-key` eintragen und bei `push:` `enabled: true` sowie `url: "https://DEINE-SEITE.netlify.app/api/ingest"` setzen. `/smpcore reload`.
4. Das Plugin sendet alle 120 Sekunden die Daten an `/api/ingest`, sie liegen in Netlify Blobs. Sind sie älter als 15 Minuten, zeigt die Seite "veraltet".

**Alternative: Proxy** (nur wenn der Port 8085 erreichbar ist): zusätzlich `SMPCORE_API_URL` setzen, z. B. `http://xurosmp.daronlo.com:8085`. Wird nur genutzt, wenn keine frischen Push-Daten da sind.

Öffentliche Routen: `/api/stats/status`, `/online`, `/top/{money|crystals|gems|kills|deaths|playtime}`, `/player/{name}`, `/clans`, `/clans/{name}`.

## Changelog & Discord-Bot (alles über Netlify, kein eigener Bot-Server nötig)

**Changelog:** `/changelog` (öffentlich) und Verwaltung unter `/admin`. Neue Einträge können direkt in Discord gepostet werden.
**Events:** Events aus `/admin` landen automatisch im Discord-Event-Tab und als Nachricht im Event-Kanal (Änderungen/Löschen werden mitgezogen). 1 Stunde vorher und beim Start kommt eine Erinnerung.
**Advent:** Vom 1.–24.12. gibt es um Mitternacht (Berlin) automatisch einen Post „Türchen N ist offen".
**Slash-Befehle:** `/events /changelog /status /ip /advent /regeln /wiki /top /spieler`.

### Einrichtung
1. https://discord.com/developers/applications → *New Application*. Unter **Bot**: Token erzeugen (`DISCORD_BOT_TOKEN`). Unter **General Information**: *Application ID* (`DISCORD_APP_ID`) und *Public Key* (`DISCORD_PUBLIC_KEY`) kopieren.
2. Bot einladen: **OAuth2 → URL Generator**, Scopes `bot` + `applications.commands`, Rechte *View Channels, Send Messages, Embed Links, Manage Events, Manage Messages*. Link öffnen, Server wählen.
3. In Discord (Entwicklermodus an) Rechtsklick auf die Kanäle → *ID kopieren*.
4. Netlify → Site configuration → Environment variables (danach neu deployen):

| Variable | Pflicht | Inhalt |
|---|---|---|
| `DISCORD_BOT_TOKEN` | ja | Bot-Token |
| `DISCORD_APP_ID` | ja | Application-ID |
| `DISCORD_PUBLIC_KEY` | ja (Slash-Befehle) | Public Key |
| `DISCORD_EVENTS_CHANNEL_ID` | ja | Kanal für Events und Erinnerungen |
| `DISCORD_CHANGELOG_CHANNEL_ID` | optional | Kanal für Changelogs (sonst Event-Kanal) |
| `DISCORD_NEWS_CHANNEL_ID` | optional | Kanal für den Advents-Post (sonst Event-Kanal) |
| `DISCORD_PING_ROLE_ID` | optional | Rolle, die bei Events/Updates gepingt wird |
| `DISCORD_GUILD_ID` | optional | Standard: dein Server |
| `SERVER_IP` | optional | Standard: xurosmp.daronlo.com |

5. Developer Portal → General Information → **Interactions Endpoint URL**: `https://DEINE-SEITE.netlify.app/api/discord` (Discord prüft sie sofort).
6. `/admin` öffnen: im Bereich *Discord* erst **Testnachricht senden**, dann **Slash-Befehle registrieren**.
