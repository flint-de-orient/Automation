const WpMessage = require("../models/WpMessage");

const getWpConversations = async (req, res) => {
  try {
    const conversations = await WpMessage.aggregate([
      { $match: { number: { $exists: true, $ne: null, $ne: "" } } },
      { $addFields: { number: { $trim: { input: "$number" } } } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id:           "$number",
          name:          { $last: "$name" },
          lastMessage:   { $first: "$message" },
          lastTimestamp: { $first: "$timestamp" },
        },
      },
      { $match: { _id: { $ne: null, $ne: "" } } },
      { $sort: { lastTimestamp: -1 } },
      {
        $project: {
          _id: 0,
          number:        "$_id",
          name:          1,
          lastMessage:   1,
          lastTimestamp: 1,
        },
      },
    ]);

    console.log(`[GET /wp/conversations] ${conversations.length} conversations`);
    return res.json(conversations);
  } catch (err) {
    console.error("[GET /wp/conversations] ERROR:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getWpConversations };
