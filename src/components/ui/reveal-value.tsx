import { useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { cn } from "../../lib/utils";

type Props = {
  /** The decrypted, formatted value (e.g. "1,234.56"). */
  value: string;
  symbol?: string;
  /** Size of the numerals. */
  size?: "md" | "lg" | "xl";
  className?: string;
  /** Label shown under the eye when hidden. */
  hint?: string;
};

/**
 * The signature component: a balance that is an opaque ciphertext until the
 * holder "decrypts" it with their viewing key. Mirrors the real UX — the
 * number is never on-chain in cleartext; only the key holder can reveal it.
 */
export function RevealValue({ value, symbol, size = "xl", hint, className }: Props) {
  const [revealed, setRevealed] = useState(false);
  const numCls =
    size === "xl"
      ? "text-6xl"
      : size === "lg"
        ? "text-4xl"
        : "text-2xl";

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <button
        onClick={() => setRevealed((r) => !r)}
        className="group flex items-center gap-3 transition-transform active:scale-[0.99]"
        aria-label={revealed ? "Hide balance" : "Decrypt balance"}
      >
        {revealed ? (
          <span className={cn(numCls, "font-medium numeric-display leading-none")}>
            {value}
          </span>
        ) : (
          <span
            className={cn(
              numCls,
              "font-medium numeric-display leading-none violet-text tracking-widest select-none",
            )}
          >
            ••••••
          </span>
        )}
        {symbol && <span className="text-sm text-white/40 font-mono mt-2">{symbol}</span>}
      </button>
      <button
        onClick={() => setRevealed((r) => !r)}
        className={cn(
          "mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium rounded-full px-3 py-1 transition-colors",
          revealed
            ? "glass-pill text-white/50 hover:text-white/80"
            : "tactile-violet",
        )}
      >
        {revealed ? (
          <>
            <EyeOff className="h-3 w-3" />
            Hide
          </>
        ) : (
          <>
            <KeyRound className="h-3 w-3" />
            Decrypt with viewing key
          </>
        )}
      </button>
      {!revealed && hint && (
        <div className="mt-2 text-[10px] text-white/30 font-mono flex items-center gap-1">
          <Eye className="h-2.5 w-2.5" />
          {hint}
        </div>
      )}
    </div>
  );
}
