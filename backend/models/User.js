const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, trim: true, unique: true },
  password:    { type: String, required: true },
  role:        { type: String, default: "Admin" },
  avatarColor: { type: String, default: "from-violet-400 to-fuchsia-500" },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema, "users");
