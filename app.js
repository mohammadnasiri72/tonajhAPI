const express = require("express");
const cors = require("cors");
const categoryRoutes = require("./routes/categoryRoutes");
const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const provinceRoutes = require("./routes/provinceRoutes");
const citiesRoutes = require("./routes/citiesRoutes");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/categorys", categoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/transaction", transactionRoutes);
app.use("/api/province", provinceRoutes);
app.use("/api/cities", citiesRoutes);

module.exports = app;


