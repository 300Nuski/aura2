import { PageHeader } from "@/components/shell/PageHeader";
import { ChickenRoadGame } from "@/components/chicken/ChickenRoadGame";
import { GAME_BY_ROUTE } from "@/constants/games";

export default function ChickenRoadPage({ balance, setBalance }) {
  return (
    <div data-testid="chicken-page">
      <PageHeader game={GAME_BY_ROUTE["/chicken-road"]} testId="chicken" compact />
      <ChickenRoadGame balance={balance} setBalance={setBalance} />
    </div>
  );
}
