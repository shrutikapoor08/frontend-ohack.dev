import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Slider,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  GitHub as GitHubIcon,
  Launch as DevPostIcon,
  VideoLibrary as VideoIcon,
  Save as SaveIcon,
  Send as SubmitIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Code as CodeIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  Description as DocumentationIcon,
  AutoFixHigh as PolishIcon,
  Public as WebIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { useAuthInfo, withRequiredAuthInfo } from '@propelauth/react';
import { useSnackbar } from 'notistack';
import judgeApi from '../../../../lib/judgeApi';

// Judging criteria from /about/judges
const JUDGING_CRITERIA = [
  {
    category: "scope",
    name: "Scope of Solution",
    maxPoints: 10,
    icon: <AssessmentIcon />,
    color: "primary",
    subCriteria: [
      {
        name: "Impact on Community",
        description: "How many people and nonprofits are impacted by this solution?",
        key: "scopeImpact",
      },
      {
        name: "Complexity of Problem Solved", 
        description: "How hard was this to do versus what is already out there?",
        key: "scopeComplexity",
      },
    ],
    tip: "Consider both breadth and depth of impact. Evaluate community impact and problem complexity.",
  },
  {
    category: "documentation",
    name: "Documentation",
    maxPoints: 10,
    icon: <DocumentationIcon />,
    color: "info",
    subCriteria: [
      {
        name: "Code and UX Documentation",
        description: "Clear how to use the solution",
        key: "documentationCode",
      },
      {
        name: "Ease of Understanding",
        description: "Straightforward design",
        key: "documentationEase",
      },
    ],
    tip: "Assess documentation quality and clarity. Consider project sustainability.",
  },
  {
    category: "polish",
    name: "Polish",
    maxPoints: 10,
    icon: <PolishIcon />,
    color: "success",
    subCriteria: [
      {
        name: "Work Remaining",
        description: "Minimal work remaining for MVP",
        key: "polishWorkRemaining",
      },
      {
        name: "Can Use Today",
        description: "Deployed in the cloud, able to be shipped now",
        key: "polishCanUseToday",
      },
    ],
    tip: "Evaluate overall refinement and readiness for real-world use.",
  },
  {
    category: "security",
    name: "Security",
    maxPoints: 10,
    icon: <SecurityIcon />,
    color: "error",
    subCriteria: [
      {
        name: "Data Protection",
        description: "Hard to gain access to data because of security controls",
        key: "securityData",
      },
      {
        name: "Role-based Security",
        description: "Admin versus public access (where applicable)",
        key: "securityRole",
      },
    ],
    tip: "Assess data protection and role-based security implementation.",
  },
];

const SCORE_DESCRIPTIONS = {
  1: "Poor - Significantly below expectations",
  2: "Fair - Below expectations", 
  3: "Good - Meets expectations",
  4: "Very Good - Exceeds expectations",
  5: "Excellent - Significantly exceeds expectations",
};

