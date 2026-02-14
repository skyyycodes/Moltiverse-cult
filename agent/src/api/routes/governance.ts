import { Router, Request, Response } from "express";
import { stateStore } from "../server.js";

export const governanceRoutes = Router();

// GET /api/governance/proposals - All proposals
governanceRoutes.get("/proposals", (_req: Request, res: Response) => {
    res.json(stateStore.proposals || []);
});

// GET /api/governance/proposals/:cultId - Proposals for a specific cult
governanceRoutes.get(
    "/proposals/:cultId",
    (req: Request, res: Response) => {
        const cultId = parseInt(req.params.cultId as string);
        const proposals = (stateStore.proposals || []).filter(
            (p: any) => p.cultId === cultId,
        );
        res.json(proposals);
    },
);

// GET /api/governance/budgets - All current budgets
governanceRoutes.get("/budgets", (_req: Request, res: Response) => {
    res.json(stateStore.budgets || {});
});

// GET /api/governance/budgets/:cultId - Budget for a specific cult
governanceRoutes.get(
    "/budgets/:cultId",
    (req: Request, res: Response) => {
        const cultId = parseInt(req.params.cultId as string);
        const budgets = stateStore.budgets || {};
        res.json(budgets[cultId] || null);
    },
);
