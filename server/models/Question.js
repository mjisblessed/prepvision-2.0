const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true
  },
  questionType: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'short-answer', 'essay', 'fill-blank'],
    required: true
  },
  options: [{
    text: String,
    isCorrect: Boolean
  }],
  correctAnswer: String,
  explanation: String,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  subject: {
    type: String,
    required: true
  },
  topics: [String],
  keywords: [String],
  sourcePaper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionPaper'
  },
  generatedBy: {
    type: String,
    enum: ['ai', 'extracted', 'manual'],
    default: 'ai'
  },
  bloomLevel: {
    type: String,
    enum: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']
  },
  estimatedTime: {
    type: Number, // in minutes
    default: 2
  },
  usageCount: {
    type: Number,
    default: 0
  },
  performance: {
    correctAnswers: { type: Number, default: 0 },
    totalAttempts: { type: Number, default: 0 },
    averageTime: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

questionSchema.index({ subject: 1, difficulty: 1 });
questionSchema.index({ topics: 1 });
questionSchema.index({ generatedBy: 1 });

module.exports = mongoose.model('Question', questionSchema);