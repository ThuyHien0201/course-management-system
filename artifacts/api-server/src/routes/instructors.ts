import { Router } from "express";
import { db } from "@workspace/db";
import { instructorsTable } from "@workspace/db";
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
  const { search } = req.query;
  let rows = await db.select().from(instructorsTable).orderBy(instructorsTable.createdAt);
  if (search && typeof search === "string") {
    const q = search.toLowerCase();
    rows = rows.filter((r) => r.fullName.toLowerCase().includes(q));
  }
  res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/", async (req, res) => {
  const body = instructorBodySchema.parse(req.body);
  const [instructor] = await db.insert(instructorsTable).values(body).returning();
  res.status(201).json({ ...instructor, createdAt: instructor.createdAt.toISOString() });
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [instructor] = await db.select().from(instructorsTable).where(eq(instructorsTable.id, id));
  if (!instructor) return res.status(404).json({ error: "Not found" });
  res.json({ ...instructor, createdAt: instructor.createdAt.toISOString() });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const body = instructorBodySchema.parse(req.body);
  const [instructor] = await db.update(instructorsTable).set(body).where(eq(instructorsTable.id, id)).returning();
  if (!instructor) return res.status(404).json({ error: "Not found" });
  res.json({ ...instructor, createdAt: instructor.createdAt.toISOString() });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(instructorsTable).where(eq(instructorsTable.id, id));
  res.status(204).send();
});

export default router;
