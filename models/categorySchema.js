const Joi = require("joi");

const categorySchema = Joi.object({
  title: Joi.string().min(2).max(100).required(),
  type: Joi.string().min(2).max(100).optional().allow(""),
  unit: Joi.string().min(2).max(100).optional().allow(null),
  parentId: Joi.string().required(),
  img: Joi.string().optional().allow(""),
  description: Joi.string().optional().allow(""),
  isActive: Joi.bool().required(),
});

module.exports = categorySchema;
