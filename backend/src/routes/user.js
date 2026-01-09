import express from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import PDFDocument from "pdfkit";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret";

/* 🔐 Auth helper */
function getUserFromReq(req) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.split(" ")[1];
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * GET /api/user/job-cards
 * Returns all job cards (completed/in-progress) for logged-in user
 */
router.get("/job-cards", async (req, res) => {
  try {
    const user = getUserFromReq(req);
    if (!user || user.role !== "user") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const result = await pool.query(
      `
      SELECT
        jc.id AS job_card_id,
        jc.status,
        jc.created_at,
        b.id AS booking_id,
        b.vehicle,
        b.service_type,
        COALESCE(jb.total_amount, 0) AS total_amount
      FROM job_cards jc
      JOIN bookings b ON b.id = jc.booking_id
      LEFT JOIN job_card_bills jb ON jb.job_card_id = jc.id
      WHERE b.created_by = $1
      ORDER BY jc.created_at DESC
      `,
      [user.id]
    );

    res.json({ jobCards: result.rows });
  } catch (err) {
    console.error("User job cards error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/user/job-cards/:id/invoice
 * Returns invoice for a specific job card (user read-only)
 */
// GET /api/user/job-cards/:id/invoice
router.get("/job-cards/:id/invoice", async (req, res) => {
  try {
    const user = getUserFromReq(req);
    if (!user || user.role !== "user") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const jobCardId = req.params.id;

    // 🔹 Invoice main data
    const billRes = await pool.query(
      `
      SELECT 
        b.vehicle,
        b.service_type,
        m.name AS mechanic_name,
        jb.labor_charge,
        jb.spare_parts_charge,
        jb.tax,
        jb.discount,
        jb.total_amount
      FROM job_cards jc
      JOIN bookings b ON jc.booking_id = b.id
      JOIN mechanics m ON jc.mechanic_id = m.id
      JOIN job_card_bills jb ON jb.job_card_id = jc.id
      WHERE jc.id = $1
        AND b.created_by = $2
      `,
      [jobCardId, user.id]
    );

    if (billRes.rows.length === 0) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // 🔹 Spare parts breakup (THIS WAS MISSING)
    const partsRes = await pool.query(
      `
      SELECT 
        i.part_name,
        jcp.quantity,
        jcp.unit_price,
        (jcp.quantity * jcp.unit_price) AS amount
      FROM job_card_parts jcp
      JOIN inventory i ON i.id = jcp.inventory_id
      WHERE jcp.job_card_id = $1
      `,
      [jobCardId]
    );

    res.json({
      invoice: billRes.rows[0],
      parts: partsRes.rows,
    });

  } catch (err) {
    console.error("User invoice fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/job-cards/:id/invoice/pdf", async (req, res) => {
  try {
    const user = getUserFromReq(req);
    if (!user || user.role !== "user") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const jobCardId = req.params.id;

    // 🔹 Fetch invoice
    const invoiceRes = await pool.query(
      `
      SELECT 
        b.vehicle,
        b.service_type,
        m.name AS mechanic_name,
        jb.labor_charge,
        jb.tax,
        jb.discount,
        jb.total_amount
      FROM job_cards jc
      JOIN bookings b ON jc.booking_id = b.id
      JOIN mechanics m ON jc.mechanic_id = m.id
      JOIN job_card_bills jb ON jb.job_card_id = jc.id
      WHERE jc.id = $1 AND b.created_by = $2
      `,
      [jobCardId, user.id]
    );

    if (invoiceRes.rows.length === 0) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // 🔹 Fetch parts
    const partsRes = await pool.query(
      `
      SELECT 
        i.part_name,
        jcp.quantity,
        jcp.unit_price,
        (jcp.quantity * jcp.unit_price) AS amount
      FROM job_card_parts jcp
      JOIN inventory i ON i.id = jcp.inventory_id
      WHERE jcp.job_card_id = $1
      `,
      [jobCardId]
    );

    const invoice = invoiceRes.rows[0];
    const parts = partsRes.rows;

    // ✅ SAME filename logic as service-center
    const safeVehicleName = invoice.vehicle
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "");

    // ✅ DOC MUST BE CREATED BEFORE USE
    const doc = new PDFDocument({ margin: 40 });
    doc.registerFont(
      "NotoSans",
      "./fonts/NotoSans-Regular.ttf"
    );

    doc.font("NotoSans");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${safeVehicleName}_Invoice.pdf`
    );

    doc.pipe(res);

    // -------- PDF CONTENT ----------
    doc.fontSize(20).text("Service Invoice", { align: "center" });
    doc.moveDown();

    doc.fontSize(12);
    doc.text(`Vehicle: ${invoice.vehicle}`);
    doc.text(`Service: ${invoice.service_type}`);
    doc.text(`Mechanic: ${invoice.mechanic_name}`);
    doc.moveDown();

    doc.text(`Labor Charge: ₹${invoice.labor_charge}`);
    doc.moveDown();

    doc.text("Spare Parts:");
    if (parts.length === 0) {
      doc.text("No spare parts used");
    } else {
      parts.forEach((p, i) => {
        doc.text(
          `${i + 1}. ${p.part_name} × ${p.quantity} @ ₹${p.unit_price} = ₹${p.amount}`
        );
      });
    }

    doc.moveDown();
    doc.text(`Tax: ₹${invoice.tax}`);
    doc.text(`Discount: ₹${invoice.discount}`);
    doc.moveDown();

    doc.fontSize(14).text(`Total Amount: ₹${invoice.total_amount}`, {
      underline: true,
    });

    doc.end();
  } catch (err) {
    console.error("Invoice PDF error:", err);
    res.status(500).json({ message: "Failed to generate PDF" });
  }
});



export default router;