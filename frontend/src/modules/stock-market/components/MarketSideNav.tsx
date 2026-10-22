import { NavLink, useLocation } from "react-router-dom";
import { useLang } from "../../../i18n/useLang";

const SIDE_LINKS: Array<{
  to: string;
  key: string;
  icon: string;
  end: boolean;
  hash?: string;
}> = [
  { to: "/market", key: "market.home", icon: "▤", end: true },
  { to: "/market/terminal", key: "market.terminal", icon: "⌘", end: false },
  { to: "/market/portfolio", key: "market.portfolio", icon: "☰", end: false },
  { to: "/market/portfolio", key: "market.history", icon: "⟳", end: false, hash: "history" },
  { to: "/market/lessons/1", key: "market.lessons", icon: "▣", end: false },
  { to: "/progress", key: "market.leaderboard", icon: "♛", end: false },
];

export function MarketSideNav() {
  const { t } = useLang();
  const location = useLocation();
  const hash = location.hash.replace("#", "");
  return (
    <aside className="mkt-side" aria-label="Market pages">
      {SIDE_LINKS.map((item) => (
        <NavLink
          key={item.key}
          to={item.hash ? `${item.to}#${item.hash}` : item.to}
          end={item.end}
          className={({ isActive }) => {
            if (item.hash) {
              return hash === item.hash ? "is-on" : undefined;
            }
            if (item.to === "/market/portfolio" && hash === "history") {
              return undefined;
            }
            return isActive ? "is-on" : undefined;
          }}
        >
          <span aria-hidden="true">{item.icon}</span>
          {t(item.key)}
        </NavLink>
      ))}
    </aside>
  );
}
