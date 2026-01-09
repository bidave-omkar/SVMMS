// src/pages/Login.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Register.css"; // reuse styles

const API_LOGIN = `${process.env.REACT_APP_API_BASE_URL}/api/auth/login`;

export default function Login() {
  const navigate = useNavigate();

  const [role, setRole] = useState("user"); // added role selector
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverMsg, setServerMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // auto-redirect if already logged in
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("token");
      if (stored && token) {
        redirectByRole(stored.role);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // redirect helper
  const redirectByRole = (r) => {
    if (r === "admin") navigate("/admin-dashboard", { replace: true });
    else if (r === "service_center") navigate("/service-center", { replace: true });
    else navigate("/dashboard", { replace: true }); // normal user
  };

  // validate form
  const validate = () => {
    const e = {};
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.password) e.password = "Password required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: "" }));
    setServerMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerMsg("");

    try {
      // include role so backend authenticates against the selected table
      const res = await axios.post(API_LOGIN, { ...form, role }, { timeout: 10000 });

      const { token, user } = res.data;
      if (!token || !user) {
        setServerMsg("Invalid server response");
        setLoading(false);
        return;
      }

      // store login data
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setServerMsg("Login successful!");

      setTimeout(() => redirectByRole(user.role), 300);
    } catch (err) {
      const msg = err?.response?.data?.message || "Login failed. Try again.";
      setServerMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 28 }}>
      <h2>Login</h2>

      {/* role tabs */}
      <div style={{ marginBottom: 12 }}>
        <button className={role === "user" ? "role-tab active" : "role-tab"} onClick={() => setRole("user")}>User</button>
        <button className={role === "service_center" ? "role-tab active" : "role-tab"} onClick={() => setRole("service_center")}>Service Center</button>
        <button className={role === "admin" ? "role-tab active" : "role-tab"} onClick={() => setRole("admin")}>Admin</button>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 420 }}>
        <label>
          Email
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
          />
          {errors.email && <p className="error-text">{errors.email}</p>}
        </label>

        <label style={{ marginTop: 8 }}>
          Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter your password"
          />
          {errors.password && <p className="error-text">{errors.password}</p>}
        </label>

        <button className="btn btn-cta" style={{ marginTop: 12 }} disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </button>

        {serverMsg && (
          <p className="modal-message" style={{ marginTop: 12 }}>
            {serverMsg}
          </p>
        )}
      </form>
    </div>
  );
}
