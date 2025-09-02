import React, { useState } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Grid,
  Avatar,
  IconButton,
  Collapse,
  Alert,
  Link,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  LinkedIn as LinkedInIcon,
  GitHub as GitHubIcon,
  Language as WebsiteIcon,
  School as SchoolIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Gavel as StatusIcon
} from '@mui/icons-material';

const ApplicationReviewCard = ({ 
  application, 
  applicationType, 
  onApprove, 
  onReject,
  onEdit,
  isLoading = false
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleExpand = () => {
    setExpanded(!expanded);
  };

  const handleApprove = () => {
    onApprove(application);
  };

  const handleReject = () => {
    onReject(application);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(application);
    }
  };

  // Get the configuration for this application type
  const getFieldConfig = (type) => {
    const configs = {
      hacker: {
        title: 'Hacker Application',
        primaryFields: ['name', 'email', 'experienceLevel', 'primaryRoles'],
        secondaryFields: ['schoolOrganization', 'participantType', 'skills', 'teamStatus'],
        additionalFields: ['bio', 'linkedin', 'github', 'portfolio', 'motivation', 'socialCauses'],
        statusField: 'isSelected'
      },
      mentor: {
        title: 'Mentor Application',
        primaryFields: ['name', 'email', 'company', 'title'],
        secondaryFields: ['expertise', 'yearsExperience', 'mentorshipAreas'],
        additionalFields: ['bio', 'linkedin', 'availability', 'previousMentoring'],
        statusField: 'isSelected'
      },
      judge: {
        title: 'Judge Application',
        primaryFields: ['name', 'email', 'title', 'companyName', 'status'],
        secondaryFields: ['inPerson', 'canAttendJudging', 'participationCount', 'country', 'state', 'linkedinProfile', 'backgroundAreas'],
        additionalFields: ['biography', 'whyJudge', 'availability', 'additionalInfo', 'pronouns', 'otherBackground', 'photoUrl'],
        statusField: 'isSelected'
      },
      volunteer: {
        title: 'Volunteer Application',
        primaryFields: ['name', 'email', 'volunteerRole', 'availability'],
        secondaryFields: ['skills', 'previousVolunteering'],
        additionalFields: ['bio', 'linkedin', 'motivation'],
        statusField: 'isSelected'
      },
      sponsor: {
        title: 'Sponsor Application',
        primaryFields: ['companyName', 'name', 'email', 'sponsorshipTypes', 'title'],
        secondaryFields: ['volunteerType', 'volunteerCount', 'volunteerHours', 'phoneNumber', 'preferredContact', 'useLogo'],
        additionalFields: ['company', 'industry', 'employeeCount', 'bio', 'website', 'specialRequests', 'howHeard', 'otherInvolvement', 'logoUrl'],
        statusField: 'isSelected'
      }
    };
    return configs[type] || configs.hacker;
  };

  const config = getFieldConfig(applicationType);
  const isApproved = application[config.statusField];

  // Helper function to get status chip configuration
  const getStatusChipConfig = (status) => {
    const statusConfigs = {
      pending: { label: "Pending Review", color: "default", icon: null },
      approved: { label: "Approved", color: "success", icon: <CheckIcon /> },
      denied: { label: "Denied", color: "error", icon: <CloseIcon /> },
      verified_travel: { label: "Verified Travel", color: "info", icon: <StatusIcon /> },
      confirmed: { label: "Confirmed", color: "primary", icon: <CheckIcon /> },
      withdrew: { label: "Withdrew", color: "warning", icon: <CloseIcon /> },
      no_show: { label: "No Show", color: "error", icon: <CloseIcon /> },
    };
    return statusConfigs[status] || statusConfigs.pending;
  };

  // Helper function to format field values
  const formatFieldValue = (field, value) => {
    if (!value) return 'Not provided';
    
    // Handle boolean fields with Yes/No
    if (field === 'inPerson') {
      if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
      }
      return value; // If it's already a string like "Yes"/"No"
    }
    
    // Handle special formatting for participation count
    if (field === 'participationCount') {
      return value;
    }
    
    // Handle canAttendJudging with better formatting
    if (field === 'canAttendJudging') {
      if (value === 'Yes') return '✅ Yes, full judging period';
      if (value === 'No') return '❌ Cannot attend';
      if (value === 'Partial') return '⚠️ Partial attendance';
      return value;
    }
    
    // Handle sponsor-specific field formatting
    if (field === 'useLogo') {
      if (value === 'Yes') return '✅ Yes';
      if (value === 'No') return '❌ No';
      if (value === 'Not sure') return '❓ Not sure';
      return value;
    }
    
    if (field === 'volunteerCount') {
      return `${value} volunteer${value !== '1' ? 's' : ''}`;
    }
    
    if (field === 'volunteerHours') {
      return `${value} hour${value !== '1' ? 's' : ''}`;
    }
    
    if (field === 'preferredContact') {
      return value === 'email' ? '📧 Email' : value === 'phone' ? '📞 Phone' : value;
    }
    
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    if (typeof value === 'string' && value.includes(',')) {
      return value.split(',').map(item => item.trim()).join(', ');
    }
    
    return value;
  };

  // Helper function to render field with proper formatting
  const renderField = (field, value, isLink = false) => {
    if (!value) return null;

    const formattedValue = formatFieldValue(field, value);
    
    if (isLink && value) {
      return (
        <Link href={value} target="_blank" rel="noopener noreferrer" sx={{ wordBreak: 'break-all' }}>
          {formattedValue}
        </Link>
      );
    }
    
    return formattedValue;
  };

  // Helper function to get field label
  const getFieldLabel = (field) => {
    const labelMap = {
      name: 'Name',
      email: 'Email',
      experienceLevel: 'Experience',
      primaryRoles: 'Primary Roles',
      schoolOrganization: 'School/Organization',
      participantType: 'Type',
      skills: 'Skills',
      teamStatus: 'Team Status',
      bio: 'Bio',
      linkedin: 'LinkedIn',
      github: 'GitHub',
      portfolio: 'Portfolio',
      motivation: 'Motivation',
      socialCauses: 'Social Causes',
      company: 'Company',
      title: 'Title',
      expertise: 'Expertise',
      yearsExperience: 'Years Experience',
      mentorshipAreas: 'Mentorship Areas',
      judgingExperience: 'Judging Experience',
      volunteerRole: 'Volunteer Role',
      availability: 'Availability',
      previousVolunteering: 'Previous Volunteering',
      previousMentoring: 'Previous Mentoring',
      criteriaPreferences: 'Criteria Preferences',
      companyName: 'Company',
      contactName: 'Contact Name',
      sponsorshipLevel: 'Sponsorship Level',
      industry: 'Industry',
      employeeCount: 'Employee Count',
      website: 'Website',
      specialRequests: 'Special Requests',
      // Judge-specific fields
      participationCount: 'OHack Participation',
      backgroundAreas: 'Background Areas',
      canAttendJudging: 'Can Attend Judging',
      inPerson: 'In Person',
      biography: 'Biography',
      whyJudge: 'Why Judge?',
      additionalInfo: 'Additional Information',
      pronouns: 'Pronouns',
      country: 'Country',
      state: 'State',
      otherBackground: 'Other Background',
      linkedinProfile: 'LinkedIn Profile',
      photoUrl: 'Photo',
      status: 'Status',
      // Sponsor-specific fields
      sponsorshipTypes: 'Sponsorship Types',
      volunteerType: 'Volunteer Type',
      volunteerCount: 'Volunteer Count',
      volunteerHours: 'Volunteer Hours',
      phoneNumber: 'Phone Number',
      preferredContact: 'Preferred Contact',
      useLogo: 'Use Logo',
      howHeard: 'How Heard About Event',
      otherInvolvement: 'Other Involvement',
      logoUrl: 'Logo URL'
    };
    return labelMap[field] || field.charAt(0).toUpperCase() + field.slice(1);
  };

  return (
    <Card 
      sx={{ 
        mb: 2, 
        border: isApproved ? '2px solid #4caf50' : '1px solid #e0e0e0',
        bgcolor: isApproved ? '#f1f8e9' : 'background.paper'
      }}
    >
      <CardContent>
        {/* Header with name and approval status */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              src={application.photoUrl} 
              sx={{ mr: 2, bgcolor: 'primary.main', width: 48, height: 48 }}
            >
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" component="h3">
                {application.name || 'No name provided'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {config.title}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Show status for judges, or approval status for others */}
            {applicationType === 'judge' && application.status ? (
              <Chip 
                {...getStatusChipConfig(application.status)}
                size="small"
              />
            ) : isApproved && (
              <Chip 
                label="APPROVED" 
                color="success" 
                size="small" 
                icon={<CheckIcon />}
              />
            )}
            <IconButton onClick={handleExpand} size="small">
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* Primary information (always visible) */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {config.primaryFields.map((field) => {
            const value = application[field];
            if (!value) return null;
            
            return (
              <Grid item xs={12} sm={6} key={field}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {field === 'email' && <EmailIcon fontSize="small" color="action" />}
                  {field === 'schoolOrganization' && <SchoolIcon fontSize="small" color="action" />}
                  {field === 'company' && <SchoolIcon fontSize="small" color="action" />}
                  {field === 'status' && <StatusIcon fontSize="small" color="action" />}
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {getFieldLabel(field)}
                    </Typography>
                    {field === 'status' ? (
                      <Chip 
                        {...getStatusChipConfig(value)}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    ) : (
                      <Typography variant="body1">
                        {renderField(field, value)}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>

        {/* Secondary information (visible when collapsed) */}
        {!expanded && (
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2}>
              {config.secondaryFields.slice(0, 6).map((field) => {
                const value = application[field];
                if (!value) return null;
                
                const isLink = ['linkedin', 'github', 'portfolio', 'website', 'linkedinProfile'].includes(field);
                
                return (
                  <Grid item xs={12} sm={6} key={field}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {(field === 'linkedin' || field === 'linkedinProfile') && <LinkedInIcon fontSize="small" color="action" />}
                      {field === 'country' && <LocationIcon fontSize="small" color="action" />}
                      {field === 'state' && <LocationIcon fontSize="small" color="action" />}
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {getFieldLabel(field)}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 500,
                            ...(field === 'canAttendJudging' && {
                              p: 1,
                              borderRadius: 1,
                              bgcolor: value === 'Yes' ? 'success.light' : 
                                       value === 'No' ? 'error.light' : 'warning.light',
                              color: value === 'Yes' ? 'success.contrastText' : 
                                     value === 'No' ? 'error.contrastText' : 'warning.contrastText'
                            }),
                            ...(field === 'inPerson' && {
                              p: 1,
                              borderRadius: 1,
                              bgcolor: (value === 'Yes' || value === true) ? 'info.light' : 'grey.200',
                              color: (value === 'Yes' || value === true) ? 'info.contrastText' : 'text.primary'
                            })
                          }}
                        >
                          {renderField(field, value, isLink)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}

        {/* Expandable detailed information */}
        <Collapse in={expanded}>
          <Divider sx={{ my: 2 }} />
          
          {/* All secondary fields when expanded */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {config.secondaryFields.map((field) => {
              const value = application[field];
              if (!value) return null;
              
              return (
                <Grid item xs={12} sm={6} key={field}>
                  <Typography variant="body2" color="text.secondary">
                    {getFieldLabel(field)}
                  </Typography>
                  <Typography 
                    variant="body2"
                    sx={{ 
                      ...(field === 'canAttendJudging' && {
                        p: 1,
                        borderRadius: 1,
                        bgcolor: value === 'Yes' ? 'success.light' : 
                                 value === 'No' ? 'error.light' : 'warning.light',
                        color: value === 'Yes' ? 'success.contrastText' : 
                               value === 'No' ? 'error.contrastText' : 'warning.contrastText'
                      })
                    }}
                  >
                    {renderField(field, value)}
                  </Typography>
                </Grid>
              );
            })}
          </Grid>

          {/* Additional fields */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Additional Information
            </Typography>
            <Grid container spacing={2}>
              {config.additionalFields.map((field) => {
                const value = application[field];
                if (!value) return null;
                
                const isLink = ['linkedin', 'github', 'portfolio', 'website', 'linkedinProfile'].includes(field);
                
                return (
                  <Grid item xs={12} key={field}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      {(field === 'linkedin' || field === 'linkedinProfile') && <LinkedInIcon fontSize="small" color="action" />}
                      {field === 'github' && <GitHubIcon fontSize="small" color="action" />}
                      {(field === 'portfolio' || field === 'website') && <WebsiteIcon fontSize="small" color="action" />}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {getFieldLabel(field)}
                        </Typography>
                        {field === 'photoUrl' && value ? (
                          <Box sx={{ mt: 1, position: 'relative', width: '120px', height: '120px' }}>
                            <Image 
                              src={value} 
                              alt="Judge photo" 
                              fill
                              style={{ 
                                borderRadius: '8px',
                                objectFit: 'cover'
                              }} 
                            />
                          </Box>
                        ) : field === 'logoUrl' && value ? (
                          <Box sx={{ mt: 1, position: 'relative', width: '120px', height: '120px' }}>
                            <Image 
                              src={value} 
                              alt="Company logo" 
                              fill
                              style={{ 
                                borderRadius: '8px',
                                objectFit: 'contain'
                              }} 
                            />
                          </Box>
                        ) : field === 'biography' || field === 'whyJudge' ? (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              mt: 0.5, 
                              p: 2, 
                              bgcolor: 'grey.50', 
                              borderRadius: 1,
                              fontStyle: field === 'whyJudge' ? 'italic' : 'normal'
                            }}
                          >
                            {renderField(field, value, isLink)}
                          </Typography>
                        ) : (
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {renderField(field, value, isLink)}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Box>

          {/* Application metadata */}
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Application Details
            </Typography>
            <Grid container spacing={2}>
              {application.timestamp && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Submitted
                  </Typography>
                  <Typography variant="body2">
                    {new Date(application.timestamp).toLocaleDateString()} at{' '}
                    {new Date(application.timestamp).toLocaleTimeString()}
                  </Typography>
                </Grid>
              )}
              {application.event_id && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Event ID
                  </Typography>
                  <Typography variant="body2">
                    {application.event_id}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        </Collapse>
      </CardContent>

      {/* Action buttons */}
      <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={handleEdit}
          disabled={isLoading}
          size="small"
        >
          Edit Details
        </Button>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<CloseIcon />}
            onClick={handleReject}
            disabled={isLoading}
            size="small"
          >
            Reject
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={isLoading ? <CircularProgress size={16} /> : <CheckIcon />}
            onClick={handleApprove}
            disabled={isApproved || isLoading}
            size="small"
          >
            {isApproved ? 'Approved' : 'Approve'}
          </Button>
        </Box>
      </CardActions>
    </Card>
  );
};

export default ApplicationReviewCard;