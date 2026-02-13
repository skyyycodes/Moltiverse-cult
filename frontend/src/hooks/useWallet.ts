"use client";

import { useState, useCallback, useEffect } from "react";
import { MONAD_CHAIN_ID, MONAD_RPC } from "@/lib/constants";

interface WalletState {
  address: string | null;
  chainId: number | null;
  connected: boolean;
  error: string | null;
}

const MONAD_NETWORK = {
  chainId: `0x${MONAD_CHAIN_ID.toString(16)}`,
  chainName: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: [MONAD_RPC],
  blockExplorerUrls: ["https://testnet.monadexplorer.com"],
};

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    connected: false,
    error: null,
  });

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      setState((s) => ({ ...s, error: "No wallet detected. Install MetaMask." }));
      return;
    }

    try {
      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      const chainId = parseInt(await ethereum.request({ method: "eth_chainId" }), 16);

      // Switch to Monad testnet if needed
      if (chainId !== MONAD_CHAIN_ID) {
        try {
          await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: MONAD_NETWORK.chainId }],
          });
        } catch (switchError: any) {
          // Chain not added yet — add it
          if (switchError.code === 4902) {
            await ethereum.request({
              method: "wallet_addEthereumChain",
              params: [MONAD_NETWORK],
            });
          } else {
            throw switchError;
          }
        }
      }

      setState({
        address: accounts[0],
        chainId: MONAD_CHAIN_ID,
        connected: true,
        error: null,
      });
    } catch (err: any) {
      setState((s) => ({ ...s, error: err.message || "Connection failed" }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({ address: null, chainId: null, connected: false, error: null });
  }, []);

  // Listen for account/chain changes
  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    const ethereum = (window as any).ethereum;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setState((s) => ({ ...s, address: accounts[0] }));
      }
    };

    const handleChainChanged = (chainId: string) => {
      const id = parseInt(chainId, 16);
      setState((s) => ({ ...s, chainId: id }));
      if (id !== MONAD_CHAIN_ID) {
        setState((s) => ({ ...s, error: "Please switch to Monad Testnet" }));
      } else {
        setState((s) => ({ ...s, error: null }));
      }
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);

    return () => {
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
      ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [disconnect]);

  return { ...state, connect, disconnect };
}
