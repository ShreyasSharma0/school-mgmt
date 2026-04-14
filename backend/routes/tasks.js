const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/tasks
router.get('/', async (req, res, next) => {
  try {
    const { status, studentId, page = 1, limit = 100 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (studentId) filter.student = studentId;

    // Auto-mark overdue
    await Task.updateMany(
      { status: 'pending', dueDate: { $lt: new Date() } },
      { $set: { status: 'overdue' } }
    );

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('student', 'name rollNumber class section')
        .sort({ dueDate: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Task.countDocuments(filter),
    ]);

    // Stats
    const stats = await Task.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
    const statsMap = { pending: 0, 'in-progress': 0, completed: 0, overdue: 0 };
    stats.forEach((s) => { statsMap[s._id] = s.count; });

    res.json({ tasks, total, stats: statsMap, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('student', 'name rollNumber class section')
      .lean();
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
    body('student').notEmpty().withMessage('Student is required').isMongoId().withMessage('Invalid student ID'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('dueDate').isISO8601().withMessage('Valid due date is required'),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('description').optional().trim().isLength({ max: 1000 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const student = await Student.findById(req.body.student);
      if (!student || !student.isActive) {
        return res.status(404).json({ error: 'Student not found.' });
      }

      const task = await Task.create(req.body);
      await task.populate('student', 'name rollNumber class section');
      res.status(201).json({ task });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/tasks/:id
router.put(
  '/:id',
  [
    body('title').optional().trim().notEmpty().isLength({ max: 200 }),
    body('status').optional().isIn(['pending', 'in-progress', 'completed', 'overdue']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('dueDate').optional().isISO8601().withMessage('Valid due date is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const update = { ...req.body };
      if (update.status === 'completed' && !update.completedAt) {
        update.completedAt = new Date();
      }

      const task = await Task.findByIdAndUpdate(
        req.params.id,
        { $set: update },
        { new: true, runValidators: true }
      ).populate('student', 'name rollNumber class section');

      if (!task) return res.status(404).json({ error: 'Task not found.' });
      res.json({ task });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/tasks/:id/complete
router.patch('/:id/complete', async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'completed', completedAt: new Date() } },
      { new: true }
    ).populate('student', 'name rollNumber class section');

    if (!task) return res.status(404).json({ error: 'Task not found.' });
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    res.json({ message: 'Task deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
