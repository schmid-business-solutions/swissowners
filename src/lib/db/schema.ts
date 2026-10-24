import {
  mysqlTable, int, varchar, text, mediumtext, datetime, boolean, mysqlEnum, uniqueIndex, index, primaryKey,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

const now = () => datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`);

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }), // null bei reiner Anmeldung über Google/LinkedIn
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  role: mysqlEnum("role", ["user", "admin"]).notNull().default("user"),
  emailVerifiedAt: datetime("email_verified_at"),
  avatarUpdatedAt: datetime("avatar_updated_at"), // gesetzt, wenn ein Profilbild (von Google/LinkedIn) gespeichert ist
  createdAt: now(),
}, (t) => [uniqueIndex("users_email_uq").on(t.email)]);

/* Profilbild separat, damit es nicht bei jeder Seitenanfrage mitgeladen wird */
export const userAvatars = mysqlTable("user_avatars", {
  userId: int("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  mime: varchar("mime", { length: 40 }).notNull(),
  data: mediumtext("data").notNull(), // Base64
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const sessions = mysqlTable("sessions", {
  id: varchar("id", { length: 64 }).primaryKey(), // SHA-256 des Cookie-Tokens
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: datetime("expires_at").notNull(),
  createdAt: now(),
}, (t) => [index("sessions_user_idx").on(t.userId)]);

/* Verknüpfte Anmeldungen über Google oder LinkedIn (OpenID Connect) */
export const oauthAccounts = mysqlTable("oauth_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: mysqlEnum("provider", ["google", "linkedin"]).notNull(),
  providerUserId: varchar("provider_user_id", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  createdAt: now(),
}, (t) => [uniqueIndex("oauth_provider_user_uq").on(t.provider, t.providerUserId), index("oauth_user_idx").on(t.userId)]);

export const authTokens = mysqlTable("auth_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["verify", "reset"]).notNull(),
  tokenHash: varchar("token_hash", { length: 64 }).notNull(),
  expiresAt: datetime("expires_at").notNull(),
  usedAt: datetime("used_at"),
  createdAt: now(),
}, (t) => [uniqueIndex("auth_tokens_hash_uq").on(t.tokenHash)]);

export const LISTING_STATUS = ["draft", "pending_payment", "in_review", "online", "paused", "expired", "sold", "rejected"] as const;
export type ListingStatus = (typeof LISTING_STATUS)[number];
export const PLAN_ENUM = ["start", "basis", "plus", "premium"] as const;

export const listings = mysqlTable("listings", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["sell", "cap"]).notNull(),
  segment: mysqlEnum("segment", ["kmu", "startup"]).notNull(),
  status: mysqlEnum("status", LISTING_STATUS).notNull().default("draft"),
  plan: mysqlEnum("plan", PLAN_ENUM).notNull().default("start"),
  title: varchar("title", { length: 80 }).notNull(),
  description: text("description").notNull(),
  reason: text("reason").notNull(),
  companyName: varchar("company_name", { length: 200 }).notNull(),
  companyUid: varchar("company_uid", { length: 20 }).notNull(),
  branche: varchar("branche", { length: 100 }).notNull(),
  sub: varchar("sub", { length: 100 }).notNull(),
  kanton: varchar("kanton", { length: 60 }).notNull(),
  region: varchar("region", { length: 40 }).notNull(),
  legalForm: varchar("legal_form", { length: 20 }).notNull(),
  revenueClass: varchar("revenue_class", { length: 40 }).notNull(),
  employees: int("employees"),
  foundedYear: int("founded_year"),
  phase: varchar("phase", { length: 40 }),
  shareClass: varchar("share_class", { length: 20 }),
  stake: varchar("stake", { length: 60 }), // sell: Anteil in % oder Anzahl Aktien
  amount: int("amount"), // sell: Preisvorstellung CHF, cap: gesuchter Betrag CHF (null = auf Anfrage)
  valuation: int("valuation"), // cap: Pre-Money-Bewertung CHF
  minTicket: int("min_ticket"), // cap: Mindestbetrag CHF
  vinkuliert: mysqlEnum("vinkuliert", ["ja", "nein", "unklar"]).notNull(),
  vorkauf: mysqlEnum("vorkauf", ["ja", "nein", "unklar"]).notNull(),
  companyInformed: boolean("company_informed").notNull().default(false),
  isSample: boolean("is_sample").notNull().default(false), // Musterangebot (fiktiv), wird nach und nach durch echte Angebote ersetzt
  views: int("views").notNull().default(0),
  rejectionReason: text("rejection_reason"),
  publishedAt: datetime("published_at"),
  createdAt: now(),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => new Date()),
}, (t) => [
  index("listings_status_idx").on(t.status),
  index("listings_owner_idx").on(t.ownerId),
  index("listings_branche_idx").on(t.branche),
]);

/* Abo pro Angebot: Laufzeit, Verlängerung, Pause, Payrexx-Token */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  plan: mysqlEnum("plan", PLAN_ENUM).notNull(),
  status: mysqlEnum("status", ["pending", "active", "paused", "past_due", "ended"]).notNull().default("pending"),
  periodEnd: datetime("period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  pausedAt: datetime("paused_at"),
  pausedRemainingDays: int("paused_remaining_days"),
  payrexxTokenTxId: int("payrexx_token_tx_id"),
  remindedFor: datetime("reminded_for"), // periodEnd, für das die Erinnerung verschickt wurde
  createdAt: now(),
}, (t) => [uniqueIndex("subscriptions_listing_uq").on(t.listingId)]);

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  reference: varchar("reference", { length: 40 }).notNull(),
  listingId: int("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: mysqlEnum("kind", ["initial", "upgrade", "renewal", "reactivation"]).notNull(),
  plan: mysqlEnum("plan", PLAN_ENUM).notNull(),
  amountRappen: int("amount_rappen").notNull(),
  status: mysqlEnum("status", ["open", "paid", "failed", "cancelled"]).notNull().default("open"),
  payrexxGatewayId: int("payrexx_gateway_id"),
  payrexxTxId: int("payrexx_tx_id"),
  paidAt: datetime("paid_at"),
  createdAt: now(),
}, (t) => [uniqueIndex("payments_reference_uq").on(t.reference), index("payments_listing_idx").on(t.listingId)]);

export const contactRequests = mysqlTable("contact_requests", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  senderId: int("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  ndaName: varchar("nda_name", { length: 200 }).notNull(),
  ndaAcceptedAt: datetime("nda_accepted_at").notNull(),
  ndaIp: varchar("nda_ip", { length: 64 }),
  readAt: datetime("read_at"),
  createdAt: now(),
}, (t) => [uniqueIndex("contact_listing_sender_uq").on(t.listingId, t.senderId)]);

export const savedListings = mysqlTable("saved_listings", {
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: int("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  createdAt: now(),
}, (t) => [primaryKey({ columns: [t.userId, t.listingId] })]);

export type User = typeof users.$inferSelect;
export type Listing = typeof listings.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Payment = typeof payments.$inferSelect;
