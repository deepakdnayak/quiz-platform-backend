const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: [true, 'Please add a first name'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Please add a last name'],
    trim: true
  },
  yearOfStudy: {
    type: Number,
    required: [true, 'Please add year of study'],
    min: 0,
    max: 4
  },
  department: {
    type: String,
    required: [true, 'Please add a department'],
    trim: true
  },
  rollNumber: {
    type: String,
    required: [true, 'Please add a roll number'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt on save
ProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

ProfileSchema.index({ yearOfStudy: 1 });

module.exports = mongoose.model('Profile', ProfileSchema);