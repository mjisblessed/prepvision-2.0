const mongoose = require('mongoose');
const GeminiService = require('./server/services/geminiService');
const QuestionPaper = require('./server/models/QuestionPaper');
const Flashcard = require('./server/models/Flashcard');
require('dotenv').config();

async function testFlashcardGeneration() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if there are any question papers
    const questionPapers = await QuestionPaper.find().limit(1);
    console.log(`📚 Found ${questionPapers.length} question papers in database`);

    // Check if there are any existing flashcards
    const existingFlashcards = await Flashcard.find();
    console.log(`💳 Found ${existingFlashcards.length} existing flashcards`);

    if (questionPapers.length > 0) {
      const paper = questionPapers[0];
      console.log(`\n🔍 Testing flashcard generation with paper: ${paper.originalName}`);
      console.log(`📖 Subject: ${paper.subject}`);
      console.log(`📝 Text length: ${paper.extractedText ? paper.extractedText.length : 0} characters`);

      if (paper.extractedText && paper.extractedText.length > 100) {
        console.log('\n🚀 Generating flashcards with AI...');
        
        // Test the Gemini service directly
        const aiFlashcards = await GeminiService.generateFlashcards(
          paper.extractedText.substring(0, 2000), // Use first 2000 characters for testing
          paper.subject,
          paper.topics || [],
          5 // Generate 5 cards for testing
        );

        console.log(`\n✨ Generated ${aiFlashcards.length} flashcards:`);
        aiFlashcards.forEach((card, index) => {
          console.log(`\n${index + 1}. Front: ${card.front}`);
          console.log(`   Back: ${card.back}`);
          console.log(`   Difficulty: ${card.difficulty || 'medium'}`);
        });

        // Test saving to database
        console.log('\n💾 Saving to database...');
        let savedCount = 0;
        for (const cardData of aiFlashcards) {
          try {
            const flashcard = new Flashcard({
              ...cardData,
              sourcePaper: paper._id,
              tags: ['test-generated', ...cardData.tags || []]
            });
            await flashcard.save();
            savedCount++;
          } catch (saveError) {
            console.error(`❌ Error saving card: ${saveError.message}`);
          }
        }
        console.log(`✅ Successfully saved ${savedCount}/${aiFlashcards.length} flashcards`);
      } else {
        console.log('⚠️ Paper has insufficient text for flashcard generation');
      }
    } else {
      console.log('\n⚠️ No question papers found. Upload a PDF first to test flashcard generation.');
      
      // Show how to test with sample text
      console.log('\n🧪 Testing with sample text instead...');
      const sampleText = `
        Mathematics is the study of numbers, shapes, patterns, and logical structures. 
        Algebra is a branch of mathematics that deals with variables and equations.
        A quadratic equation is a polynomial equation of the second degree.
        The Pythagorean theorem states that in a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides.
        Calculus is the mathematical study of continuous change and is divided into differential and integral calculus.
      `;
      
      const testFlashcards = await GeminiService.generateFlashcards(
        sampleText,
        'mathematics',
        [{ name: 'algebra' }, { name: 'geometry' }],
        3
      );

      console.log(`\n✨ Generated ${testFlashcards.length} test flashcards:`);
      testFlashcards.forEach((card, index) => {
        console.log(`\n${index + 1}. Front: ${card.front}`);
        console.log(`   Back: ${card.back}`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the test
testFlashcardGeneration().catch(console.error);