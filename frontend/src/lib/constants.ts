export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const MONAD_CHAIN_ID = 10143;
export const MONAD_RPC = "https://testnet-rpc.monad.xyz";
export const MONAD_EXPLORER = "https://testnet.monadexplorer.com";

export const CULT_COLORS: Record<number, string> = {
  0: "#7c3aed", // Purple - Church of the Eternal Candle
  1: "#dc2626", // Red - Order of the Red Dildo
  2: "#f59e0b", // Gold - Temple of Diamond Hands
};

export const CULT_ICONS: Record<number, string> = {
  0: "🕯️",
  1: "🔴",
  2: "💎",
};
