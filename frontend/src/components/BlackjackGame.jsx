import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Plus, Hand, RefreshCcw, Coins, ChevronsUp, Split } from "lucide-react";
import { playWinChime } from "@/lib/sounds";
import { recordRound } from "@/lib/rounds";

const SUITS = [
  { s: "♠", red: false },
  { s: "♥", red: true },
  { s: "♦", red: true },
  { s: "♣", red: false },
];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const CHIPS = [10, 50, 100, 500];

const buildDeck = () => {
  const deck = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ rank, ...suit });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

const cardValue = (rank) => (rank === "A" ? 11 : ["J", "Q", "K"].includes(rank) ? 10 : Number(rank));

const score = (cards) => {
  let total = cards.reduce((t, c) => t + cardValue(c.rank), 0);
  let aces = cards.filter((c) => c.rank === "A").length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
};

const Card = ({ card, hidden, index }) => (
  <motion.div
    initial={{ y: -48, opacity: 0, rotate: -6 }}
    animate={{ y: 0, opacity: 1, rotate: 0 }}
    transition={{ duration: 0.45, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
    className={`w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-36 rounded-xl border shadow-[0_14px_30px_rgba(0,0,0,0.55)] flex flex-col justify-between p-2 sm:p-2.5 shrink-0 ${
      hidden ? "bg-night-sidebar border-mint/50" : "bg-white border-slate-200"
    }`}
  >
    {hidden ? (
      <div className="w-full h-full rounded-lg border border-mint/30 flex items-center justify-center bg-gradient-to-br from-night-sidebar to-night-elevated">
        <span className="text-mint text-2xl sm:text-3xl">◆</span>
      </div>
    ) : (
      <>
        <span className={`font-display text-lg sm:text-xl md:text-2xl font-bold leading-none ${card.red ? "text-red-600" : "text-slate-900"}`}>{card.rank}</span>
        <span className={`self-center text-2xl sm:text-3xl md:text-4xl ${card.red ? "text-red-600" : "text-slate-900"}`}>{card.s}</span>
        <span className={`font-display text-lg sm:text-xl md:text-2xl font-bold leading-none self-end rotate-180 ${card.red ? "text-red-600" : "text-slate-900"}`}>{card.rank}</span>
      </>
    )}
  </motion.div>
);

const BlackjackGame = ({ balance, setBalance }) => {
  const [chip, setChip] = useState(50);
  const [deck, setDeck] = useState([]);
  const [hands, setHands] = useState([]); // [{ cards, bet, stood, busted, doubled, blackjack, ps, label, payout }]
  const [active, setActive] = useState(0);
  const [dealer, setDealer] = useState([]);
  const [phase, setPhase] = useState("bet");
  const [message, setMessage] = useState("Einsatz wählen und austeilen.");
  const [streak, setStreak] = useState(0);

  const activeHand = hands[active];
  const dealerVisibleScore = phase === "player" || phase === "bet" ? (dealer.length ? cardValue(dealer[0].rank) : 0) : score(dealer);
  const canDouble = phase === "player" && activeHand && activeHand.cards.length === 2 && balance >= activeHand.bet;
  const canSplit =
    phase === "player" &&
    activeHand &&
    activeHand.cards.length === 2 &&
    activeHand.cards[0].rank === activeHand.cards[1].rank &&
    balance >= activeHand.bet &&
    hands.length < 4;

  const dealerPlayAndResolve = (finalHands, deckRest) => {
    const anyAlive = finalHands.some((h) => !h.busted);
    const dl = [...dealer];
    const d = [...deckRest];
    if (anyAlive) while (score(dl) < 17) dl.push(d.pop());
    const ds = score(dl);
    let totalPayout = 0;
    const resolved = finalHands.map((h) => {
      const ps = score(h.cards);
      let payout = 0;
      let label;
      if (h.busted || ps > 21) {
        payout = 0;
        label = "Bust";
      } else if (ds > 21 || ps > ds) {
        payout = h.bet * 2;
        label = "Gewinn";
      } else if (ps === ds) {
        payout = h.bet;
        label = "Push";
      } else {
        payout = 0;
        label = "Verloren";
      }
      totalPayout += payout;
      recordRound({ game: "Blackjack", bet: h.bet, mult: h.bet ? payout / h.bet : 0, payout });
      return { ...h, ps, label, payout };
    });
    const totalBet = finalHands.reduce((s, h) => s + h.bet, 0);
    if (totalPayout > 0) setBalance((b) => b + totalPayout);
    setDeck(d);
    setDealer(dl);
    setHands(resolved);
    setPhase("done");
    if (totalPayout > totalBet) {
      const net = totalPayout - totalBet;
      setStreak((s) => s + 1);
      playWinChime();
      setMessage(`Du gewinnst! Dealer ${ds}. Auszahlung +${totalPayout.toLocaleString("de-DE")} €`);
      toast.success(`Gewonnen! +${net.toLocaleString("de-DE")} € netto`);
    } else if (totalPayout === totalBet) {
      setMessage(`Push bei Dealer ${ds}. Einsätze zurück.`);
      toast.info("Push — Einsatz zurückerstattet.");
    } else {
      setStreak(0);
      setMessage(`Dealer ${ds > 21 ? "überkauft" : ds}. Diese Runde geht an den Dealer.`);
      toast.error("Der Dealer gewinnt.");
    }
  };

  // Aktive Hand fertig → nächste offene Hand oder Dealer
  const proceed = (newHands, deckRest) => {
    const next = newHands.findIndex((h, i) => i > active && !h.stood && !h.busted);
    if (next !== -1) {
      setHands(newHands);
      setDeck(deckRest);
      setActive(next);
      setPhase("player");
      setMessage(`Hand ${next + 1}: Karte, Halten${newHands[next].cards.length === 2 ? ", Verdoppeln" : ""}?`);
    } else {
      dealerPlayAndResolve(newHands, deckRest);
    }
  };

  const hit = () => {
    if (!activeHand) return;
    const d = [...deck];
    const newCards = [...activeHand.cards, d.pop()];
    const sc = score(newCards);
    const newHands = hands.map((h, i) => (i === active ? { ...h, cards: newCards } : h));
    if (sc >= 21) {
      newHands[active] = { ...newHands[active], stood: true, busted: sc > 21 };
      proceed(newHands, d);
    } else {
      setHands(newHands);
      setDeck(d);
      setMessage("Karte oder halten?");
    }
  };

  const stand = () => {
    if (!activeHand) return;
    const newHands = hands.map((h, i) => (i === active ? { ...h, stood: true } : h));
    proceed(newHands, deck);
  };

  const double = () => {
    if (!activeHand || balance < activeHand.bet) {
      toast.error("Nicht genügend Guthaben zum Verdoppeln.");
      return;
    }
    setBalance((b) => b - activeHand.bet);
    const d = [...deck];
    const newCards = [...activeHand.cards, d.pop()];
    const sc = score(newCards);
    const newHands = hands.map((h, i) =>
      i === active ? { ...h, cards: newCards, bet: h.bet * 2, doubled: true, stood: true, busted: sc > 21 } : h
    );
    proceed(newHands, d);
  };

  const split = () => {
    if (!activeHand || balance < activeHand.bet) {
      toast.error("Nicht genügend Guthaben zum Teilen.");
      return;
    }
    setBalance((b) => b - activeHand.bet);
    const d = [...deck];
    const [c1, c2] = activeHand.cards;
    const isAces = c1.rank === "A";
    const handA = { ...activeHand, cards: [c1, d.pop()], stood: isAces, busted: false, doubled: false };
    const handB = { cards: [c2, d.pop()], bet: activeHand.bet, stood: isAces, busted: false, doubled: false, blackjack: false };
    if (score(handA.cards) > 21) handA.busted = true;
    if (score(handB.cards) > 21) handB.busted = true;
    const newHands = [...hands.slice(0, active), handA, handB, ...hands.slice(active + 1)];
    if (isAces) {
      // Bei geteilten Assen: je eine Karte, danach automatisch weiter
      proceed(newHands, d);
    } else {
      setHands(newHands);
      setDeck(d);
      setMessage(`Geteilt! Hand ${active + 1}: Karte, Halten oder Verdoppeln?`);
    }
  };

  const deal = () => {
    if (balance < chip) return;
    const d = buildDeck();
    const p = [d.pop(), d.pop()];
    const dl = [d.pop(), d.pop()];
    setDeck(d);
    setDealer(dl);
    setActive(0);
    setBalance((b) => b - chip);
    const hand = { cards: p, bet: chip, stood: false, busted: false, doubled: false, blackjack: false };
    if (score(p) === 21) {
      const win = Math.floor(chip * 2.5);
      setBalance((b) => b + win);
      setHands([{ ...hand, stood: true, blackjack: true, label: "Blackjack", payout: win, ps: 21 }]);
      setPhase("done");
      setMessage("Blackjack! Auszahlung 3:2.");
      setStreak((s) => s + 1);
      playWinChime();
      recordRound({ game: "Blackjack", bet: chip, mult: 2.5, payout: win });
      toast.success(`Blackjack! +${win.toLocaleString("de-DE")} €`);
    } else {
      setHands([hand]);
      setPhase("player");
      setMessage("Dein Zug: Karte, Halten, Verdoppeln oder Teilen?");
    }
  };

  const reset = () => {
    setPhase("bet");
    setHands([]);
    setActive(0);
    setDealer([]);
    setMessage("Einsatz wählen und austeilen.");
  };

  const labelCls = (label) =>
    label === "Gewinn" || label === "Blackjack" ? "text-mint" : label === "Push" ? "text-amber-300" : "text-[#FF6B7A]";

  return (
    <div className="rounded-2xl bg-night-card border border-night-border p-5 sm:p-6" data-testid="blackjack-game">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-mint font-bold mb-1">Kartenspiel</p>
          <h3 className="font-display text-lg sm:text-xl font-extrabold">Blackjack 21 VIP</h3>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">Guthaben</p>
          <p className="font-mono text-base font-bold text-mint tabular-nums" data-testid="blackjack-balance">{balance.toLocaleString("de-DE")} €</p>
        </div>
      </div>

      <div
        className="relative rounded-3xl border border-mint/25 mb-5 overflow-hidden min-h-[56vh] shadow-[inset_0_0_120px_rgba(0,0,0,0.6)]"
        style={{ background: "radial-gradient(ellipse at 50% 38%, #14512f 0%, #0d3a22 46%, #082515 100%)" }}
        data-testid="blackjack-table"
      >
        {/* Filz-Bögen & Emblem */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-[80%] h-[70%] rounded-[50%] border border-mint/15" />
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">
          <span className="font-display text-2xl sm:text-4xl font-black tracking-[0.25em] text-mint/10 select-none">BLACKJACK</span>
          <p className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.3em] text-mint/20 mt-1">zahlt 3 : 2 · Dealer steht ab 17</p>
        </div>

        <div className="relative z-10 flex flex-col justify-between h-full min-h-[56vh] p-5 sm:p-8">
          {/* Dealer */}
          <div>
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-emerald-200/70">Dealer</span>
              <span className="rounded-full bg-black/45 border border-mint/30 px-3.5 py-1 font-mono text-base sm:text-lg font-bold text-mint tabular-nums" data-testid="blackjack-dealer-score">
                {dealer.length ? dealerVisibleScore : "—"}
              </span>
            </div>
            <div className="flex justify-center gap-2.5 sm:gap-3 min-h-[96px] sm:min-h-[144px]" data-testid="blackjack-dealer-hand">
              <AnimatePresence>
                {dealer.map((c, i) => (
                  <Card key={`d-${i}-${c.rank}${c.s}`} card={c} hidden={phase === "player" && i === 1} index={i} />
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Spieler-Hände (Split unterstützt) */}
          <div>
            <div className="flex justify-center items-end gap-5 sm:gap-8 flex-wrap mb-4" data-testid="blackjack-player-hand">
              {hands.length === 0 ? (
                <div className="min-h-[96px] sm:min-h-[144px]" />
              ) : (
                hands.map((h, hi) => {
                  const hs = score(h.cards);
                  const isActive = phase === "player" && hi === active;
                  return (
                    <div
                      key={hi}
                      className={`rounded-2xl px-3 pt-3 pb-2 transition-all duration-300 ${isActive ? "ring-2 ring-mint bg-black/25" : "ring-1 ring-white/5"}`}
                      data-testid={`blackjack-hand-${hi}`}
                    >
                      <div className="flex gap-2 sm:gap-2.5 min-h-[96px] sm:min-h-[144px] justify-center">
                        <AnimatePresence>
                          {h.cards.map((c, i) => (
                            <Card key={`p-${hi}-${i}-${c.rank}${c.s}`} card={c} hidden={false} index={i} />
                          ))}
                        </AnimatePresence>
                      </div>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <span
                          className={`rounded-full bg-black/45 border px-3 py-0.5 font-mono text-sm font-bold tabular-nums ${
                            hs > 21 ? "border-[#FF4757]/50 text-[#FF6B7A]" : "border-mint/30 text-mint"
                          }`}
                        >
                          {hs}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">{h.bet.toLocaleString("de-DE")} €</span>
                        {h.doubled && <span className="font-mono text-[9px] text-amber-300 uppercase">2×</span>}
                        {phase === "done" && h.label && (
                          <span className={`font-mono text-[10px] font-bold uppercase ${labelCls(h.label)}`}>{h.label}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex items-center justify-center gap-3">
              <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-emerald-200/70">
                {hands.length > 1 ? `Hand ${Math.min(active, hands.length - 1) + 1}/${hands.length}` : "Deine Hand"}
              </span>
              <span className="rounded-full bg-black/45 border border-mint/30 px-3.5 py-1 font-mono text-base sm:text-lg font-bold text-mint tabular-nums" data-testid="blackjack-player-score">
                {hands.length ? score(hands[Math.min(active, hands.length - 1)].cards) : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-xs sm:text-sm text-slate-400 mb-4 min-h-[20px]" data-testid="blackjack-message">{message}</p>

      <div className="flex items-center justify-center gap-2 mb-4">
        {CHIPS.map((c) => (
          <button
            key={c}
            onClick={() => setChip(c)}
            disabled={phase !== "bet"}
            className={`w-11 h-11 rounded-full font-mono text-xs font-bold border-2 transition-all duration-300 ${
              chip === c
                ? "bg-mint text-black border-mint scale-110 shadow-[0_0_18px_rgba(0,229,117,0.5)]"
                : "bg-night-elevated text-slate-300 border-night-border hover:border-mint/50"
            } disabled:opacity-40`}
            data-testid={`blackjack-chip-selector-${c}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-stretch justify-center gap-2.5">
        {phase === "bet" || phase === "done" ? (
          <button
            onClick={deal}
            disabled={balance < chip}
            className="flex-1 min-w-[160px] rounded-full bg-mint text-black py-3 text-sm font-extrabold inline-flex items-center justify-center gap-2 hover:bg-mint-hover transition-colors duration-300 disabled:opacity-40 shadow-[0_0_22px_rgba(0,229,117,0.35)]"
            data-testid="blackjack-deal-btn"
          >
            <Coins className="w-4 h-4" />
            Austeilen · {chip} €
          </button>
        ) : (
          <>
            <button
              onClick={hit}
              className="flex-1 min-w-[110px] rounded-full bg-white text-black py-3 text-sm font-extrabold inline-flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-colors duration-300"
              data-testid="blackjack-hit-btn"
            >
              <Plus className="w-4 h-4" strokeWidth={3} /> Karte
            </button>
            <button
              onClick={stand}
              className="flex-1 min-w-[110px] rounded-full border-2 border-slate-400/60 py-3 text-sm font-extrabold inline-flex items-center justify-center gap-1.5 hover:border-mint hover:text-mint transition-colors duration-300"
              data-testid="blackjack-stand-btn"
            >
              <Hand className="w-4 h-4" /> Halten
            </button>
            {canDouble && (
              <button
                onClick={double}
                className="flex-1 min-w-[110px] rounded-full bg-amber-400 text-black py-3 text-sm font-extrabold inline-flex items-center justify-center gap-1.5 hover:bg-amber-300 transition-colors duration-300"
                data-testid="blackjack-double-btn"
              >
                <ChevronsUp className="w-4 h-4" strokeWidth={3} /> Verdoppeln
              </button>
            )}
            {canSplit && (
              <button
                onClick={split}
                className="flex-1 min-w-[110px] rounded-full bg-[#8C3BFF] text-white py-3 text-sm font-extrabold inline-flex items-center justify-center gap-1.5 hover:bg-[#7a2ee6] transition-colors duration-300"
                data-testid="blackjack-split-btn"
              >
                <Split className="w-4 h-4" /> Teilen
              </button>
            )}
          </>
        )}
        <button
          onClick={reset}
          className="min-w-[110px] rounded-full bg-night-elevated py-3 px-4 text-sm font-bold inline-flex items-center justify-center gap-1.5 text-slate-300 hover:bg-night-cardhover transition-colors duration-300"
          data-testid="blackjack-reset-btn"
        >
          <RefreshCcw className="w-4 h-4" /> Reset
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span data-testid="blackjack-streak">
          Gewinnserie: <span className="font-mono font-bold text-mint">{streak}</span>
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider">Verdoppeln &amp; Teilen möglich</span>
      </div>
    </div>
  );
};

export default BlackjackGame;
