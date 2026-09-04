import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, LayoutGrid } from "lucide-react";
import { GAMES } from "@/constants/games";
import { Pill } from "@/components/common/Bits";

const SPANS = {
  crash: "col-span-12 md:col-span-6",
  mines: "col-span-12 md:col-span-6",
  dice: "col-span-6 md:col-span-3",
  coinflip: "col-span-6 md:col-span-3",
  plinko: "col-span-6 md:col-span-3",
  limbo: "col-span-6 md:col-span-3",
  tower: "col-span-6 md:col-span-4",
  wheel: "col-span-6 md:col-span-4",
  "chicken-road": "col-span-12 md:col-span-4",
  roulette: "col-span-12 md:col-span-4",
  blackjack: "col-span-12 md:col-span-6",
  "sweet-bonanza": "col-span-12 md:col-span-6",
};

const ORDER = ["crash", "mines", "dice", "coinflip", "plinko", "limbo", "tower", "wheel", "chicken-road", "roulette", "blackjack", "sweet-bonanza"];
const ORDERED = [...GAMES].sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));

const tagTone = (tag) => (tag === "Neu" ? "gold" : tag === "Beliebt" ? "win" : "neutral");

export const GameGrid = () => {
  const navigate = useNavigate();
  return (
    <section className="mb-10" data-testid="game-grid-section">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="font-display font-bold text-2xl tracking-[-0.02em] flex items-center gap-2.5">
            <LayoutGrid className="w-5 h-5 text-brand" />
            Alle Spiele
          </h2>
          <p className="text-sm text-dim mt-1">Neun Originals, drei Klassiker — jede Karte ist spielbar.</p>
        </div>
        <span className="text-xs font-mono text-dim-2">{GAMES.length} Spiele</span>
      </div>
      <div className="grid grid-cols-12 gap-4" data-testid="game-grid">
        {ORDERED.map((g, i) => {
          const featured = g.id === "crash" || g.id === "mines";
          const banner = false;
          return (
            <motion.button
              key={g.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -3 }}
              onClick={() => navigate(g.route)}
              className={`group relative overflow-hidden rounded-2xl bg-panel border border-line text-left p-5 flex transition-[border-color,box-shadow] duration-200 hover:shadow-raised ${SPANS[g.id]} ${
                featured ? "min-h-[240px] flex-col justify-between" : banner ? "min-h-[150px] flex-row items-center gap-6" : "min-h-[210px] flex-col justify-between"
              }`}
              style={{ "--gc": g.color }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${g.color}66`)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}
              data-testid={`game-card-${g.id}`}
            >
              <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full pointer-events-none opacity-70 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `radial-gradient(circle, ${g.color}26 0%, ${g.color}00 65%)` }} />
              <g.icon className="absolute -right-4 -bottom-5 w-28 h-28 opacity-[0.07] group-hover:opacity-[0.14] group-hover:scale-105 transition-all duration-300 pointer-events-none" style={{ color: g.color }} strokeWidth={1.2} />

              <div className={`relative z-10 ${banner ? "flex items-center gap-4 shrink-0" : ""}`}>
                <span className="w-11 h-11 rounded-xl border flex items-center justify-center" style={{ backgroundColor: `${g.color}1c`, borderColor: `${g.color}44` }}>
                  <g.icon className="w-5 h-5" style={{ color: g.color }} />
                </span>
                {!banner && (
                  <Pill tone={tagTone(g.tag)} className="ml-2 align-middle">
                    {g.tag}
                  </Pill>
                )}
              </div>

              <div className={`relative z-10 ${banner ? "flex-1 min-w-0" : "mt-4"}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`font-display font-bold tracking-[-0.02em] ${featured ? "text-2xl" : "text-lg"}`}>{g.name}</h3>
                  {banner && <Pill tone={tagTone(g.tag)}>{g.tag}</Pill>}
                </div>
                <p className={`text-dim mt-1 leading-relaxed ${featured ? "text-sm max-w-md" : "text-xs"} ${!featured && !banner ? "line-clamp-2" : ""}`}>{g.tagline}</p>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-mono text-dim-2">{g.edge}</span>
                  <span className="text-[11px] font-mono font-semibold" style={{ color: g.color }}>
                    {g.maxWin}
                  </span>
                </div>
              </div>

              <span className={`relative z-10 inline-flex items-center gap-1.5 text-[13px] font-bold text-txt group-hover:text-brand transition-colors duration-200 ${banner ? "shrink-0" : "mt-4"}`}>
                Spielen
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
              </span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
};
