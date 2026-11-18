const Joi = require("joi");

const taskSchema = Joi.object({
  title: Joi.string().trim().min(3).max(30).required(),
  isCompleted: Joi.boolean().default(false).not(null),
  priority: Joi.string().valid("low", "medium", "high").default("medium")
});

const patchTaskSchema = Joi.object({
  title: Joi.string().trim().min(3).max(30).not(null),
  isCompleted: Joi.boolean().not(null),
  priority: Joi.string().valid("low", "medium", "high")
})
  .min(1)
  .message("No attributes to change were specified.");

const paginationSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10)
}).unknown(true);

const taskFilterSchema = Joi.object({
  isCompleted: Joi.boolean(),
  priority: Joi.string().valid("low", "medium", "high"),
  min_date: Joi.date(),
  max_date: Joi.date()
});

module.exports = {
  taskSchema,
  patchTaskSchema,
  paginationSchema,
  taskFilterSchema
};
