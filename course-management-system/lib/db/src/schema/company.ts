import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const companyInfoTable = pgTable("company_info", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull().default(""),
  slogan: text("slogan").default(""),
  description: text("description").default(""),
  address: text("address").default(""),
  contact: text("contact").default(""),
  email: text("email").default(""),
  website: text("website").default(""),
  taxId: text("tax_id").default(""),
  logoUrl: text("logo_url").default(""),
  qualityLogoUrl: text("quality_logo_url").default(""),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CompanyInfo = typeof companyInfoTable.$inferSelect;
