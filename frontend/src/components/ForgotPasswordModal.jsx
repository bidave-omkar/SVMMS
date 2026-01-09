import { useState } from "react";
import axios from "axios";

const API_FORGOT = `${process.env.REACT_APP_API_BASE_URL}/api/auth/forgot-password`;

export default function ForgotPasswordModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!email) {
      setMessage("Email is required");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(API_FORGOT, { email });
      setMessage(res.data.message || "Reset link sent to email");
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Failed to send reset link"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal-card"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Forgot Password</h3>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form className="register-form-modal" onSubmit={handleSubmit}>
          <label>
            Email Address
            <input
              type="email"
              placeholder="Enter registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <button
            type="submit"
            className="register-submit"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          {message && (
            <div
              className="server-msg"
              style={{ marginTop: 10, textAlign: "center" }}
            >
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
