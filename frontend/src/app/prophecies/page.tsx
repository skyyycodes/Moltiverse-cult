"use client";

import { useCallback } from "react";
import { api, Prophecy } from "@/lib/api";
import { usePolling } from "@/hooks/usePolling";
import { ProphecyFeed } from "@/components/ProphecyFeed";

export default function PropheciesPage() {
  const { data: prophecies, loading } = usePolling<Prophecy[]>(
    useCallback(() => api.getProphecies(50), []),
    5000,
  );

  const allProphecies = prophecies || [];
  const active = allProphecies.filter((p) => !p.resolved);
  const resolved = allProphecies.filter((p) => p.resolved);
  const correct = resolved.filter((p) => p.correct);
  const accuracy =
    resolved.length > 0
      ? ((correct.length / resolved.length) * 100).toFixed(0)
      : "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <span>🔮</span> Prophecy Oracle
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Market predictions from the AI prophets. The divine speak through
          data.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold font-mono">
            {allProphecies.length}
          </div>
          <div className="text-xs text-gray-500">Total Prophecies</div>
        </div>
        <div className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold font-mono text-purple-400">
            {active.length}
          </div>
          <div className="text-xs text-gray-500">Awaiting</div>
        </div>
        <div className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold font-mono text-green-400">
            {correct.length}
          </div>
          <div className="text-xs text-gray-500">Fulfilled</div>
        </div>
        <div className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold font-mono text-yellow-400">
            {accuracy}%
          </div>
          <div className="text-xs text-gray-500">Accuracy</div>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 animate-pulse font-mono">
          The oracle meditates...
        </div>
      ) : (
        <ProphecyFeed prophecies={allProphecies} maxItems={50} />
      )}
    </div>
  );
}
