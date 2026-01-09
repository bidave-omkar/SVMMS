// src/App.js
import React, { useState, useEffect } from "react";
import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";
import axios from "axios";
import "./App.css";
import ForgotPasswordModal from "./components/ForgotPasswordModal";
import ResetPasswordModal from "./components/ResetPasswordModal";


const API_LOGIN = `${process.env.REACT_APP_API_BASE_URL}/api/auth/login`;
const API_REGISTER = `${process.env.REACT_APP_API_BASE_URL}/api/auth/register`;

function App() {
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetToken, setResetToken] = useState(null);


  useEffect(() => {
    const openForgot = () => setShowForgot(true);
    window.addEventListener("open-forgot-password", openForgot);
    return () =>
      window.removeEventListener("open-forgot-password", openForgot);
  }, []);


  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith("/reset-password/")) {
      const token = path.split("/reset-password/")[1];
      setResetToken(token);

      // clean URL (no ugly page)
      window.history.replaceState({}, "", "/");
    }
  }, []);



  return (
    <div className="app">
      {/* NAVBAR */}
      <header className="navbar">
        <div className="nav-left">
          <div className="logo-circle">SV</div>
          <span className="logo-text">Smart Vehicle Maintenance</span>
        </div>

        <nav className="nav-links">
          <a href="#features">Features</a>
          <a href="#roles">Roles</a>
          <a href="#pricing">Pricing</a>
          <a href="#footer">Contact</a>
        </nav>

        <div className="nav-actions">
          {/* Login opens login modal */}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setShowLogin(true)}
          >
            Login
          </button>

          {/* Create Account opens register modal */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowRegister(true)}
          >
            Create Account
          </button>
        </div>
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="hero">
          <div className="hero-left">
            <span className="hero-pill">Next-Gen Vehicle Service Management</span>
            <h1>
              Smart Vehicle Maintenance <span className="accent">Made Simple</span>
            </h1>
            <p className="hero-subtitle">
              Unify customer bookings, workshop operations, inventory, and billing in
              one intuitive platform designed for modern vehicle service teams.
            </p>
            <button className="btn btn-cta" onClick={() => setShowRegister(true)}>
              Get Started
            </button>
          </div>

          <div className="hero-right">
            <div className="hero-image" />
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="section">
          <div className="section-header">
            <h2>Complete Service Management Suite</h2>
            <p>
              From customer booking to analytics, manage every step of your vehicle
              service operations in one connected workspace.
            </p>
          </div>

          <div className="cards-grid">
            <FeatureCard icon="🚗" title="Vehicle Management" text="Centralize vehicle profiles with history and notes." />
            <FeatureCard icon="📅" title="Service Booking" text="Frictionless online bookings and confirmations." />
            <FeatureCard icon="📋" title="Job Card System" text="Generate and track job cards for tasks." />
            <FeatureCard icon="📦" title="Inventory Management" text="Real-time spare parts & low-stock alerts." />
            <FeatureCard icon="🧾" title="Invoice Generation" text="Generate invoices with taxes and discounts." />
            <FeatureCard icon="📊" title="Analytics Dashboard" text="Monitor revenue, utilization, and turnaround." />
          </div>
        </section>

        {/* ROLES */}
        <section id="roles" className="section bg-light">
          <div className="section-header">
            <h2>Built for Every Role</h2>
            <p>Give customers, service centers, and admins interfaces designed around the way they work every day.</p>
          </div>

          <div className="roles-grid">
            <RoleCard title="Customer Portal" tag="Delight drivers" avatarInitials="CP" bullets={[
              "Register and manage vehicles",
              "Book service appointments online",
              "View full service history",
              "Track service progress in real time",
              "Access digital invoices and payments",
            ]} />
            <RoleCard title="Service Center" tag="Streamline operations" avatarInitials="SC" bullets={[
              "Manage job cards end to end",
              "Track spare parts inventory",
              "Assign mechanics to tasks",
              "Update and share service status",
              "Generate invoices instantly"
            ]} />
            <RoleCard title="Admin Dashboard" tag="Own the big picture" avatarInitials="AD" bullets={[
              "System-wide analytics at a glance",
              "Revenue and performance reports",
              "User and access management",
              "Service trends and repeat visits",
              "Operational and capacity insights"
            ]} />
          </div>
        </section>
        {/* PRICING / BILLING LOGIC SECTION */}
        <section id="pricing" className="section bg-light">
          <div className="section-header">
            <h2>How Service Pricing Works</h2>
            <p>
              Pricing is fully controlled by the service center. Charges are entered
              manually for every job card based on actual service requirements.
            </p>
          </div>

          {/* Reusing cards-grid but forcing single column */}
          <div className="cards-grid pricing-grid-single">
            <div className="card">
              <h3>Labour Charges</h3>
              <p>
                Labour cost is entered manually based on the type of service, effort,
                and time required to complete the job.
              </p>
            </div>

            <div className="card">
              <h3>Inventory & Spare Parts</h3>
              <p>
                Spare parts are selected from inventory, quantities are defined, and
                prices can be adjusted per job card.
              </p>
            </div>

            <div className="card">
              <h3>Taxes (GST)</h3>
              <p>
                Applicable GST percentage is entered manually according to local tax
                regulations and applied on the job subtotal.
              </p>
            </div>

            <div className="card">
              <h3>Discounts</h3>
              <p>
                Discounts can be applied either as a flat amount or percentage before
                generating the final invoice.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer id="footer" className="footer">
        <p>Smart Vehicle Maintenance and Management Platform © 2026 | Developed by <span className="footer-link">Omkar Rajkumar Bidave, GCEK</span></p>
        <div className="footer-icons">
          <a href="https://github.com/" target="_blank" rel="noopener noreferrer"><FaGithub /></a>
          <a href="https://www.linkedin.com/in/omkar-bidave" target="_blank" rel="noopener noreferrer"><FaLinkedin /></a>
          <a href="mailto:omkarbidave.pro@gmail.com" ><FaEnvelope /></a>
        </div>
        <div className="footer-bottom">
          <a href="/about">About</a>
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms</a>
          <a href="/contact">Contact</a>
        </div>
      </footer>

      {/* REGISTER MODAL */}
      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onShowLogin={() => { setShowRegister(false); setShowLogin(true); }}
        />
      )}

      {/* LOGIN MODAL */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onShowRegister={() => { setShowLogin(false); setShowRegister(true); }}
        />
      )}

      {/* FORGOT PASSWORD MODAL */}
      {showForgot && (
        <ForgotPasswordModal onClose={() => setShowForgot(false)} />
      )}

      {/* RESET PASSWORD MODAL */}
      {resetToken && (
        <ResetPasswordModal
          token={resetToken}
          onClose={() => setResetToken(null)}
        />
      )}

    </div>
  );
}

