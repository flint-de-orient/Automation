const express = require("express");
const { getWpConversations } = require("../controllers/wpConversationsController");
const { getWpMessages, saveWpMessage } = require("../controllers/wpMessagesController");

const router = express.Router();

router.get("/conversations",    getWpConversations);
router.get("/messages",         getWpMessages);       // ?number=+91...
router.get("/messages/:number", getWpMessages);       // /:number fallback
router.post("/messages",        saveWpMessage);

module.exports = router;
