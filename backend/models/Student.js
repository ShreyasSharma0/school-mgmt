const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
      maxlength: [100, 'Name must be at most 100 characters'],
    },
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [20, 'Roll number must be at most 20 characters'],
    },
    class: {
      type: String,
      required: [true, 'Class is required'],
      trim: true,
      maxlength: [20, 'Class must be at most 20 characters'],
    },
    section: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [5, 'Section must be at most 5 characters'],
      default: 'A',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9+\-\s]{7,15}$/, 'Please enter a valid phone number'],
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
    },
    dateOfBirth: {
      type: Date,
    },
    address: {
      type: String,
      trim: true,
      maxlength: [300, 'Address must be at most 300 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for task count
studentSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'student',
});

studentSchema.index({ class: 1 });
studentSchema.index({ name: 'text' });

module.exports = mongoose.model('Student', studentSchema);
