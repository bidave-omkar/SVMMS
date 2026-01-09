// src/routes/bookings.js
import express from "express";
import { pool } from "../db.js";

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

function getUserFromReq(req) {
  try {
    const auth = req.headers.authorization || "";
    if (!auth) return null;

    const parts = auth.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") return null;

    const token = parts[1];
    const payload = jwt.verify(token, JWT_SECRET);
    return payload; // { id, role, email }
  } catch (err) {
    return null;
  }
}
const router = express.Router();


/**
 * POST /api/bookings
 * body: { vehicle, service_type, preferred_date, preferred_time, notes, created_by, created_by_name }
 * created_by should be the numeric user id (not email) - frontend must send user.id
 */
router.post("/", async (req, res) => {
  try {
    const { vehicle, service_type, preferred_date, preferred_time, notes, created_by, created_by_name } = req.body;

    if (!vehicle || !service_type || !preferred_date || !preferred_time || notes === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // created_by must be numeric id (optional but recommended)
    const createdById = created_by ? Number(created_by) : null;

    const insertQ = `
      INSERT INTO bookings (vehicle, service_type, preferred_date, preferred_time, notes, created_by, created_by_name, status, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()) RETURNING *`;
    const values = [vehicle, service_type, preferred_date, preferred_time, notes, createdById, created_by_name || null, "pending"];
    const { rows } = await pool.query(insertQ, values);
    const booking = rows[0];

    // notify service centers
    const scQ = `SELECT id, email FROM users WHERE role = $1`;
    const scRes = await pool.query(scQ, ["service_center"]);
    const scUsers = scRes.rows || [];

    const notifQ = `INSERT INTO notifications (user_id, user_email, booking_id, message, is_read, created_at) VALUES ($1,$2,$3,$4,$5, NOW()) RETURNING *`;
    const createdNotifs = [];
    for (const u of scUsers) {
      const msg = `New booking pending approval: ${booking.vehicle} on ${booking.preferred_date} ${booking.preferred_time}`;
      const notifRes = await pool.query(notifQ, [u.id || null, u.email || null, booking.id, msg, false]);
      createdNotifs.push(notifRes.rows[0]);
    }

    // real-time emit
    try {
      const io = req.app?.locals?.io;
      if (io) {
        io.to("service_center").emit("new-booking", { booking });
      }
    } catch (e) { console.error("emit error", e); }

    return res.json({ message: "Booking created", booking, notifications: createdNotifs });
  } catch (err) {
    console.error("Booking create error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/bookings
 * optional query: ?userId=123  -> returns bookings for that user only
 * If userId is absent, returns all bookings (admin/service_center usage)
 */
router.get("/", async (req, res) => {
  try {
    const userId = req.query.userId ? Number(req.query.userId) : null;
    if (userId) {
      const q = `SELECT * FROM bookings WHERE created_by = $1 ORDER BY created_at DESC`;
      const { rows } = await pool.query(q, [userId]);
      return res.json({ bookings: rows });
    } else {
      const q = `SELECT * FROM bookings ORDER BY preferred_date DESC, preferred_time DESC, created_at DESC`;
      const { rows } = await pool.query(q);
      return res.json({ bookings: rows });
    }
  } catch (err) {
    console.error("Booking list error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/bookings/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const delQ = `DELETE FROM bookings WHERE id = $1 RETURNING *`;
    const { rows } = await pool.query(delQ, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    return res.json({ message: "Booking deleted", deleted: rows[0] });
  } catch (err) {
    console.error("Delete booking error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/bookings/:id/status
router.put("/:id/status", async (req, res) => {
  try {
    const user = getUserFromReq(req);
    if (!user || user.role !== "service_center") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { id } = req.params;
    const { status } = req.body; // approved | rejected

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const q = `
      UPDATE bookings
      SET status = $1
      WHERE id = $2
      RETURNING *
    `;
    const { rows } = await pool.query(q, [status, id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // optional socket emit
    const io = req.app.locals.io;
    if (io) {
      io.emit("booking-status-updated", { booking: rows[0] });
    }


    res.json({ message: "Status updated", booking: rows[0] });
  } catch (err) {
    console.error("Update booking status error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/bookings/approved
router.get("/approved", async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.split(" ")[1];

    const user = jwt.verify(token, process.env.JWT_SECRET || "secret");

    if (!user || user.role !== "service_center") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const result = await pool.query(`
      SELECT 
        b.id,
        b.vehicle,
        b.service_type,
        b.created_by_name AS customer_name,
        b.notes AS user_note
      FROM bookings b
      WHERE b.status = 'approved'
      AND NOT EXISTS (
        SELECT 1
        FROM job_cards jc
        WHERE jc.booking_id = b.id
      )
      ORDER BY b.created_at DESC
    `);

    res.json({ bookings: result.rows });
  } catch (err) {
    console.error("Approved bookings error", err);
    res.status(500).json({ message: "Server error" });
  }
});



export default router;
