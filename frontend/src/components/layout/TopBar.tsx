import { Link } from "react-router-dom";
import { ChildAvatar } from "../../pages/auth/ChildAvatar";
import { useDemoChild } from "../../pages/auth/demoSession";

type TopBarProps = {
  crumb: string;
};

export function TopBar({ crumb }: TopBarProps) {
  const child = useDemoChild();
  const label = child?.name?.trim() || "Guest";

  return (
    <header className="topbar">
      <Link className="topbar-home" to="/home">
        ← Home
      </Link>
      <p className="crumb">{crumb}</p>
      <div className="topbar-right">
        <span className="lang-chip" title="English first. Sinhala comes later.">
          EN
        </span>
        <span className="user-chip">
          <ChildAvatar avatarId={child?.avatarId} name={label} />
          {label}
        </span>
      </div>
    </header>
  );
}
