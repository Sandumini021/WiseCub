import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { SiteTopBar } from "../../../components/layout/SiteTopBar";
import { childId as getChildId } from "../../../pages/auth/demoSession";
import {
  getSimulatedInbox,
  recordSimulationEvent,
  type SimulatedInboxItem,
} from "../../../services/apiClient";
import "../../../styles/dashboard-long.css";
import "../../../styles/scam-safety.css";

export function SimulatedInboxPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeChildId = searchParams.get("childId") || getChildId();

  const [items, setItems] = useState<SimulatedInboxItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "decided">("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "warning" | "info"; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    getSimulatedInbox(activeChildId)
      .then((res) => {
        if (!active) return;
        setItems(res.items || []);
        if (res.items?.length > 0) {
          // Select initial item from URL or first item
          const requestedId = searchParams.get("id");
          const target = res.items.find((i) => i.simulation_id === requestedId) || res.items[0];
          setSelectedId(target.simulation_id);
          // Record open event if unread
          if (!target.inbox_opened) {
            recordSimulationEvent(target.simulation_id, "inbox_opened").catch(() => {});
          }
        }
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeChildId, searchParams]);

  const activeEmail = items.find((i) => i.simulation_id === selectedId) || null;

  const handleSelectEmail = async (item: SimulatedInboxItem) => {
    setSelectedId(item.simulation_id);
    setNotice(null);
    if (!item.inbox_opened) {
      try {
        await recordSimulationEvent(item.simulation_id, "inbox_opened");
        setItems((prev) =>
          prev.map((i) => (i.simulation_id === item.simulation_id ? { ...i, inbox_opened: true } : i))
        );
      } catch {
        // ignore background open event error
      }
    }
  };

  const handleLinkClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!activeEmail || actionLoading) return;
    setActionLoading(true);

    try {
      const res = await recordSimulationEvent(activeEmail.simulation_id, "link_clicked");
      // Immediately navigate to safe controlled educational debrief
      const targetUrl = res.redirect_url || `/safety/simulation-feedback?id=${activeEmail.simulation_id}`;
      navigate(targetUrl);
    } catch {
      // Fallback direct navigate to feedback page
      navigate(`/safety/simulation-feedback?id=${activeEmail.simulation_id}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportSuspicious = async () => {
    if (!activeEmail || actionLoading) return;
    setActionLoading(true);

    try {
      const res = await recordSimulationEvent(
        activeEmail.simulation_id,
        "reported_suspicious",
        "suspicious"
      );
      setItems((prev) =>
        prev.map((i) =>
          i.simulation_id === activeEmail.simulation_id
            ? {
                ...i,
                reported_as_suspicious: true,
                initial_classification: "suspicious",
                outcome: "safely_reported",
              }
            : i
        )
      );
      setNotice({
        type: "success",
        text: "🎉 Excellent job! You correctly identified this message as suspicious and reported it without clicking the link.",
      });
      setTimeout(() => {
        const targetUrl = res.redirect_url || `/safety/simulation-feedback?id=${activeEmail.simulation_id}&action=reported`;
        navigate(targetUrl);
      }, 1200);
    } catch (err: unknown) {
      setNotice({
        type: "warning",
        text: (err as { message?: string })?.message || "Could not record report. Navigating to debrief...",
      });
      navigate(`/safety/simulation-feedback?id=${activeEmail.simulation_id}&action=reported`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkSafe = async () => {
    if (!activeEmail || actionLoading) return;
    setActionLoading(true);

    try {
      const res = await recordSimulationEvent(activeEmail.simulation_id, "marked_safe", "safe");
      setItems((prev) =>
        prev.map((i) =>
          i.simulation_id === activeEmail.simulation_id
            ? {
                ...i,
                initial_classification: "safe",
                outcome: "marked_safe",
              }
            : i
        )
      );
      setNotice({
        type: "info",
        text: "You classified this email as safe. Let's see whether it had hidden red flags in our safe debrief.",
      });
      setTimeout(() => {
        const targetUrl = res.redirect_url || `/safety/simulation-feedback?id=${activeEmail.simulation_id}&action=marked_safe`;
        navigate(targetUrl);
      }, 1200);
    } catch {
      navigate(`/safety/simulation-feedback?id=${activeEmail.simulation_id}&action=marked_safe`);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (filter === "pending") return item.outcome === "pending_decision";
    if (filter === "decided") return item.outcome !== "pending_decision";
    return true;
  });

  return (
    <div className="dash-long-wrap">
      <SiteTopBar />

      <main className="dash-long-main" style={{ maxWidth: "1120px", margin: "24px auto", padding: "0 16px" }}>
        {/* Navigation Breadcrumb */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <Link to="/safety" style={{ color: "#4f46e5", textDecoration: "none", fontWeight: 600, fontSize: "0.95rem" }}>
            ← Back to Scam Safety Dashboard
          </Link>
          <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
            Child Student: <strong>{activeChildId}</strong>
          </span>
        </div>

        {/* Safe Sandbox Banner */}
        <div className="safety-inbox-banner">
          <div style={{ fontSize: "1.75rem", marginRight: "12px" }}>🛡️</div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.25rem", color: "#1e1b4b" }}>
              WiseCub Practice Inbox — Safe Email Simulation
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: "0.86rem", color: "#475569", lineHeight: 1.45 }}>
              This is a controlled educational simulation environment. Emails here test your ability to evaluate real-world situations.
              Inspect the sender, message, and links carefully before making a decision. No real passwords or sensitive credentials are ever collected.
            </p>
          </div>
        </div>

        {notice && (
          <div
            style={{
              padding: "12px 18px",
              borderRadius: "10px",
              marginBottom: "16px",
              fontWeight: 600,
              fontSize: "0.92rem",
              background: notice.type === "success" ? "#ecfdf5" : notice.type === "warning" ? "#fffbeb" : "#eff6ff",
              color: notice.type === "success" ? "#065f46" : notice.type === "warning" ? "#92400e" : "#1e40af",
              border: `1px solid ${
                notice.type === "success" ? "#a7f3d0" : notice.type === "warning" ? "#fde68a" : "#bfdbfe"
              }`,
            }}
          >
            {notice.text}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
            Loading simulated inbox messages...
          </div>
        ) : items.length === 0 ? (
          <div className="safety-empty-inbox-card">
            <span style={{ fontSize: "3rem", display: "block", marginBottom: "12px" }}>📭</span>
            <h2 style={{ margin: "0 0 8px 0", fontSize: "1.25rem", color: "#1e293b" }}>Your Practice Inbox is Empty</h2>
            <p style={{ maxWidth: "520px", margin: "0 auto 20px auto", color: "#64748b", fontSize: "0.92rem", lineHeight: 1.5 }}>
              Realistic educational email simulations are generated when you pass practical levels with an 80% score or higher.
              Complete your Scam Safety lessons to trigger your first educational simulation!
            </p>
            <Link to="/safety" className="safety-btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>
              Go to Scam Safety Lessons →
            </Link>
          </div>
        ) : (
          <div className="safety-inbox-layout">
            {/* Inbox Sidebar & Message List */}
            <div className="safety-inbox-list-col">
              <div className="safety-inbox-filter-bar">
                <button
                  type="button"
                  className={`safety-inbox-filter-btn ${filter === "all" ? "active" : ""}`}
                  onClick={() => setFilter("all")}
                >
                  All ({items.length})
                </button>
                <button
                  type="button"
                  className={`safety-inbox-filter-btn ${filter === "pending" ? "active" : ""}`}
                  onClick={() => setFilter("pending")}
                >
                  Unanswered ({items.filter((i) => i.outcome === "pending_decision").length})
                </button>
                <button
                  type="button"
                  className={`safety-inbox-filter-btn ${filter === "decided" ? "active" : ""}`}
                  onClick={() => setFilter("decided")}
                >
                  Decided ({items.filter((i) => i.outcome !== "pending_decision").length})
                </button>
              </div>

              <div className="safety-inbox-messages-scroll">
                {filteredItems.map((item) => {
                  const isSelected = item.simulation_id === selectedId;
                  const isDecided = item.outcome !== "pending_decision";

                  return (
                    <div
                      key={item.simulation_id}
                      className={`safety-inbox-item-card ${isSelected ? "selected" : ""} ${
                        !item.inbox_opened ? "unread" : ""
                      }`}
                      onClick={() => handleSelectEmail(item)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="safety-inbox-item-header">
                        <span className="safety-inbox-sender-name">{item.sender_name}</span>
                        <span className="safety-inbox-item-level">Level {item.level_number}</span>
                      </div>
                      <div className="safety-inbox-item-subject">{item.subject}</div>
                      <div className="safety-inbox-item-preview">{item.preview}</div>
                      <div className="safety-inbox-item-footer">
                        {isDecided ? (
                          <span
                            className={`safety-inbox-status-pill ${
                              item.outcome === "safely_reported"
                                ? "reported"
                                : item.outcome === "unsafe_link_clicked"
                                ? "clicked"
                                : "safe"
                            }`}
                          >
                            {item.outcome === "safely_reported"
                              ? "🚩 Reported Suspicious"
                              : item.outcome === "unsafe_link_clicked"
                              ? "⚠️ Link Clicked"
                              : "✓ Marked Safe"}
                          </span>
                        ) : (
                          <span className="safety-inbox-status-pill pending">⏳ Needs Decision</span>
                        )}
                        <span style={{ fontSize: "0.74rem", color: "#94a3b8" }}>
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Today"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Email Detail Reading Pane */}
            <div className="safety-inbox-view-col">
              {activeEmail ? (
                <div className="safety-inbox-detail-card">
                  {/* Subject and Date */}
                  <div className="safety-inbox-detail-header">
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                        <span className="safety-inbox-tag">{activeEmail.level_title}</span>
                        <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                          Scenario: {activeEmail.scenario_name}
                        </span>
                      </div>
                      <h2 className="safety-inbox-detail-subject">{activeEmail.subject}</h2>
                    </div>
                  </div>

                  {/* Sender Details */}
                  <div className="safety-inbox-sender-info">
                    <div className="safety-inbox-avatar">
                      {activeEmail.sender_name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong>{activeEmail.sender_name}</strong>
                        <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                          {activeEmail.created_at ? new Date(activeEmail.created_at).toLocaleString() : "Just now"}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.84rem", color: "#64748b", fontFamily: "monospace" }}>
                        From: &lt;{activeEmail.sender_email}&gt;
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                        To: &lt;{activeChildId}@student.wisecub.org&gt;
                      </div>
                    </div>
                  </div>

                  {/* Previous Decision Notification (if already decided) */}
                  {activeEmail.outcome !== "pending_decision" && (
                    <div
                      className={`safety-inbox-decision-banner ${
                        activeEmail.outcome === "safely_reported"
                          ? "reported"
                          : activeEmail.outcome === "unsafe_link_clicked"
                          ? "clicked"
                          : "marked-safe"
                      }`}
                    >
                      {activeEmail.outcome === "safely_reported" && (
                        <div>
                          <strong>🎉 Decision Recorded:</strong> You identified and reported this email as suspicious without clicking!
                          <Link
                            to={`/safety/simulation-feedback?id=${activeEmail.simulation_id}&action=reported`}
                            style={{ marginLeft: "10px", fontWeight: 700, color: "#065f46" }}
                          >
                            View Educational Debrief →
                          </Link>
                        </div>
                      )}
                      {activeEmail.outcome === "unsafe_link_clicked" && (
                        <div>
                          <strong>⚠️ Decision Recorded:</strong> The simulated link was clicked.
                          <Link
                            to={`/safety/simulation-feedback?id=${activeEmail.simulation_id}`}
                            style={{ marginLeft: "10px", fontWeight: 700, color: "#991b1b" }}
                          >
                            Review Red Flags & Debrief →
                          </Link>
                        </div>
                      )}
                      {activeEmail.outcome === "marked_safe" && (
                        <div>
                          <strong>ℹ️ Decision Recorded:</strong> You marked this email as safe.
                          <Link
                            to={`/safety/simulation-feedback?id=${activeEmail.simulation_id}&action=marked_safe`}
                            style={{ marginLeft: "10px", fontWeight: 700, color: "#1e40af" }}
                          >
                            Review What Made It Suspicious →
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Email Content Body */}
                  <div className="safety-inbox-email-body">
                    <div style={{ whiteSpace: "pre-line", lineHeight: 1.65, color: "#1e293b", fontSize: "0.95rem" }}>
                      {activeEmail.body}
                    </div>

                    {/* Realistic Call-To-Action Link Simulation */}
                    <div className="safety-simulated-link-container">
                      <div style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "6px" }}>
                        Destination preview: <code style={{ color: "#d97706" }}>{activeEmail.display_link_text}</code>
                      </div>
                      <a
                        href="#simulate-link"
                        onClick={handleLinkClick}
                        className="safety-simulated-action-btn"
                        id="simulation-cta-link"
                      >
                        {activeEmail.call_to_action} ↗
                      </a>
                    </div>
                  </div>

                  {/* Child Decision Action Section */}
                  <div className="safety-inbox-decision-prompt">
                    <div style={{ marginBottom: "12px" }}>
                      <h3 style={{ margin: "0 0 4px 0", fontSize: "1rem", color: "#1e1b4b" }}>
                        What is your decision on this email?
                      </h3>
                      <p style={{ margin: 0, fontSize: "0.84rem", color: "#64748b" }}>
                        Evaluate the sender, deadline urgency, requested info, and links. Your choice will be recorded for your safety progress.
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        id="btn-report-suspicious"
                        className="safety-btn-report-suspicious"
                        disabled={actionLoading}
                        onClick={handleReportSuspicious}
                      >
                        🚩 This Email Looks Suspicious (Report)
                      </button>

                      <button
                        type="button"
                        id="btn-mark-safe"
                        className="safety-btn-mark-safe"
                        disabled={actionLoading}
                        onClick={handleMarkSafe}
                      >
                        ✓ I Believe This Email is Safe
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
                  Select an email on the left to read and evaluate.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