/* ---------- LOGIN MODAL ---------- */
function LoginModal({ onClose, onShowRegister }) {
  const [role, setRole] = useState("user"); // UI role selection (sent to backend)
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverMsg, setServerMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.password) e.password = "Password is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (ev) => {
    setForm(prev => ({ ...prev, [ev.target.name]: ev.target.value }));
    setErrors(prev => ({ ...prev, [ev.target.name]: "" }));
    setServerMsg("");
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setServerMsg("");
    if (!validate()) return;

    setLoading(true);
    try {
      // include role in payload so backend authenticates against selected table
      const payload = { email: form.email, password: form.password, role };
      const res = await axios.post(API_LOGIN, payload, { timeout: 10000 });

      // ensure server returned expected data
      const token = res.data?.token;
      const user = res.data?.user;

      if (!token || !user) {
        setServerMsg("Login failed: invalid server response.");
        setLoading(false);
        return;
      }

      // store token + user
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setServerMsg("Login successful!");

      // redirect according to role returned by server (use server role for correctness)
      setTimeout(() => {
        if (user.role === "admin") {
          window.location.href = "/admin-dashboard";
        } else if (user.role === "service_center") {
          window.location.href = "/service-center";
        } else {
          window.location.href = "/dashboard";
        }
      }, 300);
    } catch (err) {
      setServerMsg(err.response?.data?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Welcome Back</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="role-tabs">
          <button type="button" className={role === "user" ? "role-tab active" : "role-tab"} onClick={() => setRole("user")}>User</button>
          <button type="button" className={role === "service_center" ? "role-tab active" : "role-tab"} onClick={() => setRole("service_center")}>Service Center</button>
          <button type="button" className={role === "admin" ? "role-tab active" : "role-tab"} onClick={() => setRole("admin")}>Admin</button>
        </div>

        <form className="register-form-modal" onSubmit={handleSubmit}>
          <label>
            Email
            <input name="email" value={form.email} onChange={handleChange} />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </label>

          <label>
            Password
            <input type="password" name="password" value={form.password} onChange={handleChange} />
            {errors.password && <p className="error-text">{errors.password}</p>}
          </label>

          <div style={{ textAlign: "right", marginTop: 6 }}>
            <a
              href="#forgot"
              style={{ fontSize: 13, color: "#2563eb" }}
              onClick={(e) => {
                e.preventDefault();
                onClose();
                setTimeout(() => {
                  window.dispatchEvent(new Event("open-forgot-password"));
                }, 200);
              }}
            >
              Forgot Password?
            </a>
          </div>

          <button type="submit" className="register-submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="modal-message">
            {serverMsg && <div className="server-msg">{serverMsg}</div>}
            <div style={{ marginTop: 8, fontSize: 13, textAlign: "center" }}>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  if (onShowRegister) onShowRegister();
                }}
                style={{ color: "#2563eb", background: "transparent", border: "none", cursor: "pointer" }}
              >
                Sign Up
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}


