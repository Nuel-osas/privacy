import { getFaucetHost, requestSuiFromFaucetV2 } from "@mysten/sui/faucet";

export const SUI_COIN_TYPE = "0x2::sui::SUI";

export function explorerTx(digest: string): string {
  return `https://suiscan.xyz/devnet/tx/${digest}`;
}

export function explorerAddr(address: string): string {
  return `https://suiscan.xyz/devnet/account/${address}`;
}

/** Claim devnet SUI from the official faucet for the given address. */
export async function claimDevnetSui(address: string) {
  return requestSuiFromFaucetV2({
    host: getFaucetHost("devnet"),
    recipient: address,
  });
}

export function formatSui(mist: bigint, dp = 4): string {
  const divisor = 1_000_000_000n;
  const whole = mist / divisor;
  const frac = (mist % divisor).toString().padStart(9, "0").slice(0, dp);
  return `${whole.toLocaleString("en-US")}.${frac}`;
}

export function parseSui(input: string): bigint | null {
  const cleaned = input.replace(/,/g, "").trim();
  if (!/^\d*\.?\d*$/.test(cleaned) || cleaned === "" || cleaned === ".") return null;
  const [whole = "0", frac = ""] = cleaned.split(".");
  const fracPadded = (frac + "000000000").slice(0, 9);
  try {
    return BigInt(whole) * 1_000_000_000n + BigInt(fracPadded);
  } catch {
    return null;
  }
}
