// backend/src/server.js
import http from "http";
import { Server as IOServer } from "socket.io";
import app from "../app.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // ✅ Create HTTP server ONCE
    const httpServer = http.createServer(app);

    // ✅ Attach Socket.IO to the same server
    const io = new IOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"],
      },
    });

    // expose socket instance
    app.locals.io = io;

    io.on("connection", (socket) => {
      console.log("Socket connected:", socket.id);
    });

    // ✅ ONLY ONE listen
    httpServer.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
    });

  } catch (err) {
    console.error("Unable to start server:", err);
    process.exit(1);
  }
};

start();
