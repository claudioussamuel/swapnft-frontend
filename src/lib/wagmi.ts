import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia, unichainSepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "SwapImpact Hook",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "YOUR_PROJECT_ID",
  chains: [sepolia, unichainSepolia],
  ssr: true,
});
