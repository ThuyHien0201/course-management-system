import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, authMiddleware } from "../lib/auth.js";

const router = Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user) {
    return res.status(401).json({ error: "Tên đăng nhập hoặc mật khẩu không đúng" });
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Tên đăng nhập hoặc mật khẩu không đúng" });
  }
  const token = signToken({
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role as "staff" | "issuer" | "qc",
  });
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    },
  });
});

router.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

router.post("/logout", (_req, res) => {
  res.json({ success: true });
});

export default router;
