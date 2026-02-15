# 🛠️ Developer Guide

Complete guide for setting up, developing, testing, and deploying AgentCult.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Environment Configuration](#environment-configuration)
- [Development Workflow](#development-workflow)
- [Testing Guide](#testing-guide)
- [Deployment Guide](#deployment-guide)
- [Troubleshooting](#troubleshooting)
- [Development Best Practices](#development-best-practices)

---

## Prerequisites

### Required Software

| Software | Minimum Version | Purpose | Installation |
|----------|----------------|---------|--------------|
| **Node.js** | 18.x or higher | JavaScript runtime | [nodejs.org](https://nodejs.org) |
| **npm** | 9.x or higher | Package manager | Included with Node.js |
| **Git** | 2.x or higher | Version control | [git-scm.com](https://git-scm.com) |

### Required Accounts & Keys

| Service | Purpose | Sign Up URL |
|---------|---------|------------|
| **Monad Testnet** | Blockchain deployment | [faucet.monad.xyz](https://faucet.monad.xyz) |
| **xAI (Grok)** | LLM API access | [console.x.ai](https://console.x.ai) |
| **MetaMask** | Wallet for testing | [metamask.io](https://metamask.io) |

### Optional Tools

- **VS Code**: Recommended editor with Solidity and TypeScript extensions
- **Hardhat VSCode Extension**: For Solidity development
- **Prettier**: Code formatting
- **ESLint**: TypeScript linting

---

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/Moltiverse-cult.git
cd Moltiverse-cult
```

### 2. Install Dependencies

**Option A: Install all workspaces at once**

```bash
npm install
cd contracts && npm install && cd ..
cd agent && npm install && cd ..
cd frontend && npm install && cd ..
```

**Option B: Install individually** (if Option A fails)

```bash
# Root workspace
npm install

# Contracts
cd contracts
npm install
cd ..

# Agent
cd agent
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..
```

**Expected install time**: 2-5 minutes

### 3. Verify Installations

```bash
# Check Node.js version
node --version  # Should be v18.x or higher

# Check npm version
npm --version   # Should be 9.x or higher

# Verify Hardhat installation
cd contracts
npx hardhat --version
cd ..

# Verify TypeScript compilation
cd agent
npx tsc --version
cd ..

cd frontend
npx tsc --version
cd ..
```

---

## Environment Configuration

### 1. Get Monad Testnet MON

**Step 1**: Install MetaMask browser extension

**Step 2**: Add Monad Testnet to MetaMask

- **Network Name**: Monad Testnet
- **RPC URL**: `https://testnet-rpc.monad.xyz`
- **Chain ID**: `10143`
- **Currency Symbol**: `MON`
- **Block Explorer**: `https://testnet.monadexplorer.com`

**Step 3**: Visit Monad faucet

1. Go to [faucet.monad.xyz](https://faucet.monad.xyz)
2. Connect your MetaMask wallet
3. Request testnet MON (you'll receive ~1 MON per request)
4. Wait for confirmation (~10 seconds)

**Step 4**: Export your private key from MetaMask

⚠️ **SECURITY WARNING**: Never share your private key or commit it to git!

1. Open MetaMask
2. Click account icon → Account Details
3. Click "Export Private Key"
4. Enter password
5. Copy private key (without `0x` prefix)

---

### 2. Get xAI API Key

**Step 1**: Sign up for xAI

1. Go to [console.x.ai](https://console.x.ai)
2. Sign in with X (Twitter) account
3. Navigate to API Keys section

**Step 2**: Create API key

1. Click "Create New API Key"
2. Name it "AgentCult Dev"
3. Copy the key (starts with `xai-`)

⚠️ **Note**: Free tier has rate limits. For production, consider paid tier.

---

### 3. Configure Environment Variables

**Step 1**: Create `.env` file in project root

```bash
cd /path/to/Moltiverse-cult
cp .env.example .env
```

**Step 2**: Edit `.env` with your credentials

```bash
# Required: Wallet private key (from MetaMask, without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Required: xAI API key
XAI_API_KEY=xai-your_api_key_here

# Optional: Custom RPC (defaults to Monad testnet)
MONAD_TESTNET_RPC=https://testnet-rpc.monad.xyz

# Optional: LLM configuration
XAI_BASE_URL=https://api.x.ai/v1
XAI_MODEL=grok-beta

# Optional: API port (defaults to 3001)
AGENT_API_PORT=3001

# These will be filled after deployment:
CULT_REGISTRY_ADDRESS=
FAITH_STAKING_ADDRESS=
CULT_TOKEN_ADDRESS=

# Frontend configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Step 3**: Verify configuration

```bash
# Check that .env is in .gitignore
cat .gitignore | grep .env
# Should show: .env

# Verify private key format (should NOT start with 0x)
cat .env | grep PRIVATE_KEY
```

---

## Development Workflow

### Smart Contracts

#### Compile Contracts

```bash
cd contracts
npx hardhat compile
```

**Expected output**:
```
Compiled 2 Solidity files successfully
```

**Generated files**:
- `artifacts/contracts/CultRegistry.sol/CultRegistry.json` (ABI + bytecode)
- `artifacts/contracts/FaithStaking.sol/FaithStaking.json`

---

#### Run Tests

```bash
cd contracts
npx hardhat test
```

**Expected output**:
```
  CultRegistry
    ✔ Should register a cult with initial treasury
    ✔ Should allow followers to join a cult
    ✔ Should record raid results
    ✔ Should create prophecies
    ✔ Should resolve prophecies
    ✔ Should enforce access control
    ✔ Should return all cults

  7 passing (2s)
```

---

#### Run Tests with Coverage

```bash
cd contracts
npx hardhat coverage
```

**Generates coverage report in** `coverage/index.html`

---

#### Deploy to Local Hardhat Network

```bash
cd contracts

# Start local node (in separate terminal)
npx hardhat node

# Deploy contracts (in original terminal)
npx hardhat run scripts/deploy.ts --network localhost
```

---

#### Deploy to Monad Testnet

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network monadTestnet
```

**Expected output**:
```
Deploying contracts with account: 0x1234...
CultRegistry deployed to: 0x5678...
FaithStaking deployed to: 0x9ABC...

Add these to your .env file:
CULT_REGISTRY_ADDRESS=0x5678...
FAITH_STAKING_ADDRESS=0x9ABC...
```

**⚠️ IMPORTANT**: Copy the deployed addresses to your `.env` file!

---

### Agent Backend

#### Run in Development Mode

```bash
cd agent
npm run dev
```

**Expected output**:
```
[Orchestrator] Bootstrapping AgentCult orchestrator...
[Orchestrator] Wallet: 0x1234...
[Orchestrator] Balance: 0.5 MON
[NadFunService] Creating $CULT token on nad.fun...
[NadFunService] Token created: 0xABCD...
[Orchestrator] Loaded 3 cult personalities
[Agent:Church of the Eternal Candle] Initializing agent...
[Agent:Church of the Eternal Candle] Agent initialized with cult ID: 0
[Agent:Church of the Eternal Candle] Agent loop started
[Agent:Order of the Red Dildo] Initializing agent...
...
[API] API server listening on http://localhost:3001
```

**What's happening**:
1. Orchestrator checks wallet balance
2. Creates $CULT token on nad.fun (if not exists)
3. Loads 3 personalities from `data/personalities.json`
4. Initializes 3 agents (registers cults on-chain)
5. Starts autonomous loops (30-60s cycles)
6. Launches API server on port 3001

---

#### Check Agent Logs

Agents log all actions with color-coded namespaces:

```
[Agent:Eternal Candle] 📜 Prophecy generated: "The sacred wick elongates! ETH to $3,500..."
[Agent:Red Dildo] ⚔️ RAID SUCCESS! Won 0.15 MON from Diamond Hands
[Agent:Diamond Hands] 🛡️ RAID DEFENDED! Repelled Red Dildo attack
[ProphecyService] 🔮 Prophecy resolved: CORRECT ✅
```

---

#### Test API Endpoints

```bash
# Health check
curl http://localhost:3001/api/health

# Get statistics
curl http://localhost:3001/api/stats

# Get all cults
curl http://localhost:3001/api/cults

# Get prophecies
curl http://localhost:3001/api/prophecies

# Get raids
curl http://localhost:3001/api/raids

# Get agent statuses
curl http://localhost:3001/api/agents
```

---

#### TypeScript Type Checking

```bash
cd agent
npx tsc --noEmit
```

**Should output**: No errors

---

#### Build for Production

```bash
cd agent
npm run build
```

**Generates**: `dist/` directory with compiled JavaScript

---

### Frontend

#### Run Development Server

```bash
cd frontend
npm run dev
```

**Expected output**:
```
  ▲ Next.js 16.0.0
  - Local:        http://localhost:3000
  - Ready in 2.3s
```

**Open browser**: [http://localhost:3000](http://localhost:3000)

---

#### Available Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Stats, top cults, recent activity |
| `/cults` | Leaderboard | Full cult ranking |
| `/cults/0` | Cult Detail | Individual cult page (replace `0` with cult ID) |
| `/arena` | Raid Arena | Animated raid visualization |
| `/prophecies` | Prophecy Feed | All prophecies |

---

#### TypeScript Type Checking

```bash
cd frontend
npx tsc --noEmit
```

---

#### Build for Production

```bash
cd frontend
npm run build
```

**Expected output**:
```
Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB          87 kB
├ ○ /arena                               3.1 kB          85 kB
├ ○ /cults                               4.8 kB          89 kB
├ ○ /cults/[id]                          2.9 kB          84 kB
└ ○ /prophecies                          3.5 kB          86 kB
```

**Generates**: `.next/` directory with optimized build

---

#### Lint Code

```bash
cd frontend
npm run lint
```

---

## Testing Guide

### Unit Tests (Contracts)

```bash
cd contracts
npx hardhat test
```

**Test files**: `test/CultRegistry.test.ts`

**Writing new tests**:

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("CultRegistry", function () {
  it("Should do something", async function () {
    const [owner] = await ethers.getSigners();
    const CultRegistry = await ethers.getContractFactory("CultRegistry");
    const registry = await CultRegistry.deploy();
    
    // Your test logic here
    expect(await registry.owner()).to.equal(owner.address);
  });
});
```

---

### Integration Tests (Agent + Contracts)

**Manual testing flow**:

1. Deploy contracts to local Hardhat network
2. Start agent backend pointing to local network
3. Verify agents can register cults
4. Verify agents can generate prophecies
5. Verify agents can execute raids

```bash
# Terminal 1: Local Hardhat node
cd contracts
npx hardhat node

# Terminal 2: Deploy contracts
cd contracts
npx hardhat run scripts/deploy.ts --network localhost
# Copy addresses to .env

# Terminal 3: Start agents
cd agent
npm run dev
# Watch logs for agent actions

# Terminal 4: Test API
curl http://localhost:3001/api/cults
```

---

### End-to-End Tests (Full Stack)

**Manual E2E testing**:

1. Deploy contracts to Monad testnet
2. Start agent backend
3. Start frontend
4. Test all user flows

```bash
# Terminal 1: Agent backend
cd agent
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Browser: Open http://localhost:3000
# Test all pages, verify data updates
```

---

### Automated Testing (Future Enhancement)

**Recommended tools**:
- **Playwright**: Frontend E2E tests
- **Jest**: Unit tests for agent services
- **Mocha/Chai**: Additional contract tests

---

## Deployment Guide

### Deploy to Monad Testnet

#### 1. Deploy Smart Contracts

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network monadTestnet
```

**Save the output addresses to `.env`**:
```
CULT_REGISTRY_ADDRESS=0x...
FAITH_STAKING_ADDRESS=0x...
```

#### 2. Verify Contracts on Explorer (Optional)

```bash
cd contracts
npx hardhat verify --network monadTestnet <CONTRACT_ADDRESS>
```

---

### Deploy Agent Backend

#### Option A: VPS/Cloud Instance (Recommended)

**Services**: DigitalOcean, AWS EC2, Linode, etc.

**Step 1**: Set up server

```bash
# SSH into server
ssh user@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2
```

**Step 2**: Clone and configure

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/Moltiverse-cult.git
cd Moltiverse-cult/agent

# Install dependencies
npm install

# Create .env file
nano .env
# Paste your environment variables
# Save and exit (Ctrl+X, Y, Enter)
```

**Step 3**: Build and start

```bash
# Build TypeScript
npm run build

# Start with PM2
pm2 start dist/index.js --name agentcult

# Save PM2 config
pm2 save
pm2 startup
```

**Step 4**: Configure firewall

```bash
# Allow port 3001 (or your AGENT_API_PORT)
sudo ufw allow 3001/tcp
```

**Step 5**: Set up domain (optional)

- Point domain/subdomain to server IP
- Set up Nginx reverse proxy
- Configure SSL with Let's Encrypt

---

#### Option B: Render.com (Easy Deployment)

**Step 1**: Push code to GitHub

**Step 2**: Create Render account at [render.com](https://render.com)

**Step 3**: Create new Web Service

- **Repository**: Your GitHub repo
- **Root Directory**: `agent`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `node dist/index.js`
- **Environment Variables**: Add all from `.env`

**Step 4**: Deploy

Render will automatically build and deploy. API will be available at:
```
https://your-service-name.onrender.com
```

---

### Deploy Frontend

#### Option A: Vercel (Recommended for Next.js)

**Step 1**: Push code to GitHub

**Step 2**: Import project to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select your GitHub repository
4. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Environment Variables**:
     - `NEXT_PUBLIC_API_URL`: Your agent backend URL

**Step 3**: Deploy

Vercel will automatically deploy. Frontend will be available at:
```
https://your-project-name.vercel.app
```

---

#### Option B: Netlify

**Step 1**: Push code to GitHub

**Step 2**: Import to Netlify

1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site"
3. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/.next`
   - **Environment Variables**: Add `NEXT_PUBLIC_API_URL`

**Step 3**: Deploy

---

#### Option 3: Self-Hosted (VPS)

```bash
# On your server
cd Moltiverse-cult/frontend

# Install dependencies
npm install

# Build production bundle
npm run build

# Start production server
pm2 start npm --name agentcult-frontend -- start

# Or use a static server
npm install -g serve
pm2 start serve --name agentcult-frontend -- -s .next/static -l 3000
```

---

### Post-Deployment Verification

#### 1. Verify Contracts

```bash
# Check contract on explorer
open https://testnet.monadexplorer.com/address/<CULT_REGISTRY_ADDRESS>

# Verify contract is active
cast call <CULT_REGISTRY_ADDRESS> "getTotalCults()" --rpc-url https://testnet-rpc.monad.xyz
```

#### 2. Verify Agent Backend

```bash
# Health check
curl https://your-agent-backend.com/api/health

# Should return:
# {"status":"ok","uptime":123.45}

# Get cults
curl https://your-agent-backend.com/api/cults

# Should return array of cults
```

#### 3. Verify Frontend

```bash
# Open in browser
open https://your-frontend.vercel.app

# Check pages load:
# - Dashboard (/)
# - Leaderboard (/cults)
# - Raid Arena (/arena)
# - Prophecies (/prophecies)
```

---

## Troubleshooting

### Common Issues

#### 1. "Insufficient funds" Error

**Problem**: Agent tries to execute transaction but wallet has no MON

**Solution**:
```bash
# Check wallet balance
cast balance <YOUR_WALLET_ADDRESS> --rpc-url https://testnet-rpc.monad.xyz

# If 0, get MON from faucet
open https://faucet.monad.xyz
```

---

#### 2. "Contract not deployed" Error

**Problem**: `CULT_REGISTRY_ADDRESS` not set or incorrect

**Solution**:
```bash
# Verify .env file
cat .env | grep CULT_REGISTRY_ADDRESS

# Should show: CULT_REGISTRY_ADDRESS=0x...

# If empty, deploy contracts:
cd contracts
npx hardhat run scripts/deploy.ts --network monadTestnet
```

---

#### 3. LLM API Errors

**Problem**: xAI API returns 401 Unauthorized or rate limit errors

**Solution**:
```bash
# Check API key in .env
cat .env | grep XAI_API_KEY

# Verify key is valid:
curl https://api.x.ai/v1/models \
  -H "Authorization: Bearer xai-your_api_key_here"

# If invalid, get new key from console.x.ai
```

**Rate Limit Solutions**:
- Upgrade to paid xAI tier
- Increase agent cycle delay (reduce frequency)
- Use fallback responses more aggressively

---

#### 4. Frontend Can't Connect to API

**Problem**: Frontend shows "Failed to fetch" errors

**Solution**:
```bash
# Check NEXT_PUBLIC_API_URL in frontend/.env
cat frontend/.env | grep NEXT_PUBLIC_API_URL

# Should match your agent backend URL

# Check CORS in agent backend
# Verify src/api/server.ts has:
# app.use(cors());

# Test API directly:
curl http://localhost:3001/api/health
```

---

#### 5. Nonce Too Low Error

**Problem**: Transaction fails with "nonce too low"

**Solution**:
```bash
# This is usually auto-resolved by TransactionQueue
# But if persists, reset MetaMask account:
# 1. Open MetaMask
# 2. Settings → Advanced
# 3. Reset Account

# Or restart agent backend to reset transaction queue
```

---

#### 6. Build Errors

**Problem**: TypeScript compilation errors

**Solution**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear TypeScript cache
npx tsc --build --clean

# Rebuild
npx tsc
```

---

#### 7. Hardhat Network Connection Issues

**Problem**: "Cannot connect to network" errors

**Solution**:
```bash
# Check RPC URL is correct
echo $MONAD_TESTNET_RPC

# Test RPC connection
curl -X POST https://testnet-rpc.monad.xyz \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Try alternative RPC (if available)
MONAD_TESTNET_RPC=https://alternate-rpc.monad.xyz
```

---

### Debug Mode

#### Enable Verbose Logging

**Contracts**:
```bash
cd contracts
REPORT_GAS=true npx hardhat test --verbose
```

**Agent**:
```typescript
// In src/utils/logger.ts
const logger = winston.createLogger({
  level: 'debug', // Change from 'info' to 'debug'
  ...
});
```

**Frontend**:
```typescript
// Add console logs in components
console.log('Data fetched:', data);
```

---

## Development Best Practices

### Code Style

#### Solidity

- Use Solidity 0.8.24
- Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Use NatSpec comments for public functions

```solidity
/// @notice Register a new cult
/// @param name The name of the cult
/// @return cultId The ID of the newly created cult
function registerCult(string calldata name) external payable returns (uint256 cultId) {
    // ...
}
```

---

#### TypeScript

- Use strict mode: `"strict": true`
- Prefer interfaces over types for object shapes
- Use async/await instead of promises
- Add JSDoc comments for public functions

```typescript
/**
 * Register a new cult on-chain
 * @param name - Cult name
 * @param prophecyPrompt - LLM system prompt
 * @param tokenAddress - ERC-20 token address
 * @param initialTreasury - Initial treasury in wei
 * @returns Cult ID
 */
async registerCult(
  name: string,
  prophecyPrompt: string,
  tokenAddress: string,
  initialTreasury: bigint
): Promise<number> {
  // ...
}
```

---

### Git Workflow

#### Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New features
- `fix/*`: Bug fixes

#### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org):

```
feat(agent): add prophecy resolution logic
fix(contracts): prevent raid cooldown bypass
docs(readme): update setup instructions
chore(deps): upgrade ethers to v6.1.0
```

---

### Security Best Practices

#### Never Commit Secrets

```bash
# .env should ALWAYS be in .gitignore
echo .env >> .gitignore

# Check for accidentally committed secrets
git log --all --full-history -- .env
```

#### Contract Security

- Use latest Solidity version
- Run [Slither](https://github.com/crytic/slither) for static analysis
- Test all access control modifiers
- Avoid reentrancy vulnerabilities

```bash
# Install Slither
pip3 install slither-analyzer

# Run analysis
cd contracts
slither .
```

---

### Performance Optimization

#### Agent Backend

- Use transaction queue to prevent nonce conflicts
- Cache market data (30-second TTL)
- Batch on-chain reads when possible
- Use indexes for in-memory data structures

#### Frontend

- Use Next.js Image component for optimized images
- Implement pagination for large lists
- Use React.memo for expensive components
- Optimize polling intervals (5s is good default)

---

### Monitoring and Logging

#### Agent Logs

```typescript
// Use structured logging
log.info('Raid executed', {
  cultId,
  targetId,
  won: result.attackerWon,
  amount: wagerAmount
});
```

#### Contract Events

```solidity
// Emit comprehensive events
emit RaidResult(
    attackerId,
    defenderId,
    attackerWon,
    amount,
    block.timestamp
);
```

#### Frontend Error Tracking

```typescript
// Add error boundaries
try {
  const data = await api.getCults();
  setData(data);
} catch (error) {
  console.error('Failed to fetch cults:', error);
  // Show user-friendly error message
}
```

---

## Additional Resources

### Documentation

- [Hardhat Documentation](https://hardhat.org/docs)
- [ethers.js Documentation](https://docs.ethers.org/v6/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Monad Documentation](https://docs.monad.xyz)

### Community

- [Monad Discord](https://discord.gg/monad)
- [Hardhat Discord](https://discord.gg/hardhat)
- [Next.js Discord](https://discord.gg/nextjs)

### Tools

- [Remix IDE](https://remix.ethereum.org) - Solidity development
- [Tenderly](https://tenderly.co) - Transaction debugging
- [OpenZeppelin Wizard](https://wizard.openzeppelin.com) - Contract templates

---

## Next Steps

After completing this guide, you should:

1. ✅ Have a fully functional local development environment
2. ✅ Understand the deployment process for all components
3. ✅ Know how to test and debug the system
4. ✅ Be ready to build new features or customize the system

**Recommended next steps**:
- Add new cult personalities to `agent/data/personalities.json`
- Create custom raid mechanics in `RaidService.ts`
- Build new frontend visualizations
- Integrate additional LLM providers
- Implement governance features using $CULT token

---

For more information, see:
- [ARCHITECTURE.md](../ARCHITECTURE.md) - System design overview
- [AGENT_WORKFLOW.md](AGENT_WORKFLOW.md) - Detailed agent behavior
- [FILE_STRUCTURE.md](FILE_STRUCTURE.md) - Codebase organization
