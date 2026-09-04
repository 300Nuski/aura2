import { PageHeader } from "@/components/shell/PageHeader";
import SweetBonanzaGame from "@/components/sweet/SweetBonanzaGame";
import { GAME_BY_ROUTE } from "@/constants/games";

export default function SweetBonanzaPage({ balance, setBalance }) {
  return (
    <div data-testid="sweet-bonanza-page">
      <PageHeader game={GAME_BY_ROUTE["/sweet-bonanza"]} testId="sb" compact />
      <SweetBonanzaGame balance={balance} setBalance={setBalance} />
    </div>
  );
}
