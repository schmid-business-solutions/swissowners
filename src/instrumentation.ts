/* Läuft einmal beim Start des Node-Servers: Datenbank-Migrationen automatisch einspielen.
   So braucht es auf Hostinger keinen manuellen Schritt nach einem Deploy. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.DATABASE_URL) {
    console.warn("[anteo] DATABASE_URL fehlt – Migrationen übersprungen");
    return;
  }
  try {
    const { runMigrations } = await import("./lib/db/migrate");
    await runMigrations();
    console.log("[anteo] Datenbank-Migrationen aktuell");
  } catch (err) {
    console.error("[anteo] Migration fehlgeschlagen", err);
  }
}
