import { NavLink } from "react-router-dom";
import en from "../../locales/en.json";

const links = [
  { to: "/market", label: en.nav.market },
  { to: "/choices", label: en.nav.choices },
  { to: "/missions", label: en.nav.missions },
  { to: "/safety", label: en.nav.safety },
] as const;

export function Header() {
  return (
    <header className="app-header">
      <NavLink className="brand" to="/" end>
        <strong>{en.appName}</strong>
        <span>Learn · practise · stay safe</span>
      </NavLink>
      <nav className="nav-links" aria-label="Learning modules">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to}>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <p className="demo-chip">Demo child · virtual money only</p>
    </header>
  );
}
