const Joi = require("joi");

const userSchema = Joi.object({
  mobile: Joi.string().required(),
  firstName: Joi.string().min(2).max(100).required(),
  lastName: Joi.string().min(2).max(100).required(),
  provinceId: Joi.number().required(),
  cityId: Joi.number().required(),
});

module.exports = userSchema;
