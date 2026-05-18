const taskService = require('../services/taskService');
const { createTaskSchema, updateTaskSchema } = require('../validators/taskValidator');

const getTasks = async (req, res) => {
  const tasks = await taskService.getTasksByUserId(req.user.id);
  return res.status(200).json(tasks);
};

const createTask = async (req, res) => {
  const result = createTaskSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message });
  }

  const task = await taskService.createTask({ userId: req.user.id, ...result.data });
  return res.status(201).json(task);
};

const updateTask = async (req, res) => {
  const result = updateTaskSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message });
  }

  const task = await taskService.getTaskById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const updated = await taskService.updateTask(req.params.id, result.data);
  return res.status(200).json(updated);
};

const deleteTask = async (req, res) => {
  const task = await taskService.getTaskById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  await taskService.deleteTask(req.params.id);
  return res.status(204).send();
};

module.exports = { getTasks, createTask, updateTask, deleteTask };