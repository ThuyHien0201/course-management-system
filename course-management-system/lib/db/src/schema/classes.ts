import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { coursesTable } from "./courses";

export const classesTable = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  courseId: integer("course_id").references(() => coursesTable.id).notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  approvalStatus: text("approval_status").notNull().default("PENDING"),
  approvalNote: text("approval_note"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClassSchema = createInsertSchema(classesTable).omit({ id: true, createdAt: true, approvalStatus: true, approvalNote: true, approvedAt: true });
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classesTable.$inferSelect;
