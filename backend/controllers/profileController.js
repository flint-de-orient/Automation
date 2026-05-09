const bcrypt = require("bcryptjs");
const User   = require("../models/User");

const seedAdmin = async () => {
  const existing = await User.findOne();
  if (!existing) {
    const hashed = await bcrypt.hash("123456", 10);
    await User.create({
      name:     "Sayantan Dhara",
      email:    "sayantand652@gmail.com",
      password: hashed,
      role:     "Admin",
    });
    console.log("✅ Admin user seeded");
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findOne().select("-password");
    if (!user) return res.status(404).json({ error: "No profile found" });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email)
      return res.status(400).json({ error: "name and email are required" });

    const user = await User.findOne();
    if (!user) return res.status(404).json({ error: "No profile found" });

    user.name  = name.trim();
    user.email = email.trim();

    if (password && password.trim())
      user.password = await bcrypt.hash(password.trim(), 10);

    await user.save();
    console.log("[PUT /profile] Updated:", user.name, user.email);
    return res.json({ success: true, data: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { getProfile, updateProfile, seedAdmin };
