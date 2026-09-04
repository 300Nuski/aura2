import { PageHeader } from "@/components/shell/PageHeader";
import { PlinkoGame } from "@/components/plinko/PlinkoGame";
import { GAME_BY_ROUTE } from "@/constants/games";

export default function PlinkoPage({ balance, setBalance }) {
  return (
    <div data-testid="plinko-page">
      <PageHeader game={GAME_BY_ROUTE["/plinko"]} testId="plinko" compact />
      <PlinkoGame balance={balance} setBalance={setBalance} />
    </div>
  );
}
