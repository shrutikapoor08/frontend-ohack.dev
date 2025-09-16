import React from "react";
import { Box, Typography, Button, Rating, Paper } from "@mui/material";
import FeedbackIcon from "@mui/icons-material/Feedback";
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { styled } from '@mui/material/styles';
import Link from 'next/link';

const StyledRating = styled(Rating)({
  '& .MuiRating-iconFilled': {
    color: '#ff6d75',
  },
  '& .MuiRating-iconHover': {
    color: '#ff3d47',
  },
});

/**
 * Public-facing feedback component
 * Shows community feedback without privacy toggles or internal management features
 * Suitable for public profile viewing
 */
export default function PublicFeedback({ feedbackUrl, history, userName }) {
  const displayHistory = history || {};
  
  // Calculate overall community rating from feedback data
  const calculateCommunityRating = () => {
    const what = displayHistory.what || {};
    const how = displayHistory.how || {};
    
    const allValues = [...Object.values(what), ...Object.values(how)];
    const validValues = allValues.filter(val => typeof val === 'number' && val > 0);
    
    if (validValues.length === 0) return 0;
    
    const average = validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
    return Math.min(5, average * 5); // Convert to 5-star scale
  };

  const communityRating = calculateCommunityRating();
  const hasHistory = Object.keys(displayHistory).length > 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {hasHistory && communityRating > 0 ? (
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 3, 
            backgroundColor: 'action.hover',
            borderRadius: 2 
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              Community Rating
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <StyledRating
                value={communityRating}
                precision={0.1}
                readOnly
                icon={<FavoriteIcon fontSize="inherit" />}
                emptyIcon={<FavoriteBorderIcon fontSize="inherit" />}
              />
              <Typography variant="body1" color="text.secondary">
                {communityRating.toFixed(1)} out of 5 hearts
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              Based on community feedback and contributions
            </Typography>
          </Box>
        </Paper>
      ) : (
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 3, 
            backgroundColor: 'action.hover',
            borderRadius: 2,
            textAlign: 'center'
          }}
        >
          <Typography variant="body1" sx={{ mb: 2 }}>
            No community feedback available yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Be the first to share feedback about this community member!
          </Typography>
        </Paper>
      )}

      {/* Call to action */}
      <Box sx={{ 
        p: 2, 
        backgroundColor: 'primary.light', 
        borderRadius: 1,
        textAlign: 'center'
      }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Want to share feedback or connect?
        </Typography>
        <Button
          variant="contained"
          startIcon={<FeedbackIcon />}
          component={Link}
          href={feedbackUrl}
          size="large"
        >
          Send Feedback to {userName || "User"}
        </Button>
      </Box>
    </Box>
  );
}