import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../../components/sidebar/AdminSidebar";
import "../../App.css";

const API = `${process.env.REACT_APP_API_BASE_URL}/api/admin/reports/inventory`;

export default function InventoryReports() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [data, setData] = useState([]);
    const [range, setRange] = useState("all");
    const token = localStorage.getItem("token");

    useEffect(() => {
        axios
            .get(`${API}?range=${range}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => setData(res.data))
            .catch(() => alert("Failed to load inventory report"));
    }, [range, token]);

    return (
        <div className={`dashboard-page inventory-report-page ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
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
                    <div className="dash-header">
                        <div>
                            <h1>Spare Parts Usage & Inventory</h1>
                            <p className="muted">Usage, stock levels & reorder alerts</p>
                        </div>

                        {/* Range Filter */}
                        <select
                            value={range}
                            onChange={(e) => setRange(e.target.value)}
                            style={{ padding: "6px 10px" }}
                        >
                            <option value="all">All Time</option>
                            <option value="week">Last 7 Days</option>
                            <option value="month">Last 30 Days</option>
                            <option value="older">Older</option>
                        </select>
                    </div>

                    <section className="report-section">
                        <h3 className="report-title">
                            📦 Spare Parts Consumption <span className="report-sub">(Top 10)</span>
                        </h3>

                        <div className="report-card">
                            <div className="table-wrapper">
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th>Part Name</th>
                                            <th className="num-cell">Used</th>
                                            <th className="num-cell">Stock</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {data.map((p) => (
                                            <tr key={p.id}>
                                                <td data-label="Part Name">{p.part_name}</td>
                                                <td data-label="Used" className="num-cell">{p.used_quantity}</td>
                                                <td data-label="Stock" className="num-cell">{p.remaining_stock}</td>
                                                <td data-label="Status">
                                                    <span
                                                        className={`status-pill ${p.reorder_status === "LOW" ? "low" : "ok"}`}
                                                    >
                                                        {p.reorder_status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}

                                        {data.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="empty-cell">
                                                    No inventory usage found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}