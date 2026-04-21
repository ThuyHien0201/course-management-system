import { Router, type IRouter } from "express";
import healthRouter from "./health";
import coursesRouter from "./courses";
import classesRouter from "./classes";
import sessionsRouter from "./sessions";
import studentsRouter from "./students";
import instructorsRouter from "./instructors";
import certificatesRouter from "./certificates";
import dashboardRouter from "./dashboard";
import storageRouter from "./storage";
import qcRouter from "./qc";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/courses", coursesRouter);
router.use("/classes", classesRouter);
router.use("/classes/:classId/sessions", sessionsRouter);
router.use("/students", studentsRouter);
router.use("/instructors", instructorsRouter);
router.use("/certificates", certificatesRouter);
router.use("/dashboard", dashboardRouter);
router.use(storageRouter);
router.use("/qc", qcRouter);

export default router;
