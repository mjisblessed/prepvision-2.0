const express = require('express');
const Question = require('../models/Question');

const router = express.Router();

/**
 * Get all questions with filtering options
 */
router.get('/', async (req, res) => {
  try {
    const {
      subject,
      difficulty,
      questionType,
      topic,
      page = 1,
      limit = 20
    } = req.query;

    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (subject) filter.subject = subject;
    if (difficulty) filter.difficulty = difficulty;
    if (questionType) filter.questionType = questionType;
    if (topic) filter.topics = { $in: [topic] };

    const questions = await Question.find(filter)
      .populate('sourcePaper', 'filename originalName subject year')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Question.countDocuments(filter);

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questions',
      error: error.message
    });
  }
});

/**
 * Get question by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('sourcePaper', 'filename originalName subject year');
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.json({
      success: true,
      data: question
    });

  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch question',
      error: error.message
    });
  }
});

/**
 * Update question
 */
router.put('/:id', async (req, res) => {
  try {
    const {
      questionText,
      options,
      correctAnswer,
      explanation,
      difficulty,
      topics,
      keywords
    } = req.body;

    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Update fields
    if (questionText) question.questionText = questionText;
    if (options) question.options = options;
    if (correctAnswer) question.correctAnswer = correctAnswer;
    if (explanation) question.explanation = explanation;
    if (difficulty) question.difficulty = difficulty;
    if (topics) question.topics = topics;
    if (keywords) question.keywords = keywords;

    await question.save();

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: question
    });

  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update question',
      error: error.message
    });
  }
});

/**
 * Delete question
 */
router.delete('/:id', async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });

  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete question',
      error: error.message
    });
  }
});

/**
 * Get questions by subject with statistics
 */
router.get('/by-subject/:subject', async (req, res) => {
  try {
    const { subject } = req.params;
    const { limit = 50 } = req.query;

    const questions = await Question.find({ subject })
      .populate('sourcePaper', 'filename originalName year')
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Get statistics
    const stats = await Question.aggregate([
      { $match: { subject } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byDifficulty: {
            $push: '$difficulty'
          },
          byType: {
            $push: '$questionType'
          },
          avgPerformance: {
            $avg: {
              $cond: {
                if: { $gt: ['$performance.totalAttempts', 0] },
                then: { $divide: ['$performance.correctAnswers', '$performance.totalAttempts'] },
                else: 0
              }
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        questions,
        statistics: stats[0] || {
          total: 0,
          byDifficulty: [],
          byType: [],
          avgPerformance: 0
        }
      }
    });

  } catch (error) {
    console.error('Get questions by subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questions by subject',
      error: error.message
    });
  }
});

/**
 * Search questions
 */
router.post('/search', async (req, res) => {
  try {
    const {
      query,
      subject,
      difficulty,
      questionType,
      limit = 20
    } = req.body;

    const filter = {};
    
    if (query) {
      filter.$or = [
        { questionText: { $regex: query, $options: 'i' } },
        { keywords: { $in: [new RegExp(query, 'i')] } },
        { topics: { $in: [new RegExp(query, 'i')] } }
      ];
    }
    
    if (subject) filter.subject = subject;
    if (difficulty) filter.difficulty = difficulty;
    if (questionType) filter.questionType = questionType;

    const questions = await Question.find(filter)
      .populate('sourcePaper', 'filename originalName subject year')
      .limit(parseInt(limit))
      .sort({ usageCount: -1, createdAt: -1 });

    res.json({
      success: true,
      data: {
        questions,
        count: questions.length
      }
    });

  } catch (error) {
    console.error('Search questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search questions',
      error: error.message
    });
  }
});

module.exports = router;