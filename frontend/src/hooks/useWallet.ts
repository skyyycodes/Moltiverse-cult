"use client";

import { useState, useCallback, useEffect } from "react";
import { MONAD_CHAIN_ID, MONAD_RPC } from "@/lib/constants";

interface WalletState {
  address: string | null;
  chainId: number | null;
  connected: boolean;
  error: string | null;
  isConnecting: boolean;
}

const MONAD_NETWORK = {
  chainId: `0x${MONAD_CHAIN_ID.toString(16)}`,
  chainName: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: [MONAD_RPC],
  blockExplorerUrls: ["https://testnet.monadexplorer.com"],
};

// Wait for wallet provider to be injected with timeout
const waitForProvider = async (timeout = 5000): Promise<any> => {
  if (typeof window === "undefined") {
    throw new Error("Not in browser environment");
  }

  const startTime = Date.now();
  
  // Check immediately first
  if ((window as any).ethereum) {
    console.log("Wallet provider detected immediately");
    return (window as any).ethereum;
  }

  // Poll for provider with 100ms intervals
  while (Date.now() - startTime < timeout) {
    if ((window as any).ethereum) {
      console.log("Wallet provider detected after waiting");
      return (window as any).ethereum;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  throw new Error("Wallet extension not detected. Please install a Web3 wallet and refresh the page.");
};

// Check if provider is ready for requests
const isProviderReady = (provider: any): boolean => {
  return provider && typeof provider.request === "function";
};

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    connected: false,
    error: null,
    isConnecting: false,
  });

  const connect = useCallback(async () => {
    setState((s) => ({ ...s, isConnecting: true, error: null }));

    try {
      // Wait for provider to be available
      const ethereum = await waitForProvider(5000);
      
      if (!isProviderReady(ethereum)) {
        throw new Error("Wallet provider not ready. Please try again.");
      }

      console.log("Requesting accounts from wallet...");
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned from wallet");
      }

      console.log("Getting chain ID...");
      const chainId = parseInt(
        await ethereum.request({ method: "eth_chainId" }),
        16,
      );

      // Switch to Monad testnet if needed
      if (chainId !== MONAD_CHAIN_ID) {
        console.log(`Switching from chain ${chainId} to Monad (${MONAD_CHAIN_ID})...`);
        try {
          await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: MONAD_NETWORK.chainId }],
          });
        } catch (switchError: any) {
          // Chain not added yet — add it
          if (switchError.code === 4902) {
            console.log("Adding Monad network to wallet...");
            await ethereum.request({
              method: "wallet_addEthereumChain",
              params: [MONAD_NETWORK],
            });
          } else {
            throw switchError;
          }
        }
      }

      console.log("Wallet connected successfully");
      setState({
        address: accounts[0],
        chainId: MONAD_CHAIN_ID,
        connected: true,
        error: null,
        isConnecting: false,
      });
    } catch (err: any) {
      console.error("Wallet connection error:", err);
      let errorMessage = err.message || "Connection failed";
      
      // Provide more helpful error messages
      if (err.code === 4001) {
        errorMessage = "Connection rejected. Please approve the connection request.";
      } else if (err.message?.includes("not detected")) {
        errorMessage = err.message;
      } else if (err.message?.includes("not ready")) {
        errorMessage = "Wallet is loading. Please wait a moment and try again.";
      }

      setState((s) => ({ 
        ...s, 
        error: errorMessage,
        isConnecting: false,
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({ 
      address: null, 
      chainId: null, 
      connected: false, 
      error: null,
      isConnecting: false,
    });
  }, []);

  // Listen for account/chain changes and EIP-6963 providers
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Listen for EIP-6963 provider announcements
    const handleEIP6963Provider = (event: any) => {
      console.log("EIP-6963 provider detected:", event.detail?.info?.name || "Unknown");
    };

    window.addEventListener("eip6963:announceProvider", handleEIP6963Provider as EventListener);
    
    // Request providers to announce themselves
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    // Setup ethereum event listeners if provider exists
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      return () => {
        window.removeEventListener("eip6963:announceProvider", handleEIP6963Provider as EventListener);
      };
    }

    const handleAccountsChanged = (accounts: string[]) => {
      console.log("Accounts changed:", accounts);
      if (accounts.length === 0) {
        disconnect();
      } else {
        setState((s) => ({ ...s, address: accounts[0] }));
      }
    };

    const handleChainChanged = (chainId: string) => {
      const id = parseInt(chainId, 16);
      console.log("Chain changed:", id);
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
      window.removeEventListener("eip6963:announceProvider", handleEIP6963Provider as EventListener);
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
      ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [disconnect]);

  return { ...state, connect, disconnect };
}
