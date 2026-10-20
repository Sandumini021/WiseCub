import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SiteTopBar } from "../../../components/layout/SiteTopBar";
import { getSimulationFeedback, type SimulationFeedback } from "../../../services/apiClient";
import "../../../styles/dashboard-long.css";
import "../../../styles/scam-safety.css";

export function SimulationFeedbackPage() {
  const [searchParams] = useSearchParams();
  const simulationId = searchParams.get("id") || "";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SimulationFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!simulationId) {
      setError("No simulation ID provided in the link.");
      setLoading(false);
      return;
    }

    let active = true;
    getSimulationFeedback(simulationId)
      .then((res) => {
        if (active) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err?.message || "Could not load educational feedback.");
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [simulationId]);

  return (
    <div className="dash-long-wrap">
      <SiteTopBar />

      <main className="dash-long-main" style={{ maxWidth: "800px", margin: "32px auto", padding: "0 16px" }}>
        <div style={{ marginBottom: "20px" }}>
          <Link to="/safety" style={{ color: "#4f46e5", textDecoration: "none", fontWeight: 600 }}>
            ← Back to Scam Safety Dashboard
          </Link>
        </div>

        <section className="card" style={{ padding: "32px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <span style={{ fontSize: "36px" }}>🛡️</span>
            <div>
              <h1 style={{ margin: 0, fontSize: "24px", color: "#1e1b4b" }}>
                WiseCub Educational Simulation Debrief
              </h1>
              <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "14px" }}>
                Controlled Parent & Child Scam Safety Learning Exercise
              </p>
            </div>
          </div>

          <div
            style={{
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              borderRadius: "8px",
              padding: "12px 16px",
              marginBottom: "24px",
              color: "#065f46",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            <strong>Safe Learning Zone:</strong> This email simulation was triggered after a completed lesson in WiseCub.
            No malicious links were sent, and no credentials or financial details are ever requested or collected.
          </div>

          {loading && (
            <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
              Loading educational debrief...
            </div>
          )}

          {error && (
            <div style={{ padding: "20px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#991b1b" }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {data && (
            <div>
              <div style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: "16px", marginBottom: "20px" }}>
                <span
                  style={{
                    display: "inline-block",
                    background: "#e0e7ff",
                    color: "#3730a3",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "8px",
                  }}
                >
                  {data.level_title}
                </span>
                <h2 style={{ margin: "4px 0", fontSize: "20px", color: "#111827" }}>
                  {data.scenario_name}
                </h2>
              </div>

              <div
                style={{
                  background: "#fffaf0",
                  borderLeft: "4px solid #dd6b20",
                  padding: "16px 20px",
                  borderRadius: "4px",
                  marginBottom: "24px",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#9c4221", textTransform: "uppercase", marginBottom: "6px" }}>
                  Simulated Scam Content That Was Sent:
                </div>
                <div style={{ color: "#7b341e", fontSize: "14px", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {data.simulated_body}
                </div>
              </div>

              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "10px",
                  padding: "20px",
                  marginBottom: "24px",
                }}
              >
                <h3 style={{ margin: "0 0 12px 0", color: "#166534", fontSize: "16px" }}>
                  🚩 Key Red Flags Demonstrated:
                </h3>
                <ul style={{ margin: 0, paddingLeft: "20px", color: "#15803d", fontSize: "14px", lineHeight: 1.7 }}>
                  {data.red_flags.map((flag, idx) => (
                    <li key={idx}><strong>{flag}</strong></li>
                  ))}
                </ul>
                <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px dashed #86efac", color: "#14532d", fontSize: "14px" }}>
                  <strong>Key Takeaway:</strong> {data.learning_goal}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "32px" }}>
                <Link
                  to="/safety"
                  style={{
                    display: "inline-block",
                    background: "#4f46e5",
                    color: "#ffffff",
                    padding: "12px 24px",
                    borderRadius: "8px",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Return to Scam Safety Dashboard
                </Link>
                <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                  Educational link verified and recorded securely.
                </span>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
