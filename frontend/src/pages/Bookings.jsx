// src/pages/Bookings.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"; import axios from "axios";
import Sidebar from "../components/sidebar/UserSidebar";
import BookServiceModal from "../components/BookServiceModal";
import BookingDetailsModal from "../components/BookingDetailsModal"; // if you created it earlier
import "../App.css";


const API_BOOKINGS = `${process.env.REACT_APP_API_BASE_URL}/api/bookings`;
const API_USER_JOBCARDS = `${process.env.REACT_APP_API_BASE_URL}/api/user/job-cards`;


export default function BookingsPage() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(
    window.innerWidth > 768
  );
  const [jobCards, setJobCards] = useState([]);
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  /* ---------------- FETCH BOOKINGS ---------------- */
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const q = user?.id ? `?userId=${user.id}` : "";
      const res = await axios.get(`${API_BOOKINGS}${q}`);
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- FETCH USER JOB CARDS ---------------- */
  const fetchUserJobCards = async () => {
    try {
      const res = await axios.get(API_USER_JOBCARDS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobCards(res.data.jobCards || []);
    } catch (err) {
      console.error("Failed to fetch job cards:", err);
      setJobCards([]);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchUserJobCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const statusFromUrl = searchParams.get("status");
    if (statusFromUrl) {
      setFilter(statusFromUrl.toLowerCase());
    }
  }, [searchParams]);


  const onCreated = (newBooking) => {
    setBookings(prev => [newBooking, ...prev]);
  };

  const deleteBookingLocal = (id) => {
    setBookings(prev => prev.filter(b => b.id !== id));
  };

  const filtered = bookings.filter((b) => {
    const completedJob = jobCards.find(
      (j) => j.booking_id === b.id && j.status === "COMPLETED"
    );

    const inProgressJob = jobCards.find(
      (j) => j.booking_id === b.id && j.status === "IN_PROGRESS"
    );

    const finalStatus = completedJob
      ? "completed"
      : inProgressJob
        ? "in_progress"
        : (b.status || "pending").toLowerCase();

    if (filter === "all") return true;

    return finalStatus === filter;
  });


  // 🔵 STEP-3: CREATE ORDER (NO RAZORPAY POPUP YET)
  const handlePayNow = async (booking) => {
    try {
      // 1️⃣ Fetch exact invoice amount
      const amountRes = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/payments/amount/${booking.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const amount = amountRes.data.amount;

      if (!amount || amount <= 0) {
        alert("Invalid invoice amount");
        return;
      }

      // 2️⃣ User confirmation (mock payment)
      const confirmPay = window.confirm(
        `Confirm payment of ₹${amount}?`
      );

      if (!confirmPay) return;

      // 3️⃣ Call mock payment API
      await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/payments/mock-pay`,
        { booking_id: booking.id },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Payment successful (Mock)");

      // 4️⃣ Refresh UI
      window.location.reload();
    } catch (err) {
      console.error("Mock payment failed", err);
      alert("Payment failed");
    }
  };




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

      {/* Main content area */}
      <section className="dash-main" role="main">
        <div className="dash-header" style={{ marginBottom: 12 }}>
          <div>
            <h1>Bookings</h1>
            <p className="muted">View and manage your bookings</p>
          </div>

          <div>
            <button className="btn action-primary" onClick={() => setShowBookModal(true)}>➕ New Booking</button>
          </div>
        </div>

        <div className="booking-tabs">
          {["all", "completed", "approved", "pending", "rejected"].map(t => (
            <button
              key={t}
              className={`booking-tab ${filter === t ? "active" : ""}`}
              onClick={() => setFilter(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="booking-grid">
          {loading && <div>Loading…</div>}
          {!loading && filtered.length === 0 && <div className="card">No bookings found.</div>}

          {filtered.map((b) => {
            /* 🔑 FIND COMPLETED JOB CARD FOR THIS BOOKING */
            const completedJob = jobCards.find(
              (j) => j.booking_id === b.id && j.status === "COMPLETED"
            );

            const inProgressJob = jobCards.find(
              (j) => j.booking_id === b.id && j.status === "IN_PROGRESS"
            );

            const finalStatus = completedJob
              ? "completed"
              : inProgressJob
                ? "in_progress"
                : b.status;

            return (
              <div key={b.id} className="card" style={{ padding: 22, position: "relative" }} >
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: 20 }}>Booking </div>
                  {/* 🔵 TOP RIGHT PAYMENT STATUS */}
                  {completedJob && (
                    b.payment_status === "paid" ? (
                      <span
                        style={{
                          position: "absolute",
                          top: 16,
                          right: 16,
                          padding: "6px 14px",
                          fontSize: 14,
                          backgroundColor: "#16a34a",
                          color: "#fff",
                          borderRadius: 6,
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        ✓ Paid
                      </span>
                    ) : (
                      <button
                        className="btn action-primary"
                        style={{
                          position: "absolute",
                          top: 16,
                          right: 16,
                          padding: "6px 14px",
                          fontSize: 14,
                        }}
                        onClick={() => handlePayNow(b)}
                      >
                        Pay Now
                      </button>
                    )
                  )}

                  <div style={{ color: "#374151", marginTop: 8 }}>
                    <div>Vehicle: {b.vehicle}</div>
                    <div>Date/Time: {b.preferred_date} {b.preferred_time}</div>
                    <div>Service: {b.service_type}</div>
                    <div>Requested by: {b.created_by_name || b.created_by}</div>
                  </div>
                </div>

                {/* STATUS + ACTIONS */}
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                  {completedJob ? (
                    <span className="status-badge status-completed">Completed</span>
                  ) : inProgressJob ? (
                    <span className="status-badge status-in-progress">In Progress</span>
                  ) : b.status === "approved" ? (
                    <span className="status-badge status-approved">Approved</span>
                  ) : b.status === "pending" ? (
                    <span className="status-badge status-pending">Pending</span>
                  ) : (
                    <span className="status-badge status-rejected">{b.status}</span>
                  )}

                  {/* VIEW DETAILS */}
                  <button
                    className="btn action-primary"
                    onClick={() => setSelectedBooking({ ...b, finalStatus })}
                  >
                    View Details
                  </button>

                  {/* VIEW BILL (ONLY AFTER COMPLETION) */}
                  {completedJob && (
                    <>
                      <button
                        className="btn"
                        onClick={() =>
                          navigate(`/user/job-cards/${completedJob.job_card_id}/invoice`)
                        }
                      >
                        View Bill
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {showBookModal && <BookServiceModal onClose={() => setShowBookModal(false)} onCreated={onCreated} />}

      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onDelete={(id) => { deleteBookingLocal(id); }}
        />
      )}
    </div>
  );
}
