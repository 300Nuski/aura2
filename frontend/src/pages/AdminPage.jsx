import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Users, Coins, Crown, Check, Activity } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { useApp } from "@/context/AppContext";
import api from "@/lib/api";
import { fmt, fmtSigned, initials } from "@/lib/format";
import { Panel, StatCard, EmptyState, Skeleton, PrimaryButton } from "@/components/common/Bits";
import { PageHeader } from "@/components/shell/PageHeader";

export default function AdminPage() {
  const { user } = useAuth();
  const { openAuth } = useApp();
  const [users, setUsers] = useState(null);
  const [editBalance, setEditBalance] = useState({});
  const [saving, setSaving] = useState(null);

  const load = () => api.get("/admin/users").then((r) => setUsers(r.data)).catch(() => setUsers([]));

  useEffect(() => {
    if (user?.role === "admin") load();
  }, [user]);

  if (user === null) {
    return (
      <Panel className="p-10" data-testid="admin-no-auth">
        <EmptyState icon={ShieldCheck} title="Bitte anmelden" text="Du musst eingeloggt sein, um das Admin-Panel zu sehen." action={<PrimaryButton onClick={openAuth}>Anmelden</PrimaryButton>} />
      </Panel>
    );
  }
  if (user && user.role !== "admin") {
    return (
      <Panel className="p-10 border-danger/30" data-testid="admin-forbidden">
        <EmptyState icon={ShieldCheck} title="Kein Zugriff" text="Dieser Bereich ist nur für Administratoren." />
      </Panel>
    );
  }

  const saveBalance = async (id) => {
    const val = Math.floor(Number(editBalance[id]));
    if (!Number.isFinite(val) || val < 0) {
      toast.error("Ungültiger Betrag.");
      return;
    }
    setSaving(id);
    try {
      await api.put(`/admin/users/${id}/balance`, { balance: val });
      toast.success("Guthaben aktualisiert.");
      setUsers((us) => us.map((u) => (u.id === id ? { ...u, balance: val } : u)));
    } catch {
      toast.error("Speichern fehlgeschlagen.");
    } finally {
      setSaving(null);
    }
  };

  const toggleRole = async (u) => {
    const next = u.role === "admin" ? "user" : "admin";
    try {
      await api.put(`/admin/users/${u.id}/role`, { role: next });
      toast.success(next === "admin" ? `${u.name} ist jetzt Admin.` : `${u.name} ist jetzt Nutzer.`);
      setUsers((us) => us.map((x) => (x.id === u.id ? { ...x, role: next } : x)));
    } catch (e) {
      toast.error(e.response?.data?.detail || "Rollenwechsel fehlgeschlagen.");
    }
  };

  const totalBalance = (users ?? []).reduce((s, u) => s + u.balance, 0);
  const totalRounds = (users ?? []).reduce((s, u) => s + (u.rounds || 0), 0);
  const adminCount = (users ?? []).filter((u) => u.role === "admin").length;

  return (
    <div data-testid="admin-page">
      <PageHeader title="Admin-Panel" subtitle="Nutzerverwaltung · Guthaben, Rollen & Aktivität" icon={ShieldCheck} color="#E7C77A" testId="admin" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Users} label="Nutzer" value={users?.length ?? "—"} data-testid="admin-stat-users" />
        <StatCard icon={Coins} label="Guthaben gesamt" value={fmt(totalBalance)} tone="gold" data-testid="admin-stat-balance" />
        <StatCard icon={Activity} label="Runden gesamt" value={totalRounds.toLocaleString("de-DE")} tone="aqua" data-testid="admin-stat-rounds" />
        <StatCard icon={Crown} label="Admins" value={adminCount} data-testid="admin-stat-admins" />
      </div>

      <Panel className="overflow-hidden" data-testid="admin-users-table">
        <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-3 border-b border-line-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-dim-2">
          <span className="col-span-4">Nutzer</span>
          <span className="col-span-1">Rolle</span>
          <span className="col-span-2">Aktivität</span>
          <span className="col-span-3">Guthaben</span>
          <span className="col-span-2 text-right">Aktion</span>
        </div>
        {users === null && (
          <div className="p-5 space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        )}
        {(users ?? []).map((u) => (
          <div key={u.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 px-5 py-4 border-b border-line-2 items-center hover:bg-aqua/[0.03] transition-colors duration-200" data-testid={`admin-user-row-${u.id}`}>
            <div className="md:col-span-4 flex items-center gap-3 min-w-0">
              <span className="shrink-0 w-9 h-9 rounded-full bg-raised border border-line flex items-center justify-center text-[11px] font-bold">{initials(u.name)}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  {u.name}
                  {u.id === user.id && <span className="ml-2 text-[9px] font-mono text-brand">DU</span>}
                </p>
                <p className="text-xs text-dim truncate">{u.email}</p>
              </div>
            </div>
            <div className="md:col-span-1">
              <span className={`rounded px-2 py-1 text-[10px] font-mono font-bold border ${u.role === "admin" ? "bg-brand/15 text-brand border-brand/40" : "bg-surface-2 text-dim border-line"}`} data-testid={`admin-role-badge-${u.id}`}>
                {u.role === "admin" ? "ADMIN" : "USER"}
              </span>
            </div>
            <div className="md:col-span-2 text-xs font-mono text-dim">
              {u.rounds} Runden
              <span className={`block ${u.profit >= 0 ? "text-win" : "text-danger-2"}`}>{fmtSigned(u.profit)}</span>
            </div>
            <div className="md:col-span-3 flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={editBalance[u.id] ?? u.balance}
                onChange={(e) => setEditBalance((m) => ({ ...m, [u.id]: e.target.value }))}
                className="w-28 rounded-lg bg-surface-2 border border-line px-2.5 py-2 font-mono text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-aqua-2"
                data-testid={`admin-balance-input-${u.id}`}
              />
              <button onClick={() => saveBalance(u.id)} disabled={saving === u.id} className="w-9 h-9 rounded-lg bg-win/15 border border-win/40 text-win flex items-center justify-center hover:bg-win hover:text-[#04150d] transition-colors duration-200 disabled:opacity-40" data-testid={`admin-save-balance-${u.id}`} aria-label="Guthaben speichern">
                <Check className="w-4 h-4" />
              </button>
            </div>
            <div className="md:col-span-2 md:text-right">
              <button
                onClick={() => toggleRole(u)}
                disabled={u.id === user.id}
                className={`rounded-lg px-3.5 py-2 text-xs font-bold border transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed ${u.role === "admin" ? "bg-surface-2 border-danger/40 text-danger-2 hover:bg-danger/15" : "bg-surface-2 border-brand/40 text-brand hover:bg-brand/15"}`}
                data-testid={`admin-role-toggle-${u.id}`}
              >
                {u.role === "admin" ? "Admin entfernen" : "Admin machen"}
              </button>
            </div>
          </div>
        ))}
        {users && users.length === 0 && <EmptyState icon={Users} title="Keine Nutzer gefunden" />}
      </Panel>
    </div>
  );
}
