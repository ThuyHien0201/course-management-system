import { Router } from "express";
import { db } from "@workspace/db";
import { coursesTable, classesTable, studentsTable, instructorsTable, certificatesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/summary", async (req, res) => {
  const [{ count: totalCourses }] = await db.select({ count: sql<number>`count(*)::int` }).from(coursesTable);
  const [{ count: totalClasses }] = await db.select({ count: sql<number>`count(*)::int` }).from(classesTable);
  const [{ count: totalStudents }] = await db.select({ count: sql<number>`count(*)::int` }).from(studentsTable);
  const [{ count: totalInstructors }] = await db.select({ count: sql<number>`count(*)::int` }).from(instructorsTable);

  const recentClassRows = await db.select().from(classesTable).orderBy(classesTable.createdAt).limit(5);
  const recentClasses = await Promise.all(recentClassRows.map(async (c) => {
    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, c.courseId));
    const [{ count: studentCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(studentsTable)
      .where(eq(studentsTable.classId, c.id));
    return {
      ...c,
      courseName: course?.name ?? "",
      studentCount,
      createdAt: c.createdAt.toISOString(),
    };
  }));

  res.json({
    totalCourses,
    totalClasses,
    totalStudents,
    totalInstructors,
    recentClasses,
  });
});

export default router;
