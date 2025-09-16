import React, { useState, useEffect, useCallback } from "react";
import { useAuthInfo, RequiredAuthProvider, RedirectToLogin  } from "@propelauth/react";

import {
  Box,
  Grid,
  CircularProgress,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  Stack,
  Chip,
} from "@mui/material";
import {
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Group as TeamsIcon,
  VolunteerActivism as VolunteerIcon,
  CheckCircle as CheckInIcon,
  Gavel as JudgingIcon,
  Launch as LaunchIcon
} from "@mui/icons-material";
import { LocalizationProvider, DatePicker, DateTimePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useRouter } from "next/router";
import AdminPage from "../../../components/admin/AdminPage";
import DonationManagement from "../../../components/admin/DonationManagement";
import CountdownManagement from "../../../components/admin/CountdownManagement";
import LinkManagement from "../../../components/admin/LinkManagement";
import HackathonDuplicator from "../../../components/admin/HackathonDuplicator";
import NonprofitManagement from "../../../components/admin/NonprofitManagement";

const AdminHackathonPage = () => {
  const router = useRouter();
  const { accessToken, userClass } = useAuthInfo();
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingHackathon, setEditingHackathon] = useState(null);
  const [editDialogTabValue, setEditDialogTabValue] = useState(0);

  const org = userClass?.getOrgByName("Opportunity Hack Org");
  const isAdmin = org?.hasPermission("volunteer.admin");
  const orgId = org?.orgId;

  const fetchHackathons = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/messages/hackathons`,
        {
          headers: {
            authorization: `Bearer ${accessToken}`,
            "content-type": "application/json",
            "X-Org-Id": orgId,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Sort hackathons by start_date in descending order (newest first)
        const sortedHackathons = [...(data.hackathons || [])].sort((a, b) => {
          return new Date(b.start_date) - new Date(a.start_date);
        });
        setHackathons(sortedHackathons);
      } else {
        throw new Error("Failed to fetch hackathons");
      }
    } catch (error) {
      console.error("Error fetching hackathons:", error);
      setSnackbar({
        open: true,
        message: "Failed to fetch hackathons. Please try again.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [accessToken, orgId]);

  useEffect(() => {
    if (isAdmin) {
      fetchHackathons();
    }
  }, [isAdmin]);

  const handleCountdownsChange = (newCountdowns) => {
    setEditingHackathon((prev) => ({
      ...prev,
      countdowns: newCountdowns,
    }));
  };

  const handleEditHackathon = (hackathon) => {
    setEditingHackathon({
      ...hackathon,
      start_date: hackathon.start_date ? hackathon.start_date.split('T')[0] : '',
      end_date: hackathon.end_date ? hackathon.end_date.split('T')[0] : '',
    });
    setEditDialogTabValue(0); // Reset to first tab
    setEditDialogOpen(true);
  };

  const handleAddHackathon = () => {
    setEditingHackathon({
      title: "",
      description: "",
      start_date: null,
      end_date: null,
      event_id: "",
      location: "",
      image_url: "",
      type: "",
      links: [],
      countdowns: [],
      constraints: {
        max_people_per_team: 5,
        max_teams_per_problem: 10,
        min_people_per_team: 2,
      },
      donation_current: {
        food: '0',
        prize: '0',
        swag: '0',
        thank_you: '',
      },
      donation_goals: {
        food: '0',
        prize: '0',
        swag: '0',
      },
    });
    setEditDialogTabValue(0); // Reset to first tab
    setEditDialogOpen(true);
  };

  const handleDonationDataChange = (newDonationData) => {
    setEditingHackathon((prev) => ({
      ...prev,
      donation_current: newDonationData.donation_current,
      donation_goals: newDonationData.donation_goals,
    }));
  };

  const handleSaveHackathon = async () => {
    setLoading(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/messages/hackathon`;
      const method = editingHackathon.id ? "PATCH" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
          "X-Org-Id": orgId,
        },
        body: JSON.stringify(editingHackathon),
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: editingHackathon.id
            ? "Hackathon updated successfully"
            : "Hackathon created successfully",
          severity: "success",
        });
        fetchHackathons();
      } else {
        throw new Error(
          editingHackathon.id
            ? "Failed to update hackathon"
            : "Failed to create hackathon"
        );
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to ${
          editingHackathon.id ? "update" : "create"
        } hackathon. Please try again.`,
        severity: "error",
      });
    } finally {
      setLoading(false);
      setEditDialogOpen(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditingHackathon((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddLink = () => {
    setEditingHackathon((prev) => ({
      ...prev,
      links: [...prev.links, { name: "", link: "", color: "", open_new: false, size: "medium", variant: "text" }],
    }));
  };

  const handleUpdateLink = (index, field, value) => {
    setEditingHackathon((prev) => {
      const newLinks = [...prev.links];
      newLinks[index] = { ...newLinks[index], [field]: value };
      return { ...prev, links: newLinks };
    });
  };

  const handleRemoveLink = (index) => {
    setEditingHackathon((prev) => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index),
    }));
  };

  const handleAddCountdown = () => {
    setEditingHackathon((prev) => ({
      ...prev,
      countdowns: [...prev.countdowns, { name: "", description: "", time: new Date() }],
    }));
  };

  const handleUpdateCountdown = (index, field, value) => {
    setEditingHackathon((prev) => {
      const newCountdowns = [...prev.countdowns];
      newCountdowns[index] = { ...newCountdowns[index], [field]: value };
      return { ...prev, countdowns: newCountdowns };
    });
  };

  const handleRemoveCountdown = (index) => {
    setEditingHackathon((prev) => ({
      ...prev,
      countdowns: prev.countdowns.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateConstraint = (field, value) => {
    setEditingHackathon((prev) => ({
      ...prev,
      constraints: { ...prev.constraints, [field]: parseInt(value, 10) },
    }));
  };

  const handleNonprofitUpdate = useCallback(() => {
    setSnackbar({
      open: true,
      message: "Nonprofit settings updated successfully",
      severity: "success",
    });

    fetchHackathons(); // Refresh the hackathon list after updating nonprofit settings    
  }, []);

  const handleNonprofitError = useCallback((errorMsg) => {
    setSnackbar({
      open: true,
      message: errorMsg || "Failed to update nonprofit settings",
      severity: "error",
    });
  }, []);

  if (!isAdmin) {
    return (        
        <RequiredAuthProvider
            authUrl={process.env.NEXT_PUBLIC_REACT_APP_AUTH_URL}
            displayIfLoggedOut={<RedirectToLogin
      postLoginRedirectUrl={window.location.href}
    />}
            >

      <AdminPage title="Hackathon Management" isAdmin={false}>
        <Typography>You do not have permission to view this page.</Typography>
      </AdminPage>
      </RequiredAuthProvider>
    );
  }

  return (
    <RequiredAuthProvider
            authUrl={process.env.NEXT_PUBLIC_REACT_APP_AUTH_URL}
            displayIfLoggedOut={
                <RedirectToLogin
      postLoginRedirectUrl={window.location.href}
    />
            }
            >
    <AdminPage
      title="Hackathon Management"
      snackbar={snackbar}
      onSnackbarClose={() => setSnackbar({ ...snackbar, open: false })}
      isAdmin={isAdmin}
    >
      <Box sx={{ mb: 3, width: "100%" }}>
        <Grid container spacing={2} alignItems="center" justifyContent="flex-end">
          <Grid item>
            <Button
              onClick={handleAddHackathon}
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
            >
              Add Hackathon
            </Button>
          </Grid>
        </Grid>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={3}>
          {hackathons.map((hackathon) => (
            <Grid item xs={12} lg={6} key={hackathon.id}>
              <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                        {hackathon.title}
                      </Typography>
                      <Chip
                        label={hackathon.event_id}
                        color="primary"
                        size="small"
                        sx={{ mb: 1 }}
                      />
                    </Box>
                    <Box>
                      <IconButton onClick={() => handleEditHackathon(hackathon)} size="small">
                        <EditIcon />
                      </IconButton>
                      <HackathonDuplicator
                        hackathon={hackathon}
                        onDuplicate={(newHackathon) => {
                          fetchHackathons();
                          setSnackbar({
                            open: true,
                            message: "Hackathon duplicated successfully",
                            severity: "success",
                          });
                        }}
                        accessToken={accessToken}
                        orgId={orgId}
                      />
                    </Box>
                  </Box>

                  {/* Event Details */}
                  <Stack spacing={1} sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      📅 {hackathon.start_date} to {hackathon.end_date}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      📍 {hackathon.location}
                    </Typography>
                    {hackathon.description && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {hackathon.description.length > 100
                          ? `${hackathon.description.substring(0, 100)}...`
                          : hackathon.description
                        }
                      </Typography>
                    )}
                  </Stack>
                </CardContent>

                <CardActions sx={{ p: 1.5, pt: 0, flexDirection: 'column', alignItems: 'stretch' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'bold', textAlign: 'left' }}>
                    Admin Tools:
                  </Typography>

                  {/* Admin Tool Buttons - Compact Stack Layout */}
                  <Stack spacing={1} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<TeamsIcon />}
                        variant="outlined"
                        onClick={() => router.push(`/admin/teams?event_id=${hackathon.event_id}`)}
                        sx={{
                          flex: 1,
                          textTransform: 'none',
                          fontSize: '0.7rem',
                          minHeight: 32,
                          px: 0.5,
                          '& .MuiButton-startIcon': {
                            mr: 0.5
                          }
                        }}
                      >
                        Teams
                      </Button>
                      <Button
                        size="small"
                        startIcon={<VolunteerIcon />}
                        variant="outlined"
                        onClick={() => router.push(`/admin/volunteer?event_id=${hackathon.event_id}`)}
                        sx={{
                          flex: 1,
                          textTransform: 'none',
                          fontSize: '0.7rem',
                          minHeight: 32,
                          px: 0.5,
                          '& .MuiButton-startIcon': {
                            mr: 0.5
                          }
                        }}
                      >
                        Volunteer
                      </Button>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<CheckInIcon />}
                        variant="outlined"
                        onClick={() => router.push(`/admin/check-in?event_id=${hackathon.event_id}`)}
                        sx={{
                          flex: 1,
                          textTransform: 'none',
                          fontSize: '0.7rem',
                          minHeight: 32,
                          px: 0.5,
                          '& .MuiButton-startIcon': {
                            mr: 0.5
                          }
                        }}
                      >
                        Check-in
                      </Button>
                      <Button
                        size="small"
                        startIcon={<JudgingIcon />}
                        variant="outlined"
                        onClick={() => router.push(`/admin/judging?event_id=${hackathon.event_id}`)}
                        sx={{
                          flex: 1,
                          textTransform: 'none',
                          fontSize: '0.7rem',
                          minHeight: 32,
                          px: 0.5,
                          '& .MuiButton-startIcon': {
                            mr: 0.5
                          }
                        }}
                      >
                        Judging
                      </Button>
                    </Box>
                  </Stack>

                  {/* View Event Link */}
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<LaunchIcon />}
                    onClick={() => window.open(`/hack/${hackathon.event_id}`, '_blank')}
                    sx={{ textTransform: 'none', minHeight: 36 }}
                  >
                    View Event Page
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingHackathon?.id ? "Edit Hackathon" : "Add Hackathon"}
        </DialogTitle>
        <DialogContent>
          <Tabs
            value={editDialogTabValue}
            onChange={(e, newValue) => setEditDialogTabValue(newValue)}
            aria-label="hackathon edit tabs"
            sx={{ mb: 3 }}
          >
            <Tab label="Basic Info" value={0} />
            <Tab label="Nonprofits" value={1} disabled={!editingHackathon?.id} />
            <Tab label="Advanced Settings" value={2} />
          </Tabs>

          {editDialogTabValue === 0 && (
            <>
              <TextField
                fullWidth
                label="Title"
                value={editingHackathon?.title || ""}
                onChange={(e) => handleInputChange("title", e.target.value)}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Description"
                value={editingHackathon?.description || ""}
                onChange={(e) => handleInputChange("description", e.target.value)}
                margin="normal"
                multiline
                rows={4}
              />
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={editingHackathon?.start_date || ""}
                onChange={(e) => handleInputChange("start_date", e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                margin="normal"
              />
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={editingHackathon?.end_date || ""}
                onChange={(e) => handleInputChange("end_date", e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                margin="normal"
                />
              <TextField
                fullWidth
                label="Event ID"
                value={editingHackathon?.event_id || ""}
                onChange={(e) => handleInputChange("event_id", e.target.value)}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Location"
                value={editingHackathon?.location || ""}
                onChange={(e) => handleInputChange("location", e.target.value)}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Image URL"
                value={editingHackathon?.image_url || ""}
                onChange={(e) => handleInputChange("image_url", e.target.value)}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Type"
                value={editingHackathon?.type || ""}
                onChange={(e) => handleInputChange("type", e.target.value)}
                margin="normal"
              />
            </>
          )}

          {editDialogTabValue === 1 && editingHackathon?.id && (
            <NonprofitManagement 
              hackathon={editingHackathon}
              accessToken={accessToken}
              orgId={orgId}
              onUpdate={handleNonprofitUpdate}
              onError={handleNonprofitError}
            />
          )}

          {editDialogTabValue === 2 && (
            <>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Links</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <LinkManagement
                    links={editingHackathon?.links || []}
                    onChange={(newLinks) => handleInputChange('links', newLinks)}
                    />
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Countdowns</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <CountdownManagement
                    countdowns={editingHackathon?.countdowns || []}
                    onChange={handleCountdownsChange}
                  />
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Constraints</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TextField
                    label="Max People Per Team"
                    type="number"
                    value={editingHackathon?.constraints.max_people_per_team || ""}
                    onChange={(e) => handleUpdateConstraint("max_people_per_team", e.target.value)}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="Max Teams Per Problem"
                    type="number"
                    value={editingHackathon?.constraints.max_teams_per_problem || ""}
                    onChange={(e) => handleUpdateConstraint("max_teams_per_problem", e.target.value)}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="Min People Per Team"
                    type="number"
                    value={editingHackathon?.constraints.min_people_per_team || ""}
                    onChange={(e) => handleUpdateConstraint("min_people_per_team", e.target.value)}
                    fullWidth
                    margin="normal"
                  />
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Donations</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <DonationManagement
                    initialDonationData={{
                      donation_current: editingHackathon?.donation_current,
                      donation_goals: editingHackathon?.donation_goals,
                    }}
                    onDonationDataChange={handleDonationDataChange}
                  />
                </AccordionDetails>
              </Accordion>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          {editDialogTabValue !== 1 && (
            <Button onClick={handleSaveHackathon} color="primary">
              Save
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </AdminPage>
    </RequiredAuthProvider>
  );
}

export default AdminHackathonPage;