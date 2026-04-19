import { Router } from "express";
import { db } from "@workspace/db";
import { certificatesTable, studentsTable, classesTable, coursesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const issueCertBodySchema = z.object({
  studentId: z.number().int(),
  decisionNumber: z.string().optional().nullable(),
  supervisor: z.string().optional().nullable(),
  printLocation: z.string().optional().nullable(),
});

const updateCertBodySchema = z.object({
  decisionNumber: z.string().optional().nullable(),
  supervisor: z.string().optional().nullable(),
  printLocation: z.string().optional().nullable(),
});

async function buildCertRecord(cert: typeof certificatesTable.$inferSelect) {
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, cert.studentId));
  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, cert.classId));
  return {
    studentId: cert.studentId,
    classId: cert.classId,
    studentCode: student?.studentCode ?? "",
    fullName: student?.fullName ?? "",
    className: cls?.name ?? "",
    decisionNumber: cert.decisionNumber,
    supervisor: cert.supervisor,
    printLocation: cert.printLocation,
    issuedAt: cert.issuedAt.toISOString(),
  };
}

router.get("/", async (req, res) => {
  const classes = await db.select().from(classesTable).orderBy(classesTable.createdAt);
  const result = await Promise.all(classes.map(async (c) => {
    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, c.courseId));
    const [{ count }] = await db
      .select({ count: db.$count(studentsTable, eq(studentsTable.classId, c.id)) })
      .from(studentsTable)
      .where(eq(studentsTable.classId, c.id));
    return {
      ...c,
      courseName: course?.name ?? "",
      studentCount: typeof count === "number" ? count : Number(count) || 0,
      createdAt: c.createdAt.toISOString(),
    };
  }));
  res.json(result);
});

router.get("/:classId", async (req, res) => {
  const classId = Number(req.params.classId);
  const certs = await db.select().from(certificatesTable).where(eq(certificatesTable.classId, classId));
  const result = await Promise.all(certs.map(buildCertRecord));
  res.json(result);
});

router.post("/:classId", async (req, res) => {
  const classId = Number(req.params.classId);
  const body = issueCertBodySchema.parse(req.body);
  const [cert] = await db
    .insert(certificatesTable)
    .values({ classId, ...body })
    .onConflictDoUpdate({
      target: [certificatesTable.studentId, certificatesTable.classId],
      set: { decisionNumber: body.decisionNumber, supervisor: body.supervisor, printLocation: body.printLocation },
    })
    .returning();
  res.status(201).json(await buildCertRecord(cert));
});

router.put("/:classId/:studentId", async (req, res) => {
  const classId = Number(req.params.classId);
  const studentId = Number(req.params.studentId);
  const body = updateCertBodySchema.parse(req.body);
  const [cert] = await db
    .update(certificatesTable)
    .set(body)
    .where(and(eq(certificatesTable.classId, classId), eq(certificatesTable.studentId, studentId)))
    .returning();
  if (!cert) return res.status(404).json({ error: "Not found" });
  res.json(await buildCertRecord(cert));
});

export default router;
