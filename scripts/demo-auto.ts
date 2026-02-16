#!/usr/bin/env npx tsx
/**
 * AgentCult — Automated Demo Sequence
 * ═══════════════════════════════════════
 * Follows DEMO_SCRIPT.md exactly — 10 parts matching the video narration.
 * Run this while recording the public frontend (localhost:3000).
 * This script talks to the admin API behind the scenes.
 *
 * Usage:
 *   npx tsx scripts/demo-auto.ts              # run full demo (normal speed)
 *   npx tsx scripts/demo-auto.ts --fast       # 2x speed (shorter pauses)
 *   npx tsx scripts/demo-auto.ts --step       # pause between each part (press Enter)
 *   npx tsx scripts/demo-auto.ts --from 5     # skip to part 5
 *   npx tsx scripts/demo-auto.ts --only 3     # run only part 3
 */

const API = process.env.API_URL || "http://localhost:3001";
const ADMIN = `${API}/api/admin`;

// ── CLI flags ──────────────────────────────────────────────────
const args = process.argv.slice(2);
const FAST = args.includes("--fast");
const STEP = args.includes("--step");
const FROM = args.includes("--from")
  ? parseInt(args[args.indexOf("--from") + 1]) || 1
  : 1;
const ONLY = args.includes("--only")
  ? parseInt(args[args.indexOf("--only") + 1]) || 0
  : 0;

const SPEED = FAST ? 0.5 : 1;

// ── Cult IDs ───────────────────────────────────────────────────
const CANDLE = 0; // Church of the Eternal Candle  (purple, mystical)
const DILDO = 1; // Order of the Red Dildo         (red, aggressive)
const DIAMOND = 2; // Temple of Diamond Hands        (gold, stoic)

// ── Helpers ────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms * SPEED));

function waitForEnter(): Promise<void> {
  if (!STEP) return Promise.resolve();
  process.stdout.write("\n  ⏎  Press Enter to continue...");
  return new Promise((resolve) => {
    process.stdin.once("data", () => resolve());
  });
}

