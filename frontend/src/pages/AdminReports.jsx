// frontend/src/pages/AdminReports.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../components/sidebar/AdminSidebar";
import "../App.css";

export default function AdminReports() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
 

  return (
    <div
      className={`dashboard-page ${
        sidebarOpen ? "sidebar-open" : "sidebar-collapsed"
      }`}
    >
      {/* Fixed hamburger when sidebar closed */}
      <button
        className={`hamburger-btn fixed-hamburger ${
          sidebarOpen ? "hidden" : ""
        }`}
        onClick={() => setSidebarOpen(true)}
      >
        <span className="hamburger-line" />
        <span className="hamburger-line" />
        <span className="hamburger-line" />
      </button>

      {/* Sidebar (MANDATORY) */}
      <AdminSidebar onToggle={setSidebarOpen} />

      {/* Main */}
      <main className="dash-main">
        {/* Header */}
        <div className="dash-header">
          <div style={{ maxWidth: "calc(100% - 220px)" }}>
            <h1>Reports</h1>
            <p className="muted">System-wide analytics & detailed insights</p>
          </div>
        </div>

        {/* 7 REPORT CARDS */}
        <div className="dash-stats">
          <ReportCard
            icon="📊"
            title="System Overview"
            onClick={() => navigate("/admin/reports/overview")}
          />

          <ReportCard
            icon="🚗"
            title="Service Activity"
            onClick={() => navigate("/admin/reports/service-activity")}
          />

          <ReportCard
            icon="📦"
            title="Inventory & Spare Parts"
            onClick={() => navigate("/admin/reports/inventory")}
          />

          <ReportCard
            icon="💰"
            title="Revenue & Billing"
            onClick={() => navigate("/admin/reports/revenue")}
          />

          <ReportCard
            icon="📋"
            title="Booking & Job Status"
            onClick={() => navigate("/admin/reports/status")}
          />

          <ReportCard
            icon="📤"
            title="Filters & Export"
            onClick={() => navigate("/admin/reports/filters-export")}
          />
        </div>
      </main>
    </div>
  );
}

/* ---------- Small Card Component ---------- */
function ReportCard({ icon, title, onClick }) {
  return (
    <div
      className="stat-card clickable"
      style={{ cursor: "pointer" }}
      onClick={onClick}
    >
      <div className="stat-icon">{icon}</div>
      <div className="stat-title">{title}</div>
      <div className="muted" style={{ fontSize: 13 }}>
        View details →
      </div>
    </div>
  );
}
