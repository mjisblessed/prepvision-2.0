const pdfParse = require('pdf-parse');
const natural = require('natural');
const compromise = require('compromise');

class PDFService {
  /**
   * Extract text from PDF buffer
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @returns {Object} - Extracted text and metadata
   */
  async extractText(pdfBuffer) {
    try {
      const data = await pdfParse(pdfBuffer);
      
      return {
        text: data.text,
        metadata: {
          pages: data.numpages,
          info: data.info,
          version: data.version
        },
        success: true
      };
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF: ' + error.message);
    }
  }

  /**
   * Clean and preprocess extracted text
   * @param {string} text - Raw extracted text
   * @returns {string} - Cleaned text
   */
  cleanText(text) {
    return text
      .replace(/\n+/g, ' ') // Replace multiple newlines with space
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\w\s\.\?\!,;:\-\(\)]/g, '') // Remove special characters except basic punctuation
      .trim();
  }

  /**
   * Extract topics and keywords from text
   * @param {string} text - Text to analyze
   * @returns {Array} - Array of topics with keywords
   */
  extractTopics(text) {
    try {
      const doc = compromise(text);
      
      // Extract nouns and noun phrases as potential topics
      const nouns = doc.match('#Noun').out('array');
      const phrases = doc.match('#Noun+ #Noun').out('array');
      
      // Combine and filter topics
      const allTopics = [...nouns, ...phrases]
        .filter(topic => topic.length > 2) // Filter out very short topics
        .map(topic => topic.toLowerCase())
        .filter((topic, index, arr) => arr.indexOf(topic) === index); // Remove duplicates

      // Calculate frequency and create topic objects
      const topicFrequency = {};
      const tokenizer = new natural.WordTokenizer();
      const words = tokenizer.tokenize(text.toLowerCase());
      
      allTopics.forEach(topic => {
        const topicWords = topic.split(' ');
        const frequency = words.filter(word => 
          topicWords.some(topicWord => word.includes(topicWord))
        ).length;
        
        topicFrequency[topic] = frequency;
      });

      // Sort by frequency and return top topics
      const sortedTopics = Object.entries(topicFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20) // Top 20 topics
        .map(([name, frequency]) => ({
          name: name,
          frequency: frequency,
          keywords: this.extractKeywordsForTopic(text, name)
        }));

      return sortedTopics;
    } catch (error) {
      console.error('Topic extraction error:', error);
      return [];
    }
  }

  /**
   * Extract keywords related to a specific topic
   * @param {string} text - Full text
   * @param {string} topic - Topic to find keywords for
   * @returns {Array} - Array of related keywords
   */
  extractKeywordsForTopic(text, topic) {
    try {
      const doc = compromise(text);
      const sentences = doc.sentences().out('array');
      
      // Find sentences containing the topic
      const relevantSentences = sentences.filter(sentence => 
        sentence.toLowerCase().includes(topic.toLowerCase())
      );

      // Extract keywords from relevant sentences
      const keywords = [];
      relevantSentences.forEach(sentence => {
        const sentenceDoc = compromise(sentence);
        const nouns = sentenceDoc.match('#Noun').out('array');
        const adjectives = sentenceDoc.match('#Adjective').out('array');
        const verbs = sentenceDoc.match('#Verb').out('array');
        
        keywords.push(...nouns, ...adjectives, ...verbs);
      });

      // Filter and return unique keywords
      return [...new Set(keywords)]
        .filter(keyword => keyword.toLowerCase() !== topic.toLowerCase())
        .slice(0, 10); // Top 10 keywords per topic
    } catch (error) {
      console.error('Keyword extraction error:', error);
      return [];
    }
  }

  /**
   * Detect subject from text content
   * @param {string} text - Text to analyze
   * @returns {string} - Detected subject
   */
  detectSubject(text) {
    const subjectKeywords = {
      'mathematics': ['equation', 'formula', 'theorem', 'proof', 'algebra', 'calculus', 'geometry', 'trigonometry', 'statistics'],
      'physics': ['force', 'energy', 'momentum', 'velocity', 'acceleration', 'quantum', 'thermodynamics', 'electromagnetics'],
      'chemistry': ['molecule', 'atom', 'compound', 'reaction', 'element', 'periodic', 'organic', 'inorganic'],
      'biology': ['cell', 'organism', 'species', 'evolution', 'genetics', 'ecosystem', 'anatomy', 'physiology'],
      'computer-science': ['algorithm', 'programming', 'software', 'database', 'network', 'system', 'code', 'binary'],
      'history': ['century', 'war', 'empire', 'civilization', 'revolution', 'ancient', 'medieval', 'modern'],
      'literature': ['poem', 'novel', 'author', 'character', 'plot', 'theme', 'literary', 'prose'],
      'economics': ['market', 'supply', 'demand', 'inflation', 'economy', 'trade', 'finance', 'investment']
    };

    const textLower = text.toLowerCase();
    const subjectScores = {};

    Object.entries(subjectKeywords).forEach(([subject, keywords]) => {
      const score = keywords.reduce((count, keyword) => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = textLower.match(regex);
        return count + (matches ? matches.length : 0);
      }, 0);
      subjectScores[subject] = score;
    });

    // Return subject with highest score
    const detectedSubject = Object.entries(subjectScores)
      .sort(([,a], [,b]) => b - a)[0];

    return detectedSubject && detectedSubject[1] > 0 ? detectedSubject[0] : 'general';
  }

  /**
   * Extract potential questions from text
   * @param {string} text - Text to analyze
   * @returns {Array} - Array of potential questions
   */
  extractPotentialQuestions(text) {
    const sentences = text.split(/[.!?]+/);
    const questions = [];

    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (trimmed.length > 10) {
        // Check if sentence contains question indicators
        const questionWords = ['what', 'how', 'why', 'when', 'where', 'which', 'who'];
        const hasQuestionWord = questionWords.some(word => 
          trimmed.toLowerCase().includes(word)
        );

        // Check if sentence contains definition patterns
        const definitionPatterns = ['is defined as', 'refers to', 'means', 'is known as'];
        const hasDefinition = definitionPatterns.some(pattern => 
          trimmed.toLowerCase().includes(pattern)
        );

        if (hasQuestionWord || hasDefinition) {
          questions.push({
            text: trimmed,
            type: hasQuestionWord ? 'direct' : 'definition',
            confidence: hasQuestionWord ? 0.8 : 0.6
          });
        }
      }
    });

    return questions.slice(0, 10); // Return top 10 potential questions
  }
}

module.exports = new PDFService();