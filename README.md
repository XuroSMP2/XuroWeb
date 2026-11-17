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
Die Seite holt Daten über die Netlify Function `netlify/functions/stats.mjs` aus der SMPCore-Web-API des Minecraft-Servers. Der API-Key bleibt dabei serverseitig.
1. Im Plugin (`plugins/SMPCore/config.yml`) `web-api.enabled: true` und einen langen `api-key` setzen, Port 8085 freigeben, `/smpcore reload`.
2. Netlify -> Environment variables: `SMPCORE_API_URL` (z. B. `http://xurosmp.daronlo.com:8085`) und `SMPCORE_API_KEY` (derselbe Key).
3. Neu deployen. Öffentliche Routen: `/api/stats/status`, `/online`, `/top/{money|crystals|gems|kills|deaths|playtime}`, `/player/{name}`, `/clans`, `/clans/{name}`.
