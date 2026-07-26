import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const stations = await prisma.station.findMany({
      where: { ownerId: req.userId },
      include: { _count: { select: { parcelles: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ stations });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: "Nom de station requis" });
    const station = await prisma.station.create({ data: { name: name.trim(), ownerId: req.userId } });
    res.json({ station });
  })
);

const loadOwnedStation = asyncHandler(async (req, res, next) => {
  const station = await prisma.station.findFirst({ where: { id: req.params.id, ownerId: req.userId } });
  if (!station) return res.status(404).json({ error: "Station introuvable" });
  req.station = station;
  next();
});

router.get(
  "/:id",
  loadOwnedStation,
  asyncHandler(async (req, res) => {
    const parcelles = await prisma.parcelle.findMany({
      where: { stationId: req.station.id },
      include: { _count: { select: { lignes: true } } },
      orderBy: { createdAt: "asc" },
    });
    res.json({ station: req.station, parcelles });
  })
);

router.put(
  "/:id",
  loadOwnedStation,
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    const station = await prisma.station.update({ where: { id: req.station.id }, data: { name } });
    res.json({ station });
  })
);

router.delete(
  "/:id",
  loadOwnedStation,
  asyncHandler(async (req, res) => {
    await prisma.station.delete({ where: { id: req.station.id } });
    res.json({ ok: true });
  })
);

// Create several parcelles at once from a list of names (nb + noms step)
router.post(
  "/:id/parcelles",
  loadOwnedStation,
  asyncHandler(async (req, res) => {
    const { names } = req.body;
    if (!Array.isArray(names) || names.length === 0) {
      return res.status(400).json({ error: "Au moins un nom de parcelle requis" });
    }
    const cleaned = names.map((n) => (n || "").trim()).filter(Boolean);
    if (cleaned.length === 0) return res.status(400).json({ error: "Noms de parcelles invalides" });

    const parcelles = await prisma.$transaction(
      cleaned.map((name) => prisma.parcelle.create({ data: { name, stationId: req.station.id } }))
    );
    res.json({ parcelles });
  })
);

export default router;
