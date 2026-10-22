/* Demo-Inserate (fiktiv, aus dem Prototyp) für eine Test- oder Vorschau-Installation.
   NICHT auf der produktiven Plattform ausführen. Usage: npm run seed:demo */
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { runMigrations } from "../src/lib/db/migrate";

const R: Record<string, string> = { Bern: "Bern", Solothurn: "Bern", "Zürich": "Zürich", "Basel-Stadt": "Basel und Aargau", "Basel-Landschaft": "Basel und Aargau", Aargau: "Basel und Aargau", Luzern: "Zentralschweiz", Zug: "Zentralschweiz", Schwyz: "Zentralschweiz", "Graubünden": "Ostschweiz", "St. Gallen": "Ostschweiz", Thurgau: "Ostschweiz", Schaffhausen: "Ostschweiz", Freiburg: "Romandie", Waadt: "Romandie", Neuenburg: "Romandie", Jura: "Romandie", Tessin: "Tessin" };

type D = [type: "sell" | "cap", seg: "kmu" | "startup", plan: string, title: string, branche: string, sub: string, kanton: string, rf: string, umsatz: string, ma: number, gegr: number, stake: string | null, amount: number | null, valuation: number | null, phase: string | null, vink: string, vork: string, name: string, desc: string, grund: string, days: number];
const DEMO: D[] = [
  ["sell", "kmu", "basis", "Regionale Bergbahn, Aktienpaket", "Tourismus und Freizeit", "Bergbahnen und Freizeitanlagen", "Graubünden", "AG", "CHF 10–25 Mio.", 85, 1957, "0,8 %", 54000, null, null, "ja", "nein", "Bergbahnen Beispieltal AG", "120 Namenaktien einer etablierten Bergbahn mit Sommer- und Winterbetrieb. Die Gesellschaft zahlt seit Jahren eine Dividende und gewährt Aktionären Vergünstigungen auf Saisonabos.", "Erbteilung – drei Geschwister verkaufen ihr Paket gemeinsam.", 2],
  ["cap", "startup", "plus", "SaaS für Treuhandbüros, Seed-Runde", "Software und IT", "Unternehmenssoftware (SaaS)", "Zürich", "AG", "CHF 0,5–1 Mio.", 9, 2021, null, 750000, 6000000, "Seed", "ja", "ja", "Ledgerly AG", "Cloud-Software für die Buchhaltung kleiner Treuhandbüros mit über 140 zahlenden Kunden. Gesucht werden Business Angels mit Branchenerfahrung, Mindestinvestment CHF 25'000.", "Ausbau Vertrieb in der Romandie und in Deutschland.", 3],
  ["sell", "kmu", "start", "Treuhandbüro mit 220 Mandaten, Mehrheitsübernahme", "Unternehmensdienstleistungen", "Treuhand und Buchhaltung", "Zürich", "AG", "CHF 1–2 Mio.", 8, 1994, "60 %", 720000, null, null, "ja", "nein", "Muster Treuhand AG", "Treuhandbüro in Winterthur mit Schwerpunkt Buchhaltung, Steuern und Lohnwesen für KMU und Privatpersonen. Langjährige Mandate, hoher Anteil wiederkehrender Honorare.", "Die beiden Gründer übergeben aus Altersgründen und bleiben zwei Jahre beratend dabei.", 4],
  ["sell", "kmu", "basis", "Schreinerei mit 18 Mitarbeitenden, Nachfolge-Teilverkauf", "Handwerk und Gewerbe", "Schreinerei und Holzbau", "Bern", "AG", "CHF 2–5 Mio.", 18, 1984, "30 %", null, null, null, "ja", "nein", "Holzwerk Muster AG", "Gut ausgelastete Bau- und Möbelschreinerei im Berner Mittelland mit eigener Liegenschaft. Ein Einstieg ins Kader ist erwünscht, aber keine Bedingung.", "Der Inhaber (63) regelt die Nachfolge schrittweise und sucht einen Mitinhaber.", 5],
  ["cap", "kmu", "premium", "Craft-Brauerei, Ausbau der Produktion", "Gastronomie und Lebensmittel", "Brauerei und Getränke", "Luzern", "AG", "CHF 1–2 Mio.", 14, 2012, null, 400000, null, null, "ja", "nein", "Seebräu Muster AG", "Regionale Brauerei mit Restaurant und Handel in über 120 Verkaufsstellen. Aktionäre erhalten eine jährliche Naturaldividende.", "Neue Abfüllanlage und Erweiterung der Lagerkapazität.", 7],
  ["sell", "startup", "plus", "Fintech-Startup, Aktien aus Gründerbestand", "Software und IT", "Fintech und Insurtech", "Zug", "AG", "CHF 1–2 Mio.", 17, 2019, "1,5 %", 120000, null, "Series A", "ja", "ja", "Zahlwerk Muster AG", "Software für Zahlungsabgleich und Liquiditätsplanung bei KMU. Der Lizenzumsatz wächst seit drei Jahren um über 40 % pro Jahr.", "Ein Mitgründer ist in ein neues Projekt gewechselt und verkauft einen Teil seiner Aktien.", 10],
  ["sell", "kmu", "premium", "Weingut am Genfersee, Minderheitsbeteiligung", "Landwirtschaft und Weinbau", "Weinbau und Kellerei", "Waadt", "AG", "CHF 2–5 Mio.", 12, 1932, "25 %", 900000, null, null, "ja", "ja", "Domaine Exemple SA", "14 Hektaren Reben im Lavaux, eigene Kellerei und Degustationsraum. Rund 60 % des Weins gehen direkt an Privatkunden und Gastronomie.", "Eine Erbengemeinschaft löst eine Beteiligung auf.", 20],
  ["cap", "kmu", "basis", "Solarinstallateur, Kapital für zwei neue Montageteams", "Energie und Umwelt", "Solar und erneuerbare Energie", "Freiburg", "AG", "CHF 2–5 Mio.", 24, 2016, null, 600000, 4500000, null, "ja", "ja", "Soleil Muster SA", "Planung und Montage von Photovoltaikanlagen für Einfamilienhäuser und Gewerbe, Auftragsbücher voll bis Mitte 2027. Gesucht werden Investoren ab CHF 50'000.", "Aufbau von zwei zusätzlichen Montageteams und eines Angebots für Batteriespeicher.", 6],
  ["sell", "kmu", "plus", "Ingenieurbüro, GmbH-Stammanteile", "Bau und Immobilien", "Ingenieur- und Architekturbüros", "St. Gallen", "GmbH", "CHF 2–5 Mio.", 16, 2003, "20 %", 260000, null, null, "nein", "ja", "Planwerk Ingenieure GmbH", "Bauingenieurbüro mit Schwerpunkt Holzbau und Sanierungen. Die Abtretung braucht die Zustimmung der Gesellschafterversammlung.", "Ein Gründungsgesellschafter zieht sich aus dem operativen Geschäft zurück.", 14],
  ["cap", "startup", "premium", "Biotech-Startup, Seed-Runde für Wirkstoffentwicklung", "Gesundheit und Life Sciences", "Biotech und Pharma", "Basel-Stadt", "AG", "unter CHF 0,5 Mio.", 7, 2023, null, 2000000, 9000000, "Seed", "ja", "ja", "Muster Therapeutics AG", "Spin-off einer Schweizer Hochschule mit eigener Wirkstoffplattform gegen Autoimmunerkrankungen. Ein Lead-Investor hat bereits zugesagt.", "Präklinische Studien und Ausbau des Labors.", 25],
  ["sell", "kmu", "basis", "Onlineshop für Outdoor-Ausrüstung, 51 % der Stammanteile", "Handel", "Onlinehandel", "Bern", "GmbH", "CHF 2–5 Mio.", 11, 2013, "51 %", 650000, null, null, "nein", "ja", "Bergsport Muster GmbH", "Profitabler Onlineshop mit eigener Logistik in Thun und über 40'000 Stammkunden.  Gut dokumentierte Prozesse und eingespieltes Team.", "Der Gründer konzentriert sich auf ein neues Projekt und bleibt Minderheitsgesellschafter.", 30],
  ["sell", "kmu", "basis", "Präzisionsmechanik, Familienaktien", "Industrie und Produktion", "Präzisionsmechanik", "Basel-Landschaft", "AG", "CHF 10–25 Mio.", 64, 1971, "12 %", 1200000, null, null, "ja", "ja", "Rheinmech Präzision AG", "Zulieferer für Medizinaltechnik und Uhrenindustrie mit stabiler Ertragslage. Bestehende Aktionäre haben ein Vorkaufsrecht von 30 Tagen.", "Familienaktionärin ohne operative Rolle möchte ihr Vermögen diversifizieren.", 16],
];

