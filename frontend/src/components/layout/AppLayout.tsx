import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

const crumbs: Record<string, string> = {
  "/home": "Home",
  "/market": "Invest  >  Market Floor",
  "/market/terminal": "Invest  >  Market Floor  >  Terminal",
  "/market/confirm": "Invest  >  Market Floor  >  Confirm",
  "/choices": "Learn  >  Choice Town",
  "/missions": "Learn  >  Missions",
  "/safety": "Stay safe  >  Scam Alley",
  "/progress": "My Progress",
  "/profile": "Settings  >  Profile",
};

export function AppLayout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const crumb =
    crumbs[location.pathname] ??
    (location.pathname.startsWith("/market/lessons")
      ? "Invest  >  Market Floor  >  Lesson 1"
      : "WiseCub");

  return (
    <div className={`app-frame${menuOpen ? " is-nav-open" : ""}`}>
      <Sidebar onNavigate={() => setMenuOpen(false)} />
      {menuOpen ? (
        <button
          className="nav-backdrop"
          type="button"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <div className="app-col">
        <TopBar crumb={crumb} onMenu={() => setMenuOpen((open) => !open)} />
        <main id="main" className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
