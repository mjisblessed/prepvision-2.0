const express = require('express');
const QuestionPaper = require('../models/QuestionPaper');
const Question = require('../models/Question');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Flashcard = require('../models/Flashcard');

const router = express.Router();

/**
 * Get dashboard overview statistics
 */
router.get('/dashboard', async (req, res) => {
  try {
    const [
      paperStats,
      questionStats,
      quizStats,
      flashcardStats,
      recentActivity
    ] = await Promise.all([
      // Question papers stats
      QuestionPaper.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            bySubject: {
              $push: '$subject'
            },
            totalTextLength: { $sum: { $strLenCP: '$extractedText' } }
          }
        }
      ]),

      // Questions stats
      Question.aggregate([
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
            totalUsage: { $sum: '$usageCount' }
          }
        }
      ]),

      // Quiz stats
      Quiz.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: {
              $sum: { $cond: ['$isActive', 1, 0] }
            },
            totalAttempts: { $sum: '$totalAttempts' },
            avgScore: { $avg: '$averageScore' }
          }
        }
      ]),

      // Flashcard stats
      Flashcard.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: {
              $sum: { $cond: ['$isActive', 1, 0] }
            },
            totalReviews: { $sum: '$performance.totalReviews' },
            correctReviews: { $sum: '$performance.correctReviews' }
          }
        }
      ]),

      // Recent activity
      QuestionPaper.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('filename subject createdAt')
    ]);

    res.json({
      success: true,
      data: {
        papers: paperStats[0] || { total: 0, bySubject: [], totalTextLength: 0 },
        questions: questionStats[0] || { total: 0, byDifficulty: [], byType: [], totalUsage: 0 },
        quizzes: quizStats[0] || { total: 0, active: 0, totalAttempts: 0, avgScore: 0 },
        flashcards: flashcardStats[0] || { total: 0, active: 0, totalReviews: 0, correctReviews: 0 },
        recentActivity
      }
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics',
      error: error.message
    });
  }
});

/**
 * Get subject-wise analytics
 */
router.get('/subjects', async (req, res) => {
  try {
    const subjectStats = await QuestionPaper.aggregate([
      {
        $group: {
          _id: '$subject',
          paperCount: { $sum: 1 },
          totalTopics: { $sum: { $size: '$topics' } },
          avgTopicsPerPaper: { $avg: { $size: '$topics' } },
          recentUpload: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'questions',
          localField: '_id',
          foreignField: 'subject',
          as: 'questions'
        }
      },
      {
        $addFields: {
          questionCount: { $size: '$questions' },
          avgDifficulty: {
            $avg: {
              $map: {
                input: '$questions',
                as: 'q',
                in: {
                  $switch: {
                    branches: [
                      { case: { $eq: ['$$q.difficulty', 'easy'] }, then: 1 },
                      { case: { $eq: ['$$q.difficulty', 'medium'] }, then: 2 },
                      { case: { $eq: ['$$q.difficulty', 'hard'] }, then: 3 }
                    ],
                    default: 2
                  }
                }
              }
            }
          }
        }
      },
      {
        $project: {
          questions: 0
        }
      },
      {
        $sort: { paperCount: -1 }
      }
    ]);

    res.json({
      success: true,
      data: subjectStats
    });

  } catch (error) {
    console.error('Subject analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subject analytics',
      error: error.message
    });
  }
});

/**
 * Get topic frequency analysis
 */
router.get('/topics/:subject?', async (req, res) => {
  try {
    const { subject } = req.params;
    const { limit = 20 } = req.query;

    const matchStage = subject ? { $match: { subject } } : { $match: {} };
    
    const topicStats = await QuestionPaper.aggregate([
      matchStage,
      { $unwind: '$topics' },
      {
        $group: {
          _id: '$topics.name',
          frequency: { $sum: '$topics.frequency' },
          paperCount: { $sum: 1 },
          subjects: { $addToSet: '$subject' },
          keywords: { $push: '$topics.keywords' },
          avgFrequency: { $avg: '$topics.frequency' }
        }
      },
      {
        $addFields: {
          allKeywords: {
            $reduce: {
              input: '$keywords',
              initialValue: [],
              in: { $concatArrays: ['$$value', '$$this'] }
            }
          }
        }
      },
      {
        $addFields: {
          uniqueKeywords: { $setUnion: ['$allKeywords', []] }
        }
      },
      {
        $project: {
          keywords: 0,
          allKeywords: 0
        }
      },
      { $sort: { frequency: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      data: topicStats
    });

  } catch (error) {
    console.error('Topic analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch topic analytics',
      error: error.message
    });
  }
});

/**
 * Get performance analytics for questions
 */
router.get('/performance/questions', async (req, res) => {
  try {
    const { subject, limit = 20 } = req.query;
    
    const matchStage = subject ? { $match: { subject } } : { $match: {} };
    
    const performanceStats = await Question.aggregate([
      matchStage,
      {
        $match: {
          'performance.totalAttempts': { $gt: 0 }
        }
      },
      {
        $addFields: {
          successRate: {
            $divide: ['$performance.correctAnswers', '$performance.totalAttempts']
          }
        }
      },
      {
        $group: {
          _id: null,
          avgSuccessRate: { $avg: '$successRate' },
          questions: {
            $push: {
              _id: '$_id',
              questionText: '$questionText',
              difficulty: '$difficulty',
              questionType: '$questionType',
              successRate: '$successRate',
              totalAttempts: '$performance.totalAttempts',
              usageCount: '$usageCount',
              topics: '$topics'
            }
          }
        }
      },
      {
        $addFields: {
          topPerforming: {
            $slice: [
              {
                $sortArray: {
                  input: '$questions',
                  sortBy: { successRate: -1 }
                }
              },
              parseInt(limit)
            ]
          },
          lowPerforming: {
            $slice: [
              {
                $sortArray: {
                  input: '$questions',
                  sortBy: { successRate: 1 }
                }
              },
              parseInt(limit)
            ]
          },
          mostUsed: {
            $slice: [
              {
                $sortArray: {
                  input: '$questions',
                  sortBy: { usageCount: -1 }
                }
              },
              parseInt(limit)
            ]
          }
        }
      },
      {
        $project: {
          questions: 0
        }
      }
    ]);

    res.json({
      success: true,
      data: performanceStats[0] || {
        avgSuccessRate: 0,
        topPerforming: [],
        lowPerforming: [],
        mostUsed: []
      }
    });

  } catch (error) {
    console.error('Question performance analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch question performance analytics',
      error: error.message
    });
  }
});

