const Joi = require("joi");

const categorySchema = Joi.object({
  title: Joi.string().min(2).max(100).required(),
  parentId: Joi.string().required(),
  img: Joi.string().optional().allow(""),
  description: Joi.string().optional().allow(""),
  isActive: Joi.bool().required()
});

module.exports = categorySchema;
