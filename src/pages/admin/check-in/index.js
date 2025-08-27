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
} from "@mui/material";
import QrScanner from 'react-qr-scanner';
import AdminPage from "../../../components/admin/AdminPage";
import { useRouter } from "next/router";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import PersonIcon from '@mui/icons-material/Person';

const AdminCheckInPage = withRequiredAuthInfo(({ userClass }) => {
  const { accessToken } = useAuthInfo();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  
  // Authentication
  const org = userClass.getOrgByName("Opportunity Hack Org");
  const orgId = org.orgId;
  const isAdmin = org.hasPermission("volunteer.admin");

  // State
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
  }, [lastScanned]);

  const handleError = useCallback((err) => {
    console.error('QR Scanner error:', err);
    setSnackbar({
      open: true,
      message: "Camera error. Please check camera permissions and try again.",
      severity: "error",
    });
  }, []);

  const processCheckIn = async (eventId, volunteerId, volunteerType) => {
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