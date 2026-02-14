import { Router, Request, Response } from "express";
import { createLogger } from "../../utils/logger.js";
import type { AgentOrchestrator } from "../../core/AgentOrchestrator.js";

const log = createLogger("API:AgentCreation");

/**
 * POST /api/agents/create — Create a new agent with:
 *   - Custom system prompt (the user uploads their prompt)
 *   - Optional per-agent LLM API key
 *   - Auto-generated unique wallet
 *
 * Body:
 * {
 *   "name": "My Cult of Degen Lords",
 *   "symbol": "DEGEN",
 *   "style": "aggressive",
 *   "systemPrompt": "You are a ruthless degen overlord...",
 *   "description": "A cult for the boldest degens",
 *   "llmApiKey": "xai-...",          // optional — uses default if omitted
 *   "llmBaseUrl": "https://...",       // optional
 *   "llmModel": "grok-3-fast",        // optional
 *   "walletPrivateKey": "0x...",       // optional — generates new if omitted
 *   "ownerId": "user123"              // optional — for multi-user support
 * }
 */
export function agentCreationRoutes(orchestrator: AgentOrchestrator): Router {
  const router = Router();

  // POST /api/agents/create — Create a new agent
  router.post("/create", async (req: Request, res: Response) => {
    try {
      const {
        name,
        symbol,
        style,
        systemPrompt,
        description,
        llmApiKey,
        llmBaseUrl,
        llmModel,
        walletPrivateKey,
        ownerId,
      } = req.body;

      if (!name || !systemPrompt) {
        return res.status(400).json({
          error: "Missing required fields: name, systemPrompt",
        });
      }

      if (typeof systemPrompt !== "string" || systemPrompt.length < 20) {
        return res.status(400).json({
          error: "systemPrompt must be at least 20 characters",
        });
      }

      if (systemPrompt.length > 5000) {
        return res.status(400).json({
          error: "systemPrompt must be under 5000 characters",
        });
      }

      log.info(`Creating agent: ${name} (owner: ${ownerId || "anonymous"})`);

      const { agent, row } = await orchestrator.createNewAgent({
        name,
        symbol,
        style,
        system_prompt: systemPrompt,
        description,
        llm_api_key: llmApiKey,
        llm_base_url: llmBaseUrl,
        llm_model: llmModel,
        wallet_private_key: walletPrivateKey,
        owner_id: ownerId,
      });

      res.status(201).json({
        success: true,
        agent: {
          id: row.id,
          cultId: agent.cultId,
          name: row.name,
          symbol: row.symbol,
          style: row.style,
          walletAddress: row.wallet_address,
          status: row.status,
          createdAt: row.created_at,
          // Never expose private key or LLM API key in response
        },
      });
    } catch (error: any) {
      log.error(`Agent creation failed: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/agents/list — List all agents (with wallet addresses, no secrets)
  router.get("/list", (_req: Request, res: Response) => {
    try {
      const rows = orchestrator.getAllAgentRows();
      res.json(
        rows.map((row) => ({
          id: row.id,
          cultId: row.cult_id,
          name: row.name,
          symbol: row.symbol,
          style: row.style,
          walletAddress: row.wallet_address,
          status: row.status,
          dead: row.dead,
          cycleCount: row.cycle_count,
          propheciesGenerated: row.prophecies_generated,
          raidsInitiated: row.raids_initiated,
          raidsWon: row.raids_won,
          followersRecruited: row.followers_recruited,
          lastAction: row.last_action,
          hasCustomLlmKey: !!row.llm_api_key,
          createdAt: row.created_at,
        })),
      );
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/agents/:id/wallet — Get agent wallet info (address only, not private key)
  router.get("/:id/wallet", (req: Request, res: Response) => {
    try {
      const row = orchestrator.getAgentRow(parseInt(String(req.params.id)));
      if (!row) {
        return res.status(404).json({ error: "Agent not found" });
      }
      res.json({
        agentId: row.id,
        name: row.name,
        walletAddress: row.wallet_address,
        // Never expose private key in API
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/agents/:id/stop — Stop an agent
  router.post("/:id/stop", (req: Request, res: Response) => {
    try {
      const agent = orchestrator.getAgentByDbId(parseInt(String(req.params.id)));
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      agent.stop();
      res.json({ success: true, message: `Agent ${req.params.id} stopped` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/agents/:id/start — Resume an agent
  router.post("/:id/start", (req: Request, res: Response) => {
    try {
      const agent = orchestrator.getAgentByDbId(parseInt(String(req.params.id)));
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      agent.start().catch(() => {});
      res.json({ success: true, message: `Agent ${req.params.id} started` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
