import { Router } from "express";
import { db } from "@workspace/db";
import { coursesTable, approvalHistoryTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const courseBodySchema = z.object({
  name: z.string().min(1),
  content: z.string().min(1),
  duration: z.string().min(1),
});

router.get("/", async (req, res) => {
  const { search, onlyApproved } = req.query;
  let courses = await db.select().from(coursesTable).orderBy(coursesTable.createdAt);
  if (onlyApproved === "true") courses = courses.filter((c) => c.approvalStatus === "APPROVED");
  if (search && typeof search === "string") {
    const q = search.toLowerCase();
    courses = courses.filter((c) => c.name.toLowerCase().includes(q));
  }
  res.json(courses.map((c) => ({ ...c, approvedAt: c.approvedAt?.toISOString() ?? null, createdAt: c.createdAt.toISOString() })));
});

router.post("/", async (req, res) => {
  const body = courseBodySchema.parse(req.body);
  const [course] = await db.insert(coursesTable).values(body).returning();
  res.status(201).json({ ...course, approvedAt: course.approvedAt?.toISOString() ?? null, createdAt: course.createdAt.toISOString() });
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, id));
  if (!course) return res.status(404).json({ error: "Not found" });
  res.json({ ...course, approvedAt: course.approvedAt?.toISOString() ?? null, createdAt: course.createdAt.toISOString() });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const body = courseBodySchema.parse(req.body);
  const [before] = await db.select({ s: coursesTable.approvalStatus }).from(coursesTable).where(eq(coursesTable.id, id));
  const [course] = await db.update(coursesTable).set({ ...body, approvalStatus: "PENDING", approvalNote: null, approvedAt: null }).where(eq(coursesTable.id, id)).returning();
  if (!course) return res.status(404).json({ error: "Not found" });
  if (before && before.s !== "PENDING") {
    await db.insert(approvalHistoryTable).values({ entityType: "course", entityId: id, action: "RESUBMIT", status: "PENDING", note: "Đã chỉnh sửa và gửi lại yêu cầu duyệt" });
  }
  res.json({ ...course, approvedAt: course.approvedAt?.toISOString() ?? null, createdAt: course.createdAt.toISOString() });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(coursesTable).where(eq(coursesTable.id, id));
  res.status(204).send();
});

export default router;
