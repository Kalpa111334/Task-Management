"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const storage_1 = require("./services/storage");
const uuid_1 = require("uuid");
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
    }
});
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path_1.default.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = (0, multer_1.default)({ storage });
// Initialize data directory
const dataDir = path_1.default.join(__dirname, '../data');
const uploadsDir = path_1.default.join(__dirname, '../uploads');
if (!fs_1.default.existsSync(dataDir)) {
    fs_1.default.mkdirSync(dataDir, { recursive: true });
}
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
// Initialize users if they don't exist
const usersFile = path_1.default.join(dataDir, 'users.json');
if (!fs_1.default.existsSync(usersFile)) {
    const initialUsers = [
        {
            id: (0, uuid_1.v4)(),
            username: 'admin',
            password: 'admin123',
            role: 'admin',
            name: 'Admin User',
            createdAt: new Date()
        },
        {
            id: (0, uuid_1.v4)(),
            username: 'employee1',
            password: 'employee123',
            role: 'employee',
            name: 'Employee One',
            createdAt: new Date()
        }
    ];
    fs_1.default.writeFileSync(usersFile, JSON.stringify(initialUsers, null, 2));
}
// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their room`);
    });
    socket.on('chat-message', (message) => {
        storage_1.storageService.addMessage(message);
        io.to(message.receiverId).emit('chat-message', message);
    });
    socket.on('task-update', (task) => {
        storage_1.storageService.updateTask(task.id, task);
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
        const users = JSON.parse(fs_1.default.readFileSync(usersFile, 'utf-8'));
        // Find user with matching credentials and role
        const user = users.find((u) => u.username === username &&
            u.password === password &&
            u.role === role);
        if (user) {
            // Remove password from response
            const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
            console.log('Login successful:', { username, role });
            res.json({ success: true, user: userWithoutPassword });
        }
        else {
            console.log('Login failed:', { username, role });
            res.status(401).json({
                success: false,
                message: 'Invalid username, password, or role'
            });
        }
    }
    catch (error) {
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
        console.log('Registration request received:', Object.assign(Object.assign({}, req.body), { password: '[REDACTED]' }));
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
        if (!fs_1.default.existsSync(dataDir)) {
            fs_1.default.mkdirSync(dataDir, { recursive: true });
        }
        // Initialize users file if it doesn't exist
        if (!fs_1.default.existsSync(usersFile)) {
            fs_1.default.writeFileSync(usersFile, JSON.stringify([], null, 2));
        }
        // Read existing users
        const users = JSON.parse(fs_1.default.readFileSync(usersFile, 'utf-8'));
        // Check if username already exists
        if (users.some((u) => u.username === username)) {
            console.log('Registration failed: Username already exists');
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }
        // Create new user
        const newUser = {
            id: (0, uuid_1.v4)(),
            username,
            password,
            name,
            role,
            createdAt: new Date()
        };
        // Add user to storage
        users.push(newUser);
        fs_1.default.writeFileSync(usersFile, JSON.stringify(users, null, 2));
        console.log('Registration successful:', Object.assign(Object.assign({}, newUser), { password: '[REDACTED]' }));
        // Return success without password
        const { password: _ } = newUser, userWithoutPassword = __rest(newUser, ["password"]);
        res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: userWithoutPassword
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during registration'
        });
    }
});
// Users
app.get('/api/users', (req, res) => {
    const users = storage_1.storageService.getUsers();
    const usersWithoutPasswords = users.map((_a) => {
        var { password } = _a, user = __rest(_a, ["password"]);
        return user;
    });
    res.json(usersWithoutPasswords);
});
app.post('/api/users', (req, res) => {
    const user = Object.assign(Object.assign({}, req.body), { id: (0, uuid_1.v4)(), createdAt: new Date() });
    storage_1.storageService.addUser(user);
    res.json(user);
});
// Tasks
app.get('/api/tasks', (req, res) => {
    const tasks = storage_1.storageService.getTasks();
    res.json(tasks);
});
app.get('/api/tasks/:taskId', (req, res) => {
    try {
        const { taskId } = req.params;
        const tasks = storage_1.storageService.getTasks();
        const task = tasks.find(t => t.id === taskId);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }
        res.json(task);
    }
    catch (error) {
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
        const users = JSON.parse(fs_1.default.readFileSync(usersFile, 'utf-8'));
        const user = users.find((u) => u.id === userId);
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
    }
    catch (error) {
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
        const hasAllSettings = requiredSettings.every(setting => typeof newSettings[setting] === 'boolean');
        if (!hasAllSettings) {
            return res.status(400).json({
                success: false,
                message: 'Invalid settings format'
            });
        }
        // Read current users
        const users = JSON.parse(fs_1.default.readFileSync(usersFile, 'utf-8'));
        const userIndex = users.findIndex((u) => u.id === userId);
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        // Update user settings
        users[userIndex] = Object.assign(Object.assign({}, users[userIndex]), { settings: newSettings });
        // Save updated users
        fs_1.default.writeFileSync(usersFile, JSON.stringify(users, null, 2));
        res.json({
            success: true,
            message: 'Settings updated successfully',
            settings: newSettings
        });
    }
    catch (error) {
        console.error('Error updating user settings:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
app.post('/api/tasks', (req, res) => {
    const task = Object.assign(Object.assign({}, req.body), { id: (0, uuid_1.v4)(), status: 'pending', createdAt: new Date(), updatedAt: new Date() });
    storage_1.storageService.addTask(task);
    // Notify assigned employees
    task.assignedTo.forEach(userId => {
        io.to(userId).emit('task-update', task);
    });
    res.json(task);
});
app.put('/api/tasks/:taskId', (req, res) => {
    try {
        const { taskId } = req.params;
        const tasks = storage_1.storageService.getTasks();
        const existingTask = tasks.find(t => t.id === taskId);
        if (!existingTask) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }
        const updatedTask = Object.assign(Object.assign(Object.assign({}, existingTask), req.body), { id: taskId, updatedAt: new Date() });
        storage_1.storageService.updateTask(taskId, updatedTask);
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
    }
    catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update task'
        });
    }
});
// Messages
app.get('/api/messages', (req, res) => {
    const messages = storage_1.storageService.getMessages();
    res.json(messages);
});
app.post('/api/messages', (req, res) => {
    try {
        const message = Object.assign(Object.assign({}, req.body), { timestamp: new Date() });
        storage_1.storageService.addMessage(message);
        res.json(message);
    }
    catch (error) {
        console.error('Error adding message:', error);
        res.status(500).json({ message: 'Failed to send message' });
    }
});
// Groups
app.get('/api/groups', (req, res) => {
    const groups = storage_1.storageService.getGroups();
    res.json(groups);
});
app.post('/api/groups', (req, res) => {
    const group = Object.assign(Object.assign({}, req.body), { id: (0, uuid_1.v4)(), createdAt: new Date() });
    storage_1.storageService.addGroup(group);
    res.json(group);
});
// File upload for task proof
app.post('/api/tasks/:taskId/proof', upload.single('proof'), (req, res) => {
    const { taskId } = req.params;
    const file = req.file;
    if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    const task = storage_1.storageService.getTasks().find(t => t.id === taskId);
    if (!task) {
        return res.status(404).json({ message: 'Task not found' });
    }
    const proofImage = `/uploads/${file.filename}`;
    const updatedTask = Object.assign(Object.assign({}, task), { proofImage });
    storage_1.storageService.updateTask(taskId, updatedTask);
    res.json({ proofImage });
});
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
