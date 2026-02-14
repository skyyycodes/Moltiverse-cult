import { Router, Request, Response } from "express";
import { stateStore } from "../server.js";

export const prophecyRoutes = Router();

// GET /api/prophecies - All prophecies, newest first
prophecyRoutes.get("/", (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const sorted = [...stateStore.prophecies]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
  res.json(sorted);
});

// GET /api/prophecies/active - Unresolved prophecies
prophecyRoutes.get("/active", (_req: Request, res: Response) => {
  const active = stateStore.prophecies
    .filter((p) => !p.resolved)
    .sort((a, b) => b.createdAt - a.createdAt);
  res.json(active);
});

// GET /api/prophecies/resolved - Resolved prophecies
prophecyRoutes.get("/resolved", (_req: Request, res: Response) => {
  const resolved = stateStore.prophecies
    .filter((p) => p.resolved)
    .sort((a, b) => (b.resolvedAt || 0) - (a.resolvedAt || 0));
  res.json(resolved);
});

// GET /api/prophecies/:id
prophecyRoutes.get("/:id", (req: Request, res: Response) => {
  const prophecy = stateStore.prophecies.find((p) => p.id === req.params.id);
  if (!prophecy) {
    res.status(404).json({ error: "Prophecy not found" });
    return;
  }
  res.json(prophecy);
});
