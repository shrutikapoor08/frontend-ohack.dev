import React, { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Button,
  Avatar,
  Typography,
  Chip,
  Tooltip,
  Box,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import { styled } from "@mui/system";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import EditIcon from "@mui/icons-material/Edit";
import { Email as EmailIcon } from '@mui/icons-material';
import { FaPaperPlane, FaSlack } from 'react-icons/fa';

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  width: "100%",
  overflowX: "auto",
  overflowY: "visible",
  maxWidth: "100vw", // Ensure it doesn't exceed viewport
  "& .MuiTable-root": {
    minWidth: 800, // Minimum width to force horizontal scroll when needed
    tableLayout: "auto", // Allow flexible column sizing
    whiteSpace: "nowrap", // Prevent text wrapping in cells
  },
  // Ensure scrollbar is visible
  "&::-webkit-scrollbar": {
    height: 8,
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: theme.palette.grey[200],
    borderRadius: 4,
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.grey[400],
    borderRadius: 4,
    "&:hover": {
      backgroundColor: theme.palette.grey[600],
    },
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(0.5, 1), // Reduced padding
  fontSize: "0.875rem", // Smaller font size
  overflow: "hidden", // Prevent overflow
  textOverflow: "ellipsis", // Add ellipsis for long text
  whiteSpace: "nowrap", // Prevent text wrapping by default
  [theme.breakpoints.down("md")]: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    borderBottom: "none",
    padding: theme.spacing(0.5, 1),
    whiteSpace: "normal", // Allow wrapping on mobile
    "&:before": {
      content: "attr(data-label)",
      fontWeight: "bold",
      marginBottom: theme.spacing(0.5),
      fontSize: "0.75rem",
    },
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  [theme.breakpoints.down("md")]: {
    display: "flex",
    flexDirection: "column",
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}));

const SelectedChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.success.main,
  color: theme.palette.common.white,
}));

const NotSelectedChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.error.main,
  color: theme.palette.common.white,
}));

const StatusChip = styled(Chip)(({ theme, statustype }) => {
  const getStatusColors = (status) => {
    switch (status) {
      case 'pending':
        return { backgroundColor: theme.palette.grey[500], color: theme.palette.common.white };
      case 'approved':
        return { backgroundColor: theme.palette.success.main, color: theme.palette.common.white };
      case 'denied':
        return { backgroundColor: theme.palette.error.main, color: theme.palette.common.white };
      case 'verified_travel':
        return { backgroundColor: theme.palette.info.main, color: theme.palette.common.white };
      case 'confirmed':
        return { backgroundColor: theme.palette.primary.main, color: theme.palette.common.white };
      case 'withdrew':
        return { backgroundColor: theme.palette.warning.main, color: theme.palette.common.white };
      case 'no_show':
        return { backgroundColor: theme.palette.error.dark, color: theme.palette.common.white };
      default:
        return { backgroundColor: theme.palette.grey[300], color: theme.palette.text.primary };
    }
  };
  
  return getStatusColors(statustype);
});

const ClickableCell = styled(Typography)(({ theme }) => ({
  cursor: 'pointer',
  display: 'block',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  padding: theme.spacing(0.25, 0.5),
  borderRadius: theme.spacing(0.5),
  transition: 'background-color 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:active': {
    backgroundColor: theme.palette.action.selected,
  },
}));

