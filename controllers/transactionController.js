const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const { connectToDatabase } = require("../config/db");
const buyTransactionSchema = require("../models/transactionSchema");

exports.getTransactionBuy = async (req, res) => {
  try {
    const db = await connectToDatabase();
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "لطفا وارد سیستم شوید",
      });
    }

    // 2) تأیید توکن
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) بررسی وجود کاربر
    // const currentUser = await User.findById(decoded.id);
    const currentUser = await db.collection("users").findOne({
      _id: new ObjectId(decoded.id),
    });

    if (!currentUser) {
      return res.status(401).json({
        status: "fail",
        message: "کاربر مربوط به این توکن وجود ندارد",
      });
    }

    const transaction = await db
      .collection("transaction")
      .find({ autherId: decoded.id })
      .toArray();

    // تبدیل ObjectId به string برای فرانت‌اند
    const transactionWithStringId = transaction.map((category) => ({
      ...category,
      _id: category._id.toString(),
    }));

    res.json({
      items: transactionWithStringId,
      count: transactionWithStringId.length,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "خطا در دریافت آگهی‌ها",
      error: error.message,
    });
  }
};

exports.getTransactionSell = async (req, res) => {
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

    const categories = await db.collection("categorys").toArray();

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

exports.createTransactionBuy = async (req, res) => {
  const { error, value } = buyTransactionSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ message: "فرمت داده نامعتبره", details: error.details });
  }

  try {
    const db = await connectToDatabase();

    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "لطفا وارد سیستم شوید",
      });
    }

    // 2) تأیید توکن
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) بررسی وجود کاربر
    // const currentUser = await User.findById(decoded.id);
    const currentUser = await db.collection("users").findOne({
      _id: new ObjectId(decoded.id),
    });

    if (!currentUser) {
      return res.status(401).json({
        status: "fail",
        message: "کاربر مربوط به این توکن وجود ندارد",
      });
    }

    const transactionData = {
      ...value,
      status: 1,
      statusTitle: "منتظر تایید",
      createdAt: new Date(),
      updatedAt: new Date(),
      autherId: decoded.id,
      autherName: currentUser.firstName,
      autherFamily: currentUser.lastName,
    };
    const result = await db
      .collection("transaction")
      .insertOne(transactionData);

    res
      .status(201)
      .send("آگهی با موفقیت ثبت گردید لطفا منتظر تایید ادمین بمانید");
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(500).send("خطا در ثبت آگهی");
  }
};
exports.createTransactionSell = async (req, res) => {
  const { error, value } = buyTransactionSchema.validate(req.body);
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

exports.updateTransactionBuy = async (req, res) => {
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
exports.updateTransactionSell = async (req, res) => {
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

exports.deleteTransactionBuy = async (req, res) => {
  const transactionId = req.params.id;

  try {
    const db = await connectToDatabase();

    // بررسی وجود دسته‌بندی
    const transaction = await db.collection("transaction").findOne({
      _id: new ObjectId(transactionId),
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "آگهی پیدا نشد",
      });
    }

    

    // حذف آگهی
    const result = await db.collection("transaction").deleteOne({
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
exports.deleteTransactionSell = async (req, res) => {
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
