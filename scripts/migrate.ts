import { runMigrations } from "../src/lib/db/migrate";

runMigrations()
  .then(() => { console.log("Migrationen ausgeführt"); process.exit(0); })
  .catch((e) => { console.error(e); process.exit(1); });
