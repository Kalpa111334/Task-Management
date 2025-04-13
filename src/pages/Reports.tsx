import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  useMediaQuery,
  Paper,
  Fade,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  IconButton,
  Tabs,
  Tab,
  Chip,
  LinearProgress,
  Divider,
  Stack,
  Container,
  TextField,
  Autocomplete,
} from '@mui/material';
import {
  Timeline,
  Assessment,
  TrendingUp,
  Warning,
  Download,
  Preview,
  Speed as SpeedIcon,
  Group as GroupIcon,
  DateRange as DateRangeIcon,
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  PictureAsPdf as PdfIcon,
  Person,
  Assignment,
} from '@mui/icons-material';
import { Task, User } from '../../backend/src/types';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import GradientBackground from '../components/GradientBackground';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  rejected: number;
  inProgress: number;
  averageCompletionTime: number;
  onTimeDeliveryRate: number;
  tasksByPriority: {
    high: number;
    medium: number;
    low: number;
  };
  tasksByDate: {
    dates: string[];
    counts: number[];
  };
}

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  onTimeDelivery: number;
  averageCompletionTime: number;
  highPriorityCompleted: number;
}

interface EmployeeStats {
  userId: string;
  username: string;
  name: string;
  tasksCompleted: number;
  tasksPending: number;
  tasksRejected: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  completionRate: number;
  averageCompletionTime: number;
  onTimeDeliveryRate: number;
  highPriorityCompletion: number;
  performanceScore: number;
  taskHistory: {
    dates: string[];
    completed: number[];
  };
}

interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

interface ReportData {
  taskStats: TaskStats;
  employeePerformance: EmployeeStats[];
  dateRange: DateRange;
  generatedAt: Date;
}

interface ReportFilters {
  employees: string[];
  dateRange: {
    start: Date;
    end: Date;
  };
  taskStatus: string[];
  priority: string[];
}

