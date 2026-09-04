import { PageHeader } from "@/components/shell/PageHeader";
import { DiceGame } from "@/components/dice/DiceGame";
import { GAME_BY_ROUTE } from "@/constants/games";

export default function DicePage({ balance, setBalance }) {
  return (
    <div data-testid="dice-page">
      <PageHeader game={GAME_BY_ROUTE["/dice"]} testId="dice" />
      <DiceGame balance={balance} setBalance={setBalance} />
    </div>
  );
}
