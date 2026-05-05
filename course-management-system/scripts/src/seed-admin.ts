import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";

const hash = bcrypt.hashSync("admin123", 10);
await db.insert(usersTable)
  .values({ username: "admin", passwordHash: hash, displayName: "Quản trị viên", role: "admin" })
  .onConflictDoUpdate({ target: usersTable.username, set: { passwordHash: hash, displayName: "Quản trị viên", role: "admin" } });
console.log("✓ admin user inserted/updated");
process.exit(0);
