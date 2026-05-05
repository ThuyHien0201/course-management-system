import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const coursesTable = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  duration: text("duration").notNull(),
  approvalStatus: text("approval_status").notNull().default("PENDING"),
  approvalNote: text("approval_note"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCourseSchema = createInsertSchema(coursesTable).omit({ id: true, createdAt: true, approvalStatus: true, approvalNote: true, approvedAt: true });
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof coursesTable.$inferSelect;
