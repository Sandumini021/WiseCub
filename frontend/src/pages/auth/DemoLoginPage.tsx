import { Link } from "react-router-dom";
import { CubMessage } from "../../components/cub-assistant/CubMessage";
import en from "../../locales/en.json";

export function DemoLoginPage() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="brand">
          {en.appName}
        </Link>
      </header>
      <main id="main" className="page">
        <CubMessage message={en.login.intro} />
        <h1>{en.login.title}</h1>
        <p className="muted">{en.landing.demoNote}</p>
        <div className="hero-actions">
          <Link className="btn btn-primary" to="/market">
            {en.login.continue}
          </Link>
          <Link className="btn btn-secondary" to="/">
            {en.nav.leave}
          </Link>
        </div>
      </main>
      <footer className="site-footer">{en.footer}</footer>
    </div>
  );
}
