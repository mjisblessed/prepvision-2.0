import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Button,
  Alert,
  Grid,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  LinearProgress,
} from '@mui/material';
import {
  Psychology as FlashcardIcon,
  Refresh as RefreshIcon,
  PlayArrow as StartIcon,
  Visibility as ShowIcon,
  VisibilityOff as HideIcon,
  ThumbUp as EasyIcon,
  ThumbsUpDown as GoodIcon,
  ThumbDown as HardIcon,
  Replay as AgainIcon,
} from '@mui/icons-material';
import { flashcardsAPI, uploadAPI } from '../services/api';

const Flashcards = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [studyCards, setStudyCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [questionPapers, setQuestionPapers] = useState([]);
  const [generatingCards, setGeneratingCards] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsResponse, studyResponse, papersResponse] = await Promise.all([
        flashcardsAPI.getFlashcardStats(),
        flashcardsAPI.getStudySession({ limit: 20 }),
        uploadAPI.getQuestionPapers({ limit: 10 }),
      ]);
      
      setStats(statsResponse.data);
      setStudyCards(studyResponse.data.flashcards || []);
      setQuestionPapers(papersResponse.data.questionPapers || []);
    } catch (err) {
      setError('Failed to load flashcard data');
      console.error('Flashcards error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFlashcards = async (paperId) => {
    try {
      setGeneratingCards(true);
      await flashcardsAPI.createFlashcards({
        source: 'paper',
        sourceId: paperId,
        cardCount: 15,
      });
      
      // Refresh data
      await fetchData();
      setGeneratingCards(false);
      
    } catch (err) {
      setError('Failed to generate flashcards');
      setGeneratingCards(false);
    }
  };

  const handleStartStudy = () => {
    if (studyCards.length > 0) {
      setStudyMode(true);
      setCurrentCardIndex(0);
      setShowAnswer(false);
    }
  };

  const handleCardResponse = async (response) => {
    try {
      const currentCard = studyCards[currentCardIndex];
      await flashcardsAPI.reviewFlashcard(currentCard._id, response);
      
      // Move to next card or finish
      if (currentCardIndex < studyCards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
        setShowAnswer(false);
      } else {
        setStudyMode(false);
        await fetchData(); // Refresh stats
      }
    } catch (err) {
      setError('Failed to save card response');
    }
  };

  const currentCard = studyCards[currentCardIndex];

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 'bold' }}>
        Flashcards
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Stats Panel */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Study Statistics
              </Typography>
              {stats ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Chip 
                    label={`Cards Due: ${stats.dueForReview || 0}`} 
                    color="primary" 
                    icon={<FlashcardIcon />}
                  />
                  <Chip 
                    label={`Total Cards: ${stats.total || 0}`} 
                    color="secondary"
                    variant="outlined" 
                  />
                  <Chip 
                    label={`Accuracy: ${stats.accuracy || 0}%`} 
                    color={stats.accuracy > 70 ? "success" : "warning"}
                    variant="outlined"
                  />
                  <Chip 
                    label={`Reviews: ${stats.totalReviews || 0}`} 
                    variant="outlined" 
                  />
                </Box>
              ) : (
                <Alert severity="info">No flashcard statistics available</Alert>
              )}
              
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<StartIcon />}
                  onClick={handleStartStudy}
                  disabled={!studyCards || studyCards.length === 0}
                  sx={{ mb: 1 }}
                >
                  Start Study Session
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<RefreshIcon />}
                  onClick={fetchData}
                >
                  Refresh
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {studyCards.length > 0 ? (
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {studyCards.length} cards ready for review
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Click "Start Study Session" to begin reviewing your flashcards with spaced repetition.
                </Alert>
                
                {/* Preview of cards */}
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {studyCards.slice(0, 5).map((card, index) => (
                    <Card key={card._id} variant="outlined" sx={{ mb: 1, p: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {card.front}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip label={card.subject} size="small" color="primary" variant="outlined" />
                        <Chip label={card.difficulty} size="small" />
                      </Box>
                    </Card>
                  ))}
                  {studyCards.length > 5 && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
                      ... and {studyCards.length - 5} more cards
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Generate Flashcards
                </Typography>
                <Alert severity="info" sx={{ mb: 3 }}>
                  No flashcards available for review. Generate flashcards from your uploaded question papers.
                </Alert>

                {questionPapers.length > 0 ? (
                  <Box>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                      Available Question Papers:
                    </Typography>
                    {questionPapers.map((paper) => (
                      <Card key={paper._id} variant="outlined" sx={{ mb: 2 }}>
                        <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {paper.originalName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Subject: {paper.subject} • {paper.topics?.length || 0} topics identified
                            </Typography>
                          </Box>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleGenerateFlashcards(paper._id)}
                            disabled={generatingCards}
                            startIcon={generatingCards ? <CircularProgress size={16} /> : <FlashcardIcon />}
                          >
                            Generate Cards
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Alert severity="warning">
                    No question papers available. Please upload some PDFs first to generate flashcards.
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Study Mode Dialog */}
      <Dialog
        open={studyMode}
        maxWidth="md"
        fullWidth
        onClose={() => setStudyMode(false)}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Study Session</Typography>
            <Typography variant="body2" color="text.secondary">
              {currentCardIndex + 1} / {studyCards.length}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={(currentCardIndex / studyCards.length) * 100} 
            sx={{ mt: 1 }}
          />
        </DialogTitle>
        
        <DialogContent>
          {currentCard && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Card sx={{ mb: 3, minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CardContent>
                  <Typography variant="h5" sx={{ mb: 2 }}>
                    {showAnswer ? currentCard.back : currentCard.front}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2 }}>
                    <Chip label={currentCard.subject} color="primary" size="small" />
                    <Chip label={currentCard.difficulty} color="secondary" variant="outlined" size="small" />
                  </Box>
                </CardContent>
              </Card>

              <Button
                variant="outlined"
                startIcon={showAnswer ? <HideIcon /> : <ShowIcon />}
                onClick={() => setShowAnswer(!showAnswer)}
                sx={{ mb: 3 }}
              >
                {showAnswer ? 'Hide Answer' : 'Show Answer'}
              </Button>

              {showAnswer && (
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<AgainIcon />}
                    onClick={() => handleCardResponse('again')}
                  >
                    Again
                  </Button>
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={<HardIcon />}
                    onClick={() => handleCardResponse('hard')}
                  >
                    Hard
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<GoodIcon />}
                    onClick={() => handleCardResponse('good')}
                  >
                    Good
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<EasyIcon />}
                    onClick={() => handleCardResponse('easy')}
                  >
                    Easy
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setStudyMode(false)}>
            End Session
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Flashcards;