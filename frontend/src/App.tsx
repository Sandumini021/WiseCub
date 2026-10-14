import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes/AppRoutes";

export function App() {
  return (
    <BrowserRouter>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <AppRoutes />
    </BrowserRouter>
  );
}
