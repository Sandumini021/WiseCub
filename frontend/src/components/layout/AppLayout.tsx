import { Outlet } from "react-router-dom";
import en from "../../locales/en.json";
import { CubAvatar } from "../cub-assistant/CubAvatar";
import { Header } from "./Header";

export function AppLayout() {
  return (
    <div>
      <Header />
      <div className="app-shell">
        <main id="main">
          <Outlet />
        </main>
        <div className="cub-dock">
          <CubAvatar caption={en.cub.placeholder} name={en.cub.name} />
        </div>
      </div>
    </div>
  );
}
