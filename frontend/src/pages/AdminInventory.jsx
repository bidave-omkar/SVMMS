import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import AdminSidebar from "../components/sidebar/AdminSidebar";
import AddPartModal from "../components/AddPartModal";
import "../App.css";
import EditStockModal from "../components/EditStockModal";
import { useLocation } from "react-router-dom";

const API_BASE = `${process.env.REACT_APP_API_BASE_URL}/api/admin/inventory`;

export default function AdminInventory() {
  const token = localStorage.getItem("token");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editPart, setEditPart] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);


  const lowStockRef = useRef(null);
  const location = useLocation();

  // 🔹 Load inventory
  const loadInventory = async () => {
    try {
      const res = await axios.get(API_BASE, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(res.data.items || []);
    } catch (err) {
      console.error("Failed to load inventory", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
    // eslint-disable-next-line
  }, []);

  // 🔹 Auto scroll when coming from dashboard
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const focus = params.get("focus");

    if (focus === "low-stock") {
      setTimeout(() => {
        lowStockRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [location.search, items.length]);

  // 🔹 Low stock items
  const lowStockItems = items.filter(p => p.stock < 3);

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
            <h1>Inventory & Spare Parts Management</h1>
            <p className="muted">Manage spare parts and stock levels</p>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            {lowStockItems.length > 0 && (
              <button
                className="btn"
                style={{ background: "#fee2e2", color: "#991b1b" }}
                onClick={() =>
                  lowStockRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }
              >
                🚨 Low Stock ({lowStockItems.length})
              </button>
            )}

            <button
              className="btn action-primary"
              onClick={() => setShowAdd(true)}
            >
              ➕ Add Part
            </button>
          </div>
        </div>

        {/* ---- INVENTORY LIST ---- */}
        {loading ? (
          <p>Loading inventory...</p>
        ) : items.length === 0 ? (
          <p>No parts added yet.</p>
        ) : (
          <div className="recent-list">
            {items.map(p => (
              <div className="recent-row" key={p.id}>
                <div>
                  <div className="recent-title">🔩 {p.part_name}</div>
                  <div className="recent-sub">Category: {p.category}</div>
                  <div className="recent-date">
                    Stock: {p.stock} | Price: ₹{p.price}
                  </div>
                </div>

                <div className="recent-right">
                  <span
                    className={`status-badge ${p.stock < 3 ? "red" : "green"
                      }`}
                  >
                    {p.stock < 3 ? "Low Stock" : "In Stock"}
                  </span>

                  <button
                    className="btn"
                    style={{ marginTop: 8 }}
                    onClick={() => setEditPart(p)}
                  >
                    Update Stock
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ---- LOW STOCK ALERT ---- */}
        <div ref={lowStockRef} style={{ marginTop: 40 }}>
          <h3>🚨 Low Stock Alert</h3>

          {lowStockItems.length === 0 ? (
            <p className="muted">All parts are sufficiently stocked 🎉</p>
          ) : (
            <div className="recent-list">
              {lowStockItems.map(p => (
                <div className="recent-row" key={p.id}>
                  <div>
                    <div className="recent-title">⚠️ {p.part_name}</div>
                    <div className="recent-date">
                      Stock: {p.stock} | Reorder immediately
                    </div>
                  </div>
                  <span className="status-badge red">Low Stock</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showAdd && (
        <AddPartModal
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            loadInventory();
          }}
        />
      )}

      {editPart && (
        <EditStockModal
          part={editPart}
          onClose={() => setEditPart(null)}
          onSaved={() => {
            setEditPart(null);
            loadInventory();
          }}
        />
      )}
    </div>
  );
}
