import React, { useState } from "react";
import axios from "axios";

const API_BASE = `${process.env.REACT_APP_API_BASE_URL}/api/admin/inventory`;

export default function AddPartModal({ onClose, onSaved }) {
    const token = localStorage.getItem("token");

    const [form, setForm] = useState({
        part_name: "",
        category: "",
        stock: "",
        price: "",
    });

    const submit = async () => {
        if (!form.part_name || !form.category || !form.stock || !form.price) {
            alert("All fields required");
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
                    <h3>Add Spare Part</h3>
                </div>

                <form className="register-form-modal" onSubmit={(e) => {
                    e.preventDefault();
                    submit();
                }}>
                    <label>
                        Part Name
                        <input
                            name="part_name"
                            value={form.part_name}
                            onChange={e => setForm({ ...form, part_name: e.target.value })}
                            required
                        />
                    </label>

                    <label>
                        Category
                        <input
                            name="category"
                            value={form.category}
                            onChange={e => setForm({ ...form, category: e.target.value })}
                            required
                        />
                    </label>

                    <label>
                        Stock
                        <input
                            type="number"
                            name="stock"
                            value={form.stock}
                            onChange={e => setForm({ ...form, stock: e.target.value })}
                            required
                        />
                    </label>

                    <label>
                        Price
                        <input
                            type="number"
                            name="price"
                            value={form.price}
                            onChange={e => setForm({ ...form, price: e.target.value })}
                            required
                        />
                    </label>

                    <button type="submit" className="register-submit">
                        Save Part
                    </button>
                </form>
            </div>
        </div>

    );
}
