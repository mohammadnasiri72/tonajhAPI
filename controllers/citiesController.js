const { connectToDatabase } = require("../config/db");

exports.getcities = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { provinceId } = req.query;

    if (!provinceId) {
      return res.status(404).json({
        success: false,
        message: "مجموعه شهرها یافت نشد",
      });
    }

    const cities = await db
      .collection("cities")
      .find({ province_id: Number(provinceId) })
      .toArray();
    if (!cities) {
      return res.status(404).json({
        success: false,
        message: "مجموعه شهرها یافت نشد",
      });
    }

    res.json({
      success: true,
      cities: cities,
    });
  } catch (error) {
    console.error("Error fetching province:", error);
    res.status(500).json({
      success: false,
      message: "خطا در دریافت شهر ها",
    });
  }
};
