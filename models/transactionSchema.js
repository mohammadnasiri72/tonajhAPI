const Joi = require("joi");

const buyTransactionSchema = Joi.object({
  categoryId: Joi.string().required(),
  categoryTitle: Joi.string().required(),
  type: Joi.string().required(),
  unitAmount: Joi.number().required(),
  unit: Joi.string().required(),
  description: Joi.string().optional().allow(""),
});

module.exports = buyTransactionSchema;
