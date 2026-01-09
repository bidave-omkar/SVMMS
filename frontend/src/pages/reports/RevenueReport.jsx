import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../../components/sidebar/AdminSidebar";
import "../../App.css";

import {
    Chart as ChartJS,
    ArcElement,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend
} from "chart.js";

import { Pie, Line } from "react-chartjs-2";

ChartJS.register(
    ArcElement,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend
);

const API = `${process.env.REACT_APP_API_BASE_URL}/api/admin/reports/revenue`;

export default function RevenueReport() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [data, setData] = useState(null);
    const token = localStorage.getItem("token");

    useEffect(() => {
        axios
            .get(API, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => setData(res.data))
            .catch(() => alert("Failed to load revenue report"));
    }, [token]);

    if (!data) return null;

    /* ---------- PIE: LABOR VS PARTS ---------- */
    const pieData = {
        labels: ["Labor", "Spare Parts"],
        datasets: [{
            data: [
                data.summary.labor_revenue,
                data.summary.parts_revenue
            ],
            backgroundColor: ["#2563eb", "#16a34a"]
        }]
    };

    /* ---------- LINE: MONTHLY REVENUE ---------- */
    const lineData = {
        labels: data.monthlyRevenue.map(m =>
            new Date(m.month).toLocaleString("default", {
                month: "short",
                year: "numeric"
            })
        ),
        datasets: [{
            label: "Revenue",
            data: data.monthlyRevenue.map(m => m.revenue),
            borderColor: "#2563eb",
            backgroundColor: "rgba(37,99,235,0.15)",
            fill: true,
            tension: 0.4
        }]
    };

    return (
        <div className={`dashboard-page revenue-report-page ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
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
                            <h1>Revenue & Billing</h1>
                            <p className="muted">Earnings, invoices & billing insights</p>
                        </div>
                    </div>

                    {/* PIE CHART */}
                    <section className="report-section">
                        <h3 className="report-title">💰 Labor vs Spare Parts</h3>
                        <div className="report-card" style={{ padding: 16, height: 260 }}>
                            <Pie
                                data={pieData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false
                                }}
                            />
                        </div>
                    </section>

                    {/* LINE CHART */}
                    <section className="report-section">
                        <h3 className="report-title">📈 Monthly Revenue</h3>
                        <div className="report-card" style={{ padding: 16, height: 260 }}>
                            <Line
                                data={lineData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: true } }
                                }}
                            />
                        </div>
                    </section>

                    {/* INVOICE TABLE */}
                    <section className="report-section">
                        <h3 className="report-title">🧾 Invoice Details</h3>

                        <div className="report-card">
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th>Invoice ID</th>
                                        <th className="num-cell">Amount</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.invoices.map(inv => (
                                        <tr key={inv.invoice_id}>
                                            <td data-label="Invoice ID">#{inv.invoice_id}</td>
                                            <td data-label="Amount" className="num-cell">₹{inv.total_amount}</td>
                                            <td data-label="Date">
                                                {new Date(inv.created_at).toLocaleDateString()}
                                            </td>
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
