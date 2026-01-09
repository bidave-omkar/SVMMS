// src/routes/admin.js
import express from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

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

function buildReportFilters(query, params) {
  let where = "";

  if (query.from && query.to) {
    params.push(query.from, query.to);
    where += ` AND jc.created_at BETWEEN $${params.length - 1} AND $${params.length}`;
  }

  if (query.service_type) {
    params.push(query.service_type);
    where += ` AND b.service_type = $${params.length}`;
  }

  if (query.vehicle_model) {
    params.push(query.vehicle_model);
    where += ` AND v.model = $${params.length}`;
  }

  if (query.service_center_id) {
    params.push(query.service_center_id);
    where += ` AND jc.service_center_id = $${params.length}`;
  }

  if (query.job_status) {
    params.push(query.job_status);
    where += ` AND jc.status = $${params.length}`;
  }

  return where;
}



/* ===============================
   GET /api/admin/stats
   =============================== */
router.get("/stats", async (req, res) => {
  try {
    const user = getUserFromReq(req);

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    /* ---- QUERIES ---- */
    const usersQ = await pool.query(`SELECT COUNT(*) FROM users`);
    const completedQ = await pool.query(
      `SELECT COUNT(*) FROM job_cards WHERE status = 'COMPLETED'`
    );
    const lowStockQ = await pool.query(
      `SELECT COUNT(*) FROM inventory WHERE stock < 3`
    );

    res.json({
      totalUsers: Number(usersQ.rows[0].count),
      completedServices: Number(completedQ.rows[0].count),
      lowStock: Number(lowStockQ.rows[0].count),
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
/* ===============================
   GET /api/admin/notifications
   =============================== */
router.get("/notifications", async (req, res) => {
  try {
    const user = getUserFromReq(req);

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const result = await pool.query(`
  SELECT
    an.id,
    an.type,
    an.message,
    an.created_at,
    an.is_read,
    an.status
  FROM admin_notifications an
  JOIN inventory i ON an.inventory_id = i.id
  WHERE an.status = 'PENDING'
    AND i.stock < 3
  ORDER BY an.created_at DESC
  LIMIT 20
`);

    res.json({ notifications: result.rows });
  } catch (err) {
    console.error("Admin notifications error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
/* ===============================
   INVENTORY MANAGEMENT
   =============================== */

/**
 * GET /api/admin/inventory
 */
router.get("/inventory", async (req, res) => {
  try {
    const q = `
      SELECT id, part_name, category, stock, price
      FROM inventory
      ORDER BY part_name ASC
    `;
    const { rows } = await pool.query(q);
    res.json({ items: rows });
  } catch (err) {
    console.error("Inventory fetch error:", err);
    res.status(500).json({ message: "Failed to load inventory" });
  }
});

/**
 * POST /api/admin/inventory
 */
router.post("/inventory", async (req, res) => {
  try {
    const { part_name, category, stock, price } = req.body;

    if (!part_name || !category || stock == null || price == null) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const q = `
      INSERT INTO inventory (part_name, category, stock, price)
      VALUES ($1,$2,$3,$4)
      RETURNING *
    `;
    const { rows } = await pool.query(q, [
      part_name,
      category,
      stock,
      price,
    ]);

    res.json({ item: rows[0] });
  } catch (err) {
    console.error("Inventory insert error:", err);
    res.status(500).json({ message: "Failed to add part" });
  }
});

/**
 * PUT /api/admin/inventory/:id/stock
 */
router.put("/inventory/:id/stock", async (req, res) => {
  try {
    const { stock, price } = req.body;
    const inventoryId = req.params.id;

    await pool.query(
      `
      UPDATE inventory
      SET stock = $1,
          price = $2
      WHERE id = $3
      `,
      [stock, price, inventoryId]
    );

    // resolve low-stock alerts
    if (stock >= 3) {
      await pool.query(
        `
        UPDATE admin_notifications
        SET status = 'RESOLVED', is_read = true
        WHERE type = 'LOW_STOCK'
          AND inventory_id = $1
          AND status = 'PENDING'
        `,
        [inventoryId]
      );
    }

    res.json({ message: "Stock & price updated, alerts resolved" });
  } catch (err) {
    console.error("Update inventory error", err);
    res.status(500).json({ message: "Server error" });
  }
});



/* ===============================
   GET /api/admin/reports/overview
   =============================== */
router.get("/reports/overview", async (req, res) => {
  try {
    const user = getUserFromReq(req);

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const [
      customers,
      serviceCenters,
      vehicles,
      bookings,
      completedJobs,
      invoices
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM users`),
      pool.query(`SELECT COUNT(*) FROM service_centers`),
      pool.query(`SELECT COUNT(*) FROM vehicles`),
      pool.query(`SELECT COUNT(*) FROM bookings`),
      pool.query(`SELECT COUNT(*) FROM job_cards WHERE status = 'COMPLETED'`),
      pool.query(`SELECT COUNT(*) FROM job_card_bills`)
    ]);

    res.json({
      totalCustomers: Number(customers.rows[0].count),
      totalServiceCenters: Number(serviceCenters.rows[0].count),
      totalVehicles: Number(vehicles.rows[0].count),
      totalBookings: Number(bookings.rows[0].count),
      completedJobCards: Number(completedJobs.rows[0].count),
      totalInvoices: Number(invoices.rows[0].count)
    });
  } catch (err) {
    console.error("Overview report error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ===============================
   GET /api/admin/reports/service-activity
   =============================== */
router.get("/reports/service-activity", async (req, res) => {
  try {
    const user = getUserFromReq(req);

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    /* 1️⃣ Most serviced vehicles (TEXT vehicle name from bookings) */
    const vehicleStats = await pool.query(`
      SELECT
        b.vehicle AS vehicle_name,
        COUNT(jc.id) AS service_count
      FROM job_cards jc
      JOIN bookings b ON jc.booking_id = b.id
      GROUP BY b.vehicle
      ORDER BY service_count DESC
      LIMIT 10
    `);

    /* 2️⃣ Most common service types */
    const serviceTypeStats = await pool.query(`
      SELECT
        b.service_type,
        COUNT(jc.id) AS count
      FROM job_cards jc
      JOIN bookings b ON jc.booking_id = b.id
      GROUP BY b.service_type
      ORDER BY count DESC
    `);

    /* 3️⃣ Service frequency over time (monthly) */
    const serviceTrend = await pool.query(`
      SELECT
        DATE_TRUNC('month', jc.created_at) AS month,
        COUNT(*) AS count
      FROM job_cards jc
      GROUP BY month
      ORDER BY month
    `);

    res.json({
      mostServicedVehicles: vehicleStats.rows,
      serviceTypes: serviceTypeStats.rows,
      serviceTrend: serviceTrend.rows
    });
  } catch (err) {
    console.error("Service activity report error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ===============================
   GET /api/admin/reports/inventory
   =============================== */
router.get("/reports/inventory", async (req, res) => {
  try {
    const user = getUserFromReq(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    // date filter: week | month | older | all
    const range = req.query.range || "all";

    let dateCondition = "";
    if (range === "week") {
      dateCondition = "AND jc.created_at >= NOW() - INTERVAL '7 days'";
    } else if (range === "month") {
      dateCondition = "AND jc.created_at >= NOW() - INTERVAL '30 days'";
    } else if (range === "older") {
      dateCondition = "AND jc.created_at < NOW() - INTERVAL '30 days'";
    }

    const query = `
      SELECT
        i.id,
        i.part_name,
        COALESCE(SUM(jcp.quantity), 0) AS used_quantity,
        i.stock AS remaining_stock,
        CASE
          WHEN i.stock < 3 THEN 'LOW'
          ELSE 'OK'
        END AS reorder_status
      FROM inventory i
      LEFT JOIN job_card_parts jcp ON jcp.inventory_id = i.id
      LEFT JOIN job_cards jc ON jc.id = jcp.job_card_id
      ${dateCondition}
      GROUP BY i.id, i.part_name, i.stock
      ORDER BY used_quantity DESC
      LIMIT 10;
    `;

    const result = await pool.query(query);

    res.json(result.rows);
  } catch (err) {
    console.error("Inventory report error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


/* ===============================
   GET /api/admin/reports/revenue
   =============================== */
router.get("/reports/revenue", async (req, res) => {
  try {
    const user = getUserFromReq(req);

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    /* 1️⃣ TOTAL + LABOR VS PARTS */
    const summaryQ = `
      SELECT
        SUM(b.total_amount) AS total_revenue,
        SUM(b.labor_charge) AS labor_revenue,
        SUM(b.spare_parts_charge) AS parts_revenue
      FROM job_card_bills b
      JOIN job_cards jc ON jc.id = b.job_card_id
      WHERE jc.status = 'COMPLETED'
    `;

    /* 2️⃣ MONTHLY REVENUE */
    const monthlyQ = `
      SELECT
        DATE_TRUNC('month', b.created_at) AS month,
        SUM(b.total_amount) AS revenue
      FROM job_card_bills b
      JOIN job_cards jc ON jc.id = b.job_card_id
      WHERE jc.status = 'COMPLETED'
      GROUP BY month
      ORDER BY month
    `;

    /* 3️⃣ REVENUE PER SERVICE CENTER */
    const byCenterQ = `
      SELECT
        sc.id,
        sc.organization AS service_center,
        SUM(b.total_amount) AS revenue
      FROM job_card_bills b
      JOIN job_cards jc ON jc.id = b.job_card_id
      JOIN service_centers sc ON sc.id = jc.service_center_id
      WHERE jc.status = 'COMPLETED'
      GROUP BY sc.id
      ORDER BY revenue DESC
    `;

    /* 4️⃣ INVOICE TABLE */
    const invoicesQ = `
      SELECT
        b.id AS invoice_id,
        b.total_amount,
        b.created_at,
        sc.organization AS service_center
      FROM job_card_bills b
      JOIN job_cards jc ON jc.id = b.job_card_id
      JOIN service_centers sc ON sc.id = jc.service_center_id
      WHERE jc.status = 'COMPLETED'
      ORDER BY b.created_at DESC
      LIMIT 50
    `;

    const [
      summary,
      monthly,
      byCenter,
      invoices
    ] = await Promise.all([
      pool.query(summaryQ),
      pool.query(monthlyQ),
      pool.query(byCenterQ),
      pool.query(invoicesQ)
    ]);

    res.json({
      summary: summary.rows[0],
      monthlyRevenue: monthly.rows,
      revenueByCenter: byCenter.rows,
      invoices: invoices.rows
    });

  } catch (err) {
    console.error("Revenue report error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


/* ===============================
   GET /api/admin/reports/status
   =============================== */
router.get("/reports/status", async (req, res) => {
  try {
    const user = getUserFromReq(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { from, to } = req.query;

    let bookingDateFilter = "";
    let jobDateFilter = "";
    let completionDateFilter = "";

    if (from && to) {
      bookingDateFilter = `AND b.created_at BETWEEN $1 AND $2`;
      jobDateFilter = `AND jc.created_at BETWEEN $1 AND $2`;
      completionDateFilter = `AND b.created_at BETWEEN $1 AND $2`;
    }

    /* 1️⃣ BOOKING STATUS */
    const bookingStatusQ = `
      SELECT
        LOWER(b.status) AS status,
        COUNT(*) AS count
      FROM bookings b
      WHERE 1=1
      ${bookingDateFilter}
      GROUP BY b.status
      ORDER BY count DESC
    `;

    /* 2️⃣ JOB CARD STATUS */
    const jobStatusQ = `
      SELECT
        jc.status,
        COUNT(*) AS count
      FROM job_cards jc
      WHERE 1=1
      ${jobDateFilter}
      GROUP BY jc.status
      ORDER BY count DESC
    `;

    /* 3️⃣ AVG COMPLETION TIME */
    const avgCompletionQ = `
      SELECT
        COUNT(*) AS completed_jobs,
        AVG(
          EXTRACT(EPOCH FROM (b.created_at - jc.created_at)) / 3600
        ) AS avg_hours
      FROM job_cards jc
      JOIN job_card_bills b ON b.job_card_id = jc.id
      WHERE jc.status = 'COMPLETED'
      ${completionDateFilter}
    `;

    const params = from && to ? [from, to] : [];

    const [bookingStatus, jobStatus, avgCompletion] = await Promise.all([
      pool.query(bookingStatusQ, params),
      pool.query(jobStatusQ, params),
      pool.query(avgCompletionQ, params)
    ]);

    res.json({
      bookingStatus: bookingStatus.rows,
      jobCardStatus: jobStatus.rows,
      completionMetrics: {
        completedJobs: Number(avgCompletion.rows[0].completed_jobs),
        avgHours: Number(avgCompletion.rows[0].avg_hours || 0).toFixed(2)
      }
    });

  } catch (err) {
    console.error("Status report error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ===============================
   GET /api/admin/reports/filtered
   =============================== */

router.get("/reports/filtered", async (req, res) => {
  try {
    const user = getUserFromReq(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const params = [];
    const filters = buildReportFilters(req.query, params);

    /* SUMMARY */
    const summaryQ = `
      SELECT
        COUNT(*) AS total_jobs,
        COUNT(*) FILTER (WHERE jc.status = 'COMPLETED') AS completed_jobs,
        COALESCE(SUM(bill.total_amount), 0) AS total_revenue
      FROM job_cards jc
      JOIN bookings b ON b.id = jc.booking_id
      LEFT JOIN job_card_bills bill ON bill.job_card_id = jc.id
      LEFT JOIN vehicles v ON v.user_id = b.created_by::int
      WHERE 1=1
      ${filters}
    `;

    /* TABLE DATA */
    const tableQ = `
      SELECT
        jc.id AS job_card_id,
        b.service_type,
        v.model AS vehicle_model,
        jc.status,
        bill.total_amount,
        jc.created_at
      FROM job_cards jc
      JOIN bookings b ON b.id = jc.booking_id
      LEFT JOIN job_card_bills bill ON bill.job_card_id = jc.id
      LEFT JOIN vehicles v ON v.user_id = b.created_by::int
      WHERE 1=1
      ${filters}
      ORDER BY jc.created_at DESC
      LIMIT 100
    `;

    const [summary, table] = await Promise.all([
      pool.query(summaryQ, params),
      pool.query(tableQ, params)
    ]);

    res.json({
      summary: summary.rows[0],
      table: table.rows
    });

  } catch (err) {
    console.error("Filtered report error:", err);
    res.status(500).json({ message: "Server error" });
  }
});



/* ===============================
   GET /api/admin/reports/export
   =============================== */
router.get("/reports/export", async (req, res) => {
  try {
    const user = getUserFromReq(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { from, to, service_type, vehicle_model, service_center_id, job_status } = req.query;

    const rows = await pool.query(
      `
      SELECT
        jc.id AS job_card_id,
        b.service_type,
        v.model AS vehicle_model,
        jc.status,
        bill.total_amount,
        jc.created_at
      FROM job_cards jc
      JOIN bookings b ON b.id = jc.booking_id
      LEFT JOIN job_card_bills bill ON bill.job_card_id = jc.id
      LEFT JOIN vehicles v ON v.user_id = b.created_by::int
      WHERE
        ($1::date IS NULL OR jc.created_at >= $1)
        AND ($2::date IS NULL OR jc.created_at <= $2)
        AND ($3 = '' OR b.service_type ILIKE '%' || $3 || '%')
        AND ($4 = '' OR v.model ILIKE '%' || $4 || '%')
        AND ($5 = '' OR jc.service_center_id::text = $5)
        AND ($6 = '' OR jc.status = $6)
      ORDER BY jc.created_at DESC
      `,
      [
        from || null,
        to || null,
        service_type || "",
        vehicle_model || "",
        service_center_id || "",
        job_status || ""
      ]
    );

    let csv = "Job Card,Service Type,Vehicle Model,Status,Amount,Date\n";
    rows.rows.forEach(r => {
      csv += `${r.job_card_id},${r.service_type},${r.vehicle_model || ""},${r.status},${r.total_amount || 0},${r.created_at}\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=admin_report.csv");
    res.status(200).send(csv);

  } catch (err) {
    console.error("Export CSV error:", err);
    res.status(500).json({ message: "CSV export failed" });
  }
});


export default router;