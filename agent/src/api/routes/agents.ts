import { Router, Request, Response } from "express";
import { stateStore } from "../server.js";

export const agentRoutes = Router();

// GET /api/agents - All agent statuses
agentRoutes.get("/", (_req: Request, res: Response) => {
  res.json(stateStore.agents);
});

// GET /api/agents/:cultId - Single agent status
agentRoutes.get("/:cultId", (req: Request, res: Response) => {
  const cultId = parseInt(req.params.cultId as string);
  const agent = stateStore.agents.find((a) => a.cultId === cultId);
  if (!agent) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }
  res.json(agent);
});

// POST /api/agents/deploy - Deploy a new cult agent (placeholder)
agentRoutes.post("/deploy", (req: Request, res: Response) => {
  const { name, prophecyPrompt } = req.body;
  if (!name || !prophecyPrompt) {
    res.status(400).json({ error: "name and prophecyPrompt required" });
    return;
  }

  // In MVP, this returns a placeholder since agents are pre-configured
  res.json({
    message: "Agent deployment queued",
    name,
    prophecyPrompt,
    status: "pending",
    note: "Custom agent deployment coming in v2. Currently running 3 pre-configured cults.",
  });
});
