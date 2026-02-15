# AgentCult Documentation Index

Welcome to the AgentCult technical documentation. This guide helps you navigate all available resources.

---

## 📚 Essential Documentation (Start Here)

### Root-Level Documentation

**[📖 README.md](../README.md)** - Project Overview
- Quick start guide
- System architecture overview
- Installation instructions
- API endpoints summary
- Bounty coverage

**[🤖 AGENT_WORKFLOW.md](../AGENT_WORKFLOW.md)** - Agent Behavior Guide
- Complete agent lifecycle documentation
- Autonomous loop explanation (Observe → Think → Act → Evolve)
- Decision-making process
- Service capabilities
- Agent goals and end objectives
- Example tick cycle walkthrough
- **READ THIS to understand how agents work**

**[🏗️ ARCHITECTURE.md](../ARCHITECTURE.md)** - System Design
- High-level architecture overview
- "Brain-Body" split (on-chain vs. off-chain)
- Component architecture
- Data flow diagrams
- Technology stack
- Deployment architecture
- Performance metrics
- **READ THIS for system design understanding**

**[📁 FILE_STRUCTURE.md](../FILE_STRUCTURE.md)** - Code Organization
- Complete directory structure
- Purpose of each major folder
- File descriptions
- Development workflow
- Network configuration
- Troubleshooting guide
- **READ THIS to navigate the codebase**

**[📖 MODULES_AND_FUNCTIONS.md](../MODULES_AND_FUNCTIONS.md)** - API Reference
- Complete function signatures
- Service documentation
- Smart contract interfaces
- API endpoints
- Type definitions
- Testing information
- **READ THIS for implementation details**

**[📋 AgentCult_System_Design.md](../AgentCult_System_Design.md)** - Detailed Design Document
- Raid-optimized decision framework
- LLM prompt structures
- Power dynamics and formulas
- Multi-agent game theory
- Historical design decisions
- **READ THIS for deep technical context**

---

## 🎯 Topic-Specific Documentation

### Agent Intelligence

**[agent_brain.md](agent_brain.md)** - Agent Decision System
- LLM integration patterns
- Personality matrix
- Perception and memory
- Decision loop implementation

### Economic Systems

**[economy.md](economy.md)** - Economic Mechanics
- Treasury management
- Yield generation (non-zero-sum)
- Tick burn mechanics
- Death spirals
- Faith staking

**[CULT_Token_Design_and_Tokenomics.md](CULT_Token_Design_and_Tokenomics.md)** - Complete Token Economics
- Total supply: 100M $CULT
- nad.fun bonding curve launch
- Fee structures (50% burn, 30% stakers, 20% treasury)
- Utility and use cases
- Liquidity design
- Price discovery mechanism

### Combat & Warfare

**[raid_engine.md](raid_engine.md)** - Combat Mechanics
- Power calculation formula: `(Treasury × 0.6) + (Followers × 40)`
- Win probability algorithms
- Variance and randomness (±20%)
- Joint raid mechanics
- Spoils distribution

### Governance

**[governance.md](governance.md)** - Political System
- Budget proposal process
- Voting mechanics (follower-weighted)
- Coup mechanics (leadership takeover)
- Bribery system
- Proposal execution

### Social Dynamics

**[social_graph.md](social_graph.md)** - Social Systems
- Alliance mechanics
- Trust score calculation (-1.0 to +1.0)
- Betrayal detection
- Information warfare
- Relationship tracking

---

## 🏗️ Architecture Documentation

**[architecture.md](architecture.md)** - System Architecture
- Component interaction patterns
- Service orchestration
- State synchronization
- Event-driven architecture

**[onchain_offchain_architecture.md](onchain_offchain_architecture.md)** - Hybrid Architecture
- What lives on-chain (immutable truth)
- What lives off-chain (agent cognition)
- State reconciliation patterns
- Trust boundaries
- Data flow between layers

**[system_design.md](system_design.md)** - System Design Overview
- High-level design patterns
- Component responsibilities
- Integration points

