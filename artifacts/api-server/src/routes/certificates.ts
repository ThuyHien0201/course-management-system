import { Router } from "express";
import { db } from "@workspace/db";
import { certificatesTable, studentsTable, classesTable, coursesTable, instructorsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const issueCertBodySchema = z.object({
  studentId: z.number().int(),
  issueDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  instructorId: z.number().int().optional().nullable(),
  printLocation: z.string().optional().nullable(),
  locationLink: z.string().optional().nullable(),
});

const updateCertBodySchema = z.object({
  issueDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  instructorId: z.number().int().optional().nullable(),
  printLocation: z.string().optional().nullable(),
  locationLink: z.string().optional().nullable(),
});

async function buildCertRecord(cert: typeof certificatesTable.$inferSelect) {
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, cert.studentId));
  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, cert.classId));
  const [instructor] = cert.instructorId
    ? await db.select().from(instructorsTable).where(eq(instructorsTable.id, cert.instructorId))
    : [];
  return {
    studentId: cert.studentId,
    classId: cert.classId,
    studentCode: student?.studentCode ?? "",
    fullName: student?.fullName ?? "",
    className: cls?.name ?? "",
    issueDate: cert.issueDate ?? null,
    expiryDate: cert.expiryDate ?? null,
    instructorId: cert.instructorId ?? null,
    instructorName: instructor?.fullName ?? null,
    printLocation: cert.printLocation ?? null,
    locationLink: cert.locationLink ?? null,
    issuedAt: cert.issuedAt.toISOString(),
  };
}

router.get("/", async (req, res) => {
  const classes = await db.select().from(classesTable).orderBy(classesTable.createdAt);
  const result = await Promise.all(classes.map(async (c) => {
    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, c.courseId));
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(studentsTable)
      .where(eq(studentsTable.classId, c.id));
    return {
      ...c,
      courseName: course?.name ?? "",
      studentCount: count ?? 0,
      createdAt: c.createdAt.toISOString(),
    };
  }));
  res.json(result);
});

router.get("/:classId/students", async (req, res) => {
  const classId = Number(req.params.classId);
  const { search, onlyApproved } = req.query;
  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, classId));
  if (!cls) return res.status(404).json({ error: "Not found" });
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, cls.courseId));
  let students = await db.select().from(studentsTable).where(eq(studentsTable.classId, classId));
  if (onlyApproved === "true") students = students.filter((s) => s.resultApprovalStatus === "APPROVED");
  if (search && typeof search === "string") {
    const q = search.toLowerCase();
    students = students.filter(s => s.fullName.toLowerCase().includes(q) || s.studentCode.toLowerCase().includes(q));
  }
  const result = await Promise.all(students.map(async (s) => {
    const [cert] = await db
      .select()
      .from(certificatesTable)
      .where(and(eq(certificatesTable.studentId, s.id), eq(certificatesTable.classId, classId)));
    return {
      studentId: s.id,
      studentCode: s.studentCode,
      fullName: s.fullName,
      dateOfBirth: s.dateOfBirth ?? null,
      courseName: course?.name ?? "",
      hasCertificate: !!cert,
      issueDate: cert?.issueDate ?? null,
      expiryDate: cert?.expiryDate ?? null,
      instructorId: cert?.instructorId ?? null,
      printLocation: cert?.printLocation ?? null,
      locationLink: cert?.locationLink ?? null,
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
      set: {
        issueDate: body.issueDate,
        expiryDate: body.expiryDate,
        instructorId: body.instructorId,
        printLocation: body.printLocation,
        locationLink: body.locationLink,
      },
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
