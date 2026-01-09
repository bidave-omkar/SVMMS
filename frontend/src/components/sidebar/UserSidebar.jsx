// src/components/UserSidebar.jsx
import React, { forwardRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../App.css";

const Sidebar = forwardRef(({ onToggle }, ref) => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname || "/dashboard";

  const go = (p) => {
    navigate(p);
    if (typeof onToggle === "function") onToggle(false); // auto-close on mobile
  };

  return (
    <aside ref={ref} className="dash-sidebar">
      <div>
        <div className="sidebar-header">
          <div className="sidebar-logo">SV</div>

          {/* Hamburger */}
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
          <button className={`dash-nav-item ${path === "/dashboard" ? "active" : ""}`} onClick={() => go("/dashboard")}>Dashboard</button>
          <button className={`dash-nav-item ${path === "/bookings" ? "active" : ""}`} onClick={() => go("/bookings")}>Bookings</button>
          <button className={`dash-nav-item ${path === "/vehicles" ? "active" : ""}`} onClick={() => go("/vehicles")}>My Vehicle</button>
        </nav>
      </div>

      <div className="sidebar-bottom">
        <button className="dash-settings-btn" onClick={() => go("/settings")}>
          Settings
        </button>
      </div>
    </aside>
  );
});

export default Sidebar;
