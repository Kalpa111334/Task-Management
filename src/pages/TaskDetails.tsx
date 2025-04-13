import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Alert,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { Task, User } from '../../backend/src/types';
import axios from 'axios';
import TaskProofDialog from '../components/TaskProofDialog';
import ChatBox from '../components/ChatBox';
import Swal from 'sweetalert2';

const TaskDetails: React.FC = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [task, setTask] = useState<Task | null>(null);
  const [assignedUsers, setAssignedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProof, setShowProof] = useState(false);

  useEffect(() => {
    if (taskId) {
      fetchTaskDetails();
    } else {
      setError('Invalid task ID');
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (socket) {
      socket.on('task-update', (updatedTask: Task) => {
        if (updatedTask.id === taskId) {
          setTask(updatedTask);
        }
      });

      return () => {
        socket.off('task-update');
      };
    }
  }, [socket, taskId]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [taskResponse, usersResponse] = await Promise.all([
        axios.get(`http://localhost:3000/api/tasks/${taskId}`),
        axios.get('http://localhost:3000/api/users'),
      ]);

      if (!taskResponse.data) {
        throw new Error('Task not found');
      }

      setTask(taskResponse.data);
      const users = usersResponse.data.filter((u: User) =>
        taskResponse.data.assignedTo.includes(u.id)
      );
      setAssignedUsers(users);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setError('Task not found');
      } else if (axios.isAxiosError(error) && !error.response) {
        setError('Network error. Please check your connection.');
      } else {
        setError('An error occurred while fetching the task.');
      }
      console.error('Error fetching task details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: 'pending' | 'submitted' | 'approved' | 'rejected') => {
    if (!task) return;
    
    try {
      const updatedTask = {
        ...task,
        status: newStatus
      };

      await axios.put(`http://localhost:3000/api/tasks/${task.id}`, updatedTask);
      setTask(updatedTask);
      
      await Swal.fire({
        title: 'Success',
        text: 'Task status updated successfully',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to update task status',
        icon: 'error'
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate(`/${user?.role}/tasks`)} 
          sx={{ mt: 2 }}
        >
          Back to Tasks
        </Button>
      </Box>
    );
  }

  if (!task) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h6">Task not found</Typography>
        <Button 
          variant="contained"
          onClick={() => navigate(`/${user?.role}/tasks`)} 
          sx={{ mt: 2 }}
        >
          Back to Tasks
        </Button>
      </Box>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'warning';
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5">{task.title}</Typography>
            <Chip
              label={task.status}
              color={getStatusColor(task.status)}
              sx={{ ml: 2 }}
            />
          </Box>
          <Typography variant="body1" paragraph>
            {task.description}
          </Typography>
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Assigned Users:
            </Typography>
            <List>
              {assignedUsers.map((assignedUser) => (
                <ListItem key={assignedUser.id}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                      {assignedUser.username.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={assignedUser.username}
                    secondary={`Role: ${assignedUser.role}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Task Information:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Created: {new Date(task.createdAt).toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Last Updated: {new Date(task.updatedAt).toLocaleString()}
            </Typography>
          </Box>
          {task.proofImage && (
            <Box sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                onClick={() => setShowProof(true)}
              >
                View Proof
              </Button>
            </Box>
          )}
          {user?.role === 'admin' && task.status === 'pending' && (
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="success"
                onClick={() => handleStatusChange('approved')}
              >
                Approve
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => handleStatusChange('rejected')}
              >
                Reject
              </Button>
            </Box>
          )}
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <ChatBox
          messages={[]} // You'll need to implement task-specific messages
          onSendMessage={(content) => {
            // Implement task-specific message sending
            console.log('Send message:', content);
          }}
          title="Task Discussion"
        />
      </Grid>

      <TaskProofDialog
        task={showProof ? task : null}
        onClose={() => setShowProof(false)}
      />
    </Grid>
  );
};

export default TaskDetails; 