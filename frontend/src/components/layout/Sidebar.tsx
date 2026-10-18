import { NavLink } from "react-router-dom";

const mainLinks = [
  { to: "/home", label: "Home", icon: "home" },
  { to: "/market", label: "Market Floor", icon: "chart" },
  { to: "/choices", label: "Choice Town", icon: "choices" },
  { to: "/missions", label: "Missions", icon: "flag" },
  { to: "/safety", label: "Scam Alley", icon: "shield" },
  { to: "/progress", label: "My Progress", icon: "bars" },
] as const;

function Icon({ name }: { name: string }) {
  const common = {
    width: 22,
    height: 22,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (name === "home") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
      </svg>
    );
  }
  if (name === "chart") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M4 19h16M7 16v-5M12 16V8M17 16v-8" />
      </svg>
    );
  }
  if (name === "choices") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </svg>
    );
  }
  if (name === "flag") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M6 4v16M6 5h11l-2 3 2 3H6" />
      </svg>
    );
  }
  if (name === "shield") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M12 3 5 6v6c0 5 3.2 7.8 7 9 3.8-1.2 7-4 7-9V6z" />
      </svg>
    );
  }
  return (
    <svg {...common} viewBox="0 0 24 24">
      <path d="M4 19V10M10 19V5M16 19v-7M20 19V8" />
    </svg>
  );
}

type SidebarProps = {
  onNavigate?: () => void;
};

export function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <NavLink className="sidebar-brand" to="/home" onClick={onNavigate}>
        <span className="sidebar-logo" aria-hidden="true">
          🐻
        </span>
        <strong>WiseCub</strong>
      </NavLink>
      <nav className="sidebar-nav" aria-label="Main">
        {mainLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className="sidebar-link"
            onClick={onNavigate}
          >
            <Icon name={link.icon} />
            <span className="sidebar-link-text">{link.label}</span>
          </NavLink>
        ))}
      </nav>
      <NavLink className="sidebar-link sidebar-settings" to="/profile" onClick={onNavigate}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
        <span>Settings</span>
      </NavLink>
    </aside>
  );
}