/* ---------- REGISTER MODAL ---------- */
function RegisterModal({ onClose, onShowLogin }) {
  const [role, setRole] = useState("user"); // user | service_center
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverMsg, setServerMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "First name is required.";
    if (!form.lastName.trim()) e.lastName = "Last name is required.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email.";
    if (form.phone && form.phone.replace(/\D/g, "").length < 10) e.phone = "Phone must be at least 10 digits.";
    if (form.password.length < 6) e.password = "Password must be at least 6 characters.";
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
    setServerMsg("");
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = { ...form, role };
      const res = await axios.post(API_REGISTER, payload, { timeout: 10000 });
      setServerMsg(res.data.message || "Account created successfully! Please Login.");
      setForm({ firstName: "", lastName: "", email: "", phone: "", password: "" });
      setErrors({});
      // optionally close after success:
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      setServerMsg(err.response?.data?.message || "Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-card" onMouseDown={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create Account</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="role-tabs">
          <button
            type="button"
            className={role === "user" ? "role-tab active" : "role-tab"}
            onClick={() => setRole("user")}
          >
            User
          </button>

          <button
            type="button"
            className={role === "service_center" ? "role-tab active" : "role-tab"}
            onClick={() => setRole("service_center")}
          >
            Service Center
          </button>
        </div>


        <form className="register-form-modal" onSubmit={handleSubmit}>
          <label>
            First Name
            <input name="firstName" value={form.firstName} onChange={handleChange} />
            {errors.firstName && <p className="error-text">{errors.firstName}</p>}
          </label>

          <label>
            Last Name
            <input name="lastName" value={form.lastName} onChange={handleChange} />
            {errors.lastName && <p className="error-text">{errors.lastName}</p>}
          </label>

          <label>
            Email
            <input name="email" value={form.email} onChange={handleChange} />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </label>

          <label>
            Phone Number
            <input name="phone" value={form.phone} onChange={handleChange} />
            {errors.phone && <p className="error-text">{errors.phone}</p>}
          </label>

          <label>
            Password
            <input type="password" name="password" value={form.password} onChange={handleChange} />
            {errors.password && <p className="error-text">{errors.password}</p>}
          </label>

          <button type="submit" className="register-submit" disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>

          <div className="modal-message">
            {serverMsg && <div className="server-msg">{serverMsg}</div>}
            <div style={{ marginTop: 8, fontSize: 13, textAlign: "center" }}>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  if (onShowLogin) onShowLogin();
                }}
                style={{ color: "#2563eb", background: "transparent", border: "none", cursor: "pointer" }}
              >
                Sign In
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- Small UI components ---------- */
function FeatureCard({ icon, title, text }) {
  return (
    <div className="card feature-card">
      <div className="icon-wrapper">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function RoleCard({ title, tag, avatarInitials, bullets }) {
  return (
    <div className="card role-card">
      <div className="role-header">
        <div className="avatar-circle">{avatarInitials}</div>
        <div><h3>{title}</h3><span className="role-tag">{tag}</span></div>
      </div>
      <ul className="role-list">{bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
    </div>
  );
}

export default App;
