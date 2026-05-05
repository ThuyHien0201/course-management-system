import { Router } from "express";
import { db } from "@workspace/db";
import { instructorsTable, approvalHistoryTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const instructorBodySchema = z.object({
  fullName: z.string().min(1),
  academicTitle: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  specialization: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

router.get("/", async (req, res) => {
  const { search, onlyApproved } = req.query;
  let rows = await db.select().from(instructorsTable).orderBy(instructorsTable.createdAt);
  if (onlyApproved === "true") rows = rows.filter((r) => r.approvalStatus === "APPROVED");
  if (search && typeof search === "string") {
    const q = search.toLowerCase();
    rows = rows.filter((r) => r.fullName.toLowerCase().includes(q));
  }
  res.json(rows.map((r) => ({ ...r, approvedAt: r.approvedAt?.toISOString() ?? null, createdAt: r.createdAt.toISOString() })));
});

router.post("/", async (req, res) => {
  const body = instructorBodySchema.parse(req.body);
  const [instructor] = await db.insert(instructorsTable).values(body).returning();
  res.status(201).json({ ...instructor, approvedAt: instructor.approvedAt?.toISOString() ?? null, createdAt: instructor.createdAt.toISOString() });
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [instructor] = await db.select().from(instructorsTable).where(eq(instructorsTable.id, id));
  if (!instructor) return res.status(404).json({ error: "Not found" });
  res.json({ ...instructor, approvedAt: instructor.approvedAt?.toISOString() ?? null, createdAt: instructor.createdAt.toISOString() });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const body = instructorBodySchema.parse(req.body);
  const [before] = await db.select({ s: instructorsTable.approvalStatus }).from(instructorsTable).where(eq(instructorsTable.id, id));
  const [instructor] = await db.update(instructorsTable).set({ ...body, approvalStatus: "PENDING", approvalNote: null, approvedAt: null }).where(eq(instructorsTable.id, id)).returning();
  if (!instructor) return res.status(404).json({ error: "Not found" });
  if (before && before.s !== "PENDING") {
    await db.insert(approvalHistoryTable).values({ entityType: "instructor", entityId: id, action: "RESUBMIT", status: "PENDING", note: "Đã chỉnh sửa và gửi lại yêu cầu duyệt" });
  }
  res.json({ ...instructor, approvedAt: instructor.approvedAt?.toISOString() ?? null, createdAt: instructor.createdAt.toISOString() });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(instructorsTable).where(eq(instructorsTable.id, id));
  res.status(204).send();
});

export default router;