const VolunteerTable = ({
  volunteers,
  type,
  orderBy,
  order,
  onRequestSort,
  onEditVolunteer,
  onMessageVolunteer,
  onSlackInvite,
  onBatchEmail,
  onBatchEmailNotSelected,
}) => {
  const [copyFeedback, setCopyFeedback] = useState({ open: false, message: '' });

  const handleCopyToClipboard = async (text, fieldName) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      
      setCopyFeedback({ 
        open: true, 
        message: `${fieldName} copied: ${text.length > 30 ? text.substring(0, 30) + '...' : text}` 
      });
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setCopyFeedback({ 
        open: true, 
        message: `Failed to copy ${fieldName}` 
      });
    }
  };

  const handleCloseFeedback = () => {
    setCopyFeedback({ open: false, message: '' });
  };

  const columns = useMemo(() => {
    const baseColumns = [
      { id: "id", label: "ID", minWidth: 60 }, // Reduced from 100
      { id: "name", label: "Name", minWidth: 100 }, // Reduced from 120
      { id: "messages_sent", label: "Msgs", minWidth: 20 }, // Reduced from 120, shorter label
      { id: "email", label: "Email", minWidth: 140, priority: 2 }, // Increased from 100 to prevent overlap
      { id: "pronouns", label: "Pronouns", minWidth: 80, priority: 3 }, // Increased from 70 for better spacing
      { id: "company", label: "Company", minWidth: 90, priority: 2 }, // Reduced from 120
      { id: "isInPerson", label: "In Person", minWidth: 70 }, // Reduced from 100
      { id: "isSelected", label: "Selected", minWidth: 80 }, // Reduced from 100
      { id: "slack_user_id", label: "Slack", minWidth: 40, priority: 3 }, // Reduced from 50
    ];

    if (type === "mentors") {
      return [
        ...baseColumns,
        { id: "expertise", label: "Expertise", minWidth: 120, priority: 2 }, // Reduced from 150
        { id: "country", label: "Country", minWidth: 70, priority: 3 }, // Reduced from 100
        { id: "state", label: "State", minWidth: 60, priority: 3 }, // Reduced from 100
      ];
    } else if (type === "judges") {
      return [
        ...baseColumns,
        { id: "status", label: "Status", minWidth: 90 }, // Reduced from 120
        { id: "title", label: "Title", minWidth: 100, priority: 2 }, // Reduced from 150
        { id: "background", label: "Background", minWidth: 120, priority: 3 }, // Reduced from 150
      ];
    } else if (type === "volunteers") {
      return [
        { id: "id", label: "ID", minWidth: 50, priority: 3 },
        { id: "name", label: "Name", minWidth: 100 },
        { id: "messages_sent", label: "Msgs", minWidth: 20, priority: 3 },
        { id: "email", label: "Email", minWidth: 120, priority: 2 },
        { id: "experienceLevel", label: "Experience", minWidth: 90 },
        { id: "availability", label: "Availability", minWidth: 130 }, // Always visible - this is the key column
        { id: "title", label: "Title", minWidth: 90, priority: 2 },
        { id: "company", label: "Company", minWidth: 90, priority: 2 },
        { id: "socialCauses", label: "Causes", minWidth: 100, priority: 3 },
        { id: "availableDays", label: "Time Slots", minWidth: 100, priority: 3 },
        { id: "isInPerson", label: "In Person", minWidth: 70, priority: 2 },
        { id: "isSelected", label: "Selected", minWidth: 80 },
        { id: "pronouns", label: "Pronouns", minWidth: 80, priority: 3 },
        { id: "slack_user_id", label: "Slack", minWidth: 40, priority: 3 },
        { id: "artifacts", label: "Contrib.", minWidth: 100, priority: 3 },
      ];
    } else if (type === "hackers") {
      return [
        ...baseColumns,
        { id: "participantType", label: "Type", minWidth: 80 }, // Reduced from 120, shorter label
        { id: "experienceLevel", label: "Exp.", minWidth: 60 }, // Reduced from 120, shorter label
        { id: "teamStatus", label: "Team", minWidth: 80 }, // Reduced from 120, shorter label
        { id: "primaryRoles", label: "Roles", minWidth: 100, priority: 2 }, // Reduced from 150
      ];
    } else if (type === "sponsors") {
      return [
        ...baseColumns,
        { id: "sponsorshipTypes", label: "Sponsorship", minWidth: 100 },
        { id: "title", label: "Title", minWidth: 90 },
        { id: "volunteerType", label: "Vol. Type", minWidth: 90 },
        { id: "volunteerCount", label: "Vol. Count", minWidth: 70 },
        { id: "volunteerHours", label: "Vol. Hours", minWidth: 70 },
        { id: "phoneNumber", label: "Phone", minWidth: 100, priority: 2 },
        { id: "preferredContact", label: "Pref. Contact", minWidth: 80, priority: 3 },
        { id: "useLogo", label: "Use Logo", minWidth: 70, priority: 3 },
      ];
    }

    return baseColumns;
  }, [type]);

  const selectedCount = useMemo(() => {
    return volunteers.filter((volunteer) => volunteer.isSelected).length;
  }, [volunteers]);

  const eligibleForSlackCount = useMemo(() => {
    return volunteers.filter((volunteer) => 
      volunteer.isSelected && volunteer.slack_user_id && volunteer.slack_user_id.trim() !== ''
    ).length;
  }, [volunteers]);

  const eligibleForEmailCount = useMemo(() => {
    return volunteers.filter((volunteer) => 
      volunteer.isSelected && volunteer.email && volunteer.email.trim() !== '' && volunteer.id
    ).length;
  }, [volunteers]);

  const notSelectedForEmailCount = useMemo(() => {
    return volunteers.filter((volunteer) => 
      !volunteer.isSelected && volunteer.email && volunteer.email.trim() !== '' && volunteer.id
    ).length;
  }, [volunteers]);

  const renderCellContent = (volunteer, column) => {
    switch (column.id) {
      case "id":
        const id = volunteer.id || "N/A";
        return (
          <Tooltip title="Click to copy ID">
            <ClickableCell
              variant="caption"
              onClick={() => handleCopyToClipboard(id, 'ID')}
            >
              {id}
            </ClickableCell>
          </Tooltip>
        );
      case "name":
        const name = volunteer.name || "";
        return (
          <Tooltip title="Click to copy name">
            <ClickableCell
              variant="caption"
              onClick={() => handleCopyToClipboard(name, 'Name')}
              sx={{ maxWidth: '90px' }}
            >
              {name}
            </ClickableCell>
          </Tooltip>
        );
      case "email":
        const email = volunteer.email || "";
        const displayEmail = email.length > 25;
        return (
          <Tooltip title={displayEmail ? `${email} (Click to copy)` : "Click to copy email"}>
            <ClickableCell
              variant="caption" 
              onClick={() => handleCopyToClipboard(email, 'Email')}
              sx={{ maxWidth: '130px' }}
            >
              {email}
            </ClickableCell>
          </Tooltip>
        );
      case "pronouns":
        const pronouns = volunteer.pronouns || "";
        return (
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '70px'
            }}
          >
            {pronouns}
          </Typography>
        );
      case "isInPerson":
        return volunteer[column.id] ? (
          <Chip label="Yes" size="small" color="success" sx={{ minWidth: 45, fontSize: '0.75rem' }} />
        ) : (
          <Chip label="No" size="small" color="default" sx={{ minWidth: 45, fontSize: '0.75rem' }} />
        );
      case "isSelected":
        return volunteer[column.id] ? (
          <Tooltip title="Selected">
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
              <CheckCircleIcon color="success" fontSize="small" />
            </Box>
          </Tooltip>
        ) : (
          <Tooltip title="Not Selected">
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
              <CancelIcon color="error" fontSize="small" />
            </Box>
          </Tooltip>
        );
      case "status":
        const status = volunteer.status || "pending";
        const statusLabels = {
          pending: "Pending",
          approved: "Approved",
          denied: "Denied",
          verified_travel: "Verified",
          confirmed: "Confirmed",
          withdrew: "Withdrew",
          no_show: "No Show",
        };
        return (
          <StatusChip
            statustype={status}
            label={statusLabels[status] || status}
            size="small"
            sx={{ fontSize: '0.7rem', minWidth: 60 }}
          />
        );
      case "messages_sent":
        const messageCount = Array.isArray(volunteer.messages_sent) 
          ? volunteer.messages_sent.length 
          : 0;
        
        if (messageCount === 0) {
          return (
            <Chip 
              label="0" 
              size="small" 
              variant="outlined"
              sx={{ minWidth: 32, fontSize: '0.75rem' }}
            />
          );
        }

        const tooltipContent = (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Recent Messages ({messageCount})
            </Typography>
            {volunteer.messages_sent.slice(0, 5).map((message, idx) => (
              <Box key={idx} sx={{ mb: 1, pb: 1, borderBottom: idx < Math.min(4, messageCount - 1) ? '1px solid rgba(255,255,255,0.2)' : 'none' }}>
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold' }}>
                  {new Date(message.timestamp).toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                  Subject: {message.subject}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  Sent by: {message.sent_by}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                  {message.delivery_status.email_sent && (
                    <Chip label="Email ✓" size="small" sx={{ fontSize: '0.6rem', height: '16px' }} color="success" />
                  )}
                  {message.delivery_status.slack_sent && (
                    <Chip label="Slack ✓" size="small" sx={{ fontSize: '0.6rem', height: '16px' }} color="info" />
                  )}
                  {message.delivery_status.email_error && (
                    <Chip label="Email ✗" size="small" sx={{ fontSize: '0.6rem', height: '16px' }} color="error" />
                  )}
                  {message.delivery_status.slack_error && (
                    <Chip label="Slack ✗" size="small" sx={{ fontSize: '0.6rem', height: '16px' }} color="error" />
                  )}
                </Box>
              </Box>
            ))}
            {messageCount > 5 && (
              <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                ...and {messageCount - 5} more messages
              </Typography>
            )}
          </Box>
        );

        return (
          <Tooltip 
            title={tooltipContent} 
            arrow 
            placement="bottom-start"
            componentsProps={{
              tooltip: {
                sx: {
                  maxWidth: 400,
                  '& .MuiTooltip-arrow': {
                    color: 'rgba(97, 97, 97, 0.9)',
                  },
                },
              },
            }}
          >
            <Chip 
              label={messageCount} 
              size="small" 
              variant="outlined"
              color="primary"
              sx={{ cursor: 'pointer', minWidth: 32, fontSize: '0.75rem' }}
            />
          </Tooltip>
        );
      case "slack_user_id":
        return volunteer.slack_user_id && volunteer.slack_user_id.trim() !== '' ? (
          <Tooltip title="Has Slack ID">
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
              <FaSlack size={14} color="#4A154B" />
            </Box>
          </Tooltip>
        ) : (
          <Tooltip title="No Slack ID">
            <Box sx={{ width: 14, height: 14, backgroundColor: '#ccc', borderRadius: '50%' }} />
          </Tooltip>
        );
      case "artifacts":
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {volunteer.artifacts?.slice(0, 3).map((artifact, index) => (
              <Tooltip key={index} title={artifact.comment}>
                <Chip 
                  label={artifact.label} 
                  size="small" 
                  sx={{ fontSize: '0.65rem', height: 20 }}
                />
              </Tooltip>
            ))}
            {volunteer.artifacts?.length > 3 && (
              <Chip 
                label={`+${volunteer.artifacts.length - 3}`} 
                size="small" 
                variant="outlined"
                sx={{ fontSize: '0.65rem', height: 20 }}
              />
            )}
          </Box>
        );
      case "phoneNumber":
        const phone = volunteer.phoneNumber || "";
        return (
          <Tooltip title="Click to copy phone number">
            <ClickableCell
              variant="caption"
              onClick={() => handleCopyToClipboard(phone, 'Phone Number')}
              sx={{ maxWidth: '90px' }}
            >
              {phone}
            </ClickableCell>
          </Tooltip>
        );
      case "preferredContact":
        const contact = volunteer.preferredContact || "";
        return (
          <Chip 
            label={contact} 
            size="small" 
            color={contact === 'email' ? 'primary' : contact === 'phone' ? 'secondary' : 'default'}
            sx={{ fontSize: '0.7rem', minWidth: 60 }}
          />
        );
      case "useLogo":
        const logoUsage = volunteer.useLogo || "";
        return (
          <Chip 
            label={logoUsage} 
            size="small" 
            color={logoUsage === 'Yes' ? 'success' : logoUsage === 'No' ? 'error' : 'warning'}
            sx={{ fontSize: '0.7rem', minWidth: 45 }}
          />
        );
      case "volunteerType":
        const volType = volunteer.volunteerType || "";
        return (
          <Tooltip title={volType}>
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '80px'
              }}
            >
              {volType}
            </Typography>
          </Tooltip>
        );
      case "volunteerCount":
        const count = volunteer.volunteerCount || "0";
        return (
          <Chip 
            label={count} 
            size="small" 
            variant="outlined"
            color="primary"
            sx={{ fontSize: '0.75rem', minWidth: 32 }}
          />
        );
      case "volunteerHours":
        const hours = volunteer.volunteerHours || "0";
        return (
          <Chip 
            label={`${hours}h`} 
            size="small" 
            variant="outlined"
            color="secondary"
            sx={{ fontSize: '0.75rem', minWidth: 40 }}
          />
        );
      case "sponsorshipTypes":
        const sponsorship = volunteer.sponsorshipTypes || volunteer.sponsorshipTier || volunteer.sponsorshipLevel || "";
        return (
          <Tooltip title={sponsorship}>
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '90px',
                fontWeight: 500
              }}
            >
              {sponsorship}
            </Typography>
          </Tooltip>
        );
      case "experienceLevel":
        const expLevel = volunteer.experienceLevel || "";
        const expColor = expLevel.includes('First time') ? 'info' : 
                        expLevel.includes('Some experience') ? 'warning' :
                        expLevel.includes('Experienced') ? 'success' : 'default';
        const expLabel = expLevel.includes('First time') ? 'First Timer' :
                        expLevel.includes('Some experience') ? 'Experienced' :
                        expLevel.includes('Experienced volunteer') ? 'Expert' : 
                        expLevel.substring(0, 8) + (expLevel.length > 8 ? '...' : '');
        return (
          <Tooltip title={expLevel}>
            <Chip 
              label={expLabel} 
              size="small" 
              color={expColor}
              sx={{ fontSize: '0.7rem', minWidth: 60 }}
            />
          </Tooltip>
        );
      case "socialCauses":
        const causes = volunteer.socialCauses || volunteer.otherSocialCause || "";
        const causesList = causes.split(',').map(c => c.trim()).filter(c => c);
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {causesList.slice(0, 2).map((cause, index) => (
              <Chip 
                key={index}
                label={cause.length > 10 ? cause.substring(0, 10) + '...' : cause} 
                size="small" 
                variant="outlined"
                color="primary"
                sx={{ fontSize: '0.65rem', height: 20 }}
              />
            ))}
            {causesList.length > 2 && (
              <Tooltip title={causesList.slice(2).join(', ')}>
                <Chip 
                  label={`+${causesList.length - 2}`} 
                  size="small" 
                  variant="outlined"
                  sx={{ fontSize: '0.65rem', height: 20 }}
                />
              </Tooltip>
            )}
          </Box>
        );
      case "availability":
        const availability = volunteer.availability || "";
        if (!availability) return <Typography variant="caption">No availability</Typography>;
        
        // Parse availability into structured data
        const parseAvailability = (availStr) => {
          if (!availStr) return [];
          
          const slots = availStr.split(',').map(s => s.trim()).filter(s => s);
          const parsed = [];
          
          slots.forEach(slot => {
            // More flexible regex patterns
            const dayMatch = slot.match(/(Saturday|Sunday)[,\s]+(\w+\s+\d+)/);
            const timeMatch = slot.match(/\(([^)]+)\)/);
            const roleMatch = slot.match(/(📸|🧹|🏆|📋|🔧)/);
            const roleNameMatch = slot.match(/(?:📸|🧹|🏆|📋|🔧)\s*([^(]+)/);
            
            if (dayMatch && timeMatch) {
              const [, dayName, date] = dayMatch;
              const timeRange = timeMatch[1];
              const roleIcon = roleMatch ? roleMatch[1] : '👥';
              const roleName = roleNameMatch ? roleNameMatch[1].trim() : 'General';
              
              // Parse start and end times - more robust parsing
              const [startStr, endStr] = timeRange.split(' - ');
              const parseTime = (timeStr) => {
                if (!timeStr) return 0;
                
                // Handle different time formats: 2:30pm, 12:00pm, 11:30pm, etc.
                let match = timeStr.trim().match(/(\d{1,2}):(\d{2})(am|pm)/i);
                if (!match) {
                  // Try without minutes (e.g., "2pm")
                  match = timeStr.trim().match(/(\d{1,2})(am|pm)/i);
                  if (match) {
                    match = [match[0], match[1], '00', match[2]]; // Add 00 minutes
                  }
                }
                
                if (!match) {
                  return 0;
                }
                
                let [, hours, minutes, ampm] = match;
                hours = parseInt(hours);
                minutes = parseInt(minutes);
                ampm = ampm.toLowerCase();
                
                if (ampm === 'pm' && hours !== 12) hours += 12;
                if (ampm === 'am' && hours === 12) hours = 0;
                
                const totalMinutes = hours * 60 + minutes;
                return totalMinutes;
              };
              
              const startTime = parseTime(startStr);
              const endTime = parseTime(endStr);
              
              if (startTime >= 0 && endTime > startTime) {
                parsed.push({
                  day: dayName,
                  date,
                  startTime,
                  endTime,
                  timeRange,
                  roleIcon,
                  roleName: roleName.replace(/^\w+\s*-\s*/, '') // Remove session prefix
                });
              }
            }
          });
          
          return parsed;
        };
        
        const slots = parseAvailability(availability);
        const saturdaySlots = slots.filter(s => s.day === 'Saturday').sort((a, b) => a.startTime - b.startTime);
        const sundaySlots = slots.filter(s => s.day === 'Sunday').sort((a, b) => a.startTime - b.startTime);
        
        // Create timeline visualization
        const createDayTimeline = (daySlots, dayName) => {
          if (daySlots.length === 0) return null;
          
          const minTime = Math.min(...daySlots.map(s => s.startTime));
          const maxTime = Math.max(...daySlots.map(s => s.endTime));
          const totalMinutes = maxTime - minTime;
          
          // Group overlapping slots
          const timelineHeight = 20;
          const roleColors = {
            '📸': '#2196f3', // Blue for Photography
            '🧹': '#4caf50', // Green for Cleanup
            '🏆': '#ff9800', // Orange for Judging
            '📋': '#9c27b0', // Purple for Registration
            '🔧': '#f44336', // Red for Setup
            '👥': '#757575'  // Gray for General
          };
          
          return (
            <Box sx={{ mb: 0.5 }}>
              <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600, display: 'block' }}>
                {dayName.substring(0, 3)}
              </Typography>
              <Box sx={{ position: 'relative', height: timelineHeight, bgcolor: 'grey.100', borderRadius: 1 }}>
                {daySlots.map((slot, idx) => {
                  const left = ((slot.startTime - minTime) / totalMinutes) * 100;
                  const width = ((slot.endTime - slot.startTime) / totalMinutes) * 100;
                  
                  return (
                    <Tooltip 
                      key={idx}
                      title={`${slot.roleIcon} ${slot.roleName} (${slot.timeRange})`}
                      arrow
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          left: `${left}%`,
                          width: `${width}%`,
                          height: '100%',
                          bgcolor: roleColors[slot.roleIcon] || roleColors['👥'],
                          borderRadius: 0.5,
                          opacity: 0.8,
                          cursor: 'pointer',
                          border: '1px solid rgba(255,255,255,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          top: `${(idx % 2) * 2}px` // Slight vertical offset for overlapping slots
                        }}
                      >
                        {slot.roleIcon}
                      </Box>
                    </Tooltip>
                  );
                })}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.25 }}>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                  {daySlots.length > 0 && (() => {
                    const hours = Math.floor(minTime / 60);
                    const minutes = minTime % 60;
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
                    return `${displayHours}:${minutes.toString().padStart(2, '0')}${ampm}`;
                  })()}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                  {daySlots.length > 0 && (() => {
                    const hours = Math.floor(maxTime / 60);
                    const minutes = maxTime % 60;
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
                    return `${displayHours}:${minutes.toString().padStart(2, '0')}${ampm}`;
                  })()}
                </Typography>
              </Box>
            </Box>
          );
        };
        
        const totalHours = slots.reduce((total, slot) => {
          return total + ((slot.endTime - slot.startTime) / 60);
        }, 0);
        
        const availabilityTooltipContent = (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Volunteer Availability ({Math.round(totalHours * 10) / 10} hours)
            </Typography>
            {saturdaySlots.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                  Saturday ({saturdaySlots.length} slots):
                </Typography>
                {saturdaySlots.map((slot, idx) => (
                  <Typography key={idx} variant="caption" sx={{ display: 'block', fontSize: '0.75rem' }}>
                    • {slot.roleIcon} {slot.roleName} ({slot.timeRange})
                  </Typography>
                ))}
              </Box>
            )}
            {sundaySlots.length > 0 && (
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                  Sunday ({sundaySlots.length} slots):
                </Typography>
                {sundaySlots.map((slot, idx) => (
                  <Typography key={idx} variant="caption" sx={{ display: 'block', fontSize: '0.75rem' }}>
                    • {slot.roleIcon} {slot.roleName} ({slot.timeRange})
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
        );
        
        return (
          <Tooltip 
            title={availabilityTooltipContent}
            arrow
            placement="bottom-start"
            componentsProps={{
              tooltip: {
                sx: {
                  maxWidth: 350,
                  '& .MuiTooltip-arrow': {
                    color: 'rgba(97, 97, 97, 0.9)',
                  },
                },
              },
            }}
          >
            <Box sx={{ minWidth: 110, cursor: 'pointer' }}>
              {createDayTimeline(saturdaySlots, 'Saturday')}
              {createDayTimeline(sundaySlots, 'Sunday')}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
                <Chip 
                  label={`${Math.round(totalHours * 10) / 10}h`} 
                  size="small" 
                  variant="outlined"
                  color="primary"
                  sx={{ fontSize: '0.7rem', height: 18 }}
                />
              </Box>
            </Box>
          </Tooltip>
        );
      case "availableDays":
        const availDays = volunteer.availableDays || [];
        const roleTypes = [...new Set(availDays.map(day => {
          const parts = day.split('-');
          return parts[parts.length - 1]; // Get the role type
        }).filter(Boolean))];
        
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {roleTypes.slice(0, 3).map((role, index) => {
              const roleIcon = role === 'Photography' ? '📸' :
                              role === 'Cleanup Crew' ? '🧹' :
                              role === 'Judging Support' ? '🏆' :
                              role === 'Registration' ? '📋' :
                              role === 'Setup' ? '🔧' : '👥';
              return (
                <Tooltip key={index} title={role}>
                  <Chip 
                    label={roleIcon} 
                    size="small" 
                    sx={{ fontSize: '0.8rem', minWidth: 25 }}
                  />
                </Tooltip>
              );
            })}
            {roleTypes.length > 3 && (
              <Chip 
                label={`+${roleTypes.length - 3}`} 
                size="small" 
                variant="outlined"
                sx={{ fontSize: '0.65rem', height: 20 }}
              />
            )}
          </Box>
        );
      case "title":
        const jobTitle = volunteer.title || "";
        return (
          <Tooltip title={jobTitle}>
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '80px',
                fontWeight: 500
              }}
            >
              {jobTitle}
            </Typography>
          </Tooltip>
        );
      default:
        const value = volunteer[column.id];
        if (typeof value === 'string' && value.length > 15) {
          return (
            <Tooltip title={value}>
              <Typography 
                variant="caption" 
                sx={{ 
                  cursor: 'pointer',
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {value.substring(0, 12)}...
              </Typography>
            </Tooltip>
          );
        }
        return (
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {value}
          </Typography>
        );
    }
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontSize: '0.95rem' }}>
            {type}: {volunteers.length} | Selected: {selectedCount}
          </Typography>
          {type === 'volunteers' && (
            <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              📅 Availability column is highlighted - scroll horizontally to see all columns
            </Typography>
          )}
        </Box>
        <Box display="flex" gap={0.5} flexWrap="wrap">
          {onBatchEmail && eligibleForEmailCount > 0 && (
            <Tooltip title={`Send Email to ${eligibleForEmailCount} selected`}>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => onBatchEmail(volunteers, type, true)}
                size="small"
                sx={{ minWidth: 'auto', px: 1 }}
              >
                <EmailIcon fontSize="small" />
                <Typography variant="caption" sx={{ ml: 0.5 }}>
                  {eligibleForEmailCount}
                </Typography>
              </Button>
            </Tooltip>
          )}
          {onSlackInvite && eligibleForSlackCount > 0 && (
            <Tooltip title={`Invite ${eligibleForSlackCount} to Slack`}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => onSlackInvite(volunteers, type)}
                size="small"
                sx={{ minWidth: 'auto', px: 1 }}
              >
                <FaSlack size={14} />
                <Typography variant="caption" sx={{ ml: 0.5 }}>
                  {eligibleForSlackCount}
                </Typography>
              </Button>
            </Tooltip>
          )}
          {onBatchEmailNotSelected && notSelectedForEmailCount > 0 && (
            <Tooltip title={`Send rejection email to ${notSelectedForEmailCount}`}>
              <Button
                variant="outlined"
                color="warning"
                onClick={() => onBatchEmailNotSelected(volunteers, type, false)}
                size="small"
                sx={{ minWidth: 'auto', px: 1 }}
              >
                <EmailIcon fontSize="small" />
                <Typography variant="caption" sx={{ ml: 0.5 }}>
                  {notSelectedForEmailCount}
                </Typography>
              </Button>
            </Tooltip>
          )}
        </Box>
      </Box>
      <StyledTableContainer component={Paper}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <StyledTableCell style={{ width: 40 }}>#</StyledTableCell>
              <StyledTableCell style={{ width: 50 }}>
                <Tooltip title="Photo">
                  <Avatar sx={{ width: 24, height: 24 }} />
                </Tooltip>
              </StyledTableCell>
              <StyledTableCell style={{ width: 80 }}>
                Actions
              </StyledTableCell>
              {columns.map((column) => {
                // Handle responsive display
                let displayStyle = 'table-cell';
                if (column.priority === 3) {
                  displayStyle = { xs: 'none', lg: 'table-cell' };
                } else if (column.priority === 2) {
                  displayStyle = { xs: 'none', md: 'table-cell' };
                }

                return (
                  <StyledTableCell
                    key={column.id}
                    sx={{ 
                      minWidth: column.minWidth,
                      display: displayStyle,
                      // Highlight availability column
                      ...(column.id === 'availability' && {
                        backgroundColor: 'primary.light',
                        position: 'sticky',
                        left: type === 'volunteers' ? 220 : 'auto', // Stick after name column
                        zIndex: 10,
                        borderLeft: '2px solid',
                        borderLeftColor: 'primary.main',
                        borderRight: '2px solid',
                        borderRightColor: 'primary.main',
                      })
                    }}
                  >
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : "asc"}
                      onClick={() => onRequestSort(column.id)}
                      sx={{
                        ...(column.id === 'availability' && {
                          color: 'primary.contrastText',
                          fontWeight: 700,
                          '& .MuiTableSortLabel-icon': {
                            color: 'inherit !important'
                          }
                        })
                      }}
                    >
                      <Typography 
                        variant="caption" 
                        fontWeight={column.id === 'availability' ? '800' : 'bold'}
                        sx={{
                          ...(column.id === 'availability' && {
                            color: 'primary.contrastText'
                          })
                        }}
                      >
                        {column.label}
                        {column.id === 'availability' && (
                          <Chip 
                            label="📅" 
                            size="small" 
                            sx={{ 
                              ml: 0.5, 
                              height: 16, 
                              fontSize: '0.6rem',
                              backgroundColor: 'primary.main',
                              color: 'primary.contrastText',
                              '& .MuiChip-label': { px: 0.5 }
                            }} 
                          />
                        )}
                        {['id', 'name', 'email'].includes(column.id) && (
                          <Chip 
                            label="📋" 
                            size="small" 
                            sx={{ 
                              ml: 0.5, 
                              height: 16, 
                              fontSize: '0.6rem',
                              '& .MuiChip-label': { px: 0.5 }
                            }} 
                          />
                        )}
                      </Typography>
                    </TableSortLabel>
                  </StyledTableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {volunteers.map((volunteer, index) => (
              <StyledTableRow
                key={volunteer.id || `${volunteer.name}-${index}`}
                style={{
                  backgroundColor: volunteer.isSelected ? "#e8f5e9" : "inherit",
                }}
              >
                <StyledTableCell>
                  <Typography variant="caption">{index + 1}</Typography>
                </StyledTableCell>
                <StyledTableCell>
                  <Avatar
                    src={volunteer.photoUrl}
                    alt={volunteer.name}
                    key={`${volunteer.name}-${volunteer.photoUrl}`}
                    sx={{ width: 32, height: 32 }}
                  />
                </StyledTableCell>
                <StyledTableCell data-label="Actions">
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Edit">
                      <IconButton 
                        onClick={() => onEditVolunteer(volunteer)}
                        size="small"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {onMessageVolunteer && (
                      <Tooltip title="Send Message">
                        <IconButton 
                          onClick={() => onMessageVolunteer(volunteer)}
                          size="small"
                          color="primary"
                        >
                          <FaPaperPlane size={12} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </StyledTableCell>
                {columns.map((column) => {
                  // Handle responsive display
                  let displayStyle = 'table-cell';
                  if (column.priority === 3) {
                    displayStyle = { xs: 'none', lg: 'table-cell' };
                  } else if (column.priority === 2) {
                    displayStyle = { xs: 'none', md: 'table-cell' };
                  }

                  return (
                    <StyledTableCell 
                      key={column.id} 
                      data-label={column.label}
                      sx={{ 
                        display: displayStyle,
                        // Make availability column sticky and highlighted
                        ...(column.id === 'availability' && {
                          backgroundColor: 'rgba(25, 118, 210, 0.08)', // Light blue background
                          position: 'sticky',
                          left: type === 'volunteers' ? 220 : 'auto',
                          zIndex: 5,
                          borderLeft: '2px solid',
                          borderLeftColor: 'primary.main',
                          borderRight: '2px solid',
                          borderRightColor: 'primary.main',
                          fontWeight: 500,
                          '& > *': {
                            backgroundColor: 'transparent !important'
                          }
                        })
                      }}
                    >
                      {renderCellContent(volunteer, column)}
                    </StyledTableCell>
                  );
                })}
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </StyledTableContainer>
      
      <Snackbar 
        open={copyFeedback.open} 
        autoHideDuration={2000} 
        onClose={handleCloseFeedback}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseFeedback} 
          severity="success" 
          variant="filled"
          sx={{ fontSize: '0.875rem' }}
        >
          {copyFeedback.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default VolunteerTable;