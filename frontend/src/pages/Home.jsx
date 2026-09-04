import { Hero } from "@/components/lobby/Hero";
import { GameGrid } from "@/components/lobby/GameGrid";
import { LiveFeed } from "@/components/lobby/LiveFeed";
import { Leaderboard } from "@/components/lobby/Leaderboard";
import { Footer } from "@/components/lobby/Footer";

export default function Home() {
  return (
    <div data-testid="home-page">
      <Hero />
      <GameGrid />
      <section className="grid grid-cols-12 gap-5 mb-6" data-testid="community-section">
        <LiveFeed className="col-span-12 xl:col-span-7" />
        <Leaderboard className="col-span-12 xl:col-span-5" />
      </section>
      <Footer />
    </div>
  );
}
