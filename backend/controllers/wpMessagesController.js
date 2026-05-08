const WpMessage = require("../models/WpMessage");

const getWpMessages = async (req, res) => {
  try {
    // Accept both /wp/messages?number=... and /wp/messages/:number
    const number = decodeURIComponent(
      (req.query.number || req.params.number || "").trim()
    ).trim();

    if (!number) return res.status(400).json({ error: "number is required" });

    const messages = await WpMessage.find({
      $expr: { $eq: [{ $trim: { input: "$number" } }, number] }
    })
      .sort({ timestamp: 1 })
      .select("sender message image timestamp -_id");

    console.log(`[GET /wp/messages] ${messages.length} messages for ${number}`);
    return res.json(messages);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const saveWpMessage = async (req, res) => {
  try {
    // Accept number / from / waId / phone from n8n
    const number  = (req.body.number || req.body.from || req.body.waId || req.body.phone || "").trim();
    const name    = (req.body.name   || req.body.pushName || "").trim();
    const message = (req.body.message || req.body.text || req.body.body || "").trim();
    const image   = req.body.image || null;
    const sender  = req.body.sender || "user";

    console.log("BODY:", req.body);

    if (!number || (!message && !image)) {
      return res.status(400).json({ error: "number and either message or image are required" });
    }
    if (!["user", "ai"].includes(sender)) {
      return res.status(400).json({ error: "sender must be 'user' or 'ai'" });
    }

    const saved = await WpMessage.create({ number, name, message, image, sender, timestamp: new Date() });

    // Emit real-time event
    const io = req.app.get("io");
    if (io) {
      io.to(number).emit("new_message", saved);
      io.emit("conversation_updated", { number, name, lastMessage: message, lastTimestamp: saved.timestamp });
    }

    console.log("SAVED:", saved);
    return res.status(201).json({ success: true, data: saved });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { getWpMessages, saveWpMessage };
