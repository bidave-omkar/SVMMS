import React from "react";
import axios from "axios";
import "../App.css";

const API_BOOKINGS = `${process.env.REACT_APP_API_BASE_URL}/api/bookings`;

export default function BookingDetailsModal({ booking, onClose, onDelete }) {
  if (!booking) return null;

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this booking permanently?"))
      return;

    try {
      await axios.delete(`${API_BOOKINGS}/${booking.id}`);
      onDelete(booking.id);
      onClose();
    } catch (err) {
      alert("Failed to delete booking.");
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <h3>Booking Details</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="booking-details">
          <p><strong>Booking ID:</strong> #{booking.id}</p>
          <p><strong>Vehicle:</strong> {booking.vehicle}</p>
          <p><strong>Service:</strong> {booking.service_type}</p>
          <p><strong>Date:</strong> {booking.preferred_date}</p>
          <p><strong>Time:</strong> {booking.preferred_time}</p>
          <p><strong>Notes:</strong> {booking.notes}</p>
          <p><strong>Status:</strong> {booking.finalStatus || booking.status}</p>
          <p><strong>Requested By:</strong> {booking.created_by_name}</p>
        </div>

        <button className="btn" style={{ background: "#ef4444", color: "#fff" }} onClick={handleDelete}>
          Delete Booking
        </button>

      </div>
    </div>
  );
}
