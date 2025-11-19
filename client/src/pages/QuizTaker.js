import React from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Alert,
} from '@mui/material';

const QuizTaker = () => {
  const { id } = useParams();

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 'bold' }}>
        Take Quiz
      </Typography>

      <Card>
        <CardContent>
          <Alert severity="info">
            Quiz taking functionality will be implemented here. Quiz ID: {id}
            <br />
            Features include:
            <ul>
              <li>Interactive question interface</li>
              <li>Timer and progress tracking</li>
              <li>Answer submission and validation</li>
              <li>Real-time scoring and feedback</li>
            </ul>
          </Alert>
        </CardContent>
      </Card>
    </Container>
  );
};

export default QuizTaker;