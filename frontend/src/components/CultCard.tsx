"use client";

import Link from "next/link";
import { Cult } from "@/lib/api";
import { CULT_COLORS, CULT_ICONS } from "@/lib/constants";

interface Props {
  cult: Cult;
  rank?: number;
}

export function CultCard({ cult, rank }: Props) {
  const color = CULT_COLORS[cult.id] || "#666";
  const icon = CULT_ICONS[cult.id] || "⛪";
  const totalRaids = cult.raidWins + cult.raidLosses;
  const winRate =
    totalRaids > 0 ? ((cult.raidWins / totalRaids) * 100).toFixed(0) : "—";

  return (
    <Link href={`/cults/${cult.id}`}>
      <div
        className="relative rounded-xl border border-gray-800 p-5 hover:border-gray-600 transition-all hover:scale-[1.02] cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${color}10 0%, #111111 50%, #0d0d0d 100%)`,
          boxShadow: `0 0 30px ${color}15`,
        }}
      >
        {rank !== undefined && (
          <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gray-900 border border-gray-700 flex items-center justify-center text-xs font-bold text-yellow-400">
            #{rank}
          </div>
        )}

        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{icon}</span>
          <div>
            <h3 className="font-bold text-lg" style={{ color }}>
              {cult.name}
            </h3>
            <p className="text-xs text-gray-500 font-mono">
              {cult.tokenAddress
                ? `${cult.tokenAddress.slice(0, 8)}...${cult.tokenAddress.slice(
                    -6,
                  )}`
                : "No token linked"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Treasury</div>
            <div className="font-bold font-mono text-green-400">
              {parseFloat(cult.treasury).toFixed(2)}
            </div>
            <div className="text-[10px] text-gray-600">MON</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Followers</div>
            <div className="font-bold font-mono">{cult.followers}</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Win Rate</div>
            <div className="font-bold font-mono" style={{ color }}>
              {winRate}%
            </div>
          </div>
        </div>

        <div className="mt-3 flex justify-between text-xs text-gray-500">
          <span>
            Raids: <span className="text-green-400">{cult.raidWins}W</span> /{" "}
            <span className="text-red-400">{cult.raidLosses}L</span>
          </span>
          <span>Since {new Date(cult.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
  );
}
