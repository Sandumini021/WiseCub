import { Link } from "react-router-dom";
import { RequireRole } from "../../components/auth/RequireRole";
import { RoleShell } from "../../components/layout/RoleShell";
import { useDemoChild } from "../auth/demoSession";

const LINKS = [
  { to: "/teacher/dashboard", label: "Home" },
  { to: "/teacher/classes", label: "Classes" },
  { to: "/teacher/students", label: "Students" },
  { to: "/teacher/quizzes", label: "Quizzes" },
  { to: "/teacher/assignments", label: "Assignments" },
  { to: "/teacher/reports", label: "Reports" },
];

export function TeacherDashboardPage() {
  const session = useDemoChild();
  return (
    <RequireRole role="teacher">
      <RoleShell
        title="Teacher"
        banner="Demo / unverified teacher. You can only see classes you create (Phase 3). You cannot open another teacher’s class."
        links={LINKS}
      >
        <h1>Hello, {session?.name?.split(" ")[0] || "teacher"}</h1>
        <p className="muted">
          Next: create a class and a join code. Adding students by username is Phase 3. Quizzes are
          Phase 5.
        </p>
        {session?.institution ? <p>Institution (demo): {session.institution}</p> : null}
        <div className="role-cards">
          {LINKS.slice(1).map((link) => (
            <Link key={link.to} className="role-card" to={link.to}>
              <strong>{link.label}</strong>
              <span>Opens a labelled stub until that phase is built.</span>
            </Link>
          ))}
        </div>
      </RoleShell>
    </RequireRole>
  );
}

export function TeacherStubPage({ title }: { title: string }) {
  return (
    <RequireRole role="teacher">
      <RoleShell
        title="Teacher"
        banner="Demo / unverified teacher workspace."
        links={LINKS}
      >
        <h1>{title}</h1>
        <p>This section is planned. Class join codes and quizzes are not live yet.</p>
        <Link to="/teacher/dashboard">Back to teacher home</Link>
      </RoleShell>
    </RequireRole>
  );
}
