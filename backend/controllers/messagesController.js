const Message = require("../models/Message");

const getMessages = async (req, res) => {
  try {
    const email = req.params.email.trim().toLowerCase();
    const messages = await Message.find({
      $expr: {
        $eq: [{ $toLower: { $trim: { input: "$email" } } }, email]
      }
    })
      .sort({ timestamp: 1 })
      .select("sender message timestamp -_id");

    console.log(`[GET /messages/${email}] ${messages.length} messages`);
    return res.json(messages);
  } catch (err) {
    console.error("[GET /messages] ERROR:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

const saveMessage = async (req, res) => {
  try {
    const { email, name, sender, message } = req.body;

    console.log("BODY:", req.body);

    if (!email || !name || !sender || !message) {
      return res.status(400).json({ success: false, error: "email, name, sender, and message are required" });
    }
    if (!["user", "ai"].includes(sender)) {
      return res.status(400).json({ success: false, error: "sender must be 'user' or 'ai'" });
    }

    const saved = await Message.create({ email, name, sender, message, timestamp: new Date() });

    console.log("SAVED:", saved);
    return res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error("[POST /messages] ERROR:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getMessages, saveMessage };
