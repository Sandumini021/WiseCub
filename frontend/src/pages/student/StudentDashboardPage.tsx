import { RequireRole } from "../../components/auth/RequireRole";
import { DashboardPage } from "../dashboard/DashboardPage";

export function StudentDashboardPage() {
  return (
    <RequireRole role="student">
      <DashboardPage />
    </RequireRole>
  );
}
