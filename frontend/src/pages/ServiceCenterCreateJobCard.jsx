// \frontend\src\pages\ServiceCenterCreateJobCard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import ServiceCenterSidebar from "../components/sidebar/ServiceCenterSidebar";
import { useNavigate } from "react-router-dom";
import CompleteJobCardModal from "../components/CompleteJobCardModal";
import "../App.css";
import AddJobCardModal from "../components/AddJobCardModal";

const API = `${process.env.REACT_APP_API_BASE_URL}/api/service-center/job-cards`;

export default function ServiceCenterJobCards() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [jobCards, setJobCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completeJob, setCompleteJob] = useState(null);
  const [showJobCard, setShowJobCard] = useState(false);

  const loadJobCards = async () => {
    try {
      const res = await axios.get(API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobCards(res.data.jobCards || []);
    } catch (err) {
      console.error("Failed to load job cards", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobCards();
    // eslint-disable-next-line
  }, []);

  return (
    <div className={`dashboard-page ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
      <button
        className={`hamburger-btn fixed-hamburger ${sidebarOpen ? "hidden" : ""}`}
        aria-label="Open menu"
        onClick={(e) => {
          e.stopPropagation();
          setSidebarOpen(true);
        }}
      >
        <span className="hamburger-line" />
        <span className="hamburger-line" />
        <span className="hamburger-line" />
      </button>
      <ServiceCenterSidebar onToggle={setSidebarOpen} />

      <main className="dash-main">
        <div className="dash-header">
          <h1>Job Cards</h1>
          <button className="btn action-primary" onClick={() => setShowJobCard(true)}>
            ➕ Create Job Card
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : jobCards.length === 0 ? (
          <p>No job cards found.</p>
        ) : (
          <div className="recent-list">
            {jobCards.map((j) => (
              <div className="recent-row" key={j.id}>
                <div>
                  <div className="recent-title">🚗 {j.vehicle}</div>
                  <div className="recent-sub">
                    Service: {j.service}
                  </div>

                  <div className="recent-date">
                    Service Center Note: {j.issue}
                  </div>

                  {j.user_note && (
                    <div className="recent-date">
                      Customer Note: {j.user_note}
                    </div>
                  )}

                  <div className="recent-date">
                    Mechanic: {j.mechanic_name}
                  </div>
                </div>

                <div className="recent-right">
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {/* Job Status */}
                    <span
                      className={`status-badge ${j.status === "COMPLETED"
                        ? "status-completed"
                        : j.status === "IN_PROGRESS"
                          ? "status-in-progress"
                          : "status-approved"
                        }`}
                    >
                      {j.status.replace("_", " ")}
                    </span>

                    {/* Payment Status */}
                    {j.payment_status === "paid" && (
                      <span
                        style={{
                          backgroundColor: "#16a34a",
                          color: "#fff",
                          padding: "4px 10px",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        ✓ Paid
                      </span>
                    )}
                  </div>

                  {/* 🟦 ACTIVE JOB CARD */}
                  {j.status !== "COMPLETED" && (
                    <button
                      className="btn action-primary"
                      onClick={() => setCompleteJob(j)}
                    >
                      Complete Service
                    </button>
                  )}

                  {/* ✅ COMPLETED JOB CARD OPTIONS */}
                  {j.status === "COMPLETED" && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="btn"
                        onClick={() =>
                          navigate(
                            `/service-center/job-cards/${j.id}/invoice`
                          )
                        }
                      >
                        View Invoice
                      </button>

                      <button
                        className="btn"
                        onClick={async () => {
                          try {
                            const res = await axios.get(
                              `${process.env.REACT_APP_API_BASE_URL}/api/service-center/job-cards/${j.id}/invoice/pdf`,
                              {
                                headers: { Authorization: `Bearer ${token}` },
                                responseType: "blob",
                              }
                            );

                            const blob = new Blob([res.data], { type: "application/pdf" });
                            const url = window.URL.createObjectURL(blob);

                            // sanitize vehicle name for filename
                            const safeVehicleName = j.vehicle
                              .replace(/[^a-z0-9]/gi, "_")
                              .toLowerCase();


                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `${safeVehicleName}_invoice.pdf`; // 🚗 vehicle name
                            a.click();

                            window.URL.revokeObjectURL(url);
                          } catch (err) {
                            alert("Failed to download PDF");
                            console.error(err);
                          }
                        }}
                      >
                        Download PDF
                      </button>

                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ✅ Complete Job + Billing Modal */}
      {completeJob && (
        <CompleteJobCardModal
          jobCard={completeJob}
          onClose={() => setCompleteJob(null)}
          onSuccess={() => {
            setCompleteJob(null);
            loadJobCards();
          }}
        />
      )}
      {showJobCard && (
        <AddJobCardModal
          onClose={() => setShowJobCard(false)}
          onSaved={() => {
            setShowJobCard(false);
            navigate("/service-center/job-cards");
          }}
        />
      )}
    </div>
  );
}
