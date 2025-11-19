const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { upload, handleUploadError } = require('../middleware/upload');
const pdfService = require('../services/pdfService');
const geminiService = require('../services/geminiService');
const QuestionPaper = require('../models/QuestionPaper');
const Question = require('../models/Question');

const router = express.Router();

/**
 * Upload and process PDF file
 */
router.post('/', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file uploaded'
      });
    }

    const { subject, year, institution, examType } = req.body;

    // Read the uploaded file
    const pdfBuffer = await fs.readFile(req.file.path);
    
    // Extract text from PDF
    const extractionResult = await pdfService.extractText(pdfBuffer);
    const cleanedText = pdfService.cleanText(extractionResult.text);
    
    // Extract topics and detect subject
    const extractedTopics = pdfService.extractTopics(cleanedText);
    const detectedSubject = subject || pdfService.detectSubject(cleanedText);

    // Create question paper record
    const questionPaper = new QuestionPaper({
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      extractedText: cleanedText,
      subject: detectedSubject,
      year: year ? parseInt(year) : null,
      institution: institution || null,
      examType: examType || 'other',
      topics: extractedTopics,
      metadata: {
        pageCount: extractionResult.metadata.pages,
        fileSize: req.file.size,
        uploadedAt: new Date(),
        processedAt: new Date()
      },
      status: 'processed'
    });

    await questionPaper.save();

    res.json({
      success: true,
      message: 'PDF uploaded and processed successfully',
      data: {
        questionPaperId: questionPaper._id,
        filename: questionPaper.originalName,
        subject: questionPaper.subject,
        topics: questionPaper.topics,
        metadata: questionPaper.metadata,
        extractedTextLength: cleanedText.length
      }
    });

  } catch (error) {
    console.error('Upload processing error:', error);
    
    // Clean up file if processing failed
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('File cleanup error:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to process PDF',
      error: error.message
    });
  }
});

/**
 * Generate questions from uploaded PDF
 */
router.post('/:questionPaperId/generate-questions', async (req, res) => {
  try {
    const { questionPaperId } = req.params;
    const { questionCount = 10, questionTypes, difficulty } = req.body;

    // Find the question paper
    const questionPaper = await QuestionPaper.findById(questionPaperId);
    if (!questionPaper) {
      return res.status(404).json({
        success: false,
        message: 'Question paper not found'
      });
    }

    // Generate questions using Gemini AI
    const generatedQuestions = await geminiService.generateQuestions(
      questionPaper.extractedText,
      questionPaper.subject,
      questionPaper.topics,
      parseInt(questionCount)
    );

    // Save generated questions to database
    const savedQuestions = [];
    for (const questionData of generatedQuestions) {
      const question = new Question({
        ...questionData,
        sourcePaper: questionPaper._id
      });
      await question.save();
      savedQuestions.push(question);
    }

    // Update question paper status
    questionPaper.status = 'processed';
    await questionPaper.save();

    res.json({
      success: true,
      message: `${savedQuestions.length} questions generated successfully`,
      data: {
        questionPaperId: questionPaper._id,
        generatedQuestions: savedQuestions,
        questionCount: savedQuestions.length
      }
    });

  } catch (error) {
    console.error('Question generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate questions',
      error: error.message
    });
  }
});

/**
 * Get all uploaded question papers
 */
router.get('/papers', async (req, res) => {
  try {
    const { subject, year, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (subject) filter.subject = subject;
    if (year) filter.year = parseInt(year);

    const questionPapers = await QuestionPaper.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-extractedText'); // Exclude large text field

    const total = await QuestionPaper.countDocuments(filter);

    res.json({
      success: true,
      data: {
        questionPapers,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get papers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch question papers',
      error: error.message
    });
  }
});

/**
 * Get question paper details
 */
router.get('/papers/:id', async (req, res) => {
  try {
    const questionPaper = await QuestionPaper.findById(req.params.id);
    
    if (!questionPaper) {
      return res.status(404).json({
        success: false,
        message: 'Question paper not found'
      });
    }

    res.json({
      success: true,
      data: questionPaper
    });

  } catch (error) {
    console.error('Get paper details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch question paper details',
      error: error.message
    });
  }
});

/**
 * Delete question paper
 */
router.delete('/papers/:id', async (req, res) => {
  try {
    const questionPaper = await QuestionPaper.findById(req.params.id);
    
    if (!questionPaper) {
      return res.status(404).json({
        success: false,
        message: 'Question paper not found'
      });
    }

    // Delete associated file
    try {
      await fs.unlink(questionPaper.filePath);
    } catch (fileError) {
      console.warn('File deletion warning:', fileError);
    }

    // Delete associated questions
    await Question.deleteMany({ sourcePaper: questionPaper._id });

    // Delete question paper
    await QuestionPaper.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Question paper deleted successfully'
    });

  } catch (error) {
    console.error('Delete paper error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete question paper',
      error: error.message
    });
  }
});

// Error handling middleware
router.use(handleUploadError);

module.exports = router;