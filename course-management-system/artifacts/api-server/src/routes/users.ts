import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../lib/auth.js";
import type { Request, Response, NextFunction } from "express";

const router = Router();

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  if (req.user.role !== "admin") return res.status(403).json({ error: "Chỉ admin mới có quyền quản lý tài khoản" });
  next();
}

router.use(authMiddleware, requireAdmin);

router.get("/", async (_req, res) => {
  const users = await db
    .select({ id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName, role: usersTable.role, createdAt: usersTable.createdAt })
    .from(usersTable)
    .orderBy(usersTable.createdAt);
  res.json(users);
});

router.post("/", async (req, res) => {
  const { username, password, displayName, role } = req.body;
  if (!username || !password || !displayName || !role) {
    return res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin" });
  }
  const VALID_ROLES = ["admin", "staff", "issuer", "qc"];
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: "Vai trò không hợp lệ" });
  }
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existing) {
    return res.status(409).json({ error: "Tên đăng nhập đã tồn tại" });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const [created] = await db
    .insert(usersTable)
    .values({ username, passwordHash, displayName, role })
    .returning({ id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName, role: usersTable.role, createdAt: usersTable.createdAt });
  res.status(201).json(created);
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { displayName, role, password } = req.body;
  if (!displayName || !role) {
    return res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin" });
  }
  const VALID_ROLES = ["admin", "staff", "issuer", "qc"];
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: "Vai trò không hợp lệ" });
  }
  const updates: Record<string, unknown> = { displayName, role };
  if (password && password.length >= 6) {
    updates.passwordHash = await bcrypt.hash(password, 10);
  }
  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, id))
    .returning({ id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName, role: usersTable.role, createdAt: usersTable.createdAt });
  if (!updated) return res.status(404).json({ error: "Không tìm thấy tài khoản" });
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (req.user?.userId === id) {
    return res.status(400).json({ error: "Không thể xóa tài khoản đang đăng nhập" });
  }
  const [deleted] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning({ id: usersTable.id });
  if (!deleted) return res.status(404).json({ error: "Không tìm thấy tài khoản" });
  res.json({ success: true });
});

export default router;
