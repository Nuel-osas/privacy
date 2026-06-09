import { createDAppKit } from "@mysten/dapp-kit-react";
import { SuiGrpcClient } from "@mysten/sui/grpc";

const DEVNET_GRPC_URL = "https://fullnode.devnet.sui.io:443";

// Devnet only. Burner wallet enabled so anyone can do a real on-chain
// transaction without installing a browser extension.
export const dAppKit = createDAppKit({
  enableBurnerWallet: true,
  networks: ["devnet"],
  defaultNetwork: "devnet",
  createClient() {
    return new SuiGrpcClient({ network: "devnet", baseUrl: DEVNET_GRPC_URL });
  },
});

declare module "@mysten/dapp-kit-react" {
  interface Register {
    dAppKit: typeof dAppKit;
  }
}
