import { Link } from "react-router-dom";
import { LanguageSelect } from "../components/layout/LanguageSelect";
import { useLang } from "../i18n/useLang";
import "../styles/splash.css";

export function SplashPage() {
  const { t } = useLang();
  return (
    <div className="splash-wrap">
    <div className="splash-lang">
      <LanguageSelect />
    </div>
    <Link className="splash" id="main" to="/login" aria-label={t("splash.continue")}>
      <span className="splash-star splash-star-a" aria-hidden="true">
        ✦
      </span>
      <span className="splash-star splash-star-b" aria-hidden="true">
        ★
      </span>
      <span className="splash-star splash-star-c" aria-hidden="true">
        ✦
      </span>
      <span className="splash-plane" aria-hidden="true">
        ✈
      </span>

      <img className="splash-cub" src="/images/cub-wave.png" alt="" draggable={false} />

      <p className="splash-wordmark">
        Wise<span>Cub</span>
      </p>
      <span className="splash-underline" aria-hidden="true" />

      <span className="splash-cta" aria-hidden="true">
        →
      </span>
      <span className="visually-hidden">{t("splash.continue")}</span>
    </Link>
    </div>
  );
}
