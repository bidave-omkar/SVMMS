import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../../components/sidebar/AdminSidebar";
import "../../App.css";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Tooltip,
    Legend,
    Filler
} from "chart.js";

import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Tooltip,
    Legend,
    Filler
);


const API = `${process.env.REACT_APP_API_BASE_URL}/api/admin/reports/service-activity`;

export default function ServiceActivityReport() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [data, setData] = useState(null);
    const token = localStorage.getItem("token");

    useEffect(() => {
        axios
            .get(API, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => setData(res.data))
            .catch(() => alert("Failed to load service activity report"));
    }, [token]);

    if (!data) return null;

    /* ---------- BAR CHART: MOST SERVICED VEHICLES ---------- */
    const vehicleBarData = {
        labels: data.mostServicedVehicles.map(v => v.vehicle_name),
        datasets: [
            {
                label: "Services",
                data: data.mostServicedVehicles.map(v => v.service_count),
                backgroundColor: "#2563eb"
            }
        ]
    };

    /* ---------- LINE CHART: MONTHLY SERVICE TREND ---------- */
    const monthlyLineData = {
        labels: data.serviceTrend.map(t =>
            new Date(t.month).toLocaleString("default", {
                month: "short",
                year: "numeric"
            })
        ),
        datasets: [
            {
                label: "Services",
                data: data.serviceTrend.map(t => t.count),
                borderColor: "#16a34a",
                backgroundColor: "rgba(22,163,74,0.15)",
                tension: 0.4,
                fill: true
            }
        ]
    };


    return (
        <div className={`dashboard-page service-activity-page ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
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
                            <h1>Service Activity</h1>
                            <p className="muted">Vehicle usage & service trends</p>
                        </div>
                    </div>

                    <section className="report-section">
                        <h3 className="report-title">
                            📊 Vehicle Service Distribution <span className="report-sub">(Top 10)</span>
                        </h3>

                        <div
                            className="report-card"
                            style={{
                                padding: 16,
                                height: 260   // 🔥 controls height (mobile-safe)
                            }}
                        >
                            <Bar
                                data={vehicleBarData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false, // 🔥 KEY FIX
                                    plugins: {
                                        legend: { display: false }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            ticks: {
                                                stepSize: 1,   // 🔥 no decimals
                                                precision: 0  // 🔥 integer only
                                            }
                                        },
                                        x: {
                                            ticks: {
                                                autoSkip: false,
                                                maxRotation: 0,
                                                minRotation: 0
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </section>


                    {/* MOST SERVICED VEHICLES */}
                    <section className="report-section">
                        <h3 className="report-title">
                            🚗 Most Serviced Vehicles <span className="report-sub">(Top 10)</span>
                        </h3>

                        <div className="report-card">
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: "70%" }}>Vehicle</th>
                                        <th style={{ width: "30%" }}>Services</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.mostServicedVehicles.map((v, i) => (
                                        <tr key={i}>
                                            <td data-label="Vehicle">{v.vehicle_name}</td>
                                            <td data-label="Services" className="num-cell">{v.service_count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>


                    {/* SERVICE TYPES */}
                    <section className="report-section">
                        <h3 className="report-title">
                            🛠️ Most Common Service Types <span className="report-sub">(Top 10)</span>
                        </h3>

                        <div className="report-card">
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: "70%" }}>Service Type</th>
                                        <th style={{ width: "30%" }}>Count</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.serviceTypes.slice(0, 10).map((s, i) => (
                                        <tr key={i}>
                                            <td data-label="Service Type">{s.service_type}</td>
                                            <td data-label="Count" className="num-cell">{s.count}</td>

                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="report-section">
                        <h3 className="report-title">
                            📈 Service Trend Over Time <span className="report-sub">(Monthly)</span>
                        </h3>

                        <div
                            className="report-card"
                            style={{
                                padding: 16,
                                height: 240
                            }}
                        >
                            <Line
                                data={monthlyLineData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false, // 🔥 KEY FIX
                                    plugins: {
                                        legend: { display: false }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            ticks: {
                                                stepSize: 1,
                                                precision: 0
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </section>


                    {/* SERVICE TREND */}
                    <section className="report-section">
                        <h3 className="report-title">
                            📈 Service Frequency (Monthly) <span className="report-sub">(Top 10)</span>
                        </h3>

                        <div className="report-card">
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: "70%" }}>Month</th>
                                        <th style={{ width: "30%" }}>Services</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.serviceTrend.slice(0, 10).map((t, i) => (
                                        <tr key={i}>
                                            <td data-label="Month">
                                                {new Date(t.month).toLocaleString("default", {
                                                    month: "long",
                                                    year: "numeric"
                                                })}
                                            </td>
                                            <td data-label="Services" className="num-cell">{t.count}</td>
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
