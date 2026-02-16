"use client";

import { useEffect, useState } from "react";

interface ProviderInfo {
  uuid: string;
  name: string;
  icon?: string;
  rdns?: string;
}

export function WalletProviderDetector() {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const detectedProviders: Map<string, ProviderInfo> = new Map();
    let detectionTimer: NodeJS.Timeout;

    const handleAnnounceProvider = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.info) {
        const info = customEvent.detail.info;
        detectedProviders.set(info.uuid, {
          uuid: info.uuid,
          name: info.name,
          icon: info.icon,
          rdns: info.rdns,
        });
        
        console.log("EIP-6963 Provider detected:", info.name);
        setProviders(Array.from(detectedProviders.values()));
      }
    };

    // Listen for provider announcements
    window.addEventListener(
      "eip6963:announceProvider",
      handleAnnounceProvider as EventListener
    );

    // Request providers to announce themselves
    console.log("Requesting wallet providers to announce...");
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    // Also check for legacy window.ethereum
    detectionTimer = setTimeout(() => {
      if ((window as any).ethereum) {
        console.log("Legacy window.ethereum detected");
      }
      setIsDetecting(false);
    }, 1000);

    return () => {
      window.removeEventListener(
        "eip6963:announceProvider",
        handleAnnounceProvider as EventListener
      );
      clearTimeout(detectionTimer);
    };
  }, []);

  // This component doesn't render anything visible
  // It just initializes wallet detection
  return null;
}
