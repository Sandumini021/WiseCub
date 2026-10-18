import { Route, Routes } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { LevelsPage } from "../modules/decision-making/pages/LevelsPage";
import { MissionBoardPage } from "../modules/gamified-learning/pages/MissionBoardPage";
import { ScamHomePage } from "../modules/scam-safety/pages/ScamHomePage";
import { MarketHomePage } from "../modules/stock-market/pages/MarketHomePage";
import { MarketTerminalPage } from "../modules/stock-market/pages/MarketTerminalPage";
import { PortfolioPage } from "../modules/stock-market/pages/PortfolioPage";
import { MarketLessonPage } from "../modules/stock-market/pages/MarketLessonPage";
import { TradeConfirmationPage } from "../modules/stock-market/pages/TradeConfirmationPage";
import { CreateAccountPage } from "../pages/auth/CreateAccountPage";
import { DemoLoginPage } from "../pages/auth/DemoLoginPage";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { SplashPage } from "../pages/SplashPage";
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
      <Route path="/" element={<SplashPage />} />
      <Route path="/welcome" element={<SplashPage />} />
      <Route path="/login" element={<DemoLoginPage />} />
      <Route path="/signup" element={<CreateAccountPage />} />
      <Route path="/home" element={<DashboardPage />} />
      <Route path="/market" element={<MarketHomePage />} />
      <Route element={<AppLayout />}>
        <Route path="/market/lessons/:n" element={<MarketLessonPage />} />
        <Route path="/market/terminal" element={<MarketTerminalPage />} />
        <Route path="/market/confirm" element={<TradeConfirmationPage />} />
        <Route path="/market/portfolio" element={<PortfolioPage />} />
        <Route path="/choices" element={<LevelsPage />} />
        <Route path="/missions" element={<MissionBoardPage />} />
        <Route path="/safety" element={<ScamHomePage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}
