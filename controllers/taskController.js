const {taskSchema, patchTaskSchema} = require("../validation/taskSchema");
const pool = require("../db/pg-pool");

async function create(req, res) {
  const {error, value} = taskSchema.validate(req.body, {abortEarly: false});

  if (error) {
    return res.status(400).json({
      message: error.message
    });
  }
  const result = await pool.query(
    `INSERT INTO tasks (title, is_completed, user_id)
  VALUES ( $1, $2, $3 ) RETURNING id, title, is_completed`,
    [value.title, value.isCompleted, global.user_id]
  );
  const task = result.rows[0];

  const sanitizedTask = {
    id: task.id,
    title: task.title,
    isCompleted: task.is_completed
  };

  return res.status(201).json(sanitizedTask);
}

async function index(req, res) {
  const result = await pool.query(
    "SELECT id, title, is_completed FROM tasks WHERE user_id = $1",
    [global.user_id]
  );
  const tasks = result.rows;

  if (tasks.length === 0) {
    return res.status(404).send();
  }
  return res.status(200).json(tasks);
}

async function show(req, res) {
  const taskId = parseInt(req.params?.id);
  if (Number.isNaN(taskId)) {
    return res.status(400).send();
  }
  const result = await pool.query(
    `SELECT id,title,is_completed FROM tasks WHERE
    id=$1 AND user_id= $2`,
    [taskId, global.user_id]
  );

  if (!result.rows.length) {
    return res.status(404).send();
  }

  res.status(200).json(result);
}

async function update(req, res) {
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

  let keys = Object.keys(value);
  keys = keys.map((key) => (key === "isCompleted" ? "is_completed" : key));
  const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
  const idParm = `$${keys.length + 1}`;
  const userParm = `$${keys.length + 2}`;
  const result = await pool.query(
    `UPDATE tasks SET ${setClauses}
  WHERE id = ${idParm} AND user_id = ${userParm} RETURNING id, title, is_completed`,
    [...Object.values(value), taskId, global.user_id]
  );
  const updatedTask = result.rows[0];

  if (!updatedTask) {
    return res.status(404).send();
  }


  return res.status(200).json(updatedTask);
}

async function deleteTask(req, res) {
  const taskId = parseInt(req.params?.id);
  if (Number.isNaN(taskId)) {
    return res.status(400).send();
  }

  const result = await pool.query(
    "DELETE FROM tasks WHERE user_id = $1 AND id=$2 RETURNING id, title, is_completed",
    [global.user_id, taskId]
  );
  if (result.rows.length === 0) {
    return res.status(404).send();
  }
  const deletedTask = result.rows[0];
  
  return res.status(200).json(deletedTask);
}

module.exports = {create, index, show, update, deleteTask};
