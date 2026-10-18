import type { ReactNode } from "react";
import { Link, Navigate } from "react-router-dom";
import { useDemoChild } from "../../pages/auth/demoSession";
import { homePathForRole, type AccountRole } from "../../pages/auth/roles";

type RequireRoleProps = {
  role: AccountRole;
  children: ReactNode;
};

export function RequireRole({ role, children }: RequireRoleProps) {
  const { child, authReady } = useDemoChild();
  if (!authReady) {
    return (
      <section className="card" id="main" style={{ margin: "2rem auto", maxWidth: 520 }}>
        <p>Checking your session…</p>
      </section>
    );
  }
  if (!child) {
    return <Navigate to="/login" replace />;
  }
  const current = child.role ?? "student";
  if (current !== role) {
    return (
      <section className="card" id="main" style={{ margin: "2rem auto", maxWidth: 520 }}>
        <h1>Wrong dashboard</h1>
        <p>
          This page is for a {role}. You are signed in as a {current}. Role comes from the server
          session, not from this browser tab.
        </p>
        <p>
          <Link to={homePathForRole(current)}>Go to my dashboard</Link>
        </p>
      </section>
    );
  }
  return children;
}
