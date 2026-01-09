import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

export default function UserInvoice() {
    const { id } = useParams();
    const token = localStorage.getItem("token");
    const [invoice, setInvoice] = useState(null);
    const [parts, setParts] = useState([]);

    useEffect(() => {
        axios.get(
            `${process.env.REACT_APP_API_BASE_URL}/api/user/job-cards/${id}/invoice`,
            { headers: { Authorization: `Bearer ${token}` } }
        )
            .then(res => {
                setInvoice(res.data.invoice);
                setParts(res.data.parts || []);
            })
            .catch(() => alert("Failed to load invoice"));
    }, [token, id]);

    const downloadInvoice = async (jobCardId) => {
        try {
            const token = localStorage.getItem("token");

            const res = await axios.get(
                `${process.env.REACT_APP_API_BASE_URL}/api/user/job-cards/${jobCardId}/invoice/pdf`,
                {
                    responseType: "blob",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            // ✅ SAME LOGIC AS SERVICE CENTER
            const safeVehicleName = invoice.vehicle
                .replace(/[^a-z0-9]/gi, "_")
                .toLowerCase();

            const blob = new Blob([res.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = `${safeVehicleName}_invoice.pdf`; // ✅ FIXED
            link.click();

            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Invoice download failed", err);
        }
    };


    if (!invoice) return <p>Loading...</p>;

    return (
        <div className="dashboard-page ">
            <main className="dash-main">
                <h1>Service Invoice</h1>
                <button
                    className="btn action-primary"
                    style={{ marginBottom: 16 }}
                    onClick={() => downloadInvoice(id)}
                >
                    📄 Download PDF
                </button>

                <p>Vehicle: {invoice.vehicle}</p>
                <p>Service: {invoice.service_type}</p>
                <p>Mechanic: {invoice.mechanic_name}</p>

                <hr />

                <p>Labor: ₹{invoice.labor_charge}</p>

                <h3>Spare Parts</h3>
                {parts.length === 0 ? (
                    <p>No spare parts used</p>
                ) : (
                    <ul>
                        {parts.map((p, index) => (
                            <li key={index}>
                                {index + 1}) {p.part_name} × {p.quantity} @ ₹{p.unit_price} = ₹{p.amount}
                            </li>
                        ))}
                    </ul>
                )}

                <p>Tax: ₹{invoice.tax}</p>
                <p>Discount: ₹{invoice.discount}</p>

                <h3>Total: ₹{invoice.total_amount}</h3>
            </main>
        </div>
    );
}
