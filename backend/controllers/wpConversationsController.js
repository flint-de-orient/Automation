const WpMessage = require("../models/WpMessage");

const BAD_STRINGS = ["", "null", "undefined", "Null", "NULL", "Undefined", "UNDEFINED"];

const getWpConversations = async (req, res) => {
  try {
    const conversations = await WpMessage.aggregate([
      // Drop docs where number is missing or literally "null"/"undefined"
      { $match: { number: { $exists: true, $nin: [null, ...BAD_STRINGS] } } },
      { $addFields: { number: { $trim: { input: "$number" } } } },
      // After trim, drop again and require at least one digit
      { $match: { number: { $nin: BAD_STRINGS }, $expr: { $regexMatch: { input: "$number", regex: /\d/ } } } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id:           "$number",
          name:          { $last: "$name" },
          lastMessage:   { $first: "$message" },
          lastTimestamp: { $first: "$timestamp" },
        },
      },
      { $match: { _id: { $nin: [null, ...BAD_STRINGS] } } },
      // Blank out "null"/"undefined" names and messages so the frontend shows fallbacks
      {
        $addFields: {
          name: { $cond: [{ $in: [{ $ifNull: ["$name", ""] }, BAD_STRINGS] }, "", "$name"] },
          lastMessage: { $cond: [{ $in: [{ $ifNull: ["$lastMessage", ""] }, BAD_STRINGS] }, "", "$lastMessage"] },
        },
      },
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
