import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Pagination,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CorrectIcon,
  Cancel as IncorrectIcon,
} from '@mui/icons-material';
import { questionsAPI } from '../services/api';

const Questions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    subject: '',
    difficulty: '',
    questionType: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [filters, pagination.page]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: 10,
        ...filters,
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key];
      });

      const response = await questionsAPI.getQuestions(params);
      setQuestions(response.data.questions);
      setPagination(response.data.pagination);
    } catch (err) {
      setError('Failed to fetch questions');
      console.error('Questions error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchQuestions();
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleEditQuestion = (question) => {
    setSelectedQuestion({ ...question });
    setEditDialogOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!selectedQuestion) return;

    try {
      await questionsAPI.updateQuestion(selectedQuestion._id, selectedQuestion);
      setEditDialogOpen(false);
      fetchQuestions();
    } catch (err) {
      setError('Failed to update question');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await questionsAPI.deleteQuestion(questionId);
        fetchQuestions();
      } catch (err) {
        setError('Failed to delete question');
      }
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

  const getTypeLabel = (type) => {
    const labels = {
      'multiple-choice': 'Multiple Choice',
      'true-false': 'True/False',
      'short-answer': 'Short Answer',
      'essay': 'Essay',
      'fill-blank': 'Fill in the Blank',
    };
    return labels[type] || type;
  };

  const QuestionCard = ({ question }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip 
                label={question.subject} 
                color="primary" 
                variant="outlined" 
                size="small" 
              />
              <Chip 
                label={question.difficulty} 
                color={getDifficultyColor(question.difficulty)} 
                size="small" 
              />
              <Chip 
                label={getTypeLabel(question.questionType)} 
                variant="outlined" 
                size="small" 
              />
              {question.bloomLevel && (
                <Chip 
                  label={question.bloomLevel} 
                  color="secondary" 
                  variant="outlined" 
                  size="small" 
                />
              )}
            </Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {question.questionText}
            </Typography>
          </Box>
          <Box sx={{ ml: 2 }}>
            <IconButton onClick={() => handleEditQuestion(question)}>
              <EditIcon />
            </IconButton>
            <IconButton onClick={() => handleDeleteQuestion(question._id)} color="error">
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Multiple Choice Options */}
        {question.questionType === 'multiple-choice' && question.options && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Options:
            </Typography>
            {question.options.map((option, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {option.isCorrect ? (
                  <CorrectIcon sx={{ color: 'success.main', mr: 1, fontSize: 16 }} />
                ) : (
                  <IncorrectIcon sx={{ color: 'error.main', mr: 1, fontSize: 16 }} />
                )}
                <Typography variant="body2">
                  {String.fromCharCode(65 + index)}. {option.text}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Correct Answer for non-MCQ */}
        {question.questionType !== 'multiple-choice' && question.correctAnswer && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Correct Answer:
            </Typography>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              {question.correctAnswer}
            </Typography>
          </Box>
        )}

        {/* Explanation */}
        {question.explanation && (
          <Accordion sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">
                Explanation
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2">
                {question.explanation}
              </Typography>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Topics */}
        {question.topics && question.topics.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ mr: 1 }}>
              Topics:
            </Typography>
            {question.topics.map((topic, index) => (
              <Chip 
                key={index} 
                label={topic} 
                size="small" 
                variant="outlined" 
                sx={{ mr: 0.5, mb: 0.5 }} 
              />
            ))}
          </Box>
        )}

        {/* Performance Stats */}
        {question.performance && question.performance.totalAttempts > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Performance: {question.performance.correctAnswers}/{question.performance.totalAttempts} correct 
              ({Math.round((question.performance.correctAnswers / question.performance.totalAttempts) * 100)}%)
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 'bold' }}>
        Question Bank
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Search questions"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={handleSearch}>
                      <SearchIcon />
                    </IconButton>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={filters.subject}
                  label="Subject"
                  onChange={(e) => handleFilterChange('subject', e.target.value)}
                >
                  <MenuItem value="">All Subjects</MenuItem>
                  <MenuItem value="mathematics">Mathematics</MenuItem>
                  <MenuItem value="physics">Physics</MenuItem>
                  <MenuItem value="chemistry">Chemistry</MenuItem>
                  <MenuItem value="biology">Biology</MenuItem>
                  <MenuItem value="computer-science">Computer Science</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={filters.difficulty}
                  label="Difficulty"
                  onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                >
                  <MenuItem value="">All Levels</MenuItem>
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.questionType}
                  label="Type"
                  onChange={(e) => handleFilterChange('questionType', e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="multiple-choice">Multiple Choice</MenuItem>
                  <MenuItem value="true-false">True/False</MenuItem>
                  <MenuItem value="short-answer">Short Answer</MenuItem>
                  <MenuItem value="essay">Essay</MenuItem>
                  <MenuItem value="fill-blank">Fill in the Blank</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<FilterIcon />}
                onClick={handleSearch}
              >
                Apply Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Results Info */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Showing {questions.length} of {pagination.total} questions
          </Typography>

          {/* Questions List */}
          {questions.length > 0 ? (
            <>
              {questions.map((question) => (
                <QuestionCard key={question._id} question={question} />
              ))}

              {/* Pagination */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={pagination.pages}
                  page={pagination.page}
                  onChange={(event, page) => setPagination(prev => ({ ...prev, page }))}
                  color="primary"
                />
              </Box>
            </>
          ) : (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No questions found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your search criteria or upload more question papers.
                </Typography>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Edit Question Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Question</DialogTitle>
        <DialogContent>
          {selectedQuestion && (
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Question Text"
                multiline
                rows={3}
                value={selectedQuestion.questionText}
                onChange={(e) => setSelectedQuestion(prev => ({ ...prev, questionText: e.target.value }))}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Explanation"
                multiline
                rows={2}
                value={selectedQuestion.explanation || ''}
                onChange={(e) => setSelectedQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                sx={{ mb: 2 }}
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Difficulty</InputLabel>
                    <Select
                      value={selectedQuestion.difficulty}
                      label="Difficulty"
                      onChange={(e) => setSelectedQuestion(prev => ({ ...prev, difficulty: e.target.value }))}
                    >
                      <MenuItem value="easy">Easy</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="hard">Hard</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Topics (comma-separated)"
                    value={selectedQuestion.topics?.join(', ') || ''}
                    onChange={(e) => setSelectedQuestion(prev => ({ 
                      ...prev, 
                      topics: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                    }))}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveQuestion} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Questions;