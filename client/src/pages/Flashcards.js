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
} from '@mui/material';
import { Psychology as FlashcardIcon } from '@mui/icons-material';

const Flashcards = () => {
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 'bold' }}>
        Flashcards
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FlashcardIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">
                  Study Session
                </Typography>
              </Box>
              <Alert severity="info">
                Flashcard functionality will be implemented here. Features include:
                <ul>
                  <li>Spaced repetition algorithm</li>
                  <li>Interactive card flipping</li>
                  <li>Progress tracking</li>
                  <li>Subject-based organization</li>
                  <li>Performance analytics</li>
                </ul>
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Quick Stats
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Chip label="Cards Due: 0" color="primary" />
                <Chip label="Study Streak: 0 days" color="secondary" />
                <Chip label="Total Reviews: 0" variant="outlined" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Flashcards;