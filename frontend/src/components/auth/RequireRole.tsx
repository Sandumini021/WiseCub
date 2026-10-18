import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useDemoChild } from "../../pages/auth/demoSession";
import { homePathForRole, type AccountRole } from "../../pages/auth/roles";

type RequireRoleProps = {
  role: AccountRole;
  children: ReactNode;
};

export function RequireRole({ role, children }: RequireRoleProps) {
  const session = useDemoChild();
  const current = session?.role ?? "student";
  if (current !== role) {
    return (
      <section className="card" id="main" style={{ margin: "2rem auto", maxWidth: 520 }}>
        <h1>Wrong dashboard</h1>
        <p>
          This page is for a {role}. You are signed in as a {current}. Demo role checks live in this
          browser until Phase 2 server sessions.
        </p>
        <p>
          <Link to={homePathForRole(current)}>Go to my dashboard</Link>
        </p>
      </section>
    );
  }
  return children;
}
