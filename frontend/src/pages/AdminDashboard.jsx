import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminSidebar from "../components/sidebar/AdminSidebar";
import "../App.css";


const API_BASE = `${process.env.REACT_APP_API_BASE_URL}/api`;


export default function AdminDashboard() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [user] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("user")) || null;
        } catch {
            return null;
        }
    });

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const userMenuRef = useRef(null);
    const [notifications, setNotifications] = useState([]);


    const [stats, setStats] = useState({
        totalUsers: 0,
        totalVehicles: 0,
        completedServices: 0,
        lowStock: 0,
    });

    const getFirstName = (u) => {
        if (!u) return "Admin";
        if (u.firstName) return u.firstName;
        if (u.name) return u.name.split(" ")[0];
        if (u.email) return u.email.split("@")[0];
        return "Admin";
    };

    const firstName = getFirstName(user);

    const confirmLogout = () => setShowLogoutConfirm(true);

    const doLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setShowLogoutConfirm(false);
        navigate("/", { replace: true });
    };

    const loadAdminStats = async () => {
        console.log("📡 Calling admin stats API");
        try {
            const res = await axios.get(`${API_BASE}/admin/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("✅ Admin stats response", res.data);
            setStats(res.data);
        } catch (err) {
            console.error("❌ Admin stats error", err);
        }
    };
    const loadNotifications = async () => {
        try {
            const res = await axios.get(
                `${process.env.REACT_APP_API_BASE_URL}/api/admin/notifications`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNotifications(res.data.notifications || []);
        } catch (err) {
            console.error("Failed to load notifications", err);
        }
    };


    useEffect(() => {
        loadAdminStats();
        loadNotifications();
        // eslint-disable-next-line
    }, []);



    return (
        <div className={`dashboard-page ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
            <button
                className={`hamburger-btn fixed-hamburger ${sidebarOpen ? "hidden" : ""}`}
                onClick={() => setSidebarOpen(true)}
            >
                <span className="hamburger-line" />
                <span className="hamburger-line" />
                <span className="hamburger-line" />
            </button>

            <AdminSidebar onToggle={setSidebarOpen} />

            <main className="dash-main">
                <div className="dash-header">
                    <div style={{ maxWidth: "calc(100% - 220px)" }}>
                        <h1>Welcome, {firstName}</h1>
                        <p className="muted">System overview and analytics</p>
                    </div>

                    <div className="dash-user" ref={userMenuRef}>
                        <div
                            className="dash-user-trigger"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowUserMenu(m => !m);
                            }}
                        >
                            <div className="dash-user-name">{firstName}</div>
                            <div className="dash-user-role">admin</div>
                        </div>

                        {showUserMenu && (
                            <div className="user-menu">
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

                <div className="dash-stats">
                    <div className="stat-card">
                        <div className="stat-icon">👥</div>
                        <div className="stat-title">Total Users</div>
                        <div className="stat-value blue">{stats.totalUsers}</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">✅</div>
                        <div className="stat-title">Completed Services</div>
                        <div className="stat-value blue">{stats.completedServices}</div>
                    </div>

                    <div
                        className="stat-card clickable"
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate("/admin/inventory?focus=low-stock")}
                    >
                        <div className="stat-icon">⚠️</div>
                        <div className="stat-title">Low Stock Alerts</div>
                        <div className="stat-value blue">{stats.lowStock}</div>
                    </div>
                </div>
                {/* ---- LOW STOCK NOTIFICATIONS ---- */}
                <div style={{ marginTop: 30 }}>
                    <h3>🚨 Low Stock Requests</h3>

                    {notifications.length === 0 ? (
                        <p className="muted">No low stock requests</p>
                    ) : (
                        <div className="recent-list">
                            {notifications.map(n => (
                                <div className="recent-row" key={n.id}>
                                    <div>
                                        <div className="recent-title">
                                            ⚠️ {n.type.replace("_", " ")}
                                        </div>
                                        <div className="recent-sub">{n.message}</div>
                                        <div className="recent-date">
                                            {new Date(n.created_at).toLocaleString()}
                                        </div>
                                    </div>

                                    {!n.is_read && (
                                        <span className="status-badge yellow">New</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </main>

            {showLogoutConfirm && (
                <div className="modal-overlay" onMouseDown={() => setShowLogoutConfirm(false)}>
                    <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
                        <div className="modal-header"><h3>Confirm Logout</h3></div>
                        <p>Are you sure you want to log out?</p>
                        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                            <button className="btn" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
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
        </div>
    );
}