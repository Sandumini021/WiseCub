import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SiteTopBar } from "../../../components/layout/SiteTopBar";
import {
  getSimulationFeedback,
  submitSimulationFollowUp,
  type FollowUpSubmitResponse,
  type SimulationFeedback,
} from "../../../services/apiClient";
import "../../../styles/dashboard-long.css";
import "../../../styles/scam-safety.css";

export function SimulationFeedbackPage() {
  const [searchParams] = useSearchParams();
  const simulationId = searchParams.get("id") || "";
  const queryAction = searchParams.get("action"); // 'reported' | 'marked_safe'

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SimulationFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Follow-up question state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submittingFollowUp, setSubmittingFollowUp] = useState(false);
  const [followUpResult, setFollowUpResult] = useState<FollowUpSubmitResponse | null>(null);
  const [followUpError, setFollowUpError] = useState<string | null>(null);

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
          if (res.follow_up_completed && res.follow_up_selected_index !== undefined) {
            setSelectedOption(res.follow_up_selected_index);
            if (res.follow_up) {
              setFollowUpResult({
                ok: true,
                simulation_id: simulationId,
                selected_index: res.follow_up_selected_index,
                correct_index: res.follow_up.correct_index ?? 0,
                is_correct: Boolean(res.follow_up_correct),
                explanation: res.follow_up.explanation || "",
                learning_goal: res.learning_goal,
              });
            }
          }
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

  const handleFollowUpSubmit = async () => {
    if (selectedOption === null || !simulationId || submittingFollowUp) return;
    setSubmittingFollowUp(true);
    setFollowUpError(null);

    try {
      const res = await submitSimulationFollowUp(simulationId, selectedOption);
      setFollowUpResult(res);
    } catch (err: unknown) {
      setFollowUpError((err as { message?: string })?.message || "Could not save follow-up answer.");
    } finally {
      setSubmittingFollowUp(false);
    }
  };

  const isSafelyReported = queryAction === "reported" || (data?.reported_as_suspicious && !data?.link_clicked);
  const isMarkedSafe = queryAction === "marked_safe" || (data?.initial_classification === "safe" && !data?.reported_as_suspicious);
  const isLinkClicked = Boolean(data?.link_clicked || data?.educational_link_clicked) && !isSafelyReported;

  return (
    <div className="dash-long-wrap">
      <SiteTopBar />

      <main className="dash-long-main" style={{ maxWidth: "840px", margin: "32px auto", padding: "0 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <Link to="/safety/inbox" style={{ color: "#4f46e5", textDecoration: "none", fontWeight: 600 }}>
            ← Back to Practice Inbox
          </Link>
          <Link to="/safety" style={{ color: "#64748b", textDecoration: "none", fontSize: "0.9rem" }}>
            Scam Safety Curriculum Dashboard →
          </Link>
        </div>

        <section className="card" style={{ padding: "32px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
            <span style={{ fontSize: "40px" }}>🛡️</span>
            <div>
              <h1 style={{ margin: 0, fontSize: "24px", color: "#1e1b4b" }}>
                WiseCub Educational Simulation Debrief
              </h1>
              <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "14px" }}>
                Controlled Child & Parent Online Safety Learning Exercise
              </p>
            </div>
          </div>

          {/* Controlled Safe Simulation Banner */}
          <div
            style={{
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              borderRadius: "10px",
              padding: "14px 18px",
              marginBottom: "24px",
              color: "#065f46",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            <strong>Safe Educational Sandbox:</strong> This simulation was initiated following a passed Scam Safety lesson.
            All fictional organisations, senders, and destinations are completely controlled within WiseCub.
            No real malicious destinations exist, and passwords, card numbers, or sensitive credentials are never requested or collected.
          </div>

          {loading && (
            <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
              Loading educational debrief and scenario insights...
            </div>
          )}

          {error && (
            <div style={{ padding: "20px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#991b1b" }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {data && (
            <div>
              {/* Dynamic Child Decision Outcome Banner */}
              {isSafelyReported && (
                <div className="safety-debrief-outcome-banner success">
                  <div style={{ fontSize: "28px" }}>🎉</div>
                  <div>
                    <h3 style={{ margin: "0 0 4px 0", fontSize: "17px", color: "#065f46" }}>
                      Outstanding Detection! You Reported This Suspicious Email
                    </h3>
                    <p style={{ margin: 0, fontSize: "14px", color: "#047857", lineHeight: 1.45 }}>
                      You successfully noticed the warning signs and reported the message without clicking its simulated link.
                      Review the specific red flags below to reinforce your instincts.
                    </p>
                  </div>
                </div>
              )}

              {isLinkClicked && (
                <div className="safety-debrief-outcome-banner warning">
                  <div style={{ fontSize: "28px" }}>⚠️</div>
                  <div>
                    <h3 style={{ margin: "0 0 4px 0", fontSize: "17px", color: "#991b1b" }}>
                      Take Care: You Clicked the Simulated Link
                    </h3>
                    <p style={{ margin: 0, fontSize: "14px", color: "#b91c1c", lineHeight: 1.45 }}>
                      In real-world scams, clicking unknown or urgent links can lead to malicious clone websites designed to harvest logins or install malware.
                      Because this is WiseCub, you were brought safely here to learn the warning signs.
                    </p>
                  </div>
                </div>
              )}

              {isMarkedSafe && (
                <div className="safety-debrief-outcome-banner info">
                  <div style={{ fontSize: "28px" }}>ℹ️</div>
                  <div>
                    <h3 style={{ margin: "0 0 4px 0", fontSize: "17px", color: "#1e40af" }}>
                      Learning Opportunity: You Classified This Email as Safe
                    </h3>
                    <p style={{ margin: 0, fontSize: "14px", color: "#1d4ed8", lineHeight: 1.45 }}>
                      This message was designed to look plausible, but it contained subtle deception cues.
                      Let's break down the hidden red flags so you can recognize them next time!
                    </p>
                  </div>
                </div>
              )}

              {/* Scenario Context */}
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
                {data.sender_name && (
                  <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>
                    Fictional Sender: <strong>{data.sender_name}</strong> &lt;{data.sender_email}&gt;
                  </div>
                )}
              </div>

              {/* Simulated Email Content */}
              <div
                style={{
                  background: "#fffaf0",
                  borderLeft: "4px solid #dd6b20",
                  padding: "16px 20px",
                  borderRadius: "6px",
                  marginBottom: "24px",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#9c4221", textTransform: "uppercase", marginBottom: "8px" }}>
                  Simulated Message Content:
                </div>
                <div style={{ color: "#7b341e", fontSize: "14px", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {data.simulated_body}
                </div>
                {data.display_link_text && (
                  <div style={{ marginTop: "12px", paddingTop: "8px", borderTop: "1px dashed #fed7aa", fontSize: "13px", color: "#9a3412" }}>
                    Simulated link destination was: <code>{data.display_link_text}</code>
                  </div>
                )}
              </div>

              {/* Red Flags Analysis */}
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "12px",
                  padding: "20px",
                  marginBottom: "24px",
                }}
              >
                <h3 style={{ margin: "0 0 12px 0", color: "#166534", fontSize: "16px" }}>
                  🚩 Specific Red Flags in This Scenario:
                </h3>
                <ul style={{ margin: 0, paddingLeft: "20px", color: "#15803d", fontSize: "14px", lineHeight: 1.7 }}>
                  {data.red_flags.map((flag, idx) => (
                    <li key={idx}><strong>{flag}</strong></li>
                  ))}
                </ul>

                <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px dashed #86efac" }}>
                  <h4 style={{ margin: "0 0 6px 0", color: "#14532d", fontSize: "14px" }}>
                    💡 How to Protect Yourself in Real Life:
                  </h4>
                  <p style={{ margin: 0, color: "#166534", fontSize: "13px", lineHeight: 1.5 }}>
                    1. <strong>Inspect the sender domain:</strong> Never rely on the display name alone. Look closely at the domain after the @ symbol.<br />
                    2. <strong>Beware of artificial deadlines:</strong> Scammers use urgent count-downs or short deadlines so you act impulsively without verifying.<br />
                    3. <strong>Verify out-of-band:</strong> If an email claims to come from your school or an organization, visit their official website or ask a teacher or parent directly instead of clicking email links.
                  </p>
                </div>

                <div style={{ marginTop: "14px", paddingTop: "10px", color: "#14532d", fontSize: "14px" }}>
                  <strong>Key Learning Goal:</strong> {data.learning_goal}
                </div>
              </div>

              {/* Interactive Follow-Up Understanding Check */}
              {data.follow_up && (
                <div className="safety-followup-card">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                    <span style={{ fontSize: "22px" }}>📝</span>
                    <h3 style={{ margin: 0, fontSize: "16px", color: "#1e1b4b" }}>
                      Follow-up Understanding Check
                    </h3>
                  </div>

                  <p style={{ margin: "0 0 16px 0", color: "#334155", fontSize: "14px", fontWeight: 600 }}>
                    {data.follow_up.question}
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                    {data.follow_up.options.map((option, idx) => {
                      const isSelected = selectedOption === idx;
                      const hasSubmitted = Boolean(followUpResult);
                      const isCorrect = hasSubmitted && idx === followUpResult?.correct_index;
                      const isWrongChoice = hasSubmitted && isSelected && !followUpResult?.is_correct;

                      return (
                        <label
                          key={idx}
                          className={`safety-followup-option ${isSelected ? "selected" : ""} ${
                            isCorrect ? "correct" : isWrongChoice ? "incorrect" : ""
                          }`}
                          style={{ cursor: hasSubmitted ? "default" : "pointer" }}
                        >
                          <input
                            type="radio"
                            name="followup-option"
                            value={idx}
                            disabled={hasSubmitted}
                            checked={isSelected}
                            onChange={() => setSelectedOption(idx)}
                          />
                          <span style={{ fontSize: "14px", color: "#1e293b", flex: 1 }}>{option}</span>
                          {isCorrect && <span style={{ color: "#059669", fontWeight: 700 }}>✓ Correct</span>}
                          {isWrongChoice && <span style={{ color: "#dc2626", fontWeight: 700 }}>✗ Incorrect</span>}
                        </label>
                      );
                    })}
                  </div>

                  {followUpError && (
                    <div style={{ color: "#dc2626", fontSize: "13px", marginBottom: "12px" }}>
                      {followUpError}
                    </div>
                  )}

                  {!followUpResult ? (
                    <button
                      type="button"
                      id="btn-submit-followup"
                      className="safety-btn-primary"
                      disabled={selectedOption === null || submittingFollowUp}
                      onClick={handleFollowUpSubmit}
                    >
                      {submittingFollowUp ? "Submitting..." : "Submit Understanding Check"}
                    </button>
                  ) : (
                    <div
                      style={{
                        padding: "14px 16px",
                        borderRadius: "8px",
                        background: followUpResult.is_correct ? "#ecfdf5" : "#fef2f2",
                        border: `1px solid ${followUpResult.is_correct ? "#a7f3d0" : "#fecaca"}`,
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: "14px", color: followUpResult.is_correct ? "#065f46" : "#991b1b", marginBottom: "4px" }}>
                        {followUpResult.is_correct ? "✓ Spot on!" : "Review the correct approach:"}
                      </div>
                      <div style={{ fontSize: "13px", color: followUpResult.is_correct ? "#047857" : "#7f1d1d", lineHeight: 1.5 }}>
                        {followUpResult.explanation}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Action Buttons */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "32px", flexWrap: "wrap", gap: "12px" }}>
                <Link
                  to="/safety/inbox"
                  style={{
                    display: "inline-block",
                    background: "#4f46e5",
                    color: "#ffffff",
                    padding: "12px 22px",
                    borderRadius: "8px",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  ← Return to Practice Inbox
                </Link>

                <Link
                  to="/safety"
                  style={{
                    display: "inline-block",
                    background: "#f1f5f9",
                    color: "#334155",
                    padding: "12px 22px",
                    borderRadius: "8px",
                    fontWeight: 600,
                    textDecoration: "none",
                    border: "1px solid #cbd5e1",
                  }}
                >
                  Scam Safety Dashboard
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
