import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();
router.use(requireAuth);

const loadOwnedValeur = asyncHandler(async (req, res, next) => {
  const valeur = await prisma.valeur.findFirst({
    where: { id: req.params.id, ligne: { parcelle: { station: { ownerId: req.userId } } } },
  });
  if (!valeur) return res.status(404).json({ error: "Valeur introuvable" });
  req.valeur = valeur;
  next();
});

// Edit a value from the table view
router.put(
  "/:id",
  loadOwnedValeur,
  asyncHandler(async (req, res) => {
    const num = Number(req.body.valeur);
    if (Number.isNaN(num)) return res.status(400).json({ error: "Valeur numérique requise" });
    const valeur = await prisma.valeur.update({ where: { id: req.valeur.id }, data: { valeur: num } });
    res.json({ valeur });
  })
);

// Delete a single value from the table view
router.delete(
  "/:id",
  loadOwnedValeur,
  asyncHandler(async (req, res) => {
    await prisma.valeur.delete({ where: { id: req.valeur.id } });
    res.json({ ok: true });
  })
);

export default router;
