import { Route, Routes } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { LevelsPage } from "../modules/decision-making/pages/LevelsPage";
import { MissionBoardPage } from "../modules/gamified-learning/pages/MissionBoardPage";
import { ScamHomePage } from "../modules/scam-safety/pages/ScamHomePage";
import { MarketHomePage } from "../modules/stock-market/pages/MarketHomePage";
import { LandingPage } from "../pages/LandingPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<AppLayout />}>
        <Route path="/market" element={<MarketHomePage />} />
        <Route path="/choices" element={<LevelsPage />} />
        <Route path="/missions" element={<MissionBoardPage />} />
        <Route path="/safety" element={<ScamHomePage />} />
      </Route>
    </Routes>
  );
}
