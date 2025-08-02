import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  Chip,
  LinearProgress,
  IconButton,
  Collapse,
  Card,
  CardContent,
  Grid,
  Step,
  Stepper,
  StepLabel,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Email as EmailIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { FaPaperPlane, FaEdit } from 'react-icons/fa';
import { styled } from '@mui/system';
import BatchEmailService from '../../lib/batchEmailService';

// Import the message templates from VolunteerCommunication
const MESSAGE_TEMPLATES = {
  APPROVAL: {
    category: "Approval & Confirmation",
    templates: [
      {
        id: "hacker_approved",
        title: "Hacker Application Approved",
        applicableRoles: ["hacker", "hackers"],
        message: "🎉 You're in! Welcome to Opportunity Hack!\n\nYour hacker application is approved. Get ready to build impactful solutions for nonprofits alongside amazing teammates.\n\n🚀 Next steps:\n• Join our Slack for updates\n• Start exploring nonprofit projects\n• Track your impact: https://www.ohack.dev/volunteer/track\n\nLet's change the world, one line of code at a time! 💻\n\nStay connected: @opportunityhack on all socials",
        icon: "✅"
      },
      {
        id: "mentor_approved",
        title: "Mentor Application Approved",
        applicableRoles: ["mentor", "mentors"],
        message: "🌟 Welcome to our mentor squad!\n\nYour expertise will guide teams to create life-changing solutions for nonprofits. Thank you for sharing your knowledge!\n\n📚 Resources:\n• Mentor guide: https://www.ohack.dev/about/mentors\n• Event check-in: https://www.ohack.dev/hack/[EVENT_ID]/mentor-checkin\n• Track your impact: https://www.ohack.dev/volunteer/track\n\nReady to inspire the next generation of changemakers? 🚀",
        icon: "🎯"
      },
      {
        id: "judge_approved",
        title: "Judge Application Approved",
        applicableRoles: ["judge", "judges"],
        message: "⚖️ Welcome to our judging panel!\n\nThank you for being here! Having your talent and background to review these projects helps us to find the top teams who have solved problems for nonprofits this summer after spending about 3 months in all phases of software development.\n\n📋 Resources & Next Steps:\n1. Judging Intro [video](https://youtu.be/YM8j-2CA-mE?si=WNiRqI9Ww_Jd0yx0)\n2. When the projects have closed and we're ready to judge, you'll go [here](https://www.ohack.dev/judge)\n3. Judging criteria is [here](https://www.ohack.dev/about/judges)\n4. You can already start reviewing teams GitHub and DevPost now (knowing that they might land more changes before the end of the hack) all teams are listed [here](https://www.ohack.dev/hack/2025_summer#teams)\n5. All judges are listed [here](https://www.ohack.dev/hack/2025_summer#judge)\n6. Take time to say hi and introduce yourself to everyone, this is a great way to market amongst similar-minded, community focused people\n\n⏱️ Track your impact: https://www.ohack.dev/volunteer/track\n\nReady to discover amazing innovations! ✨",
        icon: "⚖️"
      },
      {
        id: "volunteer_approved",
        title: "Volunteer Application Approved",
        applicableRoles: ["volunteer", "volunteers"],
        message: "🙌 You're part of the dream team!\n\nThank you for helping make Opportunity Hack magical. Every volunteer contribution creates ripple effects of positive change.\n\n⏱️ Track your impact: https://www.ohack.dev/volunteer/track\n\nAssignments coming soon. Ready to be part of something amazing? 🌟",
        icon: "🙌"
      },
      {
        id: "sponsor_approved",
        title: "Sponsorship Approved",
        applicableRoles: ["sponsor", "sponsors"],
        message: "🤝 Partnership activated!\n\nThank you for investing in nonprofit innovation. Together, we're amplifying social impact through technology.\n\n📈 Your support enables:\n• Free participation for nonprofits\n• Quality mentorship and resources\n• Lasting solutions for communities\n\n⏱️ Team volunteering? Track at: https://www.ohack.dev/volunteer/track",
        icon: "🤝"
      }
    ]
  },
  DENIAL: {
    category: "Application Denial",
    templates: [
      {
        id: "application_denied",
        title: "Application Not Approved",
        applicableRoles: ["mentor", "mentors", "judge", "judges", "volunteer", "volunteers", "hacker", "hackers", "sponsor", "sponsors"],
        message: "Thank you for wanting to join our mission! 🙏\n\nWhile we can't accommodate your application this time due to capacity, your interest in helping nonprofits means everything.\n\n🌟 Stay involved:\n• Apply for future events\n• Follow @opportunityhack for opportunities\n• Share our mission with your network\n\nEvery action towards social good counts. We hope to work together soon! 💫",
        icon: "💫"
      }
    ]
  },
  FOLLOW_UP: {
    category: "Follow-up & Information",
    templates: [
      {
        id: "sponsor_info_request",
        title: "Sponsor Information Request",
        applicableRoles: ["sponsor", "sponsors"],
        message: "Excited about your sponsorship interest! 🚀\n\nLet's create a partnership that amplifies your impact and aligns with your values.\n\n💭 Quick questions:\n• Preferred involvement level?\n• Specific causes you're passionate about?\n• Would your team like to volunteer?\n\n⏱️ Team volunteers can track time: https://www.ohack.dev/volunteer/track\n\nReply with your thoughts - we'll craft the perfect partnership! ✨",
        icon: "📋"
      },
      {
        id: "mentor_checkin_reminder",
        title: "Mentor Check-in Reminder",
        applicableRoles: ["mentor", "mentors"],
        message: "Time to check in! 👋\n\nYour guidance is transforming ideas into impact. Quick reminder:\n\n✅ Check-in: https://www.ohack.dev/hack/[EVENT_ID]/mentor-checkin\n📚 Resources: https://www.ohack.dev/about/mentors\n⏱️ Track time: https://www.ohack.dev/volunteer/track\n\nEvery minute you spend mentoring creates lasting change! 🌟",
        icon: "⏰"
      },
      {
        id: "judge_info_sharing",
        title: "Judge Information & Resources",
        applicableRoles: ["judge", "judges"],
        message: "Ready to spot game-changing solutions? ⚖️\n\nYour expertise helps identify innovations that will transform nonprofit work.\n\n📚 Resources:\n0. Dates and times are [here on the hackathon page](https://www.ohack.dev/hack/2025_summer#countdown)\n1. Judging Intro [video](https://youtu.be/YM8j-2CA-mE?si=WNiRqI9Ww_Jd0yx0)\n2. When the projects have closed and we're ready to judge, you'll go [here](https://www.ohack.dev/judge)\n3. Judging criteria is [here](https://www.ohack.dev/about/judges)\n4. You can already start reviewing teams GitHub and DevPost now (knowing that they might land more changes before the end of the hack) all teams are listed [here](https://www.ohack.dev/hack/2025_summer#teams)\n5. All judges are listed [here](https://www.ohack.dev/hack/2025_summer#judge)\n6. Take time to say hi and introduce yourself to everyone, this is a great way to market amongst similar-minded, community focused people, join our judges Slack channel: [#2025-summer-judging](https://opportunity-hack.slack.com/archives/C0987QH0R5K)\n\n⏱️ Track your volunteer hours: https://www.ohack.dev/volunteer/track\n\nGet excited to discover the next big breakthrough! 🎯",
        icon: "📚"
      },
      {
        id: "volunteer_time_tracking",
        title: "Volunteer Time Tracking Reminder",
        applicableRoles: ["mentor", "mentors", "judge", "judges", "volunteer", "volunteers", "hacker", "hackers", "sponsor", "sponsors"],
        message: "Your time = Real impact! ⏱️\n\nEvery hour you contribute creates ripple effects in nonprofit communities. Don't let your impact go uncounted!\n\n📊 Track at: https://www.ohack.dev/volunteer/track\n\nWhy track?\n• Celebrate your contribution\n• Show sponsors our collective power\n• Inspire others to join our mission\n\nYou're changing the world - let's measure it! 🌍",
        icon: "⏱️"
      },
      {
        id: "hacker_team_reminder",
        title: "Team Formation Reminder",
        applicableRoles: ["hacker", "hackers"],
        message: "Ready to find your dream team? 👥\n\nThe best solutions come from diverse minds working together!\n\n🎯 Team tips:\n• 2-6 members work best\n• Mix skills: code + design + strategy\n• Track your journey: https://www.ohack.dev/volunteer/track\n\nTeam formation activities start soon. Prepare to meet your future collaborators! ⚡",
        icon: "👥"
      }
    ]
  }
};

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    minWidth: '700px',
    maxWidth: '900px',
    maxHeight: '90vh',
  },
}));

const ProgressContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const ResultsList = styled(List)(({ theme }) => ({
  maxHeight: '300px',
  overflow: 'auto',
  backgroundColor: theme.palette.grey[50],
  borderRadius: theme.shape.borderRadius,
  margin: theme.spacing(1, 0),
}));

const BatchEmailDialog = ({
  open,
  onClose,
  volunteers,
  volunteerType,
  accessToken,
  orgId,
  eventId,
  onComplete,
  isSelectedUsers = true, // true for selected/approved users, false for not-selected/rejected users
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customMessage, setCustomMessage] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [subject, setSubject] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Filter eligible users when volunteers change based on context
  const eligibleUsers = isSelectedUsers 
    ? BatchEmailService.filterEligibleUsers(volunteers)
    : BatchEmailService.filterNotSelectedUsers(volunteers);

  // Get filtered templates based on volunteer type
  const getFilteredTemplates = () => {
    const filteredCategories = {};
    
    Object.entries(MESSAGE_TEMPLATES).forEach(([categoryKey, category]) => {
      const filteredTemplates = category.templates.filter(template => 
        template.applicableRoles.includes(volunteerType) || 
        template.applicableRoles.includes(BatchEmailService.getRecipientType(volunteerType))
      );
      
      if (filteredTemplates.length > 0) {
        filteredCategories[categoryKey] = {
          ...category,
          templates: filteredTemplates
        };
      }
    });
    
    return filteredCategories;
  };

  const filteredTemplates = getFilteredTemplates();

  useEffect(() => {
    // Reset state when dialog opens/closes
    if (!open) {
      setCurrentStep(0);
      setSelectedTemplate(null);
      setCustomMessage(false);
      setMessageText('');
      setSubject('');
      setIsScheduling(false);
      setProgress(null);
      setResults(null);
      setShowDetails(false);
    } else if (!isSelectedUsers) {
      // Auto-suggest the "Application Not Approved" template for not-selected users
      const denialTemplate = MESSAGE_TEMPLATES.DENIAL.templates.find(t => t.id === 'application_denied');
      if (denialTemplate) {
        setSelectedTemplate(denialTemplate);
        setMessageText(denialTemplate.message);
        setSubject(denialTemplate.title);
        setCurrentStep(1); // Skip template selection and go to review step
      }
    }
  }, [open, isSelectedUsers]);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setMessageText(template.message);
    setSubject(template.title);
    setCustomMessage(false);
    setCurrentStep(1);
  };

  const handleCustomMessageToggle = () => {
    setCustomMessage(true);
    setSelectedTemplate(null);
    setMessageText('');
    setSubject('Message from Opportunity Hack');
    setCurrentStep(1);
  };

  const handleBackToTemplates = () => {
    setCurrentStep(0);
    setSelectedTemplate(null);
    setCustomMessage(false);
    setMessageText('');
    setSubject('');
  };

  const handleSendEmails = async () => {
    const messageError = BatchEmailService.validateMessage(messageText);
    const subjectError = BatchEmailService.validateSubject(subject);
    
    if (messageError || subjectError) {
      return;
    }

    setIsScheduling(true);
    setCurrentStep(2);
    setProgress({ current: 0, total: eligibleUsers.length, percentage: 0 });

    const batchEmailService = new BatchEmailService(
      process.env.NEXT_PUBLIC_API_SERVER_URL,
      accessToken,
      orgId
    );

    const recipientType = BatchEmailService.getRecipientType(volunteerType);

    try {
      const { results: emailResults, summary } = await batchEmailService.sendBatchEmails(
        eligibleUsers,
        messageText,
        subject,
        recipientType,
        eventId,
        (progressUpdate) => {
          setProgress(progressUpdate);
        }
      );

      setResults({ results: emailResults, summary });
      
      if (onComplete) {
        onComplete(summary);
      }
    } catch (error) {
      console.error('Error during batch email sending:', error);
      setResults({
        results: [],
        summary: {
          total: eligibleUsers.length,
          successful: 0,
          failed: eligibleUsers.length,
          errors: [{ user: 'System', error: error.message }]
        }
      });
    } finally {
      setIsScheduling(false);
    }
  };

  const handleClose = () => {
    if (!isScheduling) {
      onClose();
    }
  };

  const getResultIcon = (success) => {
    return success ? (
      <CheckCircleIcon color="success" />
    ) : (
      <ErrorIcon color="error" />
    );
  };

  const steps = ['Select Template', 'Review & Customize', 'Send Emails'];

  return (
    <StyledDialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <EmailIcon color="primary" />
          <Typography variant="h6">
            {isSelectedUsers 
              ? `Send Batch Email to Selected ${volunteerType}`
              : `Send Rejection Email to Not Selected ${volunteerType}`
            }
          </Typography>
        </Box>
        <Stepper activeStep={currentStep} sx={{ mt: 2 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </DialogTitle>
      
      <DialogContent>
        {/* Eligible Users Summary */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Found <strong>{eligibleUsers.length}</strong> {isSelectedUsers ? 'selected' : 'not selected'} {volunteerType.toLowerCase()} 
            with email addresses out of <strong>{volunteers.length}</strong> total {volunteerType.toLowerCase()}.
          </Typography>
        </Alert>

        {eligibleUsers.length === 0 ? (
          <Alert severity="warning">
            No eligible users found. Users must be {isSelectedUsers ? 'selected' : 'not selected'} and have email addresses to receive emails.
          </Alert>
        ) : (
          <>
            {/* Step 0: Template Selection */}
            {currentStep === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Choose a Message Template for {volunteerType}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Templates filtered for {volunteerType} role only
                </Typography>
                
                {Object.entries(filteredTemplates).map(([categoryKey, category]) => (
                  <Box key={categoryKey} sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {category.category}
                    </Typography>
                    <Grid container spacing={2}>
                      {category.templates.map((template) => (
                        <Grid item xs={12} sm={6} key={template.id}>
                          <Card 
                            variant="outlined" 
                            sx={{ 
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              '&:hover': {
                                borderColor: 'primary.main',
                                boxShadow: 1
                              }
                            }}
                            onClick={() => handleTemplateSelect(template)}
                          >
                            <CardContent sx={{ pb: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography variant="h6" component="span">
                                  {template.icon}
                                </Typography>
                                <Typography variant="subtitle2" fontWeight="bold">
                                  {template.title}
                                </Typography>
                              </Box>
                              <Typography 
                                variant="body2" 
                                color="text.secondary"
                                sx={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                {template.message}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                ))}
                
                {Object.keys(filteredTemplates).length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No specific templates available for {volunteerType}.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      You can still write a custom message.
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleCustomMessageToggle}
                    startIcon={<FaEdit />}
                  >
                    Write Custom Message
                  </Button>
                </Box>
              </Box>
            )}

            {/* Step 1: Review & Customize */}
            {currentStep === 1 && (
              <Box>
                {!isSelectedUsers && selectedTemplate?.id === 'application_denied' && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      💡 We've automatically selected the "Application Not Approved" template for not-selected {volunteerType.toLowerCase()}. 
                      You can customize the message below or choose a different template.
                    </Typography>
                  </Alert>
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">
                    {selectedTemplate ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{selectedTemplate.icon}</span>
                        {selectedTemplate.title}
                      </Box>
                    ) : (
                      'Custom Message'
                    )}
                  </Typography>
                  <Button
                    size="small"
                    onClick={handleBackToTemplates}
                    startIcon={<ArrowBackIcon />}
                  >
                    Back to Templates
                  </Button>
                </Box>

                <TextField
                  fullWidth
                  label="Email Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  error={!!BatchEmailService.validateSubject(subject)}
                  helperText={BatchEmailService.validateSubject(subject) || 'Email subject line'}
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  fullWidth
                  multiline
                  rows={12}
                  label="Message Content"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  error={!!BatchEmailService.validateMessage(messageText)}
                  helperText={BatchEmailService.validateMessage(messageText) || `Message will be sent to ${eligibleUsers.length} ${volunteerType.toLowerCase()}`}
                  placeholder="Type your message..."
                  variant="outlined"
                />
                
                {selectedTemplate && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      💡 Feel free to customize this template before sending. The message above can be edited to fit your specific needs.
                    </Typography>
                  </Alert>
                )}

                {/* Users to be emailed */}
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Users to be emailed:
                </Typography>
                <Box sx={{ mb: 2, maxHeight: '150px', overflow: 'auto' }}>
                  {eligibleUsers.map((user, index) => (
                    <Chip
                      key={index}
                      label={`${user.name || 'Unknown'} (${user.email})`}
                      size="small"
                      sx={{ m: 0.5 }}
                      icon={<PersonIcon />}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Step 2: Progress & Results */}
            {currentStep === 2 && (
              <Box>
                {/* Progress */}
                {progress && !results && (
                  <ProgressContainer>
                    <Typography variant="body2" gutterBottom>
                      Sending email to {progress.currentUser}... ({progress.current}/{progress.total})
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={progress.percentage} 
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="caption" color="textSecondary">
                      {progress.percentage}% complete
                    </Typography>
                  </ProgressContainer>
                )}

                {/* Results */}
                {results && (
                  <Card sx={{ mt: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Email Results
                      </Typography>
                      
                      <Box display="flex" gap={2} mb={2}>
                        <Chip 
                          label={`${results.summary.successful} Successful`}
                          color="success"
                          size="small"
                        />
                        <Chip 
                          label={`${results.summary.failed} Failed`}
                          color="error"
                          size="small"
                        />
                      </Box>

                      {results.summary.errors.length > 0 && (
                        <>
                          <Box display="flex" alignItems="center" mb={1}>
                            <IconButton
                              size="small"
                              onClick={() => setShowDetails(!showDetails)}
                            >
                              {showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                            <Typography variant="body2">
                              View Details ({results.summary.errors.length} errors)
                            </Typography>
                          </Box>

                          <Collapse in={showDetails}>
                            <ResultsList>
                              {results.results.map((result, index) => (
                                <ListItem key={index}>
                                  <ListItemIcon>
                                    {getResultIcon(result.success)}
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={result.user.name || result.user.email}
                                    secondary={
                                      result.success 
                                        ? 'Email sent successfully'
                                        : result.error
                                    }
                                  />
                                </ListItem>
                              ))}
                            </ResultsList>
                          </Collapse>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isScheduling}>
          {results ? 'Close' : 'Cancel'}
        </Button>
        
        {currentStep === 1 && !results && eligibleUsers.length > 0 && (
          <Button
            onClick={handleSendEmails}
            variant="contained"
            disabled={
              isScheduling || 
              !!BatchEmailService.validateMessage(messageText) || 
              !!BatchEmailService.validateSubject(subject)
            }
            startIcon={<FaPaperPlane />}
          >
            {isScheduling ? 'Sending...' : `Send to ${eligibleUsers.length} Users`}
          </Button>
        )}
      </DialogActions>
    </StyledDialog>
  );
};

export default BatchEmailDialog;