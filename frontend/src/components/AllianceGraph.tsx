"use client";

import { Alliance } from "@/lib/api";

interface AllianceGraphProps {
    alliances: Alliance[];
}

export function AllianceGraph({ alliances }: AllianceGraphProps) {
    // Collect unique cults from alliances
    const cultSet = new Map<number, string>();
    alliances.forEach((a) => {
        cultSet.set(a.cult1Id, a.cult1Name);
        cultSet.set(a.cult2Id, a.cult2Name);
    });
    const cults = Array.from(cultSet.entries());

    if (cults.length === 0) {
        return (
            <div className="text-center py-8 text-gray-600 font-mono text-sm">
                No alliances formed yet.
            </div>
        );
    }

    // Position cults in a circle
    const cx = 200;
    const cy = 200;
    const radius = 140;
    const nodePositions = cults.map(([_id, _name], i) => {
        const angle = (i / Math.max(1, cults.length)) * 2 * Math.PI - Math.PI / 2;
        return {
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle),
        };
    });

    const COLORS = [
        "#a855f7", "#22c55e", "#ef4444", "#3b82f6",
        "#f59e0b", "#ec4899", "#14b8a6", "#f97316",
    ];

    return (
        <div className="flex justify-center">
            <svg viewBox="0 0 400 400" className="w-full max-w-md">
                {/* Alliance lines */}
                {alliances.map((a) => {
                    const idx1 = cults.findIndex(([id]) => id === a.cult1Id);
                    const idx2 = cults.findIndex(([id]) => id === a.cult2Id);
                    if (idx1 < 0 || idx2 < 0) return null;
                    const p1 = nodePositions[idx1];
                    const p2 = nodePositions[idx2];

                    return (
                        <line
                            key={a.id}
                            x1={p1.x}
                            y1={p1.y}
                            x2={p2.x}
                            y2={p2.y}
                            stroke={a.active ? "#22c55e" : "#374151"}
                            strokeWidth={a.active ? 2.5 : 1}
                            strokeDasharray={a.active ? "none" : "6 3"}
                            opacity={a.active ? 0.8 : 0.4}
                        />
                    );
                })}

                {/* Cult nodes */}
                {cults.map(([id, name], i) => {
                    const pos = nodePositions[i];
                    const color = COLORS[i % COLORS.length];
                    const hasActive = alliances.some(
                        (a) => a.active && (a.cult1Id === id || a.cult2Id === id),
                    );

                    return (
                        <g key={id}>
                            <circle
                                cx={pos.x}
                                cy={pos.y}
                                r={hasActive ? 22 : 18}
                                fill={`${color}20`}
                                stroke={color}
                                strokeWidth={hasActive ? 2 : 1}
                            />
                            {hasActive && (
                                <circle
                                    cx={pos.x}
                                    cy={pos.y}
                                    r={28}
                                    fill="none"
                                    stroke={color}
                                    strokeWidth={0.5}
                                    opacity={0.3}
                                />
                            )}
                            <text
                                x={pos.x}
                                y={pos.y + 1}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="white"
                                fontSize="9"
                                fontWeight="bold"
                            >
                                {name.length > 10 ? name.slice(0, 9) + "…" : name}
                            </text>
                            <text
                                x={pos.x}
                                y={pos.y + 40}
                                textAnchor="middle"
                                fill="#6b7280"
                                fontSize="8"
                            >
                                #{id}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
