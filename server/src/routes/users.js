import { Router } from "express";
import prisma from "../lib/prisma.js";
import { publicUser } from "../lib/auth.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.get("/", authorize("ADMIN"), async (req, res, next) => {
  try {
    const { role, status, q } = req.query;
    const users = await prisma.user.findMany({
      where: {
        ...(role ? { role } : {}),
        ...(status ? { status } : {}),
        ...(q
          ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    res.json(users.map(publicUser));
  } catch (err) {
    next(err);
  }
});

router.get("/available-assignees", async (req, res, next) => {
  try {
    if (!["ADMIN", "LMO", "GATC"].includes(req.user.role))
      return res.status(403).json({ error: "Forbidden" });
    const assignees = await prisma.user.findMany({
      where: { role: { in: ["LMO", "GATC"] }, status: "ACTIVE" },
      select: { id: true, name: true, role: true, state: true, district: true },
    });
    res.json({ assignees: assignees.filter((u) => u.id !== req.user.id || req.user.role === "ADMIN") });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/status", authorize("ADMIN"), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["ACTIVE", "SUSPENDED", "PENDING"].includes(status))
      return res.status(400).json({ error: "Invalid status" });
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

export default router;