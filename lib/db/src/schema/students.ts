import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { instructorsTable } from "./instructors";
import { classesTable } from "./classes";

export const studentsTable = pgTable("students", {
  id: serial("id").primaryKey(),
  studentCode: text("student_code").notNull(),
  fullName: text("full_name").notNull(),
  dateOfBirth: text("date_of_birth"),
  idNumber: text("id_number"),
  idIssueDate: text("id_issue_date"),
  idIssuePlace: text("id_issue_place"),
  workplace: text("workplace"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  photoUrl: text("photo_url"),
  instructorId: integer("instructor_id").references(() => instructorsTable.id),
  classId: integer("class_id").references(() => classesTable.id),
  testScore: text("test_score"),
  grade: text("grade"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStudentSchema = createInsertSchema(studentsTable).omit({ id: true, createdAt: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
