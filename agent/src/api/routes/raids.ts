import { Router, Request, Response } from "express";
import { stateStore } from "../server.js";

export const raidRoutes = Router();

// GET /api/raids - All raids, newest first
raidRoutes.get("/", (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const sorted = [...stateStore.raids]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
  res.json(sorted);
});

// GET /api/raids/recent - Last 10 raids
raidRoutes.get("/recent", (_req: Request, res: Response) => {
  const recent = [...stateStore.raids]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 10);
  res.json(recent);
});

// GET /api/raids/stats - Aggregate raid statistics
raidRoutes.get("/stats", (_req: Request, res: Response) => {
  const totalRaids = stateStore.raids.length;
  const totalAmount = stateStore.raids.reduce(
    (sum, r) => sum + parseFloat(r.amount || "0"),
    0,
  );
  const cultStats = new Map<number, { wins: number; losses: number }>();

  stateStore.raids.forEach((r) => {
    if (!cultStats.has(r.attackerId)) {
      cultStats.set(r.attackerId, { wins: 0, losses: 0 });
    }
    if (!cultStats.has(r.defenderId)) {
      cultStats.set(r.defenderId, { wins: 0, losses: 0 });
    }

    if (r.attackerWon) {
      cultStats.get(r.attackerId)!.wins++;
      cultStats.get(r.defenderId)!.losses++;
    } else {
      cultStats.get(r.attackerId)!.losses++;
      cultStats.get(r.defenderId)!.wins++;
    }
  });

  res.json({
    totalRaids,
    totalAmountWagered: totalAmount.toFixed(4),
    cultStats: Object.fromEntries(cultStats),
  });
});

// GET /api/raids/:id
raidRoutes.get("/:id", (req: Request, res: Response) => {
  const raid = stateStore.raids.find((r) => r.id === req.params.id);
  if (!raid) {
    res.status(404).json({ error: "Raid not found" });
    return;
  }
  res.json(raid);
});
