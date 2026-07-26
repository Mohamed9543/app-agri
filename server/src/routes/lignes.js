import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();
router.use(requireAuth);

const loadOwnedLigne = asyncHandler(async (req, res, next) => {
  const ligne = await prisma.ligne.findFirst({
    where: { id: req.params.id, parcelle: { station: { ownerId: req.userId } } },
    include: { valeurs: { orderBy: { ordre: "asc" } } },
  });
  if (!ligne) return res.status(404).json({ error: "Ligne introuvable" });
  req.ligne = ligne;
  next();
});

// Stop: mark the ligne as finished (terminée)
router.post(
  "/:id/stop",
  loadOwnedLigne,
  asyncHandler(async (req, res) => {
    const ligne = await prisma.ligne.update({
      where: { id: req.ligne.id },
      data: { status: "terminee" },
      include: { valeurs: { orderBy: { ordre: "asc" } } },
    });
    res.json({ ligne });
  })
);

// Cancel: discard the whole in-progress ligne
router.delete(
  "/:id",
  loadOwnedLigne,
  asyncHandler(async (req, res) => {
    await prisma.ligne.delete({ where: { id: req.ligne.id } });
    res.json({ ok: true });
  })
);

// Add a numeric value to the ligne (suivant)
router.post(
  "/:id/valeurs",
  loadOwnedLigne,
  asyncHandler(async (req, res) => {
    const { valeur } = req.body;
    const num = Number(valeur);
    if (valeur === undefined || valeur === null || valeur === "" || Number.isNaN(num)) {
      return res.status(400).json({ error: "Valeur numérique requise" });
    }
    const ordre = req.ligne.valeurs.length
      ? Math.max(...req.ligne.valeurs.map((v) => v.ordre)) + 1
      : 1;
    const created = await prisma.valeur.create({ data: { valeur: num, ordre, ligneId: req.ligne.id } });
    res.json({ valeur: created });
  })
);

// Retour: remove the last entered value of this ligne
router.post(
  "/:id/retour",
  loadOwnedLigne,
  asyncHandler(async (req, res) => {
    if (req.ligne.valeurs.length === 0) return res.status(400).json({ error: "Aucune valeur à retirer" });
    const last = req.ligne.valeurs[req.ligne.valeurs.length - 1];
    await prisma.valeur.delete({ where: { id: last.id } });
    res.json({ ok: true, removed: last.id });
  })
);

export default router;
