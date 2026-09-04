import { PageHeader } from "@/components/shell/PageHeader";
import RouletteGame from "@/components/roulette/RouletteGame";
import { LiveFeed } from "@/components/lobby/LiveFeed";
import { GAME_BY_ROUTE } from "@/constants/games";

export default function RoulettePage({ balance, setBalance }) {
  return (
    <div data-testid="roulette-page">
      <PageHeader game={GAME_BY_ROUTE["/roulette"]} testId="roulette" compact />
      <RouletteGame balance={balance} setBalance={setBalance} />
      <LiveFeed className="mt-4" limit={6} />
    </div>
  );
}
