import { Route, Routes } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { LevelsPage } from "../modules/decision-making/pages/LevelsPage";
import { ScenarioPage } from "../modules/decision-making/pages/ScenarioPage";
import { MissionBoardPage } from "../modules/gamified-learning/pages/MissionBoardPage";
import { ScamHomePage } from "../modules/scam-safety/pages/ScamHomePage";
import { SimulatedInboxPage } from "../modules/scam-safety/pages/SimulatedInboxPage";
import { SimulationFeedbackPage } from "../modules/scam-safety/pages/SimulationFeedbackPage";
import { MarketHomePage } from "../modules/stock-market/pages/MarketHomePage";
import { MarketTerminalPage } from "../modules/stock-market/pages/MarketTerminalPage";
import { PortfolioPage } from "../modules/stock-market/pages/PortfolioPage";
import { MarketLessonPage } from "../modules/stock-market/pages/MarketLessonPage";
import { TradeConfirmationPage } from "../modules/stock-market/pages/TradeConfirmationPage";
import { CreateAccountPage } from "../pages/auth/CreateAccountPage";
import { DemoLoginPage } from "../pages/auth/DemoLoginPage";
import { GuardianDesk } from "../pages/guardian/GuardianDesk.tsx";
import { GuardianDashboardPage } from "../pages/guardian/GuardianDashboardPage";
import { SplashPage } from "../pages/SplashPage";
import { StudentDashboardPage } from "../pages/student/StudentDashboardPage";
import { TeacherDesk } from "../pages/teacher/TeacherDesk.tsx";
import { TeacherDashboardPage } from "../pages/teacher/TeacherDashboardPage";
import { ProfilePage } from "../pages/profile/ProfilePage";
import { TaxShell } from "../modules/tax-learning/pages/TaxShell";
import {
  TaxChallengePage,
  TaxDecisionsPage,
  TaxHomePage,
  TaxLearnPage,
  TaxQuizPage,
  TaxSimulatePage,
  TaxSriLankaPage,
} from "../modules/tax-learning/pages/TaxPages";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<SplashPage />} />
      <Route path="/welcome" element={<SplashPage />} />
      <Route path="/login" element={<DemoLoginPage />} />
      <Route path="/signup" element={<CreateAccountPage />} />
      <Route path="/home" element={<StudentDashboardPage />} />
      <Route path="/student/dashboard" element={<StudentDashboardPage />} />
      <Route path="/teacher/dashboard" element={<TeacherDashboardPage />} />
      <Route path="/teacher/classes" element={<TeacherDesk view="classes" />} />
      <Route path="/teacher/students" element={<TeacherDesk view="students" />} />
      <Route path="/teacher/quizzes" element={<TeacherDesk view="quizzes" />} />
      <Route path="/teacher/assignments" element={<TeacherDesk view="assignments" />} />
      <Route path="/teacher/reports" element={<TeacherDesk view="reports" />} />
      <Route path="/guardian/dashboard" element={<GuardianDashboardPage />} />
      <Route path="/guardian/children" element={<GuardianDesk view="children" />} />
      <Route path="/guardian/progress" element={<GuardianDesk view="progress" />} />
      <Route path="/guardian/quizzes" element={<GuardianDesk view="quizzes" />} />
      <Route path="/guardian/tips" element={<GuardianDesk view="tips" />} />
      <Route path="/tax" element={<TaxShell />}>
        <Route index element={<TaxHomePage />} />
        <Route path="learn" element={<TaxLearnPage />} />
        <Route path="learn/:id" element={<TaxLearnPage />} />
        <Route path="simulate" element={<TaxSimulatePage />} />
        <Route path="challenge" element={<TaxChallengePage />} />
        <Route path="decisions" element={<TaxDecisionsPage />} />
        <Route path="quiz" element={<TaxQuizPage />} />
        <Route path="sri-lanka" element={<TaxSriLankaPage />} />
      </Route>
      <Route path="/market" element={<MarketHomePage />} />
      <Route path="/safety" element={<ScamHomePage />} />
      <Route path="/safety/inbox" element={<SimulatedInboxPage />} />
      <Route path="/safety/simulation-feedback" element={<SimulationFeedbackPage />} />
      <Route element={<AppLayout />}>
        <Route path="/market/lessons/:n" element={<MarketLessonPage />} />
        <Route path="/market/terminal" element={<MarketTerminalPage />} />
        <Route path="/market/confirm" element={<TradeConfirmationPage />} />
        <Route path="/market/portfolio" element={<PortfolioPage />} />
        <Route path="/choices" element={<LevelsPage />} />
        <Route path="/choices/levels/:levelId" element={<ScenarioPage />} />
        <Route path="/choices/levels/:levelId/:step" element={<ScenarioPage />} />
        <Route path="/missions" element={<MissionBoardPage />} />
        <Route path="/progress" element={<MissionBoardPage initialViewMode="JOURNEY" />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}
