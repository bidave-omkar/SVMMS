import React, { useState } from "react";
import axios from "axios";

const API_BASE = `${process.env.REACT_APP_API_BASE_URL}/api/mechanics`;

export default function AddMechanicModal({ onClose, onSaved }) {
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    age: "",
    experience: "",
    skills: "",
  });

  const submit = async () => {
    // ✅ mandatory field validation
    if (
      !form.name ||
      !form.phone ||
      !form.age ||
      !form.experience ||
      !form.skills
    ) {
      alert("All fields are required");
      return;
    }

    await axios.post(API_BASE, form, {
      headers: { Authorization: `Bearer ${token}` },
    });
    onSaved();
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Mechanic</h3>
        </div>

        <form className="register-form-modal">
          {["name", "phone", "age", "experience", "skills"].map(f => (
            <label key={f}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <input
                name={f}
                value={form[f]}
                required               /* ✅ mandatory */
                onChange={e =>
                  setForm({ ...form, [f]: e.target.value })
                }
              />
            </label>
          ))}

          <button
            type="button"
            className="register-submit"
            onClick={submit}
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
}
