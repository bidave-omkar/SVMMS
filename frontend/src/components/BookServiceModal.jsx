// src/components/BookServiceModal.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import "../App.css";

const API_BOOKINGS = `${process.env.REACT_APP_API_BASE_URL}/api/bookings`;

export default function BookServiceModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    vehicle: "",
    serviceType: "",
    preferredDate: "",
    preferredTime: "",
    notes: ""
  });
  const [errors, setErrors] = useState({});
  const [serverMsg, setServerMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get(`${process.env.REACT_APP_API_BASE_URL}/api/vehicles/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setVehicles(res.data || []);
      })
      .catch(() => {
        setVehicles([]);
      });
  }, []);

  const validate = () => {
    const e = {};
    if (!form.vehicle.trim()) e.vehicle = "Choose a vehicle.";
    if (!form.serviceType.trim()) e.serviceType = "Select service type.";
    if (!form.preferredDate.trim()) e.preferredDate = "Preferred date required.";
    if (!form.preferredTime.trim()) e.preferredTime = "Preferred time required.";
    if (!form.notes.trim()) e.notes = "Please add notes (can be short).";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (ev) => {
    const { name, value } = ev.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
    setServerMsg("");
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const payload = {
        vehicle: form.vehicle,
        service_type: form.serviceType,
        preferred_date: form.preferredDate,
        preferred_time: form.preferredTime,
        notes: form.notes,
        created_by: user?.id || null,
        created_by_name: user?.firstName || user?.email || null
      };
      const res = await axios.post(API_BOOKINGS, payload, { timeout: 10000 });
      setServerMsg(res.data.message || "Booking created");
      setForm({ vehicle: "", serviceType: "", preferredDate: "", preferredTime: "", notes: "" });
      if (onCreated) onCreated(res.data.booking);
      setTimeout(() => onClose(), 700);
    } catch (err) {
      setServerMsg(err.response?.data?.message || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Book a Service</h3>
        </div>

        <form className="register-form-modal" onSubmit={handleSubmit}>
          <label>
            Choose a vehicle
            <select
              name="vehicle"
              value={form.vehicle}
              onChange={handleChange}
            >
              <option value="">Select your vehicle (Vehicles must be added)</option>

              {vehicles.map((v) => (
                <option
                  key={v.id}
                  value={`${v.name} ${v.model} `}
                >
                  {v.name} {v.model} 
                </option>
              ))}
            </select>

            {errors.vehicle && <p className="error-text">{errors.vehicle}</p>}
          </label>

          <label>
            Select service
            <input name="serviceType" value={form.serviceType} onChange={handleChange} placeholder="e.g. Oil change, Brake inspection" />
            {errors.serviceType && <p className="error-text">{errors.serviceType}</p>}
          </label>

          <label>
            Preferred Date
            <input type="date" name="preferredDate" value={form.preferredDate} onChange={handleChange} />
            {errors.preferredDate && <p className="error-text">{errors.preferredDate}</p>}
          </label>

          <label>
            Preferred Time
            <input type="time" name="preferredTime" value={form.preferredTime} onChange={handleChange} />
            {errors.preferredTime && <p className="error-text">{errors.preferredTime}</p>}
          </label>

          <label>
            Additional Notes
            <textarea name="notes" className="full-width-field" value={form.notes} onChange={handleChange} rows="3" placeholder="Any specifics we should know?" />
            {errors.notes && <p className="error-text">{errors.notes}</p>}
          </label>

          <button type="submit" className="register-submit" disabled={loading}>
            {loading ? "Confirming..." : "Confirm Booking"}
          </button>

          {serverMsg && <div className="modal-message">{serverMsg}</div>}
        </form>
      </div>
    </div>
  );
}
