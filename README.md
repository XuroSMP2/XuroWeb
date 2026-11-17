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
