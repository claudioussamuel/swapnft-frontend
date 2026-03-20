import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, sepolia, anvil } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "SwapImpact Hook",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "YOUR_PROJECT_ID",
  chains: [anvil, sepolia, mainnet],
  ssr: true,
});
