const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  subject: {
    type: String,
    required: true
  },
  questions: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    points: {
      type: Number,
      default: 1
    }
  }],
  settings: {
    timeLimit: Number, // in minutes
    randomizeQuestions: { type: Boolean, default: false },
    randomizeOptions: { type: Boolean, default: false },
    showCorrectAnswers: { type: Boolean, default: true },
    allowRetakes: { type: Boolean, default: true },
    passingScore: { type: Number, default: 70 }
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'mixed'],
    default: 'mixed'
  },
  topics: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: String,
  totalAttempts: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

quizSchema.index({ subject: 1, difficulty: 1 });
quizSchema.index({ topics: 1 });
quizSchema.index({ isActive: 1 });

module.exports = mongoose.model('Quiz', quizSchema);