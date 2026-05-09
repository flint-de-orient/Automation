const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true },
    phone: { type: String, required: true },
    date:  { type: String, required: true },
    time:  { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Schedule || mongoose.model("Schedule", scheduleSchema, "shedule");
