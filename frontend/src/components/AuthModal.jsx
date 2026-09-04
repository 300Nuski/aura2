import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { LogIn, UserPlus, Crown } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { useApp } from "@/context/AppContext";

const formatDetail = (detail) => {
  if (detail == null) return "Etwas ist schiefgelaufen. Bitte erneut versuchen.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : String(e))).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
};

const inputCls =
  "w-full rounded-xl bg-surface-2 border border-line px-4 py-3 text-sm text-txt focus:outline-none focus-visible:ring-2 focus-visible:ring-aqua-2 focus:border-aqua/40 placeholder:text-dim-2";

export const AuthModal = () => {
  const { login, register } = useAuth();
  const { authOpen, setAuthOpen } = useApp();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        const u = await login(email, password);
        toast.success(`Willkommen zurück, ${u.name}!`);
      } else {
        const u = await register(name, email, password);
        toast.success(`Willkommen bei Aura Royale, ${u.name}! Startguthaben: 1.561 €`);
      }
      setAuthOpen(false);
      setPassword("");
    } catch (err) {
      setError(formatDetail(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={authOpen} onOpenChange={setAuthOpen}>
      <DialogContent className="bg-surface border border-line text-txt sm:max-w-md rounded-2xl shadow-raised p-0 overflow-hidden" data-testid="auth-modal">
        <div className="relative px-6 pt-6 pb-4 bg-panel border-b border-line-2 grain">
          <span className="w-11 h-11 rounded-xl bg-brand flex items-center justify-center shadow-glow-brand mb-4">
            <Crown className="w-5 h-5 text-brand-fg" strokeWidth={2.4} />
          </span>
          <DialogHeader className="text-left">
            <DialogTitle className="font-display text-2xl font-bold tracking-[-0.02em]">{mode === "login" ? "Willkommen zurück" : "Konto erstellen"}</DialogTitle>
            <DialogDescription className="text-sm text-dim">
              {mode === "login" ? "Melde dich an, um Guthaben, Verlauf und Chat zu nutzen." : "Kostenlos registrieren — du startest mit 1.561 € Spielgeld."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 pt-4">
          <div className="flex gap-1 rounded-full bg-surface-2 border border-line p-1 mb-5" data-testid="auth-mode-tabs">
            {[
              ["login", "Anmelden", LogIn],
              ["register", "Registrieren", UserPlus],
            ].map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setMode(id);
                  setError("");
                }}
                className={`flex-1 rounded-full py-2 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors duration-200 ${
                  mode === id ? "bg-raised text-txt shadow-glow-aqua" : "text-dim hover:text-txt"
                }`}
                data-testid={`auth-tab-${id}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "register" && (
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dein Anzeigename" required minLength={2} maxLength={40} className={inputCls} data-testid="auth-name-input" />
            )}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-Mail-Adresse" required className={inputCls} data-testid="auth-email-input" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Passwort (min. 6 Zeichen)" required minLength={6} className={inputCls} data-testid="auth-password-input" />

            {error && (
              <p className="rounded-lg bg-danger/10 border border-danger/40 text-danger-2 text-xs px-3.5 py-2.5" data-testid="auth-error">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="w-full rounded-xl bg-brand text-brand-fg font-bold text-sm py-3.5 hover:brightness-105 transition-[filter] duration-200 disabled:opacity-50 shadow-glow-brand active:scale-[0.98]" data-testid="auth-submit-button">
              {loading ? "Einen Moment …" : mode === "login" ? "Anmelden" : "Konto erstellen"}
            </button>
          </form>

          <p className="mt-4 text-[11px] text-dim-2 leading-relaxed">Demo-Plattform: Dein Konto speichert nur Spielgeld. 18+ · Keine Echtgeld-Spiele.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
