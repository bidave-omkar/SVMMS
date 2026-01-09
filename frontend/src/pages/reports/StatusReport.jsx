import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../../components/sidebar/AdminSidebar";
import "../../App.css";

const API = `${process.env.REACT_APP_API_BASE_URL}/api/admin/reports/status`;

export default function StatusReport() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [data, setData] = useState(null);
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const token = localStorage.getItem("token");

    const loadData = () => {
        axios
            .get(API, {
                params: { from, to },
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => setData(res.data))
            .catch(() => alert("Failed to load status report"));
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line
    }, []);

    if (!data) return null;

    return (
        <div className={`dashboard-page status-report-page ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
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
                <div className="report-container">

                    {/* HEADER */}
                    <div className="dash-header">
                        <div>
                            <h1>Booking & Job Status</h1>
                            <p className="muted">Status distribution & service efficiency</p>
                        </div>

                        <div className="report-filters">
                            <input
                                type="date"
                                value={from}
                                onChange={e => setFrom(e.target.value)}
                            />
                            <input
                                type="date"
                                value={to}
                                onChange={e => setTo(e.target.value)}
                            />
                            <button className="btn btn-primary" onClick={loadData}>
                                Apply
                            </button>
                        </div>
                    </div>


                    {/* COMPLETION METRICS */}
                    <section className="report-section">
                        <h3 className="report-title">📊 Service Completion Overview</h3>

                        <div className="dash-stats" style={{ maxWidth: 520 }}>
                            <div className="stat-card">
                                <div className="stat-title">Completed Jobs</div>
                                <div className="stat-value">
                                    {data.completionMetrics.completedJobs}
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-title">Avg Completion Time</div>
                                <div className="stat-value">
                                    {data.completionMetrics.avgHours} hrs
                                </div>
                            </div>
                        </div>
                    </section>


                    {/* BOOKING STATUS TABLE */}
                    <section className="report-section">
                        <h3 className="report-title">📋 Booking Status Summary</h3>
                        <div className="report-card">
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th>Status</th>
                                        <th className="num-cell">Count</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.bookingStatus.map((b, i) => (
                                        <tr key={i}>
                                            <td data-label="Status">
                                                {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                                            </td>
                                            <td data-label="Count" className="num-cell">{b.count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* JOB CARD STATUS TABLE */}
                    <section className="report-section">
                        <h3 className="report-title">🛠️ Job Card Status Summary</h3>
                        <div className="report-card">
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th>Status</th>
                                        <th className="num-cell">Count</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.jobCardStatus.map((j, i) => (
                                        <tr key={i}>
                                            <td data-label="Status">
                                                {j.status.replace("_", " ").toLowerCase()
                                                    .replace(/\b\w/g, c => c.toUpperCase())}
                                            </td>
                                            <td data-label="Count" className="num-cell">{j.count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
