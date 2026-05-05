import { Router } from "express";
import { db } from "@workspace/db";
import { classesTable, coursesTable, studentsTable, instructorsTable, approvalHistoryTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const classBodySchema = z.object({
  name: z.string().min(1),
  courseId: z.number().int(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

const bulkUpdateStudentsSchema = z.object({
  students: z.array(z.object({
    studentId: z.number().int(),
    testScore: z.string().optional().nullable(),
    grade: z.string().optional().nullable(),
    instructorId: z.number().int().optional().nullable(),
  })),
});

async function buildClassWithDetails(c: typeof classesTable.$inferSelect) {
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, c.courseId));
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(studentsTable)
    .where(eq(studentsTable.classId, c.id));
  return {
    ...c,
    courseName: course?.name ?? "",
    studentCount: count,
    approvedAt: c.approvedAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/", async (req, res) => {
  const { search, courseId, onlyApproved } = req.query;
  let rows = await db.select().from(classesTable).orderBy(classesTable.createdAt);
  if (onlyApproved === "true") rows = rows.filter((r) => r.approvalStatus === "APPROVED");
  if (courseId) rows = rows.filter((r) => r.courseId === Number(courseId));
  if (search && typeof search === "string") {
    const q = search.toLowerCase();
    rows = rows.filter((r) => r.name.toLowerCase().includes(q));
  }
  const result = await Promise.all(rows.map(buildClassWithDetails));
  res.json(result);
});

router.post("/", async (req, res) => {
  const body = classBodySchema.parse(req.body);
  const [cls] = await db.insert(classesTable).values(body).returning();
  res.status(201).json(await buildClassWithDetails(cls));
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, id));
  if (!cls) return res.status(404).json({ error: "Not found" });
  res.json(await buildClassWithDetails(cls));
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const body = classBodySchema.parse(req.body);
  const [before] = await db.select({ s: classesTable.approvalStatus }).from(classesTable).where(eq(classesTable.id, id));
  const [cls] = await db.update(classesTable).set({ ...body, approvalStatus: "PENDING", approvalNote: null, approvedAt: null }).where(eq(classesTable.id, id)).returning();
  if (!cls) return res.status(404).json({ error: "Not found" });
  if (before && before.s !== "PENDING") {
    await db.insert(approvalHistoryTable).values({ entityType: "class", entityId: id, action: "RESUBMIT", status: "PENDING", note: "Đã chỉnh sửa và gửi lại yêu cầu duyệt" });
  }
  res.json(await buildClassWithDetails(cls));
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(classesTable).where(eq(classesTable.id, id));
  res.status(204).send();
});

router.get("/:classId/students", async (req, res) => {
  const classId = Number(req.params.classId);
  const students = await db.select().from(studentsTable).where(eq(studentsTable.classId, classId));
  const result = await Promise.all(students.map(async (s) => {
    const [instructor] = s.instructorId
      ? await db.select().from(instructorsTable).where(eq(instructorsTable.id, s.instructorId))
      : [];
    return {
      studentId: s.id,
      studentCode: s.studentCode,
      fullName: s.fullName,
      photoUrl: s.photoUrl ?? null,
      testScore: s.testScore ?? null,
      grade: s.grade ?? null,
      instructorId: s.instructorId ?? null,
      supervisorName: instructor?.fullName ?? null,
      resultApprovalStatus: s.resultApprovalStatus ?? null,
    };
  }));
  res.json(result);
});

router.put("/:classId/students", async (req, res) => {
  const body = bulkUpdateStudentsSchema.parse(req.body);
  await Promise.all(body.students.map(async (item) => {
    const hasResult = (item.testScore && item.testScore !== "") || (item.grade && item.grade !== "");
    await db
      .update(studentsTable)
      .set({
        testScore: item.testScore,
        grade: item.grade,
        instructorId: item.instructorId,
        resultApprovalStatus: hasResult ? "PENDING" : null,
        resultApprovalNote: null,
        resultApprovedAt: null,
      })
      .where(eq(studentsTable.id, item.studentId));
  }));
  res.json({ success: true });
});

export default router;
