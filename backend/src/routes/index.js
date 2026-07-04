const express = require("express");
const router = express.Router();

const {receiveId} = require("../controllers/idController");
const {transcriptContr} = require("../controllers/baseUrlController");

router.post("/send-id", receiveId);
router.post("/transcript", transcriptContr);


module.exports = router;