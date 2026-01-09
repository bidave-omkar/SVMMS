import { useState } from "react";
import axios from "axios";

export default function ResetPasswordModal({ token, onClose }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage("");

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/auth/reset-password/${token}`,
        { password }
      );

      setMessage(res.data.message || "Password reset successful. You can login now.");

      // ⏱ Auto close after 5 seconds
      setTimeout(() => {
        onClose();
      }, 5000);

    } catch (err) {
      setMessage(err.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Reset Password</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form className="register-form-modal" onSubmit={handleReset}>
          <label>
            New Password
            <input
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <button
            type="submit"
            className="register-submit"
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>

          {message && (
            <div className="server-msg" style={{ marginTop: 10, textAlign: "center" }}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
