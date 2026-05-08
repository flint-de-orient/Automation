const express = require("express");
const { getFbConversations, getFbMessages, saveFbMessage } = require("../controllers/fbController");

const router = express.Router();

router.get("/conversations",        getFbConversations);
router.get("/messages",             getFbMessages);      // ?senderId=...
router.get("/messages/:senderId",   getFbMessages);      // /:senderId fallback
router.post("/messages",            saveFbMessage);

module.exports = router;