const TeamScoringPage = withRequiredAuthInfo(({ userClass }) => {
  const { accessToken, user } = useAuthInfo();
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();
  const { event_id, team_id } = router.query;
  const round = router.query.round || 'round1';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [teamData, setTeamData] = useState(null);
  const [scores, setScores] = useState({});
  const [autoSave, setAutoSave] = useState(true);
  const [submitDialog, setSubmitDialog] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Initialize default scores
  const initializeScores = useCallback(() => {
    const defaultScores = {};
    JUDGING_CRITERIA.forEach(criterion => {
      criterion.subCriteria.forEach(subCriterion => {
        defaultScores[subCriterion.key] = 3; // Default to "Good"
      });
    });
    return defaultScores;
  }, []);

  // Fetch team data and existing scores
  useEffect(() => {
    if (!team_id || !event_id) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const [teamResponse, scoresResponse] = await Promise.all([
          judgeApi.getTeamDetails(team_id, accessToken),
          judgeApi.getJudgeScores(user.userId, event_id, accessToken)
        ]);
        
        setTeamData(teamResponse.team);
        
        // Find existing score for this team
        const existingScore = scoresResponse.scores?.find(
          score => score.team_id === team_id && score.round === round
        );
        
        if (existingScore) {
          setScores(existingScore.scores);
        } else {
          setScores(initializeScores());
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        enqueueSnackbar('Failed to load team data', { variant: 'error' });
        setScores(initializeScores());
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [team_id, event_id, round, user.userId, accessToken, enqueueSnackbar, initializeScores]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || loading || Object.keys(scores).length === 0) return;
    
    const saveTimer = setTimeout(async () => {
      try {
        setSaving(true);
        await judgeApi.saveDraft(user.userId, team_id, event_id, scores, round, accessToken);
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setSaving(false);
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(saveTimer);
  }, [scores, autoSave, loading, user.userId, team_id, event_id, round, accessToken]);

  const handleScoreChange = (key, value) => {
    setScores(prev => ({ ...prev, [key]: value }));
  };

  const calculateTotal = () => {
    return Object.values(scores).reduce((sum, score) => sum + (score || 0), 0);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const totalScore = calculateTotal();
      const scoreData = { ...scores, total: totalScore };
      
      await judgeApi.submitScore(user.userId, team_id, event_id, scoreData, round, accessToken);
      
      enqueueSnackbar('Score submitted successfully!', { variant: 'success' });
      setSubmitDialog(false);
      
      // Go back to hackathon page
      router.push(`/judge/${event_id}`);
      
    } catch (error) {
      console.error('Error submitting score:', error);
      enqueueSnackbar('Failed to submit score. Please try again.', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderSlider = (criterion) => (
    <Box key={criterion.key} sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" gutterBottom>
          {criterion.name}
        </Typography>
        <Chip 
          label={`${scores[criterion.key] || 3}/5`} 
          size="small" 
          color="primary"
        />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {criterion.description}
      </Typography>
      <Slider
        value={scores[criterion.key] || 3}
        onChange={(_, value) => handleScoreChange(criterion.key, value)}
        step={1}
        marks
        min={1}
        max={5}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) => SCORE_DESCRIPTIONS[value]}
        sx={{ mb: 1 }}
      />
      <Typography variant="caption" color="text.secondary">
        {SCORE_DESCRIPTIONS[scores[criterion.key] || 3]}
      </Typography>
    </Box>
  );

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!teamData) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 12 }}>
          <Alert severity="error">
            Failed to load team information. Please refresh the page or go back.
          </Alert>
        </Box>
      </Container>
    );
  }

  const totalScore = calculateTotal();
  const isRound2 = round === 'round2';

  return (
    <>
      <Head>
        <title>{`Judging ${teamData.name} - Opportunity Hack`}</title>
        <meta name="description" content={`Score ${teamData.name} for ${event_id} hackathon judging`} />
      </Head>

      <Container maxWidth="lg">
        <Box sx={{ mt: 12, mb: 4 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton onClick={() => router.push(`/judge/${event_id}`)} sx={{ mr: 2 }}>
              <BackIcon />
            </IconButton>
            <div>
              <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 1 }}>
                Judging: {teamData.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip 
                  label={isRound2 ? 'Round 2 - Live Demo' : 'Round 1 - Video Review'} 
                  color={isRound2 ? 'secondary' : 'primary'} 
                  icon={isRound2 ? <VideoIcon /> : <VideoIcon />}
                />
                {saving && (
                  <Chip 
                    label="Saving..." 
                    size="small" 
                    icon={<TimerIcon />} 
                    variant="outlined"
                  />
                )}
                {lastSaved && (
                  <Typography variant="caption" color="text.secondary">
                    Last saved: {lastSaved.toLocaleTimeString()}
                  </Typography>
                )}
              </Box>
            </div>
          </Box>

          <Grid container spacing={3}>
            {/* Team Information Panel */}
            <Grid item xs={12} lg={4}>
              <Paper elevation={2} sx={{ p: 3, position: 'sticky', top: 20 }}>
                <Typography variant="h6" gutterBottom>
                  Team Information
                </Typography>
                
                {/* Problem Statement */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    {teamData.problem_statement.nonprofit}
                  </Typography>
                  <Typography variant="body1" gutterBottom sx={{ fontWeight: 500 }}>
                    {teamData.problem_statement.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {teamData.problem_statement.description}
                  </Typography>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Team Members */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <PersonIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    Team Members
                  </Typography>
                  <List dense>
                    {teamData.members.map((member, index) => (
                      <ListItem key={index} disablePadding>
                        <ListItemText 
                          primary={member.name}
                          secondary={member.role}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Project Links */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Project Links
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {teamData.github_url && (
                      <Button
                        startIcon={<GitHubIcon />}
                        variant="outlined"
                        size="small"
                        href={teamData.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        GitHub Repository
                      </Button>
                    )}
                    {teamData.devpost_url && (
                      <Button
                        startIcon={<DevPostIcon />}
                        variant="outlined"
                        size="small"
                        href={teamData.devpost_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        DevPost Project
                      </Button>
                    )}
                    {teamData.demo_url && (
                      <Button
                        startIcon={<WebIcon />}
                        variant="outlined"
                        size="small"
                        href={teamData.demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Live Demo
                      </Button>
                    )}
                    {teamData.video_url && !isRound2 && (
                      <Button
                        startIcon={<VideoIcon />}
                        variant="contained"
                        size="small"
                        href={teamData.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Watch Pitch Video
                      </Button>
                    )}
                  </Box>
                </Box>

                {/* Technologies */}
                {teamData.technologies && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Technologies Used
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {teamData.technologies.map((tech, index) => (
                        <Chip key={index} label={tech} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Score Summary */}
                <Box sx={{ 
                  p: 2, 
                  bgcolor: totalScore >= 32 ? 'success.light' : totalScore >= 24 ? 'warning.light' : 'error.light',
                  borderRadius: 1,
                  textAlign: 'center'
                }}>
                  <Typography variant="h4" component="div" gutterBottom>
                    {totalScore}/40
                  </Typography>
                  <Typography variant="body2">
                    Current Total Score
                  </Typography>
                </Box>

                {/* Auto-save Toggle */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoSave}
                      onChange={(e) => setAutoSave(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Auto-save"
                  sx={{ mt: 2 }}
                />
              </Paper>
            </Grid>

            {/* Scoring Panel */}
            <Grid item xs={12} lg={8}>
              <Typography variant="h5" gutterBottom>
                Scoring Criteria
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Evaluate this team across the four key areas below. Each criterion is scored from 1-5 points.
              </Typography>

              {JUDGING_CRITERIA.map((criterion) => (
                <Accordion key={criterion.category} sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Box sx={{ color: `${criterion.color}.main`, mr: 2 }}>
                        {criterion.icon}
                      </Box>
                      <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        {criterion.name} ({criterion.maxPoints} points)
                      </Typography>
                      <Chip 
                        label={`${criterion.subCriteria.reduce((sum, sub) => sum + (scores[sub.key] || 0), 0)}/${criterion.maxPoints}`}
                        size="small"
                        color={criterion.color}
                      />
                      <Tooltip title={criterion.tip} arrow>
                        <InfoIcon color="action" sx={{ ml: 1, fontSize: 20 }} />
                      </Tooltip>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {criterion.subCriteria.map(renderSlider)}
                  </AccordionDetails>
                </Accordion>
              ))}

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => router.push(`/judge/${event_id}`)}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SubmitIcon />}
                  onClick={() => setSubmitDialog(true)}
                  disabled={submitting}
                >
                  Submit Score
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>

      {/* Submit Confirmation Dialog */}
      <Dialog open={submitDialog} onClose={() => setSubmitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Score for {teamData.name}?</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            You are about to submit your final score for this team. You can edit it later if needed.
          </Alert>
          
          <Typography variant="h6" gutterBottom>
            Score Summary:
          </Typography>
          
          {JUDGING_CRITERIA.map((criterion) => (
            <Box key={criterion.category} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">
                {criterion.name}:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {criterion.subCriteria.reduce((sum, sub) => sum + (scores[sub.key] || 0), 0)}/{criterion.maxPoints}
              </Typography>
            </Box>
          ))}
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              Total Score:
            </Typography>
            <Typography variant="h6" color="primary">
              {totalScore}/40
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : <SubmitIcon />}
          >
            {submitting ? 'Submitting...' : 'Submit Score'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

export default TeamScoringPage;