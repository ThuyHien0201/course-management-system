import { Router } from "express";
import { db } from "@workspace/db";
import { companyInfoTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../lib/auth.js";
import type { Request, Response, NextFunction } from "express";

const router = Router();

async function getOrCreate() {
  const [existing] = await db.select().from(companyInfoTable).where(eq(companyInfoTable.id, 1));
  if (existing) return existing;
  const [created] = await db.insert(companyInfoTable).values({ id: 1 } as never).returning();
  return created;
}

router.get("/", async (_req, res) => {
  const info = await getOrCreate();
  res.json(info);
});

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  if (req.user.role !== "admin") return res.status(403).json({ error: "Chỉ admin mới có quyền chỉnh sửa thông tin doanh nghiệp" });
  next();
}

router.put("/", authMiddleware, requireAdmin, async (req, res) => {
  const { companyName, slogan, description, address, contact, email, website, taxId, logoUrl, qualityLogoUrl } = req.body;
  await getOrCreate();
  const [updated] = await db
    .update(companyInfoTable)
    .set({ companyName: companyName ?? "", slogan: slogan ?? "", description: description ?? "", address: address ?? "", contact: contact ?? "", email: email ?? "", website: website ?? "", taxId: taxId ?? "", logoUrl: logoUrl ?? "", qualityLogoUrl: qualityLogoUrl ?? "", updatedAt: new Date() })
    .where(eq(companyInfoTable.id, 1))
    .returning();
  res.json(updated);
});

export default router;
