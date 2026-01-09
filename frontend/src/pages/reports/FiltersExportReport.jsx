import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../../components/sidebar/AdminSidebar";
import "../../App.css";

const DATA_API = `${process.env.REACT_APP_API_BASE_URL}/api/admin/reports/filtered`;
const EXPORT_API = `${process.env.REACT_APP_API_BASE_URL}/api/admin/reports/export`;

export default function FiltersExportReport() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [data, setData] = useState(null);

    const [filters, setFilters] = useState({
        from: "",
        to: "",
        service_type: "",
        vehicle_model: "",
        service_center_id: "",
        job_status: ""
    });

    const token = localStorage.getItem("token");

    const loadData = () => {
        axios
            .get(DATA_API, {
                params: filters,
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => setData(res.data))
            .catch(() => alert("Failed to load filtered report"));
    };

    const exportCSV = async () => {
        try {
            const res = await axios.get(EXPORT_API, {
                params: filters,
                headers: {
                    Authorization: `Bearer ${token}`
                },
                responseType: "blob"
            });

            const blob = new Blob([res.data], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = "admin_report.csv";
            document.body.appendChild(a);
            a.click();
            a.remove();

            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            alert("Failed to export CSV");
        }
    };


    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className={`dashboard-page filters-export-page ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
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
                            <h1>Filters & Export</h1>
                            <p className="muted">
                                Apply filters across reports and export results
                            </p>
                        </div>
                    </div>

                    {/* FILTER BAR */}
                    <section className="report-section">
                        <div className="report-card" style={{ padding: 16 }}>
                            <div className="report-filters">

                                <input
                                    type="date"
                                    value={filters.from}
                                    onChange={e => setFilters({ ...filters, from: e.target.value })}
                                />

                                <input
                                    type="date"
                                    value={filters.to}
                                    onChange={e => setFilters({ ...filters, to: e.target.value })}
                                />

                                <input
                                    placeholder="Service Type"
                                    value={filters.service_type}
                                    onChange={e => setFilters({ ...filters, service_type: e.target.value })}
                                />

                                <input
                                    placeholder="Vehicle Model"
                                    value={filters.vehicle_model}
                                    onChange={e => setFilters({ ...filters, vehicle_model: e.target.value })}
                                />

                                <select
                                    value={filters.job_status}
                                    onChange={e => setFilters({ ...filters, job_status: e.target.value })}
                                >
                                    <option value="">All Job Status</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="COMPLETED">Completed</option>
                                </select>

                                <button className="btn btn-primary" onClick={loadData}>
                                    Apply
                                </button>

                                <button className="btn btn-secondary" onClick={exportCSV}>
                                    Export CSV
                                </button>

                            </div>
                        </div>
                    </section>

                    {/* SUMMARY */}
                    {data && (
                        <>
                            <section className="report-section">
                                <h3 className="report-title">📊 Summary</h3>
                                <div className="dash-stats" style={{ maxWidth: 720 }}>
                                    <div className="stat-card">
                                        <div className="stat-title">Total Jobs</div>
                                        <div className="stat-value">{data.summary.total_jobs}</div>
                                    </div>

                                    <div className="stat-card">
                                        <div className="stat-title">Completed Jobs</div>
                                        <div className="stat-value">{data.summary.completed_jobs}</div>
                                    </div>

                                    <div className="stat-card">
                                        <div className="stat-title">Total Revenue</div>
                                        <div className="stat-value">
                                            ₹{data.summary.total_revenue || 0}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* TABLE */}
                            <section className="report-section">
                                <h3 className="report-title">📄 Filtered Results</h3>

                                <div className="report-card">
                                    <table className="report-table">
                                        <thead>
                                            <tr>
                                                <th>Job Card</th>
                                                <th>Service Type</th>
                                                <th>Vehicle Model</th>
                                                <th>Status</th>
                                                <th className="num-cell">Amount</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.table.map((row, index) => (
                                                <tr key={`${row.job_card_id}-${row.created_at}-${index}`}>
                                                    <td data-label="Job Card">#{row.job_card_id}</td>
                                                    <td data-label="Service Type">{row.service_type}</td>
                                                    <td data-label="Vehicle Model">{row.vehicle_model || "-"}</td>
                                                    <td data-label="Status">{row.status}</td>
                                                    <td data-label="Amount" className="num-cell">
                                                        ₹{row.total_amount || 0}
                                                    </td>
                                                    <td data-label="Date">
                                                        {new Date(row.created_at).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </>
                    )}

                </div>
            </main>
        </div>
    );
}