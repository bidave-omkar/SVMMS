// src/routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import crypto from "crypto";
import { transporter } from "../utils/mailer.js";


const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret";

/* ================= REGISTER ================= */
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, role } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const normalizedRole = (role || "user").toLowerCase();
    if (!["user", "service_center"].includes(normalizedRole)) {
      return res.status(403).json({ message: "Invalid role" });
    }

    const normEmail = email.toLowerCase().trim();

    // Check email everywhere
    const exists = await pool.query(
      `
      SELECT email FROM users WHERE email=$1
      UNION
      SELECT email FROM service_centers WHERE email=$1
      UNION
      SELECT email FROM admins WHERE email=$1
      `,
      [normEmail]
    );

    if (exists.rows.length > 0) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    /* ---- SERVICE CENTER ---- */
    if (normalizedRole === "service_center") {
      const { rows } = await pool.query(
        `
        INSERT INTO service_centers
        (first_name, last_name, email, phone, password_hash, createdat, updatedat)
        VALUES ($1,$2,$3,$4,$5,NOW(),NOW())
        RETURNING id, email
        `,
        [firstName, lastName, normEmail, phone || null, password_hash]
      );

      return res.status(201).json({
        message: "Service center registered successfully",
        user: { ...rows[0], role: "service_center" }
      });
    }

    /* ---- USER ---- */
    const { rows } = await pool.query(
      `
      INSERT INTO users("firstName", "lastName", email, phone, password_hash, role, createdat, updatedat)
      VALUES ($1,$2,$3,$4,$5,'user',NOW(),NOW())
      RETURNING id, email, role
      `,
      [firstName, lastName, normEmail, phone || null, password_hash]
    );

    res.status(201).json({
      message: "User registered successfully",
      user: rows[0]
    });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role)
      return res.status(400).json({ message: "Email, password, role required" });

    const normEmail = email.toLowerCase().trim();
    let table = "users";

    if (role === "admin") table = "admins";
    if (role === "service_center") table = "service_centers";

    const { rows } = await pool.query(
      `SELECT * FROM ${table} WHERE email=$1 LIMIT 1`,
      [normEmail]
    );

    if (!rows.length) return res.status(401).json({ message: "Invalid credentials" });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, role }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

//  forgot password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const normEmail = email.toLowerCase().trim();

    const userRes = await pool.query(
      `
      SELECT id, 'users' AS table FROM users WHERE email=$1
      UNION
      SELECT id, 'service_centers' FROM service_centers WHERE email=$1
      `,
      [normEmail]
    );

    if (!userRes.rows.length) {
      return res.status(404).json({ message: "Email not registered" });
    }

    const { id, table } = userRes.rows[0];

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = Date.now() + 15 * 60 * 1000; // 15 min

    await pool.query(
      `
      UPDATE ${table}
      SET reset_token=$1, reset_token_expiry=$2
      WHERE id=$3
      `,
      [token, expiry, id]
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    await transporter.sendMail({
      to: normEmail,
      subject: "Reset your SVMMS password",
      html: `
        <p>Click below to reset password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link expires in 15 minutes.</p>
      `,
    });

    res.json({ message: "Reset link sent to email" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// reset password
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password too short" });
    }

    const userRes = await pool.query(
      `
      SELECT id, 'users' AS table FROM users
      WHERE reset_token=$1 AND reset_token_expiry > $2
      UNION
      SELECT id, 'service_centers' FROM service_centers
      WHERE reset_token=$1 AND reset_token_expiry > $2
      `,
      [token, Date.now()]
    );

    if (!userRes.rows.length) {
      return res
        .status(404)
        .json({ message: "Password reset not available for this account type" });
    }


    const { id, table } = userRes.rows[0];
    const password_hash = await bcrypt.hash(password, 10);

    await pool.query(
      `
      UPDATE ${table}
      SET password_hash=$1, reset_token=NULL, reset_token_expiry=NULL
      WHERE id=$2
      `,
      [password_hash, id]
    );

    res.json({ message: "Password reset successful. You can login now." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
