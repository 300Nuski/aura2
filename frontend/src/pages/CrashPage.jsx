import { PageHeader } from "@/components/shell/PageHeader";
import { CrashGame } from "@/components/crash/CrashGame";
import { LiveFeed } from "@/components/lobby/LiveFeed";
import { GAME_BY_ROUTE } from "@/constants/games";

export default function CrashPage({ balance, setBalance }) {
  return (
    <div data-testid="crash-page">
      <PageHeader game={GAME_BY_ROUTE["/crash"]} testId="crash" compact />
      <CrashGame balance={balance} setBalance={setBalance} />
      <LiveFeed className="mt-4" limit={8} title="Live Winners" />
    </div>
  );
}
