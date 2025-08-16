const Joi = require("joi");

const categorySchema = Joi.object({
  title: Joi.string().min(2).max(100).required(),
  parentId: Joi.string().required(),
  img: Joi.string().optional()
});

module.exports = categorySchema;
