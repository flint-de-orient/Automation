const FbMessage = require("../models/FbMessage");

const getFbConversations = async (req, res) => {
  try {
    const conversations = await FbMessage.aggregate([
      { $match: { sender_id: { $exists: true, $ne: null, $ne: "" } } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id:           { $trim: { input: "$sender_id" } },
          name:          { $last: "$name" },
          lastMessage:   { $first: "$message" },
          lastTimestamp: { $first: "$timestamp" },
        },
      },
      { $match: { _id: { $ne: null, $ne: "" } } },
      { $sort: { lastTimestamp: -1 } },
      {
        $project: {
          _id:           0,
          senderId:      "$_id",
          name:          1,
          lastMessage:   1,
          lastTimestamp: 1,
        },
      },
    ]);

    console.log(`[GET /fb/conversations] ${conversations.length} conversations`);
    return res.json(conversations);
  } catch (err) {
    console.error("[GET /fb/conversations] ERROR:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

const getFbMessages = async (req, res) => {
  try {
    const senderId = (req.query.senderId || req.params.senderId || "").trim();
    if (!senderId) return res.status(400).json({ error: "senderId is required" });

    const messages = await FbMessage.find({
      $expr: { $eq: [{ $trim: { input: "$sender_id" } }, senderId] },
    })
      .sort({ timestamp: 1 })
      .select("sender message image timestamp -_id");

    console.log(`[GET /fb/messages] ${messages.length} messages for ${senderId}`);
    return res.json(messages);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const saveFbMessage = async (req, res) => {
  try {
    const sender_id = (req.body.senderId || req.body.sender_id || req.body.from || req.body.id || "").trim();
    const name      = (req.body.name || req.body.pushName || "").trim();
    const message   = (req.body.message || req.body.text || "").trim();
    const image     = req.body.image || null;
    const sender    = req.body.sender || "user";

    if (!sender_id || (!message && !image)) {
      return res.status(400).json({ error: "sender_id and message or image are required" });
    }
    if (!["user", "ai"].includes(sender)) {
      return res.status(400).json({ error: "sender must be 'user' or 'ai'" });
    }

    const saved = await FbMessage.create({ sender_id, name, message, image, sender, timestamp: new Date() });

    const io = req.app.get("io");
    if (io) {
      io.to(`fb_${sender_id}`).emit("fb_new_message", { ...saved.toObject(), senderId: sender_id });
      io.emit("fb_conversation_updated", { senderId: sender_id, name, lastMessage: message, lastTimestamp: saved.timestamp });
    }

    return res.status(201).json({ success: true, data: { ...saved.toObject(), senderId: sender_id } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { getFbConversations, getFbMessages, saveFbMessage };
