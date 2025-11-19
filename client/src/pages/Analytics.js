import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  Assessment as AssessmentIcon,
  School as SubjectIcon,
  Topic as TopicIcon,
} from '@mui/icons-material';
import { analyticsAPI } from '../services/api';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subjectData, setSubjectData] = useState([]);
  const [topicData, setTopicData] = useState([]);
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [performanceData, setPerformanceData] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [subjects, topics, trending, performance] = await Promise.all([
        analyticsAPI.getSubjects(),
        analyticsAPI.getTopics(),
        analyticsAPI.getTrendingTopics({ limit: 10 }),
        analyticsAPI.getQuestionPerformance({ limit: 10 }),
      ]);

      setSubjectData(subjects.data || []);
      setTopicData(topics.data || []);
      setTrendingTopics(trending.data || []);
      setPerformanceData(performance.data);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
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

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 'bold' }}>
        Analytics Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Subject Analysis */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SubjectIcon sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography variant="h6">
                  Subject Analysis
                </Typography>
              </Box>
              {subjectData.length > 0 ? (
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Subject</TableCell>
                        <TableCell align="right">Papers</TableCell>
                        <TableCell align="right">Questions</TableCell>
                        <TableCell align="right">Topics</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {subjectData.slice(0, 5).map((subject) => (
                        <TableRow key={subject._id}>
                          <TableCell>{subject._id}</TableCell>
                          <TableCell align="right">{subject.paperCount}</TableCell>
                          <TableCell align="right">{subject.questionCount}</TableCell>
                          <TableCell align="right">{subject.totalTopics}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">No subject data available yet</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Topic Frequency */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TopicIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">
                  Most Frequent Topics
                </Typography>
              </Box>
              {topicData.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {topicData.slice(0, 15).map((topic, index) => (
                    <Chip
                      key={index}
                      label={`${topic._id} (${topic.frequency})`}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              ) : (
                <Alert severity="info">No topic data available yet</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Trending Topics */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  Trending Topics
                </Typography>
              </Box>
              {trendingTopics.length > 0 ? (
                <List dense>
                  {trendingTopics.slice(0, 8).map((topic, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={topic._id}
                        secondary={`${topic.frequency} mentions in ${topic.recentUploads} recent papers`}
                      />
                      <Chip
                        label={`${topic.subjects.length} subjects`}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info">No trending topics data available</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Question Performance */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssessmentIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">
                  Question Performance
                </Typography>
              </Box>
              {performanceData && performanceData.topPerforming.length > 0 ? (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Top Performing Questions:
                  </Typography>
                  {performanceData.topPerforming.slice(0, 3).map((question, index) => (
                    <Box key={question._id} sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {question.questionText.substring(0, 80)}...
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip
                          label={`${Math.round(question.successRate * 100)}% success`}
                          color="success"
                          size="small"
                        />
                        <Chip
                          label={question.difficulty}
                          color="primary"
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Alert severity="info">
                  No performance data available yet. Questions need to be used in quizzes to generate performance metrics.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Summary Card */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Analytics Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {subjectData.reduce((sum, s) => sum + s.paperCount, 0)}
                </Typography>
                <Typography variant="caption">Total Papers</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="secondary">
                  {subjectData.reduce((sum, s) => sum + s.questionCount, 0)}
                </Typography>
                <Typography variant="caption">Total Questions</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {topicData.length}
                </Typography>
                <Typography variant="caption">Unique Topics</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {subjectData.length}
                </Typography>
                <Typography variant="caption">Subjects</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Analytics;