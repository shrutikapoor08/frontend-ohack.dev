import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Tabs,
  Tab
} from '@mui/material';
import {
  Send as SendIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Preview as PreviewIcon,
  History as HistoryIcon,
  Email as EmailIcon,
  Share as ShareIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { useEnv } from '../../context/env.context';
import { SocialMediaManager } from '../../lib/social-media/SocialMediaManager';
import { SUPPORTED_PLATFORMS } from '../../lib/social-media/index';
import { useAuthInfo } from '@propelauth/react';
import BatchEmailDialog from './BatchEmailDialog';
import axios from 'axios';

const SocialMediaManagement = ({ onSnackbar }) => {
  const { accessToken, userClass } = useAuthInfo();
  const { apiServerUrl } = useEnv();
  const [manager, setManager] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [newsItems, setNewsItems] = useState([]);
  const [postingResults, setPostingResults] = useState([]);
  const [platformStatus, setPlatformStatus] = useState({});
  const [previewDialog, setPreviewDialog] = useState({ open: false, newsItem: null, platform: null });
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [postingHistory, setPostingHistory] = useState([]);
  const [adhocMessage, setAdhocMessage] = useState({
    text: '',
    channel: 'general',
    sending: false
  });

  // Email functionality state
  const [currentTab, setCurrentTab] = useState(0);
  const [slackUsers, setSlackUsers] = useState([]);
  const [loadingSlackUsers, setLoadingSlackUsers] = useState(true);
  const [batchEmailDialog, setBatchEmailDialog] = useState(false);
  const [emailResults, setEmailResults] = useState(null);

  // Settings state
  const [settings, setSettings] = useState({
    dryRun: true,
    platforms: [SUPPORTED_PLATFORMS.THREADS],
    newsLimit: 5,
    autoRefresh: false,
    slackChannel: 'general'
  });

  // Fetch active Slack users for email functionality
  const fetchActiveSlackUsers = useCallback(async () => {
    if (!apiServerUrl || !accessToken) return;

    try {
      setLoadingSlackUsers(true);
      const org = userClass?.getOrgByName("Opportunity Hack Org");
      const orgId = org?.orgId;

      const response = await axios.get(
        `${apiServerUrl}/api/slack/admin/users/active?active_days=10000`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Org-Id": orgId,
          },
        }
      );

      if (response.data && response.data.users) {
        const activeUsers = response.data.users
          .filter(user => !user.deleted && !user.is_bot)
          .map(user => ({
            id: user.id,
            name: user.name,
            real_name: user.real_name,
            email: user.email,
            tz: user.tz,
            isSelected: true // Default to selected for batch email
          }));
        setSlackUsers(activeUsers);
        onSnackbar?.(`Loaded ${activeUsers.length} active Slack users`, 'success');
      } else {
        onSnackbar?.('Failed to fetch Slack users', 'error');
      }
    } catch (error) {
      console.error('Error fetching active Slack users:', error);
      onSnackbar?.('Failed to fetch active Slack users', 'error');
    } finally {
      setLoadingSlackUsers(false);
    }
  }, [apiServerUrl, accessToken, userClass]);

  // Fetch news from backend
  const fetchNews = useCallback(async (socialMediaManager) => {
    if (!socialMediaManager) return;
    
    try {
      setLoading(true);
      const news = await socialMediaManager.newsService.getNewsForSocialMedia({
        limit: settings.newsLimit
      });
      setNewsItems(news);
      onSnackbar?.(`Fetched ${news.length} news items`, 'success');
    } catch (error) {
      console.error('Error fetching news:', error);
      onSnackbar?.('Failed to fetch news', 'error');
    } finally {
      setLoading(false);
    }
  }, [settings.newsLimit]); // Remove onSnackbar dependency

  // Initialize social media manager
  useEffect(() => {
    const initializeManager = async () => {
      try {
        // Only initialize on client side to avoid SSR issues
        if (typeof window === 'undefined' || !apiServerUrl || !accessToken) return;
        
        const org = userClass?.getOrgByName("Opportunity Hack Org");
        const orgId = org?.orgId;
        
        const userCredentials = {
          accessToken,
          orgId
        };
        
        const socialMediaManager = SocialMediaManager.createFromEnvironment(process.env, apiServerUrl, userCredentials);
        setManager(socialMediaManager);
        
        // Validate platform credentials
        const validation = await socialMediaManager.validateAllCredentials();
        setPlatformStatus(validation);
        
        // Get posting history
        const history = socialMediaManager.getPostingHistory(10);
        setPostingHistory(history);
        
      } catch (error) {
        console.error('Error initializing social media manager:', error);
        onSnackbar?.('Failed to initialize social media manager', 'error');
      } finally {
        setLoading(false);
      }
    };

    initializeManager();
  }, [apiServerUrl, accessToken, userClass]); // Add accessToken and userClass dependencies

  // Separate useEffect for fetching news when manager is ready
  useEffect(() => {
    if (manager) {
      fetchNews(manager);
    }
  }, [manager]); // Only depend on manager, not fetchNews

  // Fetch Slack users when component mounts
  useEffect(() => {
    fetchActiveSlackUsers();
  }, [fetchActiveSlackUsers]);

  // Post news to social media
  const handlePostNews = async () => {
    if (!manager || newsItems.length === 0) return;
    
    try {
      setPosting(true);
      const results = await manager.postLatestNews({
        platforms: settings.platforms,
        limit: settings.newsLimit,
        dryRun: settings.dryRun,
        slackChannel: settings.slackChannel
      });
      
      setPostingResults(results.results || []);
      
      if (results.success) {
        onSnackbar?.(results.message, 'success');
        
        // Update posting history if not dry run
        if (!settings.dryRun) {
          const history = manager.getPostingHistory(10);
          setPostingHistory(history);
        }
      } else {
        onSnackbar?.(results.message, 'error');
      }
    } catch (error) {
      console.error('Error posting news:', error);
      onSnackbar?.('Failed to post news', 'error');
    } finally {
      setPosting(false);
    }
  };

  // Preview formatted content
  const handlePreview = (newsItem, platform) => {
    if (!manager) return;
    
    const service = manager.getService(platform);
    if (service) {
      setPreviewDialog({
        open: true,
        newsItem,
        platform,
        formattedContent: service.formatContent(newsItem),
        service
      });
    }
  };

  // Refresh platform status
  const handleRefreshStatus = async () => {
    if (!manager) return;
    
    try {
      const validation = await manager.validateAllCredentials();
      setPlatformStatus(validation);
      onSnackbar?.('Platform status refreshed', 'success');
    } catch (error) {
      console.error('Error refreshing status:', error);
      onSnackbar?.('Failed to refresh platform status', 'error');
    }
  };

  // Send adhoc message to Slack
  const handleSendAdhocMessage = async () => {
    if (!manager || !adhocMessage.text.trim()) return;

    try {
      setAdhocMessage({ ...adhocMessage, sending: true });

      const slackService = manager.getService('slack');
      if (!slackService) {
        onSnackbar?.('Slack service not available', 'error');
        return;
      }

      const result = await slackService.post(adhocMessage.text, adhocMessage.channel);

      if (result.success) {
        onSnackbar?.(`Message sent to #${adhocMessage.channel}`, 'success');
        setAdhocMessage({ text: '', channel: adhocMessage.channel, sending: false });
      } else {
        onSnackbar?.(result.message || 'Failed to send message', 'error');
      }
    } catch (error) {
      console.error('Error sending adhoc message:', error);
      onSnackbar?.('Failed to send message', 'error');
    } finally {
      setAdhocMessage({ ...adhocMessage, sending: false });
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Handle batch email completion
  const handleEmailComplete = (summary) => {
    setEmailResults(summary);
    onSnackbar?.(`Email batch complete: ${summary.successful}/${summary.total} successful`, summary.successful === summary.total ? 'success' : 'warning');
  };

  // Get orgId for email functionality
  const getOrgId = () => {
    const org = userClass?.getOrgByName("Opportunity Hack Org");
    return org?.orgId;
  };

  const getPlatformStatusColor = (status) => {
    if (!status) return 'default';
    return status.valid ? 'success' : 'error';
  };

  const getPlatformStatusIcon = (status) => {
    if (!status) return <InfoIcon />;
    return status.valid ? <CheckCircleIcon /> : <ErrorIcon />;
  };

  if (loading && !manager) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Tab Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange} aria-label="social media tabs">
          <Tab
            icon={<ShareIcon />}
            label="Social Media"
            id="tab-0"
            aria-controls="tabpanel-0"
          />
          <Tab
            icon={<EmailIcon />}
            label="Email Communication"
            id="tab-1"
            aria-controls="tabpanel-1"
          />
        </Tabs>
      </Paper>

      {/* Tab Panel 0: Social Media */}
      <Box hidden={currentTab !== 0}>
      {/* Platform Status Cards */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Platform Status</Typography>
          <Button
            startIcon={<RefreshIcon />}
            onClick={handleRefreshStatus}
            size="small"
          >
            Refresh
          </Button>
        </Box>
        
        <Grid container spacing={2}>
          {Object.entries(platformStatus).map(([platform, status]) => (
            <Grid item xs={12} sm={6} md={4} key={platform}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {getPlatformStatusIcon(status)}
                    <Typography variant="h6" sx={{ ml: 1 }}>
                      {status.platform}
                    </Typography>
                  </Box>
                  <Chip
                    label={status.valid ? 'Connected' : 'Not Connected'}
                    color={getPlatformStatusColor(status)}
                    size="small"
                  />
                  {status.error && (
                    <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                      {status.error}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Adhoc Slack Message */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Send Message to Slack
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel size="small">Channel</InputLabel>
            <Select
              size="small"
              value={adhocMessage.channel}
              label="Channel"
              onChange={(e) => setAdhocMessage({ ...adhocMessage, channel: e.target.value })}
            >
              <MenuItem value="general">general</MenuItem>
              <MenuItem value="ask-a-mentor">ask-a-mentor</MenuItem>
            </Select>
          </FormControl>
          <TextField
            multiline
            rows={3}
            placeholder="Type your message here..."
            value={adhocMessage.text}
            onChange={(e) => setAdhocMessage({ ...adhocMessage, text: e.target.value })}
            sx={{ flexGrow: 1 }}
            disabled={adhocMessage.sending}
          />
          <Button
            variant="contained"
            startIcon={adhocMessage.sending ? <CircularProgress size={16} /> : <SendIcon />}
            onClick={handleSendAdhocMessage}
            disabled={adhocMessage.sending || !adhocMessage.text.trim()}
            sx={{ height: 'fit-content', mt: 1 }}
          >
            Send
          </Button>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          This will send a direct message to the selected Slack channel
        </Typography>
      </Paper>

      {/* Controls */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Social Media Posting</Typography>
          <Box>
            <Button
              startIcon={<SettingsIcon />}
              onClick={() => setSettingsDialog(true)}
              sx={{ mr: 2 }}
            >
              Settings
            </Button>
            <Button
              startIcon={<RefreshIcon />}
              onClick={() => fetchNews(manager)}
              disabled={loading}
              sx={{ mr: 2 }}
            >
              Refresh News
            </Button>
            <Button
              variant="contained"
              startIcon={posting ? <CircularProgress size={16} /> : <SendIcon />}
              onClick={handlePostNews}
              disabled={posting || newsItems.length === 0}
            >
              {settings.dryRun ? 'Preview Posts' : 'Post to Social Media'}
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Chip
            label={`${newsItems.length} news items`}
            color={newsItems.length > 0 ? 'primary' : 'default'}
          />
          <Chip
            label={`${settings.platforms.length} platforms`}
            color="secondary"
          />
          <Chip
            label={settings.dryRun ? 'Preview Mode' : 'Live Mode'}
            color={settings.dryRun ? 'warning' : 'success'}
          />
          {settings.platforms.includes(SUPPORTED_PLATFORMS.SLACK) && (
            <Chip
              label={`Slack: #${settings.slackChannel}`}
              color="info"
              size="small"
            />
          )}
        </Box>
      </Paper>

      {/* News Items */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Latest News ({newsItems.length} items)
        </Typography>
        
        {newsItems.length === 0 ? (
          <Alert severity="info">
            No news items available for posting. Try refreshing or check your news API.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {newsItems.map((item) => (
              <Grid item xs={12} md={6} key={item.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {item.content.substring(0, 150)}...
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {new Date(item.publishedAt).toLocaleDateString()}
                    </Typography>
                    {item.slackPermalink && (
                      <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5 }}>
                        📢 From Slack
                      </Typography>
                    )}
                    {item.imageUrl && (
                      <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.5 }}>
                        🖼️ Has Image
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    {settings.platforms.map((platform) => (
                      <Button
                        key={platform}
                        startIcon={<PreviewIcon />}
                        size="small"
                        onClick={() => handlePreview(item, platform)}
                      >
                        Preview {platform}
                      </Button>
                    ))}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Posting Results */}
      {postingResults.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {settings.dryRun ? 'Preview Results' : 'Posting Results'}
          </Typography>
          
          {postingResults.map((result, index) => (
            <Accordion key={index}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>{result.newsItem.title}</Typography>
                <Box sx={{ ml: 'auto', mr: 2 }}>
                  {result.dryRun ? (
                    <Chip label="Preview" color="info" size="small" />
                  ) : (
                    <Chip
                      label={`${result.summary?.successful || 0}/${result.summary?.total || 0} successful`}
                      color={result.summary?.successful === result.summary?.total ? 'success' : 'warning'}
                      size="small"
                    />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {Object.entries(result.platforms).map(([platform, platformResult]) => (
                  <Box key={platform} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {platform.toUpperCase()}
                    </Typography>
                    {result.dryRun ? (
                      <Box>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                          {platformResult.formattedContent}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {platformResult.characterCount} characters
                          {platformResult.withinLimit ? ' ✓' : ' ⚠️ Exceeds limit'}
                          {platformResult.channel && ` | Channel: #${platformResult.channel}`}
                        </Typography>
                      </Box>
                    ) : (
                      <Alert severity={platformResult.success ? 'success' : 'error'}>
                        {platformResult.message}
                        {platformResult.channel && (
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                            Posted to #{platformResult.channel}
                          </Typography>
                        )}
                        {platformResult.url && (
                          <Box sx={{ mt: 1 }}>
                            <Button
                              href={platformResult.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              size="small"
                            >
                              View Post
                            </Button>
                          </Box>
                        )}
                      </Alert>
                    )}
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* Posting History */}
      {postingHistory.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Recent Posting History
          </Typography>
          
          <List>
            {postingHistory.slice(0, 5).map((entry, index) => (
              <ListItem key={index} divider>
                <ListItemIcon>
                  {entry.results.summary?.successful === entry.results.summary?.total ? 
                    <CheckCircleIcon color="success" /> : 
                    <ErrorIcon color="error" />
                  }
                </ListItemIcon>
                <ListItemText
                  primary={entry.newsItem.title}
                  secondary={`${new Date(entry.timestamp).toLocaleString()} - ${entry.results.summary?.successful}/${entry.results.summary?.total} platforms`}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Settings Dialog */}
      <Dialog open={settingsDialog} onClose={() => setSettingsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Social Media Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.dryRun}
                  onChange={(e) => setSettings({ ...settings, dryRun: e.target.checked })}
                />
              }
              label="Dry Run Mode (Preview Only)"
            />
            
            <Box sx={{ mt: 3 }}>
              <TextField
                label="News Items Limit"
                type="number"
                value={settings.newsLimit}
                onChange={(e) => setSettings({ ...settings, newsLimit: parseInt(e.target.value) || 5 })}
                inputProps={{ min: 1, max: 20 }}
                fullWidth
              />
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Platforms to Post To:
              </Typography>
              {Object.values(SUPPORTED_PLATFORMS).map((platform) => (
                <FormControlLabel
                  key={platform}
                  control={
                    <Switch
                      checked={settings.platforms.includes(platform)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSettings({ ...settings, platforms: [...settings.platforms, platform] });
                        } else {
                          setSettings({ ...settings, platforms: settings.platforms.filter(p => p !== platform) });
                        }
                      }}
                    />
                  }
                  label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                />
              ))}
            </Box>

            {settings.platforms.includes(SUPPORTED_PLATFORMS.SLACK) && (
              <Box sx={{ mt: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Slack Channel</InputLabel>
                  <Select
                    value={settings.slackChannel}
                    label="Slack Channel"
                    onChange={(e) => setSettings({ ...settings, slackChannel: e.target.value })}
                  >
                    <MenuItem value="general">general</MenuItem>
                    <MenuItem value="ask-a-mentor">ask-a-mentor</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialog(false)}>Cancel</Button>
          <Button onClick={() => setSettingsDialog(false)} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialog.open} onClose={() => setPreviewDialog({ open: false, newsItem: null, platform: null })} maxWidth="md" fullWidth>
        <DialogTitle>
          Preview for {previewDialog.platform?.charAt(0).toUpperCase() + previewDialog.platform?.slice(1)}
        </DialogTitle>
        <DialogContent>
          {previewDialog.formattedContent && (
            <Box sx={{ py: 2 }}>
              <Typography variant="h6" gutterBottom>
                {previewDialog.newsItem?.title}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                {previewDialog.formattedContent}
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">
                  {previewDialog.formattedContent.length} / {previewDialog.service?.characterLimit} characters
                </Typography>
                <Chip
                  label={previewDialog.formattedContent.length <= previewDialog.service?.characterLimit ? 'Within Limit' : 'Exceeds Limit'}
                  color={previewDialog.formattedContent.length <= previewDialog.service?.characterLimit ? 'success' : 'error'}
                  size="small"
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog({ open: false, newsItem: null, platform: null })}>Close</Button>
        </DialogActions>
      </Dialog>
      </Box>

      {/* Tab Panel 1: Email Communication */}
      <Box hidden={currentTab !== 1}>
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              <GroupIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Email Communication to Slack Community
            </Typography>
            <Box>
              <Button
                startIcon={<RefreshIcon />}
                onClick={fetchActiveSlackUsers}
                disabled={loadingSlackUsers}
                sx={{ mr: 2 }}
              >
                Refresh Users
              </Button>
              <Button
                variant="contained"
                startIcon={<EmailIcon />}
                onClick={() => setBatchEmailDialog(true)}
                disabled={loadingSlackUsers || slackUsers.length === 0}
              >
                Send Batch Email
              </Button>
            </Box>
          </Box>

          {loadingSlackUsers ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Chip
                  label={`${slackUsers.length} active Slack users`}
                  color={slackUsers.length > 0 ? 'primary' : 'default'}
                  icon={<GroupIcon />}
                />
                <Chip
                  label={`${slackUsers.filter(u => u.email).length} with email addresses`}
                  color="secondary"
                  icon={<EmailIcon />}
                />
              </Box>

              {slackUsers.length === 0 ? (
                <Alert severity="info">
                  No active Slack users found. Try refreshing or check your Slack integration.
                </Alert>
              ) : (
                <>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      This feature allows you to send emails to all active Slack community members who have email addresses.
                      Use this for community-wide announcements, updates, or important information.
                    </Typography>
                  </Alert>

                  <Typography variant="subtitle2" gutterBottom>
                    Recent Users Preview:
                  </Typography>
                  <Grid container spacing={1} sx={{ mb: 2 }}>
                    {slackUsers.slice(0, 12).map((user, index) => (
                      <Grid item key={user.id}>
                        <Chip
                          size="small"
                          label={user.real_name || user.name}
                          color={user.email ? 'success' : 'default'}
                          variant={user.email ? 'filled' : 'outlined'}
                        />
                      </Grid>
                    ))}
                    {slackUsers.length > 12 && (
                      <Grid item>
                        <Chip
                          size="small"
                          label={`+${slackUsers.length - 12} more`}
                          color="info"
                          variant="outlined"
                        />
                      </Grid>
                    )}
                  </Grid>
                </>
              )}

              {emailResults && (
                <Alert severity={emailResults.successful === emailResults.total ? 'success' : 'warning'} sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Last email batch: {emailResults.successful}/{emailResults.total} successful
                    {emailResults.failed > 0 && ` (${emailResults.failed} failed)`}
                  </Typography>
                </Alert>
              )}
            </>
          )}
        </Paper>
      </Box>

      {/* Batch Email Dialog */}
      <BatchEmailDialog
        open={batchEmailDialog}
        onClose={() => setBatchEmailDialog(false)}
        volunteers={slackUsers}
        volunteerType="community members"
        accessToken={accessToken}
        orgId={getOrgId()}
        eventId={null}
        onComplete={handleEmailComplete}
        isSelectedUsers={true}
      />
    </Box>
  );
};

export default SocialMediaManagement;