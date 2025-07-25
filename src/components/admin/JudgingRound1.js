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
  Chip,
  Divider,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Groups as GroupsIcon,
  Person as PersonIcon,
  AssignmentTurnedIn as AssignIcon,
  LocationOn as LocationIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useAuthInfo } from '@propelauth/react';
import { useSnackbar } from 'notistack';
import axios from 'axios';

const JudgingRound1 = ({ orgId, hackathons, selectedHackathon, setSelectedHackathon }) => {
  const { accessToken } = useAuthInfo();
  const { enqueueSnackbar } = useSnackbar();
  
  const [loading, setLoading] = useState(false);
  const [judges, setJudges] = useState([]);
  const [teams, setTeams] = useState([]);
  const [judgeGroups, setJudgeGroups] = useState([]);
  const [selectedHackathonData, setSelectedHackathonData] = useState(null);
  const [editGroupDialog, setEditGroupDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [saving, setSaving] = useState(false);

  // Fetch hackathon details to check if it's in-person
  useEffect(() => {
    if (selectedHackathon && hackathons.length > 0) {
      const hackathon = hackathons.find(h => h.event_id === selectedHackathon);
      setSelectedHackathonData(hackathon);
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
              "X-Org-Id": orgId,
            },
          }
        )
      ]);

      // Only get accepted judges
      const acceptedJudges = judgesResponse.data.data?.filter(judge => judge.isSelected) || [];
      setJudges(acceptedJudges);
      
      setTeams(teamsResponse.data.teams || []);
      
      // Initialize judge groups if none exist
      if (judgeGroups.length === 0 && acceptedJudges.length > 0) {
        const defaultGroups = [
          {
            id: 1,
            name: 'Panel A',
            judges: [],
            teams: [],
            room: selectedHackathonData?.location?.includes('Virtual') ? '' : 'Room 1'
          }
        ];
        setJudgeGroups(defaultGroups);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      enqueueSnackbar('Failed to fetch judging data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedHackathon, accessToken, orgId, judgeGroups.length, selectedHackathonData, enqueueSnackbar]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add new judge group
  const addJudgeGroup = () => {
    const newGroup = {
      id: Date.now(),
      name: `Panel ${String.fromCharCode(65 + judgeGroups.length)}`,
      judges: [],
      teams: [],
      room: selectedHackathonData?.location?.includes('Virtual') ? '' : `Room ${judgeGroups.length + 1}`
    };
    setJudgeGroups([...judgeGroups, newGroup]);
  };

  // Remove judge group
  const removeJudgeGroup = (groupId) => {
    setJudgeGroups(judgeGroups.filter(group => group.id !== groupId));
  };

  // Edit judge group
  const editJudgeGroup = (group) => {
    setEditingGroup({ ...group });
    setEditGroupDialog(true);
  };

  // Save edited group
  const saveEditedGroup = () => {
    setJudgeGroups(judgeGroups.map(group => 
      group.id === editingGroup.id ? editingGroup : group
    ));
    setEditGroupDialog(false);
    setEditingGroup(null);
  };

  // Assign judge to group
  const assignJudgeToGroup = (judgeId, groupId) => {
    const judge = judges.find(j => j.id === judgeId || j.user_id === judgeId);
    if (!judge) return;

    setJudgeGroups(judgeGroups.map(group => {
      if (group.id === groupId) {
        const isAlreadyAssigned = group.judges.some(j => (j.id || j.user_id) === judgeId);
        if (!isAlreadyAssigned) {
          return { ...group, judges: [...group.judges, judge] };
        }
      }
      return group;
    }));
  };

  // Remove judge from group
  const removeJudgeFromGroup = (judgeId, groupId) => {
    setJudgeGroups(judgeGroups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          judges: group.judges.filter(j => (j.id || j.user_id) !== judgeId)
        };
      }
      return group;
    }));
  };

  // Assign team to group
  const assignTeamToGroup = (teamId, groupId) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    setJudgeGroups(judgeGroups.map(group => {
      if (group.id === groupId) {
        const isAlreadyAssigned = group.teams.some(t => t.id === teamId);
        if (!isAlreadyAssigned) {
          return { ...group, teams: [...group.teams, team] };
        }
      }
      return group;
    }));
  };

  // Remove team from group
  const removeTeamFromGroup = (teamId, groupId) => {
    setJudgeGroups(judgeGroups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          teams: group.teams.filter(t => t.id !== teamId)
        };
      }
      return group;
    }));
  };

  // Get unassigned judges
  const getUnassignedJudges = () => {
    const assignedJudgeIds = judgeGroups.flatMap(group => 
      group.judges.map(j => j.id || j.user_id)
    );
    return judges.filter(judge => 
      !assignedJudgeIds.includes(judge.id || judge.user_id)
    );
  };

  // Get unassigned teams
  const getUnassignedTeams = () => {
    const assignedTeamIds = judgeGroups.flatMap(group => 
      group.teams.map(t => t.id)
    );
    return teams.filter(team => !assignedTeamIds.includes(team.id));
  };

  const isInPerson = selectedHackathonData && !selectedHackathonData.location?.includes('Virtual');

  // Save judge panel assignments to backend
  const saveJudgeAssignments = async () => {
    if (!selectedHackathon || judgeGroups.length === 0) {
      enqueueSnackbar('No assignments to save', { variant: 'warning' });
      return;
    }

    setSaving(true);
    try {
      // First, create/update panels
      for (const group of judgeGroups) {
        try {
          // Create or update panel
          const panelResponse = await axios.post(
            `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/judge/panels`,
            {
              event_id: selectedHackathon,
              panel_name: group.name,
              room: group.room || null
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

          // Create judge assignments for this panel
          for (const judge of group.judges) {
            for (const team of group.teams) {
              await axios.post(
                `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/judge/assignments`,
                {
                  judge_id: judge.id || judge.user_id,
                  event_id: selectedHackathon,
                  team_id: team.id,
                  round: 'round1',
                  panel_id: panelId,
                  room: group.room || null
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
        } catch (error) {
          console.error(`Error saving panel ${group.name}:`, error);
          throw error;
        }
      }

      enqueueSnackbar('Judge assignments saved successfully!', { variant: 'success' });
    } catch (error) {
      console.error('Error saving judge assignments:', error);
      enqueueSnackbar('Failed to save judge assignments', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Load existing panel assignments
  const loadExistingAssignments = useCallback(async () => {
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
      
      if (panels.length > 0) {
        // Convert panels to judge groups format
        const loadedGroups = panels.map(panel => ({
          id: panel.panel_id,
          name: panel.panel_name,
          judges: panel.judges || [],
          teams: panel.teams || [],
          room: panel.room || ''
        }));
        
        setJudgeGroups(loadedGroups);
      }
    } catch (error) {
      console.error('Error loading existing assignments:', error);
      // Don't show error to user - this might be first time setup
    }
  }, [selectedHackathon, accessToken, orgId]);

  // Load existing assignments when hackathon changes
  useEffect(() => {
    if (selectedHackathon && judges.length > 0 && teams.length > 0) {
      loadExistingAssignments();
    }
  }, [selectedHackathon, judges.length, teams.length, loadExistingAssignments]);

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
            startIcon={<AddIcon />}
            onClick={addJudgeGroup}
            disabled={!selectedHackathon}
          >
            Add Judge Panel
          </Button>
        </Grid>
        <Grid item xs={12} md={4}>
          <Button
            variant="contained"
            color="success"
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <AssignIcon />}
            onClick={saveJudgeAssignments}
            disabled={!selectedHackathon || judgeGroups.length === 0 || saving}
            fullWidth
          >
            {saving ? 'Saving...' : 'Save Assignments'}
          </Button>
        </Grid>
      </Grid>

      {!selectedHackathon ? (
        <Alert severity="info">Please select a hackathon to manage judging assignments.</Alert>
      ) : (
        <>
          {/* Summary Stats */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <PersonIcon color="primary" sx={{ fontSize: 40 }} />
                  <Typography variant="h6">{judges.length}</Typography>
                  <Typography variant="body2">Total Judges</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <GroupsIcon color="secondary" sx={{ fontSize: 40 }} />
                  <Typography variant="h6">{teams.length}</Typography>
                  <Typography variant="body2">Total Teams</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <AssignIcon color="success" sx={{ fontSize: 40 }} />
                  <Typography variant="h6">{judgeGroups.length}</Typography>
                  <Typography variant="body2">Judge Panels</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <LocationIcon color="info" sx={{ fontSize: 40 }} />
                  <Typography variant="h6">{isInPerson ? 'In-Person' : 'Virtual'}</Typography>
                  <Typography variant="body2">Event Type</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Judge Groups */}
          <Typography variant="h5" gutterBottom>
            Round 1 - Judge Panel Assignments
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Assign judges to panels and teams to each panel for initial video review judging.
          </Typography>

          {judgeGroups.map((group) => (
            <Accordion key={group.id} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    {group.name}
                  </Typography>
                  <Chip 
                    label={`${group.judges.length} judges, ${group.teams.length} teams`} 
                    size="small" 
                    sx={{ mr: 2 }}
                  />
                  {isInPerson && group.room && (
                    <Chip label={group.room} variant="outlined" size="small" sx={{ mr: 2 }} />
                  )}
                  <IconButton onClick={() => editJudgeGroup(group)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    onClick={() => removeJudgeGroup(group.id)} 
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  {/* Assigned Judges */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Assigned Judges ({group.judges.length})
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, minHeight: 200 }}>
                      <List dense>
                        {group.judges.map((judge) => (
                          <ListItem 
                            key={judge.id || judge.user_id}
                            secondaryAction={
                              <IconButton 
                                onClick={() => removeJudgeFromGroup(judge.id || judge.user_id, group.id)}
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            }
                          >
                            <ListItemIcon>
                              <PersonIcon />
                            </ListItemIcon>
                            <ListItemText 
                              primary={judge.name || judge.firstName + ' ' + judge.lastName}
                              secondary={judge.company || judge.companyName}
                            />
                          </ListItem>
                        ))}
                        {group.judges.length === 0 && (
                          <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                            No judges assigned to this panel yet
                          </Typography>
                        )}
                      </List>
                    </Paper>
                  </Grid>

                  {/* Assigned Teams */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Assigned Teams ({group.teams.length})
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, minHeight: 200 }}>
                      <List dense>
                        {group.teams.map((team) => (
                          <ListItem 
                            key={team.id}
                            secondaryAction={
                              <IconButton 
                                onClick={() => removeTeamFromGroup(team.id, group.id)}
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            }
                          >
                            <ListItemIcon>
                              <GroupsIcon />
                            </ListItemIcon>
                            <ListItemText 
                              primary={team.name}
                              secondary={`${team.members?.length || 0} members`}
                            />
                          </ListItem>
                        ))}
                        {group.teams.length === 0 && (
                          <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                            No teams assigned to this panel yet
                          </Typography>
                        )}
                      </List>
                    </Paper>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}

          {/* Unassigned Resources */}
          <Grid container spacing={3} sx={{ mt: 4 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Unassigned Judges ({getUnassignedJudges().length})
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                <List dense>
                  {getUnassignedJudges().map((judge) => (
                    <ListItem 
                      key={judge.id || judge.user_id}
                      sx={{ 
                        border: '1px dashed #ccc', 
                        mb: 1, 
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <ListItemIcon>
                        <PersonIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary={judge.name || judge.firstName + ' ' + judge.lastName}
                        secondary={judge.company || judge.companyName}
                      />
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          displayEmpty
                          value=""
                          onChange={(e) => assignJudgeToGroup(judge.id || judge.user_id, e.target.value)}
                        >
                          <MenuItem value="" disabled>Assign to...</MenuItem>
                          {judgeGroups.map((group) => (
                            <MenuItem key={group.id} value={group.id}>
                              {group.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </ListItem>
                  ))}
                  {getUnassignedJudges().length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                      All judges have been assigned to panels
                    </Typography>
                  )}
                </List>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Unassigned Teams ({getUnassignedTeams().length})
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                <List dense>
                  {getUnassignedTeams().map((team) => (
                    <ListItem 
                      key={team.id}
                      sx={{ 
                        border: '1px dashed #ccc', 
                        mb: 1, 
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <ListItemIcon>
                        <GroupsIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary={team.name}
                        secondary={`${team.members?.length || 0} members`}
                      />
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          displayEmpty
                          value=""
                          onChange={(e) => assignTeamToGroup(team.id, e.target.value)}
                        >
                          <MenuItem value="" disabled>Assign to...</MenuItem>
                          {judgeGroups.map((group) => (
                            <MenuItem key={group.id} value={group.id}>
                              {group.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </ListItem>
                  ))}
                  {getUnassignedTeams().length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                      All teams have been assigned to panels
                    </Typography>
                  )}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}

      {/* Edit Group Dialog */}
      <Dialog open={editGroupDialog} onClose={() => setEditGroupDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Judge Panel</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Panel Name"
            fullWidth
            variant="outlined"
            value={editingGroup?.name || ''}
            onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          {isInPerson && (
            <TextField
              margin="dense"
              label="Room Assignment"
              fullWidth
              variant="outlined"
              value={editingGroup?.room || ''}
              onChange={(e) => setEditingGroup({ ...editingGroup, room: e.target.value })}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditGroupDialog(false)}>Cancel</Button>
          <Button onClick={saveEditedGroup} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JudgingRound1;