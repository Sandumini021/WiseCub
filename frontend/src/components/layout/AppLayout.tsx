import { Outlet, useLocation } from "react-router-dom";
import { TopBar } from "./TopBar";

const crumbs: Record<string, string> = {
  "/market/terminal": "Market  >  Terminal",
  "/market/confirm": "Market  >  Confirm",
  "/market/portfolio": "Market  >  Portfolio",
  "/choices": "Life Choices",
  "/missions": "Learn  >  Missions",
  "/safety": "Stay Safe",
  "/progress": "My Progress",
  "/profile": "Profile",
};

export function AppLayout() {
  const location = useLocation();
  const crumb =
    crumbs[location.pathname] ??
    (location.pathname.startsWith("/market/lessons") ? "Market  >  Lesson 1" : "WiseCub");

  return (
    <div className="app-frame">
      <div className="app-col">
        <TopBar crumb={crumb} />
        <main id="main" className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
