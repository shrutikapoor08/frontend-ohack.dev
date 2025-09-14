import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container, Typography, TextField, Box } from '@mui/material';
import DramaticGiveawaySelector from '../components/admin/DramaticGiveawaySelector';

const theme = createTheme();

// Mock data for demo
const mockGiveaways = [
  {
    user_id: '1',
    entries: 8,
    user: {
      name: 'Alice Johnson',
      nickname: 'alicej',
      github: 'alice-codes',
      profile_image: 'https://avatars.githubusercontent.com/u/1?v=4'
    },
    giveaway_data: {
      githubEntries: 5,
      profileEntries: 3
    },
    timestamp: '2024-01-01T00:00:00Z'
  },
  {
    user_id: '2',
    entries: 6,
    user: {
      name: 'Bob Smith',
      nickname: 'bobsmith',
      github: 'bob-dev',
      profile_image: 'https://avatars.githubusercontent.com/u/2?v=4'
    },
    giveaway_data: {
      githubEntries: 4,
      profileEntries: 2
    },
    timestamp: '2024-01-02T00:00:00Z'
  },
  {
    user_id: '3',
    entries: 4,
    user: {
      name: 'Carol Davis',
      nickname: 'carold',
      github: 'carol-creates',
      profile_image: 'https://avatars.githubusercontent.com/u/3?v=4'
    },
    giveaway_data: {
      githubEntries: 2,
      profileEntries: 2
    },
    timestamp: '2024-01-03T00:00:00Z'
  },
  {
    user_id: '4',
    entries: 3,
    user: {
      name: 'David Wilson',
      nickname: 'davidw',
      github: 'david-builds',
      profile_image: 'https://avatars.githubusercontent.com/u/4?v=4'
    },
    giveaway_data: {
      githubEntries: 2,
      profileEntries: 1
    },
    timestamp: '2024-01-04T00:00:00Z'
  },
  {
    user_id: '5',
    entries: 7,
    user: {
      name: 'Eva Martinez',
      nickname: 'evam',
      github: 'eva-innovates',
      profile_image: 'https://avatars.githubusercontent.com/u/5?v=4'
    },
    giveaway_data: {
      githubEntries: 4,
      profileEntries: 3
    },
    timestamp: '2024-01-05T00:00:00Z'
  }
];

export default function DramaticGiveawayDemo() {
  const [randomSeed, setRandomSeed] = useState('12345');
  const [selectedWinner, setSelectedWinner] = useState(null);

  const handleWinnerSelected = (winner) => {
    setSelectedWinner(winner);
    console.log('Winner selected:', winner);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
          🎁 Dramatic Giveaway Selector Demo
        </Typography>
        
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          This demo shows the enhanced giveaway selection experience with:
        </Typography>
        
        <ul>
          <li>Transparent entry pool visualization</li>
          <li>Animated shuffling process</li>
          <li>Dramatic countdown and build-up</li>
          <li>Celebratory winner reveal with confetti</li>
          <li>Multi-stage selection process</li>
        </ul>

        <Box sx={{ my: 4 }}>
          <TextField
            label="Random Seed (for fair selection)"
            value={randomSeed}
            onChange={(e) => setRandomSeed(e.target.value)}
            type="number"
            sx={{ mb: 3, minWidth: 300 }}
            helperText="Enter any number for reproducible random selection"
          />
          
          <DramaticGiveawaySelector
            giveaways={mockGiveaways}
            randomSeed={randomSeed}
            onWinnerSelected={handleWinnerSelected}
          />
        </Box>

        {selectedWinner && (
          <Box sx={{ mt: 4, p: 3, bgcolor: 'success.light', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              🎉 Last Winner Selected:
            </Typography>
            <Typography>
              <strong>{selectedWinner.user.name}</strong> (@{selectedWinner.user.nickname}) 
              with {selectedWinner.entries} entries
            </Typography>
          </Box>
        )}

        <Typography variant="body2" sx={{ mt: 4, color: 'text.secondary', textAlign: 'center' }}>
          Demo data includes 5 participants with a total of {mockGiveaways.reduce((sum, g) => sum + g.entries, 0)} entries
        </Typography>
      </Container>
    </ThemeProvider>
  );
}