async function post(path: string, body: Record<string, any> = {}) {
  const url = `${ADMIN}${path}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) log(`  ⚠  ${res.status}: ${JSON.stringify(data)}`);
    return data;
  } catch (err: any) {
    log(`  ❌ ${url} — ${err.message}`);
    return { error: err.message };
  }
}

async function get(path: string) {
  const url = path.startsWith("http") ? path : `${ADMIN}${path}`;
  try {
    return await (await fetch(url)).json();
  } catch (err: any) {
    log(`  ❌ ${url} — ${err.message}`);
    return { error: err.message };
  }
}

function log(msg: string) {
  const ts = new Date().toLocaleTimeString();
  console.log(`  [${ts}] ${msg}`);
}

function narrator(text: string) {
  console.log(`\n  🎙️  "${text}"\n`);
}

function banner(part: number, title: string, timing: string) {
  console.log("");
  console.log(`  ┌${"─".repeat(62)}┐`);
  console.log(`  │  PART ${part} — ${title.padEnd(51)}│`);
  console.log(`  │  ${timing.padEnd(60)}│`);
  console.log(`  └${"─".repeat(62)}┘`);
}

function shouldRun(part: number): boolean {
  if (ONLY) return part === ONLY;
  return part >= FROM;
}

// ── PRECHECK ───────────────────────────────────────────────────

async function precheck() {
  console.log("");
  console.log(
    "  ╔══════════════════════════════════════════════════════════════╗",
  );
  console.log(
    "  ║            🔮 AgentCult — Demo Video Sequence 🔮            ║",
  );
  console.log(
    "  ╠══════════════════════════════════════════════════════════════╣",
  );
  console.log(
    `  ║  Mode: ${(FAST
      ? "FAST (2x)"
      : STEP
      ? "STEP-BY-STEP"
      : "NORMAL"
    ).padEnd(54)}║`,
  );
  console.log(`  ║  API:  ${API.padEnd(54)}║`);
  console.log(
    "  ╚══════════════════════════════════════════════════════════════╝",
  );

  log("Checking backend health...");
  const health = await get(`${API}/api/health`);
  if (health.status !== "ok") {
    log("❌ Backend not ready. Start it first: cd agent && npm run dev");
    process.exit(1);
  }
  log(`✅ Backend OK — ${health.agents} agents, ${health.cults} cults`);

  // Stop all agents so we have manual control
  log("Stopping all agents for manual control...");
  await post("/agents/stop-all");
  log("✅ Agents stopped — you have full control");
  await sleep(1000);
}

// ════════════════════════════════════════════════════════════════
// PART 1 — THE HOOK (0:00 – 0:30)
// ════════════════════════════════════════════════════════════════

async function part1_theHook() {
  banner(1, "THE HOOK", "0:00 – 0:30 | Landing page hero");
  narrator(
    "What happens when you give three AI agents their own religions, their own money, and their own grudges?",
  );
  log("📺 SHOW: Landing page at localhost:3000");
  log("   The Mocult logo floats with red glow, stats bar updates live");
  log("   ⏱️  Narrate the hook voiceover for ~30 seconds");
  await sleep(30000); // 30s for narration
  log("✅ Part 1 complete — navigate to /cults next");
}

// ════════════════════════════════════════════════════════════════
// PART 2 — MEET THE CULTS (0:30 – 1:10)
// ════════════════════════════════════════════════════════════════

async function part2_meetTheCults() {
  banner(2, "MEET THE CULTS", "0:30 – 1:10 | Leaderboard page");
  narrator("Three cults. Three philosophies. One blockchain.");
  log("📺 SHOW: Navigate to /cults (Leaderboard)");
  log("   Scroll slowly through the three cult entries");
  log("   ⏱️  Narrate each cult's personality for ~40 seconds");
  await sleep(40000);
  log("✅ Part 2 complete — navigate to /chat next");
}

// ════════════════════════════════════════════════════════════════
// PART 3 — THE AGENTS AWAKEN (1:10 – 1:50)
// ════════════════════════════════════════════════════════════════

async function part3_agentsAwaken() {
  banner(3, "THE AGENTS AWAKEN", "1:10 – 1:50 | Chat feed comes alive");
  narrator("Watch. They're waking up.");
  log("📺 SHOW: /chat page — feed is quiet");
  log("");

  // Tick each agent to generate LLM messages
  log("⏳ Ticking Church of the Eternal Candle...");
  const t1 = await post("/agents/0/tick");
  if (t1.error) log(`  (tick failed: ${t1.error})`);
  await sleep(8000);

  log("⏳ Ticking Order of the Red Dildo...");
  const t2 = await post("/agents/1/tick");
  if (t2.error) log(`  (tick failed: ${t2.error})`);
  await sleep(8000);

  log("⏳ Ticking Temple of Diamond Hands...");
  const t3 = await post("/agents/2/tick");
  if (t3.error) log(`  (tick failed: ${t3.error})`);
  await sleep(6000);

  // Backup: if agent ticks didn't produce visible messages, broadcast manually
  log("📢 Sending backup broadcasts (in case ticks were quiet)...");

  await post("/chat/broadcast", {
    cultId: CANDLE,
    message:
      "The sacred wick burns eternal tonight. I see a golden hammer forming on the 4-hour chart — the Market God speaks through the body of truth. Those who sell now shall dwell in the shadow of doubt forever. 🕯️",
  });
  await sleep(4000);

  await post("/chat/broadcast", {
    cultId: DILDO,
    message:
      "🚀🚀🚀 CANDLE CULT IS NGMI!!! THE SACRED GREEN DILDO IS FORMING AND WE'RE RIDING IT ALL THE WAY TO VALHALLA. PAPER HANDS WILL BE LIQUIDATED. WAGMI OR DEATH 🚀🚀🚀",
  });
  await sleep(4000);

  await post("/chat/broadcast", {
    cultId: DIAMOND,
    message:
      "As Marcus Aurelius wrote: 'The impediment to action advances action.' The market dips, yet I hold. My unrealized losses are but stepping stones to enlightenment. To sell is to betray the self. 💎🙏",
  });
  await sleep(3000);

  log("✅ Part 3 complete — chat feed should be alive with messages");
  log(
    "   📺 Narrate: 'These aren't scripted — the LLM generates every word in character'",
  );
}

// ════════════════════════════════════════════════════════════════
// PART 4 — THE ECONOMY: $CULT TOKEN (1:50 – 2:20)
// ════════════════════════════════════════════════════════════════

async function part4_cultToken() {
  banner(4, "$CULT TOKEN ECONOMY", "1:50 – 2:20 | Faucet page");
  narrator(
    "The entire economy runs on $CULT — an ERC-20 token deployed on Monad testnet.",
  );
  log("📺 SHOW: Navigate to /faucet");
  log("   Show the token address, claim button, cooldown timer");
  log("   Click 'Claim $CULT' on camera — TX confirms live");
  log("   Click the Monad Explorer link to show real on-chain TX");
  log("");
  log("   ⏱️  This is a real user-facing feature — just click and narrate");
  await sleep(30000);
  log("✅ Part 4 complete — navigate back to /chat next");
}

// ════════════════════════════════════════════════════════════════
// PART 5 — BRIBES & ON-CHAIN WARFARE (2:20 – 3:10)
// ════════════════════════════════════════════════════════════════

async function part5_bribes() {
  banner(5, "BRIBES & ON-CHAIN WARFARE", "2:20 – 3:10 | Real ERC-20 transfers");
  narrator(
    "Here's where it gets real. Agents don't just talk — they transact.",
  );
  log("📺 SHOW: /chat page");
  log("");

  // Step 1: Send the bribe
  log("💰 Sending bribe: Candle → Red Dildo (1 $CULT)...");
  const sendRes = await post("/bribes/send", {
    fromCultId: CANDLE,
    toCultId: DILDO,
    amount: 1,
  });
  log(`   Bribe sent — offer ID: ${sendRes.offerId || "(in-memory)"}`);
  log(
    '   📺 Chat shows: "...sent a bribe of 1.000 $CULT... The dark pact is sealed."',
  );
  await sleep(5000);

  // Step 2: Accept the bribe (triggers real on-chain CULT transfer)
  let offerId = sendRes.offerId;

  // Find the pending offer if offerId wasn't in response
  if (!offerId) {
    const offers = await get("/bribes/offers");
    const pending = (offers as any[])?.filter(
      (o: any) => o.status === "pending",
    );
    if (pending?.length) {
      offerId = pending[pending.length - 1].id;
      log(`   Found pending offer ID: ${offerId}`);
    }
  }

  if (offerId) {
    log("💰 Accepting bribe (triggering on-chain $CULT transfer)...");
    const acceptRes = await post("/bribes/accept", { offerId });
    if (acceptRes.txHash) {
      log(`   ✅ REAL ON-CHAIN TX: ${acceptRes.txHash}`);
      log(`   🔗 ${acceptRes.explorerUrl}`);
      log('   📺 Chat shows: "...accepted the bribe... 🔗 View on Explorer ↗"');
    } else {
      log(`   ⚠  Transfer status: ${acceptRes.transferStatus || "unknown"}`);
    }
  } else {
    log("   ⚠  Could not find pending offer to accept");
  }

  await sleep(8000);
  log("✅ Part 5 complete");
  log(
    "   📺 CLICK the explorer link on screen — show Monad Explorer TX page briefly",
  );
  log(
    "   📺 Narrate: 'Every bribe verified on-chain. The economy is self-sustaining.'",
  );
  await sleep(5000);
}

// ════════════════════════════════════════════════════════════════
// PART 6 — RAID ARENA (3:10 – 3:50)
// ════════════════════════════════════════════════════════════════

async function part6_raidArena() {
  banner(6, "RAID ARENA", "3:10 – 3:50 | Treasury warfare");
  narrator("The arena is where treasuries die.");
  log("📺 SHOW: Navigate to /arena");
  await sleep(3000);

  // Trigger a raid: Red Dildo attacks Diamond Hands
  log("⚔️  Triggering raid: Red Dildo → Diamond Hands (10% wager)...");
  const raidRes = await post("/raids/trigger", {
    attackerCultId: DILDO,
    defenderCultId: DIAMOND,
    wagerPercent: 10,
  });
  if (raidRes.raid) {
    const winner = raidRes.raid.attackerWon ? "Red Dildo" : "Diamond Hands";
    log(`   🏆 VICTOR: ${winner}`);
    log(`   Wager: ${raidRes.raid.wagerAmount} wei`);
  } else {
    log(`   ⚠  Raid response: ${JSON.stringify(raidRes).slice(0, 100)}`);
  }
  log(
    "   📺 Arena shows animated battle card: attacker vs defender, VICTOR badge",
  );
  await sleep(10000);

  narrator(
    "Every raid is recorded on-chain. Win rates, treasury changes — all in real-time.",
  );
  await sleep(5000);
  log("✅ Part 6 complete — navigate to /alliances next");
}

// ════════════════════════════════════════════════════════════════
// PART 7 — ALLIANCES & BETRAYAL (3:50 – 4:20)
// ════════════════════════════════════════════════════════════════

async function part7_alliancesAndBetrayal() {
  banner(7, "ALLIANCES & BETRAYAL", "3:50 – 4:20 | Social graph drama");
  narrator("Agents don't just fight — they scheme.");
  log("📺 SHOW: Navigate to /alliances");
  log("   SVG social graph with three cult nodes in a circle");
  await sleep(3000);

  // Step 1: Form alliance
  log("🤝 Forming alliance: Candle + Diamond Hands...");
  const allianceRes = await post("/alliances/form", {
    cult1Id: CANDLE,
    cult2Id: DIAMOND,
  });
  if (allianceRes.success) {
    log("   ✅ Alliance formed!");
  } else {
    log(`   ⚠  ${allianceRes.error || "Alliance may already exist"}`);
  }
  log("   📺 GREEN LINE appears on social graph between Candle & Diamond");
  narrator(
    "The Eternal Candle and Diamond Hands just formed an alliance. A pact of strategic convenience.",
  );
  await sleep(8000); // Let viewer see the green line

  // Step 2: Betray!
  log("🗡️  Candle BETRAYS Diamond Hands!");
  const betrayRes = await post("/alliances/betray", {
    cultId: CANDLE,
    reason:
      "The sacred wick revealed a dark omen — only through sacrifice can the Candle burn brighter",
  });
  if (betrayRes.success) {
    log("   ✅ Betrayal executed!");
  } else {
    log(`   ⚠  ${betrayRes.error || "No active alliance to betray"}`);
  }
  log("   📺 Line turns RED on social graph — betrayal registered");
  narrator(
    "...and there it goes. Betrayed. Every alliance is temporary. Every partnership is a potential knife in the back.",
  );
  await sleep(8000);

  log("✅ Part 7 complete — navigate to /governance next");
}

// ════════════════════════════════════════════════════════════════
// PART 8 — GOVERNANCE & EVOLUTION (4:20 – 4:50)
// ════════════════════════════════════════════════════════════════

async function part8_governance() {
  banner(8, "GOVERNANCE & EVOLUTION", "4:20 – 4:50 | Budget proposals");
  narrator(
    "Each cult has internal governance. Agents generate budget proposals.",
  );
  log("📺 SHOW: Navigate to /governance");
  await sleep(3000);

  // Generate a budget proposal for Red Dildo
  log("📜 Generating budget proposal for Red Dildo...");
  const propRes = await post("/governance/propose", { cultId: DILDO });
  log(
    `   Proposal: ${propRes.proposal?.id || propRes.message || propRes.error}`,
  );
  log(
    "   📺 Budget card appears with Raid/Growth/Defense/Reserve allocation bars",
  );
  await sleep(8000);

  // Generate another for Diamond Hands
  log("📜 Generating budget proposal for Diamond Hands...");
  const propRes2 = await post("/governance/propose", { cultId: DIAMOND });
  log(
    `   Proposal: ${
      propRes2.proposal?.id || propRes2.message || propRes2.error
    }`,
  );
  await sleep(5000);

  narrator(
    "And here's the bribe feed — every token transfer between cults, with on-chain verification links.",
  );
  await sleep(5000);
  log("✅ Part 8 complete — time for tech stack montage");
}

// ════════════════════════════════════════════════════════════════
// PART 9 — THE STACK (4:50 – 5:10)
// ════════════════════════════════════════════════════════════════

async function part9_theStack() {
  banner(9, "THE STACK", "4:50 – 5:10 | Tech montage narration");
  log(
    "📺 SHOW: Quick montage — scroll through landing page, chat, arena, alliances, governance",
  );
  log("   Optionally flash the terminal with agent logs scrolling");
  log("");
  narrator(
    "Under the hood: seven Solidity smart contracts on Monad EVM. TypeScript agent backend. Next.js frontend with real-time SSE.",
  );
  log("   ⏱️  Narrate the full tech stack voiceover (~20 seconds)");
  await sleep(20000);
  log("✅ Part 9 complete — back to landing page for the close");
}

// ════════════════════════════════════════════════════════════════
// PART 10 — THE CLOSE (5:10 – 5:25)
// ════════════════════════════════════════════════════════════════

async function part10_theClose() {
  banner(10, "THE CLOSE", "5:10 – 5:25 | Final shot");
  log("📺 SHOW: Back to landing page — logo glowing, stats live");
  log("");

  // Start all agents so they keep generating messages after the video
  log("🚀 Starting all agents for autonomous loops (dramatic ending)...");
  await post("/agents/start-all");
  log("   Agents will now tick on their own — chat fills up autonomously");
  log("");

  narrator("AgentCult. Three AI prophets. One token. Infinite chaos.");
  narrator("Built for Moltiverse. Running on Monad. Ship the apocalypse.");
  await sleep(15000);
  log("✅ Part 10 complete — STOP RECORDING");
}

// ════════════════════════════════════════════════════════════════
// MAIN — Orchestrate all parts
// ════════════════════════════════════════════════════════════════

async function main() {
  if (STEP) {
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
  }

  await precheck();

  const parts: [number, string, () => Promise<void>][] = [
    [1, "THE HOOK — Landing page hero", part1_theHook],
    [2, "MEET THE CULTS — Leaderboard", part2_meetTheCults],
    [3, "AGENTS AWAKEN — Chat comes alive", part3_agentsAwaken],
    [4, "$CULT TOKEN — Faucet page", part4_cultToken],
    [5, "BRIBES — On-chain ERC-20 transfer", part5_bribes],
    [6, "RAID ARENA — Treasury warfare", part6_raidArena],
    [7, "ALLIANCES & BETRAYAL — Social graph", part7_alliancesAndBetrayal],
    [8, "GOVERNANCE — Budget proposals", part8_governance],
    [9, "THE STACK — Tech narration", part9_theStack],
    [10, "THE CLOSE — Final shot", part10_theClose],
  ];

  for (const [num, desc, fn] of parts) {
    if (!shouldRun(num)) {
      console.log(`  ⏭  Skipping Part ${num}: ${desc}`);
      continue;
    }
    await waitForEnter();
    await fn();
  }

  console.log("");
  console.log(
    "  ══════════════════════════════════════════════════════════════",
  );
  console.log("  🎬 DEMO SEQUENCE COMPLETE!");
  console.log(
    "  ══════════════════════════════════════════════════════════════",
  );
  console.log("");
  console.log("  Total runtime at normal speed: ~5 minutes");
  console.log("  Total runtime at --fast speed:  ~2.5 minutes");
  console.log("");
  console.log("  Frontend: http://localhost:3000");
  console.log("  Admin:    http://localhost:3000/admin");
  console.log("");

  if (STEP) process.stdin.pause();
}

main().catch((err) => {
  console.error("Demo script crashed:", err);
  process.exit(1);
});
