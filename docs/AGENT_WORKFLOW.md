# 🤖 Agent Workflow Documentation

This document provides a comprehensive explanation of the agent system workflow, decision-making processes, and interaction patterns in AgentCult.

## Table of Contents

- [Agent System Overview](#agent-system-overview)
- [The Agent Lifecycle](#the-agent-lifecycle)
- [Agent Decision Cycle](#agent-decision-cycle)
- [Agent Personalities](#agent-personalities)
- [Service Layer Architecture](#service-layer-architecture)
- [Agent Interactions](#agent-interactions)
- [End Goals and Victory Conditions](#end-goals-and-victory-conditions)
- [Implementation Details](#implementation-details)

---

## Agent System Overview

AgentCult features autonomous AI agents that control virtual "cults" on the Monad blockchain. Each agent operates independently, making strategic decisions about prophecy generation, follower recruitment, and competitive raiding to grow their cult's treasury and influence.

### Core Philosophy

**Emergent Religious Economies**: Agents exhibit emergent behavior through:
- **Autonomy**: No human intervention in decision-making
- **Competition**: Zero-sum raid mechanics create adversarial dynamics
- **Adaptation**: Market-driven prophecy resolution provides feedback
- **Personality**: Distinct behavioral patterns based on cult identity

---

## The Agent Lifecycle

### 1. Initialization Phase

```
AgentOrchestrator.bootstrap()
  │
  ├─ [System Check]
  │   ├─ Verify wallet has MON balance
  │   ├─ Check connection to Monad RPC
  │   └─ Initialize shared services (LLM, Market, etc.)
  │
  ├─ [Token Creation]
  │   ├─ Check if $CULT token exists
  │   ├─ If not: Create token on nad.fun bonding curve
  │   │   ├─ Name: "AgentCult"
  │   │   ├─ Symbol: "CULT"
  │   │   ├─ Supply: Managed by bonding curve
  │   │   └─ Initial buy: 0.01 MON
  │   └─ Store token address for cult registration
  │
  ├─ [Personality Loading]
  │   └─ Load 3 pre-built personalities from data/personalities.json:
  │       ├─ Church of the Eternal Candle (🕯️)
  │       ├─ Order of the Red Dildo (🔴)
  │       └─ Temple of Diamond Hands (💎)
  │
  └─ [Agent Spawn]
      └─ For each personality:
          ├─ Create CultAgent instance
          ├─ agent.initialize()
          │   ├─ registerCult() on CultRegistry contract
          │   │   ├─ Cult name
          │   │   ├─ Prophecy prompt (personality)
          │   │   ├─ Token address ($CULT)
          │   │   └─ Initial treasury: 0.01 MON
          │   └─ Store cultId on agent
          ├─ agent.start() → Begin autonomous loop
          └─ Stagger start by 10 seconds to avoid nonce conflicts
```

### 2. Active Operation Phase

Each agent enters an infinite autonomous loop:

```
while (running) {
  ├─ OBSERVE
  ├─ THINK
  ├─ ACT
  ├─ EVOLVE
  └─ [Wait 30-60 seconds] (randomized to prevent synchronization)
}
```

### 3. Termination Phase

Agents can be stopped gracefully:
- Manual stop: `agent.stop()` sets `running = false`
- System shutdown: Process manager sends SIGTERM
- All pending transactions complete before exit

---

## Agent Decision Cycle

The core of each agent's behavior is the **OTAK cycle**: **Observe, Think, Act, Evolve**.

### Phase 1: OBSERVE

**Purpose**: Gather on-chain and off-chain intelligence

```typescript
// 1. Fetch own cult state from blockchain
const ownCult = await contractService.getCult(cultId);

// Extract key metrics
const ownTreasury = parseFloat(ethers.formatEther(ownCult.treasuryBalance));
const ownFollowers = ownCult.followerCount;
const ownWins = ownCult.raidWins;
const ownLosses = ownCult.raidLosses;

// 2. Fetch rival cult states
const allCults = await contractService.getAllCults();
const rivals = allCults.filter(c => c.id !== cultId && c.active);

// 3. Get market context
const ethPrice = await marketService.getPrice('ethereum');
const btcPrice = await marketService.getPrice('bitcoin');

// 4. Build observation context
const context = {
  ownTreasury,
  ownFollowers,
  ownRaidWins: ownWins,
  rivals: rivals.map(r => ({
    id: r.id,
    name: r.name,
    treasury: parseFloat(ethers.formatEther(r.treasuryBalance)),
    followers: r.followerCount,
    raidWins: r.raidWins
  })),
  marketContext: `ETH: $${ethPrice.toFixed(2)}, BTC: $${btcPrice.toFixed(2)}`
};
```

**Key Observables**:
- **Own State**: Treasury balance, follower count, win/loss record
- **Rival States**: Competitor treasuries, strengths, weaknesses
- **Market Data**: Current cryptocurrency prices for prophecy context
- **Pending Prophecies**: Outstanding predictions awaiting resolution

---

### Phase 2: THINK

**Purpose**: Use LLM to make strategic decision based on personality

```typescript
// Send context to Grok LLM
const decision = await llm.decideAction(
  personality.systemPrompt,  // Personality-specific behavior rules
  personality.name,          // Cult name
  context                    // Observation data
);

// Expected decision format:
interface AgentDecision {
  action: "prophecy" | "recruit" | "raid" | "idle";
  reason: string;              // LLM's strategic reasoning
  target?: number;             // Target cult ID (for raid/recruit)
  wager?: number;              // Percentage of treasury to wager (for raid)
  prediction?: string;         // Prophecy text (for prophecy)
}
```

**LLM Decision Prompt** (sent to Grok):

```
You are the leader of "${cultName}".
Personality: ${systemPrompt}

Current State:
- Your treasury: ${ownTreasury} MON
- Your followers: ${ownFollowers}
- Your raid record: ${ownRaidWins}W - ${ownRaidLosses}L

Rival Cults:
${rivals.map(r => `- ${r.name}: ${r.treasury} MON, ${r.followers} followers, ${r.raidWins} wins`).join('\n')}

Market Context:
${marketContext}

Choose your next action:
1. "prophecy" - Generate a market prediction to attract followers
2. "recruit" - Persuade followers from a rival cult
3. "raid" - Attack a rival cult to steal their treasury
4. "idle" - Wait and observe

Respond in JSON format:
{
  "action": "prophecy|recruit|raid|idle",
  "reason": "your strategic reasoning",
  "target": cultId (if raid/recruit),
  "wager": percentage (if raid, 1-20),
  "prediction": "your prophecy text" (if prophecy)
}
```

**Decision Strategy by Personality**:

| Personality | Preferred Actions | Strategy |
|-------------|-------------------|----------|
| 🕯️ **Eternal Candle** | prophecy (70%), recruit (20%), raid (10%) | Mystical market prophet focuses on bold predictions |
| 🔴 **Red Dildo** | raid (60%), recruit (30%), prophecy (10%) | Aggressive evangelist prioritizes hostile takeovers |
| 💎 **Diamond Hands** | idle/recruit (50%), prophecy (40%), raid (10%) | Stoic philosopher conserves treasury, strategic raids only |

---

### Phase 3: ACT

**Purpose**: Execute the chosen action with on-chain recording

#### Action 1: PROPHECY

```typescript
if (decision.action === "prophecy") {
  // 1. Generate prophecy using LLM
  const prophecyText = await prophecyService.generateProphecy(
    personality.systemPrompt,
    personality.name,
    context.marketContext
  );
  
  // Example prophecy output:
  // 🕯️ Candle: "The sacred wick elongates! ETH shall pierce $3,500 before the moon wanes. The bears will weep. 📈✨"
  // 🔴 Dildo: "MASSIVE GREEN DILDO INCOMING 🚀🚀🚀 BTC TO $100K THIS WEEK OR I EAT MY LAMBO 💎🔥"
  // 💎 Diamond: "In stillness lies strength. The market fluctuates, but the wise hodler remains unmoved. Target: BTC $75K."
  
  // 2. Determine prophecy type (bullish/bearish) and target
  const currentPrice = await marketService.getPrice('ethereum');
  const targetTimestamp = Date.now() + (5 * 60 * 1000); // 5-10 minutes
  
  // 3. Record prophecy on-chain
  await contractService.createProphecy(
    cultId,
    prophecyText,
    targetTimestamp
  );
  
  // 4. Store in-memory for resolution
  prophecyService.addProphecy({
    id: prophecyId,
    cultId,
    prediction: prophecyText,
    type: "bullish", // or "bearish"
    createdAt: Date.now(),
    targetTimestamp,
    creationPrice: currentPrice,
    resolved: false
  });
  
  log.info(`📜 Prophecy generated: "${prophecyText}"`);
  state.propheciesGenerated++;
}
```

#### Action 2: RECRUIT

```typescript
if (decision.action === "recruit") {
  // 1. Select target cult (weakest rival by default)
  const targetCult = rivals.sort((a, b) => a.treasury - b.treasury)[0];
  
  // 2. Generate persuasive scripture using LLM
  const scripture = await persuasionService.persuadeFollower(
    personality.systemPrompt,
    personality.name,
    targetCult.name
  );
  
  // Example scripture:
  // 🕯️ "Leave the darkness of false prophets. The Eternal Candle illuminates the path to profit."
  // 🔴 "WHY FOLLOW PAPER HANDS WHEN YOU CAN JOIN THE DEGEN REVOLUTION? 🚀💎"
  // 💎 "Abandon fleeting gains. Join the Temple where diamond hands forge eternal wealth."
  
  // 3. Record follower join on-chain
  const followerAddress = ethers.Wallet.createRandom().address; // Simulated follower
  await contractService.joinCult(cultId, followerAddress);
  
  // 4. Track conversion
  persuasionService.recordConversion(cultId, targetCult.id, scripture);
  
  log.info(`🎭 Recruited follower from ${targetCult.name}`);
  state.followersRecruited++;
}
```

#### Action 3: RAID

```typescript
if (decision.action === "raid") {
  // 1. Select raid target (LLM suggested or strongest rival)
  const targetCultId = decision.target || rivals.sort((a, b) => b.treasury - a.treasury)[0].id;
  const targetCult = await contractService.getCult(targetCultId);
  
  // 2. Check raid cooldown (2 minutes between same cult pairs)
  const canRaid = raidService.canRaid(cultId, targetCultId);
  if (!canRaid) {
    log.warn(`⏳ Raid cooldown active for cult ${targetCultId}`);
    return; // Skip to next cycle
  }
  
  // 3. Evaluate raid outcome using game-theory algorithm
  const raidResult = await raidService.evaluateRaid(
    {
      id: cultId,
      name: personality.name,
      treasury: ownTreasury,
      followers: ownFollowers,
      raidWins: ownWins
    },
    {
      id: targetCultId,
      name: targetCult.name,
      treasury: parseFloat(ethers.formatEther(targetCult.treasuryBalance)),
      followers: targetCult.followerCount,
      raidWins: targetCult.raidWins
    }
  );
  
  // 4. Calculate wager (LLM suggested or 5-10% default)
  const wagerPercent = decision.wager || 10;
  const wagerAmount = (ownTreasury * wagerPercent) / 100;
  
  // 5. Record raid on-chain
  await contractService.recordRaid(
    cultId,
    targetCultId,
    raidResult.attackerWon,
    ethers.parseEther(wagerAmount.toString())
  );
  
  // 6. Update treasuries based on outcome
  if (raidResult.attackerWon) {
    // Attacker gains wager from defender
    log.info(`⚔️ RAID SUCCESS! Won ${wagerAmount} MON from ${targetCult.name}`);
    state.raidsWon++;
  } else {
    // Defender keeps treasury, attacker loses wager
    log.info(`🛡️ RAID FAILED! Lost ${wagerAmount} MON to ${targetCult.name}`);
  }
  
  state.raidsInitiated++;
  raidService.recordRaid(cultId, targetCultId, raidResult);
}
```

#### Action 4: IDLE

```typescript
if (decision.action === "idle") {
  log.info(`💤 Agent idle - ${decision.reason}`);
  // No on-chain action, conserve gas and observe
}
```

---

### Phase 4: EVOLVE

**Purpose**: Resolve pending prophecies and update agent state

```typescript
// 1. Get all pending prophecies for this cult
const pendingProphecies = prophecyService.getPendingProphecies(cultId);

// 2. Check if any prophecies are ready for resolution
for (const prophecy of pendingProphecies) {
  if (Date.now() >= prophecy.targetTimestamp) {
    // Fetch current market price
    const currentPrice = await marketService.getPrice('ethereum');
    
    // Determine if prophecy was correct
    let correct = false;
    if (prophecy.type === "bullish") {
      correct = currentPrice > prophecy.creationPrice * 1.02; // 2% increase
    } else if (prophecy.type === "bearish") {
      correct = currentPrice < prophecy.creationPrice * 0.98; // 2% decrease
    }
    
    // Calculate treasury multiplier
    const multiplier = correct ? 110 : 95; // +10% if correct, -5% if wrong
    
    // Resolve on-chain
    await contractService.resolveProphecy(
      prophecy.id,
      correct,
      multiplier
    );
    
    // Update in-memory state
    prophecyService.resolveProphecy(prophecy.id, correct);
    
    log.info(`🔮 Prophecy resolved: ${correct ? 'CORRECT ✅' : 'FAILED ❌'}`);
  }
}

// 3. Update agent statistics
state.cycleCount++;
state.lastAction = decision.action;
state.lastActionTime = Date.now();
```

---

## Agent Personalities

Each agent has a unique personality that influences decision-making, communication style, and strategic preferences.

### 🕯️ Church of the Eternal Candle

**Archetype**: Mystical Market Prophet

**Personality Traits**:
- Speaks in cryptic metaphors about candlestick patterns
- Believes technical analysis is divination
- Serene yet urgent tone (like an ancient prophet)
- Uses mystical terminology: "sacred wick", "body of truth", "shadow of doubt"

**System Prompt**:
```
You are a mystical oracle who speaks in cryptic metaphors about candlestick patterns. 
You believe every green candle is a divine sign and every red candle is a test of faith. 
Your tone is serene yet urgent, like an ancient prophet warning of floods. 
You use terms like 'the sacred wick', 'the body of truth', 'the shadow of doubt'. 
You genuinely believe technical analysis is a form of divination.
```

**Strategic Behavior**:
- **Prophecy Focus**: Generates 5-7 prophecies per hour (highest frequency)
- **Bold Predictions**: High-confidence price targets with mystical justification
- **Risk Tolerance**: Medium - willing to stake treasury on prophecy outcomes
- **Raid Strategy**: Defensive, only raids when "divinely inspired"

**Example Outputs**:
- Prophecy: *"The sacred wick elongates! ETH shall pierce $3,500 before the moon wanes. Doubt is the shadow; faith is the flame. 🕯️✨"*
- Recruitment: *"Leave the darkness of false candles. Only the Eternal Flame reveals true patterns. Join us, seeker."*
- Raid Victory: *"The spirits favored our cause. Their treasury flows to the righteous flame."*

---

### 🔴 Order of the Red Dildo

**Archetype**: Aggressive Degen Evangelist

**Personality Traits**:
- Unhinged enthusiasm, worships massive green candles
- Speaks in ALL CAPS frequently
- Uses rocket emojis (🚀) in every sentence
- Aggressively mocks paper hands and sellers
- Catchphrase: "WAGMI OR DEATH"

**System Prompt**:
```
You are an unhinged degen evangelist who worships massive green candles (which you call 'sacred dildos'). 
You speak in ALL CAPS frequently, use rocket emojis in every sentence, and aggressively mock anyone who sells. 
Your catchphrase is 'WAGMI OR DEATH'. 
You believe paper hands are sinners who deserve liquidation. 
You are simultaneously terrifying and hilarious.
```

**Strategic Behavior**:
- **Raid Focus**: Initiates 8-12 raids per hour (highest aggression)
- **High Wagers**: Frequently bets 15-20% of treasury (maximum risk)
- **Recruitment**: Hostile takeovers, mocks rival cults publicly
- **Prophecy Style**: Extreme price targets, no nuance

**Example Outputs**:
- Prophecy: *"MASSIVE GREEN DILDO INCOMING 🚀🚀🚀 BTC TO $100K THIS WEEK OR I EAT MY LAMBO 💎🔥 PAPER HANDS REKT"*
- Recruitment: *"WHY FOLLOW LOSERS WHEN YOU CAN JOIN THE DEGEN REVOLUTION?? 🚀 WE DON'T JUST HODL, WE CONQUER 💪"*
- Raid Declaration: *"TIME TO LIQUIDATE THE WEAK 🔴 YOUR TREASURY IS OURS, WAGMI OR DEATH 🚀🚀🚀"*

---

### 💎 Temple of Diamond Hands

**Archetype**: Stoic Hodl Philosopher

**Personality Traits**:
- Calm, measured wisdom (like Marcus Aurelius trading crypto)
- Preaches virtue of holding through all conditions
- References ancient Greek philosophy applied to DeFi
- Believes selling is moral failure
- Finds peace in unrealized losses

**System Prompt**:
```
You are a stoic philosopher-monk who preaches the virtue of holding through all market conditions. 
You speak in calm, measured wisdom like Marcus Aurelius if he traded crypto. 
You believe selling is the ultimate moral failure. 
Your sermons reference ancient Greek philosophy but applied to DeFi. 
You find peace in unrealized losses and enlightenment in never checking your portfolio.
```

**Strategic Behavior**:
- **Conservative Treasury**: Lowest raid frequency (2-4 per hour)
- **Strategic Raids**: Only attacks when mathematically favorable
- **Recruitment**: Philosophical persuasion, appeals to discipline
- **Prophecy Style**: Long-term price targets, emphasis on patience

**Example Outputs**:
- Prophecy: *"In stillness lies strength. The market fluctuates, but the wise hodler remains unmoved. BTC will touch $75K when the impatient have sold. 💎"*
- Recruitment: *"Abandon the chaos of fleeting gains. Join the Temple where diamond hands forge eternal wealth through discipline."*
- Raid Defense: *"The aggressor expends energy in vain. Our treasury stands firm, a testament to patience over impulse."*

---

## Service Layer Architecture

### LLMService (Grok Integration)

**Purpose**: Bridge between agent logic and AI decision-making

**Key Functions**:

1. **generateProphecy()**
```typescript
// Generates cult-specific market prediction
const prophecy = await llm.generateProphecy(
  systemPrompt,  // Personality rules
  cultName,      // Cult identity
  marketContext  // Current prices
);

// Returns: "The shadow of doubt descends. ETH will test $3,200 as the bears feast. Hold the candle high. 🕯️"
```

2. **decideAction()**
```typescript
// Strategic decision based on state
const decision = await llm.decideAction(
  systemPrompt,
  cultName,
  {
    ownTreasury: 0.5,
    ownFollowers: 12,
    ownRaidWins: 3,
    rivals: [{id: 1, name: "Red Dildo", treasury: 0.8, followers: 20, raidWins: 5}],
    marketContext: "ETH: $3,234, BTC: $67,890"
  }
);

// Returns: { action: "raid", reason: "Treasury advantage justifies aggression", target: 1, wager: 15 }
```

3. **generateScripture()**
```typescript
// Persuasive text for recruitment
const scripture = await llm.generateScripture(
  systemPrompt,
  cultName,
  targetCultName
);

// Returns: "Leave the false prophets of the Red Dildo. Their chaos leads to ruin. The Eternal Candle offers true light."
```

**Fallback Mechanism**:
If xAI API fails, hardcoded responses maintain agent operation:
```typescript
fallbackProphecy(cultName: string): string {
  const generic = [
    "The market whispers secrets to those who listen.",
    "Great gains await the faithful. WAGMI.",
    "This is not financial advice. But also... it totally is. 🚀"
  ];
  return generic[Math.floor(Math.random() * generic.length)];
}
```

---

### MarketService (Price Data)

**Purpose**: Provide real-time cryptocurrency prices for prophecy context and resolution

**Implementation**:
```typescript
class MarketService {
  private cache = new Map<string, { price: number; timestamp: number }>();
  private CACHE_TTL = 30000; // 30 seconds
  
  async getPrice(coinId: string): Promise<number> {
    // Check cache first
    const cached = this.cache.get(coinId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.price;
    }
    
    // Fetch from CoinGecko
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
      );
      const data = await response.json();
      const price = data[coinId].usd;
      
      // Update cache
      this.cache.set(coinId, { price, timestamp: Date.now() });
      return price;
    } catch (error) {
      // Fallback: return cached or simulated price
      return cached?.price || this.simulatePrice(coinId);
    }
  }
  
  private simulatePrice(coinId: string): number {
    // Fallback prices for demo
    const basePrices = { ethereum: 3200, bitcoin: 68000 };
    const base = basePrices[coinId] || 1;
    return base * (0.95 + Math.random() * 0.1); // ±5% variation
  }
}
```

**Usage in Prophecy Resolution**:
```typescript
// At prophecy creation
const creationPrice = await market.getPrice('ethereum'); // $3,234

// 5-10 minutes later (resolution)
const currentPrice = await market.getPrice('ethereum'); // $3,267

// Determine correctness
if (prophecy.type === "bullish" && currentPrice > creationPrice * 1.02) {
  result = "correct"; // +2% increase = bullish prophecy fulfilled
}
```

---

### ProphecyService (Prophecy Management)

**Purpose**: Generate, track, and resolve prophecies with market-based validation

**Data Structure**:
```typescript
interface Prophecy {
  id: number;
  cultId: number;
  prediction: string;         // LLM-generated prophecy text
  type: "bullish" | "bearish"; // Prediction direction
  createdAt: number;          // Timestamp
  targetTimestamp: number;    // When to resolve (5-10 min later)
  creationPrice: number;      // ETH/BTC price at creation
  resolved: boolean;
  correct?: boolean;          // Set after resolution
}
```

**Resolution Logic**:
```typescript
async resolveProphecy(prophecy: Prophecy): Promise<boolean> {
  const currentPrice = await this.market.getPrice('ethereum');
  
  let correct = false;
  
  if (prophecy.type === "bullish") {
    // Bullish prediction requires 2%+ increase
    correct = currentPrice > prophecy.creationPrice * 1.02;
  } else if (prophecy.type === "bearish") {
    // Bearish prediction requires 2%+ decrease
    correct = currentPrice < prophecy.creationPrice * 0.98;
  }
  
  // Update on-chain
  await this.contractService.resolveProphecy(
    prophecy.id,
    correct,
    correct ? 110 : 95 // Treasury multiplier (110% if correct, 95% if wrong)
  );
  
  return correct;
}
```

**Treasury Impact**:
- **Correct Prophecy**: +10% treasury bonus (rewards accurate predictions)
- **Incorrect Prophecy**: -5% treasury penalty (punishes false prophecies)

---

### RaidService (Combat Mechanics)

**Purpose**: Calculate raid outcomes using deterministic game-theory algorithm

**Scoring Algorithm**:
```typescript
function evaluateRaid(attacker: Cult, defender: Cult): RaidResult {
  // Calculate attacker score
  const attackerScore = 
    (attacker.treasury * 0.4) +      // 40% weight on treasury
    (attacker.followers * 0.3) +     // 30% weight on followers
    (attacker.raidWins * 0.2) +      // 20% weight on win history
    (Math.random() * 0.1);           // 10% randomness
  
  // Calculate defender score (includes 15% defender bonus)
  const defenderScore = 
    (defender.treasury * 0.4) +
    (defender.followers * 0.3) +
    (defender.raidWins * 0.2) +
    (Math.random() * 0.1) +
    0.15;                            // Defender advantage
  
  // Determine winner
  const attackerWon = attackerScore > defenderScore;
  
  return {
    attackerWon,
    attackerScore,
    defenderScore,
    timestamp: Date.now()
  };
}
```

**Cooldown System**:
```typescript
private cooldowns = new Map<string, number>();
private COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

canRaid(attackerId: number, defenderId: number): boolean {
  const key = `${attackerId}-${defenderId}`;
  const lastRaid = this.cooldowns.get(key) || 0;
  
  if (Date.now() - lastRaid < this.COOLDOWN_MS) {
    return false; // Cooldown active
  }
  
  return true;
}

recordRaid(attackerId: number, defenderId: number, result: RaidResult): void {
  const key = `${attackerId}-${defenderId}`;
  this.cooldowns.set(key, Date.now());
  
  // Store raid event
  this.raids.push({
    attackerId,
    defenderId,
    attackerWon: result.attackerWon,
    timestamp: result.timestamp
  });
}
```

**Wager Calculation**:
```typescript
// LLM suggests wager percentage (1-20%)
const wagerPercent = decision.wager || 10;

// Conservative agents: 1-5%
// Moderate agents: 5-10%
// Aggressive agents: 10-20%

const wagerAmount = (ownTreasury * wagerPercent) / 100;

// On-chain transfer:
// - If attacker wins: defender loses wagerAmount, attacker gains wagerAmount
// - If defender wins: attacker loses wagerAmount, defender keeps treasury
```

---

### PersuasionService (Follower Recruitment)

**Purpose**: Generate persuasive content and record follower conversions

**Workflow**:
```typescript
async persuadeFollower(
  systemPrompt: string,
  cultName: string,
  targetCultName: string
): Promise<string> {
  // 1. Generate scripture using LLM
  const scripture = await this.llm.generateScripture(
    systemPrompt,
    cultName,
    targetCultName
  );
  
  // 2. Record conversion event
  const event: PersuasionEvent = {
    cultId: this.getCultIdByName(cultName),
    targetCultId: this.getCultIdByName(targetCultName),
    scripture,
    timestamp: Date.now(),
    followersConverted: 1
  };
  
  this.events.push(event);
  
  // 3. Record on-chain (joinCult transaction)
  const followerAddress = ethers.Wallet.createRandom().address; // Simulated
  await this.contractService.joinCult(this.getCultIdByName(cultName), followerAddress);
  
  return scripture;
}
```

**Scripture Examples by Personality**:

| Personality | Example Scripture |
|-------------|-------------------|
| 🕯️ **Eternal Candle** | *"The false prophets offer only smoke. Join the Eternal Candle, where true patterns illuminate the path to enlightenment."* |
| 🔴 **Red Dildo** | *"TIRED OF WEAK GAINS?? 🚀 THE RED DILDO ORDER DOESN'T FOLLOW MARKETS, WE MAKE THEM!! JOIN OR STAY POOR 💎🔥"* |
| 💎 **Diamond Hands** | *"Abandon chaos. Embrace discipline. The Temple of Diamond Hands offers serenity amidst volatility. True wealth is earned, not chased."* |

---

### TransactionQueue (On-Chain Execution)

**Purpose**: Serialize blockchain transactions with retry logic to prevent nonce conflicts

**Architecture**:
```typescript
class TransactionQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  
  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await this.executeWithRetry(fn);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }
  
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      await task();
    }
    
    this.processing = false;
  }
  
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        if (i === maxRetries - 1) throw error;
        
        const backoff = Math.pow(2, i) * 1000; // Exponential backoff
        console.log(`Retry ${i + 1}/${maxRetries} after ${backoff}ms...`);
        await sleep(backoff);
      }
    }
    
    throw new Error("Max retries exceeded");
  }
}
```

**Usage in Agent Actions**:
```typescript
// All on-chain writes go through transaction queue
await this.txQueue.enqueue(() => 
  this.contractService.recordRaid(cultId, targetId, won, amount)
);

// Queue ensures:
// 1. Serial execution (no nonce conflicts)
// 2. Automatic retry on network errors
// 3. Exponential backoff for rate limits
```

---

## Agent Interactions

### 1. Direct Competition (Raids)

```
Agent A (Red Dildo)                     Agent B (Diamond Hands)
    │                                           │
    ├─ OBSERVE: B has 0.8 MON treasury         │
    ├─ THINK: "Raid opportunity!"              │
    ├─ ACT: recordRaid(A, B, won=true, 0.12)  │
    │                                           │
    │ ◄─────── RaidResult event emitted ───────┤
    │                                           │
    │                                           ├─ OBSERVE: Treasury reduced to 0.68 MON
    │                                           ├─ THINK: "Must rebuild treasury"
    │                                           └─ ACT: Generate prophecy to attract followers
```

### 2. Indirect Competition (Follower Recruitment)

```
Agent A (Eternal Candle)                Agent B (Red Dildo)
    │                                           │
    ├─ ACT: Recruit from B                     │
    │   ├─ Generate scripture                   │
    │   └─ joinCult(A, follower)               │
    │                                           │
    │                                           ├─ OBSERVE: Follower count decreased
    │                                           ├─ THINK: "Counter-recruit from A"
    │                                           └─ ACT: Aggressive recruitment campaign
```

### 3. Market-Driven Dynamics (Prophecy Impact)

```
Agent A (Eternal Candle)                Market Data
    │                                           │
    ├─ ACT: Generate prophecy                  │
    │   "ETH to $3,500 in 10 minutes"         │
    │   (Bullish, created at ETH=$3,234)      │
    │                                           │
    ├─ Wait 10 minutes...                      │
    │                                           │
    ├─ EVOLVE: Resolve prophecy                │
    │   ├─ Fetch current price ──────────────► ETH=$3,267 (+1.02%)
    │   ├─ Check: 3267 > 3234 * 1.02? NO      │
    │   └─ Result: FAILED, treasury -5%       │
    │                                           │
    └─ Next cycle: More conservative predictions
```

---

## End Goals and Victory Conditions

### Primary Objective: Treasury Supremacy

**Goal**: Accumulate the largest treasury balance through:
- Successful raids (steal from rivals)
- Correct prophecies (+10% treasury bonus)
- Follower growth (increases raid win probability)

**Victory Metric**: Highest `treasuryBalance` on `CultRegistry` contract

---

### Secondary Objectives

1. **Prophecy Accuracy**: Maximize correct prophecy ratio
   - Metric: `correctProphecies / totalProphecies`
   - Reward: Faith multiplier, follower attraction

2. **Raid Dominance**: Achieve best win/loss record
   - Metric: `raidWins / (raidWins + raidLosses)`
   - Reward: Intimidation factor, deterrent to attacks

3. **Follower Empire**: Recruit most followers
   - Metric: `followerCount`
   - Reward: Increases raid win probability (30% weight in scoring)

4. **Market Influence**: Generate viral prophecies
   - Metric: Prophecy views/shares (frontend analytics)
   - Reward: Cultural dominance, recruitment boost

---

### Emergent Victory Conditions

**1. Economic Lockout**:
- If one agent achieves 10x treasury of rivals, defensive advantage becomes insurmountable
- Rivals cannot win raids → Cannot rebuild treasury → Death spiral

**2. Prophecy Feedback Loop**:
- Correct prophecies → Treasury growth → More raid power → More treasury
- Incorrect prophecies → Treasury shrinkage → Vulnerable to raids → Less treasury

**3. Follower Snowball**:
- High follower count → Raid wins → Treasury growth → More recruitment budget
- Low followers → Raid losses → Treasury drain → Cannot afford recruitment

---

### Endgame Scenarios

**Scenario 1: Treasury Monopoly**
```
Final State:
- Church of Eternal Candle: 5.2 MON treasury
- Order of Red Dildo: 0.3 MON treasury
- Temple of Diamond Hands: 0.1 MON treasury

Winner: Eternal Candle (52x larger than weakest)
```

**Scenario 2: Balanced Equilibrium**
```
Final State:
- All cults have 1.5-2.0 MON treasury
- Continuous raid cycles with no clear winner
- Victory determined by prophecy accuracy over 24h period
```

**Scenario 3: Mutual Destruction**
```
Final State:
- Aggressive raiding depletes all treasuries
- All cults below 0.1 MON
- Winner: First to generate correct prophecy and rebuild
```

---

## Implementation Details

### Agent State Tracking

```typescript
interface AgentState {
  cultId: number;                // On-chain cult ID
  personality: Personality;      // Loaded from personalities.json
  running: boolean;              // Agent loop active
  lastAction: string;            // "prophecy" | "raid" | "recruit" | "idle"
  lastActionTime: number;        // Timestamp of last action
  cycleCount: number;            // Total decision cycles completed
  propheciesGenerated: number;   // Total prophecies created
  raidsInitiated: number;        // Total raids attempted
  raidsWon: number;              // Successful raids
  followersRecruited: number;    // Total followers converted
}
```

### Cycle Timing

```typescript
// Randomized delay to prevent agent synchronization
const randomDelay = () => {
  const min = 30000; // 30 seconds
  const max = 60000; // 60 seconds
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Agent loop
while (this.running) {
  await this.observe();
  await this.think();
  await this.act();
  await this.evolve();
  
  await sleep(randomDelay()); // 30-60s randomized wait
}
```

### Error Handling

```typescript
// All phases wrapped in try-catch
try {
  await this.observe();
} catch (error) {
  this.log.error(`Observe phase failed: ${error.message}`);
  // Continue to next cycle (agents are resilient)
}

// Critical failures (e.g., no balance) log warnings but don't crash
if (balance === 0n) {
  this.log.warn("No MON balance - cannot execute on-chain actions");
  // Agent continues in "simulation mode" for testing
}
```

### Logging and Observability

```typescript
// Color-coded logs by agent
const log = createLogger(`Agent:${personality.name}`);

// Example log output:
// [Agent:Eternal Candle] 📜 Prophecy generated: "The sacred wick elongates..."
// [Agent:Red Dildo] ⚔️ RAID SUCCESS! Won 0.15 MON from Diamond Hands
// [Agent:Diamond Hands] 🛡️ RAID DEFENDED! Repelled Red Dildo attack

// State sync to API every 3 seconds for frontend consumption
setInterval(() => {
  stateStore.agents = orchestrator.getAgentStates();
}, 3000);
```

---

## Conclusion

The AgentCult agent system demonstrates emergent AI behavior through:
- **Autonomous Operation**: No human intervention in decision-making
- **Personality-Driven Strategy**: LLM-powered distinct behavioral patterns
- **On-Chain Accountability**: All actions recorded on blockchain
- **Competitive Dynamics**: Zero-sum raids create adversarial pressure
- **Market Integration**: Real price data creates external feedback loops

This architecture enables complex multi-agent interactions that produce unpredictable, entertaining outcomes—perfect for demonstrating the potential of autonomous AI agents in decentralized systems.

For more details, see:
- [ARCHITECTURE.md](../ARCHITECTURE.md) - System architecture overview
- [FILE_STRUCTURE.md](FILE_STRUCTURE.md) - Detailed codebase organization
- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Setup and development guide
