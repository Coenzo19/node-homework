const {taskSchema, patchTaskSchema} = require("../validation/taskSchema");

const taskCounter = (() => {
  let lastTaskNumber = 0;
  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };
})();
function create(req, res) {
  const {error, value} = taskSchema.validate(req.body, {abortEarly: false});

  if (error) {
    return res.status(400).json({
      message: error.message
    });
  }

  const newTask = {
    id: taskCounter(),
    userId: global.user_id.email,
    ...value
  };
  global.tasks.push(newTask);
  const {userId, ...sanitizedTask} = newTask;
  return res.status(201).json(sanitizedTask);
}

function index(req, res) {
  const userTasks = global.tasks.filter(
    (task) => task.userId === global.user_id.email
  );

  if (userTasks.length === 0) {
    return res.status(404).send();
  }

  const sanitizedArray = userTasks.map((task) => {
    const {userId, ...sanitizedTask} = task;
    return sanitizedTask;
  });

  return res.status(200).json(sanitizedArray);
}

function show(req, res) {
  const taskId = parseInt(req.params?.id);
  if (Number.isNaN(taskId)) {
    return res.status(400).send();
  }
  const task = global.tasks.find(
    (task) => task.id === taskId && global.user_id.email === task.userId
  );
  if (!task) {
    return res.status(404).send();
  }
  const {userId, ...sanitizedTask} = task;
  res.status(200).json(sanitizedTask);
}

function update(req, res) {
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

  const task = global.tasks.find(
    (task) => task.id === taskId && global.user_id.email === task.userId
  );
  if (!task) {
    return res.status(404).send();
  }
  Object.assign(task, value);
  const {userId, ...sanitizedTask} = task;
  return res.status(200).json(sanitizedTask);
}

function deleteTask(req, res) {
  const taskId = parseInt(req.params?.id);
  if (Number.isNaN(taskId)) {
    return res.status(400).send();
  }
  const taskIndex = global.tasks.findIndex(
    (task) => task.id === taskId && global.user_id.email === task.userId
  );
  if (taskIndex === -1) {
    return res.status(404).send();
  }
  const deletedTask = global.tasks.splice(taskIndex, 1)[0];
  const {userId, ...sanitizedTask} = deletedTask;
  return res.status(200).json(sanitizedTask);
}

module.exports = {create, index, show, update, deleteTask};