(async () => {
  await runMigrations();
  const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL!, timezone: "Z" });
  const email = "demo@swissowners.ch";
  const [rows] = await conn.query("SELECT id FROM users WHERE email=?", [email]);
  let uid = (rows as { id: number }[])[0]?.id;
  if (!uid) {
    const [r] = await conn.execute(
      "INSERT INTO users (email,password_hash,first_name,last_name,email_verified_at) VALUES (?,?,?,?,UTC_TIMESTAMP())",
      [email, await bcrypt.hash("demo-swissowners-2026", 12), "Demo", "Inserent"],
    );
    uid = (r as { insertId: number }).insertId;
  }
  for (const d of DEMO) {
    const [t, seg, plan, title, br, sub, ka, rf, ums, ma, gegr, stake, amount, val, phase, vink, vork, name, desc, grund, days] = d;
    const [r] = await conn.execute(
      `INSERT INTO listings (owner_id,type,segment,status,plan,title,description,reason,company_name,company_uid,branche,sub,kanton,region,legal_form,revenue_class,employees,founded_year,phase,stake,amount,valuation,vinkuliert,vorkauf,company_informed,views,published_at)
       VALUES (?,?,?,'online',?,?,?,?,?,'CHE-000.000.000',?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,UTC_TIMESTAMP() - INTERVAL ? DAY)`,
      [uid, t, seg, plan, title, desc, grund, name, br, sub, ka, R[ka], rf, ums, ma, gegr, phase, stake, amount, val, vink, vork, 80 + Math.floor(Math.random() * 300), days],
    );
    const lid = (r as { insertId: number }).insertId;
    await conn.execute("INSERT INTO subscriptions (listing_id,plan,status,period_end) VALUES (?,?,'active',UTC_TIMESTAMP() + INTERVAL ? DAY)", [lid, plan, 60 - days]);
  }
  console.log(`${DEMO.length} Demo-Inserate angelegt. Login: ${email} / demo-swissowners-2026`);
  await conn.end();
})().catch((e) => { console.error(e); process.exit(1); });
