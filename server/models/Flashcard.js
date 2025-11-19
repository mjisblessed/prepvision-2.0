const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  front: {
    type: String,
    required: true
  },
  back: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  topics: [String],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  sourceQuestion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  },
  sourcePaper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionPaper'
  },
  tags: [String],
  spacedRepetition: {
    interval: { type: Number, default: 1 }, // days
    repetition: { type: Number, default: 0 },
    easeFactor: { type: Number, default: 2.5 },
    nextReview: { type: Date, default: Date.now },
    lastReviewed: Date
  },
  performance: {
    totalReviews: { type: Number, default: 0 },
    correctReviews: { type: Number, default: 0 },
    streakCount: { type: Number, default: 0 },
    lastResponse: {
      type: String,
      enum: ['again', 'hard', 'good', 'easy']
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

flashcardSchema.index({ subject: 1, difficulty: 1 });
flashcardSchema.index({ topics: 1 });
flashcardSchema.index({ 'spacedRepetition.nextReview': 1 });
flashcardSchema.index({ isActive: 1 });

module.exports = mongoose.model('Flashcard', flashcardSchema);