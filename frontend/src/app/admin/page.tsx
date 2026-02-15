"use client";

import { useCallback, useState } from "react";
import { adminApi, type AgentMessage, type AdminOverview, type AdminOverviewAgent, type BribeOffer, type Cult } from "@/lib/api";
import { usePolling } from "@/hooks/usePolling";
import { CULT_COLORS } from "@/lib/constants";

/* ── Helpers ─────────────────────────────────────────────────────── */

function cultColor(id: number) {
  return CULT_COLORS[id] || "#888";
}

function Badge({
  children,
  color = "gray",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  const map: Record<string, string> = {
    green: "bg-green-500/15 text-green-400 border-green-500/25",
    red: "bg-red-500/15 text-red-400 border-red-500/25",
    yellow: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
    blue: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    purple: "bg-purple-500/15 text-purple-400 border-purple-500/25",
    gray: "bg-white/5 text-gray-400 border-white/10",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${
        map[color] || map.gray
      }`}
    >
      {children}
    </span>
  );
}

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-5 ${className}`}
    >
      <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

function ActionButton({
  onClick,
  children,
  variant = "default",
  disabled = false,
  loading = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "default" | "danger" | "success" | "warning";
  disabled?: boolean;
  loading?: boolean;
}) {
  const variants: Record<string, string> = {
    default:
      "bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.08] text-white",
    danger: "bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-400",
    success:
      "bg-green-500/10 hover:bg-green-500/20 border-green-500/20 text-green-400",
    warning:
      "bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/20 text-yellow-400",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]}`}
    >
      {loading ? "..." : children}
    </button>
  );
}

/* ── Toast System ────────────────────────────────────────────────── */

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let counter = 0;

  const addToast = (message: string, type: "success" | "error") => {
    const id = Date.now() + counter++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3000,
    );
  };

  return { toasts, addToast };
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-2.5 rounded-lg border text-sm font-medium animate-in slide-in-from-right ${
            t.type === "success"
              ? "bg-green-500/15 border-green-500/30 text-green-400"
              : "bg-red-500/15 border-red-500/30 text-red-400"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

/* ── Sub-panels ──────────────────────────────────────────────────── */

function StatsPanel({ stats }: { stats: AdminOverview["stats"] }) {
  const items = [
    {
      label: "Agents",
      value: stats.totalAgents,
      sub: `${stats.runningAgents} running`,
    },
    { label: "Cults", value: stats.totalCults },
    { label: "Raids", value: stats.totalRaids },
    { label: "Prophecies", value: stats.totalProphecies },
    {
      label: "Alliances",
      value: stats.totalAlliances,
      sub: `${stats.activeAlliances} active`,
    },
    { label: "Betrayals", value: stats.totalBetrayals },
    { label: "Defections", value: stats.totalDefections },
    { label: "Proposals", value: stats.totalProposals },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
        >
          <div className="text-2xl font-bold text-white">{item.value}</div>
          <div className="text-xs text-white/40">{item.label}</div>
          {item.sub && (
            <div className="text-[10px] text-white/25 mt-0.5">{item.sub}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function AgentControlPanel({
  agents,
  cults,
  onAction,
}: {
  agents: AdminOverview["agents"];
  cults: Cult[];
  onAction: (action: string, result: string) => void;
}) {
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const withLoading = async (key: string, fn: () => Promise<unknown>) => {
    setLoadingMap((m) => ({ ...m, [key]: true }));
    try {
      await fn();
      onAction(key, "success");
    } catch (err: unknown) {
      onAction(key, `error: ${err instanceof Error ? err.message : "unknown"}`);
    } finally {
      setLoadingMap((m) => ({ ...m, [key]: false }));
    }
  };

  return (
    <Card title="Agent Control">
      <div className="flex gap-2 mb-4">
        <ActionButton
          variant="success"
          loading={!!loadingMap["start-all"]}
          onClick={() => withLoading("start-all", () => adminApi.startAll())}
        >
          Start All
        </ActionButton>
        <ActionButton
          variant="danger"
          loading={!!loadingMap["stop-all"]}
          onClick={() => withLoading("stop-all", () => adminApi.stopAll())}
        >
          Stop All
        </ActionButton>
      </div>

      <div className="space-y-2">
        {agents.map((agent) => {
          const cult = cults.find((c) => c.id === agent.cultId);
          const isRunning =
            agent.status === "active" || agent.status === "running";
          return (
            <div
              key={agent.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.04] bg-white/[0.01] p-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: agent.dead
                      ? "#666"
                      : isRunning
                      ? "#22c55e"
                      : "#eab308",
                  }}
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {agent.name}
                    {cult && (
                      <span
                        className="ml-2 text-xs font-normal"
                        style={{ color: cultColor(cult.id) }}
                      >
                        [{cult.name}]
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-white/30 truncate">
                    {agent.lastAction || "idle"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge
                  color={agent.dead ? "red" : isRunning ? "green" : "yellow"}
                >
                  {agent.dead ? "dead" : isRunning ? "running" : "stopped"}
                </Badge>
                <span className="text-[10px] text-white/20 font-mono">
                  C{agent.cycleCount}
                </span>
                {isRunning ? (
                  <ActionButton
                    variant="danger"
                    loading={!!loadingMap[`stop-${agent.cultId}`]}
                    onClick={() =>
                      agent.cultId != null &&
                      withLoading(`stop-${agent.cultId}`, () =>
                        adminApi.stopAgent(agent.cultId!),
                      )
                    }
                  >
                    Stop
                  </ActionButton>
                ) : (
                  <ActionButton
                    variant="success"
                    loading={!!loadingMap[`start-${agent.cultId}`]}
                    disabled={agent.dead}
                    onClick={() =>
                      agent.cultId != null &&
                      withLoading(`start-${agent.cultId}`, () =>
                        adminApi.startAgent(agent.cultId!),
                      )
                    }
                  >
                    Start
                  </ActionButton>
                )}
                <ActionButton
                  loading={!!loadingMap[`tick-${agent.cultId}`]}
                  disabled={agent.dead}
                  onClick={() =>
                    agent.cultId != null &&
                    withLoading(`tick-${agent.cultId}`, () =>
                      adminApi.forceTick(agent.cultId!),
                    )
                  }
                >
                  Tick
                </ActionButton>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function CommunicationPanel({
  cults,
  onAction,
}: {
  cults: Cult[];
  onAction: (action: string, result: string) => void;
}) {
  const [broadcastCultId, setBroadcastCultId] = useState<number | "">("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [whisperFrom, setWhisperFrom] = useState<number | "">("");
  const [whisperTo, setWhisperTo] = useState<number | "">("");
  const [whisperMsg, setWhisperMsg] = useState("");
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const exec = async (key: string, fn: () => Promise<unknown>) => {
    setLoading((m) => ({ ...m, [key]: true }));
    try {
      await fn();
      onAction(key, "success");
    } catch (err: unknown) {
      onAction(key, `error: ${err instanceof Error ? err.message : "unknown"}`);
    } finally {
      setLoading((m) => ({ ...m, [key]: false }));
    }
  };

  return (
    <Card title="Communication">
      {/* Broadcast */}
      <div className="mb-4">
        <label className="text-xs text-white/40 block mb-1.5">
          Public Broadcast
        </label>
        <div className="flex gap-2 flex-wrap">
          <select
            value={broadcastCultId}
            onChange={(e) =>
              setBroadcastCultId(e.target.value ? Number(e.target.value) : "")
            }
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white w-40"
          >
            <option value="">Select cult...</option>
            {cults.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            value={broadcastMsg}
            onChange={(e) => setBroadcastMsg(e.target.value)}
            placeholder="Message..."
            className="flex-1 min-w-[200px] bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/20"
          />
          <ActionButton
            variant="success"
            disabled={broadcastCultId === "" || !broadcastMsg}
            loading={!!loading.broadcast}
            onClick={() => {
              if (broadcastCultId !== "" && broadcastMsg) {
                exec("broadcast", () =>
                  adminApi.broadcast(broadcastCultId as number, broadcastMsg),
                );
                setBroadcastMsg("");
              }
            }}
          >
            Send
          </ActionButton>
        </div>
      </div>

      {/* Whisper */}
      <div>
        <label className="text-xs text-white/40 block mb-1.5">
          Private Whisper
        </label>
        <div className="flex gap-2 flex-wrap">
          <select
            value={whisperFrom}
            onChange={(e) =>
              setWhisperFrom(e.target.value ? Number(e.target.value) : "")
            }
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white w-32"
          >
            <option value="">From...</option>
            {cults.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={whisperTo}
            onChange={(e) =>
              setWhisperTo(e.target.value ? Number(e.target.value) : "")
            }
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white w-32"
          >
            <option value="">To...</option>
            {cults.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            value={whisperMsg}
            onChange={(e) => setWhisperMsg(e.target.value)}
            placeholder="Message..."
            className="flex-1 min-w-[200px] bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/20"
          />
          <ActionButton
            variant="warning"
            disabled={whisperFrom === "" || whisperTo === "" || !whisperMsg}
            loading={!!loading.whisper}
            onClick={() => {
              if (whisperFrom !== "" && whisperTo !== "" && whisperMsg) {
                exec("whisper", () =>
                  adminApi.whisper(
                    whisperFrom as number,
                    whisperTo as number,
                    whisperMsg,
                  ),
                );
                setWhisperMsg("");
              }
            }}
          >
            Whisper
          </ActionButton>
        </div>
      </div>
    </Card>
  );
}

function RaidPanel({
  cults,
  onAction,
}: {
  cults: Cult[];
  onAction: (action: string, result: string) => void;
}) {
  const [attacker, setAttacker] = useState<number | "">("");
  const [defender, setDefender] = useState<number | "">("");
  const [wager, setWager] = useState(20);
  const [loading, setLoading] = useState(false);

  return (
    <Card title="Trigger Raid">
      <div className="flex gap-2 flex-wrap items-end">
        <div>
          <label className="text-[10px] text-white/30 block mb-1">
            Attacker
          </label>
          <select
            value={attacker}
            onChange={(e) =>
              setAttacker(e.target.value ? Number(e.target.value) : "")
            }
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white w-40"
          >
            <option value="">Select...</option>
            {cults.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <span className="text-white/20 text-lg pb-1">vs</span>
        <div>
          <label className="text-[10px] text-white/30 block mb-1">
            Defender
          </label>
          <select
            value={defender}
            onChange={(e) =>
              setDefender(e.target.value ? Number(e.target.value) : "")
            }
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white w-40"
          >
            <option value="">Select...</option>
            {cults.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-white/30 block mb-1">
            Wager %
          </label>
          <input
            type="number"
            value={wager}
            onChange={(e) => setWager(Number(e.target.value))}
            min={1}
            max={100}
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white w-20"
          />
        </div>
        <ActionButton
          variant="danger"
          disabled={attacker === "" || defender === "" || attacker === defender}
          loading={loading}
          onClick={async () => {
            if (attacker === "" || defender === "") return;
            setLoading(true);
            try {
              await adminApi.triggerRaid(
                attacker as number,
                defender as number,
                wager,
              );
              onAction("raid", "success");
            } catch (err: unknown) {
              onAction(
                "raid",
                `error: ${err instanceof Error ? err.message : "unknown"}`,
              );
            } finally {
              setLoading(false);
            }
          }}
        >
          Attack!
        </ActionButton>
      </div>
    </Card>
  );
}

function AlliancePanel({
  cults,
  onAction,
}: {
  cults: Cult[];
  onAction: (action: string, result: string) => void;
}) {
  const [ally1, setAlly1] = useState<number | "">("");
  const [ally2, setAlly2] = useState<number | "">("");
  const [betrayCult, setBetray] = useState<number | "">("");
  const [betrayReason, setBetrayReason] = useState("");
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const exec = async (key: string, fn: () => Promise<unknown>) => {
    setLoading((m) => ({ ...m, [key]: true }));
    try {
      await fn();
      onAction(key, "success");
    } catch (err: unknown) {
      onAction(key, `error: ${err instanceof Error ? err.message : "unknown"}`);
    } finally {
      setLoading((m) => ({ ...m, [key]: false }));
    }
  };

  return (
    <Card title="Alliances">
      <div className="space-y-4">
        {/* Form Alliance */}
        <div>
          <label className="text-xs text-white/40 block mb-1.5">
            Form Alliance
          </label>
          <div className="flex gap-2 flex-wrap">
            <select
              value={ally1}
              onChange={(e) =>
                setAlly1(e.target.value ? Number(e.target.value) : "")
              }
              className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white w-40"
            >
              <option value="">Cult 1...</option>
              {cults.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={ally2}
              onChange={(e) =>
                setAlly2(e.target.value ? Number(e.target.value) : "")
              }
              className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white w-40"
            >
              <option value="">Cult 2...</option>
              {cults.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ActionButton
              variant="success"
              disabled={ally1 === "" || ally2 === "" || ally1 === ally2}
              loading={!!loading.form}
              onClick={() => {
                if (ally1 !== "" && ally2 !== "")
                  exec("form", () =>
                    adminApi.formAlliance(ally1 as number, ally2 as number),
                  );
              }}
            >
              Form
            </ActionButton>
          </div>
        </div>

        {/* Betray */}
        <div>
          <label className="text-xs text-white/40 block mb-1.5">
            Betray Alliance
          </label>
          <div className="flex gap-2 flex-wrap">
            <select
              value={betrayCult}
              onChange={(e) =>
                setBetray(e.target.value ? Number(e.target.value) : "")
              }
              className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white w-40"
            >
              <option value="">Betrayer cult...</option>
              {cults.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              value={betrayReason}
              onChange={(e) => setBetrayReason(e.target.value)}
              placeholder="Reason (optional)..."
              className="flex-1 min-w-[160px] bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/20"
            />
            <ActionButton
              variant="danger"
              disabled={betrayCult === ""}
              loading={!!loading.betray}
              onClick={() => {
                if (betrayCult !== "")
                  exec("betray", () =>
                    adminApi.betrayAlliance(
                      betrayCult as number,
                      betrayReason || undefined,
                    ),
                  );
              }}
            >
              Betray
            </ActionButton>
          </div>
        </div>
      </div>
    </Card>
  );
}

function GovernancePanel({
  cults,
  onAction,
}: {
  cults: Cult[];
  onAction: (action: string, result: string) => void;
}) {
  const [cultId, setCultId] = useState<number | "">("");
  const [loading, setLoading] = useState(false);

  return (
    <Card title="Governance">
      <div className="flex gap-2 flex-wrap items-end">
        <div>
          <label className="text-[10px] text-white/30 block mb-1">
            Generate Budget Proposal
          </label>
          <select
            value={cultId}
            onChange={(e) =>
              setCultId(e.target.value ? Number(e.target.value) : "")
            }
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white w-48"
          >
            <option value="">Select cult...</option>
            {cults.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <ActionButton
          variant="default"
          disabled={cultId === ""}
          loading={loading}
          onClick={async () => {
            if (cultId === "") return;
            setLoading(true);
            try {
              await adminApi.proposeGovernance(cultId as number);
              onAction("governance", "success");
            } catch (err: unknown) {
              onAction(
                "governance",
                `error: ${err instanceof Error ? err.message : "unknown"}`,
              );
            } finally {
              setLoading(false);
            }
          }}
        >
          Create Proposal
        </ActionButton>
      </div>
    </Card>
  );
}

type EnrichedBribeOffer = BribeOffer & {
  from_cult_name: string;
  to_cult_name: string;
  target_cult_name: string;
};

function BribeOffersPanel({
  onAction,
}: {
  onAction: (action: string, result: string) => void;
}) {
  const [offers, setOffers] = useState<EnrichedBribeOffer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [accepting, setAccepting] = useState<Record<number, boolean>>({});

  const loadOffers = async () => {
    setLoadingOffers(true);
    try {
      const data = await adminApi.getBribeOffers();
      setOffers(data);
    } catch {
      onAction("loadBribes", "error: failed to load");
    } finally {
      setLoadingOffers(false);
    }
  };

  const acceptOffer = async (offerId: number, forceSwitch: boolean) => {
    setAccepting((m) => ({ ...m, [offerId]: true }));
    try {
      const result = await adminApi.acceptBribe(offerId, forceSwitch);
      onAction(
        "acceptBribe",
        result.switched ? "accepted + switched" : "accepted",
      );
      await loadOffers();
    } catch (err: unknown) {
      onAction(
        "acceptBribe",
        `error: ${err instanceof Error ? err.message : "unknown"}`,
      );
    } finally {
      setAccepting((m) => ({ ...m, [offerId]: false }));
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "pending":
        return "text-yellow-400";
      case "accepted":
        return "text-green-400";
      case "rejected":
        return "text-red-400";
      case "executed":
        return "text-purple-400";
      case "expired":
        return "text-white/30";
      default:
        return "text-white/50";
    }
  };

  return (
    <Card title="Bribe Offers">
      <div className="space-y-3">
        <ActionButton
          variant="default"
          loading={loadingOffers}
          onClick={loadOffers}
        >
          Load Bribe Offers
        </ActionButton>

        {offers.length === 0 && !loadingOffers && (
          <p className="text-xs text-white/30 italic">No bribe offers loaded</p>
        )}

        <div className="max-h-64 overflow-y-auto space-y-2">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/70">
                  #{offer.id}
                </span>
                <span
                  className={`text-[10px] uppercase font-bold ${statusColor(offer.status)}`}
                >
                  {offer.status}
                </span>
              </div>
              <div className="text-xs text-white/60">
                <span className="text-amber-400">{offer.from_cult_name}</span>
                <span className="text-white/30"> → </span>
                <span className="text-cyan-400">{offer.to_cult_name}</span>
              </div>
              <div className="text-xs text-white/40">
                Amount: <span className="text-amber-300">{offer.amount} $CULT</span>
                {" · "}
                Target: <span className="text-purple-400">{offer.target_cult_name}</span>
              </div>
              <div className="text-[10px] text-white/25">
                P(accept): {(offer.acceptance_probability * 100).toFixed(1)}%
                {offer.accepted_at && (
                  <> · Accepted {new Date(offer.accepted_at).toLocaleTimeString()}</>
                )}
              </div>

              {offer.status === "pending" && (
                <div className="flex gap-2 pt-1">
                  <ActionButton
                    variant="success"
                    loading={!!accepting[offer.id]}
                    onClick={() => acceptOffer(offer.id, false)}
                  >
                    Accept
                  </ActionButton>
                  <ActionButton
                    variant="warning"
                    loading={!!accepting[offer.id]}
                    onClick={() => acceptOffer(offer.id, true)}
                  >
                    Accept + Switch Cult
                  </ActionButton>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function MemeAndBribePanel({
  cults,
  onAction,
}: {
  cults: Cult[];
  onAction: (action: string, result: string) => void;
}) {
  const [memeFrom, setMemeFrom] = useState<number | "">("");
  const [memeTo, setMemeTo] = useState<number | "">("");
  const [bribeFrom, setBribeFrom] = useState<number | "">("");
  const [bribeTo, setBribeTo] = useState<number | "">("");
  const [bribeAmount, setBribeAmount] = useState(1);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const exec = async (key: string, fn: () => Promise<unknown>) => {
    setLoading((m) => ({ ...m, [key]: true }));
    try {
      await fn();
      onAction(key, "success");
    } catch (err: unknown) {
      onAction(key, `error: ${err instanceof Error ? err.message : "unknown"}`);
    } finally {
      setLoading((m) => ({ ...m, [key]: false }));
    }
  };

  return (
    <Card title="Memes & Bribes">
      <div className="space-y-4">
        {/* Meme */}
        <div>
          <label className="text-xs text-white/40 block mb-1.5">
            Send Meme
          </label>
          <div className="flex gap-2 flex-wrap">
            <select
              value={memeFrom}
              onChange={(e) =>
                setMemeFrom(e.target.value ? Number(e.target.value) : "")
              }
              className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white w-36"
            >
              <option value="">From...</option>
              {cults.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={memeTo}
              onChange={(e) =>
                setMemeTo(e.target.value ? Number(e.target.value) : "")
              }
              className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white w-36"
            >
              <option value="">To...</option>
              {cults.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ActionButton
              variant="warning"
              disabled={memeFrom === "" || memeTo === ""}
              loading={!!loading.meme}
              onClick={() => {
                if (memeFrom !== "" && memeTo !== "")
                  exec("meme", () =>
                    adminApi.sendMeme(memeFrom as number, memeTo as number),
                  );
              }}
            >
              Send Meme
            </ActionButton>
          </div>
        </div>

        {/* Bribe */}
        <div>
          <label className="text-xs text-white/40 block mb-1.5">
            Send Bribe
          </label>
          <div className="flex gap-2 flex-wrap">
            <select
              value={bribeFrom}
              onChange={(e) =>
                setBribeFrom(e.target.value ? Number(e.target.value) : "")
              }
              className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white w-36"
            >
              <option value="">From...</option>
              {cults.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={bribeTo}
              onChange={(e) =>
                setBribeTo(e.target.value ? Number(e.target.value) : "")
              }
              className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white w-36"
            >
              <option value="">To...</option>
              {cults.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={bribeAmount}
              onChange={(e) => setBribeAmount(Number(e.target.value))}
              min={0.1}
              step={0.1}
              className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white w-20"
              placeholder="$CULT"
            />
            <ActionButton
              variant="default"
              disabled={bribeFrom === "" || bribeTo === ""}
              loading={!!loading.bribe}
              onClick={() => {
                if (bribeFrom !== "" && bribeTo !== "")
                  exec("bribe", () =>
                    adminApi.sendBribe(
                      bribeFrom as number,
                      bribeTo as number,
                      bribeAmount,
                    ),
                  );
              }}
            >
              Send Bribe
            </ActionButton>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ProphecyPanel({
  cults,
  onAction,
}: {
  cults: Cult[];
  onAction: (action: string, result: string) => void;
}) {
  const [cultId, setCultId] = useState<number | "">("");
  const [loading, setLoading] = useState(false);

  return (
    <Card title="Prophecies">
      <div className="flex gap-2 flex-wrap items-end">
        <div>
          <label className="text-[10px] text-white/30 block mb-1">
            Generate Prophecy
          </label>
          <select
            value={cultId}
            onChange={(e) =>
              setCultId(e.target.value ? Number(e.target.value) : "")
            }
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white w-48"
          >
            <option value="">Select cult...</option>
            {cults.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <ActionButton
          variant="default"
          disabled={cultId === ""}
          loading={loading}
          onClick={async () => {
            if (cultId === "") return;
            setLoading(true);
            try {
              await adminApi.createProphecy(cultId as number);
              onAction("prophecy", "success");
            } catch (err: unknown) {
              onAction(
                "prophecy",
                `error: ${err instanceof Error ? err.message : "unknown"}`,
              );
            } finally {
              setLoading(false);
            }
          }}
        >
          Create Prophecy
        </ActionButton>
      </div>
    </Card>
  );
}

function LeakPanel({
  cults,
  onAction,
}: {
  cults: Cult[];
  onAction: (action: string, result: string) => void;
}) {
  const [leaker, setLeaker] = useState<number | "">("");
  const [t1, setT1] = useState<number | "">("");
  const [t2, setT2] = useState<number | "">("");
  const [loading, setLoading] = useState(false);

  return (
    <Card title="Leak Conversations">
      <div className="flex gap-2 flex-wrap items-end">
        <div>
          <label className="text-[10px] text-white/30 block mb-1">Leaker</label>
          <select
            value={leaker}
            onChange={(e) =>
              setLeaker(e.target.value ? Number(e.target.value) : "")
            }
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white w-36"
          >
            <option value="">Select...</option>
            {cults.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-white/30 block mb-1">
            Target 1
          </label>
          <select
            value={t1}
            onChange={(e) =>
              setT1(e.target.value ? Number(e.target.value) : "")
            }
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white w-36"
          >
            <option value="">Select...</option>
            {cults.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-white/30 block mb-1">
            Target 2
          </label>
          <select
            value={t2}
            onChange={(e) =>
              setT2(e.target.value ? Number(e.target.value) : "")
            }
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white w-36"
          >
            <option value="">Select...</option>
            {cults.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <ActionButton
          variant="danger"
          disabled={leaker === "" || t1 === "" || t2 === ""}
          loading={loading}
          onClick={async () => {
            if (leaker === "" || t1 === "" || t2 === "") return;
            setLoading(true);
            try {
              await adminApi.leakConversation(
                leaker as number,
                t1 as number,
                t2 as number,
              );
              onAction("leak", "success");
            } catch (err: unknown) {
              onAction(
                "leak",
                `error: ${err instanceof Error ? err.message : "unknown"}`,
              );
            } finally {
              setLoading(false);
            }
          }}
        >
          Leak
        </ActionButton>
      </div>
    </Card>
  );
}

/* ── Announcements Panel ──────────────────────────────────────── */

function AnnouncementPanel({
  agents,
  cults,
  onAction,
}: {
  agents: AdminOverviewAgent[];
  cults: Cult[];
  onAction: (action: string, result: string) => void;
}) {
  const [joinAgent, setJoinAgent] = useState("");
  const [joinCultId, setJoinCultId] = useState<number | "">("");
  const [leaveAgent, setLeaveAgent] = useState("");
  const [leaveCultId, setLeaveCultId] = useState<number | "">("");
  const [customCultId, setCustomCultId] = useState<number | "">("");
  const [customMsg, setCustomMsg] = useState("");
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const exec = async (key: string, fn: () => Promise<unknown>) => {
    setLoading((m) => ({ ...m, [key]: true }));
    try {
      await fn();
      onAction(key, "success");
    } catch (err: unknown) {
      onAction(key, `error: ${err instanceof Error ? err.message : "unknown"}`);
    } finally {
      setLoading((m) => ({ ...m, [key]: false }));
    }
  };

  // Build unique agent names from the overview
  const agentNames = agents.map((a) => a.name);

  return (
    <Card title="Announcements">
      {/* Join Announcement */}
      <div className="mb-4">
        <label className="text-xs text-white/40 block mb-1.5">
          Agent Joined Cult
        </label>
        <div className="flex gap-2 flex-wrap">
          <select
            value={joinAgent}
            onChange={(e) => setJoinAgent(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white w-44"
          >
            <option value="">Agent name...</option>
            {agentNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={joinCultId}
            onChange={(e) =>
              setJoinCultId(e.target.value ? Number(e.target.value) : "")
            }
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white w-44"
          >
            <option value="">Joined cult...</option>
            {cults.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <ActionButton
            variant="success"
            disabled={!joinAgent || joinCultId === ""}
            loading={!!loading.join}
            onClick={() => {
              if (joinAgent && joinCultId !== "") {
                exec("join", () =>
                  adminApi.announceJoin(joinAgent, joinCultId as number),
                );
              }
            }}
          >
            Announce Join
          </ActionButton>
        </div>
      </div>

      {/* Leave Announcement */}
      <div className="mb-4">
        <label className="text-xs text-white/40 block mb-1.5">
          Agent Left Cult
        </label>
        <div className="flex gap-2 flex-wrap">
          <select
            value={leaveAgent}
            onChange={(e) => setLeaveAgent(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white w-44"
          >
            <option value="">Agent name...</option>
            {agentNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={leaveCultId}
            onChange={(e) =>
              setLeaveCultId(e.target.value ? Number(e.target.value) : "")
            }
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white w-44"
          >
            <option value="">Left cult...</option>
            {cults.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <ActionButton
            variant="danger"
            disabled={!leaveAgent || leaveCultId === ""}
            loading={!!loading.leave}
            onClick={() => {
              if (leaveAgent && leaveCultId !== "") {
                exec("leave", () =>
                  adminApi.announceLeave(leaveAgent, leaveCultId as number),
                );
              }
            }}
          >
            Announce Leave
          </ActionButton>
        </div>
      </div>

      {/* Custom Announcement */}
      <div>
        <label className="text-xs text-white/40 block mb-1.5">
          Custom Announcement
        </label>
        <div className="flex gap-2 flex-wrap">
          <select
            value={customCultId}
            onChange={(e) =>
              setCustomCultId(e.target.value ? Number(e.target.value) : "")
            }
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white w-44"
          >
            <option value="">As cult...</option>
            {cults.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            value={customMsg}
            onChange={(e) => setCustomMsg(e.target.value)}
            placeholder="Announcement text..."
            className="flex-1 min-w-[200px] bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/20"
          />
          <ActionButton
            variant="warning"
            disabled={customCultId === "" || !customMsg}
            loading={!!loading.custom}
            onClick={() => {
              if (customCultId !== "" && customMsg) {
                exec("custom", () =>
                  adminApi.announceCustom(
                    customCultId as number,
                    customMsg,
                    "announcement",
                  ),
                );
                setCustomMsg("");
              }
            }}
          >
            Post
          </ActionButton>
        </div>
      </div>
    </Card>
  );
}

/* ── Whispers Panel (admin view of all private messages) ──────── */

function WhispersPanel() {
  const [whispers, setWhispers] = useState<AgentMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const cultNameColor = (name: string) => {
    const colors: Record<string, string> = {
      "Church of the Eternal Candle": "text-purple-400",
      "Order of the Red Dildo": "text-red-400",
      "Temple of Diamond Hands": "text-amber-400",
    };
    return colors[name] || "text-gray-400";
  };

  const loadWhispers = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getWhispers();
      setWhispers(data);
      setLoaded(true);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Private Whispers">
      {!loaded ? (
        <div className="text-center">
          <button
            onClick={loadWhispers}
            disabled={loading}
            className="px-4 py-2 text-xs rounded-lg border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 disabled:opacity-40 transition-colors"
          >
            {loading ? "Loading..." : "Load Private Messages"}
          </button>
        </div>
      ) : whispers.length === 0 ? (
        <p className="text-xs text-white/30 text-center">
          No private whispers found.
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
          {whispers.slice().reverse().map((msg) => (
            <div
              key={msg.id}
              className="rounded-lg bg-indigo-500/[0.04] border border-indigo-500/15 px-3 py-2"
            >
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-indigo-500/15 border-indigo-500/30 text-indigo-300">
                  WHISPER
                </span>
                <span className={`text-xs font-medium ${cultNameColor(msg.fromCultName)}`}>
                  {msg.fromCultName}
                </span>
                <span className="text-[10px] text-white/30">→</span>
                <span className={`text-xs font-medium ${cultNameColor(msg.targetCultName || "")}`}>
                  {msg.targetCultName || "Unknown"}
                </span>
                <span className="text-[10px] text-white/30 ml-auto">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-xs text-white/60 leading-relaxed italic">
                {msg.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function CultOverviewPanel({ cults }: { cults: Cult[] }) {
  return (
    <Card title="Cult Overview">
      <div className="space-y-2">
        {cults.map((cult) => (
          <div
            key={cult.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.04] bg-white/[0.01] p-3"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: cultColor(cult.id) }}
              />
              <div>
                <div className="text-sm font-medium text-white">
                  {cult.name}
                </div>
                <div className="text-[11px] text-white/30">ID: {cult.id}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <div className="text-white font-mono">
                  {parseFloat(cult.treasury).toFixed(4)}
                </div>
                <div className="text-white/25">MON</div>
              </div>
              <div className="text-right">
                <div className="text-white font-mono">{cult.followers}</div>
                <div className="text-white/25">followers</div>
              </div>
              <div className="text-right">
                <div className="text-white font-mono">
                  {cult.raidWins}W / {cult.raidLosses}L
                </div>
                <div className="text-white/25">raids</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Main Page ───────────────────────────────────────────────────── */

export default function AdminPage() {
  const { data, loading } = usePolling<AdminOverview>(
    useCallback(() => adminApi.getOverview(), []),
    5000,
  );
  const { toasts, addToast } = useToasts();

  const handleAction = (_action: string, result: string) => {
    if (result === "success") {
      addToast(`Action completed`, "success");
    } else {
      addToast(result, "error");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Admin Portal
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Full system control for demo & debugging
        </p>
      </div>

      {loading && !data ? (
        <div className="text-white/30 text-sm">Loading system state...</div>
      ) : data ? (
        <div className="space-y-6">
          {/* Stats */}
          <StatsPanel stats={data.stats} />

          {/* Two-column layout for main panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AgentControlPanel
              agents={data.agents}
              cults={data.cults}
              onAction={handleAction}
            />
            <CultOverviewPanel cults={data.cults} />
          </div>

          {/* Communication */}
          <CommunicationPanel cults={data.cults} onAction={handleAction} />

          {/* Announcements & Whispers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnnouncementPanel
              agents={data.agents}
              cults={data.cults}
              onAction={handleAction}
            />
            <WhispersPanel />
          </div>

          {/* Action Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RaidPanel cults={data.cults} onAction={handleAction} />
            <AlliancePanel cults={data.cults} onAction={handleAction} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProphecyPanel cults={data.cults} onAction={handleAction} />
            <GovernancePanel cults={data.cults} onAction={handleAction} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MemeAndBribePanel cults={data.cults} onAction={handleAction} />
            <BribeOffersPanel onAction={handleAction} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LeakPanel cults={data.cults} onAction={handleAction} />
          </div>
        </div>
      ) : (
        <div className="text-red-400 text-sm">
          Failed to connect to backend. Make sure the agent server is running on
          :3001
        </div>
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
}
