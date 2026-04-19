import { pgTable, text, serial, timestamp, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { classesTable } from "./classes";
import { instructorsTable } from "./instructors";

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").references(() => classesTable.id).notNull(),
  sessionDate: text("session_date").notNull(),
  sessionPeriod: text("session_period").notNull(),
  lessonCount: integer("lesson_count").notNull(),
  content: text("content").notNull(),
  instructorId: integer("instructor_id").references(() => instructorsTable.id),
  mediaUrls: json("media_urls").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({ id: true, createdAt: true });
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessionsTable.$inferSelect;
