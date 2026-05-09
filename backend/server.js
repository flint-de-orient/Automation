require("dotenv").config();
const express    = require("express");
const http       = require("http");
const { Server } = require("socket.io");
const cors       = require("cors");

const connectDB  = require("./config/db");

const conversationsRouter = require("./routes/conversations");
const messagesRouter      = require("./routes/messages");
const chatRouter          = require("./routes/chat");
const profileRouter       = require("./routes/profile");
const wpRouter            = require("./routes/wp");
const fbRouter            = require("./routes/fb");
const scheduleRouter      = require("./routes/schedule");
const { seedAdmin }       = require("./controllers/profileController");

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: "*" } });
const PORT   = process.env.PORT || 5000;

app.use(cors({ origin: "*" }));
app.use(express.json());
app.set("io", io);

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ── Routes ──
app.use("/conversations", conversationsRouter);
app.use("/messages",      messagesRouter);
app.use("/api/chat",      chatRouter);
app.use("/profile",       profileRouter);
app.use("/wp",            wpRouter);
app.use("/fb",            fbRouter);
app.use("/api/schedule",  scheduleRouter);

// 404
app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.url} not found` }));

// Global error handler
app.use((err, req, res, next) => {
  console.error("[ERROR]", err.message);
  res.status(500).json({ error: err.message });
});

// ── Socket.io ──
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);
  socket.on("join", (number) => {
    socket.join(number);
    console.log(`Socket ${socket.id} joined room: ${number}`);
  });
  socket.on("disconnect", () => {
    console.log("🔌 Socket disconnected:", socket.id);
  });
});

// ── Start ──
const start = async () => {
  await connectDB();
  await seedAdmin();
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`   Local:        http://localhost:${PORT}`);
    console.log(`   n8n use this: http://192.168.1.14:${PORT}`);
  });
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") console.error(`❌ Port ${PORT} already in use`);
    else console.error("❌ Server error:", err.message);
    process.exit(1);
  });
};

start();
