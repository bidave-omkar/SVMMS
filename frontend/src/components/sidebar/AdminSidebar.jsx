// frontend/src/components/sidebar/AdminSidebar.jsx
import React, { forwardRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../App.css";

const AdminSidebar = forwardRef(({ onToggle }, ref) => {
  const navigate = useNavigate();
  const location = useLocation();

  const go = (path) => {
    navigate(path);
    onToggle?.(false); // close sidebar on mobile
  };

  return (
    <aside ref={ref} className="dash-sidebar">
      <div>
        <div className="sidebar-header">
          <div className="sidebar-logo">AD</div>

          <button
            className="hamburger-btn inside-sidebar"
            onClick={(e) => {
              e.stopPropagation();
              onToggle?.((s) => !s);
            }}
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
        </div>

        <nav className="dash-nav">
          <button className={`dash-nav-item ${location.pathname.startsWith("/admin-dashboard") ? "active" : ""}`} onClick={() => go("/admin-dashboard")}>Dashboard</button>
          <button className={`dash-nav-item ${location.pathname.startsWith("/admin/reports") ? "active" : ""}`} onClick={() => go("/admin/reports")}>Reports</button>
          <button className={`dash-nav-item ${location.pathname.startsWith("/admin/inventory") ? "active" : ""}`} onClick={() => go("/admin/inventory")}>Inventory</button>
        </nav>
      </div>

      <div className="sidebar-bottom">
        <button className="dash-settings-btn" onClick={() => go("/admin/settings")}>
          Settings
        </button>
      </div>
    </aside>
  );
});

export default AdminSidebar;
