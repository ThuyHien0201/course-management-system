import { pgTable, text, timestamp, integer, primaryKey } from "drizzle-orm/pg-core";
import { classesTable } from "./classes";
import { studentsTable } from "./students";

export const certificatesTable = pgTable("certificates", {
  studentId: integer("student_id").references(() => studentsTable.id).notNull(),
  classId: integer("class_id").references(() => classesTable.id).notNull(),
  decisionNumber: text("decision_number"),
  supervisor: text("supervisor"),
  printLocation: text("print_location"),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
}, (t) => [
  primaryKey({ columns: [t.studentId, t.classId] })
]);

export type Certificate = typeof certificatesTable.$inferSelect;
