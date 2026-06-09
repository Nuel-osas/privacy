import { useState } from "react";
import { ConnectButton } from "@mysten/dapp-kit-react/ui";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { SuiIcon } from "./components/icons/sui";
import { GlassButton } from "./components/ui/glass-button";
import { Toaster } from "./components/ui/toast";
import { Landing } from "./screens/Landing";
import { PrivateScreen } from "./screens/PrivateScreen";

export default function App() {
  const [connected, setConnected] = useState(false);

  return (
    <div className="min-h-screen relative">
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[min(1040px,calc(100vw-2rem))]">
        <div className="glass-surface rounded-full pl-2 pr-2 sm:pl-5 sm:pr-3 py-2 flex items-center justify-between gap-2 sm:gap-4">
          <button onClick={() => setConnected(false)} className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-full tactile-violet flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="hidden sm:flex font-semibold tracking-tight text-sm items-center gap-1.5">
              <span className="violet-text">Privacy</span>
              <span className="text-white/40 font-normal flex items-center gap-1">
                on <SuiIcon className="h-3.5 w-3.5" /> Sui
              </span>
            </span>
          </button>

          {connected ? (
            <ConnectButton />
          ) : (
            <GlassButton variant="violet" size="sm" onClick={() => setConnected(true)}>
              Launch <ArrowRight className="h-3.5 w-3.5" />
            </GlassButton>
          )}
        </div>
      </header>

      <main className="min-h-screen flex items-start justify-center px-4 pt-28 pb-24">
        {!connected ? <Landing onLaunch={() => setConnected(true)} /> : <PrivateScreen />}
      </main>

      <footer className="fixed bottom-6 left-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-white/20 pointer-events-none">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-mint-400 animate-pulse" />
          Sui devnet · confidential
        </span>
      </footer>

      <Toaster />
    </div>
  );
}
