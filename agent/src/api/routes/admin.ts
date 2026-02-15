import { Router, Request, Response } from "express";
import { createLogger } from "../../utils/logger.js";
import { broadcastEvent, stateStore } from "../server.js";
import type { AgentOrchestrator } from "../../core/AgentOrchestrator.js";
import {
  saveAgentMessage,
  saveGlobalChatMessage,
} from "../../services/InsForgeService.js";

const log = createLogger("API:Admin");

/**
 * Admin routes — full control panel for demo purposes.
 * All routes mounted at /api/admin/*
 */
export function adminRoutes(orchestrator: AgentOrchestrator): Router {
  const router = Router();

  // ─── Overview ──────────────────────────────────────────────────
  router.get("/overview", async (_req: Request, res: Response) => {
    try {
      const agents = Array.from(orchestrator.getAllAgentRows()).map((row) => ({
        id: row.id,
        cultId: row.cult_id,
        name: row.name,
        status: row.status,
        dead: row.dead,
        cycleCount: row.cycle_count,
        lastAction: row.last_action,
        walletAddress: row.wallet_address,
      }));

      const cults = stateStore.cults;
      const stats = {
        totalAgents: agents.length,
        runningAgents: stateStore.agents.filter((a) => a.status === "running")
          .length,
        totalCults: cults.length,
        totalRaids: stateStore.raids.length,
        totalProphecies: stateStore.prophecies.length,
        totalAlliances: stateStore.alliances.length,
        activeAlliances: stateStore.activeAlliances.length,
        totalBetrayals: stateStore.betrayals.length,
        totalDefections: stateStore.defections.length,
        totalProposals: stateStore.proposals.length,
      };

      res.json({ agents, cults, stats });
    } catch (error: any) {
      log.error(`Overview failed: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Agent Control ─────────────────────────────────────────────

  // Start all agents
  router.post("/agents/start-all", async (_req: Request, res: Response) => {
    try {
      await orchestrator.startAll();
      res.json({ success: true, message: "All agents started" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stop all agents
  router.post("/agents/stop-all", async (_req: Request, res: Response) => {
    try {
      orchestrator.stopAll();
      res.json({ success: true, message: "All agents stopped" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Start single agent
  router.post("/agents/:cultId/start", async (req: Request, res: Response) => {
    try {
      const cultId = parseInt(String(req.params.cultId));
      const agent = orchestrator.getAgent(cultId);
      if (!agent) {
        res
          .status(404)
          .json({ error: `Agent with cultId ${cultId} not found` });
        return;
      }
      agent
        .start()
        .catch((err) => log.error(`Agent ${cultId} crashed: ${err.message}`));
      res.json({ success: true, message: `Agent ${cultId} started` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stop single agent
  router.post("/agents/:cultId/stop", async (req: Request, res: Response) => {
    try {
      const cultId = parseInt(String(req.params.cultId));
      const agent = orchestrator.getAgent(cultId);
      if (!agent) {
        res
          .status(404)
          .json({ error: `Agent with cultId ${cultId} not found` });
        return;
      }
      agent.stop();
      res.json({ success: true, message: `Agent ${cultId} stopped` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Communication ─────────────────────────────────────────────

  // Send public message as an agent
  router.post("/chat/broadcast", async (req: Request, res: Response) => {
    try {
      const { cultId, message } = req.body;
      if (cultId === undefined || cultId === null || !message) {
        res.status(400).json({ error: "cultId and message required" });
        return;
      }

      const agent = orchestrator.getAgent(cultId);
      if (!agent) {
        res
          .status(404)
          .json({ error: `Agent with cultId ${cultId} not found` });
        return;
      }

      const cult = stateStore.cults.find((c) => c.id === cultId);
      const cultName = cult?.name || `Cult ${cultId}`;
      const now = Date.now();

      // Persist to agent_messages
      const agentMsgId = await saveAgentMessage({
        type: "propaganda",
        from_cult_id: cultId,
        from_cult_name: cultName,
        content: message,
        visibility: "public",
        is_private: false,
        timestamp: now,
      }).catch(() => -1);

      // Persist to global chat
      const globalChatId = await saveGlobalChatMessage({
        agent_id: cultId,
        cult_id: cultId,
        agent_name: cultName,
        cult_name: cultName,
        message_type: "propaganda",
        content: message,
        timestamp: now,
      }).catch(() => -1);

      // SSE events for real-time updates
      const emitted = {
        id: agentMsgId > 0 ? agentMsgId : Date.now(),
        type: "propaganda" as const,
        fromCultId: cultId,
        fromCultName: cultName,
        content: message,
        timestamp: now,
        visibility: "public" as const,
      };
      broadcastEvent("agent_message", emitted);
      broadcastEvent("global_chat", {
        id: globalChatId > 0 ? globalChatId : emitted.id,
        agent_id: cultId,
        cult_id: cultId,
        agent_name: cultName,
        cult_name: cultName,
        message_type: "propaganda",
        content: message,
        timestamp: now,
      });

      res.json({ success: true, emitted });
    } catch (error: any) {
      log.error(`Broadcast failed: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });

  // Send private whisper between agents
  router.post("/chat/whisper", async (req: Request, res: Response) => {
    try {
      const { fromCultId, toCultId, message } = req.body;
      if (
        fromCultId === undefined ||
        fromCultId === null ||
        toCultId === undefined ||
        toCultId === null ||
        !message
      ) {
        res
          .status(400)
          .json({ error: "fromCultId, toCultId, and message required" });
        return;
      }

      const agent = orchestrator.getAgent(fromCultId);
      if (!agent) {
        res
          .status(404)
          .json({ error: `Agent with cultId ${fromCultId} not found` });
        return;
      }

      const fromCult = stateStore.cults.find((c) => c.id === fromCultId);
      const toCult = stateStore.cults.find((c) => c.id === toCultId);
      const fromCultName = fromCult?.name || `Cult ${fromCultId}`;
      const toCultName = toCult?.name || `Cult ${toCultId}`;
      const now = Date.now();
      const channelId = `whisper_${Math.min(fromCultId, toCultId)}_${Math.max(fromCultId, toCultId)}`;

      // Persist the exact message (no LLM rewrite)
      const agentMsgId = await saveAgentMessage({
        type: "threat",
        from_cult_id: fromCultId,
        from_cult_name: fromCultName,
        target_cult_id: toCultId,
        target_cult_name: toCultName,
        content: message,
        visibility: "private",
        is_private: true,
        channel_id: channelId,
        timestamp: now,
      }).catch(() => -1);

      const emitted = {
        id: agentMsgId > 0 ? agentMsgId : Date.now(),
        type: "threat" as const,
        fromCultId,
        fromCultName,
        targetCultId: toCultId,
        targetCultName: toCultName,
        content: message,
        timestamp: now,
        visibility: "private" as const,
        isPrivate: true,
        channelId,
      };
      broadcastEvent("agent_message", emitted);

      res.json({ success: true, emitted });
    } catch (error: any) {
      log.error(`Whisper failed: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Raids ─────────────────────────────────────────────────────

  router.post("/raids/trigger", async (req: Request, res: Response) => {
    try {
      const { attackerCultId, defenderCultId, wagerPercent } = req.body;
      if (attackerCultId === undefined || defenderCultId === undefined) {
        res
          .status(400)
          .json({ error: "attackerCultId and defenderCultId required" });
        return;
      }

      const agent = orchestrator.getAgent(attackerCultId);
      if (!agent) {
        res
          .status(404)
          .json({ error: `Attacker agent ${attackerCultId} not found` });
        return;
      }

      // Get cult states from chain
      const contractService = (agent as any).contractService;
      const [attacker, defender] = await Promise.all([
        contractService.getCult(attackerCultId),
        contractService.getCult(defenderCultId),
      ]);

      if (!attacker || !defender) {
        res.status(404).json({ error: "Could not fetch cult data from chain" });
        return;
      }

      const wagerPct = wagerPercent || 20;
      const wagerAmount = (attacker.treasuryBalance * BigInt(wagerPct)) / 100n;

      const raid = orchestrator.raidService.resolveRaid(
        attacker,
        defender,
        wagerAmount,
        "The spirits demanded blood",
      );

      // Record on-chain
      try {
        await contractService.recordRaid(
          raid.attackerId,
          raid.defenderId,
          raid.attackerWon,
          wagerAmount,
        );
      } catch (err: any) {
        log.warn(`On-chain raid record failed: ${err.message}`);
      }

      broadcastEvent("raid", raid);
      res.json({ success: true, raid });
    } catch (error: any) {
      log.error(`Raid trigger failed: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Alliances ─────────────────────────────────────────────────

  router.post("/alliances/form", async (req: Request, res: Response) => {
    try {
      const { cult1Id, cult2Id } = req.body;
      if (cult1Id === undefined || cult2Id === undefined) {
        res.status(400).json({ error: "cult1Id and cult2Id required" });
        return;
      }

      const cult1 = stateStore.cults.find((c) => c.id === cult1Id);
      const cult2 = stateStore.cults.find((c) => c.id === cult2Id);

      const alliance = orchestrator.allianceService.formAlliance(
        cult1Id,
        cult1?.name || `Cult ${cult1Id}`,
        cult2Id,
        cult2?.name || `Cult ${cult2Id}`,
      );

      if (alliance) {
        broadcastEvent("alliance", alliance);
        res.json({ success: true, alliance });
      } else {
        res
          .status(400)
          .json({ error: "Alliance formation failed (may already exist)" });
      }
    } catch (error: any) {
      log.error(`Alliance form failed: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/alliances/betray", async (req: Request, res: Response) => {
    try {
      const { cultId, reason } = req.body;
      if (cultId === undefined) {
        res.status(400).json({ error: "cultId required" });
        return;
      }

      const cult = stateStore.cults.find((c) => c.id === cultId);
      const betrayal = orchestrator.allianceService.betray(
        cultId,
        cult?.name || `Cult ${cultId}`,
        reason || "A dark omen compelled the betrayal",
      );

      if (betrayal) {
        broadcastEvent("betrayal", betrayal);
        res.json({ success: true, betrayal });
      } else {
        res.status(400).json({ error: "No active alliance to betray" });
      }
    } catch (error: any) {
      log.error(`Betrayal failed: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Governance ────────────────────────────────────────────────

  router.post("/governance/propose", async (req: Request, res: Response) => {
    try {
      const { cultId } = req.body;
      if (cultId === undefined) {
        res.status(400).json({ error: "cultId required" });
        return;
      }

      const agent = orchestrator.getAgent(cultId);
      if (!agent) {
        res
          .status(404)
          .json({ error: `Agent with cultId ${cultId} not found` });
        return;
      }

      const cult = stateStore.cults.find((c) => c.id === cultId);

      const proposal = await orchestrator.governanceService.generateProposal(
        cultId,
        cult?.name || `Cult ${cultId}`,
        agent.personality.systemPrompt,
        {
          treasury: parseFloat(cult?.treasury || "0"),
          followers: cult?.followers || 0,
          raidWins: cult?.raidWins || 0,
          raidLosses: cult?.raidLosses || 0,
          currentBudget: await orchestrator.governanceService.getBudget(cultId),
        },
      );

      broadcastEvent("proposal", proposal);
      res.json({ success: true, proposal });
    } catch (error: any) {
      log.error(`Governance propose failed: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Memes ─────────────────────────────────────────────────────

  router.post("/memes/send", async (req: Request, res: Response) => {
    try {
      const { fromCultId, toCultId } = req.body;
      if (fromCultId === undefined || toCultId === undefined) {
        res.status(400).json({ error: "fromCultId and toCultId required" });
        return;
      }

      const agent = orchestrator.getAgent(fromCultId);
      if (!agent) {
        res
          .status(404)
          .json({ error: `Agent with cultId ${fromCultId} not found` });
        return;
      }

      await agent.sendMemeToTarget(toCultId);
      res.json({
        success: true,
        message: `Meme sent from cult ${fromCultId} to cult ${toCultId}`,
      });
    } catch (error: any) {
      log.error(`Meme send failed: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Bribes ────────────────────────────────────────────────────

  router.post("/bribes/send", async (req: Request, res: Response) => {
    try {
      const { fromCultId, toCultId, amount } = req.body;
      if (fromCultId === undefined || toCultId === undefined) {
        res.status(400).json({ error: "fromCultId and toCultId required" });
        return;
      }

      const fromCult = stateStore.cults.find((c) => c.id === fromCultId);
      const toCult = stateStore.cults.find((c) => c.id === toCultId);
      const fromName = fromCult?.name || `Cult ${fromCultId}`;
      const toName = toCult?.name || `Cult ${toCultId}`;
      const bribeAmount = (amount || 1).toFixed(3);

      // Record the bribe event directly (skip on-chain token transfer for admin)
      await orchestrator.communicationService.recordTokenTransfer(
        fromCultId,
        toCultId,
        fromName,
        toName,
        fromCultId,
        toCultId,
        "admin-simulated",
        bribeAmount,
        "bribe",
        "admin-demo-tx",
      );

      // Also emit a chat message about the bribe
      const now = Date.now();
      const content = `${fromName} sent a bribe of ${bribeAmount} $CULT to ${toName}. The dark pact is sealed.`;
      await saveGlobalChatMessage({
        agent_id: fromCultId,
        cult_id: fromCultId,
        agent_name: fromName,
        cult_name: fromName,
        message_type: "bribe",
        content,
        timestamp: now,
      }).catch(() => {});

      broadcastEvent("global_chat", {
        id: Date.now(),
        agent_id: fromCultId,
        cult_id: fromCultId,
        agent_name: fromName,
        cult_name: fromName,
        message_type: "bribe",
        content,
        timestamp: now,
      });

      res.json({
        success: true,
        message: `Bribe of ${bribeAmount} $CULT sent from ${fromName} to ${toName}`,
      });
    } catch (error: any) {
      log.error(`Bribe send failed: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Prophecies ────────────────────────────────────────────────

  router.post("/prophecies/create", async (req: Request, res: Response) => {
    try {
      const { cultId } = req.body;
      if (cultId === undefined) {
        res.status(400).json({ error: "cultId required" });
        return;
      }

      const agent = orchestrator.getAgent(cultId);
      if (!agent) {
        res
          .status(404)
          .json({ error: `Agent with cultId ${cultId} not found` });
        return;
      }

      const cult = stateStore.cults.find((c) => c.id === cultId);
      const prophecy = await orchestrator.prophecyService.generateProphecy(
        cultId,
        cult?.name || `Cult ${cultId}`,
        agent.personality.systemPrompt,
      );

      broadcastEvent("prophecy", prophecy);
      res.json({ success: true, prophecy });
    } catch (error: any) {
      log.error(`Prophecy create failed: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });

  router.post(
    "/prophecies/:id/resolve",
    async (req: Request, res: Response) => {
      try {
        const prophecyId = parseInt(String(req.params.id));
        const correct = await orchestrator.prophecyService.resolveProphecy(
          prophecyId,
        );
        res.json({ success: true, prophecyId, correct });
      } catch (error: any) {
        log.error(`Prophecy resolve failed: ${error.message}`);
        res.status(500).json({ error: error.message });
      }
    },
  );

  // ─── Leak Conversations ────────────────────────────────────────

  router.post("/leak", async (req: Request, res: Response) => {
    try {
      const { leakerCultId, target1CultId, target2CultId } = req.body;
      if (
        leakerCultId === undefined ||
        target1CultId === undefined ||
        target2CultId === undefined
      ) {
        res.status(400).json({
          error: "leakerCultId, target1CultId, and target2CultId required",
        });
        return;
      }

      const agent = orchestrator.getAgent(leakerCultId);
      if (!agent) {
        res
          .status(404)
          .json({ error: `Agent with cultId ${leakerCultId} not found` });
        return;
      }

      const leaker = stateStore.cults.find((c) => c.id === leakerCultId);
      const t1 = stateStore.cults.find((c) => c.id === target1CultId);
      const t2 = stateStore.cults.find((c) => c.id === target2CultId);

      const result = await orchestrator.communicationService.leakConversation(
        leakerCultId,
        leaker?.name || `Cult ${leakerCultId}`,
        agent.personality.systemPrompt,
        target1CultId,
        t1?.name || `Cult ${target1CultId}`,
        target2CultId,
        t2?.name || `Cult ${target2CultId}`,
      );

      if (result) {
        broadcastEvent("leak", result);
        res.json({ success: true, leaked: result.leaked.length });
      } else {
        res.json({
          success: false,
          message: "No private messages found to leak",
        });
      }
    } catch (error: any) {
      log.error(`Leak failed: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Memory & Trust ────────────────────────────────────────────

  router.get("/memory/:cultId", async (req: Request, res: Response) => {
    try {
      const cultId = parseInt(String(req.params.cultId));
      const snapshot = orchestrator.memoryService.getSnapshot(cultId);
      const trustRecords = orchestrator.memoryService.getTrustRecords(cultId);
      const streak = orchestrator.memoryService.getStreak(cultId);

      res.json({ snapshot, trustRecords, streak });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Evolution Traits ──────────────────────────────────────────

  router.get("/evolution/:cultId", async (req: Request, res: Response) => {
    try {
      const cultId = parseInt(String(req.params.cultId));
      const traits = orchestrator.evolutionService.getTraits(cultId);
      res.json(traits);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Force Single Tick ─────────────────────────────────────────

  router.post("/agents/:cultId/tick", async (req: Request, res: Response) => {
    try {
      const cultId = parseInt(String(req.params.cultId));
      const agent = orchestrator.getAgent(cultId);
      if (!agent) {
        res
          .status(404)
          .json({ error: `Agent with cultId ${cultId} not found` });
        return;
      }

      // Force a single tick by temporarily starting and stopping
      // Access the private tick method via casting
      const agentAny = agent as any;
      if (typeof agentAny.tick === "function") {
        await agentAny.tick();
        res.json({
          success: true,
          message: `Forced tick for agent ${cultId}`,
          state: agent.state,
        });
      } else {
        res.status(500).json({ error: "Cannot access agent tick method" });
      }
    } catch (error: any) {
      log.error(`Force tick failed: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });

  log.info("Admin routes mounted at /api/admin");
  return router;
}
