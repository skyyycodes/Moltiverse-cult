"use client";

import { useWallet } from "@/hooks/useWallet";

export function WalletButton() {
  const { address, connected, error, connect, disconnect, isConnecting } = useWallet();

  if (connected && address) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1.5 bg-white/[0.04] border border-[#1a1a1a] rounded-md px-2.5 py-1">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          <span className="text-xs font-mono text-[#999]">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <button
          onClick={disconnect}
          className="text-xs text-[#666] hover:text-red-400 transition-colors px-1.5 py-1"
          title="Disconnect wallet"
        >
          &times;
        </button>
      </div>
    );
  }

  const showInstallLink = error?.includes("not detected");

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={connect}
        disabled={isConnecting}
        className="bg-white/[0.06] hover:bg-white/[0.1] disabled:bg-white/[0.03] border border-[#1a1a1a] hover:border-[#2a2a2a] disabled:border-[#111] text-white disabled:text-[#666] text-xs font-medium px-3.5 py-1.5 rounded-md transition-colors disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isConnecting ? (
          <>
            <svg 
              className="animate-spin h-3 w-3" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Connecting...</span>
          </>
        ) : (
          "Connect"
        )}
      </button>
      {error && (
        <div className="flex flex-col items-end gap-1">
          <span className="text-[11px] text-red-400 max-w-[240px] text-right">
            {error}
          </span>
          {showInstallLink && (
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-blue-400 hover:text-blue-300 underline"
            >
              Install MetaMask
            </a>
          )}
        </div>
      )}
    </div>
  );
}
