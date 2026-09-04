import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/auth/AuthContext";
import { AppProvider, useApp } from "@/context/AppContext";
import { Topbar } from "@/components/shell/Topbar";
import { Sidebar } from "@/components/shell/Sidebar";
import { ChatPanel } from "@/components/shell/ChatPanel";
import { MobileNav } from "@/components/shell/MobileNav";
import { AuthModal } from "@/components/AuthModal";
import { DepositModal } from "@/components/DepositModal";
import Home from "@/pages/Home";
import CrashPage from "@/pages/CrashPage";
import DicePage from "@/pages/DicePage";
import MinesPage from "@/pages/MinesPage";
import CoinflipPage from "@/pages/CoinflipPage";
import RoulettePage from "@/pages/RoulettePage";
import BlackjackPage from "@/pages/BlackjackPage";
import SweetBonanzaPage from "@/pages/SweetBonanzaPage";
import ProfilePage from "@/pages/ProfilePage";
import AdminPage from "@/pages/AdminPage";
import InfoPage from "@/pages/InfoPage";
import PlinkoPage from "@/pages/PlinkoPage";
import LimboPage from "@/pages/LimboPage";
import TowerPage from "@/pages/TowerPage";
import WheelPage from "@/pages/WheelPage";
import ChickenRoadPage from "@/pages/ChickenRoadPage";

const Shell = () => {
  const { balance, setBalance } = useApp();
  const location = useLocation();
  const gameProps = { balance, setBalance };

  return (
    <div className="App min-h-screen bg-ink text-txt" data-testid="app-root">
      <Topbar />
      <Sidebar />
      <ChatPanel />
      <main className="pt-16 lg:pl-64 2xl:pr-[340px] min-h-screen pb-24 lg:pb-10">
        <div className={`px-4 sm:px-6 lg:px-6 py-5 lg:py-6 mx-auto ${["/crash", "/roulette", "/plinko", "/sweet-bonanza", "/chicken-road"].includes(location.pathname) ? "max-w-none" : "max-w-[1320px]"}`}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/crash" element={<CrashPage {...gameProps} />} />
                <Route path="/dice" element={<DicePage {...gameProps} />} />
                <Route path="/mines" element={<MinesPage {...gameProps} />} />
                <Route path="/coinflip" element={<CoinflipPage {...gameProps} />} />
                <Route path="/plinko" element={<PlinkoPage {...gameProps} />} />
                <Route path="/limbo" element={<LimboPage {...gameProps} />} />
                <Route path="/tower" element={<TowerPage {...gameProps} />} />
                <Route path="/wheel" element={<WheelPage {...gameProps} />} />
                <Route path="/chicken-road" element={<ChickenRoadPage {...gameProps} />} />
                <Route path="/roulette" element={<RoulettePage {...gameProps} />} />
                <Route path="/blackjack" element={<BlackjackPage {...gameProps} />} />
                <Route path="/sweet-bonanza" element={<SweetBonanzaPage {...gameProps} />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/info/:section" element={<InfoPage />} />
                <Route path="/info" element={<InfoPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <MobileNav />
      <AuthModal />
      <DepositModal />
      <Toaster position="top-center" theme="dark" richColors closeButton />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Shell />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
