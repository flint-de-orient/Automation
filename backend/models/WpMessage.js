const mongoose = require("mongoose");

const wpMessageSchema = new mongoose.Schema({
  number:    { type: String, required: true, trim: true },
  name:      { type: String, default: "", trim: true },
  sender:    { type: String, enum: ["user", "ai"], required: true },
  message:   { type: String, default: "" },
  image:     { type: String, default: null },
  timestamp: { type: Date, default: Date.now },
});

wpMessageSchema.index({ number: 1, timestamp: 1 });

module.exports = mongoose.model("WpMessage", wpMessageSchema, "wp_messages");
