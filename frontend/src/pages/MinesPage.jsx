import { PageHeader } from "@/components/shell/PageHeader";
import { MinesGame } from "@/components/mines/MinesGame";
import { GAME_BY_ROUTE } from "@/constants/games";

export default function MinesPage({ balance, setBalance }) {
  return (
    <div data-testid="mines-page">
      <PageHeader game={GAME_BY_ROUTE["/mines"]} testId="mines" />
      <MinesGame balance={balance} setBalance={setBalance} />
    </div>
  );
}
