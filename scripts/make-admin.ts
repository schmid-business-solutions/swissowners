/* Usage: npm run make-admin -- person@example.ch */
import mysql from "mysql2/promise";

const email = process.argv[2]?.toLowerCase();
if (!email) { console.error("E-Mail angeben: npm run make-admin -- person@example.ch"); process.exit(1); }
(async () => {
  const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL! });
  const [res] = await conn.execute("UPDATE users SET role='admin' WHERE email=?", [email]);
  console.log((res as { affectedRows: number }).affectedRows ? `${email} ist jetzt Admin` : `Kein Konto mit ${email} gefunden`);
  await conn.end();
})();
