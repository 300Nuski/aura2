import { Spade } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import BlackjackGame from "@/components/BlackjackGame";
import { GAME_BY_ROUTE } from "@/constants/games";
import { Panel } from "@/components/common/Bits";

const RULES = [
  ["Gewinn", "1:1"],
  ["Blackjack (Ass + 10)", "3:2"],
  ["Push (Gleichstand)", "Einsatz zurück"],
  ["Dealer", "steht ab 17"],
];

export default function BlackjackPage({ balance, setBalance }) {
  return (
    <div data-testid="blackjack-page">
      <PageHeader game={GAME_BY_ROUTE["/blackjack"]} testId="blackjack" />
      <BlackjackGame balance={balance} setBalance={setBalance} />
      <Panel className="mt-5 p-5 sm:p-6" data-testid="blackjack-rules">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h3 className="font-display text-lg font-bold flex items-center gap-2 shrink-0">
            <Spade className="w-4 h-4 text-aqua" />
            So wird gespielt
          </h3>
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
            {RULES.map(([label, val]) => (
              <li key={label} className="rounded-xl bg-surface-2 border border-line px-3 py-2.5">
                <p className="text-[11px] text-dim leading-tight">{label}</p>
                <p className="font-mono font-semibold text-win text-sm mt-0.5">{val}</p>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-dim leading-relaxed mt-4">Komme näher an 21 als der Dealer, ohne dich zu überkaufen. Asse zählen 1 oder 11 — die Engine wählt automatisch den besten Wert. Teilen und Verdoppeln sind möglich.</p>
      </Panel>
    </div>
  );
}
