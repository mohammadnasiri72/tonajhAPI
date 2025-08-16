

// const express = require("express");
// const cors = require("cors");
// const { MongoClient, ObjectId } = require("mongodb");
// const Joi = require("joi");
// require("dotenv").config();

// const app = express();

// app.use(cors());
// app.use(express.json());


// const dbConnection = new MongoClient(process.env.MAINDOMAIN);
// const dbName = process.env.DBNAME;

// const categorySchema = Joi.object({
//   title: Joi.string().min(2).max(100).required(),
//   parentId: Joi.number().required(),
//   img: Joi.string().optional()
// });


// app.get("/api/categorys", async (req, res) => {
//   try {
//     await dbConnection.connect();
//     const db = dbConnection.db(dbName);
//     const categorys = await db.collection("categorys").find().toArray();
//     res.json(categorys);
//   } catch (error) {
//     console.error("Error fetching products:", error);
//     res.status(500).send("Internal Server Error");
//   } finally {
//     await dbConnection.close(); // اختیاریه، می‌تونی اتصال رو باز نگه داری
//   }
// });
// app.post("/api/categorys", async (req, res) => {
//   try {
//     const { error, value } = categorySchema.validate(req.body);
//     if (error) {
//       return res.status(400).json({ message: "فرمت داده نامعتبره", details: error.details });
//     }

//     await dbConnection.connect();
//     const db = dbConnection.db(dbName);
//     const result = await db.collection("categorys").insertOne(value);
//     res.status(201).json(result);
//   } catch (error) {
//     console.error("Error adding category:", error);
//     res.status(500).send("مشکلی در افزودن دیتا پیش اومده");
//   } finally {
//     await dbConnection.close();
//   }
// });
// app.delete("/api/categorys/:id", async (req, res) => {
//   try {
//     await dbConnection.connect();
//     const db = dbConnection.db(dbName);
//     const categoryId = req.params.id;

//     const result = await db.collection("categorys").deleteOne({
//       _id: new ObjectId(categoryId)
//     });

//     if (result.deletedCount === 1) {
//       res.status(200).send("دسته‌بندی با موفقیت حذف شد");
//     } else {
//       res.status(404).send("دسته‌بندی پیدا نشد");
//     }
//   } catch (error) {
//     console.error("Error deleting category:", error);
//     res.status(500).send("خطا در حذف دسته‌بندی");
//   } finally {
//     await dbConnection.close();
//   }
// });
// app.put("/api/categorys/:id", async (req, res) => {
//   try {
//     await dbConnection.connect();
//     const db = dbConnection.db(dbName);
//     const categoryId = req.params.id;
//     const updatedData = req.body;

//     const result = await db.collection("categorys").updateOne(
//       { _id: new ObjectId(categoryId) },
//       { $set: updatedData }
//     );

//     if (result.modifiedCount === 1) {
//       res.status(200).send("دسته‌بندی با موفقیت ویرایش شد");
//     } else {
//       res.status(404).send("دسته‌بندی پیدا نشد یا تغییری نکرد");
//     }
//   } catch (error) {
//     console.error("Error updating category:", error);
//     res.status(500).send("خطا در ویرایش دسته‌بندی");
//   } finally {
//     await dbConnection.close();
//   }
// });

// app.listen(process.env.PORT, () => {
//   console.log(`Server is running on port ${process.env.PORT}`);
// });



const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const categoryRoutes = require("./routes/categoryRoutes");
app.use("/api/categorys", categoryRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});