// src/pages/ServiceCenterDashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ServiceCenterSidebar from "../components/sidebar/ServiceCenterSidebar";
import "../App.css";
import AddMechanicModal from "../components/AddMechanicModal";
import { io } from "socket.io-client";
import AddJobCardModal from "../components/AddJobCardModal";



const SOCKET_URL = `${process.env.REACT_APP_API_BASE_URL}`;
const API_BASE = `${process.env.REACT_APP_API_BASE_URL}/api`;

export default function ServiceCenterDashboard(onClose) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });
  const confirmLogout = () => setShowLogoutConfirm(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAddMechanic, setShowAddMechanic] = useState(false);
  const [mechanicCount, setMechanicCount] = useState(0);
  const [showJobCard, setShowJobCard] = useState(false);

  const doLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setShowLogoutConfirm(false);
    navigate("/", { replace: true });
  };
  const getFirstName = (u) => {
    if (!u) return "Service Center";
    if (u.firstName) return u.firstName;
    if (u.name) return u.name.split(" ")[0];
    if (u.email) return u.email.split("@")[0];
    return "Service Center";
  };

  const firstName = getFirstName(user);


  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const userMenuRef = useRef(null);

  const [stats, setStats] = useState({
    mechanics: 0,
    activeJobs: 0,
    pendingRequests: 0,
  });

  const [jobCards, setJobCards] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch dashboard data
  const loadDashboard = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/service-center/dashboard`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStats(res.data.stats);
      setJobCards(res.data.recentJobCards);

    } catch (err) {
      console.error("Service center dashboard error", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMechanicCount = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/mechanics/count/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMechanicCount(res.data.count);
    } catch (err) {
      console.error("Mechanic count failed", err);
    }
  };


  useEffect(() => {
    loadDashboard();
    fetchMechanicCount();
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    socket.on("booking-status-updated", () => {
      loadDashboard();   // refresh counts + job cards
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <div style={{ maxWidth: "calc(100% - 220px)" }}>
            <h1>Welcome back, {firstName}!</h1>
            <p className="muted">Here’s an overview of your service center activity.</p>
          </div>

          <div className="dash-user" ref={userMenuRef}>
            <div className="dash-user-trigger" onClick={(e) => { e.stopPropagation(); setShowUserMenu(m => !m); }}>
              <div className="dash-user-name">{firstName}</div>
              <div className="dash-user-role">{user?.role || "service_center"}</div>
            </div>

            {showUserMenu && (
              <div className="user-menu" role="menu">
                <div className="user-menu-item">
                  Signed in as <strong>{user?.email}</strong>
                </div>
                <div className="user-menu-item">
                  <button className="settings-logout" onClick={confirmLogout}>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>


        {/* ---- STATS ---- */}
        <div className="dash-stats">
          <div className="stat-card clickable" onClick={() => navigate("/service-center/mechanics")}> <div className="stat-icon">👨‍🔧</div><div className="stat-title">Total Mechanics</div><div className="stat-value">{mechanicCount}</div></div>
          <div className="stat-card clickable" onClick={() => navigate("/service-center/job-cards")}> <div className="stat-icon">🧾</div><div className="stat-title">Active Job Cards</div><div className="stat-value">{stats.activeJobs}</div></div>
          <div className="stat-card clickable" onClick={() => navigate("/service-center/bookings?status=pending")}> <div className="stat-icon">⏳</div><div className="stat-title">Pending Requests</div><div className="stat-value">{stats.pendingRequests}</div></div>
        </div>

        {/* ---- ACTIONS ---- */}
        <div className="dash-actions">
          <div className="actions-row">
            <button className="btn action-primary" onClick={() => setShowJobCard(true)}>
              Create Job Card
            </button>

            <button className="btn action-primary" onClick={() => setShowAddMechanic(true)}>
              Add Mechanic
            </button>

          </div>
        </div>

        {/* ---- RECENT JOB CARDS ---- */}
        <div className="dash-recent">
          <h3>Recent Job Cards</h3>

          {loading ? (
            <p>Loading job cards...</p>
          ) : jobCards.length === 0 ? (
            <p>No job cards found.</p>
          ) : (
            <div className="recent-list">
              {jobCards.map(card => (
                <div
                  className="recent-row clickable"
                  key={card.id}
                  onClick={() => navigate("/service-center/job-cards")}
                >
                  <div>
                    <div className="recent-title">{card.vehicle}</div>
                    <div className="recent-sub">{card.issue || card.service_type}</div>
                    <div className="recent-date">
                      Assigned Mechanic: {card.mechanic_name || "—"}
                    </div>
                  </div>

                  <div className="recent-right">
                    <span
                      className={`status-badge ${card.status === "COMPLETED"
                        ? "status-completed"
                        : card.status === "IN_PROGRESS"
                          ? "status-in-progress"
                          : card.status === "APPROVED"
                            ? "status-approved"
                            : card.status === "PENDING"
                              ? "status-pending"
                              : "status-rejected"
                        }`}
                    >
                      {card.status.replace("_", " ").toLowerCase()}
                    </span>


                    <div className="recent-amount">₹{card.amount}</div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      {showLogoutConfirm && (
        <div className="modal-overlay" onMouseDown={() => setShowLogoutConfirm(false)}>
          <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Logout</h3>
            </div>
            <p>Are you sure you want to log out?</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 14 }}>
              <button className="btn" onClick={() => setShowLogoutConfirm(false)}>
                Cancel
              </button>
              <button
                className="btn"
                style={{ background: "#ef4444", color: "#fff" }}
                onClick={doLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      {showAddMechanic && (
        <AddMechanicModal
          onClose={() => setShowAddMechanic(false)}
          onSaved={() => {
            setShowAddMechanic(false);
            navigate("/service-center/mechanics");
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
