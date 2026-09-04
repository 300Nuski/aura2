import { PageHeader } from "@/components/shell/PageHeader";
import { CoinflipGame } from "@/components/coinflip/CoinflipGame";
import { GAME_BY_ROUTE } from "@/constants/games";

export default function CoinflipPage({ balance, setBalance }) {
  return (
    <div data-testid="coinflip-page">
      <PageHeader game={GAME_BY_ROUTE["/coinflip"]} testId="coinflip" />
      <CoinflipGame balance={balance} setBalance={setBalance} />
    </div>
  );
}
