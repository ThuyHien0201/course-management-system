import { pgTable, text, timestamp, integer, primaryKey } from "drizzle-orm/pg-core";
import { classesTable } from "./classes";
import { studentsTable } from "./students";
import { instructorsTable } from "./instructors";

export const certificatesTable = pgTable("certificates", {
  studentId: integer("student_id").references(() => studentsTable.id).notNull(),
  classId: integer("class_id").references(() => classesTable.id).notNull(),
  issueDate: text("issue_date"),
  expiryDate: text("expiry_date"),
  instructorId: integer("instructor_id").references(() => instructorsTable.id),
  printLocation: text("print_location"),
  locationLink: text("location_link"),
  approvalStatus: text("approval_status").notNull().default("PENDING"),
  approvalNote: text("approval_note"),
  approvedAt: timestamp("approved_at"),
  confirmedAt: timestamp("confirmed_at"),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
}, (t) => [
  primaryKey({ columns: [t.studentId, t.classId] })
]);

export type Certificate = typeof certificatesTable.$inferSelect;
