const express = require("express");
const router = express.Router();
const {
  getcities,

} = require("../controllers/citiesController");

router.get("/", getcities);

module.exports = router;