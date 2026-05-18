const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { getTasks, createTask, updateTask, deleteTask } = require('../controllers/taskController');

// ALL task routes require authentication
router.use(verifyToken);

router.get('/', getTasks);
router.post('/', createTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;