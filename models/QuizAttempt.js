const mongoose = require('mongoose');

const QuizAttemptSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  isScored: {
    type: Boolean,
    required: true
  },
  answers: [{
    questionId: {
      type: String,
      required: true
    },
    selectedOptionIds: [{
      type: String
    }],
    isCorrect: {
      type: Boolean,
      required: true
    },
    scoreAwarded: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  totalScore: {
    type: Number,
    required: true,
    min: 0
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
QuizAttemptSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

QuizAttemptSchema.index({ quizId: 1 });
QuizAttemptSchema.index({ userId: 1 });
QuizAttemptSchema.index({ isScored: 1 });
QuizAttemptSchema.index({ createdAt: 1 });

module.exports = mongoose.model('QuizAttempt', QuizAttemptSchema);