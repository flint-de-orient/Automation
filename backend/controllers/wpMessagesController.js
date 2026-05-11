const WpMessage = require("../models/WpMessage");

// Treat "null"/"undefined" strings (from upstream JSON-as-text mistakes) as missing.
const isBadString = (v) => {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "" || s === "null" || s === "undefined";
};
const firstValid = (...vals) => {
  for (const v of vals) if (!isBadString(v)) return String(v).trim();
  return "";
};

const getWpMessages = async (req, res) => {
  try {
    // Accept both /wp/messages?number=... and /wp/messages/:number
    const number = decodeURIComponent(
      (req.query.number || req.params.number || "").trim()
    ).trim();

    if (!number) return res.status(400).json({ error: "number is required" });

    const raw = await WpMessage.find({
      $expr: { $eq: [{ $trim: { input: "$number" } }, number] }
    })
      .sort({ timestamp: 1 })
      .select("sender message image timestamp -_id")
      .lean();

    // Drop messages that are pure garbage ("null"/"undefined" text and no image)
    const messages = raw
      .map((m) => ({
        ...m,
        message: isBadString(m.message) ? "" : m.message,
        image:   isBadString(m.image)   ? null : m.image,
      }))
      .filter((m) => m.message || m.image);

    console.log(`[GET /wp/messages] ${messages.length} messages for ${number}`);
    return res.json(messages);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const saveWpMessage = async (req, res) => {
  try {
    // Accept number / from / waId / phone from n8n
    const number  = firstValid(req.body.number, req.body.from, req.body.waId, req.body.phone);
    const name    = firstValid(req.body.name, req.body.pushName);
    const message = firstValid(req.body.message, req.body.text, req.body.body);
    const image   = isBadString(req.body.image) ? null : req.body.image;
    const sender  = req.body.sender || "user";

    console.log("BODY:", req.body);

    if (!number || !/\d/.test(number) || (!message && !image)) {
      return res.status(400).json({ error: "valid number and either message or image are required" });
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
