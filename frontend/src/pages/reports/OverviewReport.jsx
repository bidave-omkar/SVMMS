import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../../components/sidebar/AdminSidebar";
import "../../App.css";

const API = `${process.env.REACT_APP_API_BASE_URL}/api/admin/reports/overview`;

export default function OverviewReport() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .get(API, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setStats(res.data))
      .catch(() => alert("Failed to load overview report"));
  }, [token]);

  if (!stats) return null;

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
          <div>
            <h1>System Overview</h1>
            <p className="muted">High-level system KPIs</p>
          </div>
        </div>

        <div className="dash-stats">
          <KpiCard title="Total Customers" value={stats.totalCustomers} icon="👤" />
          <KpiCard title="Service Centers" value={stats.totalServiceCenters} icon="🏭" />
          <KpiCard title="Vehicles Registered" value={stats.totalVehicles} icon="🚗" />
          <KpiCard title="Service Bookings" value={stats.totalBookings} icon="📅" />
          <KpiCard title="Completed Job Cards" value={stats.completedJobCards} icon="✅" />
          <KpiCard title="Invoices Generated" value={stats.totalInvoices} icon="🧾" />
        </div>
      </main>
    </div>
  );
}

function KpiCard({ title, value, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}
