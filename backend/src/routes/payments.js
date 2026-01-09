import express from "express";
import { pool } from "../db.js";

const router = express.Router();

/**
 * GET invoice amount by booking ID
 */
router.get("/amount/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;

    const q = `
      SELECT b.total_amount
      FROM job_card_bills b
      JOIN job_cards jc ON jc.id = b.job_card_id
      WHERE jc.booking_id = $1
      LIMIT 1
    `;

    const { rows } = await pool.query(q, [bookingId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.json({ amount: rows[0].total_amount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * MOCK PAYMENT
 */
router.post("/mock-pay", async (req, res) => {
  try {
    const { booking_id } = req.body;

    await pool.query(
      `UPDATE bookings SET payment_status = 'paid' WHERE id = $1`,
      [booking_id]
    );

    res.json({ message: "Mock payment successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Mock payment failed" });
  }
});

export default router;
