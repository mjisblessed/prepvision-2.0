const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
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
        Analyze the following academic content and generate ${questionCount} diverse, high-quality educational questions suitable for exam preparation.
        
        Subject: ${subject}
        Main Topics: ${topicList}
        
        Content:
        ${text.substring(0, 4000)} // Limit text to avoid token limits
        
        Please generate questions following this JSON format:
        {
          "questions": [
            {
              "questionText": "A well-phrased question?",
              "questionType": "multiple-choice|true-false|short-answer|essay|fill-blank",
              "options": [
                {"text": "Option A", "isCorrect": false},
                {"text": "Option B", "isCorrect": true},
                {"text": "Option C", "isCorrect": false},
                {"text": "Option D", "isCorrect": false}
              ],
              "correctAnswer": "For non-MCQ questions, provide the precise answer.",
              "explanation": "A detailed explanation of why the answer is correct, referencing concepts from the text.",
              "difficulty": "easy|medium|hard",
              "topics": ["topic1", "topic2"],
              "keywords": ["keyword1", "keyword2"],
              "bloomLevel": "remember|understand|apply|analyze|evaluate|create",
              "estimatedTime": 2
            }
          ]
        }
        
        **Crucial Requirements:**
        1.  **Diverse Question Phrasing:** Do NOT just ask "What is...". Use varied formats like:
            *   "Compare and contrast..."
            *   "Explain the significance of..."
            *   "What would happen if..."
            *   "Describe the process of..."
            *   "Analyze the relationship between..."
        2.  **Question Type Distribution:** Generate a mix of question types (40% multiple-choice, 20% true-false, 20% short-answer, 15% fill-blank, 5% essay).
        3.  **Difficulty & Cognitive Level:** Include a range of difficulties (30% easy, 50% medium, 20% hard) and cover different Bloom's Taxonomy levels.
        4.  **Clarity and Relevance:** Questions must be clear, specific, and directly relevant to the provided content. They should be predictive of exam-style questions for this subject.
        5.  **MCQ Integrity:** For multiple-choice questions, provide 4 distinct options with only one correct answer. Distractors should be plausible but incorrect.
        6.  **Explanations:** Provide detailed explanations for all answers.
        
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
        Based on the following text, generate ${cardCount} flashcards. Each flashcard should have a "front" with a clear, concise question and a "back" with the corresponding answer.

        Text:
        ${text.substring(0, 4000)}

        Format the output as a JSON object with a "flashcards" array:
        {
          "flashcards": [
            {
              "front": "What is the capital of France?",
              "back": "Paris",
              "difficulty": "easy",
              "topics": ["Geography"],
              "tags": ["Europe"]
            },
            {
              "front": "What is the formula for water?",
              "back": "H2O",
              "difficulty": "easy",
              "topics": ["Chemistry"],
              "tags": ["Compounds"]
            }
          ]
        }

        **Crucial Requirements:**
        1.  **Front:** Must be a specific question that can be answered from the text.
        2.  **Back:** Must be the concise and accurate answer to the question on the front.
        3.  **Relevance:** All flashcards must be directly based on the provided text.
        4.  **Metadata:** Include difficulty, topics, and tags for each card.

        Generate exactly ${cardCount} flashcards and return only the JSON response.
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
        questionText: `Based on the text, what is the significance of the following point: "${sentence.substring(0, 100)}..."?`,
        questionType: 'short-answer',
        options: [],
        correctAnswer: 'The answer should be derived from the provided sentence in context.',
        explanation: 'This is a fallback question. It tests basic comprehension of the source material when the primary AI model fails.',
        difficulty: 'medium',
        subject: subject,
        topics: topics.slice(0, 2).map(t => t.name),
        keywords: [],
        generatedBy: 'ai-fallback',
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
        front: `What is the key point of: "${sentence.substring(0, 70)}..."?`,
        back: sentence,
        subject: subject,
        topics: topics.slice(0, 2).map(t => t.name),
        difficulty: 'medium',
        tags: ['fallback', 'comprehension']
      });
    }
    
    return flashcards;
  }
}

module.exports = new GeminiService();