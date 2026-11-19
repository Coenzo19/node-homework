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

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  find: Joi.string().trim().error(new Error("testing find error")),
  isCompleted: Joi.boolean(),
  priority: Joi.string().valid("low", "medium", "high"),
  min_date: Joi.date(),
  max_date: Joi.date().when("min_date", {
    then: Joi.date().greater(Joi.ref("min_date")),
    otherwise: Joi.date()
  }),
  sortBy: Joi.string()
    .trim()
    .valid("title", "priority", "createdAt", "id", "isCompleted")
    .default("createdAt"),
  sortDirection: Joi.string().trim().valid("asc", "desc").default("desc")
});

module.exports = {
  taskSchema,
  patchTaskSchema,
  querySchema
};
