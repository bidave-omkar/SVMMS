import React, { useEffect, useState, useCallback } from "react"; // Added useCallback
import { useNavigate } from "react-router-dom"; // Added useNavigate
import axios from "axios";
import ServiceCenterSidebar from "../components/sidebar/ServiceCenterSidebar";
import "../App.css";
import AddMechanicModal from "../components/AddMechanicModal";

const API_BASE = `${process.env.REACT_APP_API_BASE_URL}/api/mechanics`;

export default function Mechanics() {
  const navigate = useNavigate(); // Initialize navigate
  const token = localStorage.getItem("token");
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAddMechanic, setShowAddMechanic] = useState(false);

  // Wrapped in useCallback to prevent infinite re-renders
  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMechanics(res.data.mechanics || []);
    } catch (err) {
      console.error("Failed to fetch mechanics", err);
    } finally {
      setLoading(false);
    }
  }, [token]); // token is a dependency here

  const del = async (id) => {
    if (!window.confirm("Delete this Mechanic permanently?")) return;

    try {
      await axios.delete(`${API_BASE}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMechanics(m => m.filter(x => x.id !== id));
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete mechanic");
    }
  };

  useEffect(() => {
    load();
  }, [load]); // 'load' is now a stable dependency

  return (
    <div className={`dashboard-page ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
      <button
        className={`hamburger-btn fixed-hamburger ${sidebarOpen ? "hidden" : ""}`}
        aria-label="Open menu"
        onClick={(e) => {
          e.stopPropagation();
          setSidebarOpen(true);
        }}
      >
        <span className="hamburger-line" />
        <span className="hamburger-line" />
        <span className="hamburger-line" />
      </button>

      <ServiceCenterSidebar onToggle={setSidebarOpen} />

      <main className="dash-main">
        <div className="dash-header" style={{ marginBottom: 12 }}>
          <div>
            <h1>Mechanics</h1>
            <p className="muted">Mechanics registered under your account</p>
          </div>

          <div><button className="btn action-primary" onClick={() => setShowAddMechanic(true)}>
            ➕ Add Mechanic
          </button></div>
        </div>
        {loading ? (
          <p>Loading mechanics...</p>
        ) : mechanics.length === 0 ? (
          <p>No mechanics added yet.</p>
        ) : (
          <div className="recent-list">
            {mechanics.map(m => (
              <div className="recent-row" key={m.id}>
                <div>
                  <div className="recent-title">{m.name}</div>
                  <div className="recent-sub">📞 {m.phone}</div>
                  <div className="recent-date">
                    Age: {m.age} | Exp: {m.experience} yrs
                  </div>
                  <div className="recent-date">Skills: {m.skills}</div>
                </div>
                <button
                  className="btn"
                  style={{ background: "#ef4444", color: "#fff" }}
                  onClick={() => del(m.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {showAddMechanic && (
        <AddMechanicModal
          onClose={() => setShowAddMechanic(false)}
          onSaved={() => {
            setShowAddMechanic(false);
            navigate("/service-center/mechanics");
            load();
          }}
        />
      )}
    </div>
  );
}