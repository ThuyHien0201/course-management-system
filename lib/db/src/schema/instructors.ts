import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const instructorsTable = pgTable("instructors", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  academicTitle: text("academic_title"),
  position: text("position"),
  specialization: text("specialization"),
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),
  approvalStatus: text("approval_status").notNull().default("PENDING"),
  approvalNote: text("approval_note"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInstructorSchema = createInsertSchema(instructorsTable).omit({ id: true, createdAt: true, approvalStatus: true, approvalNote: true, approvedAt: true });
export type InsertInstructor = z.infer<typeof insertInstructorSchema>;
export type Instructor = typeof instructorsTable.$inferSelect;
