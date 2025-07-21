// src/components/History.tsx
import { Box, Typography, Paper, Avatar, Divider } from '@mui/material';
import { Person, SmartToy } from '@mui/icons-material';
import { memo } from 'react';

// Enhanced TypeScript interfaces with better documentation
export interface Message {
  prompt: string;
  answer: string;
  timestamp?: string;
  id?: string;
}

export interface RagResponseHistory {
  _id: string;
  datetime: string;
  messages: Message[];
  sessionName?: string;
}

interface HistoryProps {
  messages: RagResponseHistory;
  showTimestamp?: boolean;
  maxWidth?: string | number;
}

const History = memo<HistoryProps>(({ 
  messages, 
  maxWidth = '75%' 
}) => {
  // Handle empty state
  if (!messages || !messages.messages || messages.messages.length === 0) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center"
        p={4}
        textAlign="center"
      >
        <SmartToy sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No conversation history
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Start a conversation to see your chat history here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      gap={2}
      sx={{ 
        width: '100%',
        maxHeight: '70vh',
        overflowY: 'auto',
        px: 1
      }}
    >

      {messages.messages.map((msg, idx) => (
        <Box key={msg.id || idx} display="flex" flexDirection="column" gap={1.5}>
          {/* User message */}
          <Box display="flex" justifyContent="flex-end" alignItems="flex-start" gap={1}>
            <Paper
              elevation={1}
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                p: 2,
                maxWidth,
                borderRadius: '18px 18px 4px 18px',
                wordBreak: 'break-word',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  borderLeft: '10px solid transparent',
                  borderTop: '10px solid',
                  borderTopColor: 'primary.main',
                }
              }}
            >
              <Typography 
                variant="body1" 
                component="div"
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.4
                }}
              >
                {msg.prompt}
              </Typography>
            </Paper>
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: 'primary.main',
                mt: 0.5
              }}
            >
              <Person sx={{ fontSize: 18 }} />
            </Avatar>
          </Box>

          {/* AI response */}
          <Box display="flex" justifyContent="flex-start" alignItems="flex-start" gap={1}>
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: 'secondary.main',
                mt: 0.5
              }}
            >
              <SmartToy sx={{ fontSize: 18 }} />
            </Avatar>
            <Paper
              elevation={1}
              sx={{
                bgcolor: 'grey.100',
                color: 'text.primary',
                p: 2,
                maxWidth,
                borderRadius: '18px 18px 18px 4px',
                wordBreak: 'break-word',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  borderRight: '10px solid transparent',
                  borderTop: '10px solid',
                  borderTopColor: 'grey.100',
                }
              }}
            >
              <Typography 
                variant="body1" 
                component="div"
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.5
                }}
              >
                {msg.answer}
              </Typography>
            </Paper>
          </Box>

          {/* Add subtle divider between message pairs except for the last one */}
          {idx < messages.messages.length - 1 && (
            <Divider 
              sx={{ 
                my: 1, 
                mx: 4,
                opacity: 0.3
              }} 
            />
          )}
        </Box>
      ))}
      
      {/* Scroll anchor for auto-scroll to bottom */}
      <Box id="history-bottom" />
    </Box>
  );
});

History.displayName = 'History';

export default History;
