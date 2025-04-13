"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_DIR = path_1.default.join(__dirname, '../../data');
// Ensure data directory exists
if (!fs_1.default.existsSync(DATA_DIR)) {
    fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
}
// File paths
const FILES = {
    USERS: path_1.default.join(DATA_DIR, 'users.json'),
    TASKS: path_1.default.join(DATA_DIR, 'tasks.json'),
    MESSAGES: path_1.default.join(DATA_DIR, 'messages.json'),
    GROUPS: path_1.default.join(DATA_DIR, 'groups.json'),
};
// Initialize files if they don't exist
Object.values(FILES).forEach(file => {
    if (!fs_1.default.existsSync(file)) {
        fs_1.default.writeFileSync(file, '[]');
    }
});
class StorageService {
    readFile(file) {
        try {
            const data = fs_1.default.readFileSync(file, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            return [];
        }
    }
    writeFile(file, data) {
        fs_1.default.writeFileSync(file, JSON.stringify(data, null, 2));
    }
    // Users
    getUsers() {
        return this.readFile(FILES.USERS);
    }
    addUser(user) {
        const users = this.getUsers();
        users.push(user);
        this.writeFile(FILES.USERS, users);
    }
    updateUser(userId, updates) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            users[index] = Object.assign(Object.assign({}, users[index]), updates);
            this.writeFile(FILES.USERS, users);
        }
    }
    deleteUser(userId) {
        const users = this.getUsers();
        const filtered = users.filter(u => u.id !== userId);
        this.writeFile(FILES.USERS, filtered);
    }
    // Tasks
    getTasks() {
        return this.readFile(FILES.TASKS);
    }
    addTask(task) {
        const tasks = this.getTasks();
        tasks.push(task);
        this.writeFile(FILES.TASKS, tasks);
    }
    updateTask(taskId, updatedTask) {
        const tasks = this.getTasks();
        const index = tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            tasks[index] = updatedTask;
            this.writeFile(FILES.TASKS, tasks);
        }
    }
    deleteTask(taskId) {
        const tasks = this.getTasks();
        const filtered = tasks.filter(t => t.id !== taskId);
        this.writeFile(FILES.TASKS, filtered);
    }
    // Messages
    getMessages() {
        return this.readFile(FILES.MESSAGES);
    }
    addMessage(message) {
        const messages = this.getMessages();
        messages.push(message);
        this.writeFile(FILES.MESSAGES, messages);
    }
    // Groups
    getGroups() {
        return this.readFile(FILES.GROUPS);
    }
    addGroup(group) {
        const groups = this.getGroups();
        groups.push(group);
        this.writeFile(FILES.GROUPS, groups);
    }
    updateGroup(groupId, updates) {
        const groups = this.getGroups();
        const index = groups.findIndex(g => g.id === groupId);
        if (index !== -1) {
            groups[index] = Object.assign(Object.assign({}, groups[index]), updates);
            this.writeFile(FILES.GROUPS, groups);
        }
    }
    deleteGroup(groupId) {
        const groups = this.getGroups();
        const filtered = groups.filter(g => g.id !== groupId);
        this.writeFile(FILES.GROUPS, filtered);
    }
}
exports.storageService = new StorageService();
