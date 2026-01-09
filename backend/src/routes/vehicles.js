// src/routes/vehicles.js
import express from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db.js"; // your existing pool

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret";

/**
 * Helper: read token from Authorization header and return payload or null
 */
function getUserFromReq(req) {
    try {
        const auth = req.headers.authorization || "";
        if (!auth) return null;
        const parts = auth.split(" ");
        if (parts.length !== 2 || parts[0] !== "Bearer") return null;
        const token = parts[1];
        const payload = jwt.verify(token, JWT_SECRET);
        return payload; // contains id, role, email (based on your sign)
    } catch (err) {
        return null;
    }
}

/**
 * POST /api/vehicles
 * body: { name, model, vin, year, license_plate }
 * Requires Authorization: Bearer <token>
 */
router.post("/", async (req, res) => {
    try {
        const user = getUserFromReq(req);
        if (!user) return res.status(401).json({ message: "Unauthorized" });

        const { name, model, vin, year, license_plate } = req.body;
        // basic required validation
        if (!name || !model || !license_plate) {
            return res.status(400).json({ message: "Name, model and license_plate required" });
        }

        const insertQ = `INSERT INTO vehicles
      (user_id, user_name, name, model, vin, year, license_plate, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7, NOW()) RETURNING *`;
        // user_name: prefer firstName stored on client; token may not have name so accept email as fallback
        const userName = req.body.user_name || user.firstName || user.email || "user";
        const values = [user.id, userName, name, model, vin || null, year || null, license_plate];

        const { rows } = await pool.query(insertQ, values);
        return res.json({ message: "Vehicle saved", vehicle: rows[0] });
    } catch (err) {
        console.error("Vehicles POST error:", err);
        return res.status(500).json({ message: "Server error" });
    }
});

/**
 * GET /api/vehicles/me
 * returns vehicles for logged in user (sorted latest first)
 * Requires Authorization: Bearer <token>
 */
// GET /api/vehicles/me
router.get("/me", async (req, res) => {
    try {
        const user = getUserFromReq(req);
        if (!user) return res.status(401).json({ message: "Unauthorized" });

        const q = `SELECT * FROM vehicles WHERE user_id = $1 ORDER BY created_at DESC`;
        const { rows } = await pool.query(q, [user.id]);

        return res.json(rows); // 👈 FIX
    } catch (err) {
        console.error("Vehicles GET/me error:", err);
        return res.status(500).json({ message: "Server error" });
    }
});

// GET /api/vehicles/count/me
router.get("/count/me", async (req, res) => {
    try {
        const user = getUserFromReq(req);
        if (!user) return res.status(401).json({ message: "Unauthorized" });

        const result = await pool.query(
            "SELECT COUNT(*) FROM vehicles WHERE user_id = $1",
            [user.id]
        );

        res.json({ count: Number(result.rows[0].count) });
    } catch (err) {
        console.error("Vehicle count error:", err);
        res.status(500).json({ message: "Server error" });
    }
});


/**
 * Optionally: GET /api/vehicles (admin only or for debugging) - returns all vehicles
 */
router.get("/", async (req, res) => {
    try {
        // keep it open for now; in production restrict to admin
        const { rows } = await pool.query(`SELECT * FROM vehicles ORDER BY created_at DESC`);
        return res.json({ vehicles: rows });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
});


// DELETE /api/vehicles/:id  (delete only own vehicle)
router.delete("/:id", async (req, res) => {
    try {
        const user = getUserFromReq(req);
        if (!user) return res.status(401).json({ message: "Unauthorized" });

        const { id } = req.params;

        const q = `DELETE FROM vehicles WHERE id = $1 AND user_id = $2 RETURNING *`;
        const { rows } = await pool.query(q, [id, user.id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Vehicle not found" });
        }

        res.json({ message: "Vehicle deleted" });
    } catch (err) {
        console.error("Delete vehicle error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// UPDATE /api/vehicles/:id
router.put("/:id", async (req, res) => {
    try {
        const user = getUserFromReq(req);
        if (!user) return res.status(401).json({ message: "Unauthorized" });

        const { id } = req.params;
        const { name, model, vin, year, license_plate } = req.body;

        const q = `
          UPDATE vehicles
          SET name=$1, model=$2, vin=$3, year=$4, license_plate=$5
          WHERE id=$6 AND user_id=$7
          RETURNING *
        `;

        const { rows } = await pool.query(q, [
            name,
            model,
            vin || null,
            year || null,
            license_plate,
            id,
            user.id
        ]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Vehicle not found" });
        }

        res.json({ message: "Vehicle updated", vehicle: rows[0] });
    } catch (err) {
        console.error("Update vehicle error:", err);
        res.status(500).json({ message: "Server error" });
    }
});


// GET /api/vehicles/:id/in-use
router.get("/:id/in-use", async (req, res) => {
    try {
        const user = getUserFromReq(req);
        if (!user) return res.status(401).json({ message: "Unauthorized" });

        const { id } = req.params;

        // 1️⃣ Get vehicle text
        const vehicleRes = await pool.query(
            `
      SELECT name, model
      FROM vehicles
      WHERE id = $1 AND user_id = $2
      `,
            [id, user.id]
        );

        if (vehicleRes.rows.length === 0) {
            return res.status(404).json({ message: "Vehicle not found" });
        }

        const vehicleText = `${vehicleRes.rows[0].name} ${vehicleRes.rows[0].model}`;

        // 2️⃣ Block ONLY if booking is not fully closed
        const bookingRes = await pool.query(
            `
            SELECT 1
            FROM bookings b
            LEFT JOIN job_cards jc ON jc.booking_id = b.id
            WHERE b.vehicle ILIKE $1
                AND (
                b.status = 'pending'
                OR (
                    b.status = 'approved'
                    AND (jc.id IS NULL OR jc.status != 'COMPLETED')
                )
                OR (
                    jc.status = 'COMPLETED'
                    AND COALESCE(b.payment_status, 'pending') != 'paid'
                )
                )
            LIMIT 1
            `,
            [`%${vehicleText}%`]
        );

        if (bookingRes.rows.length > 0) {
            return res.json({ inUse: true });
        }


        // 3️⃣ Block: job IN_PROGRESS
        const jobRes = await pool.query(
            `
            SELECT 1
            FROM job_cards jc
            JOIN bookings b ON b.id = jc.booking_id
            WHERE b.vehicle ILIKE $1
                AND jc.status = 'IN_PROGRESS'
            LIMIT 1
            `,
            [`%${vehicleText}%`]
        );

        if (jobRes.rows.length > 0) {
            return res.json({ inUse: true, reason: "JOB_IN_PROGRESS" });
        }

        // 4️⃣ SAFE
        res.json({ inUse: false });

    } catch (err) {
        console.error("Vehicle usage check error:", err);
        res.status(500).json({ message: "Server error" });
    }
});



export default router;
