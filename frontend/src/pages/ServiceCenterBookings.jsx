import React, { useEffect, useState } from "react";
import axios from "axios";
import ServiceCenterSidebar from "../components/sidebar/ServiceCenterSidebar";
import "../App.css";

const API_BASE = `${process.env.REACT_APP_API_BASE_URL}/api`;

export default function ServiceCenterBookings() {
    const token = localStorage.getItem("token");
    const [bookings, setBookings] = useState([]);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const loadBookings = async () => {
        try {
            const res = await axios.get(`${API_BASE}/bookings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setBookings(res.data.bookings || []);
        } catch (err) {
            console.error("Load bookings failed", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookings();
        // eslint-disable-next-line
    }, []);

    // ✅ FIXED: renamed `status` → `newStatus` + PUT → PATCH
    const updateStatus = async (id, newStatus) => {
        try {
            await axios.put(
                `${API_BASE}/bookings/${id}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setBookings(prev =>
                prev.map(b =>
                    b.id === id ? { ...b, status: newStatus } : b
                )
            );
        } catch (err) {
            console.error("Status update failed", err);
            alert("Failed to update status");
        }
    };

    const visibleBookings =
        filter === "all"
            ? bookings
            : bookings.filter(
                b => (b.status || "").toLowerCase() === filter
            );


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
                    <h1>Bookings</h1>
                    <p className="muted">Approve or reject service requests</p>
                </div>

                {/* ---- FILTER TABS ---- */}
                <div className="booking-tabs">
                    {["all", "pending", "approved", "rejected"].map(t => (
                        <button
                            key={t}
                            className={`booking-tab ${filter === t ? "active" : ""}`}
                            onClick={() => setFilter(t)}
                        >
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>


                {/* ---- LIST ---- */}
                {loading ? (
                    <p>Loading bookings...</p>
                ) : visibleBookings.length === 0 ? (
                    <p>No bookings found.</p>
                ) : (
                    <div className="recent-list">
                        {visibleBookings.map(b => {
                            const status = (b.status || "pending").toLowerCase();

                            return (
                                <div className="recent-row" key={b.id}>
                                    <div>
                                        <div className="recent-title">
                                            🚗 {b.vehicle}
                                        </div>

                                        <div className="recent-sub">
                                            👤 Customer: <strong>{b.created_by_name || "Unknown"}</strong>
                                        </div>

                                        <div className="recent-sub">
                                            🔧 Service: {b.service_type}
                                        </div>

                                        <div className="recent-date">
                                            📅 {b.preferred_date} | ⏰ {b.preferred_time}
                                        </div>

                                        {b.notes && (
                                            <div className="recent-notes">
                                                📝 Notes: {b.notes}
                                            </div>
                                        )}
                                    </div>


                                    <div className="recent-right">
                                        <span
                                            className={`status-badge ${status === "approved"
                                                ? "status-approved"
                                                : status === "pending"
                                                    ? "status-pending"
                                                    : status === "rejected"
                                                        ? "status-rejected"
                                                        : "status-pending"
                                                }`}
                                        >
                                            {status}
                                        </span>


                                        {b.status === "pending" && (
                                            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                                <button
                                                    className="action-primary"
                                                    onClick={() => updateStatus(b.id, "approved")}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    className="action-muted"
                                                    onClick={() => updateStatus(b.id, "rejected")}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
