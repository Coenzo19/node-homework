const {
  taskSchema,
  patchTaskSchema,
  querySchema
} = require("../validation/taskSchema");
const prisma = require("../db/prisma");

async function create(req, res) {
  const {error, value} = taskSchema.validate(req.body, {abortEarly: false});

  if (error) {
    return res.status(400).json({
      message: error.message
    });
  }

  const task = await prisma.task.create({
    data: {
      title: value.title,
      isCompleted: value.isCompleted,
      userId: req.user.id,
      priority: value.priority
    },
    select: {
      id: true,
      title: true,
      isCompleted: true,
      priority: true
    }
  });

  return res.status(201).json(task);
}

async function bulkCreate(req, res, next) {
  const {tasks} = req.body;

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({
      error: "Invalid request data. Expected an array of tasks."
    });
  }
  const validTasks = [];
  for (const task of tasks) {
    const {error, value} = taskSchema.validate(task);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details
      });
    }
    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted,
      priority: value.priority || "medium",
      userId: req.user.id
    });
  }
  try {
    const result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false
    });

    return res.status(201).json({
      message: "success!",
      tasksCreated: result.count,
      totalRequested: validTasks.length
    });
  } catch (e) {
    return next(e);
  }
}

async function index(req, res) {
  const whereClause = {userId: req.user.id};
  const dataFilter = {};

  const {error, value} = querySchema.validate(req.query, {
    abortEarly: false
  });
  if (error) {
    return res.status(400).json({
      message: error.message
    });
  }

  const skip = (value.page - 1) * value.limit;

  if (value.find) {
    whereClause.title = {
      contains: value.find,
      mode: "insensitive"
    };
  }
  if (value.isCompleted !== undefined) {
    whereClause.isCompleted = value.isCompleted;
  }
  if (value.priority) {
    whereClause.priority = value.priority;
  }
  if (value.min_date) {
    dataFilter.gte = value.min_date;
  }
  if (value.max_date) {
    dataFilter.lte = value.max_date;
  }
  if (Object.keys(dataFilter).length !== 0) {
    whereClause.createdAt = dataFilter;
  }

  const tasks = await prisma.task.findMany({
    where: whereClause,
    select: {
      id: true,
      title: true,
      isCompleted: true,
      priority: true,
      createdAt: true,
      User: {
        select: {
          name: true,
          email: true
        }
      }
    },
    take: value.limit,
    skip: skip,
    orderBy: {
      [value.sortBy]: value.sortDirection
    }
  });
  const totalTasks = await prisma.task.count({
    where: whereClause
  });

  const pagination = {
    page: value.page,
    limit: value.limit,
    total: totalTasks,
    pages: Math.ceil(totalTasks / value.limit),
    hasNext: value.page * value.limit < totalTasks,
    hasPrev: value.page > 1
  };
  return res.status(200).json({
    tasks,
    pagination
  });
}

async function show(req, res) {
  const taskId = parseInt(req.params?.id);
  if (Number.isNaN(taskId)) {
    return res.status(400).send();
  }

  const task = await prisma.task.findUnique({
    include: {
      User: {
        select: {
          name: true
        }
      }
    },
    where: {
      id: taskId,
      userId: req.user.id
    }
  });

  if (task === null) {
    return res.status(404).send();
  }

  res.status(200).json({
    title: task.title,
    isCompleted: task.isCompleted,
    User: task.User
  });
}

async function update(req, res, next) {
  const {error, value} = patchTaskSchema.validate(req.body, {
    abortEarly: false
  });
  if (error) {
    return res.status(400).json({
      message: error.message
    });
  }

  const taskId = parseInt(req.params?.id);
  if (Number.isNaN(taskId)) {
    return res.status(400).send();
  }
  try {
    const task = await prisma.task.update({
      data: value,
      where: {
        id: taskId,
        userId: req.user.id
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true
      }
    });

    return res.status(200).json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({message: "The task was not found."});
    } else {
      return next(err);
    }
  }
}

async function deleteTask(req, res, next) {
  const taskId = parseInt(req.params?.id);
  if (Number.isNaN(taskId)) {
    return res.status(400).send();
  }

  try {
    const deletedTask = await prisma.task.delete({
      where: {
        id: taskId,
        userId: req.user.id
      },
      select: {
        id: true,
        title: true,
        isCompleted: true
      }
    });

    return res.status(200).json(deletedTask);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({message: "The task was not found."});
    } else {
      return next(err);
    }
  }
}

module.exports = {create, index, show, update, deleteTask, bulkCreate};
