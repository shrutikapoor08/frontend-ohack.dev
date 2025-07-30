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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
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
  Schedule as ScheduleIcon,
  Star as StarIcon,
  Visibility as ViewIcon,
  Sort as SortIcon,
  Edit as EditIcon
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
  const [round1Scores, setRound1Scores] = useState([]);
  const [loadingScores, setLoadingScores] = useState(false);
  const [sortBy, setSortBy] = useState('totalScore');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewScoresDialog, setViewScoresDialog] = useState(false);
  const [selectedTeamScores, setSelectedTeamScores] = useState(null);
  const [nonprofitNames, setNonprofitNames] = useState({});
  const [loadingNonprofits, setLoadingNonprofits] = useState(false);
  const [loadingJudgeDetails, setLoadingJudgeDetails] = useState({});
  const [judgeGroups, setJudgeGroups] = useState([]);
  const [loadingPanels, setLoadingPanels] = useState(false);

  // Add caching states
  const [judgeDetailsCache, setJudgeDetailsCache] = useState({});
  const [panelAssignmentsCache, setPanelAssignmentsCache] = useState({});
  const [scoresCache, setScoresCache] = useState({});

  // Fetch hackathon details
  useEffect(() => {
    if (selectedHackathon && hackathons.length > 0) {
      const hackathon = hackathons.find(h => h.event_id === selectedHackathon);
      setSelectedHackathonData(hackathon);
      console.log('Selected Hackathon Data:', hackathon);
    }
  }, [selectedHackathon, hackathons]);

  // Fetch judge details for a specific judge with caching
  const fetchJudgeDetails = useCallback(async (judgeId) => {
    if (!selectedHackathon) return null;
    
    // Check cache first
    if (judgeDetailsCache[judgeId]) {
      return judgeDetailsCache[judgeId];
    }
    
    // Check if we already have this judge's details loading
    if (loadingJudgeDetails[judgeId]) return null;
    
    setLoadingJudgeDetails(prev => ({ ...prev, [judgeId]: true }));
    
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/judge/judge/${judgeId}/event/${selectedHackathon}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Org-Id": orgId,
          },
        }
      );
      
      const judgeDetails = response.data.judge;
      
      // Cache the result
      setJudgeDetailsCache(prev => ({ ...prev, [judgeId]: judgeDetails }));
      setLoadingJudgeDetails(prev => ({ ...prev, [judgeId]: false }));
      
      return judgeDetails;
    } catch (error) {
      console.error(`Error fetching judge details for ${judgeId}:`, error);
      setLoadingJudgeDetails(prev => ({ ...prev, [judgeId]: false }));
      return null;
    }
  }, [selectedHackathon, accessToken, orgId, judgeDetailsCache, loadingJudgeDetails]);

  // Fetch assignments for a specific panel with caching
  const fetchPanelAssignments = useCallback(async (panelId) => {
    // Check cache first
    if (panelAssignmentsCache[panelId]) {
      return panelAssignmentsCache[panelId];
    }
    
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/judge/panel/${panelId}/assignments`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Org-Id": orgId,
          },
        }
      );
      
      const assignments = response.data.assignments || [];
      
      // Cache the result
      setPanelAssignmentsCache(prev => ({ ...prev, [panelId]: assignments }));
      
      return assignments;
    } catch (error) {
      console.error(`Error fetching assignments for panel ${panelId}:`, error);
      return [];
    }
  }, [accessToken, orgId, panelAssignmentsCache]);

  // Clear caches when hackathon changes
  useEffect(() => {
    setJudgeDetailsCache({});
    setPanelAssignmentsCache({});
    setScoresCache({});
  }, [selectedHackathon]);

  // Fetch nonprofit names for teams
  const fetchNonprofitNames = useCallback(async (teams) => {
    if (!teams || teams.length === 0) return;
    
    setLoadingNonprofits(true);
    const nonprofitIds = [...new Set(teams
      .filter(team => team.selected_nonprofit_id)
      .map(team => team.selected_nonprofit_id))];
    
    if (nonprofitIds.length === 0) {
      setLoadingNonprofits(false);
      return;
    }

    try {
      const nonprofitPromises = nonprofitIds.map(async (nonprofitId) => {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/messages/npo/${nonprofitId}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "X-Org-Id": orgId,
              },
            }
          );
          return { id: nonprofitId, name: response.data.nonprofits.name || `Nonprofit ${nonprofitId}` };
        } catch (error) {
          console.error(`Error fetching nonprofit ${nonprofitId}:`, error);
          return { id: nonprofitId, name: `Nonprofit ${nonprofitId}` };
        }
      });

      const nonprofitResults = await Promise.all(nonprofitPromises);
      const nonprofitMap = {};
      nonprofitResults.forEach(result => {
        nonprofitMap[result.id] = result.name;
      });
      
      setNonprofitNames(nonprofitMap);
    } catch (error) {
      console.error('Error fetching nonprofit names:', error);
    } finally {
      setLoadingNonprofits(false);
    }
  }, [accessToken, orgId]);

  // Optimized fetch Round 1 scores with caching
  const fetchRound1Scores = useCallback(async () => {
    if (!selectedHackathon || teams.length === 0) return;
    
    // Check if we have cached scores for this hackathon
    const cacheKey = `${selectedHackathon}_${teams.length}`;
    if (scoresCache[cacheKey]) {
      setRound1Scores(scoresCache[cacheKey]);
      return;
    }
    
    setLoadingScores(true);
    try {
      // Get all Round 1 panels
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
      const round1Panels = panels.filter(p => !p.panel_name.includes('Round 2'));
      
      // Load all panel assignments in parallel
      const panelAssignmentPromises = round1Panels.map(panel => 
        fetchPanelAssignments(panel.id)
      );
      
      const allPanelAssignments = await Promise.all(panelAssignmentPromises);
      const flatAssignments = allPanelAssignments.flat();
      
      // Collect all unique judge IDs and load their details in parallel
      const allJudgeIds = [...new Set(flatAssignments.map(a => a.judge_id))];
      const judgeDetailPromises = allJudgeIds.map(judgeId => fetchJudgeDetails(judgeId));
      await Promise.all(judgeDetailPromises);
      
      const teamScores = [];
      
      // Process each team
      for (const team of teams) {
        const teamScoreData = {
          team,
          scores: [],
          averageScore: 0,
          totalScore: 0,
          judgeCount: 0
        };
        
        // Get assignments for this team
        const teamAssignments = flatAssignments.filter(a => a.team_id === team.id);
        
        // Fetch scores for each assignment in parallel
        const scorePromises = teamAssignments.map(async (assignment) => {
          try {
            const scoreResponse = await axios.get(
              `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/judge/admin/score/${assignment.judge_id}/${team.id}/${selectedHackathon}/round1`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "X-Org-Id": orgId,
                },
              }
            );
            
            if (scoreResponse.data.score && !scoreResponse.data.score.is_draft) {
              const judgeDetails = judgeDetailsCache[assignment.judge_id];
              return {
                judge: judgeDetails || { name: assignment.judge_id },
                score: scoreResponse.data.score
              };
            }
          } catch (error) {
            console.log(`No score found for judge ${assignment.judge_id} and team ${team.id}`);
          }
          return null;
        });
        
        const scoreResults = await Promise.all(scorePromises);
        teamScoreData.scores = scoreResults.filter(result => result !== null);
        
        // Calculate averages using total_score only
        if (teamScoreData.scores.length > 0) {
          const totalScores = teamScoreData.scores.map(s => s.score.total_score || 0);
          
          teamScoreData.totalScore = totalScores.reduce((sum, score) => sum + score, 0);
          teamScoreData.averageScore = teamScoreData.totalScore / teamScoreData.scores.length;
          teamScoreData.judgeCount = teamScoreData.scores.length;
        }
        
        teamScores.push(teamScoreData);
      }
      
      // Sort by average score descending
      teamScores.sort((a, b) => b.averageScore - a.averageScore);
      
      // Cache the results
      setScoresCache(prev => ({ ...prev, [cacheKey]: teamScores }));
      setRound1Scores(teamScores);
      
      // Auto-select top teams as finalists if none selected
      if (finalistTeams.length === 0 && teamScores.length > 0) {
        const topTeams = teamScores
          .filter(ts => ts.judgeCount > 0)
          .slice(0, Math.min(5, teamScores.length))
          .map(ts => ts.team);
        setFinalistTeams(topTeams);
      }
      
    } catch (error) {
      console.error('Error fetching Round 1 scores:', error);
      enqueueSnackbar('Failed to fetch Round 1 scores', { variant: 'error' });
    } finally {
      setLoadingScores(false);
    }
  }, [selectedHackathon, teams, accessToken, orgId, fetchPanelAssignments, fetchJudgeDetails, judgeDetailsCache, scoresCache, finalistTeams.length, enqueueSnackbar]);

  // Fetch judges and teams for selected hackathon
  const fetchData = useCallback(async () => {
    if (!selectedHackathon || !selectedHackathonData) return;
    
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
              "X-Org-Id": orgId,
            },
          }
        )
      ]);

      // Only get accepted judges
      const acceptedJudges = judgesResponse.data.data?.filter(judge => judge.isSelected) || [];
      setJudges(acceptedJudges);
      
      const allTeams = teamsResponse.data.teams || [];
      setTeams(allTeams);
      
      // Fetch nonprofit names for teams
      await fetchNonprofitNames(allTeams);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      enqueueSnackbar('Failed to fetch judging data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedHackathon, selectedHackathonData, accessToken, orgId, fetchNonprofitNames, enqueueSnackbar]);

  // Load existing Round 2 assignments
  const loadExistingRound2 = useCallback(async () => {
    if (!selectedHackathon || teams.length === 0) return;

    setLoadingPanels(true);
    try {
      // Step 1: Load panels
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
      
      if (round2Panel) {
        // Step 2: Load assignments for Round 2 panel
        const assignments = await fetchPanelAssignments(round2Panel.id);
        
        // Group assignments by judge and team
        const judgeMap = new Map();
        const teamSet = new Set();
        
        for (const assignment of assignments) {
          // Collect unique judges
          if (!judgeMap.has(assignment.judge_id)) {
            const judgeDetails = await fetchJudgeDetails(assignment.judge_id);
            if (judgeDetails) {
              judgeMap.set(assignment.judge_id, judgeDetails);
            }
          }
          
          // Collect unique teams
          if (assignment.team_id) {
            const team = teams.find(t => t.id === assignment.team_id);
            if (team) {
              teamSet.add(team);
            }
          }
        }
        
        const panelJudges = Array.from(judgeMap.values());
        const panelTeams = Array.from(teamSet);
        
        // Update state
        setFinalistTeams(panelTeams);
        setJudgeGroups([{
          id: round2Panel.id,
          panel_id: round2Panel.id,
          name: round2Panel.panel_name,
          judges: panelJudges,
          teams: panelTeams,
          room: round2Panel.room || ''
        }]);
        
        // Update session settings from panel data
        if (round2Panel.room) {
          setSessionSettings(prev => ({ ...prev, room: round2Panel.room }));
        }
      }
    } catch (error) {
      console.error('Error loading existing Round 2 assignments:', error);
      // Don't show error to user - this might be first time setup
    } finally {
      setLoadingPanels(false);
    }
  }, [selectedHackathon, teams, accessToken, orgId, fetchPanelAssignments, fetchJudgeDetails]);

  // Fetch Round 1 scores when teams data is available (only once per hackathon/teams change)
  useEffect(() => {
    let mounted = true;
    
    if (selectedHackathon && teams.length > 0) {
      fetchRound1Scores().then(() => {
        if (!mounted) return;
        // Only auto-select finalists if we haven't loaded existing Round 2 data
        // and no finalists are currently selected
      });
    }
    
    return () => {
      mounted = false;
    };
  }, [selectedHackathon, teams.length]); // Removed fetchRound1Scores dependency

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load existing Round 2 assignments when data is available
  useEffect(() => {
    if (selectedHackathon && judges.length > 0 && teams.length > 0) {
      loadExistingRound2();
    }
  }, [selectedHackathon, judges.length, teams.length]); // Removed loadExistingRound2 dependency

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

  // Handle sorting of teams by scores
  const handleSort = (field) => {
    const isAsc = sortBy === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(field);
  };

  // Get sorted teams with scores
  const getSortedTeamsWithScores = () => {
    if (round1Scores.length === 0) return teams.map(team => ({ team, averageScore: 0, judgeCount: 0, scores: [] }));
    
    const sorted = [...round1Scores].sort((a, b) => {
      switch (sortBy) {
        case 'teamName':
          return sortOrder === 'asc' ? a.team.name.localeCompare(b.team.name) : b.team.name.localeCompare(a.team.name);
        case 'judgeCount':
          return sortOrder === 'asc' ? a.judgeCount - b.judgeCount : b.judgeCount - a.judgeCount;
        case 'totalScore':
        default:
          return sortOrder === 'asc' ? a.averageScore - b.averageScore : b.averageScore - a.averageScore;
      }
    });
    
    return sorted;
  };

  // View detailed scores for a team
  const viewTeamScores = (teamScoreData) => {
    setSelectedTeamScores(teamScoreData);
    setViewScoresDialog(true);
  };

  // Auto-select top N teams as finalists
  const selectTopTeams = (count) => {
    const sortedTeams = getSortedTeamsWithScores();
    const topTeams = sortedTeams
      .filter(ts => ts.judgeCount > 0)
      .slice(0, count)
      .map(ts => ts.team);
    setFinalistTeams(topTeams);
    enqueueSnackbar(`Selected top ${topTeams.length} teams as finalists`, { variant: 'success' });
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
      // Check if Round 2 panel already exists
      let panelId = null;
      let existingPanel = judgeGroups.find(g => g.name === 'Round 2 - Final Judging');
      
      if (existingPanel && existingPanel.panel_id) {
        // Update existing panel
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/judge/panels/${existingPanel.panel_id}`,
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
        panelId = existingPanel.panel_id;
      } else {
        // Create new Round 2 panel
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
        panelId = panelResponse.data.panel_id || panelResponse.data.panel?.id;
      }

      // Assign all judges to all finalist teams for Round 2
      for (const judge of judges) {
        for (const team of finalistTeams) {
          const teamSchedule = schedule.find(s => s.team.id === team.id);
          
          await axios.post(
            `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/judge/assignments`,
            {
              judge_id: judge.user_id, // Use user_id consistently
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

      // Update local state
      if (!existingPanel) {
        setJudgeGroups(prev => [
          ...prev,
          {
            id: panelId,
            panel_id: panelId,
            name: 'Round 2 - Final Judging',
            judges: judges,
            teams: finalistTeams,
            room: sessionSettings.room || ''
          }
        ]);
      }

      enqueueSnackbar('Round 2 configuration saved successfully!', { variant: 'success' });
    } catch (error) {
      console.error('Error saving Round 2 configuration:', error);
      enqueueSnackbar('Failed to save Round 2 configuration', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Load existing Round 2 assignments when data is available
  useEffect(() => {
    if (selectedHackathon && judges.length > 0 && teams.length > 0) {
      loadExistingRound2();
    }
  }, [selectedHackathon, judges.length, teams.length]); // Removed loadExistingRound2 dependency

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
            Review Round 1 scores and select finalist teams for the final judging session where all judges evaluate the top teams.
          </Typography>

          {/* Round 1 Scores Overview */}
          <Accordion defaultExpanded sx={{ mb: 3 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h6">
                  Round 1 Results & Team Scores
                </Typography>
                {loadingScores && <CircularProgress size={20} />}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Review all team scores from Round 1 judging. Teams are ranked by average score across all judges.
              </Typography>
              
              {/* Quick selection buttons */}
              <Box sx={{ mb: 3, display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography variant="body2" sx={{ mr: 1 }}>Quick select:</Typography>
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={() => selectTopTeams(3)}
                >
                  Top 3
                </Button>
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={() => selectTopTeams(5)}
                >
                  Top 5
                </Button>
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={() => selectTopTeams(8)}
                >
                  Top 8
                </Button>
                <Button 
                  size="small" 
                  variant="text" 
                  onClick={() => setFinalistTeams([])}
                >
                  Clear All
                </Button>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Finalist</TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'teamName'}
                          direction={sortBy === 'teamName' ? sortOrder : 'asc'}
                          onClick={() => handleSort('teamName')}
                        >
                          Team Name
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Nonprofit</TableCell>
                      <TableCell align="center">
                        <TableSortLabel
                          active={sortBy === 'judgeCount'}
                          direction={sortBy === 'judgeCount' ? sortOrder : 'asc'}
                          onClick={() => handleSort('judgeCount')}
                        >
                          Judges
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="center">
                        <TableSortLabel
                          active={sortBy === 'totalScore'}
                          direction={sortBy === 'totalScore' ? sortOrder : 'asc'}
                          onClick={() => handleSort('totalScore')}
                        >
                          Avg Score
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getSortedTeamsWithScores().map((teamScoreData, index) => {
                      const { team, averageScore, judgeCount, scores } = teamScoreData;
                      const isFinalist = finalistTeams.some(t => t.id === team.id);
                      const nonprofitName = team.selected_nonprofit_id ? 
                        (nonprofitNames[team.selected_nonprofit_id] || 'Loading...') : 'No nonprofit';
                      
                      return (
                        <TableRow 
                          key={team.id}
                          sx={{ 
                            backgroundColor: isFinalist ? 'action.selected' : 'inherit',
                            '&:hover': { backgroundColor: 'action.hover' }
                          }}
                        >
                          <TableCell>
                            <Switch
                              checked={isFinalist}
                              onChange={() => toggleFinalistStatus(team.id)}
                              color="primary"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {index < 3 && judgeCount > 0 && (
                                <Chip 
                                  icon={<TrophyIcon />} 
                                  label={`#${index + 1}`} 
                                  size="small" 
                                  color={index === 0 ? 'warning' : 'default'}
                                  variant="outlined"
                                />
                              )}
                              <Typography variant="body2" sx={{ fontWeight: isFinalist ? 600 : 400 }}>
                                {team.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {loadingNonprofits ? 'Loading...' : nonprofitName}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={judgeCount} 
                              size="small" 
                              color={judgeCount === 0 ? 'error' : judgeCount < 3 ? 'warning' : 'success'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="center">
                            {judgeCount > 0 ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                  {averageScore.toFixed(1)}
                                </Typography>
                                <Box sx={{ display: 'flex' }}>
                                  {[1,2,3,4,5].map(star => (
                                    <StarIcon 
                                      key={star}
                                      sx={{ 
                                        fontSize: 16,
                                        color: star <= averageScore/2 ? 'warning.main' : 'action.disabled'
                                      }}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No scores
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="View detailed scores">
                              <IconButton 
                                size="small" 
                                onClick={() => viewTeamScores(teamScoreData)}
                                disabled={judgeCount === 0}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {round1Scores.length === 0 && !loadingScores && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No Round 1 scores found. Teams may not have been judged yet, or no Round 1 panels exist.
                </Alert>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Selected Finalists Summary */}
          <Accordion defaultExpanded sx={{ mb: 3 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                Selected Finalist Teams ({finalistTeams.length} selected)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                These teams will advance to Round 2 final judging presentations.
              </Typography>
              
              {finalistTeams.length > 0 ? (
                <Grid container spacing={2}>
                  {finalistTeams.map((team) => {
                    const teamScoreData = round1Scores.find(ts => ts.team.id === team.id);
                    const nonprofitName = team.selected_nonprofit_id ? 
                      (nonprofitNames[team.selected_nonprofit_id] || 'Loading...') : 'No nonprofit';
                    
                    return (
                      <Grid item xs={12} sm={6} md={4} key={team.id}>
                        <Card 
                          sx={{ 
                            border: '2px solid',
                            borderColor: 'primary.main',
                            backgroundColor: 'action.selected'
                          }}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="h6" component="div">
                                {team.name}
                              </Typography>
                              <CheckIcon color="primary" />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {nonprofitName}
                            </Typography>
                            {teamScoreData && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  Avg Score: {teamScoreData.averageScore.toFixed(1)}
                                </Typography>
                                <Chip 
                                  label={`${teamScoreData.judgeCount} judges`} 
                                  size="small" 
                                  variant="outlined"
                                />
                              </Box>
                            )}
                            <Button
                              size="small"
                              color="error"
                              onClick={() => toggleFinalistStatus(team.id)}
                              sx={{ mt: 1 }}
                            >
                              Remove
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              ) : (
                <Alert severity="warning">
                  No finalist teams selected. Use the table above to select teams for Round 2.
                </Alert>
              )}
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
                    <React.Fragment key={judge.user_id}>
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
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {judge.user_id}
                              </Typography>
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

      {/* Team Scores Detail Dialog */}
      <Dialog 
        open={viewScoresDialog} 
        onClose={() => setViewScoresDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrophyIcon />
            Detailed Scores: {selectedTeamScores?.team?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedTeamScores && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Team Overview
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                          {selectedTeamScores.averageScore.toFixed(1)}
                        </Typography>
                        <Typography variant="body2">Average Score</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="secondary">
                          {selectedTeamScores.judgeCount}
                        </Typography>
                        <Typography variant="body2">Judges</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">
                          {selectedTeamScores.totalScore.toFixed(1)}
                        </Typography>
                        <Typography variant="body2">Total Score</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
              
              <Typography variant="h6" gutterBottom>
                Individual Judge Scores
              </Typography>
              
              {selectedTeamScores.scores.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Judge</TableCell>
                        <TableCell>Company</TableCell>
                        {selectedTeamScores.scores[0] && Object.keys(selectedTeamScores.scores[0].score.scores).map(criteria => (
                          <TableCell key={criteria} align="center">
                            {criteria.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </TableCell>
                        ))}
                        <TableCell align="center">Total</TableCell>
                        <TableCell>Feedback</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedTeamScores.scores.map((judgeScore, index) => {
                        const totalScore = judgeScore.score.total_score || 0;
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {judgeScore.judge.name || judgeScore.judge.firstName + ' ' + judgeScore.judge.lastName}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {judgeScore.judge.company || judgeScore.judge.companyName}
                              </Typography>
                            </TableCell>
                            {Object.entries(judgeScore.score.scores).map(([criteria, score]) => (
                              <TableCell key={criteria} align="center">
                                <Chip 
                                  label={score} 
                                  size="small" 
                                  color={score >= 8 ? 'success' : score >= 6 ? 'warning' : 'default'}
                                />
                              </TableCell>
                            ))}
                            <TableCell align="center">
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {totalScore}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {judgeScore.score.feedback || 'No feedback provided'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  No scores available for this team.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewScoresDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JudgingRound2;