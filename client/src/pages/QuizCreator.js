import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Alert,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Grid,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Quiz as QuizIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { questionsAPI, quizAPI } from '../services/api';

const QuizCreator = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    subject: '',
    timeLimit: 60,
    randomizeQuestions: false,
    randomizeOptions: false,
    showCorrectAnswers: true,
    allowRetakes: true,
    passingScore: 70,
  });
  const [filters, setFilters] = useState({
    subject: '',
    difficulty: '',
    questionType: '',
  });
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [filters]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await questionsAPI.getQuestions({
        ...filters,
        limit: 50,
      });
      setQuestions(response.data.questions || []);
    } catch (err) {
      setError('Failed to fetch questions');
      console.error('Questions error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionToggle = (question) => {
    const isSelected = selectedQuestions.find(q => q._id === question._id);
    if (isSelected) {
      setSelectedQuestions(selectedQuestions.filter(q => q._id !== question._id));
    } else {
      setSelectedQuestions([...selectedQuestions, question]);
    }
  };

  const handleCreateQuiz = async () => {
    if (!quizData.title.trim()) {
      setError('Quiz title is required');
      return;
    }
    if (selectedQuestions.length === 0) {
      setError('Please select at least one question');
      return;
    }

    try {
      setLoading(true);
      const response = await quizAPI.createQuiz({
        title: quizData.title,
        description: quizData.description,
        subject: quizData.subject || 'general',
        questionIds: selectedQuestions.map(q => q._id),
        settings: {
          timeLimit: quizData.timeLimit > 0 ? quizData.timeLimit : null,
          randomizeQuestions: quizData.randomizeQuestions,
          randomizeOptions: quizData.randomizeOptions,
          showCorrectAnswers: quizData.showCorrectAnswers,
          allowRetakes: quizData.allowRetakes,
          passingScore: quizData.passingScore,
        },
        topics: [...new Set(selectedQuestions.flatMap(q => q.topics))],
      });

      setSuccess('Quiz created successfully!');
      setError(null);
      
      // Reset form
      setQuizData({
        title: '',
        description: '',
        subject: '',
        timeLimit: 60,
        randomizeQuestions: false,
        randomizeOptions: false,
        showCorrectAnswers: true,
        allowRetakes: true,
        passingScore: 70,
      });
      setSelectedQuestions([]);
      
    } catch (err) {
      setError('Failed to create quiz');
      console.error('Create quiz error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 'bold' }}>
        Quiz Creator
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Quiz Configuration */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Quiz Details
              </Typography>
              
              <TextField
                fullWidth
                label="Quiz Title *"
                value={quizData.title}
                onChange={(e) => setQuizData({...quizData, title: e.target.value})}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={quizData.description}
                onChange={(e) => setQuizData({...quizData, description: e.target.value})}
                sx={{ mb: 2 }}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={quizData.subject}
                  label="Subject"
                  onChange={(e) => setQuizData({...quizData, subject: e.target.value})}
                >
                  <MenuItem value="">All Subjects</MenuItem>
                  <MenuItem value="mathematics">Mathematics</MenuItem>
                  <MenuItem value="physics">Physics</MenuItem>
                  <MenuItem value="chemistry">Chemistry</MenuItem>
                  <MenuItem value="biology">Biology</MenuItem>
                  <MenuItem value="computer-science">Computer Science</MenuItem>
                  <MenuItem value="discrete">Discrete</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Time Limit (minutes)"
                type="number"
                value={quizData.timeLimit}
                onChange={(e) => setQuizData({...quizData, timeLimit: parseInt(e.target.value) || 0})}
                sx={{ mb: 2 }}
                helperText="Set to 0 for no time limit"
              />

              <TextField
                fullWidth
                label="Passing Score (%)"
                type="number"
                value={quizData.passingScore}
                onChange={(e) => setQuizData({...quizData, passingScore: parseInt(e.target.value) || 70})}
                sx={{ mb: 2 }}
              />

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Quiz Settings
              </Typography>
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={quizData.randomizeQuestions}
                    onChange={(e) => setQuizData({...quizData, randomizeQuestions: e.target.checked})}
                  />
                }
                label="Randomize Questions"
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={quizData.randomizeOptions}
                    onChange={(e) => setQuizData({...quizData, randomizeOptions: e.target.checked})}
                  />
                }
                label="Randomize Options"
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={quizData.showCorrectAnswers}
                    onChange={(e) => setQuizData({...quizData, showCorrectAnswers: e.target.checked})}
                  />
                }
                label="Show Correct Answers"
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={quizData.allowRetakes}
                    onChange={(e) => setQuizData({...quizData, allowRetakes: e.target.checked})}
                  />
                }
                label="Allow Retakes"
              />
            </CardContent>
          </Card>

          {/* Selected Questions Summary */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Selected Questions ({selectedQuestions.length})
              </Typography>
              
              {selectedQuestions.length > 0 ? (
                <>
                  <Box sx={{ mb: 2 }}>
                    {selectedQuestions.slice(0, 3).map((question) => (
                      <Chip
                        key={question._id}
                        label={`${question.questionText.substring(0, 30)}...`}
                        onDelete={() => handleQuestionToggle(question)}
                        sx={{ m: 0.5 }}
                        size="small"
                      />
                    ))}
                    {selectedQuestions.length > 3 && (
                      <Typography variant="caption" color="text.secondary">
                        ... and {selectedQuestions.length - 3} more
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setPreviewOpen(true)}
                    >
                      Preview Quiz
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setSelectedQuestions([])}
                    >
                      Clear All
                    </Button>
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={loading ? <CircularProgress size={20} /> : <QuizIcon />}
                    onClick={handleCreateQuiz}
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Quiz'}
                  </Button>
                </>
              ) : (
                <Alert severity="info">
                  Select questions from the question bank to create your quiz.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Question Bank */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Question Bank
              </Typography>

              {/* Filters */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Subject</InputLabel>
                    <Select
                      value={filters.subject}
                      label="Subject"
                      onChange={(e) => setFilters({...filters, subject: e.target.value})}
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="mathematics">Mathematics</MenuItem>
                      <MenuItem value="physics">Physics</MenuItem>
                      <MenuItem value="chemistry">Chemistry</MenuItem>
                      <MenuItem value="biology">Biology</MenuItem>
                      <MenuItem value="computer-science">Computer Science</MenuItem>
                      <MenuItem value="discrete">Discrete</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Difficulty</InputLabel>
                    <Select
                      value={filters.difficulty}
                      label="Difficulty"
                      onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="easy">Easy</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="hard">Hard</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={filters.questionType}
                      label="Type"
                      onChange={(e) => setFilters({...filters, questionType: e.target.value})}
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="multiple-choice">Multiple Choice</MenuItem>
                      <MenuItem value="true-false">True/False</MenuItem>
                      <MenuItem value="short-answer">Short Answer</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Questions List */}
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : questions.length > 0 ? (
                <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
                  {questions.map((question) => {
                    const isSelected = selectedQuestions.find(q => q._id === question._id);
                    return (
                      <Card
                        key={question._id}
                        variant="outlined"
                        sx={{
                          mb: 1,
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'primary.50' : 'inherit',
                          border: isSelected ? 2 : 1,
                          borderColor: isSelected ? 'primary.main' : 'divider',
                        }}
                        onClick={() => handleQuestionToggle(question)}
                      >
                        <CardContent sx={{ py: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                            <IconButton size="small" color={isSelected ? 'primary' : 'default'}>
                              {isSelected ? <CheckIcon /> : <AddIcon />}
                            </IconButton>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body1" sx={{ mb: 1 }}>
                                {question.questionText}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip label={question.subject} color="primary" size="small" variant="outlined" />
                                <Chip label={question.difficulty} color={getDifficultyColor(question.difficulty)} size="small" />
                                <Chip label={question.questionType.replace('-', ' ')} size="small" variant="outlined" />
                              </Box>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              ) : (
                <Alert severity="warning">
                  No questions found. Please upload question papers and generate questions first.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Quiz Preview</DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ mb: 1 }}>{quizData.title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {quizData.description}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>Time Limit:</strong> {quizData.timeLimit > 0 ? `${quizData.timeLimit} minutes` : 'No limit'} | 
            <strong> Passing Score:</strong> {quizData.passingScore}%
          </Typography>
          
          <List>
            {selectedQuestions.map((question, index) => (
              <ListItem key={question._id}>
                <ListItemText
                  primary={`${index + 1}. ${question.questionText}`}
                  secondary={`${question.difficulty} • ${question.questionType}`}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default QuizCreator;