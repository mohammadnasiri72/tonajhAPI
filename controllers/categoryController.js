const { ObjectId } = require("mongodb");
const { connectToDatabase } = require("../config/db");
const categorySchema = require("../models/categorySchema");

exports.getCategories = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { id, parentId, status, title } = req.query;

    // اگر ID مشخص شده باشد، فقط یک دسته‌بندی برگردان
    if (id) {
      const category = await db.collection("categorys").findOne({
        _id: new ObjectId(id),
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "دسته‌بندی پیدا نشد",
        });
      }

      return res.json({
        success: true,
        data: {
          ...category,
          _id: category._id.toString(),
        },
      });
    }

    // ایجاد فیلتر بر اساس query parameters
    const filter = {};

    if (parentId) {
      filter.parentId = parentId;
    }

    if (status) {
      filter.status = parseInt(status);
    }

    if (title) {
      filter.title = { $regex: title, $options: "i" }; // جستجوی case-insensitive
    }

    const categories = await db.collection("categorys").find(filter).toArray();

    // تبدیل ObjectId به string برای فرانت‌اند
    const categoriesWithStringId = categories.map((category) => ({
      ...category,
      _id: category._id.toString(),
    }));

    res.json({
      success: true,
      data: categoriesWithStringId,
      count: categoriesWithStringId.length,
      filters: Object.keys(filter).length > 0 ? filter : null,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "خطا در دریافت دسته‌بندی‌ها",
      error: error.message,
    });
  }
};

exports.createCategory = async (req, res) => {
  const { error, value } = categorySchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ message: "فرمت داده نامعتبره", details: error.details });
  }

  try {
    const db = await connectToDatabase();
    const categoryData = {
      ...value,
      status: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      order: 0,
    };
    const result = await db.collection("categorys").insertOne(categoryData);
    const url = `products/${result.insertedId}/${value.title
      .replace(/\s+/g, "-")
      .toLowerCase()}`;
    // به روزرسانی سند با فیلد url
    await db
      .collection("categorys")
      .updateOne({ _id: result.insertedId }, { $set: { url: url } });

    // نتیجه نهایی را برگردانید
    const finalCategory = await db
      .collection("categorys")
      .findOne({ _id: result.insertedId });

    res.status(201).json(finalCategory);
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(500).send("خطا در افزودن دسته‌بندی");
  }
};

exports.updateCategory = async (req, res) => {
  const categoryId = req.params.id;

  try {
    const { error, value } = categorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "داده‌های ورودی نامعتبر هستند",
        details: error.details,
      });
    }

    const db = await connectToDatabase();

    // بررسی وجود دسته‌بندی
    const existingCategory = await db.collection("categorys").findOne({
      _id: new ObjectId(categoryId),
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "دسته‌بندی مورد نظر پیدا نشد",
      });
    }

    // ایجاد داده‌های آپدیت - فقط فیلدهای مجاز
    const updateData = {
      title: value.title,
      parentId: value.parentId,
      description: value.description || existingCategory.description,
      img: value.img || existingCategory.img,
      updatedAt: new Date(),
      isActive: value.isActive,
    };

    // اگر parentId تغییر کرده، بررسی کنیم که ایجاد حلقه نکند
    if (value.parentId !== existingCategory.parentId) {
      if (value.parentId === categoryId) {
        return res.status(400).json({
          success: false,
          message: "دسته‌بندی نمی‌تواند والد خودش باشد",
        });
      }

      // بررسی حلقه در سلسله مراتب
      const hasCircularDependency = await checkCircularDependency(
        db,
        categoryId,
        value.parentId
      );

      if (hasCircularDependency) {
        return res.status(400).json({
          success: false,
          message: "امکان ایجاد حلقه در سلسله مراتب وجود دارد",
        });
      }
    }

    const result = await db
      .collection("categorys")
      .updateOne({ _id: new ObjectId(categoryId) }, { $set: updateData });

    if (result.modifiedCount === 1) {
      // گرفتن داده‌های به روز شده
      const updatedCategory = await db.collection("categorys").findOne({
        _id: new ObjectId(categoryId),
      });

      res.status(200).json({
        success: true,
        message: "دسته‌بندی با موفقیت ویرایش شد",
        data: {
          ...updatedCategory,
          _id: updatedCategory._id.toString(),
        },
      });
    } else {
      res.status(404).json({
        success: false,
        message: "دسته‌بندی پیدا نشد یا تغییری نکرد",
      });
    }
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      success: false,
      message: "خطا در ویرایش دسته‌بندی",
      error: error.message,
    });
  }
};

// تابع کمکی برای بررسی circular dependency
async function checkCircularDependency(db, categoryId, newParentId) {
  if (newParentId === "-1") return false; // والد ریشه حلقه ایجاد نمی‌کند

  let currentId = newParentId;
  const visited = new Set();

  while (currentId && currentId !== "-1") {
    if (visited.has(currentId)) return true; // حلقه پیدا شد
    if (currentId === categoryId) return true; // نمی‌تواند والد خودش یا فرزندانش باشد

    visited.add(currentId);

    const parentCategory = await db.collection("categorys").findOne({
      _id: new ObjectId(currentId),
    });

    if (!parentCategory) break;
    currentId = parentCategory.parentId;
  }

  return false;
}

exports.deleteCategory = async (req, res) => {
  const categoryId = req.params.id;

  try {
    const db = await connectToDatabase();

    // بررسی وجود دسته‌بندی
    const category = await db.collection("categorys").findOne({
      _id: new ObjectId(categoryId),
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "دسته‌بندی پیدا نشد",
      });
    }

    // بررسی اینکه آیا زیرمجموعه دارد
    const childCategories = await db
      .collection("categorys")
      .find({
        parentId: categoryId,
      })
      .toArray();

    if (childCategories.length > 0) {
      return res.status(400).json({
        success: false,
        message: "این دسته بندی دارای زیرمجموعه می باشد و قابل حذف نیست!!!",
      });
    }

    // حذف دسته‌بندی
    const result = await db.collection("categorys").deleteOne({
      _id: new ObjectId(categoryId),
    });

    if (result.deletedCount === 1) {
      res.status(200).json({
        success: true,
        message: "دسته‌بندی با موفقیت حذف شد",
        deletedCategory: {
          id: category._id.toString(),
          title: category.title,
        },
      });
    } else {
      res.status(404).json({
        success: false,
        message: "دسته‌بندی پیدا نشد",
      });
    }
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      success: false,
      message: "خطا در حذف دسته‌بندی",
      error: error.message,
    });
  }
};
