const mongoose = require('mongoose');

const QuizStatisticsSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
    unique: true
  },
  totalAttempts: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  highestScore: {
    type: Number,
    default: 0
  },
  lowestScore: {
    type: Number,
    default: 0
  },
  attemptsByYear: [{
    yearOfStudy: {
      type: Number,
      required: true
    },
    count: {
      type: Number,
      default: 0
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Update lastUpdated on save
QuizStatisticsSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

module.exports = mongoose.model('QuizStatistics', QuizStatisticsSchema);