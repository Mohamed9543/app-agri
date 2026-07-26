import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();
router.use(requireAuth);

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
    const lignes = await prisma.ligne.findMany({
      where: { parcelleId: req.parcelle.id },
      include: { valeurs: { orderBy: { ordre: "asc" } } },
      orderBy: { numero: "asc" },
    });
    res.json({ parcelle: req.parcelle, lignes });
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

// Start a new ligne: auto-numbered (max existing numero + 1)
router.post(
  "/:id/lignes",
  loadOwnedParcelle,
  asyncHandler(async (req, res) => {
    const last = await prisma.ligne.findFirst({
      where: { parcelleId: req.parcelle.id },
      orderBy: { numero: "desc" },
    });
    const numero = last ? last.numero + 1 : 1;
    const ligne = await prisma.ligne.create({ data: { numero, parcelleId: req.parcelle.id } });
    res.json({ ligne: { ...ligne, valeurs: [] } });
  })
);

export default router;
