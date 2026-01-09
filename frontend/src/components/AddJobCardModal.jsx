import React, { useEffect, useState } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_API_BASE_URL}/api`;

export default function AddJobCardModal({ onClose, onSaved }) {
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    booking_id: "",
    mechanic_id: "",
    issue: "",
  });

  const [selectedParts, setSelectedParts] = useState([]);


  const [bookings, setBookings] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);

  /* Load dropdown data */
  useEffect(() => {
    Promise.all([
      axios.get(`${API}/bookings/approved`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get(`${API}/mechanics/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get(`${API}/service-center/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ])
      .then(([b, m, i]) => {
        setBookings(b.data.bookings || []);
        setMechanics(m.data.mechanics || []);
        setInventory(i.data.items || []);
      })
      .catch(() => alert("Failed to load job card data"));
  }, [token]);

  const addPart = () => {
    setSelectedParts([...selectedParts, { inventory_id: "", quantity: 1 }]);
  };

  const updatePart = (index, field, value) => {
    const updated = [...selectedParts];
    updated[index][field] = value;
    setSelectedParts(updated);
  };

  const removePart = (index) => {
    const updated = selectedParts.filter((_, i) => i !== index);
    setSelectedParts(updated);
  };

  const submit = async () => {
    if (
      !form.booking_id ||
      !form.mechanic_id ||
      !form.issue.trim()
    ) {
      alert("Booking, mechanic and issue are mandatory");
      return;
    }

    if (
      selectedParts.length > 0 &&
      selectedParts.some(p => !p.inventory_id || p.quantity <= 0)
    ) {
      alert("Please select valid inventory and quantity");
      return;
    }


    setLoading(true);
    try {
      await axios.post(
        `${API}/service-center/job-cards`,
        {
          booking_id: Number(form.booking_id),
          mechanic_id: Number(form.mechanic_id),
          issue: form.issue,
          parts: selectedParts.length > 0
            ? selectedParts.map(p => ({
              inventory_id: Number(p.inventory_id),
              quantity: Number(p.quantity),
            }))
            : [],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );


      onSaved();
    } catch (err) {
      console.error(err);
      if (err.response?.status === 409) {
        alert("Job card already exists for this booking");
      } else {
        alert("Failed to create job card");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create Job Card</h3>
        </div>

        <form className="register-form-modal">
          <label>
            Approved Booking
            <select
              value={form.booking_id}
              onChange={(e) =>
                setForm({ ...form, booking_id: e.target.value })
              }
            >
              <option value="">Select booking</option>
              {bookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.vehicle} | {b.service_type} | {b.customer_name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Mechanic
            <select
              value={form.mechanic_id}
              onChange={(e) =>
                setForm({ ...form, mechanic_id: e.target.value })
              }
            >
              <option value="">Select mechanic</option>
              {mechanics.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          <label>Inventory Parts</label>

          {selectedParts.map((part, index) => (
            <div key={index} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <select
                value={part.inventory_id}
                onChange={(e) =>
                  updatePart(index, "inventory_id", e.target.value)
                }
              >
                <option value="">Select part</option>
                {inventory.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.part_name} (Stock: {i.stock})
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                value={part.quantity}
                onChange={(e) =>
                  updatePart(index, "quantity", Number(e.target.value))
                }
                placeholder="Qty"
              />

              <button type="button" onClick={() => removePart(index)}>
                ❌
              </button>
            </div>
          ))}

          <button type="button" className="btn" onClick={addPart}>
            ➕ Add Another Part
          </button>


          <label>
            Problem Description/Note
            <textarea
              value={form.issue}
              onChange={(e) => setForm({ ...form, issue: e.target.value })}
            />
          </label>

          <button
            type="button"
            className="register-submit"
            disabled={loading}
            onClick={submit}
          >
            {loading ? "Saving..." : "Save Job Card"}
          </button>
        </form>
      </div>
    </div>
  );
}
