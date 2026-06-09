import { useEffect, useState } from "react";
import {
  ArrowRight,
  Eye,
  KeyRound,
  Lock,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { GlassButton } from "../components/ui/glass-button";
import { GlassCard } from "../components/ui/glass-card";
import { SuiIcon } from "../components/icons/sui";
import { cn } from "../lib/utils";

export function Landing({ onLaunch }: { onLaunch: () => void }) {
  return (
    <div className="w-full max-w-6xl">
      <div className="grid md:grid-cols-2 gap-10 md:gap-12 items-center">
        <div className="order-2 md:order-1">
          <div className="text-[10px] uppercase tracking-[0.3em] text-violet-300 mb-3 md:mb-4 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            Confidential transfers · Sui devnet
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05] mb-4 md:mb-5">
            Save and send
            <br />
            <span className="violet-text">without revealing amounts.</span>
          </h1>
          <p className="text-sm md:text-lg text-white/60 mb-6 md:mb-9 leading-relaxed max-w-md">
            Confidential payments on Sui. Balances and transfer amounts
            are encrypted on-chain with Twisted ElGamal over Ristretto255 — the
            cryptography behind Sui&apos;s new confidential transfers. Only your
            viewing key decrypts them.
          </p>
          <div className="flex items-center gap-3">
            <GlassButton variant="violet" size="lg" onClick={onLaunch} className="px-8">
              Launch demo
              <ArrowRight className="h-4 w-4 ml-1" />
            </GlassButton>
            <div className="text-[11px] text-white/40 font-mono leading-tight">
              real ElGamal crypto
              <br />
              in your browser
            </div>
          </div>
        </div>

        <div className="order-1 md:order-2 relative h-[360px] sm:h-[420px] md:h-[500px] flex items-center justify-center">
          <ConfidentialSlab />
        </div>
      </div>

      <div className="mt-12 md:mt-24 grid sm:grid-cols-2 md:grid-cols-4 gap-3">
        {FEATURES.map((f) => (
          <Feature key={f.title} {...f} />
        ))}
      </div>

      <div className="mt-14 flex flex-wrap items-center justify-between gap-4 text-[11px] text-white/40 font-mono px-1">
        <span className="flex items-center gap-2">
          <SuiIcon className="h-4 w-4" />
          Built on Sui confidential transfers (Contra) — devnet public beta
        </span>
        <span className="text-white/30">Twisted ElGamal · Ristretto255 · Bulletproofs</span>
      </div>
    </div>
  );
}

type FeatureData = { icon: React.ReactNode; title: string; desc: string };
const FEATURES: FeatureData[] = [
  {
    icon: <Lock className="h-4 w-4" />,
    title: "Hidden balances",
    desc: "Your balance lives on-chain as opaque ciphertext. The number is never public.",
  },
  {
    icon: <KeyRound className="h-4 w-4" />,
    title: "Owner-only decrypt",
    desc: "Encrypted under your viewing key. Only you (or an authorized auditor) can read amounts.",
  },
  {
    icon: <ShieldCheck className="h-4 w-4" />,
    title: "Compliant by design",
    desc: "Optional auditor key + zero-knowledge selective disclosure. Private, not a black box.",
  },
  {
    icon: <Send className="h-4 w-4" />,
    title: "Confidential send",
    desc: "Send any amount account-to-account. The value is encrypted to the recipient's key — only they can read it.",
  },
];

function Feature({ icon, title, desc }: FeatureData) {
  return (
    <GlassCard variant="strong" className="p-6">
      <div className="h-8 w-8 rounded-xl glass-pill flex items-center justify-center text-violet-300 mb-4">
        {icon}
      </div>
      <div className="text-sm font-medium mb-1.5">{title}</div>
      <div className="text-xs text-white/50 leading-relaxed">{desc}</div>
    </GlassCard>
  );
}

const CIPHER_ROWS = [
  "c2 9a4f e0b1 77d3 1f8a 6c20",
  "d4 11be a93c 0f57 e8d6 4a90",
  "8b 5cf6 c4b5 fd34 e8b5 1a2c",
  "a7 8bfa 7c3a ed19 b9a3 fc05",
];

function ConfidentialSlab() {
  const [revealed, setRevealed] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const a = setInterval(() => setRevealed((r) => !r), 4200);
    const b = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      clearInterval(a);
      clearInterval(b);
    };
  }, []);

  return (
    <>
      <div
        className="absolute inset-0 -z-10 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 55% 45%, rgba(139,92,246,0.22), transparent 60%)",
        }}
      />
      <div
        className="absolute top-1 right-2 h-12 w-12 rounded-2xl glass-surface flex items-center justify-center"
        style={{ animation: "vault-float 4.5s ease-in-out infinite", transform: "rotate(6deg)" }}
      >
        <Lock className="h-5 w-5 text-violet-300" />
      </div>
      <div
        className="absolute bottom-2 left-2 h-11 w-11 rounded-2xl glass-surface flex items-center justify-center"
        style={{ animation: "vault-float 5s ease-in-out infinite reverse", transform: "rotate(-6deg)" }}
      >
        <SuiIcon className="h-6 w-6" />
      </div>

      <div
        className="relative w-[300px] h-[300px] sm:w-[360px] sm:h-[330px] md:w-[420px] md:h-[360px] rounded-3xl p-6 md:p-8"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 100%)",
          border: "1px solid rgba(255,255,255,0.15)",
          backdropFilter: "blur(24px) saturate(160%)",
          WebkitBackdropFilter: "blur(24px) saturate(160%)",
          transform: "perspective(900px) rotateY(-12deg) rotateX(8deg)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.40), 0 60px 120px -20px rgba(0,0,0,0.7), 0 0 80px -20px rgba(139,92,246,0.4)",
          animation: "vault-breath 8s ease-in-out infinite",
        }}
      >
        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-3">
          Confidential balance
        </div>

        <div className="flex items-center gap-2.5 mb-6" style={{ minHeight: 48 }}>
          {revealed ? (
            <span className="text-4xl md:text-5xl font-medium numeric-display" style={{ animation: "ct-fade 0.4s" }}>
              48,250.00
            </span>
          ) : (
            <span className="text-4xl md:text-5xl font-medium numeric-display violet-text tracking-widest">
              ••••••••
            </span>
          )}
          <span className="text-xs text-white/40 font-mono mt-3">pUSD</span>
        </div>

        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2 flex items-center gap-1.5">
          {revealed ? (
            <>
              <KeyRound className="h-3 w-3 text-mint-300" /> decrypted with viewing key
            </>
          ) : (
            <>
              <Lock className="h-3 w-3 text-violet-300" /> on-chain ciphertext (what the public sees)
            </>
          )}
        </div>

        <div className="space-y-1.5 mb-5">
          {CIPHER_ROWS.map((r, i) => (
            <div
              key={i}
              className={cn(
                "cipher-mono text-[10px] rounded-md px-2 py-1 transition-opacity duration-500",
                revealed ? "opacity-20" : "opacity-100 cipher-shimmer",
              )}
            >
              {r}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-[10px] text-white/30 font-mono">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-violet-300/70" />
            Twisted ElGamal · Ristretto255
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full glass-pill">
            <Eye className="h-2.5 w-2.5" />
            {revealed ? "you" : "private"}
          </span>
        </div>
        <div className="absolute bottom-3 right-4 text-[9px] text-white/20 font-mono">{tick % 2 === 0 ? "●" : "○"} live</div>
      </div>
    </>
  );
}
