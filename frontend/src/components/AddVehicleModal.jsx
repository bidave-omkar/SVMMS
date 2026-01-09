// src/components/AddVehicleModal.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

export default function AddVehicleModal({ open, onClose, onSaved, vehicle }) {
    const [form, setForm] = useState({
        name: "",
        model: "",
        vin: "",
        year: "",
        license_plate: ""
    });
    useEffect(() => {
        if (vehicle) {
            setForm({
                name: vehicle.name || "",
                model: vehicle.model || "",
                vin: vehicle.vin || "",
                year: vehicle.year || "",
                license_plate: vehicle.license_plate || ""
            });
        } else {
            setForm({
                name: "",
                model: "",
                vin: "",
                year: "",
                license_plate: ""
            });
        }
    }, [vehicle]);


    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const API = process.env.REACT_APP_API_URL || `${process.env.REACT_APP_API_BASE_URL}`;

    if (!open) return null;

    const validate = () => {
        const e = {};
        if (!form.name) e.name = "Required";
        if (!form.model) e.model = "Required";
        if (!form.license_plate) e.license_plate = "Required";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleChange = (ev) => {
        const { name, value } = ev.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const handleSubmit = async (ev) => {
        ev.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const payload = {
                ...form,
                // optionally include display name from local user object
                user_name: JSON.parse(localStorage.getItem("user"))?.firstName || undefined
            };

            const isEdit = !!vehicle;

            const url = isEdit
                ? `${API}/api/vehicles/${vehicle.id}`
                : `${API}/api/vehicles`;

            const method = isEdit ? axios.put : axios.post;

            const res = await method(url, payload, {
                headers: { Authorization: token ? `Bearer ${token}` : "" }
            });

            setLoading(false);
            onSaved && onSaved(res.data.vehicle);
            onClose();
        } catch (err) {
            console.error("Add vehicle error", err);
            setLoading(false);
            alert(err?.response?.data?.message || "Error saving vehicle");
        }
    };

    return (
        <div className="modal-overlay" onMouseDown={onClose}>
            <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{vehicle ? "Edit Vehicle" : "Add New Vehicle"}</h3>
                </div>

                <form className="register-form-modal" onSubmit={handleSubmit}>
                    <label>Name
                        <input name="name" value={form.name} onChange={handleChange} />
                        {errors.name && <div className="error-text">{errors.name}</div>}
                    </label>

                    <label>Model
                        <input name="model" value={form.model} onChange={handleChange} />
                        {errors.model && <div className="error-text">{errors.model}</div>}
                    </label>

                    <label>VIN Number
                        <input name="vin" value={form.vin} onChange={handleChange} />
                    </label>

                    <label>Year
                        <input name="year" value={form.year} onChange={handleChange} />
                    </label>

                    <label>License Plate
                        <input name="license_plate" value={form.license_plate} onChange={handleChange} />
                        {errors.license_plate && <div className="error-text">{errors.license_plate}</div>}
                    </label>

                    <button type="submit" className="register-submit" disabled={loading}>
                        {loading ? "Saving..." : vehicle ? "Update Vehicle" : "Save Vehicle"}
                    </button>
                </form>
            </div>
        </div>
    );
}
