import { useCallback, useEffect, useRef, useState } from "react";
import { Send, MessageSquare, X, ShieldCheck, Crown, Gift, Clock } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";
import { useApp } from "@/context/AppContext";
import { clockTime, initials } from "@/lib/format";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const POLL_MS = 3000;

const fmtLeft = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const DailyBonusCard = () => {
  const { user } = useAuth();
  const { openAuth, setBalance } = useApp();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    if (!user) {
      setStatus(null);
      return;
    }
    api.get("/wallet/daily-bonus").then((r) => setStatus(r.data)).catch(() => {});
  }, [user]);

  useEffect(() => {
    load();
    const i = setInterval(load, 60000);
    return () => clearInterval(i);
  }, [load]);

  const claim = async () => {
    if (!user) {
      openAuth();
      return;
    }
    if (loading || (status && !status.available)) return;
    setLoading(true);
    try {
      const r = await api.post("/wallet/daily-bonus");
      setBalance(r.data.balance);
      setStatus(r.data);
      toast.success(`Daily Bonus: +${r.data.amount.toLocaleString("de-DE")} € gutgeschrieben!`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Bonus konnte nicht abgeholt werden.");
      load();
    } finally {
      setLoading(false);
    }
  };

  const available = !user || status?.available;
  return (
    <button
      onClick={claim}
      disabled={loading || (user && status && !status.available)}
      className="relative w-full overflow-hidden rounded-2xl text-left p-4 transition-[filter,transform] duration-200 hover:brightness-110 active:scale-[0.99] disabled:cursor-default disabled:hover:brightness-100"
      style={{ background: "linear-gradient(135deg, #6E5BFF 0%, #4F8DFF 100%)", boxShadow: "0 14px 34px rgba(110,91,255,0.35)" }}
      data-testid="daily-bonus-card"
    >
      <Crown className="absolute -right-3 -bottom-4 w-24 h-24 text-white/15 rotate-[-12deg]" strokeWidth={1.5} />
      <span className="absolute right-4 top-4 w-11 h-11 rounded-full bg-gold flex items-center justify-center shadow-glow-gold">
        <Gift className="w-5 h-5 text-gold-fg" />
      </span>
      <p className="font-display font-extrabold text-[15px] text-white leading-none">Daily Bonus</p>
      <p className="text-[11px] text-white/85 mt-1.5 leading-relaxed max-w-[170px]">
        {!user && "Anmelden und täglich 500 € Spielgeld gratis sichern."}
        {user && status === null && "Wird geladen …"}
        {user && status?.available && "Heute noch nicht abgeholt — jetzt 500 € Spielgeld kassieren!"}
        {user && status && !status.available && (
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> Nächster Bonus in {fmtLeft(status.seconds_left)}
          </span>
        )}
      </p>
      <span className={`inline-flex items-center gap-1 mt-3 rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${available ? "bg-white text-brand-3" : "bg-white/15 text-white/80"}`} data-testid="daily-bonus-cta">
        {loading ? "…" : !user ? "Anmelden →" : status?.available ? "Abholen →" : "Abgeholt ✓"}
      </span>
    </button>
  );
};

const useChat = () => {
  const [messages, setMessages] = useState(null);
  const [online, setOnline] = useState(0);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.get("/chat/messages?limit=60");
      setMessages(r.data);
      setError(false);
    } catch {
      setError(true);
      setMessages((m) => m ?? []);
    }
  }, []);

  useEffect(() => {
    load();
    const i = setInterval(load, POLL_MS);
    const o = () => api.get("/chat/online").then((r) => setOnline(r.data.online)).catch(() => {});
    o();
    const oi = setInterval(o, 20000);
    return () => {
      clearInterval(i);
      clearInterval(oi);
    };
  }, [load]);

  return { messages, online, error, reload: load, setMessages };
};