const Reports: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: startOfWeek(new Date()),
    endDate: endOfWeek(new Date()),
    label: 'This Week'
  });
  const [taskStats, setTaskStats] = useState<TaskStats>({
    total: 0,
    completed: 0,
    pending: 0,
    rejected: 0,
    inProgress: 0,
    averageCompletionTime: 0,
    onTimeDeliveryRate: 0,
    tasksByPriority: {
      high: 0,
      medium: 0,
      low: 0
    },
    tasksByDate: {
      dates: [],
      counts: []
    }
  });
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [employees, setEmployees] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    completedTasks: 0,
    onTimeDelivery: 0,
    averageCompletionTime: 0,
    highPriorityCompleted: 0
  });
  const [filters, setFilters] = useState<ReportFilters>({
    employees: [],
    dateRange: {
      start: subDays(new Date(), 30),
      end: new Date(),
    },
    taskStatus: ['pending', 'approved', 'rejected'],
    priority: ['low', 'medium', 'high'],
  });

  // Date range presets
  const dateRangePresets = [
    {
      label: 'Today',
      getValue: () => ({
        startDate: new Date(),
        endDate: new Date(),
        label: 'Today'
      })
    },
    {
      label: 'This Week',
      getValue: () => ({
        startDate: startOfWeek(new Date()),
        endDate: endOfWeek(new Date()),
        label: 'This Week'
      })
    },
    {
      label: 'This Month',
      getValue: () => ({
        startDate: startOfMonth(new Date()),
        endDate: endOfMonth(new Date()),
        label: 'This Month'
      })
    },
    {
      label: 'Last 7 Days',
      getValue: () => ({
        startDate: subDays(new Date(), 6),
        endDate: new Date(),
        label: 'Last 7 Days'
      })
    },
    {
      label: 'Last 30 Days',
      getValue: () => ({
        startDate: subDays(new Date(), 29),
        endDate: new Date(),
        label: 'Last 30 Days'
      })
    }
  ];

  // Calculate performance score
  const calculatePerformanceScore = (stats: {
    completionRate: number;
    onTimeDeliveryRate: number;
    highPriorityCompletion: number;
    tasksCompleted: number;
  }): number => {
    const weights = {
      completionRate: 0.3,
      onTimeDelivery: 0.3,
      highPriority: 0.2,
      volume: 0.2
    };

    const volumeScore = Math.min(stats.tasksCompleted / 10, 1) * 100; // Normalize to 100
    
    return Number((
      (stats.completionRate * weights.completionRate) +
      (stats.onTimeDeliveryRate * weights.onTimeDelivery) +
      ((stats.highPriorityCompletion / Math.max(stats.tasksCompleted, 1)) * 100 * weights.highPriority) +
      (volumeScore * weights.volume)
    ).toFixed(1));
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    return format(date, 'MMM dd, yyyy');
  };

  // Get color based on performance score
  const getPerformanceColor = (score: number): string => {
    if (score >= 90) return theme.palette.success.main;
    if (score >= 70) return theme.palette.info.main;
    if (score >= 50) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Get status chip color
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'approved':
        return theme.palette.success.main;
      case 'pending':
        return theme.palette.warning.main;
      case 'rejected':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, tasks]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [employeesRes, tasksRes] = await Promise.all([
        axios.get('http://localhost:3000/api/users'),
        axios.get('http://localhost:3000/api/tasks'),
      ]);

      setEmployees(employeesRes.data.filter((u: User) => u.role === 'employee'));
      setTasks(tasksRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch data',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const filtered = tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      const matchesEmployees = filters.employees.length === 0 || 
        task.assignedTo.some(id => filters.employees.includes(id));
      const matchesDateRange = taskDate >= startOfDay(filters.dateRange.start) && 
        taskDate <= endOfDay(filters.dateRange.end);
      const matchesStatus = filters.taskStatus.includes(task.status);
      const matchesPriority = filters.priority.includes(task.priority);

      return matchesEmployees && matchesDateRange && matchesStatus && matchesPriority;
    });

    setFilteredTasks(filtered);
    calculateStats(filtered);
  };

  const calculateStats = (filteredTasks: Task[]) => {
    const completed = filteredTasks.filter(t => t.status === 'approved');
    const submitted = filteredTasks.filter(t => t.status === 'submitted');
    const pending = filteredTasks.filter(t => t.status === 'pending');
    const rejected = filteredTasks.filter(t => t.status === 'rejected');

    const avgTime = completed.length > 0
      ? completed.reduce((acc, task) => {
          const completionTime = new Date(task.updatedAt).getTime() - new Date(task.createdAt).getTime();
          return acc + (completionTime / (1000 * 60 * 60 * 24));
        }, 0) / completed.length
      : 0;

    const onTimeDelivery = completed.length > 0
      ? (completed.filter(task => {
          if (!task.deadline) return true;
          return new Date(task.updatedAt) <= new Date(task.deadline);
        }).length / completed.length) * 100
      : 0;

    // Update task statistics
    setTaskStats({
      total: filteredTasks.length,
      completed: completed.length,
      inProgress: submitted.length,
      pending: pending.length,
      rejected: rejected.length,
      averageCompletionTime: avgTime,
      onTimeDeliveryRate: onTimeDelivery,
      tasksByPriority: {
        high: filteredTasks.filter(t => t.priority === 'high').length,
        medium: filteredTasks.filter(t => t.priority === 'medium').length,
        low: filteredTasks.filter(t => t.priority === 'low').length
      },
      tasksByDate: {
        dates: [],
        counts: []
      }
    });

    // Update employee statistics
    const employeeData = employees.map(emp => {
      const empTasks = filteredTasks.filter(t => t.assignedTo.includes(emp.id));
      const empCompleted = empTasks.filter(t => t.status === 'approved');
      const empSubmitted = empTasks.filter(t => t.status === 'submitted');
      const empPending = empTasks.filter(t => t.status === 'pending');
      const empRejected = empTasks.filter(t => t.status === 'rejected');

      const completionRate = (empCompleted.length / Math.max(empTasks.length, 1)) * 100;
      const empAvgTime = empCompleted.length > 0
        ? empCompleted.reduce((acc, task) => {
            const completionTime = new Date(task.updatedAt).getTime() - new Date(task.createdAt).getTime();
            return acc + (completionTime / (1000 * 60 * 60 * 24));
          }, 0) / empCompleted.length
        : 0;

      return {
        userId: emp.id,
        username: emp.username,
        name: emp.username,
        tasksCompleted: empCompleted.length,
        tasksPending: empPending.length,
        tasksRejected: empRejected.length,
        completedTasks: empCompleted.length,
        inProgressTasks: empSubmitted.length,
        pendingTasks: empPending.length,
        completionRate,
        averageCompletionTime: empAvgTime,
        onTimeDeliveryRate: empCompleted.length > 0
          ? (empCompleted.filter(task => {
              if (!task.deadline) return true;
              return new Date(task.updatedAt) <= new Date(task.deadline);
            }).length / empCompleted.length) * 100
          : 0,
        highPriorityCompletion: empCompleted.filter(t => t.priority === 'high').length,
        performanceScore: calculatePerformanceScore({
          completionRate,
          onTimeDeliveryRate: empCompleted.length > 0
            ? (empCompleted.filter(task => {
                if (!task.deadline) return true;
                return new Date(task.updatedAt) <= new Date(task.deadline);
              }).length / empCompleted.length) * 100
            : 0,
          highPriorityCompletion: empCompleted.filter(t => t.priority === 'high').length,
          tasksCompleted: empCompleted.length
        }),
        taskHistory: {
          dates: [],
          completed: []
        }
      };
    });

    setEmployeeStats(employeeData);

    // Update dashboard stats
    setStats({
      totalTasks: filteredTasks.length,
      completedTasks: completed.length,
      onTimeDelivery,
      averageCompletionTime: avgTime,
      highPriorityCompleted: completed.filter(t => t.priority === 'high').length,
    });
  };

  const generateReport = async () => {
    try {
      setIsGenerating(true);

      // Create new jsPDF instance
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(20);
      doc.text('Task Management Report', 20, 20);
      doc.setFontSize(12);

      // Add date range
      doc.text(`Report Period: ${formatDate(filters.dateRange.start)} - ${formatDate(filters.dateRange.end)}`, 20, 30);

      // Add task statistics
      autoTable(doc, {
        head: [['Task Statistics', 'Count']],
        body: [
          ['Total Tasks', taskStats.total],
          ['Completed Tasks', taskStats.completed],
          ['In Progress Tasks', taskStats.inProgress],
          ['Pending Tasks', taskStats.pending]
        ],
        startY: 40,
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 5
        },
        headStyles: {
          fillColor: [33, 150, 243],
          textColor: [255, 255, 255]
        }
      });

      // Add priority distribution
      autoTable(doc, {
        head: [['Priority Distribution', 'Count']],
        body: [
          ['High Priority', taskStats.tasksByPriority.high],
          ['Medium Priority', taskStats.tasksByPriority.medium],
          ['Low Priority', taskStats.tasksByPriority.low]
        ],
        startY: doc.lastAutoTable.finalY + 10,
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 5
        },
        headStyles: {
          fillColor: [33, 150, 243],
          textColor: [255, 255, 255]
        }
      });

      // Add employee performance
      doc.addPage();
      doc.text('Employee Performance', 20, 20);

      autoTable(doc, {
        head: [['Employee', 'Completed', 'In Progress', 'Pending', 'Performance']],
        body: employeeStats.map(emp => [
          emp.name,
          emp.completedTasks,
          emp.inProgressTasks,
          emp.pendingTasks,
          `${emp.performanceScore}%`
        ]),
        startY: 30,
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 5
        },
        headStyles: {
          fillColor: [33, 150, 243],
          textColor: [255, 255, 255]
        }
      });

      // Add page numbers
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width - 30,
          doc.internal.pageSize.height - 10
        );
      }

      // Save the PDF
      const fileName = `task_report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`;
      doc.save(fileName);

      // Show success message
      await Swal.fire({
        title: 'Success!',
        text: 'Report generated successfully',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('Error generating report:', error);
      await Swal.fire({
        title: 'Error',
        text: 'Failed to generate report: ' + (error instanceof Error ? error.message : 'Unknown error'),
        icon: 'error'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle }: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }) => (
    <Card elevation={3}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ color, mr: 1 }}>{icon}</Box>
          <Typography color="textSecondary" variant="subtitle2">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" sx={{ color }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="textSecondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <GradientBackground>
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
        <Box sx={{ mb: { xs: 2, md: 4 } }}>
          <Typography variant="h4" gutterBottom>
            Reports & Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Generate detailed reports and analyze task performance metrics
          </Typography>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: { xs: 2, md: 3 }, mb: { xs: 2, md: 4 } }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Autocomplete
                multiple
                options={employees}
                getOptionLabel={(option) => option.username}
                value={employees.filter(emp => filters.employees.includes(emp.id))}
                onChange={(_, newValue) => {
                  setFilters({
                    ...filters,
                    employees: newValue.map(emp => emp.id)
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Filter by Employees"
                    placeholder="Select employees"
                    fullWidth
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.username}
                      {...getTagProps({ index })}
                      key={option.id}
                    />
                  ))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={filters.dateRange.start}
                  onChange={(newValue) => {
                    if (newValue) {
                      setFilters({
                        ...filters,
                        dateRange: {
                          ...filters.dateRange,
                          start: newValue
                        }
                      });
                    }
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={filters.dateRange.end}
                  onChange={(newValue) => {
                    if (newValue) {
                      setFilters({
                        ...filters,
                        dateRange: {
                          ...filters.dateRange,
                          end: newValue
                        }
                      });
                    }
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>

          <Box sx={{ 
            mt: 3, 
            display: 'flex', 
            gap: 1, 
            flexWrap: 'wrap',
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <Button
              variant="outlined"
              size={isMobile ? "large" : "small"}
              fullWidth={isMobile}
              onClick={() => {
                setFilters({
                  ...filters,
                  dateRange: {
                    start: new Date(),
                    end: new Date()
                  }
                });
              }}
            >
              Today
            </Button>
            <Button
              variant="outlined"
              size={isMobile ? "large" : "small"}
              fullWidth={isMobile}
              onClick={() => {
                setFilters({
                  ...filters,
                  dateRange: {
                    start: subDays(new Date(), 7),
                    end: new Date()
                  }
                });
              }}
            >
              Last 7 Days
            </Button>
            <Button
              variant="outlined"
              size={isMobile ? "large" : "small"}
              fullWidth={isMobile}
              onClick={() => {
                setFilters({
                  ...filters,
                  dateRange: {
                    start: subDays(new Date(), 30),
                    end: new Date()
                  }
                });
              }}
            >
              Last 30 Days
            </Button>
          </Box>
        </Paper>

        {/* Statistics Cards */}
        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: { xs: 2, md: 4 } }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              title="Total Tasks"
              value={stats.totalTasks}
              icon={<Assignment sx={{ color: 'white' }} />}
              color="#2196f3"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              title="Completed"
              value={stats.completedTasks}
              icon={<CheckCircleIcon sx={{ color: 'white' }} />}
              color="#4caf50"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              title="On-Time Rate"
              value={`${stats.onTimeDelivery.toFixed(1)}%`}
              icon={<Timeline sx={{ color: 'white' }} />}
              color="#ff9800"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              title="Avg. Time"
              value={`${stats.averageCompletionTime.toFixed(1)} days`}
              icon={<TrendingUp sx={{ color: 'white' }} />}
              color="#f44336"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              title="High Priority"
              value={stats.highPriorityCompleted}
              icon={<Assessment sx={{ color: 'white' }} />}
              color="#9c27b0"
            />
          </Grid>
        </Grid>

        {/* Employee Performance */}
        <Paper sx={{ p: { xs: 2, md: 3 } }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'stretch', sm: 'center' },
            mb: 3,
            gap: 2
          }}>
            <Typography variant="h5">Employee Performance</Typography>
            <Button
              variant="contained"
              startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <PdfIcon />}
              onClick={generateReport}
              disabled={isGenerating}
              fullWidth={isMobile}
            >
              {isGenerating ? 'Generating...' : 'Download Report'}
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell align="right">Tasks Completed</TableCell>
                  {!isMobile && (
                    <>
                      <TableCell align="right">Tasks Rejected</TableCell>
                      <TableCell align="right">Avg. Completion Time</TableCell>
                    </>
                  )}
                  <TableCell align="right">On-Time Delivery</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees
                  .filter(emp => filters.employees.length === 0 || filters.employees.includes(emp.id))
                  .map(emp => {
                    const empTasks = filteredTasks.filter(t => t.assignedTo.includes(emp.id));
                    const completed = empTasks.filter(t => t.status === 'approved');
                    const completionRate = (completed.length / Math.max(empTasks.length, 1)) * 100;

                    return (
                      <TableRow key={emp.id}>
                        <TableCell>{emp.username}</TableCell>
                        <TableCell align="right">{completed.length} / {empTasks.length}</TableCell>
                        {!isMobile && (
                          <>
                            <TableCell align="right">{empTasks.filter(t => t.status === 'rejected').length}</TableCell>
                            <TableCell align="right">{`${empTasks.length > 0 ? (completed.length / empTasks.length).toFixed(1) : 'N/A'}`}</TableCell>
                          </>
                        )}
                        <TableCell align="right">{`${completionRate.toFixed(1)}%`}</TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Preview Dialog */}
        <Dialog
          open={showPreview}
          onClose={() => setShowPreview(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Report Preview</DialogTitle>
          <DialogContent>
            <Typography gutterBottom>
              The report has been downloaded with the following sections:
            </Typography>
            <Box component="ul" sx={{ mt: 1 }}>
              <li>Task Statistics Overview</li>
              <li>Employee Performance Metrics</li>
              <li>Time Analysis</li>
              <li>Priority Distribution</li>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPreview(false)}>Close</Button>
            <Button
              variant="contained"
              startIcon={<PdfIcon />}
              onClick={generateReport}
            >
              Download Again
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </GradientBackground>
  );
};

export default Reports; 