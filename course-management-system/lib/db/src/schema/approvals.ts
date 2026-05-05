import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const approvalHistoryTable = pgTable("approval_history", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  action: text("action").notNull(),
  status: text("status").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ApprovalHistory = typeof approvalHistoryTable.$inferSelect;
