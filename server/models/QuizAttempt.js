const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  userId: String, // For future user authentication
  sessionId: String,
  answers: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    selectedAnswer: String,
    selectedOptions: [String],
    isCorrect: Boolean,
    timeSpent: Number, // in seconds
    pointsEarned: Number
  }],
  score: {
    totalPoints: Number,
    earnedPoints: Number,
    percentage: Number
  },
  timeSpent: Number, // total time in seconds
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'abandoned'],
    default: 'in-progress'
  }
}, {
  timestamps: true
});

quizAttemptSchema.index({ quiz: 1, completedAt: -1 });
quizAttemptSchema.index({ userId: 1, completedAt: -1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);