/**
 * Get quiz analytics
 */
router.get('/performance/quizzes', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(days));

    const quizAnalytics = await QuizAttempt.aggregate([
      {
        $match: {
          completedAt: { $gte: fromDate },
          status: 'completed'
        }
      },
      {
        $lookup: {
          from: 'quizzes',
          localField: 'quiz',
          foreignField: '_id',
          as: 'quizData'
        }
      },
      { $unwind: '$quizData' },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
            subject: '$quizData.subject'
          },
          attemptCount: { $sum: 1 },
          avgScore: { $avg: '$score.percentage' },
          avgTime: { $avg: '$timeSpent' },
          completionRate: {
            $avg: {
              $cond: [
                { $gte: ['$score.percentage', '$quizData.settings.passingScore'] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          subjects: {
            $push: {
              subject: '$_id.subject',
              attemptCount: '$attemptCount',
              avgScore: '$avgScore',
              avgTime: '$avgTime',
              completionRate: '$completionRate'
            }
          },
          totalAttempts: { $sum: '$attemptCount' },
          overallAvgScore: { $avg: '$avgScore' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      success: true,
      data: quizAnalytics
    });

  } catch (error) {
    console.error('Quiz analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz analytics',
      error: error.message
    });
  }
});

/**
 * Get trending topics across all subjects
 */
router.get('/trending/topics', async (req, res) => {
  try {
    const { days = 30, limit = 15 } = req.query;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(days));

    // Get topics from recently uploaded papers
    const trendingTopics = await QuestionPaper.aggregate([
      {
        $match: {
          createdAt: { $gte: fromDate }
        }
      },
      { $unwind: '$topics' },
      {
        $group: {
          _id: '$topics.name',
          frequency: { $sum: '$topics.frequency' },
          recentUploads: { $sum: 1 },
          subjects: { $addToSet: '$subject' },
          latestUpload: { $max: '$createdAt' }
        }
      },
      {
        $addFields: {
          trendScore: {
            $multiply: [
              '$frequency',
              '$recentUploads',
              { $size: '$subjects' }
            ]
          }
        }
      },
      { $sort: { trendScore: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      data: trendingTopics
    });

  } catch (error) {
    console.error('Trending topics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending topics',
      error: error.message
    });
  }
});

/**
 * Export analytics data
 */
router.get('/export/:type', async (req, res) => {
  try {
    const { type } = req.params; // 'papers', 'questions', 'quizzes', 'flashcards'
    const { subject, format = 'json' } = req.query;

    let data = [];

    switch (type) {
      case 'papers':
        const filter = subject ? { subject } : {};
        data = await QuestionPaper.find(filter)
          .select('-extractedText')
          .populate('questions', 'questionText difficulty');
        break;

      case 'questions':
        const qFilter = subject ? { subject } : {};
        data = await Question.find(qFilter)
          .populate('sourcePaper', 'filename subject');
        break;

      case 'performance':
        data = await QuizAttempt.find({ status: 'completed' })
          .populate('quiz', 'title subject')
          .select('score timeSpent completedAt');
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type'
        });
    }

    if (format === 'csv') {
      // Simple CSV conversion (you might want to use a proper CSV library)
      const csv = data.map(item => 
        Object.values(item.toObject()).join(',')
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-export.csv"`);
      return res.send(csv);
    }

    res.json({
      success: true,
      data,
      exportedAt: new Date().toISOString(),
      count: data.length
    });

  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics data',
      error: error.message
    });
  }
});

module.exports = router;