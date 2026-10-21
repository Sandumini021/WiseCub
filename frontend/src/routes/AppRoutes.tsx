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
import { GuardianDashboardPage, GuardianStubPage } from "../pages/guardian/GuardianDashboardPage";
import { SplashPage } from "../pages/SplashPage";
import { StudentDashboardPage } from "../pages/student/StudentDashboardPage";
import { TeacherDashboardPage, TeacherStubPage } from "../pages/teacher/TeacherDashboardPage";
import { ProfilePage } from "../pages/profile/ProfilePage";

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
      <Route path="/teacher/classes" element={<TeacherStubPage title="Classes" />} />
      <Route path="/teacher/students" element={<TeacherStubPage title="Students" />} />
      <Route path="/teacher/quizzes" element={<TeacherStubPage title="Quizzes" />} />
      <Route path="/teacher/assignments" element={<TeacherStubPage title="Assignments" />} />
      <Route path="/teacher/reports" element={<TeacherStubPage title="Reports" />} />
      <Route path="/guardian/dashboard" element={<GuardianDashboardPage />} />
      <Route path="/guardian/children" element={<GuardianStubPage title="Linked children" />} />
      <Route path="/guardian/progress" element={<GuardianStubPage title="Progress" />} />
      <Route path="/guardian/quizzes" element={<GuardianStubPage title="Quiz results" />} />
      <Route path="/guardian/tips" element={<GuardianStubPage title="Recommendations" />} />
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
