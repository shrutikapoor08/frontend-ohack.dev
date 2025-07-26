import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import {
  Groups as GroupsIcon,
  Person as PersonIcon,
  EmojiEvents as TrophyIcon,
  LocationOn as LocationIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useAuthInfo } from '@propelauth/react';
import { useSnackbar } from 'notistack';
import axios from 'axios';

const JudgingRound2 = ({ orgId, hackathons, selectedHackathon, setSelectedHackathon }) => {
  const { accessToken } = useAuthInfo();
  const { enqueueSnackbar } = useSnackbar();
  
  const [loading, setLoading] = useState(false);
  const [judges, setJudges] = useState([]);
  const [teams, setTeams] = useState([]);
  const [finalistTeams, setFinalistTeams] = useState([]);
  const [selectedHackathonData, setSelectedHackathonData] = useState(null);
  const [sessionSettings, setSessionSettings] = useState({
    sessionDuration: 15, // minutes per team presentation
    breakDuration: 5,    // minutes between presentations
    startTime: '09:00',
    room: 'Main Hall'
  });
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch hackathon details
  useEffect(() => {
    if (selectedHackathon && hackathons.length > 0) {
      const hackathon = hackathons.find(h => h.event_id === selectedHackathon);
      setSelectedHackathonData(hackathon);
      console.log('Selected Hackathon Data:', hackathon);
    }
  }, [selectedHackathon, hackathons]);

  // Fetch judges and teams for selected hackathon
  const fetchData = useCallback(async () => {
    if (!selectedHackathon) return;
    
    setLoading(true);
    try {
      const [judgesResponse, teamsResponse] = await Promise.all([
        axios.get(
          `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/messages/hackathon/${selectedHackathon}/judge`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "X-Org-Id": orgId,
            },
          }
        ),
        axios.get(
          `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/team/${selectedHackathonData.id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )
      ]);

      // Only get accepted judges
      const acceptedJudges = judgesResponse.data.data?.filter(judge => judge.isSelected) || [];
      setJudges(acceptedJudges);
      
      const allTeams = teamsResponse.data.teams || [];
      setTeams(allTeams);
      
      // Set finalist teams (for now, this could be imported from Round 1 results)
      // In a real implementation, this would come from Round 1 judging results
      setFinalistTeams(allTeams.slice(0, Math.min(5, allTeams.length)));
      
    } catch (error) {
      console.error('Error fetching data:', error);
      enqueueSnackbar('Failed to fetch judging data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedHackathon, accessToken, orgId, enqueueSnackbar]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toggle team finalist status
  const toggleFinalistStatus = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    const isCurrentlyFinalist = finalistTeams.some(t => t.id === teamId);
    
    if (isCurrentlyFinalist) {
      setFinalistTeams(finalistTeams.filter(t => t.id !== teamId));
    } else {
      setFinalistTeams([...finalistTeams, team]);
    }
  };

  // Calculate presentation schedule
  const calculateSchedule = () => {
    const schedule = [];
    let currentTime = new Date(`2025-01-01T${sessionSettings.startTime}:00`);
    
    finalistTeams.forEach((team, index) => {
      schedule.push({
        team: team,
        startTime: new Date(currentTime),
        endTime: new Date(currentTime.getTime() + sessionSettings.sessionDuration * 60000)
      });
      
      // Add session duration + break duration for next slot
      currentTime = new Date(currentTime.getTime() + (sessionSettings.sessionDuration + sessionSettings.breakDuration) * 60000);
    });
    
    return schedule;
  };

  const schedule = calculateSchedule();
  const isInPerson = selectedHackathonData && !selectedHackathonData.location?.includes('Virtual');

  // Save Round 2 configuration to backend
  const saveRound2Configuration = async () => {
    if (!selectedHackathon || finalistTeams.length === 0) {
      enqueueSnackbar('Please select finalist teams before saving', { variant: 'warning' });
      return;
    }

    setSaving(true);
    try {
      // Create Round 2 panel for all judges
      const panelResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/judge/panels`,
        {
          event_id: selectedHackathon,
          panel_name: 'Round 2 - Final Judging',
          room: sessionSettings.room || null
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Org-Id": orgId,
            'Content-Type': 'application/json',
          },
        }
      );

      const panelId = panelResponse.data.panel_id;

      // Assign all judges to all finalist teams for Round 2
      for (const judge of judges) {
        for (const team of finalistTeams) {
          const teamSchedule = schedule.find(s => s.team.id === team.id);
          
          await axios.post(
            `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/judge/assignments`,
            {
              judge_id: judge.id || judge.user_id,
              event_id: selectedHackathon,
              team_id: team.id,
              round: 'round2',
              panel_id: panelId,
              room: sessionSettings.room || null,
              demo_time: teamSchedule ? teamSchedule.startTime.toISOString() : null
            },
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "X-Org-Id": orgId,
                'Content-Type': 'application/json',
              },
            }
          );
        }
      }

      enqueueSnackbar('Round 2 configuration saved successfully!', { variant: 'success' });
    } catch (error) {
      console.error('Error saving Round 2 configuration:', error);
      enqueueSnackbar('Failed to save Round 2 configuration', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Load existing Round 2 assignments
  const loadExistingRound2 = useCallback(async () => {
    if (!selectedHackathon) return;

    try {
      const panelsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/judge/panels/${selectedHackathon}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Org-Id": orgId,
          },
        }
      );

      const panels = panelsResponse.data.panels || [];
      const round2Panel = panels.find(p => p.panel_name === 'Round 2 - Final Judging');
      
      if (round2Panel && round2Panel.teams) {
        // Set finalist teams from existing assignments
        const existingFinalists = teams.filter(team => 
          round2Panel.teams.some(t => t.id === team.id)
        );
        setFinalistTeams(existingFinalists);
        
        // Update session settings from panel data
        if (round2Panel.room) {
          setSessionSettings(prev => ({ ...prev, room: round2Panel.room }));
        }
      }
    } catch (error) {
      console.error('Error loading existing Round 2 assignments:', error);
      // Don't show error to user - this might be first time setup
    }
  }, [selectedHackathon, accessToken, orgId, teams]);

  // Load existing Round 2 assignments when data is available
  useEffect(() => {
    if (selectedHackathon && judges.length > 0 && teams.length > 0) {
      loadExistingRound2();
    }
  }, [selectedHackathon, judges.length, teams.length, loadExistingRound2]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Hackathon Selection */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Select Hackathon</InputLabel>
            <Select
              value={selectedHackathon}
              onChange={(e) => setSelectedHackathon(e.target.value)}
              label="Select Hackathon"
            >
              {hackathons.map((hackathon) => (
                <MenuItem key={hackathon.event_id} value={hackathon.event_id}>
                  {hackathon.title} - {new Date(hackathon.start_date).toLocaleDateString()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <Button
            variant="contained"
            startIcon={<ScheduleIcon />}
            onClick={() => setSettingsDialog(true)}
            disabled={!selectedHackathon}
          >
            Configure Session Settings
          </Button>
        </Grid>
        <Grid item xs={12} md={4}>
          <Button
            variant="contained"
            color="success"
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <TrophyIcon />}
            onClick={saveRound2Configuration}
            disabled={!selectedHackathon || finalistTeams.length === 0 || saving}
            fullWidth
          >
            {saving ? 'Saving...' : 'Save Round 2 Setup'}
          </Button>
        </Grid>
      </Grid>

      {!selectedHackathon ? (
        <Alert severity="info">Please select a hackathon to manage Round 2 judging.</Alert>
      ) : (
        <>
          {/* Summary Stats */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <PersonIcon color="primary" sx={{ fontSize: 40 }} />
                  <Typography variant="h6">{judges.length}</Typography>
                  <Typography variant="body2">All Judges</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TrophyIcon color="warning" sx={{ fontSize: 40 }} />
                  <Typography variant="h6">{finalistTeams.length}</Typography>
                  <Typography variant="body2">Finalist Teams</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <ScheduleIcon color="info" sx={{ fontSize: 40 }} />
                  <Typography variant="h6">{schedule.length * sessionSettings.sessionDuration}min</Typography>
                  <Typography variant="body2">Total Duration</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <LocationIcon color="success" sx={{ fontSize: 40 }} />
                  <Typography variant="h6">{isInPerson ? 'In-Person' : 'Virtual'}</Typography>
                  <Typography variant="body2">Event Type</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Typography variant="h5" gutterBottom>
            Round 2 - Final Judging Setup
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select finalist teams from Round 1 and manage the final judging session where all judges evaluate the top teams.
          </Typography>

          {/* Team Selection */}
          <Accordion defaultExpanded sx={{ mb: 3 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                Select Finalist Teams ({finalistTeams.length} selected)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Choose which teams advance to Round 2 final judging from the teams that participated in Round 1.
              </Typography>
              <Grid container spacing={2}>
                {teams.map((team) => {
                  const isFinalist = finalistTeams.some(t => t.id === team.id);
                  return (
                    <Grid item xs={12} sm={6} md={4} key={team.id}>
                      <Card 
                        sx={{ 
                          border: isFinalist ? '2px solid' : '1px solid',
                          borderColor: isFinalist ? 'primary.main' : 'divider',
                          cursor: 'pointer',
                          '&:hover': { boxShadow: 3 }
                        }}
                        onClick={() => toggleFinalistStatus(team.id)}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="h6" component="div">
                              {team.name}
                            </Typography>
                            {isFinalist && <CheckIcon color="primary" />}
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {team.members?.length || 0} members
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {team.problem_statement?.title || 'No problem statement'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Judging Panel */}
          <Accordion defaultExpanded sx={{ mb: 3 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                Final Judging Panel ({judges.length} judges)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                All accepted judges will participate in Round 2 final judging sessions.
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <List>
                  {judges.map((judge, index) => (
                    <React.Fragment key={judge.id || judge.user_id}>
                      <ListItem>
                        <ListItemIcon>
                          <PersonIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary={judge.name || judge.firstName + ' ' + judge.lastName}
                          secondary={
                            <Box>
                              <Typography variant="body2" component="span">
                                {judge.company || judge.companyName}
                              </Typography>
                              {judge.expertise && (
                                <Chip 
                                  label={judge.expertise} 
                                  size="small" 
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < judges.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                  {judges.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                      No judges available for this hackathon
                    </Typography>
                  )}
                </List>
              </Paper>
            </AccordionDetails>
          </Accordion>

          {/* Presentation Schedule */}
          {finalistTeams.length > 0 && (
            <Accordion defaultExpanded sx={{ mb: 3 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  Presentation Schedule
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Live presentation schedule for finalist teams ({sessionSettings.sessionDuration} min per team + {sessionSettings.breakDuration} min break)
                  </Typography>
                  {isInPerson && sessionSettings.room && (
                    <Chip 
                      icon={<LocationIcon />}
                      label={sessionSettings.room} 
                      variant="outlined" 
                    />
                  )}
                </Box>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <List>
                    {schedule.map((slot, index) => (
                      <React.Fragment key={slot.team.id}>
                        <ListItem>
                          <ListItemIcon>
                            <TrophyIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="subtitle1">
                                  {slot.team.name}
                                </Typography>
                                <Chip 
                                  label={`${slot.startTime.toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })} - ${slot.endTime.toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}`}
                                  size="small"
                                  variant="outlined"
                                />
                              </Box>
                            }
                            secondary={`${sessionSettings.sessionDuration} minute presentation + Q&A`}
                          />
                        </ListItem>
                        {index < schedule.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Paper>
              </AccordionDetails>
            </Accordion>
          )}

          {finalistTeams.length === 0 && (
            <Alert severity="warning" sx={{ mt: 3 }}>
              Please select at least one team to advance to Round 2 final judging.
            </Alert>
          )}
        </>
      )}

      {/* Session Settings Dialog */}
      <Dialog open={settingsDialog} onClose={() => setSettingsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Round 2 Session Settings</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Session Duration (minutes)"
                type="number"
                fullWidth
                value={sessionSettings.sessionDuration}
                onChange={(e) => setSessionSettings({
                  ...sessionSettings,
                  sessionDuration: parseInt(e.target.value) || 15
                })}
                inputProps={{ min: 5, max: 60 }}
                InputLabelProps={{ shrink: true }}
                sx={{ mt: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Break Duration (minutes)"
                type="number"
                fullWidth
                value={sessionSettings.breakDuration}
                onChange={(e) => setSessionSettings({
                  ...sessionSettings,
                  breakDuration: parseInt(e.target.value) || 5
                })}
                inputProps={{ min: 0, max: 30 }}
                InputLabelProps={{ shrink: true }}
                sx={{ mt: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Start Time"
                type="time"
                fullWidth
                value={sessionSettings.startTime}
                onChange={(e) => setSessionSettings({
                  ...sessionSettings,
                  startTime: e.target.value
                })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            {isInPerson && (
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Room/Location"
                  fullWidth
                  value={sessionSettings.room}
                  onChange={(e) => setSessionSettings({
                    ...sessionSettings,
                    room: e.target.value
                  })}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialog(false)}>Cancel</Button>
          <Button onClick={() => setSettingsDialog(false)} variant="contained">Save Settings</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JudgingRound2;