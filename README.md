# PrepVision 2.0

An AI-powered question paper analysis and quiz generation platform.

## Quick Start

1. **Install dependencies**: `npm install && npm run install-client`
2. **Setup environment**: Copy `.env.example` to `.env` and add your Gemini API key
3. **Run MongoDB**: Ensure MongoDB is running locally or use cloud connection
4. **Start development**: `npm run dev`

## Features

- 📄 PDF text extraction from question papers
- 🤖 AI-powered question generation using Google Gemini
- 📝 Interactive quiz creation and management
- 🃏 Flashcards with spaced repetition learning
- 📊 Analytics and topic frequency tracking
- 🎯 Subject-wise performance monitoring

## Tech Stack

**Backend**: Node.js, Express, MongoDB, Google Gemini AI  
**Frontend**: React.js, Material-UI, Chart.js  
**AI/ML**: Natural language processing, PDF parsing

## API Endpoints

- `POST /api/upload` - Upload PDF and extract text
- `POST /api/upload/:id/generate-questions` - Generate AI questions
- `POST /api/quiz/create` - Create new quiz
- `GET /api/flashcards/study-session` - Get flashcards for review
- `GET /api/analytics/dashboard` - Get analytics overview

See [detailed documentation](./README_DETAILED.md) for complete setup and usage instructions.

## Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/prepvision
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
```

## Team

Noor, Mithas, Namita, Rivea, Diya

## License

MIT License - see LICENSE file for details.
