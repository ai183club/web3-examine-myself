import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";
import { http } from "wagmi";
import { sepolia } from "wagmi/chains";

const projectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ??
  "00000000000000000000000000000000";

const sepoliaRpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL;

export const hardhatLocal = defineChain({
  id: 31337,
  name: "Hardhat Local",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: "Web3 Examine Myself",
  projectId,
  chains: [sepolia, hardhatLocal],
  transports: {
    [sepolia.id]: http(sepoliaRpcUrl),
    [hardhatLocal.id]: http(),
  },
});
