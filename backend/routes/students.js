const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Student = require('../models/Student');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/students
router.get('/', async (req, res, next) => {
  try {
    const { search, class: cls, page = 1, limit = 50 } = req.query;
    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (cls) filter.class = cls;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [students, total] = await Promise.all([
      Student.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Student.countDocuments(filter),
    ]);

    // Attach task counts
    const studentIds = students.map((s) => s._id);
    const taskCounts = await Task.aggregate([
      { $match: { student: { $in: studentIds } } },
      { $group: { _id: '$student', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } },
    ]);
    const taskMap = {};
    taskCounts.forEach((t) => { taskMap[t._id.toString()] = t; });

    const enriched = students.map((s) => ({
      ...s,
      taskStats: taskMap[s._id.toString()] || { total: 0, completed: 0 },
    }));

    res.json({ students: enriched, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
});

// GET /api/students/:id
router.get('/:id', async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).lean();
    if (!student || !student.isActive) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    const tasks = await Task.find({ student: student._id }).sort({ dueDate: 1 }).lean();
    res.json({ student, tasks });
  } catch (err) {
    next(err);
  }
});

// POST /api/students
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('rollNumber').trim().notEmpty().withMessage('Roll number is required').isLength({ max: 20 }),
    body('class').trim().notEmpty().withMessage('Class is required'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email'),
    body('phone').optional({ checkFalsy: true }).matches(/^[0-9+\-\s]{7,15}$/).withMessage('Invalid phone'),
    body('gender').optional().isIn(['Male', 'Female', 'Other']),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const existing = await Student.findOne({ rollNumber: req.body.rollNumber.toUpperCase() });
      if (existing) {
        return res.status(409).json({ error: 'A student with this roll number already exists.' });
      }

      const student = await Student.create(req.body);
      res.status(201).json({ student });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/students/:id
router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty().isLength({ max: 100 }),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email'),
    body('phone').optional({ checkFalsy: true }).matches(/^[0-9+\-\s]{7,15}$/).withMessage('Invalid phone'),
    body('gender').optional().isIn(['Male', 'Female', 'Other']),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Prevent changing rollNumber to an existing one
      if (req.body.rollNumber) {
        const existing = await Student.findOne({
          rollNumber: req.body.rollNumber.toUpperCase(),
          _id: { $ne: req.params.id },
        });
        if (existing) {
          return res.status(409).json({ error: 'Roll number already in use.' });
        }
      }

      const student = await Student.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!student) return res.status(404).json({ error: 'Student not found.' });
      res.json({ student });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/students/:id  (soft delete)
router.delete('/:id', async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!student) return res.status(404).json({ error: 'Student not found.' });
    res.json({ message: 'Student deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
