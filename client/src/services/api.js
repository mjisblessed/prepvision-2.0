import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    console.error('API Error:', errorMessage);
    return Promise.reject(new Error(errorMessage));
  }
);

// Upload API
export const uploadAPI = {
  // Upload PDF file
  uploadPDF: (formData) => {
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Generate questions from uploaded PDF
  generateQuestions: (questionPaperId, options = {}) => {
    return api.post(`/upload/${questionPaperId}/generate-questions`, options);
  },

  // Get all question papers
  getQuestionPapers: (params = {}) => {
    return api.get('/upload/papers', { params });
  },

  // Get question paper details
  getQuestionPaper: (id) => {
    return api.get(`/upload/papers/${id}`);
  },

  // Delete question paper
  deleteQuestionPaper: (id) => {
    return api.delete(`/upload/papers/${id}`);
  },
};

// Questions API
export const questionsAPI = {
  // Get all questions
  getQuestions: (params = {}) => {
    return api.get('/questions', { params });
  },

  // Get question by ID
  getQuestion: (id) => {
    return api.get(`/questions/${id}`);
  },

  // Update question
  updateQuestion: (id, data) => {
    return api.put(`/questions/${id}`, data);
  },

  // Delete question
  deleteQuestion: (id) => {
    return api.delete(`/questions/${id}`);
  },

  // Get questions by subject
  getQuestionsBySubject: (subject, params = {}) => {
    return api.get(`/questions/by-subject/${subject}`, { params });
  },

  // Search questions
  searchQuestions: (searchData) => {
    return api.post('/questions/search', searchData);
  },
};

// Quiz API
export const quizAPI = {
  // Create quiz
  createQuiz: (quizData) => {
    return api.post('/quiz/create', quizData);
  },

  // Get all quizzes
  getQuizzes: (params = {}) => {
    return api.get('/quiz', { params });
  },

  // Get quiz by ID
  getQuiz: (id) => {
    return api.get(`/quiz/${id}`);
  },

  // Start quiz attempt
  startQuiz: (id, data = {}) => {
    return api.post(`/quiz/${id}/start`, data);
  },

  // Submit quiz answer
  submitAnswer: (attemptId, answerData) => {
    return api.post(`/quiz/attempts/${attemptId}/answer`, answerData);
  },

  // Complete quiz
  completeQuiz: (attemptId) => {
    return api.post(`/quiz/attempts/${attemptId}/complete`);
  },

  // Get quiz results
  getQuizResults: (attemptId) => {
    return api.get(`/quiz/attempts/${attemptId}/results`);
  },

  // Delete quiz
  deleteQuiz: (id) => {
    return api.delete(`/quiz/${id}`);
  },
};

// Flashcards API
export const flashcardsAPI = {
  // Create flashcards
  createFlashcards: (data) => {
    return api.post('/flashcards/create', data);
  },

  // Get flashcards
  getFlashcards: (params = {}) => {
    return api.get('/flashcards', { params });
  },

  // Get study session
  getStudySession: (params = {}) => {
    return api.get('/flashcards/study-session', { params });
  },

  // Review flashcard
  reviewFlashcard: (id, response) => {
    return api.post(`/flashcards/${id}/review`, { response });
  },

  // Update flashcard
  updateFlashcard: (id, data) => {
    return api.put(`/flashcards/${id}`, data);
  },

  // Delete flashcard
  deleteFlashcard: (id) => {
    return api.delete(`/flashcards/${id}`);
  },

  // Get flashcard statistics
  getFlashcardStats: (subject) => {
    const endpoint = subject ? `/flashcards/statistics/${subject}` : '/flashcards/statistics';
    return api.get(endpoint);
  },
};

// Analytics API
export const analyticsAPI = {
  // Get dashboard analytics
  getDashboard: () => {
    return api.get('/analytics/dashboard');
  },

  // Get subject analytics
  getSubjects: () => {
    return api.get('/analytics/subjects');
  },

  // Get topic analytics
  getTopics: (subject, params = {}) => {
    const endpoint = subject ? `/analytics/topics/${subject}` : '/analytics/topics';
    return api.get(endpoint, { params });
  },

  // Get question performance
  getQuestionPerformance: (params = {}) => {
    return api.get('/analytics/performance/questions', { params });
  },

  // Get quiz analytics
  getQuizAnalytics: (params = {}) => {
    return api.get('/analytics/performance/quizzes', { params });
  },

  // Get trending topics
  getTrendingTopics: (params = {}) => {
    return api.get('/analytics/trending/topics', { params });
  },

  // Export analytics data
  exportData: (type, params = {}) => {
    return api.get(`/analytics/export/${type}`, { params });
  },
};

// Health check
export const healthCheck = () => {
  return api.get('/health');
};

export default api;