import { Router } from "express";
import { db } from "@workspace/db";
import { coursesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const courseBodySchema = z.object({
  name: z.string().min(1),
  content: z.string().min(1),
  duration: z.string().min(1),
});

router.get("/", async (req, res) => {
  const { search } = req.query;
  let courses = await db.select().from(coursesTable).orderBy(coursesTable.createdAt);
  if (search && typeof search === "string") {
    const q = search.toLowerCase();
    courses = courses.filter((c) => c.name.toLowerCase().includes(q));
  }
  res.json(courses.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })));
});

router.post("/", async (req, res) => {
  const body = courseBodySchema.parse(req.body);
  const [course] = await db.insert(coursesTable).values(body).returning();
  res.status(201).json({ ...course, createdAt: course.createdAt.toISOString() });
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, id));
  if (!course) return res.status(404).json({ error: "Not found" });
  res.json({ ...course, createdAt: course.createdAt.toISOString() });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const body = courseBodySchema.parse(req.body);
  const [course] = await db.update(coursesTable).set(body).where(eq(coursesTable.id, id)).returning();
  if (!course) return res.status(404).json({ error: "Not found" });
  res.json({ ...course, createdAt: course.createdAt.toISOString() });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(coursesTable).where(eq(coursesTable.id, id));
  res.status(204).send();
});

export default router;
