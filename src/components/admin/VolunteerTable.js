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
  "& .MuiTable-root": {
    minWidth: "100%",
    tableLayout: "fixed", // Enable fixed layout for better control
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
        ...baseColumns,
        { id: "volunteerType", label: "Vol. Type", minWidth: 90 }, // Reduced from 150, shorter label
        { id: "artifacts", label: "Contrib.", minWidth: 100, priority: 2 }, // Reduced from 200, shorter label
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
            <CheckCircleIcon color="success" fontSize="small" />
          </Tooltip>
        ) : (
          <Tooltip title="Not Selected">
            <CancelIcon color="error" fontSize="small" />
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
            <FaSlack size={14} color="#4A154B" />
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
        <Typography variant="subtitle1" sx={{ fontSize: '0.95rem' }}>
          {type}: {volunteers.length} | Selected: {selectedCount}
        </Typography>
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
              {columns.map((column) => (
                <StyledTableCell
                  key={column.id}
                  style={{ 
                    minWidth: column.minWidth,
                    display: column.priority === 3 ? { xs: 'none', lg: 'table-cell' } : 
                             column.priority === 2 ? { xs: 'none', md: 'table-cell' } : 'table-cell'
                  }}
                >
                  <TableSortLabel
                    active={orderBy === column.id}
                    direction={orderBy === column.id ? order : "asc"}
                    onClick={() => onRequestSort(column.id)}
                  >
                    <Typography variant="caption" fontWeight="bold">
                      {column.label}
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
              ))}
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
                {columns.map((column) => (
                  <StyledTableCell 
                    key={column.id} 
                    data-label={column.label}
                    style={{ 
                      display: column.priority === 3 ? { xs: 'none', lg: 'table-cell' } : 
                               column.priority === 2 ? { xs: 'none', md: 'table-cell' } : 'table-cell'
                    }}
                  >
                    {renderCellContent(volunteer, column)}
                  </StyledTableCell>
                ))}
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