import { API_BASE } from "./constants";

export interface Cult {
  id: number;
  name: string;
  personality: string;
  prophecyPrompt: string;
  tokenAddress: string;
  treasury: string;
  followers: number;
  raidWins: number;
  raidLosses: number;
  createdAt: number;
}

export interface Prophecy {
  id: string;
  cultId: number;
  cultName: string;
  text: string;
  prediction: string;
  confidence: number;
  resolved: boolean;
  correct: boolean | null;
  createdAt: number;
  resolvedAt: number | null;
}

export interface Raid {
  id: string;
  attackerId: number;
  attackerName: string;
  defenderId: number;
  defenderName: string;
  amount: string;
  attackerWon: boolean;
  scripture: string;
  createdAt: number;
}

export interface AgentInfo {
  cultId: number;
  name: string;
  status: "running" | "stopped" | "idle";
  lastAction: string;
  lastActionTime: number;
  totalProphecies: number;
  totalRaids: number;
  totalFollowersRecruited: number;
}

export interface Stats {
  totalCults: number;
  totalTreasury: string;
  totalFollowers: number;
  totalRaids: number;
  totalProphecies: number;
  activeProphecies: number;
  activeAgents: number;
}

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  getStats: () => fetchJSON<Stats>("/api/stats"),
  getCults: () => fetchJSON<Cult[]>("/api/cults"),
  getCult: (id: number) =>
    fetchJSON<Cult & { prophecies: Prophecy[]; raids: Raid[] }>(
      `/api/cults/${id}`,
    ),
  getProphecies: (limit = 50) =>
    fetchJSON<Prophecy[]>(`/api/prophecies?limit=${limit}`),
  getRaids: (limit = 50) => fetchJSON<Raid[]>(`/api/raids?limit=${limit}`),
  getRecentRaids: () => fetchJSON<Raid[]>("/api/raids/recent"),
  getAgents: () => fetchJSON<AgentInfo[]>("/api/agents"),
  getHealth: () => fetchJSON<{ status: string; uptime: number }>("/api/health"),
};
