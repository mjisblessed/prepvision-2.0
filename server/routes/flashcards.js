const express = require('express');
const Flashcard = require('../models/Flashcard');
const Question = require('../models/Question');
const geminiService = require('../services/geminiService');
const QuestionPaper = require('../models/QuestionPaper');

const router = express.Router();

/**
 * Create flashcards from questions or text
 */
router.post('/create', async (req, res) => {
  try {
    const { 
      source, // 'questions' or 'paper'
      sourceId, 
      questionIds, 
      subject,
      cardCount = 10 
    } = req.body;

    let flashcards = [];

    if (source === 'questions' && questionIds) {
      // Create flashcards from specific questions
      const questions = await Question.find({ _id: { $in: questionIds } });
      
      flashcards = questions.map(q => ({
        front: q.questionText,
        back: q.correctAnswer || q.explanation,
        subject: q.subject,
        topics: q.topics,
        difficulty: q.difficulty,
        sourceQuestion: q._id,
        tags: ['question-based', ...q.keywords.slice(0, 3)]
      }));

    } else if (source === 'paper' && sourceId) {
      // Generate flashcards from question paper using AI
      const questionPaper = await QuestionPaper.findById(sourceId);
      if (!questionPaper) {
        return res.status(404).json({
          success: false,
          message: 'Question paper not found'
        });
      }

      const aiFlashcards = await geminiService.generateFlashcards(
        questionPaper.extractedText,
        questionPaper.subject,
        questionPaper.topics,
        parseInt(cardCount)
      );

      flashcards = aiFlashcards.map(card => ({
        ...card,
        sourcePaper: questionPaper._id,
        tags: ['ai-generated', ...card.tags]
      }));

    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid source or missing required parameters'
      });
    }

    // Save flashcards to database
    const savedFlashcards = [];
    for (const cardData of flashcards) {
      const flashcard = new Flashcard(cardData);
      await flashcard.save();
      savedFlashcards.push(flashcard);
    }

    res.json({
      success: true,
      message: `${savedFlashcards.length} flashcards created successfully`,
      data: savedFlashcards
    });

  } catch (error) {
    console.error('Create flashcards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create flashcards',
      error: error.message
    });
  }
});

/**
 * Get flashcards with filtering
 */
router.get('/', async (req, res) => {
  try {
    const {
      subject,
      difficulty,
      topic,
      dueForReview,
      page = 1,
      limit = 20
    } = req.query;

    const skip = (page - 1) * limit;
    const filter = { isActive: true };

    if (subject) filter.subject = subject;
    if (difficulty) filter.difficulty = difficulty;
    if (topic) filter.topics = { $in: [topic] };

    if (dueForReview === 'true') {
      filter['spacedRepetition.nextReview'] = { $lte: new Date() };
    }

    const flashcards = await Flashcard.find(filter)
      .populate('sourceQuestion', 'questionText')
      .populate('sourcePaper', 'filename subject')
      .sort({ 'spacedRepetition.nextReview': 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Flashcard.countDocuments(filter);

    res.json({
      success: true,
      data: {
        flashcards,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get flashcards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch flashcards',
      error: error.message
    });
  }
});

/**
 * Get study session cards (due for review)
 */
router.get('/study-session', async (req, res) => {
  try {
    const { subject, limit = 20 } = req.query;
    
    const filter = {
      isActive: true,
      'spacedRepetition.nextReview': { $lte: new Date() }
    };

    if (subject) filter.subject = subject;

    const flashcards = await Flashcard.find(filter)
      .sort({ 'spacedRepetition.nextReview': 1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        flashcards,
        count: flashcards.length
      }
    });

  } catch (error) {
    console.error('Get study session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch study session',
      error: error.message
    });
  }
});

/**
 * Review a flashcard (spaced repetition)
 */
router.post('/:id/review', async (req, res) => {
  try {
    const { response } = req.body; // 'again', 'hard', 'good', 'easy'
    
    if (!['again', 'hard', 'good', 'easy'].includes(response)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid response. Must be: again, hard, good, or easy'
      });
    }

    const flashcard = await Flashcard.findById(req.params.id);
    if (!flashcard) {
      return res.status(404).json({
        success: false,
        message: 'Flashcard not found'
      });
    }

    // Update performance
    flashcard.performance.totalReviews += 1;
    flashcard.performance.lastResponse = response;

    if (response === 'good' || response === 'easy') {
      flashcard.performance.correctReviews += 1;
      flashcard.performance.streakCount += 1;
    } else {
      flashcard.performance.streakCount = 0;
    }

    // Calculate next review using SM-2 algorithm
    const sr = flashcard.spacedRepetition;
    
    if (response === 'again') {
      sr.repetition = 0;
      sr.interval = 1;
    } else {
      sr.repetition += 1;
      
      if (sr.repetition === 1) {
        sr.interval = 1;
      } else if (sr.repetition === 2) {
        sr.interval = 6;
      } else {
        sr.interval = Math.round(sr.interval * sr.easeFactor);
      }

      // Update ease factor
      const quality = { 'hard': 3, 'good': 4, 'easy': 5 }[response];
      sr.easeFactor = sr.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      sr.easeFactor = Math.max(1.3, sr.easeFactor);
    }

    // Set next review date
    sr.nextReview = new Date(Date.now() + sr.interval * 24 * 60 * 60 * 1000);
    sr.lastReviewed = new Date();

    await flashcard.save();

    res.json({
      success: true,
      message: 'Flashcard reviewed successfully',
      data: {
        nextReview: sr.nextReview,
        interval: sr.interval,
        performance: flashcard.performance
      }
    });

  } catch (error) {
    console.error('Review flashcard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review flashcard',
      error: error.message
    });
  }
});

