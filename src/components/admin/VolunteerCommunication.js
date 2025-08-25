import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  TextField,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  FaPaperPlane,
  FaEdit,
  FaCheck,
  FaTimes
} from 'react-icons/fa';
import { useSnackbar } from 'notistack';
import axios from 'axios';

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
        id: "judge_travel_confirmation",
        title: "Judge Application Approved - Please Confirm Travel",
        applicableRoles: ["judge", "judges"],
        message: "⚖️ Congratulations! Your judge application has been approved!\n\nWe're excited to have you evaluate the innovative solutions our teams will create for nonprofits. However, we need your confirmation for an important detail:\n\n✈️ **All judging for Opportunity Hack 2025 Fall is done IN PERSON at Arizona State University in Tempe, Arizona.**\n\n📍 Location Details:\n• Event location: ASU Tempe campus\n• More info & hotel recommendations: https://ohack.dev/about/locations/asu-tempe-arizona\n• Full schedule of events: https://www.ohack.dev/hack/2025_fall#countdown\n• Add yourself to our LinkedIn event: https://www.linkedin.com/events/opportunityhack20257364157552420401152/\n\n⏰ **ACTION REQUIRED by August 28th at 5:00 PM PST:**\nPlease reply to this email at questions@ohack.org to confirm:\n✅ \"I confirm I can attend in person at ASU Tempe\" OR\n❌ \"I need to decline due to travel constraints\"\n\n✏️ **Need to edit your application?**\nGo to: https://www.ohack.dev/hack/2025_fall/judge-application\nUse code: \"2025\"\n\nWe understand travel requirements may not work for everyone. We just need to know by the deadline to finalize our judging panel.\n\nThank you for your interest in supporting nonprofit innovation! 🌟",
        icon: "✈️"
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

