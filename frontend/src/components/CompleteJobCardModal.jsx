import React, { useEffect, useState } from "react";
import axios from "axios";

export default function CompleteJobCardModal({ jobCard, onClose, onSuccess }) {
  const token = localStorage.getItem("token");

  const [labor_charge, setLaborCharge] = useState("");
  const [tax, setTax] = useState("");
  const [discount, setDiscount] = useState("");
  const [parts, setParts] = useState([]);

  useEffect(() => {
    axios
      .get(
        `${process.env.REACT_APP_API_BASE_URL}/api/service-center/job-cards/${jobCard.id}/parts`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(res => {
        setParts(
          res.data.parts.map(p => ({
            ...p,
            unit_price: ""
          }))
        );
      })
      .catch(() => alert("Failed to load spare parts"));
  }, [jobCard.id, token]);

  const submit = async () => {
    if (!labor_charge || !tax || discount === "") {
      alert("Labor charge, tax and discount are mandatory");
      return;
    }
    if (
      parts.length > 0 &&
      parts.some(p => p.unit_price === "")
    ) {
      alert("Please enter unit price for all spare parts");
      return;
    }


    try {
      await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/service-center/job-cards/${jobCard.id}/bill`,
        {
          labor_charge,
          tax,
          discount,
          parts: parts.map(p => ({
            job_card_part_id: p.id,
            unit_price: Number(p.unit_price),
          })),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Service completed & bill generated");
      onSuccess();
    } catch (err) {
      console.error(err);
      alert("Failed to complete service");
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Complete Service & Billing</h3>
        </div>

        <form className="register-form-modal">
          <label>
            Labor Charge (₹)
            <input type="number" value={labor_charge}
              onChange={(e) => setLaborCharge(e.target.value)} />
          </label>

          <h4>Spare Parts</h4>
          {parts.length === 0 ? (
            <p style={{ color: "#6b7280", fontStyle: "italic", marginBottom: "12px" }}>
              Spare Parts: NA
            </p>
          ) : (
            parts.map((p, idx) => (
              <div key={p.id} style={{ display: "flex", gap: "10px", marginBottom: "8px" }}>
                <span style={{ flex: 2 }}>
                  {p.part_name} × {p.quantity}
                </span>
                <input
                  type="number"
                  placeholder="Unit Price ₹"
                  value={p.unit_price}
                  onChange={(e) => {
                    const updated = [...parts];
                    updated[idx].unit_price = e.target.value;
                    setParts(updated);
                  }}
                />
              </div>
            ))
          )}

          <label>
            Tax (₹)
            <input type="number" value={tax}
              onChange={(e) => setTax(e.target.value)} />
          </label>

          <label>
            Discount (₹)
            <input type="number" value={discount}
              onChange={(e) => setDiscount(e.target.value)} />
          </label>

          <button type="button" className="register-submit" onClick={submit}>
            Complete & Generate Bill
          </button>
        </form>
      </div>
    </div>
  );
}
