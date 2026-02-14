import { Router, Request, Response } from "express";

export function allianceRoutes(stateStore: any): Router {
    const router = Router();

    // GET /api/alliances — all alliances (active and expired)
    router.get("/", (_req: Request, res: Response) => {
        res.json(stateStore.alliances || []);
    });

    // GET /api/alliances/active — only active alliances
    router.get("/active", (_req: Request, res: Response) => {
        res.json(stateStore.activeAlliances || []);
    });

    // GET /api/alliances/betrayals — betrayal history
    router.get("/betrayals", (_req: Request, res: Response) => {
        res.json(stateStore.betrayals || []);
    });

    // GET /api/alliances/defections — defection events
    router.get("/defections", (_req: Request, res: Response) => {
        res.json(stateStore.defections || []);
    });

    // GET /api/alliances/memory/:cultId — memory for a specific cult
    router.get("/memory/:cultId", (req: Request, res: Response) => {
        const cultId = parseInt(req.params.cultId as string);
        const allMemory = stateStore.memory || {};
        res.json(allMemory[cultId] || { recentInteractions: [], trust: [], streak: null });
    });

    return router;
}
