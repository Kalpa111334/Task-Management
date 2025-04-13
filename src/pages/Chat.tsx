import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
  Grid,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';

interface Message {
  id?: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
}

interface ChatUser {
  id: string;
  username: string;
  name: string;
  role: string;
}

const Chat: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const { socket } = useSocket();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('chat-message', (message: Message) => {
        setMessages(prev => [...prev, message]);
      });

      return () => {
        socket.off('chat-message');
      };
    }
  }, [socket]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/users');
      const filteredUsers = response.data.filter((u: ChatUser) => u.id !== user?.id);
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMessages = async (userId: string) => {
    try {
      const response = await axios.get('http://localhost:3000/api/messages');
      const userMessages = response.data.filter(
        (m: Message) =>
          (m.senderId === user?.id && m.receiverId === userId) ||
          (m.senderId === userId && m.receiverId === user?.id)
      );
      setMessages(userMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleUserSelect = (selectedUser: ChatUser) => {
    setSelectedUser(selectedUser);
    fetchMessages(selectedUser.id);
  };

  const handleSendMessage = async () => {
    if (!selectedUser || !newMessage.trim() || !user?.id) return;

    try {
      const messageData: Omit<Message, 'id'> = {
        senderId: user.id,
        receiverId: selectedUser.id,
        content: newMessage,
        timestamp: new Date()
      };

      const response = await axios.post('http://localhost:3000/api/messages', messageData);
      
      setMessages((prev: Message[]) => [...prev, response.data]);
      socket?.emit('new-message', response.data);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <Grid container spacing={2} sx={{ height: 'calc(100vh - 88px)' }}>
      <Grid item xs={12} sm={4} md={3}>
        <Paper
          sx={{
            height: '100%',
            overflow: 'auto',
            borderRadius: 2,
            display: isMobile && selectedUser ? 'none' : 'block',
          }}
        >
          <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            Chats
          </Typography>
          <List>
            {users.map((user) => (
              <ListItem
                button
                key={user.id}
                onClick={() => handleUserSelect(user)}
                selected={selectedUser?.id === user.id}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.primary.main + '20',
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                    {user.name.charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={user.name}
                  secondary={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={8} md={9}>
        {selectedUser ? (
          <Paper
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
            }}
          >
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">{selectedUser.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
              </Typography>
            </Box>
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
              {messages.map((message, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: message.senderId === user?.id ? 'flex-end' : 'flex-start',
                    mb: 2,
                  }}
                >
                  <Paper
                    sx={{
                      p: 2,
                      maxWidth: '70%',
                      backgroundColor:
                        message.senderId === user?.id
                          ? theme.palette.primary.main
                          : theme.palette.background.default,
                      color:
                        message.senderId === user?.id
                          ? theme.palette.primary.contrastText
                          : theme.palette.text.primary,
                    }}
                  >
                    <Typography variant="body1">{message.content}</Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 0.5,
                        color:
                          message.senderId === user?.id
                            ? 'rgba(255, 255, 255, 0.7)'
                            : theme.palette.text.secondary,
                      }}
                    >
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </Typography>
                  </Paper>
                </Box>
              ))}
            </Box>
            <Divider />
            <Box sx={{ p: 2, backgroundColor: theme.palette.background.default }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  size="small"
                />
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </Box>
          </Paper>
        ) : (
          <Paper
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Select a chat to start messaging
            </Typography>
          </Paper>
        )}
      </Grid>
    </Grid>
  );
};

export default Chat; 