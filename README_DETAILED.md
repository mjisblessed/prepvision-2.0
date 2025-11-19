# PrepVision 2.0

An AI-powered question paper analysis and quiz generation platform that helps students and educators create predictable questions from uploaded PDF documents.

## 🚀 Features

- **PDF Text Extraction**: Upload question papers in PDF format and extract text automatically
- **AI Question Generation**: Use Google Gemini API to generate predictable questions from extracted content
- **Smart Quiz Creation**: Create interactive quizzes with multiple question types
- **Flashcards System**: Generate and study flashcards with spaced repetition algorithm
- **Analytics Dashboard**: Track recurring topics and questions by subject
- **Performance Tracking**: Monitor quiz performance and learning progress

## 🛠️ Technology Stack

### Backend

- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Google Gemini AI** for question generation
- **PDF-Parse** for text extraction
- **Natural** and **Compromise** for text processing
- **Multer** for file uploads

### Frontend

- **React.js** with modern hooks
- **React Router** for navigation
- **Axios** for API communication
- **Material-UI** for components
- **Chart.js** for analytics visualization

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js (v14 or higher)
- MongoDB (local installation or cloud instance)
- Google Gemini API key
- Git

## 🔧 Installation

### 1. Clone the repository

```bash
git clone https://github.com/mjisblessed/prepvision-2.0.git
cd prepvision-2.0
```

### 2. Install dependencies

```bash
# Install server dependencies
npm install

# Install client dependencies
npm run install-client
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
nano .env
```

Required environment variables:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/prepvision
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_jwt_secret_key_here
```

### 4. Setup MongoDB

Make sure MongoDB is running on your system:

```bash
# For local MongoDB
mongod

# Or use MongoDB Atlas cloud connection string in .env
```

### 5. Get Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/)
2. Create a new API key
3. Add the key to your `.env` file

## 🚦 Running the Application

### Development Mode

```bash
# Run both server and client concurrently
npm run dev

# Or run separately
npm run server  # Backend server on port 5000
npm run client  # React client on port 3000
```

### Production Mode

```bash
# Build the React client
npm run build

# Start production server
npm start
```

## 📖 API Documentation

### Upload Endpoints

- `POST /api/upload` - Upload PDF and extract text
- `POST /api/upload/:id/generate-questions` - Generate questions from PDF
- `GET /api/upload/papers` - Get all uploaded papers

### Question Management

- `GET /api/questions` - Get questions with filtering
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question

### Quiz Management

- `POST /api/quiz/create` - Create new quiz
- `GET /api/quiz` - Get all quizzes
- `POST /api/quiz/:id/start` - Start quiz attempt
- `POST /api/quiz/attempts/:id/complete` - Complete quiz

### Flashcards

- `POST /api/flashcards/create` - Create flashcards
- `GET /api/flashcards/study-session` - Get cards for review
- `POST /api/flashcards/:id/review` - Review flashcard

### Analytics

- `GET /api/analytics/dashboard` - Dashboard overview
- `GET /api/analytics/subjects` - Subject-wise analytics
- `GET /api/analytics/topics/:subject` - Topic frequency analysis

## 🎯 Usage Guide

### 1. Upload Question Papers

1. Navigate to the upload page
2. Select a PDF file (max 25MB)
3. Choose subject and other metadata
4. Click upload to process

### 2. Generate Questions

1. After upload, click "Generate Questions"
2. Specify number of questions and types
3. AI will analyze text and create questions
4. Review and edit generated questions

### 3. Create Quizzes

1. Go to Quiz Creator
2. Select questions from the question bank
3. Configure quiz settings (time, difficulty)
4. Save and share quiz

### 4. Study with Flashcards

1. Create flashcards from questions or papers
2. Start study session
3. Review cards and rate difficulty
4. System tracks progress with spaced repetition

### 5. View Analytics

1. Dashboard shows overview statistics
2. Subject analysis reveals trending topics
3. Performance tracking shows improvement
4. Export data for further analysis

## 🏗️ Project Structure

```
prepvision-2.0/
├── server/
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Custom middleware
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   └── index.js         # Server entry point
├── client/
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service layer
│   │   ├── utils/       # Helper functions
│   │   └── App.js       # Main app component
├── uploads/             # File upload directory
├── package.json         # Dependencies
└── README.md           # This file
```

## 🔒 Security Features

- File upload validation (PDF only)
- File size limits (25MB max)
- Rate limiting on API endpoints
- Input validation and sanitization
- Environment variable protection
- CORS configuration

## 🧪 Testing

```bash
# Run server tests
npm test

# Run client tests
cd client && npm test
```

## 📊 Database Schema

### Question Papers

```javascript
{
  filename: String,
  extractedText: String,
  subject: String,
  topics: [{ name: String, frequency: Number }],
  metadata: { pageCount: Number, fileSize: Number }
}
```

### Questions

```javascript
{
  questionText: String,
  questionType: String,
  options: [{ text: String, isCorrect: Boolean }],
  difficulty: String,
  subject: String,
  performance: { correctAnswers: Number, totalAttempts: Number }
}
```

## 🚀 Deployment

### Deploy to Heroku

1. Create Heroku app: `heroku create prepvision-app`
2. Set environment variables: `heroku config:set GEMINI_API_KEY=your_key`
3. Deploy: `git push heroku main`

### Deploy to Vercel/Netlify

1. Build React app: `npm run build`
2. Deploy build folder to hosting platform
3. Configure API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**

   - Ensure MongoDB is running
   - Check connection string in `.env`

2. **Gemini API Error**

   - Verify API key is correct
   - Check API quotas and limits

3. **File Upload Fails**

   - Ensure `uploads/` directory exists
   - Check file size (max 25MB)
   - Verify PDF format

4. **Build Fails**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility

### Support

For issues and questions:

- Create an issue on GitHub
- Check existing documentation
- Review API responses for error details

## 📞 Contact

- Developer: PrepVision Team
- Email: support@prepvision.com
- GitHub: [@mjisblessed](https://github.com/mjisblessed)

---

Built with ❤️ for better education and learning outcomes.
