import { Router } from "express";
import { db } from "@workspace/db";
import { studentsTable, instructorsTable, classesTable, approvalHistoryTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const studentBodySchema = z.object({
  studentCode: z.string().min(1),
  fullName: z.string().min(1),
  dateOfBirth: z.string().optional().nullable(),
  idNumber: z.string().optional().nullable(),
  idIssueDate: z.string().optional().nullable(),
  idIssuePlace: z.string().optional().nullable(),
  workplace: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  instructorId: z.number().int().optional().nullable(),
  classId: z.number().int().optional().nullable(),
});

async function enrichStudent(s: typeof studentsTable.$inferSelect) {
  const [instructor] = s.instructorId
    ? await db.select().from(instructorsTable).where(eq(instructorsTable.id, s.instructorId))
    : [];
  const [cls] = s.classId
    ? await db.select().from(classesTable).where(eq(classesTable.id, s.classId))
    : [];
  return {
    ...s,
    instructorName: instructor?.fullName ?? null,
    className: cls?.name ?? null,
    approvedAt: s.approvedAt?.toISOString() ?? null,
    resultApprovedAt: s.resultApprovedAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
  };
}

router.get("/", async (req, res) => {
  const { search, classId, onlyApproved } = req.query;
  let rows = await db.select().from(studentsTable).orderBy(studentsTable.createdAt);
  if (onlyApproved === "true") rows = rows.filter((r) => r.approvalStatus === "APPROVED");
  if (classId) rows = rows.filter((r) => r.classId === Number(classId));
  if (search && typeof search === "string") {
    const q = search.toLowerCase();
    rows = rows.filter((r) => r.fullName.toLowerCase().includes(q) || r.studentCode.toLowerCase().includes(q));
  }
  const result = await Promise.all(rows.map(enrichStudent));
  res.json(result);
});

router.post("/", async (req, res) => {
  const body = studentBodySchema.parse(req.body);
  const [student] = await db.insert(studentsTable).values(body).returning();
  res.status(201).json(await enrichStudent(student));
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, id));
  if (!student) return res.status(404).json({ error: "Not found" });
  res.json(await enrichStudent(student));
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const body = studentBodySchema.parse(req.body);
  const [before] = await db.select({ s: studentsTable.approvalStatus }).from(studentsTable).where(eq(studentsTable.id, id));
  const [student] = await db.update(studentsTable).set({ ...body, approvalStatus: "PENDING", approvalNote: null, approvedAt: null }).where(eq(studentsTable.id, id)).returning();
  if (!student) return res.status(404).json({ error: "Not found" });
  if (before && before.s !== "PENDING") {
    await db.insert(approvalHistoryTable).values({ entityType: "student", entityId: id, action: "RESUBMIT", status: "PENDING", note: "Đã chỉnh sửa và gửi lại yêu cầu duyệt" });
  }
  res.json(await enrichStudent(student));
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(studentsTable).where(eq(studentsTable.id, id));
  res.status(204).send();
});

export default router;
