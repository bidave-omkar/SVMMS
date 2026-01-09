import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/sidebar/UserSidebar";
import "../App.css";
import AddVehicleModal from "../components/AddVehicleModal";

const API_BASE = `${process.env.REACT_APP_API_BASE_URL}/api/vehicles`;

export default function MyVehicle() {
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editVehicle, setEditVehicle] = useState(null);
  const [vehicleUsage, setVehicleUsage] = useState({});


  const token = localStorage.getItem("token");

  // 🔍 check if vehicle is used in active job
  const checkVehicleUsage = async (vehicleId) => {
    try {
      const res = await axios.get(
        `${API_BASE}/${vehicleId}/in-use`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data.inUse;
    } catch (err) {
      return false;
    }
  };

  // fetch vehicles for logged-in user
  const fetchVehicles = async () => {
    try {
      const res = await axios.get(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ✅ normalize response safely
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.vehicles || res.data?.rows || [];

      setVehicles(data);
      const usageMap = {};
      for (const v of data) {
        usageMap[v.id] = await checkVehicleUsage(v.id);
      }
      setVehicleUsage(usageMap);
    } catch (err) {
      console.error("Fetch vehicles failed", err);
      setVehicles([]); // prevent crash
    } finally {
      setLoading(false);
    }
  };

  // delete vehicle
  const deleteVehicle = async (id) => {
    if (!window.confirm("Delete this vehicle permanently?")) return;

    try {
      await axios.delete(`${API_BASE}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setVehicles((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete vehicle");
    }
  };

  useEffect(() => {
    fetchVehicles();
    // eslint-disable-next-line
  }, []);

  return (
    <div className={`dashboard-page ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
      {/* fixed hamburger for mobile */}
      <button
        className={`hamburger-btn fixed-hamburger ${sidebarOpen ? "hidden" : ""}`}
        aria-label="Open menu"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="hamburger-line" />
        <span className="hamburger-line" />
        <span className="hamburger-line" />
      </button>

      {/* Sidebar (fixed) */}
      <Sidebar onToggle={setSidebarOpen} />

      <main className="dash-main">
        <div className="dash-header" style={{ marginBottom: 12 }}>
          <div>
            <h1>My Vehicles</h1>
            <p className="muted">Vehicles registered under your account</p>
          </div>

          <div>
            <button className="btn action-primary" onClick={() => setShowAddVehicle(true)}>➕ Add Vehicle</button>
          </div>
        </div>

        {loading ? (
          <p>Loading vehicles...</p>
        ) : vehicles.length === 0 ? (
          <p>No vehicles added yet.</p>
        ) : (
          <div className="recent-list">
            {vehicles.map((v) => (
              <div className="recent-row" key={v.id}>
                <div>
                  <div className="recent-title">
                    {v.name} {v.model}
                  </div>
                  <div className="recent-sub">
                    Plate: {v.license_plate || "N/A"}
                  </div>
                  <div className="recent-date">
                    Year: {v.year || "—"} | VIN: {v.vin || "—"}
                  </div>
                </div>

                <div className="recent-right" style={{ display: "flex", gap: 8 }}>
                  {/* EDIT (GREY like View Bill) */}
                  {vehicleUsage[v.id] ? (
                    <span
                      style={{
                        fontSize: 13,
                        color: "#6b7280",
                        fontWeight: 500
                      }}
                    >
                      In use (active booking)
                    </span>
                  ) : (
                    <button
                      className="btn"
                      style={{ background: "#e5e7eb", color: "#111827" }}
                      onClick={() => setEditVehicle(v)}
                    >
                      Edit
                    </button>
                  )}

                  {/* DELETE */}
                  {vehicleUsage[v.id] ? (
                    <span
                      style={{
                        fontSize: 13,
                        color: "#6b7280",
                        fontWeight: 500
                      }}
                    >
                      In use (cannot delete)
                    </span>
                  ) : (
                    <button
                      className="btn"
                      style={{ background: "#ef4444", color: "#fff" }}
                      onClick={() => deleteVehicle(v.id)}
                    >
                      Delete
                    </button>
                  )}

                </div>

              </div>
            ))}
          </div>
        )}
      </main>
      {(showAddVehicle || editVehicle) && (
        <AddVehicleModal
          open={true}
          vehicle={editVehicle}
          onClose={() => {
            setShowAddVehicle(false);
            setEditVehicle(null);
          }}
          onSaved={() => {
            fetchVehicles();
            setEditVehicle(null);
          }}
        />
      )}
    </div>
  );
}
