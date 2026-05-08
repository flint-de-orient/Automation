const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const scheduleSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true },
    phone: { type: String, required: true },
    date:  { type: String, required: true },
    time:  { type: String, required: true },
  },
  { timestamps: true }
);

const Schedule = mongoose.models.Schedule || mongoose.model("Schedule", scheduleSchema, "shedule");

router.post("/", async (req, res) => {
  const { name, phone, date, time } = req.body;
  if (!name || !phone || !date || !time) {
    return res.status(400).json({ error: "All fields are required" });
  }
  try {
    const entry = await Schedule.create({ name, phone, date, time });
    console.log("[POST /api/schedule] Saved:", entry);
    return res.status(201).json({ message: "Schedule saved", data: entry });
  } catch (err) {
    console.error("[POST /api/schedule] ERROR:", err.message);
    return res.status(500).json({ error: "Failed to save schedule" });
  }
});

router.get("/", async (req, res) => {
  try {
    const entries = await Schedule.find().sort({ createdAt: -1 });
    return res.json(entries);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