/**
 * Get flashcard statistics
 */
router.get('/statistics/:subject?', async (req, res) => {
  try {
    const { subject } = req.params;
    const filter = { isActive: true };
    
    if (subject) filter.subject = subject;

    const stats = await Flashcard.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          dueForReview: {
            $sum: {
              $cond: {
                if: { $lte: ['$spacedRepetition.nextReview', new Date()] },
                then: 1,
                else: 0
              }
            }
          },
          totalReviews: { $sum: '$performance.totalReviews' },
          correctReviews: { $sum: '$performance.correctReviews' },
          avgStreak: { $avg: '$performance.streakCount' },
          byDifficulty: {
            $push: '$difficulty'
          },
          bySubject: {
            $push: '$subject'
          }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      dueForReview: 0,
      totalReviews: 0,
      correctReviews: 0,
      avgStreak: 0,
      byDifficulty: [],
      bySubject: []
    };

    // Calculate accuracy
    result.accuracy = result.totalReviews > 0 
      ? Math.round((result.correctReviews / result.totalReviews) * 100)
      : 0;

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get flashcard statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

/**
 * Update flashcard
 */
router.put('/:id', async (req, res) => {
  try {
    const { front, back, difficulty, topics, tags } = req.body;
    
    const flashcard = await Flashcard.findById(req.params.id);
    if (!flashcard) {
      return res.status(404).json({
        success: false,
        message: 'Flashcard not found'
      });
    }

    // Update fields
    if (front) flashcard.front = front;
    if (back) flashcard.back = back;
    if (difficulty) flashcard.difficulty = difficulty;
    if (topics) flashcard.topics = topics;
    if (tags) flashcard.tags = tags;

    await flashcard.save();

    res.json({
      success: true,
      message: 'Flashcard updated successfully',
      data: flashcard
    });

  } catch (error) {
    console.error('Update flashcard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update flashcard',
      error: error.message
    });
  }
});

/**
 * Delete flashcard
 */
router.delete('/:id', async (req, res) => {
  try {
    const flashcard = await Flashcard.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!flashcard) {
      return res.status(404).json({
        success: false,
        message: 'Flashcard not found'
      });
    }

    res.json({
      success: true,
      message: 'Flashcard deleted successfully'
    });

  } catch (error) {
    console.error('Delete flashcard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete flashcard',
      error: error.message
    });
  }
});

module.exports = router;