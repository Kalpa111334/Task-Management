import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { storageService } from './services/storage';
import { User, Task, ChatMessage, Group } from './types';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Initialize data directory
const dataDir = path.join(__dirname, '../data');
const uploadsDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize users if they don't exist
const usersFile = path.join(dataDir, 'users.json');
if (!fs.existsSync(usersFile)) {
  const initialUsers = [
    {
      id: uuidv4(),
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      name: 'Admin User',
      createdAt: new Date()
    },
    {
      id: uuidv4(),
      username: 'employee1',
      password: 'employee123',
      role: 'employee',
      name: 'Employee One',
      createdAt: new Date()
    }
  ];
  fs.writeFileSync(usersFile, JSON.stringify(initialUsers, null, 2));
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId: string) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('chat-message', (message: ChatMessage) => {
    storageService.addMessage(message);
    io.to(message.receiverId).emit('chat-message', message);
  });

  socket.on('task-update', (task: Task) => {
    storageService.updateTask(task.id, task);
    // Emit to all assigned users
    task.assignedTo.forEach(userId => {
      io.to(userId).emit('task-update', task);
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// API Routes
// Auth
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Validate required fields
    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, and role are required'
      });
    }

    // Read users file
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
    
    // Find user with matching credentials and role
    const user = users.find((u: any) => 
      u.username === username && 
      u.password === password && 
      u.role === role
    );
    
    if (user) {
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      console.log('Login successful:', { username, role });
      res.json({ success: true, user: userWithoutPassword });
    } else {
      console.log('Login failed:', { username, role });
      res.status(401).json({ 
        success: false, 
        message: 'Invalid username, password, or role' 
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Registration endpoint
app.post('/api/auth/register', (req, res) => {
  try {
    console.log('Registration request received:', { ...req.body, password: '[REDACTED]' });
    
    const { username, password, name, role } = req.body;

    // Validate required fields
    if (!username || !password || !name || !role) {
      console.log('Registration failed: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate role
    if (role !== 'admin' && role !== 'employee') {
      console.log('Registration failed: Invalid role');
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Initialize users file if it doesn't exist
    if (!fs.existsSync(usersFile)) {
      fs.writeFileSync(usersFile, JSON.stringify([], null, 2));
    }

    // Read existing users
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));

    // Check if username already exists
    if (users.some((u: User) => u.username === username)) {
      console.log('Registration failed: Username already exists');
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Create new user
    const newUser: User = {
      id: uuidv4(),
      username,
      password,
      name,
      role,
      createdAt: new Date()
    };

    // Add user to storage
    users.push(newUser);
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

    console.log('Registration successful:', { ...newUser, password: '[REDACTED]' });

    // Return success without password
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
});

// Users
app.get('/api/users', (req, res) => {
  const users = storageService.getUsers();
  const usersWithoutPasswords = users.map(({ password, ...user }) => user);
  res.json(usersWithoutPasswords);
});

app.post('/api/users', (req, res) => {
  const user: User = {
    ...req.body,
    id: uuidv4(),
    createdAt: new Date()
  };
  storageService.addUser(user);
  res.json(user);
});

// Tasks
app.get('/api/tasks', (req, res) => {
  const tasks = storageService.getTasks();
  res.json(tasks);
});

app.get('/api/tasks/:taskId', (req, res) => {
  try {
    const { taskId } = req.params;
    const tasks = storageService.getTasks();
    const task = tasks.find(t => t.id === taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// User Settings
app.get('/api/users/:userId/settings', (req, res) => {
  try {
    const { userId } = req.params;
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
    const user = users.find((u: User) => u.id === userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return user settings or default settings if not set
    const settings = user.settings || {
      emailNotifications: true,
      taskReminders: true,
      chatNotifications: true,
      darkMode: false
    };

    res.json(settings);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.put('/api/users/:userId/settings', (req, res) => {
  try {
    const { userId } = req.params;
    const newSettings = req.body;
    
    // Validate settings object
    const requiredSettings = ['emailNotifications', 'taskReminders', 'chatNotifications', 'darkMode'];
    const hasAllSettings = requiredSettings.every(setting => 
      typeof newSettings[setting] === 'boolean'
    );

    if (!hasAllSettings) {
      return res.status(400).json({
        success: false,
        message: 'Invalid settings format'
      });
    }

    // Read current users
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
    const userIndex = users.findIndex((u: User) => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user settings
    users[userIndex] = {
      ...users[userIndex],
      settings: newSettings
    };

    // Save updated users
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: newSettings
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.post('/api/tasks', (req, res) => {
  const task: Task = {
    ...req.body,
    id: uuidv4(),
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  storageService.addTask(task);
  
  // Notify assigned employees
  task.assignedTo.forEach(userId => {
    io.to(userId).emit('task-update', task);
  });
  
  res.json(task);
});

app.put('/api/tasks/:taskId', (req, res) => {
  try {
    const { taskId } = req.params;
    const tasks = storageService.getTasks();
    const existingTask = tasks.find(t => t.id === taskId);

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const updatedTask: Task = {
      ...existingTask,
      ...req.body,
      id: taskId, // Ensure ID doesn't change
      updatedAt: new Date()
    };

    storageService.updateTask(taskId, updatedTask);

    // Notify relevant users about the task update
    const notifyUsers = new Set([
      updatedTask.createdBy,
      ...updatedTask.assignedTo
    ]);

    notifyUsers.forEach(userId => {
      io.to(userId).emit('task-update', updatedTask);
    });

    res.json({
      success: true,
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task'
    });
  }
});

// Messages
app.get('/api/messages', (req, res) => {
  const messages = storageService.getMessages();
  res.json(messages);
});

app.post('/api/messages', (req, res) => {
  try {
    const message: ChatMessage = {
      ...req.body,
      timestamp: new Date()
    };
    storageService.addMessage(message);
    res.json(message);
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// Groups
app.get('/api/groups', (req, res) => {
  const groups = storageService.getGroups();
  res.json(groups);
});

app.post('/api/groups', (req, res) => {
  const group: Group = {
    ...req.body,
    id: uuidv4(),
    createdAt: new Date()
  };
  storageService.addGroup(group);
  res.json(group);
});

// File upload for task proof
app.post('/api/tasks/:taskId/proof', upload.single('proof'), (req, res) => {
  const { taskId } = req.params;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const task = storageService.getTasks().find(t => t.id === taskId);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const proofImage = `/uploads/${file.filename}`;
  const updatedTask = { ...task, proofImage };
  storageService.updateTask(taskId, updatedTask);
  res.json({ proofImage });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 