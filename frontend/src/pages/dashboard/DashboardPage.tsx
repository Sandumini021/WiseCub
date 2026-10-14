import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../../components/common/Card";
import { getHealth } from "../../services/apiClient";
import en from "../../locales/en.json";

export function DashboardPage() {
  const [apiStatus, setApiStatus] = useState("Checking the learning API…");

  useEffect(() => {
    getHealth()
      .then((data) => setApiStatus(`API ${data.status} (${data.service})`))
      .catch(() =>
        setApiStatus("API is not running yet. Start the FastAPI server to connect."),
      );
  }, []);

  return (
    <>
      <h1>{en.dashboard.title}</h1>
      <p>{en.dashboard.intro}</p>
      <p className="muted">{apiStatus}</p>
      <div className="module-grid">
        <Card>
          <h2>{en.landing.stock}</h2>
          <p className="muted">{en.landing.stockHint}</p>
          <Link className="btn btn-primary" to="/market">
            {en.dashboard.openMarket}
          </Link>
        </Card>
        <Card>
          <h2>{en.landing.choices}</h2>
          <p className="muted">{en.landing.choicesHint}</p>
        </Card>
        <Card>
          <h2>{en.landing.missions}</h2>
          <p className="muted">{en.landing.missionsHint}</p>
        </Card>
        <Card>
          <h2>{en.landing.safety}</h2>
          <p className="muted">{en.landing.safetyHint}</p>
        </Card>
      </div>
    </>
  );
}
