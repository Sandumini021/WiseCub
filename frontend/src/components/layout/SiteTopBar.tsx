import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChildAvatar } from "../../pages/auth/ChildAvatar";
import { clearDemoChild, useDemoChild } from "../../pages/auth/demoSession";

const TABS = [
  { to: "/home", label: "Home", icon: "⌂" },
  { to: "/missions", label: "Learn", icon: "▣" },
  { to: "/market", label: "Market", icon: "▤" },
  { to: "/safety", label: "Stay Safe", icon: "◈" },
  { to: "/choices", label: "Life Choices", icon: "◎" },
] as const;

export function SiteTopBar() {
  const child = useDemoChild();
  const location = useLocation();
  const navigate = useNavigate();
  const onMarket = location.pathname.startsWith("/market");
  const displayName = child?.name?.trim() || "";

  function onSignOut() {
    clearDemoChild();
    navigate("/home");
  }

  return (
    <header className="dash-top">
      <div className="dash-top-inner">
        <Link className="dash-brand" to="/home">
          <img className="dash-brand-face" src="/images/dash/cub-logo.png" alt="" />
          Wise<span>Cub</span>
        </Link>
        <nav className="dash-nav" aria-label="Component homes">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === "/home"}
              className={({ isActive }) => {
                const on = tab.to === "/market" ? onMarket : isActive;
                if (!on) {
                  return undefined;
                }
                return tab.to === "/market" ? "is-on is-gold" : "is-on";
              }}
            >
              <span aria-hidden="true">{tab.icon}</span>
              {tab.label}
            </NavLink>
          ))}
        </nav>
        <div className="dash-top-right">
          <span className="dash-en" title="English first. Sinhala comes later.">
            EN
          </span>
          {displayName ? (
            <>
              <Link className="dash-user" to="/profile" title={displayName}>
                <ChildAvatar avatarId={child?.avatarId} name={displayName} />
                <span>{displayName}</span>
              </Link>
              <button className="dash-signout" type="button" onClick={onSignOut}>
                Sign out
              </button>
            </>
          ) : (
            <div className="dash-auth">
              <Link className="dash-login" to="/login">
                Login
              </Link>
              <Link className="dash-signup" to="/signup">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
