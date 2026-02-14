import { Router, Request, Response } from "express";

export function communicationRoutes(stateStore: any): Router {
    const router = Router();

    // GET /api/communication — recent agent messages
    router.get("/", (_req: Request, res: Response) => {
        res.json(stateStore.messages || []);
    });

    // GET /api/communication/cult/:cultId — messages from a specific cult
    router.get("/cult/:cultId", (req: Request, res: Response) => {
        const cultId = parseInt(req.params.cultId as string);
        const allMessages = stateStore.messages || [];
        res.json(allMessages.filter((m: any) => m.fromCultId === cultId));
    });

    // GET /api/communication/evolution — evolution traits for all cults
    router.get("/evolution", (_req: Request, res: Response) => {
        res.json(stateStore.evolutionTraits || {});
    });

    return router;
}
