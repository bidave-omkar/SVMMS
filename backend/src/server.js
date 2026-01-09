// backend\src\Server.js
import http from "http";
import { Server as IOServer } from "socket.io";
import sequelize from "./config/db.js";
import app from "../app.js";
import dotenv from "dotenv";

dotenv.config();

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log("Postgres connection OK");

    await sequelize.sync();
    console.log("Models synchronized.");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log("Backend running"));

    const httpServer = http.createServer(app);

    const io = new IOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
      },
    });

    // expose socket to routes
    app.locals.io = io;

    io.on("connection", (socket) => {
      console.log("Socket connected:", socket.id);
    });

    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("Unable to start server:", err);
    process.exit(1);
  }
};

start();
