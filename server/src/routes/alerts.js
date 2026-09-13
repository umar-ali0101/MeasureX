import { Router } from "express";
import prisma from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    const { unread } = req.query;
    const alerts = await prisma.alert.findMany({
      where: {
        userId: req.user.id,
        ...(unread === "true" ? { isRead: false } : {}),
      },
      include: { instrument: { select: { id: true, name: true, serialNo: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json(alerts);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/read", async (req, res, next) => {
  try {
    const alert = await prisma.alert.findFirstOrThrow({
      where: { id: req.params.id, userId: req.user.id },
    });
    const updated = await prisma.alert.update({
      where: { id: alert.id },
      data: { isRead: true },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.patch("/read-all", async (req, res, next) => {
  try {
    const result = await prisma.alert.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.alert.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;