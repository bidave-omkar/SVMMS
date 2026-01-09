// src/pages/Register.jsx
import React, { useState } from "react";
import axios from "axios";
import "./Register.css";

const API_URL = `${process.env.REACT_APP_API_BASE_URL}/api/auth/register`;

function Register() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");

  const validate = () => {
    let temp = {};

    temp.firstName = form.firstName ? "" : "First name is required.";
    temp.lastName = form.lastName ? "" : "Last name is required.";
    temp.email = /^\S+@\S+\.\S+$/.test(form.email)
      ? ""
      : "Enter a valid email address.";
    temp.phone =
      form.phone.length >= 10 ? "" : "Phone number must be at least 10 digits.";
    temp.password =
      form.password.length >= 6
        ? ""
        : "Password must be at least 6 characters.";

    setErrors(temp);

    // Return true only if all values are empty strings
    return Object.values(temp).every((x) => x === "");
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });

    // Remove errors instantly while typing
    setErrors({ ...errors, [e.target.name]: "" });
    setServerError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      // Always register as a normal "user" — backend enforces this.
      const res = await axios.post(API_URL, {
        ...form,
      });

      setSuccess(res.data.message || "Account created successfully! Please Login.");
      setServerError("");

      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
      });
    } catch (err) {
      setServerError(
        err.response?.data?.message || "Something went wrong. Try again."
      );
    }
  };

  return (
    <div className="register-page">
      <section className="hero register-hero">
        <div className="hero-left">
          <span className="hero-pill">Next-Gen Vehicle Service Management</span>
          <h1>
            Smart Vehicle Maintenance <span className="accent">Made Simple</span>
          </h1>
          <p className="hero-subtitle">
            Unify customer bookings, workshop operations, inventory, and billing
            in one intuitive platform designed for modern vehicle service teams.
          </p>
        </div>

        <div className="hero-right register-card-wrapper">
          <div className="register-card">
            <h2 className="register-title">Create Account</h2>

            {/* NOTE: role selection removed — public registration creates users only */}

            <form onSubmit={handleSubmit} className="register-form">
              <label>
                First Name
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                />
                {errors.firstName && (
                  <p className="error-text">{errors.firstName}</p>
                )}
              </label>

              <label>
                Last Name
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                />
                {errors.lastName && (
                  <p className="error-text">{errors.lastName}</p>
                )}
              </label>

              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                />
                {errors.email && <p className="error-text">{errors.email}</p>}
              </label>

              <label>
                Phone Number
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                />
                {errors.phone && <p className="error-text">{errors.phone}</p>}
              </label>

              <label>
                Password
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                />
                {errors.password && (
                  <p className="error-text">{errors.password}</p>
                )}
              </label>

              <button type="submit" className="btn btn-cta register-submit">
                Create Account
              </button>

              <p className="register-signin">
                Already have an account? <a href="/login">Sign In</a>
              </p>

              {success && <p className="register-success">{success}</p>}
              {serverError && (
                <p className="register-error">{serverError}</p>
              )}
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Register;
