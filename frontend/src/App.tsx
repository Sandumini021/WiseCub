import { BrowserRouter } from "react-router-dom";
import { CubAssistant } from "./components/cub-assistant/CubAssistant";
import { AppRoutes } from "./routes/AppRoutes";

export function App() {
  return (
    <BrowserRouter>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <AppRoutes />
      <CubAssistant />
    </BrowserRouter>
  );
}
