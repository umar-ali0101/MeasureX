import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2)
      return res.status(400).json({ error: "Query too short" });
    const term = q.trim();

    const [instruments, applications, certificates] = await Promise.all([
      prisma.instrument.findMany({
        where: {
          OR: [{ serialNo: { contains: term } }, { name: { contains: term } }],
        },
        include: { owner: { select: { name: true, orgName: true } } },
        take: 10,
      }),
      prisma.application.findMany({
        where: { applicationNo: { contains: term } },
        include: {
          instrument: true,
          applicant: { select: { name: true, orgName: true } },
        },
        take: 5,
      }),
      prisma.certificate.findMany({
        where: { certificateNo: { contains: term } },
        include: {
          verification: {
            include: {
              instrument: true,
              officer: { select: { name: true } },
            },
          },
        },
        take: 5,
      }),
    ]);

    res.json({ instruments, applications, certificates });
  } catch (err) {
    next(err);
  }
});

export default router;