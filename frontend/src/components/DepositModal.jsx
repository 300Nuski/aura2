import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Wallet, Check } from "lucide-react";
import api from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/auth/AuthContext";
import { fmt } from "@/lib/format";

const PRESETS = [1000, 5000, 10000, 25000];

export const DepositModal = () => {
  const { depositOpen, setDepositOpen, setBalance, balance } = useApp();
  const { user } = useAuth();
  const [amount, setAmount] = useState(5000);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);

  const effective = custom !== "" ? Math.floor(Number(custom)) : amount;
  const valid = Number.isFinite(effective) && effective >= 100 && effective <= 100000;

  const deposit = async () => {
    if (!valid || loading) return;
    setLoading(true);
    try {
      const r = await api.post("/wallet/deposit", { amount: effective });
      setBalance(r.data.balance);
      toast.success(`${fmt(effective)} Spielgeld gutgeschrieben.`);
      setDepositOpen(false);
      setCustom("");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Aufladen fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
      <DialogContent className="bg-surface border border-line text-txt sm:max-w-md rounded-2xl shadow-raised" data-testid="deposit-modal">
        <DialogHeader className="text-left">
          <span className="w-11 h-11 rounded-xl bg-brand/15 border border-brand/30 flex items-center justify-center mb-3">
            <Wallet className="w-5 h-5 text-brand" />
          </span>
          <DialogTitle className="font-display text-2xl font-bold tracking-[-0.02em]">Guthaben aufladen</DialogTitle>
          <DialogDescription className="text-sm text-dim">
            Spielgeld für {user?.name || "dich"} — kostenlos und sofort verfügbar. Aktuell: <span className="font-mono text-txt">{fmt(balance)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 mt-2">
          {PRESETS.map((p) => {
            const active = custom === "" && amount === p;
            return (
              <button
                key={p}
                onClick={() => {
                  setAmount(p);
                  setCustom("");
                }}
                className={`rounded-xl border px-4 py-3.5 text-left transition-colors duration-200 ${active ? "bg-brand/12 border-brand/60" : "bg-panel border-line hover:border-brand/40"}`}
                data-testid={`deposit-preset-${p}`}
              >
                <span className={`font-mono font-semibold text-base tabular ${active ? "text-brand" : "text-txt"}`}>{p.toLocaleString("de-DE")} €</span>
                {active && <Check className="w-4 h-4 text-brand float-right mt-1" />}
              </button>
            );
          })}
        </div>

        <div className="mt-3">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-dim mb-2">Eigener Betrag (100 – 100.000 €)</label>
          <input
            type="number"
            min={100}
            max={100000}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="z. B. 2500"
            className="w-full rounded-xl bg-surface-2 border border-line px-4 py-3 font-mono text-sm text-txt focus:outline-none focus-visible:ring-2 focus-visible:ring-aqua-2 placeholder:text-dim-2"
            data-testid="deposit-custom-input"
          />
        </div>

        <button
          onClick={deposit}
          disabled={!valid || loading}
          className="mt-4 w-full rounded-xl bg-brand text-brand-fg font-bold text-sm py-3.5 hover:brightness-105 transition-[filter] duration-200 disabled:opacity-40 shadow-glow-brand active:scale-[0.98]"
          data-testid="deposit-confirm-button"
        >
          {loading ? "Wird gutgeschrieben …" : valid ? `${effective.toLocaleString("de-DE")} € aufladen` : "Betrag wählen"}
        </button>
        <p className="text-[11px] text-dim-2 leading-relaxed">Demo-Simulation: Es fließt kein echtes Geld. 18+ · Spielgeld ohne Auszahlung.</p>
      </DialogContent>
    </Dialog>
  );
};
