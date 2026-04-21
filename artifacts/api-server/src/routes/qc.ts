import { Router } from "express";
import { db } from "@workspace/db";
import {
  approvalHistoryTable,
  coursesTable,
  classesTable,
  studentsTable,
  instructorsTable,
  sessionsTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const ENTITY_TYPES = ["course", "class", "student", "instructor", "session", "result"] as const;
type EntityType = (typeof ENTITY_TYPES)[number];

const actionBodySchema = z.object({
  entityType: z.enum(ENTITY_TYPES),
  entityId: z.number().int(),
  note: z.string().optional().nullable(),
});

function tableFor(entityType: EntityType) {
  switch (entityType) {
    case "course": return coursesTable;
    case "class": return classesTable;
    case "student": return studentsTable;
    case "instructor": return instructorsTable;
    case "session": return sessionsTable;
    case "result": return studentsTable;
  }
}

async function setStatus(entityType: EntityType, entityId: number, status: "APPROVED" | "REJECTED", note: string | null) {
  if (entityType === "result") {
    const [row] = await db
      .update(studentsTable)
      .set({
        resultApprovalStatus: status,
        resultApprovalNote: note,
        resultApprovedAt: new Date(),
      })
      .where(eq(studentsTable.id, entityId))
      .returning();
    return row;
  }
  const tbl = tableFor(entityType) as typeof coursesTable;
  const [row] = await db
    .update(tbl)
    .set({
      approvalStatus: status,
      approvalNote: note,
      approvedAt: new Date(),
    })
    .where(eq(tbl.id, entityId))
    .returning();
  return row;
}

async function logHistory(entityType: EntityType, entityId: number, action: string, status: string, note: string | null) {
  await db.insert(approvalHistoryTable).values({ entityType, entityId, action, status, note });
}

// List items pending/approved/rejected for a given entity type
router.get("/items", async (req, res) => {
  const entityType = req.query.entityType as EntityType;
  const status = (req.query.status as string) || "PENDING";
  if (!ENTITY_TYPES.includes(entityType)) {
    return res.status(400).json({ error: "Invalid entityType" });
  }

  if (entityType === "course") {
    const rows = await db.select().from(coursesTable).where(eq(coursesTable.approvalStatus, status)).orderBy(desc(coursesTable.createdAt));
    return res.json(rows.map((r) => ({
      id: r.id, title: r.name, subtitle: r.duration,
      detail: r.content, approvalStatus: r.approvalStatus, approvalNote: r.approvalNote ?? null,
      approvedAt: r.approvedAt?.toISOString() ?? null, createdAt: r.createdAt.toISOString(),
    })));
  }
  if (entityType === "class") {
    const rows = await db.select().from(classesTable).where(eq(classesTable.approvalStatus, status)).orderBy(desc(classesTable.createdAt));
    const enriched = await Promise.all(rows.map(async (r) => {
      const [c] = await db.select().from(coursesTable).where(eq(coursesTable.id, r.courseId));
      return {
        id: r.id, title: r.name, subtitle: c?.name ?? "",
        detail: `${r.startDate} - ${r.endDate}`, approvalStatus: r.approvalStatus, approvalNote: r.approvalNote ?? null,
        approvedAt: r.approvedAt?.toISOString() ?? null, createdAt: r.createdAt.toISOString(),
      };
    }));
    return res.json(enriched);
  }
  if (entityType === "student") {
    const rows = await db.select().from(studentsTable).where(eq(studentsTable.approvalStatus, status)).orderBy(desc(studentsTable.createdAt));
    return res.json(rows.map((r) => ({
      id: r.id, title: r.fullName, subtitle: r.studentCode,
      detail: r.dateOfBirth ?? "", approvalStatus: r.approvalStatus, approvalNote: r.approvalNote ?? null,
      approvedAt: r.approvedAt?.toISOString() ?? null, createdAt: r.createdAt.toISOString(),
    })));
  }
  if (entityType === "instructor") {
    const rows = await db.select().from(instructorsTable).where(eq(instructorsTable.approvalStatus, status)).orderBy(desc(instructorsTable.createdAt));
    return res.json(rows.map((r) => ({
      id: r.id, title: r.fullName, subtitle: r.academicTitle ?? "",
      detail: r.specialization ?? "", approvalStatus: r.approvalStatus, approvalNote: r.approvalNote ?? null,
      approvedAt: r.approvedAt?.toISOString() ?? null, createdAt: r.createdAt.toISOString(),
    })));
  }
  if (entityType === "session") {
    const rows = await db.select().from(sessionsTable).where(eq(sessionsTable.approvalStatus, status)).orderBy(desc(sessionsTable.createdAt));
    const enriched = await Promise.all(rows.map(async (r) => {
      const [c] = await db.select().from(classesTable).where(eq(classesTable.id, r.classId));
      return {
        id: r.id, title: `${r.sessionDate} - ${r.sessionPeriod}`, subtitle: c?.name ?? "",
        detail: r.content, approvalStatus: r.approvalStatus, approvalNote: r.approvalNote ?? null,
        approvedAt: r.approvedAt?.toISOString() ?? null, createdAt: r.createdAt.toISOString(),
      };
    }));
    return res.json(enriched);
  }
  // result: students with resultApprovalStatus = status
  const rows = await db.select().from(studentsTable).where(eq(studentsTable.resultApprovalStatus, status)).orderBy(desc(studentsTable.createdAt));
  const enriched = await Promise.all(rows.map(async (r) => {
    const [c] = r.classId ? await db.select().from(classesTable).where(eq(classesTable.id, r.classId)) : [];
    return {
      id: r.id, title: r.fullName, subtitle: c?.name ?? "",
      detail: `Điểm: ${r.testScore ?? "—"} • Xếp loại: ${r.grade ?? "—"}`,
      approvalStatus: r.resultApprovalStatus ?? "",
      approvalNote: r.resultApprovalNote ?? null,
      approvedAt: r.resultApprovedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    };
  }));
  return res.json(enriched);
});

router.get("/summary", async (_req, res) => {
  const [courses, classes, students, instructors, sessions] = await Promise.all([
    db.select({ s: coursesTable.approvalStatus }).from(coursesTable),
    db.select({ s: classesTable.approvalStatus }).from(classesTable),
    db.select({ s: studentsTable.approvalStatus, r: studentsTable.resultApprovalStatus }).from(studentsTable),
    db.select({ s: instructorsTable.approvalStatus }).from(instructorsTable),
    db.select({ s: sessionsTable.approvalStatus }).from(sessionsTable),
  ]);
  const tally = (rows: { s: string | null }[]) => {
    const out: Record<string, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
    rows.forEach((r) => { if (r.s && out[r.s] !== undefined) out[r.s]++; });
    return out;
  };
  return res.json({
    course: tally(courses),
    class: tally(classes),
    student: tally(students),
    instructor: tally(instructors),
    session: tally(sessions),
    result: tally(students.map((s) => ({ s: s.r }))),
  });
});

router.post("/approve", async (req, res) => {
  const { entityType, entityId, note } = actionBodySchema.parse(req.body);
  const row = await setStatus(entityType, entityId, "APPROVED", note ?? null);
  if (!row) return res.status(404).json({ error: "Not found" });
  await logHistory(entityType, entityId, "APPROVE", "APPROVED", note ?? null);
  res.json({ success: true });
});

router.post("/reject", async (req, res) => {
  const { entityType, entityId, note } = actionBodySchema.parse(req.body);
  const row = await setStatus(entityType, entityId, "REJECTED", note ?? null);
  if (!row) return res.status(404).json({ error: "Not found" });
  await logHistory(entityType, entityId, "REJECT", "REJECTED", note ?? null);
  res.json({ success: true });
});

router.get("/history", async (req, res) => {
  const { entityType, entityId } = req.query;
  let qb = db.select().from(approvalHistoryTable).$dynamic();
  if (entityType && entityId) {
    qb = qb.where(and(
      eq(approvalHistoryTable.entityType, String(entityType)),
      eq(approvalHistoryTable.entityId, Number(entityId)),
    ));
  } else if (entityType) {
    qb = qb.where(eq(approvalHistoryTable.entityType, String(entityType)));
  }
  const rows = await qb.orderBy(desc(approvalHistoryTable.createdAt)).limit(200);
  res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

export default router;
