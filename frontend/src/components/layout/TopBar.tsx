type TopBarProps = {
  crumb: string;
  onMenu: () => void;
};

export function TopBar({ crumb, onMenu }: TopBarProps) {
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
        <span className="user-chip">Demo User</span>
      </div>
    </header>
  );
}
