import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import stationsRoutes from "./routes/stations.js";
import parcellesRoutes from "./routes/parcelles.js";
import lignesRoutes from "./routes/lignes.js";
import valeursRoutes from "./routes/valeurs.js";

const app = express();
app.use(cors());
app.use(express.json());

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
