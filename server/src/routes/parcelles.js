import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();
router.use(requireAuth);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const loadOwnedParcelle = asyncHandler(async (req, res, next) => {
  const parcelle = await prisma.parcelle.findFirst({
    where: { id: req.params.id, station: { ownerId: req.userId } },
    include: { station: true },
  });
  if (!parcelle) return res.status(404).json({ error: "Parcelle introuvable" });
  req.parcelle = parcelle;
  next();
});

router.get(
  "/:id",
  loadOwnedParcelle,
  asyncHandler(async (req, res) => {
    const { date } = req.query;
    if (date && date !== "none" && !DATE_RE.test(date)) {
      return res.status(400).json({ error: "Date invalide (attendu AAAA-MM-JJ)" });
    }
    const dateFilter = date === "none" ? { date: null } : date ? { date } : {};
    const lignes = await prisma.ligne.findMany({
      where: { parcelleId: req.parcelle.id, ...dateFilter },
      include: { valeurs: { orderBy: { ordre: "asc" } } },
      orderBy: { numero: "asc" },
    });
    res.json({ parcelle: req.parcelle, lignes });
  })
);

// History: one entry per day this parcelle has been worked on, plus a
// legacy "sans date" bucket for lignes created before per-day tracking.
router.get(
  "/:id/jours",
  loadOwnedParcelle,
  asyncHandler(async (req, res) => {
    const lignes = await prisma.ligne.findMany({
      where: { parcelleId: req.parcelle.id },
      include: { valeurs: true },
    });
    const map = new Map();
    for (const l of lignes) {
      const key = l.date || null;
      if (!map.has(key)) map.set(key, { date: key, ligneCount: 0, valeurCount: 0, hasActive: false });
      const entry = map.get(key);
      entry.ligneCount += 1;
      entry.valeurCount += l.valeurs.length;
      if (l.status === "en_cours") entry.hasActive = true;
    }
    const jours = [...map.values()].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    res.json({ jours });
  })
);

router.put(
  "/:id",
  loadOwnedParcelle,
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    const parcelle = await prisma.parcelle.update({ where: { id: req.parcelle.id }, data: { name } });
    res.json({ parcelle });
  })
);

router.delete(
  "/:id",
  loadOwnedParcelle,
  asyncHandler(async (req, res) => {
    await prisma.parcelle.delete({ where: { id: req.parcelle.id } });
    res.json({ ok: true });
  })
);

// Start a new ligne: auto-numbered (max existing numero + 1), scoped to the
// given day — each day's numbering restarts independently from 1.
router.post(
  "/:id/lignes",
  loadOwnedParcelle,
  asyncHandler(async (req, res) => {
    const { date } = req.body;
    if (!date || !DATE_RE.test(date)) {
      return res.status(400).json({ error: "Date invalide (attendu AAAA-MM-JJ)" });
    }
    const last = await prisma.ligne.findFirst({
      where: { parcelleId: req.parcelle.id, date },
      orderBy: { numero: "desc" },
    });
    const numero = last ? last.numero + 1 : 1;
    const ligne = await prisma.ligne.create({ data: { numero, parcelleId: req.parcelle.id, date } });
    res.json({ ligne: { ...ligne, valeurs: [] } });
  })
);

export default router;
