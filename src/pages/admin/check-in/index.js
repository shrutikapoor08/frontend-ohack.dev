import React, { useState, useEffect, useCallback } from "react";
import { useAuthInfo, withRequiredAuthInfo } from "@propelauth/react";
import {
  Typography,
  Box,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import QrScanner from 'react-qr-scanner';
import AdminPage from "../../../components/admin/AdminPage";
import { useRouter } from "next/router";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import PersonIcon from '@mui/icons-material/Person';
import useHackathonEvents from "../../../hooks/use-hackathon-events";

const AdminCheckInPage = withRequiredAuthInfo(({ userClass }) => {
  const { accessToken } = useAuthInfo();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  
  // Authentication
  const org = userClass.getOrgByName("Opportunity Hack Org");
  const orgId = org.orgId;
  const isAdmin = org.hasPermission("volunteer.admin");

  // Hackathon events
  const { hackathons = [] } = useHackathonEvents(false) || {};

  // State
  const [selectedEventId, setSelectedEventId] = useState("");
  const [checkInCounts, setCheckInCounts] = useState({
    mentor: 0,
    judge: 0,
    volunteer: 0,
    hacker: 0,
    sponsor: 0
  });
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [checkInHistory, setCheckInHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [manualEventId, setManualEventId] = useState("");
  const [manualVolunteerId, setManualVolunteerId] = useState("");
  const [manualVolunteerType, setManualVolunteerType] = useState("");

  // Scanner settings
  const [facingMode, setFacingMode] = useState('environment'); // 'user' for front camera, 'environment' for back camera

  // Fetch check-in counts for all volunteer types
  const fetchCheckInCounts = useCallback(async (eventId) => {
    if (!eventId) return;
    
    const volunteerTypes = ['mentor', 'judge', 'volunteer', 'hacker', 'sponsor'];
    const counts = {};
    
    try {
      const promises = volunteerTypes.map(async (type) => {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/messages/hackathon/${eventId}/${type}/checkins`,
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
          console.log(`Fetched ${type} check-ins:`, data);
          // Count volunteers that are checked in
          const checkedInCount = Array.isArray(data.data) 
            ? data.data.filter(volunteer => volunteer.checkedIn === true).length 
            : 0;

          console.log(`Counted ${checkedInCount} checked-in ${type}s`);
          return { type, count: checkedInCount };
        } else {
          return { type, count: 0 };
        }
      });
      
      const results = await Promise.all(promises);
      results.forEach(({ type, count }) => {
        counts[type] = count;
      });
      
      setCheckInCounts(counts);
    } catch (error) {
      console.error('Error fetching check-in counts:', error);
      // Reset counts on error
      setCheckInCounts({
        mentor: 0,
        judge: 0,
        volunteer: 0,
        hacker: 0,
        sponsor: 0
      });
    }
  }, [accessToken, orgId]);

  // Handle hackathon event selection
  const handleEventChange = (eventId) => {
    setSelectedEventId(eventId);
    setManualEventId(eventId); // Also set it for manual entry
    if (eventId) {
      fetchCheckInCounts(eventId);
    } else {
      setCheckInCounts({
        mentor: 0,
        judge: 0,
        volunteer: 0,
        hacker: 0,
        sponsor: 0
      });
    }
  };

  // Auto-refresh check-in counts every 7 seconds
  useEffect(() => {
    if (!selectedEventId) return;

    fetchCheckInCounts(selectedEventId);
    
    const interval = setInterval(() => {
      fetchCheckInCounts(selectedEventId);
    }, 7000);

    return () => clearInterval(interval);
  }, [selectedEventId, fetchCheckInCounts]);

  // Define processCheckIn before handleScan
  const processCheckIn = useCallback(async (eventId, volunteerId, volunteerType) => {
    setLoading(true);
    try {
      // First, fetch the volunteer data to verify it exists
      const fetchUrl = `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/messages/hackathon/${eventId}/${volunteerType}`;
      const response = await fetch(fetchUrl, {
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
          "X-Org-Id": orgId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch volunteer data');
      }

      const data = await response.json();
      const volunteers = data.data || [];
      
      // Find the specific volunteer by ID
      const volunteer = volunteers.find(v => v.id === volunteerId);
      if (!volunteer) {
        throw new Error(`${volunteerType} with ID ${volunteerId} not found for event ${eventId}`);
      }

      // Update volunteer with check-in timestamp
      const updatedVolunteer = {
        ...volunteer,
        checkedInAt: new Date().toISOString(),
        checkedIn: true
      };

      // Send update to API
      const updateUrl = `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/messages/hackathon/${eventId}/${volunteerType}`;
      const updateResponse = await fetch(updateUrl, {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
          "X-Org-Id": orgId,
        },
        body: JSON.stringify(updatedVolunteer),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update volunteer check-in status');
      }

      // Add to check-in history
      const checkInRecord = {
        id: Date.now(),
        eventId,
        volunteerId,
        volunteerType,
        volunteerName: volunteer.name || 'Unknown',
        timestamp: new Date().toISOString(),
        success: true
      };

      setCheckInHistory(prev => [checkInRecord, ...prev.slice(0, 9)]); // Keep last 10 records

      setSnackbar({
        open: true,
        message: `Successfully checked in ${volunteer.name || 'volunteer'}`,
        severity: "success",
      });

      // Refresh check-in counts after successful check-in
      if (selectedEventId) {
        fetchCheckInCounts(selectedEventId);
      }

    } catch (error) {
      console.error('Check-in error:', error);
      
      // Add failed attempt to history
      const failedRecord = {
        id: Date.now(),
        eventId,
        volunteerId,
        volunteerType,
        timestamp: new Date().toISOString(),
        success: false,
        error: error.message
      };

      setCheckInHistory(prev => [failedRecord, ...prev.slice(0, 9)]);

      setSnackbar({
        open: true,
        message: `Check-in failed: ${error.message}`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [accessToken, orgId, selectedEventId, fetchCheckInCounts]);

  const handleScan = useCallback(async (data) => {
    if (data && data.text && data.text !== lastScanned) {
      setLastScanned(data.text);
      setScanning(false);
      
      try {
        // Parse QR code data
        // Expected format: eventId|volunteerId|volunteerType
        const parts = data.text.split('|');
        if (parts.length !== 3) {
          throw new Error('Invalid QR code format. Expected: eventId|volunteerId|volunteerType');
        }

        const [eventId, volunteerId, volunteerType] = parts;
        
        // Validate the data
        if (!eventId || !volunteerId || !volunteerType) {
          throw new Error('Missing required information in QR code');
        }

        const validTypes = ['mentor', 'judge', 'volunteer', 'hacker', 'sponsor'];
        if (!validTypes.includes(volunteerType)) {
          throw new Error(`Invalid volunteer type: ${volunteerType}`);
        }

        setScanResult({
          eventId,
          volunteerId,
          volunteerType,
          timestamp: new Date().toISOString(),
          success: true
        });

        // Process check-in
        await processCheckIn(eventId, volunteerId, volunteerType);

      } catch (error) {
        console.error('QR code processing error:', error);
        setScanResult({
          error: error.message,
          timestamp: new Date().toISOString(),
          success: false
        });
        setSnackbar({
          open: true,
          message: `Check-in failed: ${error.message}`,
          severity: "error",
        });
      }
    }
  }, [lastScanned, processCheckIn]);

  const handleError = useCallback((err) => {
    console.error('QR Scanner error:', err);
    setSnackbar({
      open: true,
      message: "Camera error. Please check camera permissions and try again.",
      severity: "error",
    });
  }, []);

  const startScanning = () => {
    setScanning(true);
    setScanResult(null);
    setLastScanned(null);
  };

  const stopScanning = () => {
    setScanning(false);
  };

  const switchCamera = () => {
    setFacingMode(facingMode === 'environment' ? 'user' : 'environment');
  };

  const handleManualCheckIn = async () => {
    if (!manualEventId || !manualVolunteerId || !manualVolunteerType) {
      setSnackbar({
        open: true,
        message: "Please fill in all fields",
        severity: "error",
      });
      return;
    }

    await processCheckIn(manualEventId, manualVolunteerId, manualVolunteerType);
    setManualEntryOpen(false);
    setManualEventId("");
    setManualVolunteerId("");
    setManualVolunteerType("");
  };

  const handleViewVolunteer = (eventId, volunteerId, volunteerType) => {
    // Navigate to volunteer admin with this specific volunteer
    const url = `/admin/volunteer?event_id=${eventId}&volunteer_id=${volunteerId}&volunteer_type=${volunteerType}`;
    router.push(url);
  };

  if (!isAdmin) {
    return (
      <AdminPage title="Check-In System" isAdmin={false}>
        <Typography>You do not have permission to view this page.</Typography>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      title="QR Code Check-In System"
      isAdmin={isAdmin}
      snackbar={snackbar}
      onSnackbarClose={() => setSnackbar({ ...snackbar, open: false })}
    >
      {/* Event Selection and Check-in Counts */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="hackathon-select-label">
                Hackathon Event
              </InputLabel>
              <Select
                labelId="hackathon-select-label"
                id="hackathon-select"
                value={selectedEventId || ""}
                label="Hackathon Event"
                onChange={(e) => handleEventChange(e.target.value)}
              >
                {Array.isArray(hackathons) &&
                  hackathons
                    .filter(hackathon => hackathon?.event_id)
                    .map((hackathon) => (
                      <MenuItem
                        key={hackathon.event_id}
                        value={hackathon.event_id}
                      >
                        {hackathon.title || hackathon.event_id}
                      </MenuItem>
                    ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={8}>
            {selectedEventId && (
              <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.paper' }}>
                <Typography variant="h6" gutterBottom>
                  Real-time Check-in Counts
                </Typography>
                <Grid container spacing={2}>
                  {[
                    { key: 'mentor', label: 'Mentors', color: 'primary' },
                    { key: 'judge', label: 'Judges', color: 'secondary' },
                    { key: 'volunteer', label: 'Volunteers', color: 'success' },
                    { key: 'hacker', label: 'Hackers', color: 'info' },
                    { key: 'sponsor', label: 'Sponsors', color: 'warning' }
                  ].map(({ key, label, color }) => (
                    <Grid item xs={6} sm={4} md={2.4} key={key}>
                      <Card sx={{ textAlign: 'center', minHeight: 80 }}>
                        <CardContent sx={{ pb: 1, '&:last-child': { pb: 1 } }}>
                          <Typography variant="h4" color={`${color}.main`} fontWeight="bold">
                            {checkInCounts[key]}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {label}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  Updates every 7 seconds
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={3}>
        {/* Scanner Section */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <QrCodeScannerIcon sx={{ mr: 1 }} />
              <Typography variant="h5">QR Code Scanner</Typography>
            </Box>
            
            {!scanning ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  Scan volunteer QR codes to check them in for hackathon events
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<QrCodeScannerIcon />}
                  onClick={startScanning}
                  sx={{ mr: 2, mb: 2 }}
                >
                  Start Scanning
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => setManualEntryOpen(true)}
                  sx={{ mb: 2 }}
                >
                  Manual Entry
                </Button>
              </Box>
            ) : (
              <Box>
                <Box sx={{ position: 'relative', mb: 2 }}>
                  <QrScanner
                    delay={300}
                    style={{ 
                      width: '100%', 
                      maxWidth: '500px',
                      height: 'auto'
                    }}
                    onError={handleError}
                    onScan={handleScan}
                    constraints={{
                      audio: false,
                      video: { facingMode: facingMode }
                    }}
                  />
                  {loading && (
                    <Box 
                      sx={{ 
                        position: 'absolute', 
                        top: '50%', 
                        left: '50%', 
                        transform: 'translate(-50%, -50%)',
                        bgcolor: 'rgba(0,0,0,0.7)',
                        borderRadius: 2,
                        p: 2
                      }}
                    >
                      <CircularProgress color="primary" />
                    </Box>
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button variant="contained" color="secondary" onClick={stopScanning}>
                    Stop Scanning
                  </Button>
                  <Button variant="outlined" onClick={switchCamera}>
                    Switch Camera ({facingMode === 'environment' ? 'Back' : 'Front'})
                  </Button>
                </Box>
              </Box>
            )}

            {/* Last Scan Result */}
            {scanResult && (
              <Alert 
                severity={scanResult.success ? "success" : "error"} 
                sx={{ mt: 2 }}
                icon={scanResult.success ? <CheckCircleIcon /> : <ErrorIcon />}
              >
                {scanResult.success ? (
                  <Box>
                    <Typography variant="body2">
                      <strong>Successfully scanned:</strong>
                    </Typography>
                    <Typography variant="body2">
                      Event: {scanResult.eventId}<br/>
                      Volunteer Type: {scanResult.volunteerType}<br/>
                      ID: {scanResult.volunteerId}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2">
                    <strong>Scan Error:</strong> {scanResult.error}
                  </Typography>
                )}
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Check-In History */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PersonIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Recent Check-Ins</Typography>
            </Box>
            
            {checkInHistory.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                No check-ins yet today
              </Typography>
            ) : (
              <Box sx={{ maxHeight: '600px', overflowY: 'auto' }}>
                {checkInHistory.map((record) => (
                  <Card key={record.id} sx={{ mb: 1, cursor: 'pointer' }} 
                        onClick={() => record.success && handleViewVolunteer(record.eventId, record.volunteerId, record.volunteerType)}>
                    <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Chip
                          size="small"
                          icon={record.success ? <CheckCircleIcon /> : <ErrorIcon />}
                          label={record.success ? "Success" : "Failed"}
                          color={record.success ? "success" : "error"}
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="caption" color="textSecondary">
                          {new Date(record.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {record.volunteerName || 'Unknown'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {record.eventId} • {record.volunteerType}
                        {record.success && ' • Click to view'}
                      </Typography>
                      
                      {!record.success && record.error && (
                        <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 0.5 }}>
                          {record.error}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Manual Entry Dialog */}
      <Dialog open={manualEntryOpen} onClose={() => setManualEntryOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Manual Check-In Entry</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Event ID"
              value={manualEventId}
              onChange={(e) => setManualEventId(e.target.value)}
              placeholder="e.g., 2025_fall"
            />
            <TextField
              fullWidth
              label="Volunteer ID"
              value={manualVolunteerId}
              onChange={(e) => setManualVolunteerId(e.target.value)}
              placeholder="e.g., 12345"
            />
            <TextField
              fullWidth
              label="Volunteer Type"
              value={manualVolunteerType}
              onChange={(e) => setManualVolunteerType(e.target.value)}
              placeholder="mentor, judge, volunteer, hacker, or sponsor"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManualEntryOpen(false)}>Cancel</Button>
          <Button onClick={handleManualCheckIn} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : "Check In"}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminPage>
  );
});

export default AdminCheckInPage;