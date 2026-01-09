// src/routes/serviceCenter.js
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

/* ======================================
   GET /api/service-center/inventory
   ====================================== */
router.get("/inventory", async (req, res) => {
  try {
    const user = getUserFromReq(req);

    if (!user || user.role !== "service_center") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const result = await pool.query(`
      SELECT 
        id,
        part_name,
        category,
        stock,
        price
      FROM inventory
      ORDER BY part_name ASC
    `);

    res.json({ items: result.rows });
  } catch (err) {
    console.error("Service center inventory error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
/* ======================================
   POST /api/service-center/low-stock-request
   ====================================== */
router.post("/low-stock-request", async (req, res) => {
  try {
    const { inventory_id, part_name, stock } = req.body;

    if (!inventory_id) {
      return res.status(400).json({ message: "Inventory ID missing" });
    }

    await pool.query(
      `
        INSERT INTO admin_notifications
          (type, message, inventory_id, status, created_at)
        VALUES
          ('LOW_STOCK', $1, $2, 'PENDING', NOW())
        `,
      [
        `Low stock alert: ${part_name} (Remaining: ${stock})`,
        inventory_id,
      ]
    );

    res.json({ message: "Low stock request sent to admin" });
  } catch (err) {
    console.error("Low stock request error", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/service-center/job-cards
router.post("/job-cards", async (req, res) => {
  const client = await pool.connect();

  try {
    const user = getUserFromReq(req);
    if (!user || user.role !== "service_center") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { booking_id, mechanic_id, parts = [], issue } = req.body;

    if (!booking_id || !mechanic_id || !issue) {
      return res.status(400).json({ message: "Booking, mechanic and issue are mandatory" });
    }


    await client.query("BEGIN");

    /* ---- Validate Booking ---- */
    const bookingRes = await client.query(
      `SELECT id FROM bookings WHERE id = $1 AND status = 'approved'`,
      [booking_id]
    );

    if (bookingRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Invalid or unapproved booking" });
    }

    /* ---- Validate Mechanic ---- */
    const mechRes = await client.query(
      `SELECT id FROM mechanics WHERE id = $1`,
      [mechanic_id]
    );

    if (mechRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Invalid mechanic" });
    }

    const bookingNoteRes = await client.query(
      `SELECT notes FROM bookings WHERE id = $1`,
      [booking_id]
    );
    const userNote = bookingNoteRes.rows[0]?.notes || null;

    /* ---- Prevent duplicate job card for same booking ---- */
    const existingJobCard = await client.query(
      `SELECT id FROM job_cards WHERE booking_id = $1`,
      [booking_id]
    );

    if (existingJobCard.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Job card already exists for this booking",
      });
    }


    /* ---- Create Job Card ---- */
    const jobRes = await client.query(
      `
      INSERT INTO job_cards (
        booking_id,
        mechanic_id,
        service_center_id,
        status,
        user_note,
        issue
      )
      VALUES ($1, $2, $3, 'IN_PROGRESS', $4, $5)
      RETURNING id
      `,
      [booking_id, mechanic_id, user.id, userNote, issue]
    );

    const jobCardId = jobRes.rows[0].id;

    /* ---- Inventory Handling (OPTIONAL) ---- */
    if (Array.isArray(parts) && parts.length > 0) {
      for (const p of parts) {
        const invRes = await client.query(
          `SELECT id, stock, part_name FROM inventory WHERE id = $1 FOR UPDATE`,
          [p.inventory_id]
        );

        if (invRes.rows.length === 0) {
          await client.query("ROLLBACK");
          return res.status(400).json({ message: "Invalid inventory item" });
        }

        const inv = invRes.rows[0];

        if (inv.stock < p.quantity) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            message: `Insufficient stock for ${inv.part_name}`,
          });
        }

        await client.query(
          `UPDATE inventory SET stock = stock - $1 WHERE id = $2`,
          [p.quantity, inv.id]
        );

        await client.query(
          `INSERT INTO job_card_parts (job_card_id, inventory_id, quantity)
       VALUES ($1, $2, $3)`,
          [jobCardId, inv.id, p.quantity]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ message: "Job card created successfully" });

  } catch (err) {
    await client.query("ROLLBACK");
    // ✅ Handle duplicate booking error
    if (err.code === "23505") {
      return res.status(409).json({
        message: "Job card already exists for this booking",
      });
    }
    console.error("Job card error:", err);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

// GET /api/service-center/job-cards
router.get("/job-cards", async (req, res) => {
  try {
    const user = getUserFromReq(req);

    if (!user || user.role !== "service_center") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const result = await pool.query(
      `
  SELECT
    jc.id,
    jc.status,
    jc.created_at,
    b.vehicle,
    b.service_type AS service,
    jc.issue,
    jc.user_note,
    m.name AS mechanic_name,    
    b.payment_status, 
    COALESCE(jb.total_amount, 0) AS amount
  FROM job_cards jc
  JOIN bookings b ON jc.booking_id = b.id
  JOIN mechanics m ON jc.mechanic_id = m.id
  LEFT JOIN job_card_bills jb ON jb.job_card_id = jc.id
  WHERE jc.service_center_id = $1
  ORDER BY jc.created_at DESC
  `,
      [user.id]
    );

    res.json({ jobCards: result.rows });
  } catch (err) {
    console.error("Fetch job cards error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/service-center/job-cards/:id/complete
router.put("/job-cards/:id/complete", async (req, res) => {
  const client = await pool.connect();

  try {
    const user = getUserFromReq(req);
    if (!user || user.role !== "service_center") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const jobCardId = req.params.id;

    await client.query("BEGIN");

    /* 1️⃣ Validate job card */
    const jcRes = await client.query(
      `
      SELECT jc.id, jc.booking_id
      FROM job_cards jc
      WHERE jc.id = $1 AND jc.service_center_id = $2
      `,
      [jobCardId, user.id]
    );

    if (jcRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Job card not found" });
    }

    /* 2️⃣ Prevent double billing */
    const billCheck = await client.query(
      `SELECT id FROM bills WHERE job_card_id = $1`,
      [jobCardId]
    );

    if (billCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Bill already generated" });
    }

    /* 3️⃣ Mark job card as completed */
    await client.query(
      `UPDATE job_cards SET status = 'COMPLETED' WHERE id = $1`,
      [jobCardId]
    );

    /* 4️⃣ Calculate parts cost */
    const partsRes = await client.query(
      `
      SELECT i.price, jcp.quantity
      FROM job_card_parts jcp
      JOIN inventory i ON jcp.inventory_id = i.id
      WHERE jcp.job_card_id = $1
      `,
      [jobCardId]
    );

    let partsAmount = 0;
    for (const p of partsRes.rows) {
      partsAmount += Number(p.price) * Number(p.quantity);
    }

    /* 5️⃣ Get service charge from booking */
    const bookingRes = await client.query(
      `
      SELECT service_charge
      FROM bookings
      WHERE id = $1
      `,
      [jcRes.rows[0].booking_id]
    );

    const serviceCharge = Number(bookingRes.rows[0]?.service_charge || 0);
    const totalAmount = serviceCharge + partsAmount;

    /* 6️⃣ Insert bill */
    await client.query(
      `
      INSERT INTO bills
        (job_card_id, service_charge, parts_amount, total_amount)
      VALUES
        ($1,$2,$3,$4)
      `,
      [jobCardId, serviceCharge, partsAmount, totalAmount]
    );

    await client.query("COMMIT");

    res.json({
      message: "Job card completed and bill generated",
      bill: {
        serviceCharge,
        partsAmount,
        totalAmount,
      },
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Complete job card + billing error:", err);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

// POST /api/service-center/job-cards/:id/bill
router.post("/job-cards/:id/bill", async (req, res) => {
  const client = await pool.connect();

  try {
    const user = getUserFromReq(req);
    if (!user || user.role !== "service_center") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const jobCardId = req.params.id;
    const { labor_charge, parts, tax, discount } = req.body;

    if (
      labor_charge == null ||
      !Array.isArray(parts) ||
      tax == null ||
      discount == null
    ) {
      return res.status(400).json({ message: "Labor charge, tax and discount are mandatory" });
    }

    await client.query("BEGIN");

    // validate job card
    const jcRes = await client.query(
      `
      SELECT id
      FROM job_cards
      WHERE id = $1 AND service_center_id = $2 AND status = 'IN_PROGRESS'
      `,
      [jobCardId, user.id]
    );

    if (jcRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Job card not found" });
    }

    let sparePartsTotal = 0;

    if (Array.isArray(parts) && parts.length > 0) {
      for (const p of parts) {
        if (p.unit_price == null || p.unit_price < 0) {
          await client.query("ROLLBACK");
          return res.status(400).json({ message: "Invalid part price" });
        }

        const partRes = await client.query(
          `
      SELECT quantity
      FROM job_card_parts
      WHERE id = $1 AND job_card_id = $2
      `,
          [p.job_card_part_id, jobCardId]
        );

        if (partRes.rows.length === 0) {
          await client.query("ROLLBACK");
          return res.status(400).json({ message: "Invalid job part" });
        }

        const qty = Number(partRes.rows[0].quantity);
        sparePartsTotal += qty * Number(p.unit_price);

        await client.query(
          `
      UPDATE job_card_parts
      SET unit_price = $1
      WHERE id = $2
      `,
          [p.unit_price, p.job_card_part_id]
        );
      }
    }


    const total =
      Number(labor_charge) +
      sparePartsTotal +
      Number(tax) -
      Number(discount);

    await client.query(
      `
      INSERT INTO job_card_bills
      (job_card_id, labor_charge, spare_parts_charge, tax, discount, total_amount)
      VALUES ($1,$2,$3,$4,$5,$6)
      `,
      [
        jobCardId,
        labor_charge,
        sparePartsTotal,
        tax,
        discount,
        total,
      ]
    );

    await client.query(
      `
      UPDATE job_cards
      SET status = 'COMPLETED'
      WHERE id = $1
      `,
      [jobCardId]
    );

    await client.query("COMMIT");
    res.json({ message: "Service completed & bill generated" });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Billing error:", err);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});


// GET /api/service-center/job-cards/:id/invoice
router.get("/job-cards/:id/invoice", async (req, res) => {
  try {
    const user = getUserFromReq(req);
    if (!user || user.role !== "service_center") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const jobCardId = req.params.id;

    const billRes = await pool.query(
      `
      SELECT 
        jc.id AS job_card_id,
        b.vehicle,
        b.service_type,
        m.name AS mechanic_name,
        jb.*
      FROM job_cards jc
      JOIN bookings b ON jc.booking_id = b.id
      JOIN mechanics m ON jc.mechanic_id = m.id
      JOIN job_card_bills jb ON jb.job_card_id = jc.id
      WHERE jc.id = $1 AND jc.service_center_id = $2
      `,
      [jobCardId, user.id]
    );

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
    console.error("Invoice fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});



// GET /api/service-center/job-cards/:id/invoice/pdf
router.get("/job-cards/:id/invoice/pdf", async (req, res) => {
  try {
    const user = getUserFromReq(req);
    if (!user || user.role !== "service_center") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const jobCardId = req.params.id;

    const result = await pool.query(
      `
      SELECT 
        b.vehicle,
        b.service_type,
        m.name AS mechanic_name,
        jb.*
      FROM job_cards jc
      JOIN bookings b ON jc.booking_id = b.id
      JOIN mechanics m ON jc.mechanic_id = m.id
      JOIN job_card_bills jb ON jb.job_card_id = jc.id
      WHERE jc.id = $1 AND jc.service_center_id = $2
      `,
      [jobCardId, user.id]
    );
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


    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const data = result.rows[0];

    const doc = new PDFDocument({ margin: 40 });

    doc.registerFont(
      "NotoSans",
      "./fonts/NotoSans-Regular.ttf"
    );

    doc.font("NotoSans");
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${jobCardId}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(18).text("SVMMS Invoice", { align: "center" });
    doc.moveDown();

    doc.fontSize(12);
    doc.text(`Vehicle: ${data.vehicle}`);
    doc.text(`Service Type: ${data.service_type}`);
    doc.text(`Mechanic: ${data.mechanic_name}`);
    doc.moveDown();

    doc.text(`Labor Charge: ₹${data.labor_charge}`);
    doc.moveDown();

    doc.text("Spare Parts:");
    if (!partsRes.rows || partsRes.rows.length === 0) {
      doc.text("NA");
    } else {
      partsRes.rows.forEach((p, index) => {
        doc.text(
          `${index + 1}) ${p.part_name} × ${p.quantity} @ ₹${p.unit_price} = ₹${p.amount}`
        );
      });
    }
    doc.moveDown();

    doc.text(`Tax: ₹${data.tax}`);
    doc.text(`Discount: ₹${data.discount}`);
    doc.moveDown();

    doc.fontSize(14).text(`Total Amount: ₹${data.total_amount}`, {
      underline: true,
    });

    doc.end();
  } catch (err) {
    console.error("Invoice PDF error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/dashboard", async (req, res) => {
  try {
    const user = getUserFromReq(req);
    if (!user || user.role !== "service_center") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const mechanicsRes = await pool.query(
      `SELECT COUNT(*) FROM mechanics WHERE service_center_id = $1`,
      [user.id]
    );

    const activeJobsRes = await pool.query(
      `SELECT COUNT(*) FROM job_cards
       WHERE service_center_id = $1 AND status = 'IN_PROGRESS'`,
      [user.id]
    );

    const pendingReqRes = await pool.query(
      `
      SELECT COUNT(*)
      FROM bookings b
      WHERE b.status = 'pending'
      AND NOT EXISTS (
        SELECT 1 FROM job_cards jc
        WHERE jc.booking_id = b.id
      )
      `
    );

    const recentJobsRes = await pool.query(
      `
      SELECT
        jc.id,
        jc.status,
        b.vehicle,
        jc.issue,
        m.name AS mechanic_name,
        COALESCE(jb.total_amount, 0) AS amount
      FROM job_cards jc
      JOIN bookings b ON b.id = jc.booking_id
      JOIN mechanics m ON m.id = jc.mechanic_id
      LEFT JOIN job_card_bills jb ON jb.job_card_id = jc.id
      WHERE jc.service_center_id = $1
      ORDER BY jc.created_at DESC
      LIMIT 5
      `,
      [user.id]
    );

    res.json({
      stats: {
        mechanics: Number(mechanicsRes.rows[0].count),
        activeJobs: Number(activeJobsRes.rows[0].count),
        pendingRequests: Number(pendingReqRes.rows[0].count),
      },
      recentJobCards: recentJobsRes.rows,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET spare parts of a job card
router.get("/job-cards/:id/parts", async (req, res) => {
  try {
    const user = getUserFromReq(req);
    if (!user || user.role !== "service_center") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const result = await pool.query(
      `
      SELECT 
        jcp.id,
        jcp.inventory_id,
        jcp.quantity,
        i.part_name
      FROM job_card_parts jcp
      JOIN inventory i ON i.id = jcp.inventory_id
      JOIN job_cards jc ON jc.id = jcp.job_card_id
      WHERE jcp.job_card_id = $1
        AND jc.service_center_id = $2
      `,
      [req.params.id, user.id]
    );

    res.json({ parts: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});




export default router;
