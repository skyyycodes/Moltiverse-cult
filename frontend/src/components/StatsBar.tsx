"use client";

import { Stats } from "@/lib/api";

interface Props {
  stats: Stats | null;
}

export function StatsBar({ stats }: Props) {
  const items = [
    { label: "Active Cults", value: stats?.totalCults ?? "—", icon: "⛪" },
    {
      label: "Total Treasury",
      value: stats ? `${stats.totalTreasury} MON` : "—",
      icon: "💰",
    },
    {
      label: "Followers",
      value: stats?.totalFollowers?.toLocaleString() ?? "—",
      icon: "🙏",
    },
    { label: "Total Raids", value: stats?.totalRaids ?? "—", icon: "⚔️" },
    { label: "Prophecies", value: stats?.totalProphecies ?? "—", icon: "🔮" },
    { label: "Active Agents", value: stats?.activeAgents ?? "—", icon: "🤖" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map(({ label, value, icon }) => (
        <div
          key={label}
          className="bg-[#0d0d0d] border border-gray-800 rounded-xl p-4 text-center hover:border-gray-700 transition-colors"
        >
          <div className="text-xl mb-1">{icon}</div>
          <div className="text-lg font-bold font-mono">{value}</div>
          <div className="text-xs text-gray-500">{label}</div>
        </div>
      ))}
    </div>
  );
}
