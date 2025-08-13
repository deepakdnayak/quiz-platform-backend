const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['Student', 'Instructor', 'Admin'],
    default: 'Student'
  },
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    unique: true // Ensures one-to-one relationship with Profile
  },
  isApproved: {
    type: Boolean,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  resetOTP: {
    type: String,
    default: null // Stores the OTP for password reset
  },
  resetOTPExpires: {
    type: Date,
    default: null // Stores the expiration time of the OTP
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Update updatedAt on save
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', UserSchema);