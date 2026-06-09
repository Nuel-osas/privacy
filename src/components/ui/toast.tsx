import { atom } from "nanostores";
import { useStore } from "@nanostores/react";
import { Check, X, ShieldCheck } from "lucide-react";

export type ToastKind = "success" | "error" | "info";
export interface Toast {
  id: string;
  kind: ToastKind;
  text: string;
}

const $toasts = atom<Toast[]>([]);
let n = 0;

export function toast(text: string, kind: ToastKind = "success") {
  const id = `t${n++}`;
  $toasts.set([...$toasts.get(), { id, kind, text }]);
  setTimeout(() => {
    $toasts.set($toasts.get().filter((t) => t.id !== id));
  }, 3600);
}

export function Toaster() {
  const toasts = useStore($toasts);
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{ animation: "ct-toast 3.6s ease-in-out" }}
          className="glass-surface-strong rounded-full pl-3 pr-4 py-2 flex items-center gap-2 text-xs font-medium whitespace-nowrap"
        >
          <span
            className={
              t.kind === "error"
                ? "text-red-300"
                : t.kind === "info"
                  ? "text-violet-300"
                  : "text-mint-300"
            }
          >
            {t.kind === "error" ? (
              <X className="h-3.5 w-3.5" />
            ) : t.kind === "info" ? (
              <ShieldCheck className="h-3.5 w-3.5" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
          </span>
          {t.text}
        </div>
      ))}
    </div>
  );
}
