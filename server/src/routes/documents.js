import multer from "multer";
import path from "path";
import { Router } from "express";
import prisma from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();
router.use(authenticate);

router.post("/", upload.array("files", 6), async (req, res, next) => {
  try {
    if (!req.files?.length) return res.status(400).json({ error: "No files uploaded" });
    const { applicationId } = req.body;

    if (applicationId) {
      const app = await prisma.application.findUnique({ where: { id: applicationId } });
      if (!app) return res.status(404).json({ error: "Application not found" });
      const canView =
        app.applicantId === req.user.id ||
        app.assignedToId === req.user.id ||
        req.user.role === "ADMIN";
      if (!canView) return res.status(403).json({ error: "Forbidden" });
    }

    const docs = await prisma.$transaction(
      req.files.map((f) =>
        prisma.document.create({
          data: {
            applicationId: applicationId || null,
            uploaderId: req.user.id,
            fileName: f.originalname,
            storedName: f.filename,
            mimeType: f.mimetype,
            size: f.size,
          },
        }),
      ),
    );
    res.status(201).json(docs);
  } catch (err) {
    next(err);
  }
});

router.get("/application/:applicationId", async (req, res, next) => {
  try {
    const app = await prisma.application.findUnique({ where: { id: req.params.applicationId } });
    if (!app) return res.status(404).json({ error: "Not found" });
    const canView =
      app.applicantId === req.user.id ||
      app.assignedToId === req.user.id ||
      req.user.role === "ADMIN";
    if (!canView) return res.status(403).json({ error: "Forbidden" });

    const docs = await prisma.document.findMany({
      where: { applicationId: req.params.applicationId },
    });
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

router.get("/:id/download", async (req, res, next) => {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: { application: { select: { applicantId: true, assignedToId: true } } },
    });
    if (!doc) return res.status(404).json({ error: "Not found" });
    const hasAccess =
      req.user.role === "ADMIN" ||
      doc.uploaderId === req.user.id ||
      doc.application?.applicantId === req.user.id ||
      doc.application?.assignedToId === req.user.id;
    if (!hasAccess) return res.status(403).json({ error: "Forbidden" });

    res.download(path.resolve("uploads", doc.storedName), doc.fileName);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const doc = await prisma.document.findFirstOrThrow({ where: { id: req.params.id } });
    if (doc.uploaderId !== req.user.id && req.user.role !== "ADMIN")
      return res.status(403).json({ error: "Forbidden" });
    await prisma.document.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;