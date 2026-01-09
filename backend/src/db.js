// src/db.js
import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.PGUSER || "postgres"}:${process.env.PGPASSWORD || "password"}@${process.env.PGHOST || "localhost"}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || "smart_vehicle_db"}`,
  // ssl: { rejectUnauthorized: false } // enable if using hosted DB requiring SSL
});