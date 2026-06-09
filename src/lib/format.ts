// Display + parsing helpers for the demo token (pUSD, 2 decimals).

export const TOKEN_DECIMALS = 2;

export function formatUnits(base: bigint, decimals = TOKEN_DECIMALS): string {
  const divisor = 10n ** BigInt(decimals);
  const whole = base / divisor;
  const frac = (base % divisor).toString().padStart(decimals, "0");
  return `${whole.toLocaleString("en-US")}.${frac}`;
}

export function parseUnits(input: string, decimals = TOKEN_DECIMALS): bigint | null {
  const cleaned = input.replace(/,/g, "").trim();
  if (!/^\d*\.?\d*$/.test(cleaned) || cleaned === "" || cleaned === ".") return null;
  const [whole = "0", frac = ""] = cleaned.split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  try {
    return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fracPadded);
  } catch {
    return null;
  }
}

export function shortHex(s: string, lead = 6, tail = 4): string {
  if (!s) return "";
  if (s.length <= lead + tail + 1) return s;
  return `${s.slice(0, lead)}…${s.slice(-tail)}`;
}

export type Countdown = { d: number; h: number; m: number; s: number; totalMs: number };

export function timeRemaining(unlockMs: number, nowMs: number): Countdown {
  const totalMs = Math.max(0, unlockMs - nowMs);
  return {
    d: Math.floor(totalMs / 86_400_000),
    h: Math.floor((totalMs % 86_400_000) / 3_600_000),
    m: Math.floor((totalMs % 3_600_000) / 60_000),
    s: Math.floor((totalMs % 60_000) / 1000),
    totalMs,
  };
}

export function compactRemaining(c: Countdown): string {
  if (c.totalMs === 0) return "unlocked";
  if (c.d > 0) return `${c.d}d ${c.h.toString().padStart(2, "0")}h`;
  if (c.h > 0) return `${c.h}h ${c.m.toString().padStart(2, "0")}m`;
  return `${c.m}m ${c.s.toString().padStart(2, "0")}s`;
}

export function relativeAgo(ms: number, nowMs: number): string {
  const diff = Math.max(0, nowMs - ms);
  const m = Math.floor(diff / 60_000);
  if (diff < 5000) return "just now";
  if (m < 1) return `${Math.floor(diff / 1000)}s ago`;
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return `${m}m ago`;
  const d = Math.floor(diff / 86_400_000);
  if (d < 1) return `${h}h ago`;
  return `${d}d ago`;
}
