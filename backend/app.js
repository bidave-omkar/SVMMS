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

const allowedOrigins = [
  "http://localhost:3000",
  "https://svmms-teal.vercel.app"
];

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (Postman, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));

// ✅ SAFE preflight handling for Node 22
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});


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
