import { Link } from "react-router-dom";
import { Card } from "../../components/common/Card";
import { CubAvatar } from "../../components/cub-assistant/CubAvatar";
import en from "../../locales/en.json";

const modules = [
  { title: en.landing.stock, hint: en.landing.stockHint },
  { title: en.landing.choices, hint: en.landing.choicesHint },
  { title: en.landing.missions, hint: en.landing.missionsHint },
  { title: en.landing.safety, hint: en.landing.safetyHint },
];

/** Alternate landing layout kept for later design comparison. Live route uses src/pages/LandingPage.tsx. */
export function LandingPage() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="brand">{en.appName}</span>
      </header>
      <main id="main" className="page">
        <p className="muted">{en.landing.eyebrow}</p>
        <h1>{en.appName}</h1>
        <p>{en.tagline}</p>
        <p>{en.landing.title}</p>
        <div className="cub-dock">
          <CubAvatar caption={en.cub.hello} name={en.cub.name} />
        </div>
        <div className="hero-actions">
          <Link className="btn btn-primary" to="/market">
            {en.landing.enterDemo}
          </Link>
        </div>
        <p className="muted">{en.landing.demoNote}</p>
        <h2>{en.landing.modulesHeading}</h2>
        <div className="module-grid">
          {modules.map((module) => (
            <Card key={module.title}>
              <h3>{module.title}</h3>
              <p className="muted">{module.hint}</p>
            </Card>
          ))}
        </div>
        <p>{en.landing.virtualMoney}</p>
      </main>
      <footer className="page-footer">{en.footer}</footer>
    </div>
  );
}
