const { ObjectId } = require("mongodb");
const dbClient = require("../config/db");
const categorySchema = require("../models/categorySchema");

const dbName = process.env.DBNAME;

exports.getCategories = async (req, res) => {
  try {
    await dbClient.connect();
    const db = dbClient.db(dbName);
    const categories = await db.collection("categorys").find().toArray();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).send("خطا در دریافت دسته‌بندی‌ها");
  } finally {
    await dbClient.close();
  }
};

exports.createCategory = async (req, res) => {
  const { error, value } = categorySchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: "فرمت داده نامعتبره", details: error.details });
  }

  try {
    await dbClient.connect();
    const db = dbClient.db(dbName);
    const result = await db.collection("categorys").insertOne(value);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(500).send("خطا در افزودن دسته‌بندی");
  } finally {
    await dbClient.close();
  }
};

exports.updateCategory = async (req, res) => {
  const categoryId = req.params.id;
  const { error, value } = categorySchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: "فرمت داده نامعتبره", details: error.details });
  }

  try {
    await dbClient.connect();
    const db = dbClient.db(dbName);
    const result = await db.collection("categorys").updateOne(
      { _id: new ObjectId(categoryId) },
      { $set: value }
    );

    if (result.modifiedCount === 1) {
      res.status(200).send("دسته‌بندی با موفقیت ویرایش شد");
    } else {
      res.status(404).send("دسته‌بندی پیدا نشد یا تغییری نکرد");
    }
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).send("خطا در ویرایش دسته‌بندی");
  } finally {
    await dbClient.close();
  }
};

exports.deleteCategory = async (req, res) => {
  const categoryId = req.params.id;

  try {
    await dbClient.connect();
    const db = dbClient.db(dbName);
    const result = await db.collection("categorys").deleteOne({
      _id: new ObjectId(categoryId)
    });

    if (result.deletedCount === 1) {
      res.status(200).send("دسته‌بندی با موفقیت حذف شد");
    } else {
      res.status(404).send("دسته‌بندی پیدا نشد");
    }
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).send("خطا در حذف دسته‌بندی");
  } finally {
    await dbClient.close();
  }
};
