import { Link } from "react-router-dom";
import { RequireRole } from "../../components/auth/RequireRole";
import { RoleShell } from "../../components/layout/RoleShell";
import { useDemoChild } from "../auth/demoSession";

const LINKS = [
  { to: "/guardian/dashboard", label: "Home" },
  { to: "/guardian/children", label: "Linked children" },
  { to: "/guardian/progress", label: "Progress" },
  { to: "/guardian/quizzes", label: "Quiz results" },
  { to: "/guardian/tips", label: "Recommendations" },
];

export function GuardianDashboardPage() {
  const session = useDemoChild();
  return (
    <RequireRole role="guardian">
      <RoleShell
        title="Guardian"
        banner="Demo guardian view. You cannot open a child by guessing a username. Linking uses an invite code in Phase 6."
        links={LINKS}
      >
        <h1>Hello, {session?.name?.split(" ")[0] || "guardian"}</h1>
        <p className="muted">
          When a child is linked, you will see learning habits and quiz help — not virtual profit
          ranks, and not the child’s password.
        </p>
        <div className="role-cards">
          {LINKS.slice(1).map((link) => (
            <Link key={link.to} className="role-card" to={link.to}>
              <strong>{link.label}</strong>
              <span>Waiting for a verified child link.</span>
            </Link>
          ))}
        </div>
      </RoleShell>
    </RequireRole>
  );
}

export function GuardianStubPage({ title }: { title: string }) {
  return (
    <RequireRole role="guardian">
      <RoleShell title="Guardian" banner="Demo guardian workspace." links={LINKS}>
        <h1>{title}</h1>
        <p>No linked children yet. Invite codes come in Phase 6.</p>
        <Link to="/guardian/dashboard">Back to guardian home</Link>
      </RoleShell>
    </RequireRole>
  );
}
