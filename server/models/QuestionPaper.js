const mongoose = require('mongoose');

const questionPaperSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  extractedText: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  year: {
    type: Number
  },
  institution: {
    type: String
  },
  examType: {
    type: String,
    enum: ['midterm', 'final', 'quiz', 'assignment', 'practice', 'other'],
    default: 'other'
  },
  topics: [{
    name: String,
    frequency: { type: Number, default: 1 },
    keywords: [String]
  }],
  metadata: {
    pageCount: Number,
    fileSize: Number,
    uploadedAt: { type: Date, default: Date.now },
    processedAt: Date
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'processed', 'error'],
    default: 'uploaded'
  }
}, {
  timestamps: true
});

questionPaperSchema.index({ subject: 1, year: -1 });
questionPaperSchema.index({ 'topics.name': 1 });
questionPaperSchema.index({ createdAt: -1 });

module.exports = mongoose.model('QuestionPaper', questionPaperSchema);