const express = require("express");
const router = express.Router();
const {
  getprovince,

} = require("../controllers/provinceController");

router.get("/", getprovince);

module.exports = router;