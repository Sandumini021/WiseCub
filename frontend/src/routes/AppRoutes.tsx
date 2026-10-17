import { Route, Routes } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { LevelsPage } from "../modules/decision-making/pages/LevelsPage";
import { MissionBoardPage } from "../modules/gamified-learning/pages/MissionBoardPage";
import { ScamHomePage } from "../modules/scam-safety/pages/ScamHomePage";
import { MarketHomePage } from "../modules/stock-market/pages/MarketHomePage";
import { MarketTerminalPage } from "../modules/stock-market/pages/MarketTerminalPage";
import { ShareLessonPage } from "../modules/stock-market/pages/ShareLessonPage";
import { TradeConfirmationPage } from "../modules/stock-market/pages/TradeConfirmationPage";
import { DemoLoginPage } from "../pages/auth/DemoLoginPage";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { LandingPage } from "../pages/LandingPage";
import { ProfilePage } from "../pages/profile/ProfilePage";

function ProgressPage() {
  return (
    <section className="card">
      <h1>My Progress</h1>
      <p>
        Habit scores and session reviews will appear here after you finish
        lessons and trades. Nothing is ranked against other children.
      </p>
    </section>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<DemoLoginPage />} />
      <Route element={<AppLayout />}>
        <Route path="/home" element={<DashboardPage />} />
        <Route path="/market" element={<MarketHomePage />} />
        <Route path="/market/lessons/1" element={<ShareLessonPage />} />
        <Route path="/market/terminal" element={<MarketTerminalPage />} />
        <Route path="/market/confirm" element={<TradeConfirmationPage />} />
        <Route path="/choices" element={<LevelsPage />} />
        <Route path="/missions" element={<MissionBoardPage />} />
        <Route path="/safety" element={<ScamHomePage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}
