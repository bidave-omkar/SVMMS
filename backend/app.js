// \backend\app.js
import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import authRoutes from "./src/routes/auth.js";
import bookingsRoute from "./src/routes/bookings.js";
import vehiclesRouter from "./src/routes/vehicles.js";
import mechanicsRoutes from "./src/routes/mechanics.js";
import adminRoutes from "./src/routes/admin.js";
import serviceCenterRoutes from "./src/routes/ServiceCenter.js";
import userRoutes from "./src/routes/user.js";
import paymentRoutes from "./src/routes/payments.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
}));

app.use(express.json());

// health check
app.get("/", (req, res) => res.send("Backend up"));
app.get("/api/health", (req, res) => res.json({ ok: true }));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingsRoute);
app.use("/api/vehicles", vehiclesRouter);
app.use("/api/admin", adminRoutes);
app.use("/api/mechanics", mechanicsRoutes);
app.use("/api/service-center", serviceCenterRoutes);
app.use("/api/user", userRoutes);
app.use("/api/payments", paymentRoutes);

export default app;
