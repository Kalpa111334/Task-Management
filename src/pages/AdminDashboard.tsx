import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  List,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Card,
  CardContent,
  Divider,
  Avatar,
  LinearProgress,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Send,
  Add,
  People,
  Assignment,
  CheckCircle,
  Pending,
  Timeline,
  Check as CheckIcon,
  Close as CloseIcon,
  GetApp,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import type { User, ChatMessage } from '../../backend/src/types';
import Swal from 'sweetalert2';
import GradientBackground from '../components/GradientBackground';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => any;
    lastAutoTable: {
      finalY: number;
    };
  }
}

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



interface TaskType {
  id: string;
  title: string;
  description: string;
  assignedTo: string[];
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  deadline?: Date;
  submissionNote?: string;
  proofImage?: string;
  createdBy: string;
  rejectionReason?: string;
}

interface NewTask {
  title: string;
  description: string;
  assignedTo: string[];
  priority: 'low' | 'medium' | 'high';
  isShortTimeTask: boolean;
  deadline: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [stats, setStats] = useState({
    activeUsers: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    todaysTasks: 0,
  });
  const [employees, setEmployees] = useState<User[]>([]);
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [newTask, setNewTask] = useState<NewTask>({
    title: '',
    description: '',
    assignedTo: [],
    priority: 'medium',
    isShortTimeTask: false,
    deadline: ''
  });
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportType, setReportType] = useState<string>('all');
  const theme = useTheme();

  useEffect(() => {
    // Fetch initial data
    fetchEmployees();
    fetchTasks();
    fetchMessages();

    // Socket listeners
    socket?.on('user-status-change', updateActiveUsers);
    socket?.on('task-update', handleTaskUpdate);
    socket?.on('chat-message', handleNewMessage);

    return () => {
      socket?.off('user-status-change');
      socket?.off('task-update');
      socket?.off('chat-message');
    };
  }, [socket]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/users');
      setEmployees(response.data.filter((u: User) => u.role === 'employee'));
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/tasks');
      const allTasks = response.data;
      setTasks(allTasks);
      
      // Update statistics
      const today = new Date().setHours(0, 0, 0, 0);
      setStats({
        activeUsers: employees.length,
        totalTasks: allTasks.length,
        completedTasks: allTasks.filter((t: TaskType) => t.status === 'approved').length,
        pendingTasks: allTasks.filter((t: TaskType) => t.status === 'pending').length,
        todaysTasks: allTasks.filter((t: TaskType) => new Date(t.createdAt).setHours(0, 0, 0, 0) === today).length,
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/messages');
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedEmployee) {
      await Swal.fire({
        icon: 'warning',
        title: 'Invalid Message',
        text: !selectedEmployee ? 'Please select an employee first' : 'Please enter a message',
        toast: true,
        position: 'top-end',
        timer: 3000,
        showConfirmButton: false
      });
      return;
    }

    try {
      const messageData: Omit<ChatMessage, 'id'> = {
        content: newMessage,
        senderId: user?.id || '',
        receiverId: selectedEmployee,
        timestamp: new Date()
      };

      const response = await axios.post('http://localhost:3000/api/messages', messageData);
      
      if (!response.data) {
        throw new Error('No response from server');
      }

      socket?.emit('chat-message', response.data);
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      
      await Swal.fire({
        icon: 'success',
        title: 'Message Sent',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Please try again';
      
      await Swal.fire({
        icon: 'error',
        title: 'Failed to send message',
        text: errorMessage,
        confirmButtonText: 'OK'
      });
    }
  };

  const handleTaskUpdate = (updatedTask: TaskType) => {
    setTasks(prev => prev.map(task => task.id === updatedTask.id ? updatedTask : task));
    fetchTasks();
  };

  const handleNewMessage = (message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  };

  const updateActiveUsers = (count: number) => {
    setStats(prev => ({ ...prev, activeUsers: count }));
  };

  const handleCreateTask = async () => {
    try {
      const taskData: Omit<TaskType, 'id' | 'status' | 'updatedAt'> = {
        ...newTask,
        createdBy: user?.id || '',
        createdAt: new Date(),
        deadline: newTask.isShortTimeTask ? new Date(newTask.deadline) : undefined
      };

      await axios.post('http://localhost:3000/api/tasks', taskData);
      setOpenTaskDialog(false);
      setNewTask({
        title: '',
        description: '',
        assignedTo: [],
        priority: 'medium',
        isShortTimeTask: false,
        deadline: ''
      });
      fetchTasks();

      await Swal.fire({
        icon: 'success',
        title: 'Task Created',
        text: 'The task has been assigned successfully',
        toast: true,
        position: 'top-end',
        timer: 3000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error creating task:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to create task'
      });
    }
  };

  const handleTaskAction = async (taskId: string, action: 'approve' | 'reject', rejectionReason?: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const updatedTask: TaskType = {
        ...task,
        status: action === 'approve' ? 'approved' : 'rejected',
        updatedAt: new Date(),
        rejectionReason: rejectionReason
      };

      await axios.post(`http://localhost:3000/api/tasks/${taskId}`, updatedTask);
      fetchTasks();

      await Swal.fire({
        icon: action === 'approve' ? 'success' : 'info',
        title: `Task ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        text: action === 'approve' 
          ? 'The task has been approved successfully'
          : `The task has been rejected. Reason: ${rejectionReason}`,
        toast: true,
        position: 'top-end',
        timer: 3000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error updating task:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Failed to ${action} task`
      });
    }
  };

  const handleReject = async (taskId: string) => {
    const { value: rejectionReason } = await Swal.fire({
      title: 'Rejection Reason',
      input: 'text',
      inputLabel: 'Please provide a reason for rejection',
      inputPlaceholder: 'Enter reason here...',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return 'You need to provide a reason!';
        }
        return null;
      }
    });

    if (rejectionReason) {
      await handleTaskAction(taskId, 'reject', rejectionReason);
    }
  };

  const handleReviewTask = (task: TaskType) => {
    setSelectedTask(task);
    setOpenReviewDialog(true);
  };

  const generateEmployeeTaskReport = async (employeeId?: string) => {
    try {
      if (!tasks.length) {
        throw new Error('No tasks available to generate report');
      }

      setIsGeneratingReport(true);
      const doc = new jsPDF();
      autoTable(doc, {}); // Initialize for this instance
      
      // Title with better positioning
      doc.setFontSize(20);
      doc.text('Employee Task Report', 20, 20);
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);

      // Filter tasks and handle empty results
      const filteredTasks = employeeId 
        ? tasks.filter(task => task.assignedTo.includes(employeeId))
        : tasks;
      
      if (!filteredTasks.length) {
        throw new Error('No tasks found for the selected criteria');
      }

      const employee = employeeId 
        ? employees.find(emp => emp.id === employeeId)
        : null;

      if (employeeId && !employee) {
        throw new Error('Selected employee not found');
      }

      if (employee) {
        doc.text(`Employee: ${employee.username}`, 20, 40);
      }

      // Task Statistics with null checks
      const taskStats = {
        total: filteredTasks.length,
        completed: filteredTasks.filter(t => t.status === 'approved').length,
        pending: filteredTasks.filter(t => t.status === 'pending').length,
        rejected: filteredTasks.filter(t => t.status === 'rejected').length
      };

      // Add statistics table with error handling
      try {
        autoTable(doc, {
          startY: employee ? 50 : 40,
          head: [['Metric', 'Value']],
          body: [
            ['Total Tasks', taskStats.total],
            ['Completed Tasks', taskStats.completed],
            ['Pending Tasks', taskStats.pending],
            ['Rejected Tasks', taskStats.rejected],
            ['Completion Rate', `${((taskStats.completed / taskStats.total) * 100).toFixed(1)}%`]
          ],
          theme: 'grid',
          styles: { fontSize: 10 },
          headStyles: { fillColor: [33, 150, 243] }
        });

        // Add task details table with safe date handling
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 10,
          head: [['Task Title', 'Status', 'Priority', 'Created', 'Deadline']],
          body: filteredTasks.map(task => [
            task.title || 'Untitled',
            task.status || 'Unknown',
            task.priority || 'Not set',
            new Date(task.createdAt).toLocaleDateString(),
            task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'
          ]),
          theme: 'grid',
          styles: { fontSize: 10 },
          headStyles: { fillColor: [33, 150, 243] }
        });

        // Save with error handling
        const fileName = employee 
          ? `${employee.username}_task_report_${new Date().toISOString().split('T')[0]}.pdf`
          : `all_employees_task_report_${new Date().toISOString().split('T')[0]}.pdf`;
        
        doc.save(fileName);

        await Swal.fire({
          icon: 'success',
          title: 'Report Generated',
          text: `The report has been downloaded as ${fileName}`,
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
      } catch (error) {
        throw new Error('Error generating PDF tables: ' + (error as Error).message);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error instanceof Error ? error.message : 'Failed to generate the report. Please try again.'
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const renderReportingSection = () => (
    <Paper sx={{ 
      p: { xs: 2, md: 3 }, 
      mt: { xs: 2, md: 3 }
    }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: 2
      }}>
        <Typography variant="h6">Task Reports</Typography>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          width: { xs: '100%', sm: 'auto' }
        }}>
          <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }}>
            <InputLabel>Report Type</InputLabel>
            <Select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              label="Report Type"
            >
              <MenuItem value="all">All Employees</MenuItem>
              {employees.map(emp => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.username}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={isGeneratingReport ? <CircularProgress size={20} color="inherit" /> : <GetApp />}
            onClick={() => generateEmployeeTaskReport(reportType === 'all' ? undefined : reportType)}
            disabled={isGeneratingReport}
            fullWidth={useMediaQuery(theme.breakpoints.down('sm'))}
          >
            {isGeneratingReport ? 'Generating...' : 'Generate Report'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );

  return (
    <GradientBackground>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Statistics Cards */}
        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: { xs: 2, md: 4 } }}>
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <StatCard
              title="Active Users"
              value={stats.activeUsers}
              icon={<People />}
              color="#2196f3"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <StatCard
              title="Today's Tasks"
              value={stats.todaysTasks}
              icon={<Assignment />}
              color="#4caf50"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <StatCard
              title="Completed Tasks"
              value={stats.completedTasks}
              icon={<CheckCircle />}
              color="#ff9800"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <StatCard
              title="Pending Tasks"
              value={stats.pendingTasks}
              icon={<Pending />}
              color="#f44336"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <StatCard
              title="Total Tasks"
              value={stats.totalTasks}
              icon={<Timeline />}
              color="#9c27b0"
            />
          </Grid>
        </Grid>

        {/* Main Content */}
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {/* Task Management */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ 
              p: { xs: 2, md: 3 }, 
              height: { xs: 'auto', md: '600px' }, 
              overflow: 'auto',
              mb: { xs: 2, md: 0 }
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Task Management</Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setOpenTaskDialog(true)}
                >
                  Create Task
                </Button>
              </Box>
              
              <List>
                {tasks.map((task) => (
                  <Paper key={task.id} sx={{ mb: 2, p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="h6">{task.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {task.description}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          {task.assignedTo.map((userId) => {
                            const assignedUser = employees.find(e => e.id === userId);
                            return (
                              <Chip
                                key={userId}
                                label={assignedUser?.username || 'Unknown'}
                                size="small"
                                sx={{ mr: 1 }}
                              />
                            );
                          })}
                        </Box>
                        {task.status === 'submitted' && (
                          <Button
                            size="small"
                            onClick={() => handleReviewTask(task)}
                            sx={{ mt: 1 }}
                            variant="outlined"
                          >
                            Review Submission
                          </Button>
                        )}
                      </Box>
                      <Box>
                        <Chip
                          label={task.status}
                          color={task.status === 'approved' ? 'success' : 
                                task.status === 'rejected' ? 'error' :
                                task.status === 'submitted' ? 'info' : 'warning'}
                        />
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

          {/* Chat Section */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ 
              p: { xs: 2, md: 3 }, 
              height: { xs: 'auto', md: '600px' }, 
              display: 'flex', 
              flexDirection: 'column'
            }}>
              <Typography variant="h5" sx={{ mb: 2 }}>Team Chat</Typography>
              
              <FormControl sx={{ mb: 2 }}>
                <InputLabel>Select Employee</InputLabel>
                <Select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  label="Select Employee"
                >
                  {employees.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.username}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

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
                  disabled={!selectedEmployee || !newMessage.trim()}
                >
                  <Send />
                </IconButton>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Task Dialog */}
        <Dialog 
          open={openTaskDialog} 
          onClose={() => setOpenTaskDialog(false)} 
          maxWidth="sm" 
          fullWidth
          fullScreen={useMediaQuery(theme.breakpoints.down('sm'))}
        >
          <DialogTitle>Create New Task</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Assign To</InputLabel>
              <Select
                multiple
                value={newTask.assignedTo}
                onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value as string[] })}
                label="Assign To"
              >
                {employees.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>
                    {employee.username}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Priority</InputLabel>
              <Select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'low' | 'medium' | 'high' })}
                label="Priority"
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography>Short Time Task?</Typography>
                <Button
                  variant={newTask.isShortTimeTask ? "contained" : "outlined"}
                  onClick={() => setNewTask({ ...newTask, isShortTimeTask: !newTask.isShortTimeTask })}
                >
                  {newTask.isShortTimeTask ? "Yes" : "No"}
                </Button>
              </Box>
            </FormControl>
            {newTask.isShortTimeTask && (
              <TextField
                fullWidth
                label="Deadline"
                type="datetime-local"
                value={newTask.deadline}
                onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenTaskDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateTask} variant="contained" color="primary">
              Create Task
            </Button>
          </DialogActions>
        </Dialog>

        {/* Task Review Dialog */}
        <Dialog 
          open={openReviewDialog} 
          onClose={() => setOpenReviewDialog(false)}
          maxWidth="md"
          fullWidth
          fullScreen={useMediaQuery(theme.breakpoints.down('sm'))}
        >
          <DialogTitle>Review Task Submission</DialogTitle>
          <DialogContent>
            {selectedTask && (
              <>
                <Typography variant="h6" gutterBottom>
                  {selectedTask.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedTask.description}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  Submission Details
                </Typography>
                {selectedTask.submissionNote && (
                  <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2">
                      {selectedTask.submissionNote}
                    </Typography>
                  </Paper>
                )}
                
                {selectedTask.proofImage && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Proof of Completion
                    </Typography>
                    <Box
                      component="img"
                      src={`http://localhost:3000${selectedTask.proofImage}`}
                      alt="Task proof"
                      sx={{
                        maxWidth: '100%',
                        maxHeight: '300px',
                        objectFit: 'contain',
                        border: '1px solid',
                        borderColor: 'grey.300',
                        borderRadius: 1
                      }}
                    />
                  </Box>
                )}

                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckIcon />}
                    onClick={() => handleTaskAction(selectedTask.id, 'approve')}
                    fullWidth
                  >
                    Approve Task
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<CloseIcon />}
                    onClick={() => handleReject(selectedTask.id)}
                    fullWidth
                  >
                    Reject Task
                  </Button>
                </Box>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenReviewDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {renderReportingSection()}
      </Container>
    </GradientBackground>
  );
};

export default AdminDashboard; 