const express = require("express");
const { getFbConversations, getFbMessages, saveFbMessage, sendToWebhook } = require("../controllers/fbController");

const router = express.Router();

router.get("/conversations",        getFbConversations);
router.get("/messages",             getFbMessages);
router.get("/messages/:senderId",   getFbMessages);
router.post("/messages",            saveFbMessage);
router.post("/send",                sendToWebhook);

module.exports = router;
