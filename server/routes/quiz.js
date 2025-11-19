const express = require('express');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const QuizAttempt = require('../models/QuizAttempt');

const router = express.Router();

/**
 * Create a new quiz
 */
router.post('/create', async (req, res) => {
  try {
    const {
      title,
      description,
      subject,
      questionIds,
      settings,
      difficulty,
      topics
    } = req.body;

    // Validate questions exist
    const questions = await Question.find({ _id: { $in: questionIds } });
    if (questions.length !== questionIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some questions not found'
      });
    }

    // Create quiz
    const quiz = new Quiz({
      title,
      description,
      subject,
      questions: questionIds.map(id => ({ question: id, points: 1 })),
      settings: {
        timeLimit: settings?.timeLimit || null,
        randomizeQuestions: settings?.randomizeQuestions || false,
        randomizeOptions: settings?.randomizeOptions || false,
        showCorrectAnswers: settings?.showCorrectAnswers || true,
        allowRetakes: settings?.allowRetakes || true,
        passingScore: settings?.passingScore || 70
      },
      difficulty,
      topics: topics || [],
      createdBy: req.body.createdBy || 'anonymous'
    });

    await quiz.save();

    // Populate questions for response
    const populatedQuiz = await Quiz.findById(quiz._id)
      .populate('questions.question');

    res.json({
      success: true,
      message: 'Quiz created successfully',
      data: populatedQuiz
    });

  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create quiz',
      error: error.message
    });
  }
});

/**
 * Get all quizzes
 */
router.get('/', async (req, res) => {
  try {
    const {
      subject,
      difficulty,
      page = 1,
      limit = 10
    } = req.query;

    const skip = (page - 1) * limit;
    const filter = { isActive: true };

    if (subject) filter.subject = subject;
    if (difficulty) filter.difficulty = difficulty;

    const quizzes = await Quiz.find(filter)
      .populate('questions.question', 'questionText questionType difficulty')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Quiz.countDocuments(filter);

    res.json({
      success: true,
      data: {
        quizzes,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quizzes',
      error: error.message
    });
  }
});

/**
 * Get quiz by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('questions.question');
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    res.json({
      success: true,
      data: quiz
    });

  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz',
      error: error.message
    });
  }
});

/**
 * Start a quiz attempt
 */
router.post('/:id/start', async (req, res) => {
  try {
    const { userId, sessionId } = req.body;
    
    const quiz = await Quiz.findById(req.params.id)
      .populate('questions.question');
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Create quiz attempt
    const attempt = new QuizAttempt({
      quiz: quiz._id,
      userId: userId || 'anonymous',
      sessionId: sessionId || Date.now().toString(),
      answers: quiz.questions.map(q => ({
        question: q.question._id,
        selectedAnswer: null,
        selectedOptions: [],
        isCorrect: false,
        timeSpent: 0,
        pointsEarned: 0
      })),
      score: {
        totalPoints: quiz.questions.length,
        earnedPoints: 0,
        percentage: 0
      },
      startedAt: new Date(),
      status: 'in-progress'
    });

    await attempt.save();

    // Prepare quiz data for frontend (without correct answers)
    const quizData = {
      ...quiz.toObject(),
      questions: quiz.questions.map(q => ({
        ...q.toObject(),
        question: {
          ...q.question.toObject(),
          correctAnswer: undefined,
          explanation: undefined
        }
      }))
    };

    res.json({
      success: true,
      message: 'Quiz started successfully',
      data: {
        attemptId: attempt._id,
        quiz: quizData
      }
    });

  } catch (error) {
    console.error('Start quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start quiz',
      error: error.message
    });
  }
});

/**
 * Submit quiz answer
 */
router.post('/attempts/:attemptId/answer', async (req, res) => {
  try {
    const { questionId, answer, selectedOptions, timeSpent } = req.body;
    
    const attempt = await QuizAttempt.findById(req.params.attemptId);
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Quiz attempt not found'
      });
    }

    if (attempt.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: 'Quiz attempt is not active'
      });
    }

    // Find the question
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Find answer in attempt
    const answerIndex = attempt.answers.findIndex(
      a => a.question.toString() === questionId
    );

    if (answerIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Question not part of this quiz'
      });
    }

    // Check if answer is correct
    let isCorrect = false;
    if (question.questionType === 'multiple-choice') {
      const correctOption = question.options.find(opt => opt.isCorrect);
      isCorrect = correctOption && correctOption.text === answer;
    } else {
      isCorrect = question.correctAnswer.toLowerCase() === answer.toLowerCase();
    }

    // Update answer
    attempt.answers[answerIndex] = {
      question: questionId,
      selectedAnswer: answer,
      selectedOptions: selectedOptions || [],
      isCorrect,
      timeSpent: timeSpent || 0,
      pointsEarned: isCorrect ? 1 : 0
    };

    await attempt.save();

    res.json({
      success: true,
      message: 'Answer submitted successfully',
      data: {
        isCorrect,
        pointsEarned: isCorrect ? 1 : 0
      }
    });

  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit answer',
      error: error.message
    });
  }
});

/**
 * Complete quiz attempt
 */
router.post('/attempts/:attemptId/complete', async (req, res) => {
  try {
    const attempt = await QuizAttempt.findById(req.params.attemptId)
      .populate('quiz')
      .populate('answers.question');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Quiz attempt not found'
      });
    }

    // Calculate final score
    const earnedPoints = attempt.answers.reduce((sum, answer) => 
      sum + (answer.isCorrect ? 1 : 0), 0
    );
    const totalPoints = attempt.answers.length;
    const percentage = Math.round((earnedPoints / totalPoints) * 100);

    // Update attempt
    attempt.score = {
      totalPoints,
      earnedPoints,
      percentage
    };
    attempt.completedAt = new Date();
    attempt.status = 'completed';
    attempt.timeSpent = attempt.answers.reduce((sum, answer) => 
      sum + answer.timeSpent, 0
    );

    await attempt.save();

    // Update quiz statistics
    const quiz = await Quiz.findById(attempt.quiz._id);
    quiz.totalAttempts += 1;
    quiz.averageScore = ((quiz.averageScore * (quiz.totalAttempts - 1)) + percentage) / quiz.totalAttempts;
    await quiz.save();

    // Update question statistics
    for (const answer of attempt.answers) {
      const question = await Question.findById(answer.question);
      question.performance.totalAttempts += 1;
      if (answer.isCorrect) {
        question.performance.correctAnswers += 1;
      }
      question.performance.averageTime = 
        ((question.performance.averageTime * (question.performance.totalAttempts - 1)) + answer.timeSpent) / 
        question.performance.totalAttempts;
      question.usageCount += 1;
      await question.save();
    }

    res.json({
      success: true,
      message: 'Quiz completed successfully',
      data: {
        score: attempt.score,
        timeSpent: attempt.timeSpent,
        answers: attempt.answers,
        passed: percentage >= attempt.quiz.settings.passingScore
      }
    });

  } catch (error) {
    console.error('Complete quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete quiz',
      error: error.message
    });
  }
});

/**
 * Get quiz results
 */
router.get('/attempts/:attemptId/results', async (req, res) => {
  try {
    const attempt = await QuizAttempt.findById(req.params.attemptId)
      .populate('quiz', 'title settings')
      .populate('answers.question');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Quiz attempt not found'
      });
    }

    res.json({
      success: true,
      data: attempt
    });

  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch results',
      error: error.message
    });
  }
});

/**
 * Delete quiz
 */
router.delete('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    res.json({
      success: true,
      message: 'Quiz deactivated successfully'
    });

  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete quiz',
      error: error.message
    });
  }
});

module.exports = router;