import { PageHeader } from "@/components/shell/PageHeader";
import { WheelGame } from "@/components/wheel/WheelGame";
import { GAME_BY_ROUTE } from "@/constants/games";

export default function WheelPage({ balance, setBalance }) {
  return (
    <div data-testid="wheel-page">
      <PageHeader game={GAME_BY_ROUTE["/wheel"]} testId="wheel" compact />
      <WheelGame balance={balance} setBalance={setBalance} />
    </div>
  );
}
