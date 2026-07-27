import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.js";
import stationsRoutes from "./routes/stations.js";
import parcellesRoutes from "./routes/parcelles.js";
import lignesRoutes from "./routes/lignes.js";
import valeursRoutes from "./routes/valeurs.js";

const app = express();
// Render (and most PaaS hosts) sit behind a reverse proxy that sets
// X-Forwarded-For. Without this, express-rate-limit's default key
// generator refuses to trust that header and throws on every request,
// producing a 500 on any rate-limited route (e.g. /auth/register) — only
// reproducible behind the real proxy, never in local dev.
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "100kb" }));

app.use("/api/auth", authRoutes);
app.use("/api/stations", stationsRoutes);
app.use("/api/parcelles", parcellesRoutes);
app.use("/api/lignes", lignesRoutes);
app.use("/api/valeurs", valeursRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Erreur serveur" });
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
