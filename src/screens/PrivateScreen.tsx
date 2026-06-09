import { useState } from "react";
import { useCurrentAccount, useCurrentClient, useDAppKit } from "@mysten/dapp-kit-react";
import { ConnectButton } from "@mysten/dapp-kit-react/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isValidSuiAddress } from "@mysten/sui/utils";
import { ArrowRight, Droplets, KeyRound, Layers, Lock, Send, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { GlassCard } from "../components/ui/glass-card";
import { GlassButton } from "../components/ui/glass-button";
import { RevealValue } from "../components/ui/reveal-value";
import { toast } from "../components/ui/toast";
import {
  BU_TYPE,
  buildActivateTx,
  buildFundTx,
  buildMergeTx,
  buildTransferTx,
  fetchBalance,
  fetchSuiGas,
  hasViewingKey,
  isRegistered,
  unlockViewingKey,
} from "../lib/confidential";
import { claimDevnetSui, explorerTx, formatSui, parseSui } from "../lib/devnet";
import { shortHex } from "../lib/format";

export function PrivateScreen() {
  const account = useCurrentAccount();
  if (!account) {
    return (
      <div className="w-full max-w-md">
        <GlassCard variant="strong" className="p-10 text-center">
          <div className="h-14 w-14 rounded-2xl tactile-violet mx-auto mb-5 flex items-center justify-center">
            <Wallet className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight mb-2">Confidential transfers</h2>
          <p className="text-sm text-white/50 mb-7 leading-relaxed">
            Connect a wallet to send <span className="text-white/80">real</span> confidential
            transfers on Sui devnet — amounts encrypted on-chain, verifiable on the explorer.
          </p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
          <p className="mt-5 text-[11px] text-white/30 font-mono">No wallet? Pick “Burner”.</p>
        </GlassCard>
      </div>
    );
  }
  return <PrivateDashboard address={account.address} />;
}

function PrivateDashboard({ address }: { address: string }) {
  const client = useCurrentClient();
  const dAppKit = useDAppKit();
  const qc = useQueryClient();

  const [amount, setAmount] = useState("");
  const [to, setTo] = useState("");
  const [lastTx, setLastTx] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(() => hasViewingKey(address));

  const regKey = ["creg", address];
  const balKey = ["cbal", address];
  const gasKey = ["cgas", address];

  const { data: registered } = useQuery({
    queryKey: regKey,
    queryFn: () => isRegistered(address),
  });
  const { data: bal } = useQuery({
    queryKey: balKey,
    enabled: unlocked && registered === true,
    refetchInterval: 8000,
    queryFn: () => fetchBalance(address),
  });
  const { data: gas } = useQuery({
    queryKey: gasKey,
    refetchInterval: 5000,
    queryFn: () => fetchSuiGas(address),
  });

  async function exec(tx: Awaited<ReturnType<typeof buildActivateTx>>) {
    const r = await dAppKit.signAndExecuteTransaction({ transaction: tx });
    if (r.$kind === "FailedTransaction") throw new Error("Transaction rejected");
    const digest = r.Transaction.digest;
    await client.waitForTransaction({ digest });
    setLastTx(digest);
    return digest;
  }
  const refresh = () => {
    qc.invalidateQueries({ queryKey: regKey });
    qc.invalidateQueries({ queryKey: balKey });
  };

  const unlock = useMutation({
    mutationFn: async () => unlockViewingKey(dAppKit as never, address),
    onSuccess: () => {
      setUnlocked(true);
      toast("Confidential account unlocked ✓");
      refresh();
    },
    onError: (e) => toast(e instanceof Error ? e.message : "unlock failed", "error"),
  });

  const gasFaucet = useMutation({
    mutationFn: async () => claimDevnetSui(address),
    onSuccess: () => {
      toast("Requested devnet SUI for gas — funding…", "info");
      setTimeout(() => qc.invalidateQueries({ queryKey: gasKey }), 3000);
    },
    onError: (e) => toast(e instanceof Error ? e.message : "faucet failed", "error"),
  });

  const activate = useMutation({
    mutationFn: async () => exec(await buildActivateTx(address)),
    onSuccess: () => {
      toast("Confidential account activated ✓");
      refresh();
    },
    onError: (e) => toast(e instanceof Error ? e.message : "failed", "error"),
  });

  const fund = useMutation({
    mutationFn: async () => {
      const amt = parseSui(amount);
      if (amt == null || amt <= 0n) throw new Error("Enter an amount");
      return exec(await buildFundTx(address, amt));
    },
    onSuccess: () => {
      toast("Minted + wrapped into confidential balance", "info");
      setAmount("");
      refresh();
    },
    onError: (e) => toast(e instanceof Error ? e.message : "failed", "error"),
  });

  const merge = useMutation({
    mutationFn: async () => exec(await buildMergeTx(address)),
    onSuccess: () => {
      toast("Merged pending → balance");
      refresh();
    },
    onError: (e) => toast(e instanceof Error ? e.message : "failed", "error"),
  });

  const send = useMutation({
    mutationFn: async () => {
      const amt = parseSui(amount);
      if (amt == null || amt <= 0n) throw new Error("Enter an amount");
      if (!isValidSuiAddress(to.trim())) throw new Error("Invalid recipient address");
      if (!(await isRegistered(to.trim())))
        throw new Error("Recipient hasn't activated a confidential account yet");
      return exec(await buildTransferTx(address, to.trim(), amt));
    },
    onSuccess: () => {
      toast("Sent confidentially — amount hidden 🔒", "info");
      setAmount("");
      refresh();
    },
    onError: (e) => toast(e instanceof Error ? e.message : "failed", "error"),
  });

  const busy = activate.isPending || fund.isPending || send.isPending || merge.isPending;
  // Wrapped/received funds sit in pending (encrypted + public) until merged.
  const pendingTotal = bal ? bal.pending + bal.pendingPublic : 0n;

  if (!unlocked) {
    return (
      <div className="w-full max-w-md">
        <GlassCard variant="strong" className="p-8 text-center">
          <div className="h-12 w-12 rounded-2xl tactile-violet mx-auto mb-4 flex items-center justify-center">
            <KeyRound className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight mb-2">Unlock confidential account</h2>
          <p className="text-sm text-white/50 mb-2 leading-relaxed">
            Sign a message to derive your <b>viewing key</b>. It&apos;s computed from your wallet — the
            same on every device — and never leaves your browser.
          </p>
          <p className="text-[11px] text-white/30 font-mono mb-6">no funds move · just a signature</p>
          <GlassButton variant="violet" size="lg" className="w-full" onClick={() => unlock.mutate()} loading={unlock.isPending}>
            <KeyRound className="h-4 w-4" /> Unlock with wallet
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  if (registered === false) {
    return (
      <div className="w-full max-w-md">
        <GlassCard variant="strong" className="p-8 text-center">
          <div className="h-12 w-12 rounded-2xl tactile-violet mx-auto mb-4 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight mb-2">Activate confidential account</h2>
          <p className="text-sm text-white/50 mb-2 leading-relaxed">
            One-time setup: register your encrypted account for the open token <b>BU</b>. Once it&apos;s
            active you can mint &amp; wrap funds and send confidentially.
          </p>
          <p className="text-[11px] text-white/30 font-mono mb-6">
            {shortHex(address, 10, 6)} · {gas !== undefined ? formatSui(gas) : "…"} SUI
          </p>
          {gas !== undefined && gas === 0n ? (
            <>
              <GlassButton
                variant="mint"
                size="lg"
                className="w-full"
                onClick={() => gasFaucet.mutate()}
                loading={gasFaucet.isPending}
              >
                <Droplets className="h-4 w-4" /> Claim devnet SUI (gas)
              </GlassButton>
              <p className="mt-3 text-[11px] text-amber-200/70 font-mono">
                This wallet has no SUI — claim some to pay for the activation tx.
              </p>
            </>
          ) : (
            <GlassButton
              variant="violet"
              size="lg"
              className="w-full"
              onClick={() => activate.mutate()}
              loading={activate.isPending}
              disabled={gas === undefined}
            >
              <ShieldCheck className="h-4 w-4" /> Activate confidential account
            </GlassButton>
          )}
        </GlassCard>
      </div>
    );
  }

  if (bal?.keyMismatch) {
    return (
      <div className="w-full max-w-md">
        <GlassCard variant="strong" className="p-8 text-center">
          <div className="h-12 w-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 text-amber-200 mx-auto mb-4 flex items-center justify-center">
            <KeyRound className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight mb-2">Account key mismatch</h2>
          <p className="text-sm text-white/50 mb-5 leading-relaxed">
            This account ({shortHex(address)}) was registered with a different viewing key, so its
            encrypted balance can&apos;t be read with your wallet&apos;s current key. Connect a fresh
            wallet to set up a clean confidential account.
          </p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <GlassCard variant="strong" className="p-7">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-violet-300">
            <Lock className="h-3.5 w-3.5" /> Confidential · BU · devnet
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => gasFaucet.mutate()}
              title="Claim devnet SUI for gas"
              className="text-[10px] text-white/40 hover:text-white/70 inline-flex items-center gap-1 glass-pill rounded-full px-2 py-1"
            >
              <Droplets className="h-3 w-3" /> gas
            </button>
            <span className="text-[10px] text-white/30 font-mono">{shortHex(address)}</span>
          </div>
        </div>

        <div className="py-2">
          <RevealValue value={bal ? formatSui(bal.active) : "—"} symbol="BU" hint="spendable · encrypted on-chain · only your key decrypts" />
        </div>

        {pendingTotal > 0n ? (
          <div className="mt-4 flex items-center justify-between glass-surface rounded-2xl px-4 py-3">
            <span className="flex items-center gap-2 text-sm text-white/70">
              <Layers className="h-4 w-4 text-violet-300" />
              {formatSui(pendingTotal)} BU pending
              <span className="text-white/30 font-mono text-[10px]">merge to make spendable</span>
            </span>
            <GlassButton size="sm" variant="violet" onClick={() => merge.mutate()} loading={merge.isPending}>
              Merge
            </GlassButton>
          </div>
        ) : bal && bal.active === 0n ? (
          <div className="mt-3 text-center text-[11px] text-white/35 font-mono">
            Use “Mint + wrap” below to add confidential funds.
          </div>
        ) : null}
      </GlassCard>

      <GlassCard variant="strong" className="p-7 space-y-4">
        <div className="glass-surface rounded-2xl px-5 py-3.5 flex items-center gap-3">
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="min-w-0 flex-1 bg-transparent outline-none text-2xl font-medium numeric-display text-white placeholder:text-white/20"
          />
          <span className="text-xs text-white/40 font-mono">BU</span>
        </div>

        <GlassButton variant="glass" className="w-full" onClick={() => fund.mutate()} loading={fund.isPending} disabled={busy}>
          <Sparkles className="h-4 w-4" /> Mint + wrap (add confidential funds)
        </GlassButton>

        <div className="pt-2">
          <label className="text-[10px] uppercase tracking-widest text-white/40">Send to (must be activated)</label>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="0x…"
            className="w-full glass-surface rounded-2xl px-4 py-3 mt-2 bg-transparent outline-none text-sm font-mono text-white placeholder:text-white/20"
          />
        </div>
        <GlassButton variant="violet" size="lg" className="w-full" onClick={() => send.mutate()} loading={send.isPending} disabled={busy}>
          Send confidentially <ArrowRight className="h-4 w-4" />
        </GlassButton>
        <div className="text-[10px] text-white/30 font-mono flex items-center gap-1.5">
          <Lock className="h-3 w-3 text-violet-300/70" /> Proof generated in-browser (WASM). Amount is hidden on-chain.
        </div>
      </GlassCard>

      {lastTx && (
        <a
          href={explorerTx(lastTx)}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-[11px] text-white/40 hover:text-white/70 font-mono glass-pill rounded-full py-2"
        >
          <Send className="h-3 w-3 inline mr-1.5" /> last tx: {shortHex(lastTx, 8, 6)} — verify on Suiscan ↗
        </a>
      )}
    </div>
  );
}

void BU_TYPE;
