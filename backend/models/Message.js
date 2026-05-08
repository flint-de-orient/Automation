const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  email:     { type: String, required: true, trim: true },
  name:      { type: String, required: true, trim: true },
  sender:    { type: String, enum: ["user", "ai"], required: true },
  message:   { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

messageSchema.index({ email: 1, timestamp: 1 });

module.exports = mongoose.model("Message", messageSchema, "messages");
