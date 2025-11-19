const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  /**
   * Generate questions from extracted text
   * @param {string} text - Extracted text from PDF
   * @param {string} subject - Subject of the content
   * @param {Array} topics - Extracted topics
   * @param {number} questionCount - Number of questions to generate
   * @returns {Array} - Generated questions
   */
  async generateQuestions(text, subject, topics = [], questionCount = 10) {
    try {
      const topicList = topics.map(t => t.name).join(', ');
      
      const prompt = `
        Analyze the following academic content and generate ${questionCount} diverse educational questions.
        
        Subject: ${subject}
        Main Topics: ${topicList}
        
        Content:
        ${text.substring(0, 4000)} // Limit text to avoid token limits
        
        Please generate questions following this JSON format:
        {
          "questions": [
            {
              "questionText": "Question text here?",
              "questionType": "multiple-choice|true-false|short-answer|essay|fill-blank",
              "options": [
                {"text": "Option A", "isCorrect": false},
                {"text": "Option B", "isCorrect": true},
                {"text": "Option C", "isCorrect": false},
                {"text": "Option D", "isCorrect": false}
              ],
              "correctAnswer": "For non-MCQ questions",
              "explanation": "Detailed explanation of the answer",
              "difficulty": "easy|medium|hard",
              "topics": ["topic1", "topic2"],
              "keywords": ["keyword1", "keyword2"],
              "bloomLevel": "remember|understand|apply|analyze|evaluate|create",
              "estimatedTime": 2
            }
          ]
        }
        
        Requirements:
        - Generate questions of different types (40% multiple-choice, 20% true-false, 20% short-answer, 15% fill-blank, 5% essay)
        - Include questions of varying difficulty levels (30% easy, 50% medium, 20% hard)
        - Cover different Bloom's taxonomy levels
        - Ensure questions are clear, specific, and academically sound
        - For multiple-choice questions, provide 4 options with only one correct answer
        - Include detailed explanations for all answers
        - Focus on key concepts and important topics from the content
        - Make questions predictive of exam-style questions for this subject
        
        Generate exactly ${questionCount} questions and return only the JSON response.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text_response = response.text();

      // Parse JSON response
      const jsonMatch = text_response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from Gemini API');
      }

      const parsedResponse = JSON.parse(jsonMatch[0]);
      
      // Validate and process questions
      const processedQuestions = this.validateAndProcessQuestions(parsedResponse.questions, subject);
      
      return processedQuestions;
    } catch (error) {
      console.error('Gemini API error:', error);
      
      // Fallback to template-based question generation
      return this.generateFallbackQuestions(text, subject, topics, questionCount);
    }
  }

  /**
   * Generate flashcards from text content
   * @param {string} text - Content text
   * @param {string} subject - Subject area
   * @param {Array} topics - Key topics
   * @param {number} cardCount - Number of flashcards to generate
   * @returns {Array} - Generated flashcards
   */
  async generateFlashcards(text, subject, topics = [], cardCount = 15) {
    try {
      const topicList = topics.map(t => t.name).join(', ');
      
      const prompt = `
        Create ${cardCount} educational flashcards from the following content.
        
        Subject: ${subject}
        Key Topics: ${topicList}
        
        Content:
        ${text.substring(0, 3000)}
        
        Generate flashcards in this JSON format:
        {
          "flashcards": [
            {
              "front": "Question or concept",
              "back": "Answer or explanation",
              "difficulty": "easy|medium|hard",
              "topics": ["topic1", "topic2"],
              "tags": ["tag1", "tag2"]
            }
          ]
        }
        
        Requirements:
        - Create clear, concise front-side questions or prompts
        - Provide comprehensive but concise back-side answers
        - Include definition cards, concept cards, and application cards
        - Cover key terms, formulas, processes, and important facts
        - Vary difficulty levels appropriately
        - Make cards suitable for spaced repetition learning
        
        Return only the JSON response with exactly ${cardCount} flashcards.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text_response = response.text();

      const jsonMatch = text_response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response for flashcards');
      }

      const parsedResponse = JSON.parse(jsonMatch[0]);
      return this.validateFlashcards(parsedResponse.flashcards, subject);
    } catch (error) {
      console.error('Flashcard generation error:', error);
      return this.generateFallbackFlashcards(text, subject, topics, cardCount);
    }
  }

  /**
   * Analyze text for topic extraction and enhancement
   * @param {string} text - Text content
   * @param {string} subject - Subject area
   * @returns {Object} - Enhanced topic analysis
   */
  async enhanceTopicAnalysis(text, subject) {
    try {
      const prompt = `
        Analyze this academic content and provide enhanced topic extraction.
        
        Subject: ${subject}
        Content: ${text.substring(0, 2000)}
        
        Return analysis in this JSON format:
        {
          "mainTopics": [
            {
              "name": "Topic name",
              "importance": 1-10,
              "keywords": ["keyword1", "keyword2"],
              "subtopics": ["subtopic1", "subtopic2"],
              "difficulty": "easy|medium|hard"
            }
          ],
          "subjectConfidence": 0.0-1.0,
          "suggestedSubject": "subject name",
          "examImportance": {
            "highPriority": ["topic1", "topic2"],
            "mediumPriority": ["topic3", "topic4"],
            "lowPriority": ["topic5", "topic6"]
          }
        }
        
        Focus on identifying the most exam-relevant topics and concepts.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text_response = response.text();

      const jsonMatch = text_response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Topic analysis error:', error);
    }

    return {
      mainTopics: [],
      subjectConfidence: 0.5,
      suggestedSubject: subject,
      examImportance: {
        highPriority: [],
        mediumPriority: [],
        lowPriority: []
      }
    };
  }

  /**
   * Validate and process generated questions
   */
  validateAndProcessQuestions(questions, subject) {
    return questions
      .filter(q => q.questionText && q.questionText.trim().length > 10)
      .map(q => ({
        questionText: q.questionText.trim(),
        questionType: this.validateQuestionType(q.questionType),
        options: this.validateOptions(q.options, q.questionType),
        correctAnswer: q.correctAnswer || '',
        explanation: q.explanation || '',
        difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
        subject: subject,
        topics: Array.isArray(q.topics) ? q.topics : [],
        keywords: Array.isArray(q.keywords) ? q.keywords : [],
        generatedBy: 'ai',
        bloomLevel: this.validateBloomLevel(q.bloomLevel),
        estimatedTime: Number(q.estimatedTime) || 2
      }));
  }

  validateQuestionType(type) {
    const validTypes = ['multiple-choice', 'true-false', 'short-answer', 'essay', 'fill-blank'];
    return validTypes.includes(type) ? type : 'multiple-choice';
  }

  validateOptions(options, questionType) {
    if (questionType !== 'multiple-choice' && questionType !== 'true-false') {
      return [];
    }

    if (questionType === 'true-false') {
      return [
        { text: 'True', isCorrect: false },
        { text: 'False', isCorrect: true }
      ];
    }

    if (!Array.isArray(options) || options.length < 2) {
      return [
        { text: 'Option A', isCorrect: true },
        { text: 'Option B', isCorrect: false },
        { text: 'Option C', isCorrect: false },
        { text: 'Option D', isCorrect: false }
      ];
    }

    return options.map(opt => ({
      text: opt.text || 'Option',
      isCorrect: Boolean(opt.isCorrect)
    }));
  }

  validateBloomLevel(level) {
    const validLevels = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
    return validLevels.includes(level) ? level : 'understand';
  }

  validateFlashcards(flashcards, subject) {
    return flashcards
      .filter(card => card.front && card.back && card.front.trim().length > 5)
      .map(card => ({
        front: card.front.trim(),
        back: card.back.trim(),
        subject: subject,
        topics: Array.isArray(card.topics) ? card.topics : [],
        difficulty: ['easy', 'medium', 'hard'].includes(card.difficulty) ? card.difficulty : 'medium',
        tags: Array.isArray(card.tags) ? card.tags : []
      }));
  }

  /**
   * Fallback question generation when Gemini API fails
   */
  generateFallbackQuestions(text, subject, topics, count) {
    const questions = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    for (let i = 0; i < Math.min(count, sentences.length); i++) {
      const sentence = sentences[i].trim();
      questions.push({
        questionText: `What is the main concept discussed in: "${sentence.substring(0, 100)}..."?`,
        questionType: 'short-answer',
        options: [],
        correctAnswer: 'Answer based on the provided context',
        explanation: 'This question tests comprehension of the given content.',
        difficulty: 'medium',
        subject: subject,
        topics: topics.slice(0, 2).map(t => t.name),
        keywords: [],
        generatedBy: 'ai',
        bloomLevel: 'understand',
        estimatedTime: 3
      });
    }
    
    return questions;
  }

  generateFallbackFlashcards(text, subject, topics, count) {
    const flashcards = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 15);
    
    for (let i = 0; i < Math.min(count, sentences.length); i++) {
      const sentence = sentences[i].trim();
      flashcards.push({
        front: `What does this statement mean?`,
        back: sentence.substring(0, 200),
        subject: subject,
        topics: topics.slice(0, 2).map(t => t.name),
        difficulty: 'medium',
        tags: ['concept', 'definition']
      });
    }
    
    return flashcards;
  }
}

module.exports = new GeminiService();