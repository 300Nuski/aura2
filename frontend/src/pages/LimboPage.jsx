import { PageHeader } from "@/components/shell/PageHeader";
import { LimboGame } from "@/components/limbo/LimboGame";
import { GAME_BY_ROUTE } from "@/constants/games";

export default function LimboPage({ balance, setBalance }) {
  return (
    <div data-testid="limbo-page">
      <PageHeader game={GAME_BY_ROUTE["/limbo"]} testId="limbo" compact />
      <LimboGame balance={balance} setBalance={setBalance} />
    </div>
  );
}
