import React, { useState } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Chip,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  AutoAwesome as AIIcon,
  CheckCircle as SuccessIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { uploadAPI } from '../services/api';

const Upload = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadData, setUploadData] = useState({
    subject: '',
    year: '',
    institution: '',
    examType: 'other',
  });
  const [processing, setProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);
  const [error, setError] = useState(null);

  const steps = ['Upload PDF', 'Add Metadata', 'Process & Extract', 'Generate Questions'];

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
      setError(null);
      setActiveStep(1);
    } else {
      setError('Please upload a valid PDF file');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxSize: 25 * 1024 * 1024, // 25MB
    multiple: false,
  });

  const handleMetadataSubmit = async () => {
    if (!uploadData.subject.trim()) {
      setError('Subject is required');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('pdf', uploadedFile);
      formData.append('subject', uploadData.subject);
      formData.append('year', uploadData.year);
      formData.append('institution', uploadData.institution);
      formData.append('examType', uploadData.examType);

      const response = await uploadAPI.uploadPDF(formData);
      setUploadResult(response.data);
      setActiveStep(2);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!uploadResult?.questionPaperId) {
      setError('No uploaded paper found');
      return;
    }

    setGeneratingQuestions(true);
    setError(null);

    try {
      const response = await uploadAPI.generateQuestions(uploadResult.questionPaperId, {
        questionCount: 15,
      });
      setGenerationResult(response.data);
      setActiveStep(3);
    } catch (err) {
      setError(err.message || 'Question generation failed');
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const resetUpload = () => {
    setActiveStep(0);
    setUploadedFile(null);
    setUploadData({
      subject: '',
      year: '',
      institution: '',
      examType: 'other',
    });
    setUploadResult(null);
    setGenerationResult(null);
    setError(null);
  };

  const examTypes = [
    { value: 'midterm', label: 'Midterm Exam' },
    { value: 'final', label: 'Final Exam' },
    { value: 'quiz', label: 'Quiz' },
    { value: 'assignment', label: 'Assignment' },
    { value: 'practice', label: 'Practice Paper' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 'bold' }}>
        Upload Question Paper
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Step 0: File Upload */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Select PDF File
            </Typography>
            <Paper
              {...getRootProps()}
              sx={{
                p: 4,
                textAlign: 'center',
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'grey.300',
                backgroundColor: isDragActive ? 'primary.50' : 'background.default',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'primary.50',
                },
              }}
            >
              <input {...getInputProps()} />
              <UploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                {isDragActive ? 'Drop the PDF here' : 'Drag & drop a PDF file here'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                or click to select a file (max 25MB)
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Step 1: Metadata */}
        {activeStep === 1 && uploadedFile && (
          <Box>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Add Paper Details
            </Typography>

            <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <DocumentIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {uploadedFile.name}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Size: {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                </Typography>
              </CardContent>
            </Card>

            <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Subject *"
                value={uploadData.subject}
                onChange={(e) => setUploadData({ ...uploadData, subject: e.target.value })}
                placeholder="e.g., Mathematics, Physics, Computer Science"
                required
              />

              <TextField
                label="Year"
                type="number"
                value={uploadData.year}
                onChange={(e) => setUploadData({ ...uploadData, year: e.target.value })}
                placeholder="e.g., 2024"
              />

              <TextField
                label="Institution"
                value={uploadData.institution}
                onChange={(e) => setUploadData({ ...uploadData, institution: e.target.value })}
                placeholder="e.g., University Name, School Name"
              />

              <FormControl>
                <InputLabel>Exam Type</InputLabel>
                <Select
                  value={uploadData.examType}
                  label="Exam Type"
                  onChange={(e) => setUploadData({ ...uploadData, examType: e.target.value })}
                >
                  {examTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button onClick={() => setActiveStep(0)} variant="outlined">
                  Back
                </Button>
                <Button
                  onClick={handleMetadataSubmit}
                  variant="contained"
                  disabled={processing}
                  startIcon={processing ? <CircularProgress size={20} /> : null}
                >
                  {processing ? 'Processing...' : 'Process PDF'}
                </Button>
              </Box>
            </Box>
          </Box>
        )}

        {/* Step 2: Processing Results */}
        {activeStep === 2 && uploadResult && (
          <Box>
            <Typography variant="h6" sx={{ mb: 3 }}>
              PDF Processed Successfully
            </Typography>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SuccessIcon sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="h6" color="success.main">
                    Text Extraction Complete
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Extracted Text Length: {uploadResult.extractedTextLength} characters
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((uploadResult.extractedTextLength / 10000) * 100, 100)}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                  Detected Information:
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Subject:</strong> {uploadResult.subject}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Pages:</strong> {uploadResult.metadata.pageCount}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>File Size:</strong> {(uploadResult.metadata.fileSize / (1024 * 1024)).toFixed(2)} MB
                  </Typography>
                </Box>

                {uploadResult.topics && uploadResult.topics.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Key Topics Identified:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {uploadResult.topics.slice(0, 8).map((topic, index) => (
                        <Chip
                          key={index}
                          label={`${topic.name} (${topic.frequency})`}
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>

            <Box sx={{ textAlign: 'center' }}>
              <Button
                onClick={handleGenerateQuestions}
                variant="contained"
                size="large"
                disabled={generatingQuestions}
                startIcon={
                  generatingQuestions ? <CircularProgress size={20} /> : <AIIcon />
                }
                sx={{ minWidth: 200 }}
              >
                {generatingQuestions ? 'Generating Questions...' : 'Generate AI Questions'}
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 3: Question Generation Results */}
        {activeStep === 3 && generationResult && (
          <Box>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Questions Generated Successfully
            </Typography>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AIIcon sx={{ mr: 1, color: 'secondary.main' }} />
                  <Typography variant="h6" color="secondary.main">
                    AI Analysis Complete
                  </Typography>
                </Box>

                <Typography variant="body1" sx={{ mb: 2 }}>
                  Generated <strong>{generationResult.questionCount} questions</strong> from your PDF
                </Typography>

                <Alert severity="success" sx={{ mb: 3 }}>
                  Your questions have been saved and are ready to use for quizzes and study sessions!
                </Alert>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    onClick={() => window.open('/questions', '_blank')}
                  >
                    Review Questions
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => window.open('/quiz/create', '_blank')}
                  >
                    Create Quiz
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={resetUpload}
                  >
                    Upload Another
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Upload;