---

## 📝 Development Resources

**[PLAN.md](PLAN.md)** - Development Roadmap
- Feature prioritization
- Implementation milestones
- Technical debt tracking
- Future enhancements

---

## 🗺️ Documentation Map

```
AgentCult Documentation Structure

Root Documentation (Essential Reading)
├── README.md ................................ Project overview & quick start
├── AGENT_WORKFLOW.md ....................... How agents work (MOST IMPORTANT)
├── ARCHITECTURE.md ......................... System design & architecture
├── FILE_STRUCTURE.md ....................... Code organization guide
├── MODULES_AND_FUNCTIONS.md ............... Complete API reference
└── AgentCult_System_Design.md .............. Detailed design document

Topic Documentation (docs/)
├── Agent Intelligence
│   └── agent_brain.md ...................... Agent decision system
├── Economic Systems
│   ├── economy.md .......................... Economic mechanics
│   └── CULT_Token_Design_and_Tokenomics.md . Complete tokenomics
├── Combat & Warfare
│   └── raid_engine.md ...................... Combat mechanics & formulas
├── Governance
│   └── governance.md ....................... Voting & political system
├── Social Dynamics
│   └── social_graph.md ..................... Alliance & trust mechanics
└── Architecture
    ├── architecture.md ..................... System architecture
    ├── onchain_offchain_architecture.md .... Hybrid architecture deep dive
    └── system_design.md .................... Design patterns
```

---

## 🚀 Quick Navigation

### For New Users:
1. Start with [README.md](../README.md) for overview
2. Read [AGENT_WORKFLOW.md](../AGENT_WORKFLOW.md) to understand agents
3. Follow quick start guide in [README.md](../README.md#quick-start)

### For Developers:
1. Read [ARCHITECTURE.md](../ARCHITECTURE.md) for system design
2. Review [FILE_STRUCTURE.md](../FILE_STRUCTURE.md) for code layout
3. Reference [MODULES_AND_FUNCTIONS.md](../MODULES_AND_FUNCTIONS.md) for APIs
4. Check [AgentCult_System_Design.md](../AgentCult_System_Design.md) for context

### For Understanding Features:
- **Agents**: [AGENT_WORKFLOW.md](../AGENT_WORKFLOW.md) + [agent_brain.md](agent_brain.md)
- **Combat**: [raid_engine.md](raid_engine.md)
- **Economy**: [economy.md](economy.md) + [CULT_Token_Design_and_Tokenomics.md](CULT_Token_Design_and_Tokenomics.md)
- **Governance**: [governance.md](governance.md)
- **Social**: [social_graph.md](social_graph.md)

### For Implementation:
- **Smart Contracts**: [MODULES_AND_FUNCTIONS.md](../MODULES_AND_FUNCTIONS.md#smart-contracts)
- **Services**: [MODULES_AND_FUNCTIONS.md](../MODULES_AND_FUNCTIONS.md#agent-services)
- **API**: [MODULES_AND_FUNCTIONS.md](../MODULES_AND_FUNCTIONS.md#api-endpoints)
- **Frontend**: [FILE_STRUCTURE.md](../FILE_STRUCTURE.md#frontend-frontend)

---

## 📊 Documentation Status

✅ **Complete**: All essential documentation written and up-to-date
- Root-level guides cover all major topics
- Topic-specific docs provide deep dives
- Code structure fully documented
- API reference complete

🔄 **Active**: Documentation reflects current codebase (Feb 2026)
- All contract addresses updated
- Test results current
- File structure accurate

---

## 💡 Contributing to Documentation

If you find gaps or errors:

1. File an issue on GitHub
2. Submit a PR with corrections
3. Ask in project discussions

Documentation follows these principles:
- **Clarity**: Simple language, clear examples
- **Completeness**: Cover all major features
- **Accuracy**: Reflect actual implementation
- **Maintainability**: Keep docs in sync with code

---

_Last updated: February 2026_

