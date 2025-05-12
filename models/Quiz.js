const mongoose = require('mongoose');
const shortid = require('shortid');

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  yearOfStudy: {
    type: Number,
    required: [true, 'Please add year of study'],
    min: 1,
    max: 4
  },
  startTime: {
    type: Date,
    required: [true, 'Please add a start time']
  },
  endTime: {
    type: Date,
    required: [true, 'Please add an end time']
  },
  duration: {
    type: Number,
    required: [true, 'Please add a duration'],
    min: 1
  },
  questions: [{
    questionId: {
      type: String,
      default: shortid.generate
    },
    text: {
      type: String,
      required: [true, 'Please add question text']
    },
    options: [{
      optionId: {
        type: String,
        default: shortid.generate
      },
      text: {
        type: String,
        required: [true, 'Please add option text']
      },
      isCorrect: {
        type: Boolean,
        default: false
      }
    }],
    score: {
      type: Number,
      required: [true, 'Please add a score'],
      min: 1
    },
    correctOptionIds: [{
      type: String
    }]
  }],
  totalScore: {
    type: Number,
    default: 0
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

// Calculate totalScore and set correctOptionIds before saving
QuizSchema.pre('save', function(next) {
  this.totalScore = this.questions.reduce((sum, q) => sum + q.score, 0);
  this.questions.forEach(q => {
    q.correctOptionIds = q.options.filter(o => o.isCorrect).map(o => o.optionId);
  });
  this.updatedAt = Date.now();
  next();
});

QuizSchema.index({ instructorId: 1 });
QuizSchema.index({ yearOfStudy: 1 });
QuizSchema.index({ startTime: 1 });
QuizSchema.index({ endTime: 1 });

module.exports = mongoose.model('Quiz', QuizSchema);