import React, { useEffect, useState } from "react";
import axios from "axios";
import ServiceCenterSidebar from "../components/sidebar/ServiceCenterSidebar";
import "../App.css";

const API_BASE = `${process.env.REACT_APP_API_BASE_URL}/api/service-center/inventory`;
const REQUEST_API = `${process.env.REACT_APP_API_BASE_URL}/api/service-center/low-stock-request`;

export default function ServiceCenterInventory() {
    const token = localStorage.getItem("token");

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);

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

    // 🔹 Send low stock request
    const requestRefill = async (part) => {
        try {
            await axios.post(
                REQUEST_API,
                {
                    inventory_id: part.id,
                    part_name: part.part_name,
                    stock: part.stock,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            alert("Low stock request sent to admin");
        } catch (err) {
            console.error(err);
            alert("Failed to send request");
        }
    };

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
                <div className="dash-header">
                    <div>
                        <h1>Inventory</h1>
                        <p className="muted">Available spare parts.</p>
                    </div>
                </div>

                {/* ---- INVENTORY LIST ---- */}
                {loading ? (
                    <p>Loading inventory...</p>
                ) : items.length === 0 ? (
                    <p>No inventory available.</p>
                ) : (
                    <div className="recent-list">
                        {items.map((p) => (
                            <div className="recent-row" key={p.id}>
                                {/* LEFT */}
                                <div>
                                    <div className="recent-title">🔩 {p.part_name}</div>
                                    <div className="recent-sub">Category: {p.category}</div>
                                    <div className="recent-date">
                                        Stock: {p.stock} | Price(all stocks): ₹{p.price}
                                    </div>
                                </div>

                                {/* RIGHT */}
                                <div className="recent-right">
                                    {p.stock < 3 ? (
                                        <button
                                            className="btn danger"
                                            onClick={() => requestRefill(p)}
                                        >
                                            Request Refill
                                        </button>
                                    ) : (
                                        <span className="status-pill green">In Stock</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
