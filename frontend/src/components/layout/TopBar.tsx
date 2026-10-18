import { useDemoChild } from "../../pages/auth/demoSession";

type TopBarProps = {
  crumb: string;
  onMenu: () => void;
};

export function TopBar({ crumb, onMenu }: TopBarProps) {
  const child = useDemoChild();
  const label = child?.name?.trim() || "Guest";

  return (
    <header className="topbar">
      <button className="menu-btn" type="button" onClick={onMenu} aria-label="Open menu">
        Menu
      </button>
      <p className="crumb">{crumb}</p>
      <div className="topbar-right">
        <span className="lang-chip" title="English first. Sinhala comes later.">
          EN
        </span>
        <span className="user-chip">{label}</span>
      </div>
    </header>
  );
}
