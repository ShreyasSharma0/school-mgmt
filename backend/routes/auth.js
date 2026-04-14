const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const { protect } = require('../middleware/auth');

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/login
router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password } = req.body;

      const admin = await Admin.findOne({ username }).select('+password');
      if (!admin || !(await admin.comparePassword(password))) {
        return res.status(401).json({ error: 'Invalid username or password.' });
      }

      const token = signToken(admin._id);

      res.json({
        token,
        admin: {
          id: admin._id,
          username: admin.username,
          name: admin.name,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/setup  (creates first admin — disabled if admin already exists)
router.post(
  '/setup',
  [
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('setupKey').notEmpty().withMessage('Setup key is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { setupKey } = req.body;
      if (setupKey !== process.env.SETUP_KEY) {
        return res.status(403).json({ error: 'Invalid setup key.' });
      }

      const existingAdmin = await Admin.findOne({});
      if (existingAdmin) {
        return res.status(409).json({ error: 'Admin already exists.' });
      }

      const admin = await Admin.create({
        username: req.body.username,
        password: req.body.password,
        name: req.body.name,
      });

      const token = signToken(admin._id);

      res.status(201).json({
        token,
        admin: { id: admin._id, username: admin.username, name: admin.name },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ admin: req.admin });
});

// POST /api/auth/change-password
router.post(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const admin = await Admin.findById(req.admin._id).select('+password');
      if (!(await admin.comparePassword(req.body.currentPassword))) {
        return res.status(401).json({ error: 'Current password is incorrect.' });
      }

      admin.password = req.body.newPassword;
      await admin.save();

      res.json({ message: 'Password changed successfully.' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
