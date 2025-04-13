import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  IconButton,
} from '@mui/material';
import { Send } from '@mui/icons-material';
import { ChatMessage } from '../../backend/src/types';
import { useAuth } from '../contexts/AuthContext';

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  title?: string;
}

const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  onSendMessage,
  disabled = false,
  title = 'Chat',
}) => {
  const [newMessage, setNewMessage] = useState('');
  const { user } = useAuth();

  const handleSend = () => {
    if (newMessage.trim() && !disabled) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Paper sx={{ p: 2, height: '70vh', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              justifyContent: message.senderId === user?.id ? 'flex-end' : 'flex-start',
              mb: 1,
            }}
          >
            <Paper
              sx={{
                p: 1,
                backgroundColor: message.senderId === user?.id ? 'primary.main' : 'grey.200',
                color: message.senderId === user?.id ? 'white' : 'black',
                maxWidth: '70%',
              }}
            >
              <Typography variant="body2">{message.content}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </Typography>
            </Paper>
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={disabled}
          multiline
          maxRows={3}
        />
        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={disabled || !newMessage.trim()}
        >
          <Send />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default ChatBox; 