// src/pages/Dashboard.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import BookServiceModal from "../components/BookServiceModal"; // ensure path correct
import "../App.css";
import Sidebar from "../components/sidebar/UserSidebar"; // add at top
import AddVehicleModal from "../components/AddVehicleModal";


const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || `${process.env.REACT_APP_API_BASE_URL}`;
const API_BASE = process.env.REACT_APP_API_URL || `${process.env.REACT_APP_API_BASE_URL}`;

export default function Dashboard() {
  const navigate = useNavigate();

  const [jobCards, setJobCards] = useState([]);
  const token = localStorage.getItem("token");
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")) || null; }
    catch { return null; }
  });


  const [vehicleCount, setVehicleCount] = useState(0);
  const fetchVehicleCount = useCallback(async () => {
    if (!token) return;

    try {
      const res = await axios.get(
        `${API_BASE}/api/vehicles/count/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVehicleCount(res.data.count);
    } catch (err) {
      console.error("Vehicle count failed", err);
    }
  }, [token]);

  useEffect(() => {
    fetchVehicleCount();
  }, [fetchVehicleCount]);



  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // NEW: Book modal state
  const [showBookModal, setShowBookModal] = useState(false);

  const userMenuRef = useRef(null);
  const socketRef = useRef(null);

  // stats now include counts based on bookings
  const [stats, setStats] = useState({ myVehicles: 3, completed: 0, pending: 0, approved: 0 });
  const [recentServices, setRecentServices] = useState([]);
  const [showAddVehicle, setShowAddVehicle] = useState(false);

  // load bookings from backend and compute stats & recentServices
  const loadBookingsAndCompute = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/bookings`, { timeout: 8000 });
      const bookings = (res.data && res.data.bookings) || [];

      // If user is 'user' role, filter only bookings created_by this user
      const visibleBookings = user?.role === "user"
        ? bookings.filter(b => String(b.created_by) === String(user.id))
        : bookings; // admins/service_center see all (or adjust later)

      // compute counts
      const counts = {
        pending: 0,
        approved: 0,
        completed: 0,
      };

      // pending + approved → from bookings
      visibleBookings.forEach(b => {
        const st = (b.status || "").toLowerCase();
        if (st === "pending") counts.pending++;
        if (st === "approved") counts.approved++;
      });

      // completed → from job cards
      jobCards.forEach(j => {
        if (j.status === "COMPLETED") counts.completed++;
      });


      // map to recentServices shape used by UI
      const mapped = visibleBookings
        .slice() // clone
        .sort((a, b) => {
          // sort by preferred_date desc, fallback to created_at
          const da = new Date(a.preferred_date || a.created_at || 0).getTime();
          const db = new Date(b.preferred_date || b.created_at || 0).getTime();
          return db - da;
        })
        .map(b => {
          // 🔑 FIND RELATED JOB CARD
          const relatedJob = jobCards.find(j => j.booking_id === b.id);

          // 🔑 DETERMINE FINAL STATUS (PRIORITY BASED)
          let finalStatus = (b.status || "pending").toLowerCase();

          if (relatedJob?.status === "IN_PROGRESS") {
            finalStatus = "in_progress";
          }

          if (relatedJob?.status === "COMPLETED") {
            finalStatus = "completed";
          }

          return {
            id: b.id,
            title: b.vehicle || `Booking ${b.id}`,
            subtitle: b.service_type || "",
            date: b.preferred_date
              ? new Date(b.preferred_date).toLocaleString()
              : (b.created_at ? new Date(b.created_at).toLocaleString() : ""),
            status: finalStatus,
            amount: b.amount ? `Rs. ${b.amount}` : "",
            raw: b,
          };
        });


      setStats(prev => ({ ...prev, pending: counts.pending, approved: counts.approved, completed: counts.completed }));
      setRecentServices(mapped);
    } catch (err) {
      console.error("Failed to load bookings:", err);
    }
  };

  const loadUserJobCards = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/user/job-cards`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJobCards(res.data.jobCards || []);
    } catch (err) {
      console.error("Failed to load job cards", err);
    }
  };


  useEffect(() => {
    if (user) {
      loadUserJobCards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (user) {
      loadBookingsAndCompute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobCards]);


  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
      if (window.innerWidth <= 720 && sidebarOpen && !e.target.closest(".dash-sidebar") && !e.target.closest(".hamburger-btn")) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [sidebarOpen]);

  const getFirstName = (u) => {
    if (!u) return null;
    if (u.firstName) return u.firstName;
    if (u.name) return u.name.split(" ")[0];
    if (u.email) return u.email.split("@")[0];
    return "User";
  };
  const firstName = getFirstName(user);


  const confirmLogout = () => setShowLogoutConfirm(true);
  const doLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setShowLogoutConfirm(false);
    navigate("/", { replace: true });
  };
  const onVehicleSaved = (vehicle) => {
    navigate("/vehicles");
  };


  // Handler called after booking created in modal
  const handleBookingCreated = (booking) => {
    // booking created: close modal, refresh bookings, and navigate to bookings page
    setShowBookModal(false);
    loadBookingsAndCompute();
    navigate("/bookings");
  };

  // SOCKET.IO: connect on mount, join rooms, listen for new-booking
  useEffect(() => {
    if (!user) return undefined;

    // connect socket once
    const socket = io(SOCKET_URL, { autoConnect: false });
    socketRef.current = socket;
    socket.connect();

    socket.on("connect", () => {
      // join room using role & user id
      const payload = { role: user?.role || "user", userId: user?.id || null };
      socket.emit("join", payload);
    });

    // handle incoming new bookings (server emits when someone creates booking)
    socket.on("new-booking", ({ booking }) => {
      // refresh bookings (keeps client consistent)
      loadBookingsAndCompute();

      // local UI bump as well (optimistic)
      if (user?.role === "service_center") {
        setStats(prev => ({ ...prev, pending: (prev.pending || 0) + 1 }));
        const mapped = {
          id: booking.id || Date.now(),
          title: booking.vehicle || `Booking ${booking.id || ""}`,
          subtitle: booking.service_type || "",
          date: booking.preferred_date || "",
          status: booking.status || "pending",
          amount: booking.amount ? `Rs. ${booking.amount}` : "",
          raw: booking
        };
        setRecentServices(prev => [mapped, ...prev]);
      } else {
        if (user?.id && booking.created_by && String(booking.created_by) === String(user.id)) {
          const mapped = {
            id: booking.id || Date.now(),
            title: booking.vehicle,
            subtitle: booking.service_type,
            date: booking.preferred_date || "",
            status: booking.status || "pending",
            amount: booking.amount ? `Rs. ${booking.amount}` : "",
            raw: booking
          };
          setRecentServices(prev => [mapped, ...prev]);
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("socket disconnected");
    });

    return () => {
      socket.off("new-booking");
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className={`dashboard-page ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
      {/* fixed floating hamburger */}
      <button
        className={`hamburger-btn fixed-hamburger ${sidebarOpen ? "hidden" : ""}`}
        aria-label="Open menu"
        onClick={(e) => { e.stopPropagation(); setSidebarOpen(true); }}
      >
        <span className="hamburger-line" />
        <span className="hamburger-line" />
        <span className="hamburger-line" />
      </button>

      <Sidebar onToggle={setSidebarOpen} />


      <section className="dash-main" role="main">
        <header className="dash-header">
          <div style={{ maxWidth: "calc(100% - 220px)" }}>
            <h1>Welcome back, {firstName || "User"}!</h1>
            <p className="muted">Here's what's happening with your vehicles</p>
          </div>

          <div className="dash-user" ref={userMenuRef}>
            <div className="dash-user-trigger" onClick={(e) => { e.stopPropagation(); setShowUserMenu(m => !m); }}>
              <div className="dash-user-name">{firstName || "User"}</div>
              <div className="dash-user-role">{user?.role || "user"}</div>
            </div>

            {showUserMenu && (
              <div className="user-menu" role="menu">
                <div className="user-menu-item">Signed in as <strong>{user?.firstName || user?.email}</strong></div>
                <div className="user-menu-item">
                  <div className="user-menu-item">
                    <button className="settings-logout" onClick={confirmLogout}>Logout</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="dash-stats">
          <div className="stat-card clickable" onClick={() => navigate("/vehicles")}>
            <div className="stat-icon">🚗</div><div className="stat-title">My Vehicles</div><div className="stat-value">{vehicleCount}</div></div>
          <div className="stat-card clickable" onClick={() => navigate("/bookings?status=completed")}>
            <div className="stat-icon">✅</div><div className="stat-title">Completed Services</div><div className="stat-value">{stats.completed}</div></div>
          <div className="stat-card clickable" onClick={() => navigate("/bookings?status=pending")}>
            <div className="stat-icon">⏳</div><div className="stat-title">Pending Approval</div><div className="stat-value">{stats.pending}</div></div>
        </div>

        <div className="dash-actions">
          <h3>Quick Actions</h3>
          <div className="actions-row">
            {/* open the BookServiceModal on click */}
            <button className="btn action-primary" onClick={() => setShowBookModal(true)}>📅 Book Service</button>
            <button className="btn action-primary" onClick={() => setShowAddVehicle(true)}>🚗 Add Vehicle</button>
          </div>
        </div>

        <div className="dash-recent">
          <h3>Recent Services</h3>
          <div className="recent-list">
            {recentServices.map(r => (
              <div
                key={r.id}
                className="recent-row clickable"
                onClick={() => navigate(`/bookings?status=${r.status}`)}
              >
                <div>
                  <div className="recent-title">{r.title}</div>
                  <div className="recent-sub">{r.subtitle}</div>
                  <div className="recent-date">Date: {r.date}</div>
                </div>
                <div className="recent-right">
                  <div
                    className={`status-badge ${r.status === "completed"
                      ? "status-completed"
                      : r.status === "in_progress"
                        ? "status-in-progress"
                        : r.status === "approved"
                          ? "status-approved"
                          : r.status === "pending"
                            ? "status-pending"
                            : "status-rejected"
                      }`}
                  >
                    {r.status.replace("_", " ")}
                  </div>

                  <div className="recent-amount">{r.amount}</div>
                </div>
              </div>
            ))}
            {recentServices.length === 0 && <div className="no-items">No recent services</div>}
          </div>
        </div>
      </section>

      {/* ------ Book Service modal: rendered when showBookModal true ------ */}
      {showBookModal && (
        <BookServiceModal
          onClose={() => setShowBookModal(false)}
          onCreated={handleBookingCreated}
        />
      )}
      {showAddVehicle && (
        <AddVehicleModal
          open={showAddVehicle}
          onClose={() => setShowAddVehicle(false)}
          onSaved={onVehicleSaved}
        />
      )}

      {/* Logout confirm */}
      {showLogoutConfirm && (
        <div className="modal-overlay" onMouseDown={() => setShowLogoutConfirm(false)}>
          <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Confirm Logout</h3></div>
            <p>Are you sure you want to log out?</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 14 }}>
              <button className="btn" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button className="btn" style={{ background: "#ef4444", color: "#fff" }} onClick={doLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
