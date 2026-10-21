import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { CubAssistant } from "./components/cub-assistant/CubAssistant";
import { useLang } from "./i18n/useLang";
import { AppRoutes } from "./routes/AppRoutes";

function SkipLink() {
  const { lang, t } = useLang();
  useEffect(() => {
    document.documentElement.lang = lang === "si" ? "si" : "en";
    document.documentElement.dataset.cubLang = lang;
  }, [lang]);
  return (
    <a className="skip-link" href="#main">
      {t("skip")}
    </a>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <SkipLink />
      <AppRoutes />
      <CubAssistant />
    </BrowserRouter>
  );
}
