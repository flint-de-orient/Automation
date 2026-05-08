const Message = require("../models/Message");

const getConversations = async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      { $addFields: { email: { $trim: { input: "$email" } } } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: { $toLower: { $trim: { input: "$email" } } },
          name:          { $last: "$name" },
          lastMessage:   { $first: "$message" },
          lastTimestamp: { $first: "$timestamp" },
        },
      },
      { $sort: { lastTimestamp: -1 } },
      {
        $project: {
          _id: 0,
          email:         "$_id",
          name:          1,
          lastMessage:   1,
          lastTimestamp: 1,
        },
      },
    ]);

    console.log(`[GET /conversations] ${conversations.length} conversations`);
    return res.json(conversations);
  } catch (err) {
    console.error("[GET /conversations] ERROR:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getConversations };