export const ChatBody = ({ onClose }) => {
  const { user } = useAuth();
  const { openAuth } = useApp();
  const { messages, online, error, reload, setMessages } = useChat();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const stickBottom = useRef(true);

  useEffect(() => {
    const el = listRef.current;
    if (el && stickBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    stickBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  };

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    if (!user) {
      openAuth();
      return;
    }
    setSending(true);
    try {
      const r = await api.post("/chat/messages", { text });
      setMessages((m) => [...(m ?? []), r.data]);
      setInput("");
      stickBottom.current = true;
    } catch (err) {
      toast.error(err.response?.data?.detail || "Nachricht konnte nicht gesendet werden.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full" data-testid="community-chat-panel">
      <div className="flex items-center justify-between px-5 h-14 shrink-0">
        <span className="inline-flex items-center gap-2 font-display font-extrabold text-sm">
          <MessageSquare className="w-4 h-4 text-aqua" />
          General Chat
        </span>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-win" data-testid="chat-online-count">
            <span className="w-1.5 h-1.5 rounded-full bg-win animate-pulse-dot" />
            {online}
          </span>
          {onClose && (
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-panel border border-line flex items-center justify-center" aria-label="Chat schließen" data-testid="chat-close-button">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pb-3 shrink-0">
        <DailyBonusCard />
      </div>

      <div ref={listRef} onScroll={onScroll} className="chat-scroll flex-1 overflow-y-auto px-4 py-2 space-y-3" data-testid="chat-messages">
        {messages === null && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-2.5">
                <div className="shimmer w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="shimmer h-3 w-24 rounded" />
                  <div className="shimmer h-3 w-full rounded" />
                </div>
              </div>
            ))}
          </div>
        )}
        {messages && messages.length === 0 && (
          <div className="text-center py-10" data-testid="chat-empty">
            <p className="text-sm font-semibold text-txt-2">Noch ruhig hier.</p>
            <p className="text-xs text-dim mt-1">Schreib die erste Nachricht an die Community.</p>
            {error && (
              <button onClick={reload} className="mt-3 text-xs text-aqua underline" data-testid="chat-retry-button">
                Erneut laden
              </button>
            )}
          </div>
        )}
        {messages?.map((m) => {
          const own = user && m.user_id === user.id;
          return (
            <div key={m.id} className={`flex gap-2.5 ${own ? "flex-row-reverse" : ""}`} data-testid="chat-message">
              <span className={`shrink-0 w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-bold ${own ? "bg-brand/25 border-brand/50 text-brand-2" : "bg-raised border-line text-txt-2"}`}>
                {initials(m.name)}
              </span>
              <div className={`min-w-0 max-w-[82%] rounded-2xl px-3.5 py-2.5 border ${own ? "bg-brand/15 border-brand/30 rounded-tr-sm" : "glass border-line-2 rounded-tl-sm"}`}>
                <p className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-xs font-bold truncate ${own ? "text-brand-2" : "text-txt-2"}`}>{m.name}</span>
                  {m.role === "admin" && <ShieldCheck className="w-3 h-3 text-gold" />}
                  <span className="text-[10px] font-mono text-dim-2 ml-auto pl-2">{clockTime(m.ts)}</span>
                </p>
                <p className="text-[13px] text-txt leading-relaxed break-words">{m.text}</p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={send} className="p-4 shrink-0" data-testid="chat-form">
        {user ? (
          <div className="flex items-center gap-2 rounded-xl glass border border-line px-3.5 py-2 focus-within:border-brand/60 transition-colors duration-200">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nachricht schreiben …"
              maxLength={240}
              className="flex-1 min-w-0 bg-transparent text-sm placeholder:text-dim-2 focus:outline-none py-1"
              data-testid="community-chat-input"
            />
            <button type="submit" disabled={sending || !input.trim()} className="shrink-0 w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center hover:brightness-110 disabled:opacity-40 transition-[filter] duration-200" data-testid="community-chat-send-button" aria-label="Senden">
              <Send className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button type="button" onClick={openAuth} className="w-full rounded-xl glass border border-line text-sm font-semibold text-txt-2 py-3 hover:border-brand/60 hover:text-brand-2 transition-colors duration-200" data-testid="chat-login-button">
            Anmelden, um mitzuschreiben
          </button>
        )}
      </form>
    </div>
  );
};

export const ChatPanel = () => {
  const { chatOpen, setChatOpen } = useApp();
  return (
    <>
      <aside className="hidden 2xl:flex flex-col fixed top-16 right-0 bottom-0 w-[340px] z-30 glass border-l border-line-2" data-testid="chat-panel">
        <ChatBody />
      </aside>
      <Sheet open={chatOpen} onOpenChange={setChatOpen}>
        <SheetContent side="right" className="w-full sm:w-[380px] p-0 bg-surface border-line text-txt [&>button]:hidden" data-testid="mobile-chat-sheet">
          <SheetTitle className="sr-only">General Chat</SheetTitle>
          <ChatBody onClose={() => setChatOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
};
