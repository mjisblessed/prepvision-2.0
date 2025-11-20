import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Button,
} from '@mui/material';
import {
  PictureAsPdf as PDFIcon,
  QuestionAnswer as QuestionIcon,
  Quiz as QuizIcon,
  Psychology as FlashcardIcon,
  TrendingUp as TrendingIcon,
  Analytics as AnalyticsIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { analyticsAPI, quizAPI } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [availableQuizzes, setAvailableQuizzes] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardResponse, quizzesResponse] = await Promise.all([
        analyticsAPI.getDashboard(),
        quizAPI.getQuizzes({ limit: 5 })
      ]);
      setDashboardData(dashboardResponse.data);
      setAvailableQuizzes(quizzesResponse.data?.quizzes || []);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color, onClick }) => (
    <Card
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s',
        '&:hover': onClick ? { transform: 'translateY(-2px)' } : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 1,
              backgroundColor: `${color}.100`,
              color: `${color}.600`,
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" sx={{ mb: 1, fontWeight: 'bold' }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const QuickActionCard = ({ title, description, action, icon, color }) => (
    <Card>
      <CardContent sx={{ textAlign: 'center', py: 4 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: '50%',
            backgroundColor: `${color}.100`,
            color: `${color}.600`,
            width: 80,
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" component="div" sx={{ mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {description}
        </Typography>
        <Button variant="contained" onClick={action} sx={{ backgroundColor: `${color}.600` }}>
          Get Started
        </Button>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  const { papers, questions, quizzes, flashcards, recentActivity } = dashboardData || {};

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 'bold' }}>
        Dashboard
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Question Papers"
            value={papers?.total || 0}
            subtitle={`${papers?.totalTextLength || 0} chars extracted`}
            icon={<PDFIcon />}
            color="primary"
            onClick={() => navigate('/upload')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Generated Questions"
            value={questions?.total || 0}
            subtitle={`${questions?.totalUsage || 0} times used`}
            icon={<QuestionIcon />}
            color="secondary"
            onClick={() => navigate('/questions')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Quizzes"
            value={quizzes?.active || 0}
            subtitle={`${Math.round(quizzes?.avgScore || 0)}% avg score`}
            icon={<QuizIcon />}
            color="success"
            onClick={() => navigate('/quiz/create')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Flashcards"
            value={flashcards?.active || 0}
            subtitle={`${Math.round(((flashcards?.correctReviews || 0) / (flashcards?.totalReviews || 1)) * 100)}% accuracy`}
            icon={<FlashcardIcon />}
            color="warning"
            onClick={() => navigate('/flashcards')}
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 'bold' }}>
        Quick Actions
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <QuickActionCard
            title="Upload PDF"
            description="Upload question papers and extract text for AI analysis"
            action={() => navigate('/upload')}
            icon={<PDFIcon sx={{ fontSize: 40 }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <QuickActionCard
            title="Create Quiz"
            description="Build interactive quizzes from your question bank"
            action={() => navigate('/quiz/create')}
            icon={<QuizIcon sx={{ fontSize: 40 }} />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <QuickActionCard
            title="Study Session"
            description="Start a flashcard study session with spaced repetition"
            action={() => navigate('/flashcards')}
            icon={<FlashcardIcon sx={{ fontSize: 40 }} />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Recent Activity */}
      {recentActivity && recentActivity.length > 0 && (
        <>
          <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 'bold' }}>
            Recent Activity
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" component="div">
                      Recently Uploaded Papers
                    </Typography>
                  </Box>
                  {recentActivity.map((paper) => (
                    <Box
                      key={paper._id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 1,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '&:last-child': { borderBottom: 'none' },
                      }}
                    >
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {paper.filename}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(paper.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Chip label={paper.subject} color="primary" variant="outlined" size="small" />
                    </Box>
                  ))}
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate('/analytics')}
                      startIcon={<AnalyticsIcon />}
                    >
                      View Full Analytics
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Available Quizzes Section */}
          {availableQuizzes.length > 0 && (
            <>
              <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 3, fontWeight: 'bold' }}>
                Available Quizzes
              </Typography>
              <Grid container spacing={3}>
                {availableQuizzes.map((quiz) => (
                  <Grid item xs={12} sm={6} md={4} key={quiz._id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="h3" sx={{ mb: 1, fontWeight: 600 }}>
                          {quiz.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {quiz.description || 'No description available'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                          <Chip label={quiz.subject} size="small" color="primary" variant="outlined" />
                          <Chip label={`${quiz.questions?.length || 0} questions`} size="small" variant="outlined" />
                          {quiz.settings?.timeLimit && (
                            <Chip label={`${quiz.settings.timeLimit} min`} size="small" variant="outlined" />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Average Score: {Math.round(quiz.averageScore || 0)}% • {quiz.totalAttempts || 0} attempts
                        </Typography>
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<PlayIcon />}
                          onClick={() => navigate(`/quiz/${quiz._id}`)}
                          sx={{ mt: 'auto' }}
                        >
                          Take Quiz
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </>
      )}
    </Container>
  );
};

export default Dashboard;