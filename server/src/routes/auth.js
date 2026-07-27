import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../db.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Slows down credential stuffing / brute-force guessing against login and
// registration without needing per-user account lockout state.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

function publicUser(user) {
  return { id: user.id, email: user.email, name: user.name };
}

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : email;
}

router.post(
  "/register",
  authLimiter,
  asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const { password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Nom, email et mot de passe requis" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères" });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "Cet email est déjà utilisé" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, name, passwordHash } });
    res.json({ token: signToken(user.id), user: publicUser(user) });
  })
);

router.post(
  "/login",
  authLimiter,
  asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Email ou mot de passe incorrect" });

    res.json({ token: signToken(user.id), user: publicUser(user) });
  })
);

router.post(
  "/google",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: "idToken requis" });

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ error: "Jeton Google invalide" });
    }

    if (!payload.email_verified) {
      return res.status(401).json({ error: "Email Google non vérifié" });
    }

    const { sub: googleId, name } = payload;
    const email = normalizeEmail(payload.email);
    let user = await prisma.user.findFirst({ where: { googleId } });
    if (!user) {
      user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        user = await prisma.user.update({ where: { id: user.id }, data: { googleId } });
      } else {
        user = await prisma.user.create({
          data: { email, name: name || email, googleId },
        });
      }
    }
    res.json({ token: signToken(user.id), user: publicUser(user) });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
    res.json({ user: publicUser(user) });
  })
);

export default router;
