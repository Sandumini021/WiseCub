import { Link } from "react-router-dom";
import "../styles/splash.css";

export function SplashPage() {
  return (
    <Link className="splash" id="main" to="/login" aria-label="WiseCub. Tap anywhere to continue to login.">
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
      <span className="visually-hidden">Continue to login</span>
    </Link>
  );
}
