"use client";

import { useWallet } from "@/hooks/useWallet";

export function WalletButton() {
  const { address, connected, error, connect, disconnect } = useWallet();

  if (connected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-mono text-gray-300">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <button
          onClick={disconnect}
          className="text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={connect}
        className="bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
      >
        <span>🔗</span> Connect Wallet
      </button>
      {error && (
        <span className="text-[10px] text-red-400 max-w-[200px] text-right">
          {error}
        </span>
      )}
    </div>
  );
}