const VolunteerCommunication = ({ 
  volunteer, 
  volunteerType, // Add this prop
  onMessageSent, 
  eventId, 
  orgId, 
  accessToken,
  open,
  onClose 
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [messageDialogOpen, setMessageDialogOpen] = useState(open || false);
  const [messageText, setMessageText] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customMessage, setCustomMessage] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !volunteer) return;

    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/admin/${volunteer.id}/message`,
        {
          message: messageText,
          subject: selectedTemplate ? selectedTemplate.title : "Message from Opportunity Hack",
          recipient_type: volunteer.type || 'volunteer',
          recipient_id: volunteer.id
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Org-Id": orgId,
          },
        }
      );

      if (response.data && response.data.success) {
        enqueueSnackbar("Message sent successfully", { variant: "success" });
        setMessageDialogOpen(false);
        setMessageText("");
        setSelectedTemplate(null);
        setCustomMessage(false);
        if (onMessageSent) {
          onMessageSent();
        }
        if (onClose) {
          onClose();
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      enqueueSnackbar(error.response?.data?.message || "Failed to send message", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseMessageDialog = () => {
    setMessageDialogOpen(false);
    setMessageText("");
    setSelectedTemplate(null);
    setCustomMessage(false);
    if (onClose) {
      onClose();
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    let message = template.message;
    
    // Replace [EVENT_ID] placeholder if present
    if (eventId && message.includes('[EVENT_ID]')) {
      message = message.replace(/\[EVENT_ID\]/g, eventId);
    }
    
    setMessageText(message);
    setCustomMessage(false);
  };

  const handleCustomMessageToggle = () => {
    setCustomMessage(true);
    setSelectedTemplate(null);
    setMessageText("");
  };

  // Use useEffect to sync external open state with internal state
  React.useEffect(() => {
    if (open !== undefined) {
      setMessageDialogOpen(open);
    }
  }, [open]);

  if (!volunteer) {
    return null;
  }

  // Add helper function to filter templates by volunteer type
  const getFilteredTemplates = () => {
    const filteredCategories = {};
    
    Object.entries(MESSAGE_TEMPLATES).forEach(([categoryKey, category]) => {
      const filteredTemplates = category.templates.filter(template => 
        template.applicableRoles.includes(volunteerType) || 
        template.applicableRoles.includes(volunteer?.type)
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

  // Get filtered templates based on volunteer type
  const filteredTemplates = getFilteredTemplates();

  // If used with external dialog control, skip the card and just show dialog
  if (open !== undefined) {
    return (
      /* Send Message Dialog */
      <Dialog
        open={messageDialogOpen}
        onClose={handleCloseMessageDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FaPaperPlane />
            Send Message to {volunteer.name || 'Volunteer'} ({volunteerType || volunteer.type})
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            {!customMessage && !selectedTemplate && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Choose a Message Template for {volunteerType || volunteer.type}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Templates filtered for {volunteerType || volunteer.type} role only
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
                      No specific templates available for {volunteerType || volunteer.type}.
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

            {(selectedTemplate || customMessage) && (
              <Box>
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
                    onClick={() => {
                      setSelectedTemplate(null);
                      setCustomMessage(false);
                      setMessageText("");
                    }}
                  >
                    Back to Templates
                  </Button>
                </Box>
                
                <TextField
                  fullWidth
                  multiline
                  rows={12}
                  label="Message Content"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message to the volunteer..."
                  variant="outlined"
                  helperText={`Message will be sent to ${volunteer.name || 'volunteer'} at ${volunteer.email || 'their registered email'}`}
                />
                
                {selectedTemplate && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      💡 Feel free to customize this template before sending. The message above can be edited to fit your specific needs.
                    </Typography>
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMessageDialog}>Cancel</Button>
          {(selectedTemplate || customMessage) && (
            <Button
              onClick={handleSendMessage}
              variant="contained"
              color="primary"
              disabled={loading || !messageText.trim()}
              startIcon={loading ? <CircularProgress size={16} /> : <FaPaperPlane />}
            >
              Send Message
            </Button>
          )}
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <>
      <Card elevation={1} sx={{ mb: 3 }}>
        <CardHeader
          title="Volunteer Communication"
          subheader={`Send messages to ${volunteer.name || 'volunteer'} (${volunteer.email || 'No email'}) - Role: ${volunteerType || volunteer.type}`}
        />
        <Divider />
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Role: {volunteerType || volunteer.type}
            </Typography>
            <Button
              startIcon={<FaPaperPlane />}
              variant="contained"
              color="primary"
              onClick={() => {
                setSelectedTemplate(null);
                setCustomMessage(false);
                setMessageText("");
                setMessageDialogOpen(true);
              }}
            >
              Send Message
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Send Message Dialog */}
      <Dialog
        open={messageDialogOpen}
        onClose={handleCloseMessageDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FaPaperPlane />
            Send Message to {volunteer.name || 'Volunteer'} ({volunteerType || volunteer.type})
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            {!customMessage && !selectedTemplate && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Choose a Message Template for {volunteerType || volunteer.type}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Templates filtered for {volunteerType || volunteer.type} role only
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
                      No specific templates available for {volunteerType || volunteer.type}.
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

            {(selectedTemplate || customMessage) && (
              <Box>
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
                    onClick={() => {
                      setSelectedTemplate(null);
                      setCustomMessage(false);
                      setMessageText("");
                    }}
                  >
                    Back to Templates
                  </Button>
                </Box>
                
                <TextField
                  fullWidth
                  multiline
                  rows={12}
                  label="Message Content"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message to the volunteer..."
                  variant="outlined"
                  helperText={`Message will be sent to ${volunteer.name || 'volunteer'} at ${volunteer.email || 'their registered email'}`}
                />
                
                {selectedTemplate && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      💡 Feel free to customize this template before sending. The message above can be edited to fit your specific needs.
                    </Typography>
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMessageDialog}>Cancel</Button>
          {(selectedTemplate || customMessage) && (
            <Button
              onClick={handleSendMessage}
              variant="contained"
              color="primary"
              disabled={loading || !messageText.trim()}
              startIcon={loading ? <CircularProgress size={16} /> : <FaPaperPlane />}
            >
              Send Message
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default VolunteerCommunication;