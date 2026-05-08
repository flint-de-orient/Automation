const express = require("express");
const { getMessages, saveMessage } = require("../controllers/messagesController");

const router = express.Router();

router.get("/:email", getMessages);
router.post("/", saveMessage);

module.exports = router;
