
const express = require("express");
const cors = require("cors");
const categoryRoutes = require("./routes/categoryRoutes");
const authRoutes = require("./routes/authRoutes");



require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/categorys", categoryRoutes);
app.use("/api/auth", authRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});