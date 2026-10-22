export const appUrl = () => (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export function chf(n: number | null | undefined, onNull = "auf Anfrage"): string {
  if (n == null) return onNull;
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    const s = Number.isInteger(m) ? String(m) : m.toFixed(m < 10 ? 2 : 1).replace(/0+$/, "").replace(".", ",");
    return `CHF ${s} Mio.`;
  }
  return "CHF " + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

export function chfExact(n: number): string {
  const [i, d] = n.toFixed(2).split(".");
  return "CHF " + i.replace(/\B(?=(\d{3})+(?!\d))/g, "'") + (d === "00" ? "" : "." + d);
}

export function date(d: Date | null | undefined): string {
  if (!d) return "–";
  return new Intl.DateTimeFormat("de-CH", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Zurich" }).format(d);
}

export function ago(d: Date | null | undefined): string {
  if (!d) return "neu";
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return "heute";
  if (days === 1) return "gestern";
  if (days < 7) return `vor ${days} Tagen`;
  if (days < 14) return "vor 1 Woche";
  if (days < 31) return `vor ${Math.floor(days / 7)} Wochen`;
  if (days < 60) return "vor 1 Monat";
  return `vor ${Math.floor(days / 30)} Monaten`;
}

export const listingNo = (id: number) => `AN-${1000 + id}`;
export const idFromNo = (no: string): number | null => {
  const m = /^(?:AN-)?(\d+)$/i.exec(no);
  if (!m) return null;
  const id = Number(m[1]) - 1000;
  return id > 0 ? id : null;
};

/** «180'000», «CHF 180 000», «180000.–» → 180000; leer → null */
export function parseChf(v: unknown): number | null {
  const s = String(v ?? "").replace(/CHF|Fr\.|\.–|[\s'’]/gi, "").replace(/,-$/, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : NaN;
}

export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);
