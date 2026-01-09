// frontend/src/components/sidebar/Layout.jsx
import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import "../App.css";

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);
  const location = useLocation();

  /* --------------------------------------------------
     AUTO-CLOSE SIDEBAR ON ROUTE CHANGE (MOBILE)
  -------------------------------------------------- */
  useEffect(() => {
    setSidebarOpen(false);
    document.body.classList.remove("sidebar-open-lock");
  }, [location.pathname]);

  /* --------------------------------------------------
     TAP OUTSIDE TO CLOSE (MOBILE)
  -------------------------------------------------- */
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target) &&
        sidebarOpen
      ) {
        setSidebarOpen(false);
        document.body.classList.remove("sidebar-open-lock");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [sidebarOpen]);

  /* --------------------------------------------------
     BODY SCROLL LOCK WHEN SIDEBAR OPENS
  -------------------------------------------------- */
  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add("sidebar-open-lock");
    } else {
      document.body.classList.remove("sidebar-open-lock");
    }
  }, [sidebarOpen]);

  return (
    <div className={`dashboard-page ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
      {/* Sidebar */}
      <Sidebar ref={sidebarRef} onToggle={setSidebarOpen} />

      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <main className="dash-main">
        {children}
      </main>
    </div>
  );
}
