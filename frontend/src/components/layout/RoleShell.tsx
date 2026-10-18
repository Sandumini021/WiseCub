import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ChildAvatar } from "../../pages/auth/ChildAvatar";
import { clearDemoChild, useDemoChild } from "../../pages/auth/demoSession";
import { homePathForRole } from "../../pages/auth/roles";
import "../../styles/dashboard-long.css";
import "../../styles/role-dash.css";

type RoleLink = { to: string; label: string };

type RoleShellProps = {
  title: string;
  banner: string;
  links: RoleLink[];
  children: ReactNode;
};

export function RoleShell({ title, banner, links, children }: RoleShellProps) {
  const { child: session } = useDemoChild();
  const navigate = useNavigate();
  const name = session?.name?.trim() || "Guest";
  const home = homePathForRole(session?.role);

  return (
    <div className="role-shell" id="main">
      <header className="dash-top">
        <div className="dash-top-inner">
          <Link className="dash-brand" to={home}>
            <img className="dash-brand-face" src="/images/dash/cub-logo.png" alt="" />
            Wise<span>Cub</span>
          </Link>
          <nav className="dash-nav" aria-label={title}>
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.to.endsWith("dashboard")}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="dash-top-right">
            <Link className="dash-user" to="/profile">
              <ChildAvatar avatarId={session?.avatarId} name={name} />
              <span>{name}</span>
            </Link>
            <button
              className="dash-signout"
              type="button"
              onClick={() => {
                clearDemoChild();
                navigate("/login");
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <p className="role-banner">{banner}</p>
      <div className="role-body">{children}</div>
    </div>
  );
}
