const { connectToDatabase } = require("../config/db");

exports.getprovince = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const provinces = await db.collection("provinces").find({}).toArray();

    if (!provinces) {
      return res.status(404).json({
        success: false,
        message: "مجموعه استان‌ها یافت نشد",
      });
    }

    res.json({
      success: true,
      province: provinces,
    });
  } catch (error) {
    console.error("Error fetching province:", error);
    res.status(500).json({
      success: false,
      message: "خطا در دریافت استان ها",
    });
  }
};
