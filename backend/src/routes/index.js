const express = require("express");
const router = express.Router();

const {receiveId} = require("../controllers/idController");
const {transcriptContr} = require("../controllers/baseUrlController");
const {searchContr} = require("../controllers/searchController")
const {saveContr} = require("../controllers/saveController")

router.post("/send-id", receiveId);
router.post("/transcript", transcriptContr);
router.post("/search", searchContr);
router.post("/save", saveContr);


module.exports = router;