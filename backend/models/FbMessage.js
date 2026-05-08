const mongoose = require("mongoose");

const fbMessageSchema = new mongoose.Schema({
  sender_id: { type: String, required: true, trim: true },
  name:      { type: String, default: "", trim: true },
  sender:    { type: String, enum: ["user", "ai"], required: true },
  message:   { type: String, default: "" },
  image:     { type: String, default: null },
  timestamp: { type: Date, default: Date.now },
}, { collection: "fb_messages" });

fbMessageSchema.index({ sender_id: 1, timestamp: 1 });

module.exports = mongoose.model("FbMessage", fbMessageSchema);
