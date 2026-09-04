import { PageHeader } from "@/components/shell/PageHeader";
import { TowerGame } from "@/components/tower/TowerGame";
import { GAME_BY_ROUTE } from "@/constants/games";

export default function TowerPage({ balance, setBalance }) {
  return (
    <div data-testid="tower-page">
      <PageHeader game={GAME_BY_ROUTE["/tower"]} testId="tower" compact />
      <TowerGame balance={balance} setBalance={setBalance} />
    </div>
  );
}
