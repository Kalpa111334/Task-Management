import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Button,
  TextField,
  IconButton,
  Chip,
  Card,
  CardContent,
  Avatar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CardActions,
  CircularProgress
} from '@mui/material';
import {
  Send,
  Assignment,
  CheckCircle,
  Pending,
  Upload,
  Message,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import { Task, ChatMessage } from '../../backend/src/types';
import Swal from 'sweetalert2';
import GradientBackground from '../components/GradientBackground';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const StatCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%', background: `linear-gradient(45deg, ${color} 0%, ${color}99 100%)` }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', mr: 2 }}>{icon}</Avatar>
        <Typography variant="h6" color="white">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" color="white" sx={{ textAlign: 'center', my: 2 }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [adminId, setAdminId] = useState<string>('');
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    todaysTasks: 0,
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submissionNote, setSubmissionNote] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openSubmitDialog, setOpenSubmitDialog] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchMessages();
    fetchAdminId();

    socket?.on('task-update', handleTaskUpdate);
    socket?.on('chat-message', handleNewMessage);

    return () => {
      socket?.off('task-update');
      socket?.off('chat-message');
    };
  }, [socket]);

  const fetchAdminId = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/users');
      const admin = response.data.find((user: any) => user.role === 'admin');
      if (admin) {
        setAdminId(admin.id);
      }
    } catch (error) {
      console.error('Error fetching admin:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/tasks');
      const userTasks = response.data.filter((task: Task) => 
        task.assignedTo.includes(user?.id || '')
      );
      setTasks(userTasks);

      // Update statistics
      const today = new Date().setHours(0, 0, 0, 0);
      setStats({
        totalTasks: userTasks.length,
        completedTasks: userTasks.filter((t: Task) => t.status === 'approved').length,
        pendingTasks: userTasks.filter((t: Task) => t.status === 'pending').length,
        todaysTasks: userTasks.filter((t: Task) => new Date(t.createdAt).setHours(0, 0, 0, 0) === today).length,
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/messages');
      const userMessages = response.data.filter((msg: ChatMessage) =>
        msg.senderId === user?.id || msg.receiverId === user?.id
      );
      setMessages(userMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    if (updatedTask.assignedTo.includes(user?.id || '')) {
      setTasks(prev => prev.map(task => task.id === updatedTask.id ? updatedTask : task));
      fetchTasks(); // Refresh statistics
    }
  };

  const handleNewMessage = (message: ChatMessage) => {
    if (message.senderId === user?.id || message.receiverId === user?.id) {
      setMessages(prev => [...prev, message]);
    }
  };

  const handleSendMessage = async () => {
    try {
      // Validate message
      if (!newMessage.trim()) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Message',
          text: 'Please enter a message before sending.',
        });
        return;
      }

      const response = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          content: newMessage,
          receiverId: adminId, // Assuming adminId is available in the component
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }

      const newMessageData = await response.json();
      setMessages((prev) => [...prev, newMessageData]);
      setNewMessage('');
      
      // Emit socket event for real-time update
      socket?.emit('new_message', {
        senderId: user?.id,
        receiverId: adminId,
        content: newMessage,
      });

    } catch (error) {
      console.error('Error sending message:', error);
      Swal.fire({
        icon: 'error',
        title: 'Message Send Failed',
        text: error instanceof Error ? error.message : 'Failed to send message. Please try again.',
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleSubmitTask = async () => {
    if (!selectedTask || !selectedFile) return;

    setIsSubmitting(true);
    try {
      // Upload proof image
      const formData = new FormData();
      formData.append('proof', selectedFile);
      const uploadResponse = await axios.post(
        `http://localhost:3000/api/tasks/${selectedTask.id}/proof`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Update task status
      const updatedTask = {
        ...selectedTask,
        status: 'submitted',
        submissionNote,
        proofImage: uploadResponse.data.proofImage,
        updatedAt: new Date()
      };

      await axios.post(`http://localhost:3000/api/tasks/${selectedTask.id}`, updatedTask);
      
      setOpenSubmitDialog(false);
      setSelectedTask(null);
      setSubmissionNote('');
      setSelectedFile(null);
      fetchTasks();

      await Swal.fire({
        icon: 'success',
        title: 'Task Submitted',
        text: 'Your task has been submitted for review',
        toast: true,
        position: 'top-end',
        timer: 3000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error submitting task:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to submit task'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#ffa726';
      case 'submitted':
        return '#42a5f5';
      case 'approved':
        return '#66bb6a';
      case 'rejected':
        return '#ef5350';
      default:
        return '#757575';
    }
  };

  return (
    <GradientBackground>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Tasks"
              value={stats.totalTasks}
              icon={<Assignment />}
              color="#2196f3"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Today's Tasks"
              value={stats.todaysTasks}
              icon={<Assignment />}
              color="#4caf50"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Completed"
              value={stats.completedTasks}
              icon={<CheckCircle />}
              color="#ff9800"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pending"
              value={stats.pendingTasks}
              icon={<Pending />}
              color="#f44336"
            />
          </Grid>
        </Grid>

        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Tasks */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, height: '600px', overflow: 'auto' }}>
              <Typography variant="h5" gutterBottom>
                My Tasks
              </Typography>
              <List>
                {tasks.map((task) => (
                  <Paper key={task.id} sx={{ mb: 2, p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="h6">{task.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {task.description}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={task.status}
                          color={task.status === 'approved' ? 'success' : 
                                task.status === 'rejected' ? 'error' :
                                task.status === 'submitted' ? 'info' : 'warning'}
                        />
                        {task.status === 'pending' && (
                          <Button
                            variant="contained"
                            startIcon={<Upload />}
                            onClick={() => {
                              setSelectedTask(task);
                              setOpenSubmitDialog(true);
                            }}
                          >
                            Submit
                          </Button>
                        )}
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={task.status === 'approved' ? 100 :
                             task.status === 'submitted' ? 75 :
                             task.status === 'rejected' ? 0 : 50}
                      sx={{ mt: 2 }}
                    />
                  </Paper>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Chat */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '600px', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h5" sx={{ mb: 2 }}>Chat with Admin</Typography>
              
              <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
                {messages.map((message) => {
                  const isOwn = message.senderId === user?.id;
                  return (
                    <Box
                      key={message.id}
                      sx={{
                        display: 'flex',
                        justifyContent: isOwn ? 'flex-end' : 'flex-start',
                        mb: 1,
                      }}
                    >
                      <Paper
                        sx={{
                          p: 1,
                          backgroundColor: isOwn ? 'primary.main' : 'grey.200',
                          color: isOwn ? 'white' : 'black',
                          maxWidth: '80%',
                        }}
                      >
                        <Typography variant="body2">{message.content}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </Typography>
                      </Paper>
                    </Box>
                  );
                })}
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Send />
                </IconButton>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Task Submission Dialog */}
        <Dialog open={openSubmitDialog} onClose={() => setOpenSubmitDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Submit Task</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Submission Note"
              multiline
              rows={4}
              value={submissionNote}
              onChange={(e) => setSubmissionNote(e.target.value)}
              margin="normal"
            />
            <Box sx={{ mt: 2 }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="proof-file"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="proof-file">
                <Button variant="outlined" component="span">
                  Upload Proof Image
                </Button>
              </label>
              {selectedFile && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected file: {selectedFile.name}
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenSubmitDialog(false)}>Cancel</Button>
            <Button
              onClick={handleSubmitTask}
              variant="contained"
              color="primary"
              disabled={isSubmitting || !selectedFile}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'Submit'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </GradientBackground>
  );
};

export default EmployeeDashboard; 