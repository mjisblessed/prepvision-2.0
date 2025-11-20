import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Alert,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  TextField,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Paper,
  Grid,
} from '@mui/material';
import {
  Timer as TimerIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Send as SubmitIcon,
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { quizAPI } from '../services/api';

const QuizTaker = () => {
  const { id: quizId } = useParams();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [results, setResults] = useState(null);
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [autoSubmit, setAutoSubmit] = useState(false);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    if (!quizId || quizId === 'undefined') {
      setError('Invalid quiz ID');
      setLoading(false);
      return;
    }
    fetchQuiz();
  }, [quizId]);

  // Timer effect
  useEffect(() => {
    let timer;
    if (quizStarted && !quizCompleted && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setAutoSubmit(true);
            handleSubmitQuiz(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [quizStarted, quizCompleted, timeRemaining]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const response = await quizAPI.getQuiz(quizId);
      const quizData = response.data;
      
      console.log('Fetched quiz data:', quizData); // Debug log
      
      // Transform the nested question structure to flat structure
      if (quizData.questions && quizData.questions.length > 0) {
        // Check if questions are nested (quiz.questions[].question) or flat
        const firstQuestion = quizData.questions[0];
        if (firstQuestion.question && typeof firstQuestion.question === 'object') {
          // Transform nested structure to flat
          quizData.questions = quizData.questions.map(item => ({
            ...item.question,
            points: item.points || 1
          }));
        }
      }
      
      // Randomize questions if setting is enabled
      if (quizData.settings?.randomizeQuestions) {
        quizData.questions = [...quizData.questions].sort(() => Math.random() - 0.5);
      }

      // Randomize options if setting is enabled
      if (quizData.settings?.randomizeOptions) {
        quizData.questions = quizData.questions.map(q => ({
          ...q,
          options: q.questionType === 'multiple-choice' && q.options
            ? [...q.options].sort(() => Math.random() - 0.5)
            : q.options
        }));
      }

      console.log('Processed quiz data:', quizData); // Debug log
      setQuiz(quizData);
      if (quizData.settings?.timeLimit) {
        setTimeRemaining(quizData.settings.timeLimit * 60); // Convert to seconds
      }
    } catch (err) {
      setError('Failed to load quiz');
      console.error('Quiz error:', err);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setStartTime(Date.now());
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const toggleFlagQuestion = (questionIndex) => {
    const newFlagged = new Set(flaggedQuestions);
    if (newFlagged.has(questionIndex)) {
      newFlagged.delete(questionIndex);
    } else {
      newFlagged.add(questionIndex);
    }
    setFlaggedQuestions(newFlagged);
  };

  const handleSubmitQuiz = async (isAutoSubmit = false) => {
    try {
      setLoading(true);
      
      // Prepare answers for submission
      const submissionAnswers = quiz.questions.map(question => ({
        questionId: question._id,
        answer: answers[question._id] || '',
        timeSpent: 0, // Could track this if needed
      }));

      const response = await quizAPI.submitQuiz(quizId, {
        answers: submissionAnswers,
        completedAt: new Date().toISOString(),
        timeSpent: quiz.settings?.timeLimit ? 
          (quiz.settings.timeLimit * 60) - timeRemaining : 
          startTime ? Date.now() - startTime : 0,
      });

      setResults(response.data);
      setQuizCompleted(true);
      setSubmitDialogOpen(false);
      
      if (isAutoSubmit) {
        setAutoSubmit(true);
      }
    } catch (err) {
      setError('Failed to submit quiz');
      console.error('Submit quiz error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const answeredCount = Object.keys(answers).length;
    return (answeredCount / quiz.questions.length) * 100;
  };

  const currentQuestion = quiz?.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz?.questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  // Debug log for current question
  console.log('Current question:', currentQuestion);
  console.log('Quiz questions length:', quiz?.questions?.length);

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!quiz) {
    return (
      <Container maxWidth="md">
        <Alert severity="warning" sx={{ mt: 4 }}>
          Quiz not found
        </Alert>
      </Container>
    );
  }

  // Check if quiz has questions
  if (!quiz.questions || quiz.questions.length === 0) {
    return (
      <Container maxWidth="md">
        <Alert severity="warning" sx={{ mt: 4 }}>
          This quiz has no questions available.
        </Alert>
      </Container>
    );
  }

  // Quiz Results View
  if (quizCompleted && results) {
    return (
      <Container maxWidth="md">
        <Card sx={{ mt: 4 }}>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" sx={{ mb: 2 }}>
              Quiz Completed!
            </Typography>
            {autoSubmit && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                Quiz was automatically submitted due to time expiry.
              </Alert>
            )}
            
            <Grid container spacing={3} sx={{ mt: 3 }}>
              <Grid item xs={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h3" color="primary">
                    {results.score}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Final Score
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h3" color={results.passed ? 'success.main' : 'error.main'}>
                    {results.correctAnswers}/{results.totalQuestions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Correct Answers
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Chip 
                label={results.passed ? 'PASSED' : 'FAILED'} 
                color={results.passed ? 'success' : 'error'}
                sx={{ fontSize: 16, py: 1, px: 2 }}
              />
            </Box>

            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button variant="outlined" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
              {quiz.settings?.showCorrectAnswers && (
                <Button variant="contained" onClick={() => setQuizCompleted(false)}>
                  Review Answers
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // Quiz Start Screen
  if (!quizStarted) {
    return (
      <Container maxWidth="md">
        <Card sx={{ mt: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>
              {quiz.title}
            </Typography>
            {quiz.description && (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {quiz.description}
              </Typography>
            )}
            
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">{quiz.questions.length}</Typography>
                  <Typography variant="caption">Questions</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">
                    {quiz.settings?.timeLimit ? `${quiz.settings.timeLimit} min` : 'No limit'}
                  </Typography>
                  <Typography variant="caption">Time</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">{quiz.settings?.passingScore || 70}%</Typography>
                  <Typography variant="caption">Pass Mark</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">{quiz.subject}</Typography>
                  <Typography variant="caption">Subject</Typography>
                </Paper>
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mb: 3 }}>
              Instructions:
              <ul>
                <li>Answer all questions to the best of your ability</li>
                <li>You can flag questions for review</li>
                <li>Navigate between questions using the Next/Previous buttons</li>
                {quiz.settings?.timeLimit && <li>Complete the quiz within the time limit</li>}
                {!quiz.settings?.allowRetakes && <li>You can only take this quiz once</li>}
              </ul>
            </Alert>

            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={startQuiz}
              sx={{ py: 2 }}
            >
              Start Quiz
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // Quiz Taking View
  return (
    <Container maxWidth="md">
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">{quiz.title}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {timeRemaining !== null && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimerIcon color={timeRemaining < 300 ? 'error' : 'primary'} />
              <Typography 
                variant="h6" 
                color={timeRemaining < 300 ? 'error' : 'inherit'}
              >
                {formatTime(timeRemaining)}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Progress */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </Typography>
          <Typography variant="body2">
            {Object.keys(answers).length} answered
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={getProgressPercentage()} />
      </Box>

      {/* Current Question */}
      {currentQuestion && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="h6" sx={{ flex: 1, pr: 2 }}>
                {currentQuestionIndex + 1}. {currentQuestion.questionText}
              </Typography>
              <Button
                size="small"
                onClick={() => toggleFlagQuestion(currentQuestionIndex)}
                color={flaggedQuestions.has(currentQuestionIndex) ? 'warning' : 'default'}
                startIcon={<FlagIcon />}
              >
                Flag
              </Button>
            </Box>

            <FormControl component="fieldset" fullWidth>
              {currentQuestion.questionType === 'multiple-choice' && currentQuestion.options && (
                <RadioGroup
                  value={answers[currentQuestion._id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                >
                  {currentQuestion.options.map((option, index) => {
                    // Handle both string options and object options
                    const optionText = typeof option === 'string' ? option : option.text;
                    return (
                      <FormControlLabel
                        key={index}
                        value={optionText}
                        control={<Radio />}
                        label={optionText}
                      />
                    );
                  })}
                </RadioGroup>
              )}

              {currentQuestion.questionType === 'true-false' && (
                <RadioGroup
                  value={answers[currentQuestion._id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                >
                  <FormControlLabel value="true" control={<Radio />} label="True" />
                  <FormControlLabel value="false" control={<Radio />} label="False" />
                </RadioGroup>
              )}

              {currentQuestion.questionType === 'short-answer' && (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={answers[currentQuestion._id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                  placeholder="Type your answer here..."
                />
              )}
            </FormControl>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          disabled={isFirstQuestion}
          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
        >
          Previous
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {quiz.questions.map((_, index) => (
            <Button
              key={index}
              size="small"
              variant={index === currentQuestionIndex ? 'contained' : 'outlined'}
              color={
                flaggedQuestions.has(index) ? 'warning' :
                answers[quiz.questions[index]._id] ? 'success' : 'primary'
              }
              onClick={() => setCurrentQuestionIndex(index)}
              sx={{ minWidth: 36 }}
            >
              {index + 1}
            </Button>
          ))}
        </Box>

        {isLastQuestion ? (
          <Button
            variant="contained"
            color="success"
            startIcon={<SubmitIcon />}
            onClick={() => setSubmitDialogOpen(true)}
          >
            Submit Quiz
          </Button>
        ) : (
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={() => setCurrentQuestionIndex(prev => Math.min(quiz.questions.length - 1, prev + 1))}
          >
            Next
          </Button>
        )}
      </Box>

      {/* Submit Confirmation Dialog */}
      <Dialog open={submitDialogOpen} onClose={() => setSubmitDialogOpen(false)}>
        <DialogTitle>Submit Quiz</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to submit your quiz? You have answered{' '}
            {Object.keys(answers).length} out of {quiz.questions.length} questions.
          </Typography>
          {flaggedQuestions.size > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              You have {flaggedQuestions.size} flagged question(s) for review.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => handleSubmitQuiz()} variant="contained" color="success">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default QuizTaker;