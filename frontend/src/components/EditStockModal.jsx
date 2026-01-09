import React, { useState } from "react";
import axios from "axios";
import "../App.css";

const API_BASE = `${process.env.REACT_APP_API_BASE_URL}/api/admin/inventory`;

export default function EditStockModal({ part, onClose, onSaved }) {
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    stock: part.stock,
    price: part.price,
  });

  const submit = async () => {
    try {
      await axios.put(
        `${API_BASE}/${part.id}/stock`,
        {
          stock: Number(form.stock),
          price: Number(form.price),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onSaved();
    } catch (err) {
      alert("Failed to update stock");
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Update Stock</h3>
        </div>

        <form className="register-form-modal">
          {/* READ-ONLY */}
          <label>
            Part Name
            <input value={part.part_name} disabled />
          </label>

          <label>
            Category
            <input value={part.category} disabled />
          </label>

          {/* EDITABLE */}
          <label>
            Stock
            <input
              type="number"
              value={form.stock}
              onChange={(e) =>
                setForm({ ...form, stock: e.target.value })
              }
            />
          </label>

          <label>
            Price
            <input
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: e.target.value })
              }
            />
          </label>

          <button
            type="button"
            className="register-submit"
            onClick={submit}
          >
            Update
          </button>
        </form>
      </div>
    </div>
  );
}
