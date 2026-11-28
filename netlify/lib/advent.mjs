// Adventskalender-Daten (gleich wie advent.yml im Plugin, nur Anzeige-Texte) und Datums-Hilfen.
export const DOORS = {
 "1": [
  "$2.500",
  "8× Weihnachtsplätzchen"
 ],
 "2": [
  "2 Stars",
  "16× Steak"
 ],
 "3": [
  "$5.000",
  "1× Weihnachts-Key"
 ],
 "4": [
  "5 Gems",
  "16× Brot"
 ],
 "5": [
  "$7.500",
  "3× Zuckerstange"
 ],
 "6": [
  "4 Stars",
  "16× Eisenbarren"
 ],
 "7": [
  "1× Weihnachts-Key",
  "16× Weihnachtsplätzchen"
 ],
 "8": [
  "$10.000",
  "5 Gems"
 ],
 "9": [
  "5 Stars",
  "12× Goldbarren"
 ],
 "10": [
  "2× Weihnachts-Key",
  "24× Schweinekotelett"
 ],
 "11": [
  "$12.500",
  "2× Diamanten"
 ],
 "12": [
  "10 Gems",
  "16× Erfahrungsflaschen"
 ],
 "13": [
  "6 Stars",
  "1× Geschenk"
 ],
 "14": [
  "2× Weihnachts-Key",
  "$10.000"
 ],
 "15": [
  "$15.000",
  "16× Smaragde"
 ],
 "16": [
  "10 Gems",
  "16× Goldene Karotten"
 ],
 "17": [
  "8 Stars",
  "2× Common Key"
 ],
 "18": [
  "3× Weihnachts-Key",
  "4× Diamanten"
 ],
 "19": [
  "$20.000",
  "1× Netherit-Schrott"
 ],
 "20": [
  "15 Gems",
  "32× Weihnachtsplätzchen"
 ],
 "21": [
  "10 Stars",
  "1× Rare Key"
 ],
 "22": [
  "$25.000",
  "3× Weihnachts-Key"
 ],
 "23": [
  "20 Gems",
  "4× Goldene Äpfel",
  "1× Weihnachtsstern"
 ],
 "24": [
  "$50.000",
  "15 Stars",
  "25 Gems",
  "5× Weihnachts-Key",
  "1× Heiligabend-Geschenk"
 ]
};
export const PERFECT = ["50 Gems", "1× Legendary Key", "5× Weihnachts-Key", "1× Totem der Unsterblichkeit"];

/** Heutiges Datum in Berlin als { y, m, d } */
export function berlin(date = new Date()) {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(date).split("-").map(Number);
  return { y: p[0], m: p[1], d: p[2] };
}
export const berlinHour = (date = new Date()) => Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", hour: "2-digit", hourCycle: "h23" }).format(date));

/** Zustand des Kalenders: before | run | end, plus heutiges Türchen. */
export function adventState(date = new Date()) {
  const t = berlin(date);
  if (t.m === 12) return t.d <= 24 ? { phase: "run", day: t.d, t } : { phase: "end", day: 0, t };
  if (t.m === 1) return { phase: "end", day: 0, t };
  const days = Math.round((Date.UTC(t.y, 11, 1) - Date.UTC(t.y, t.m - 1, t.d)) / 864e5);
  return { phase: "before", day: 0, days, t };
}
