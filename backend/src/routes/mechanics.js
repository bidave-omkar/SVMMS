// src/routes/mechanics.js
import express from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret";

function getUserFromReq(req) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.split(" ")[1];
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/* ADD mechanic */
router.post("/", async (req, res) => {
  try {
    const user = getUserFromReq(req);
    if (!user || user.role !== "service_center") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { name, phone, age, experience, skills } = req.body;

    const q = `
      INSERT INTO mechanics
      (service_center_id, name, phone, age, experience, skills)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
    `;

    const { rows } = await pool.query(q, [
      user.id,
      name,
      phone,
      age,
      experience,
      skills,
    ]);

    res.json({ mechanic: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* GET mechanics */
router.get("/me", async (req, res) => {
  try {
    const user = getUserFromReq(req);
    if (!user || user.role !== "service_center") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { rows } = await pool.query(
      `SELECT * FROM mechanics WHERE service_center_id=$1 ORDER BY created_at DESC`,
      [user.id]
    );

    res.json({ mechanics: rows });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* DELETE mechanic */
router.delete("/:id", async (req, res) => {
  const user = getUserFromReq(req);
  if (!user) return res.status(403).json({ message: "Forbidden" });

  await pool.query(
    `DELETE FROM mechanics WHERE id=$1 AND service_center_id=$2`,
    [req.params.id, user.id]
  );

  res.json({ message: "Deleted" });
});

// GET /api/mechanics/count/me
router.get("/count/me", async (req, res) => {
  try {
    const user = getUserFromReq(req);
    if (!user || user.role !== "service_center") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const q = `SELECT COUNT(*) FROM mechanics WHERE service_center_id = $1`;
    const { rows } = await pool.query(q, [user.id]);

    res.json({ count: Number(rows[0].count) });
  } catch (err) {
    console.error("Mechanic count error", err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
