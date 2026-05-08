import { Router } from "express";
import { db } from "@workspace/db";
import { sessionsTable, instructorsTable, approvalHistoryTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const router = Router({ mergeParams: true });

const sessionBodySchema = z.object({
  title: z.string().optional().nullable(),
  sessionDate: z.string().min(1),
  sessionPeriod: z.string().min(1),
  lessonCount: z.number().int(),
  content: z.string().min(1),
  instructorId: z.number().int().optional().nullable(),
  mediaUrls: z.array(z.string()).optional(),
});

async function enrichSession(s: typeof sessionsTable.$inferSelect) {
  const [instructor] = s.instructorId
    ? await db.select().from(instructorsTable).where(eq(instructorsTable.id, s.instructorId))
    : [];
  return {
    ...s,
    title: s.title ?? null,
    instructorName: instructor?.fullName ?? null,
    mediaUrls: (s.mediaUrls as string[]) ?? [],
    approvedAt: s.approvedAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
  };
}

router.get("/", async (req, res) => {
  const classId = Number(req.params.classId);
  const rows = await db.select().from(sessionsTable).where(eq(sessionsTable.classId, classId)).orderBy(sessionsTable.sessionDate);
  const result = await Promise.all(rows.map(enrichSession));
  res.json(result);
});

router.post("/", async (req, res) => {
  const classId = Number(req.params.classId);
  const body = sessionBodySchema.parse(req.body);
  const [session] = await db.insert(sessionsTable).values({ ...body, classId }).returning();
  res.status(201).json(await enrichSession(session));
});

router.put("/:sessionId", async (req, res) => {
  const classId = Number(req.params.classId);
  const sessionId = Number(req.params.sessionId);
  const body = sessionBodySchema.parse(req.body);
  const [before] = await db.select({ s: sessionsTable.approvalStatus }).from(sessionsTable).where(eq(sessionsTable.id, sessionId));
  const [session] = await db
    .update(sessionsTable)
    .set({ ...body, approvalStatus: "PENDING", approvalNote: null, approvedAt: null })
    .where(and(eq(sessionsTable.id, sessionId), eq(sessionsTable.classId, classId)))
    .returning();
  if (!session) return res.status(404).json({ error: "Not found" });
  if (before && before.s !== "PENDING") {
    await db.insert(approvalHistoryTable).values({ entityType: "session", entityId: sessionId, action: "RESUBMIT", status: "PENDING", note: "Đã chỉnh sửa và gửi lại yêu cầu duyệt" });
  }
  res.json(await enrichSession(session));
});

router.delete("/:sessionId", async (req, res) => {
  const classId = Number(req.params.classId);
  const sessionId = Number(req.params.sessionId);
  await db.delete(sessionsTable).where(and(eq(sessionsTable.id, sessionId), eq(sessionsTable.classId, classId)));
  res.status(204).send();
});

export default router;
