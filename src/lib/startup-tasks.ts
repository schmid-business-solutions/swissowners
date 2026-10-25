import { eq } from "drizzle-orm";
import { db, schema } from "./db";

/** Führt einmalige Aufgaben aus, die eine Migration in app_flags eingetragen hat, und löscht danach den Eintrag. */
export async function runStartupTasks() {
  const flags = await db.select().from(schema.appFlags);
  for (const f of flags) {
    if (f.key === "ext_samples") {
      const { createExtSamples } = await import("./samples-ext-admin");
      const n = await createExtSamples();
      console.log(`[SwissOwners] ${n} Mustereinträge für Partner und Verwaltungsräte angelegt`);
    }
    await db.delete(schema.appFlags).where(eq(schema.appFlags.key, f.key));
  }
}
