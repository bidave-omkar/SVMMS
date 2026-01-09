// frontend/src/components/sidebar/ServiceCenterSidebar.jsx
import React, { forwardRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../App.css";

const ServiceCenterSidebar = forwardRef(({ onToggle }, ref) => {
  const navigate = useNavigate();
  const location = useLocation();

  const go = (path) => {
    navigate(path);
    onToggle?.(false);
  };

  return (
    <aside ref={ref} className="dash-sidebar">
      <div>
        <div className="sidebar-header">
          <div className="sidebar-logo">SC</div>

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
          <button className={`dash-nav-item ${location.pathname === "/service-center" ? "active" : ""}`} onClick={() => go("/service-center")}>Dashboard</button>
          <button className={`dash-nav-item ${location.pathname.startsWith("/service-center/bookings") ? "active" : ""}`} onClick={() => go("/service-center/bookings")}>Bookings</button>
          <button className={`dash-nav-item ${location.pathname === "/service-center/job-cards" ? "active" : ""}`} onClick={() => go("/service-center/job-cards")}>Job Cards</button>
          <button className={`dash-nav-item ${location.pathname.startsWith("/service-center/inventory") ? "active" : ""}`} onClick={() => go("/service-center/inventory")}>Inventory</button>
        </nav>
      </div>

      <div className="sidebar-bottom">
        <button className="dash-settings-btn">Settings</button>
      </div>
    </aside>
  );
});

export default ServiceCenterSidebar;
