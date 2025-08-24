const express = require("express");
const router = express.Router();
const {
  sendOtp,
  checkMobile,
  login,
  register,
} = require("../controllers/authController");

router.post("/sendOtp", sendOtp);
router.post("/checkMobile", checkMobile);
router.post("/login", login);
router.post("/register", register);


module.exports = router;